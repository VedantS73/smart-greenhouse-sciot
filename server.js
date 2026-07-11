const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const fs = require('fs');
const socketIo = require('socket.io');
const mqtt = require('mqtt');
const cors = require('cors');
require('dotenv').config();

const {
  SENSOR_FIELDS,
  STALE_THRESHOLD_SEC,
  validateSensorPayload,
  createEmptySensorMeta
} = require('./shared/sensorLimits');

const {
  DEFAULT_RULES,
  validateRules,
  normalizeRules
} = require('./shared/rulesDefaults');
const {
  DEFAULT_PORTS,
  validatePorts,
  normalizePorts
} = require('./shared/portsDefaults');

const RULES_FILE = path.join(__dirname, 'config', 'rules.json');
const PORTS_FILE = path.join(__dirname, 'config', 'ports.json');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'development' ? '*' : false,
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const BROKER = process.env.MQTT_BROKER || 'localhost';
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const COMMAND_TIMEOUT_MS = 1500;
const HISTORY_MAX = 60;

const mqttClient = mqtt.connect(`mqtt://${BROKER}:${MQTT_PORT}`);

let sensorData = {};
let sensorMeta = createEmptySensorMeta();
let lastSeen = {};
let actuatorState = { led: false, buzzer: false, relay1: false, relay2: false, relay3: false };
let plannerData = {
  context: {},
  goal: {},
  actions: {},
  auto_mode: true,
  action_mismatch: {}
};
let serviceHealth = {
  publisher: { online: false, lastHeartbeat: null },
  actuator: { online: false, lastHeartbeat: null },
  planner: { online: false, lastHeartbeat: null },
  security: { online: false, lastHeartbeat: null }
};
let eventLog = [];
let sensorHistory = {
  temperature: [],
  humidity: [],
  light: []
};

const pendingCommands = new Map();
let commandCounter = 0;
let rulesConfig = { ...DEFAULT_RULES };
let portsConfig = { ...DEFAULT_PORTS };

function loadRulesFromDisk() {
  try {
    if (fs.existsSync(RULES_FILE)) {
      const raw = JSON.parse(fs.readFileSync(RULES_FILE, 'utf8'));
      const result = validateRules(raw);
      if (result.valid) {
        rulesConfig = result.rules;
        return rulesConfig;
      }
      console.warn('Invalid rules.json on disk, using defaults:', result.error);
    }
  } catch (err) {
    console.warn('Failed to load rules.json, using defaults:', err.message);
  }

  rulesConfig = normalizeRules(DEFAULT_RULES);
  saveRulesToDisk(rulesConfig);
  return rulesConfig;
}

function saveRulesToDisk(rules) {
  const dir = path.dirname(RULES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2) + '\n');
}

function publishRulesConfig(rules) {
  mqttClient.publish('greenhouse/config', JSON.stringify(rules));
}

function applyRulesUpdate(rules, socket) {
  const result = validateRules(rules);
  if (!result.valid) {
    if (socket) {
      socket.emit('rules_nack', { reason: result.error });
    }
    return false;
  }

  rulesConfig = result.rules;
  saveRulesToDisk(rulesConfig);
  publishRulesConfig(rulesConfig);
  io.emit('rules_update', rulesConfig);

  if (socket) {
    socket.emit('rules_ack', { rules: rulesConfig });
  }

  return true;
}

loadRulesFromDisk();

function loadPortsFromDisk() {
  try {
    if (fs.existsSync(PORTS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(PORTS_FILE, 'utf8'));
      const result = validatePorts(raw);
      if (result.valid) {
        portsConfig = result.ports;
        return portsConfig;
      }
      console.warn('Invalid ports.json on disk, using defaults:', result.error);
    }
  } catch (err) {
    console.warn('Failed to load ports.json, using defaults:', err.message);
  }

  portsConfig = normalizePorts(DEFAULT_PORTS);
  savePortsToDisk(portsConfig);
  return portsConfig;
}

function savePortsToDisk(ports) {
  const dir = path.dirname(PORTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PORTS_FILE, JSON.stringify(ports, null, 2) + '\n');
}

function publishPortsConfig(ports) {
  mqttClient.publish('greenhouse/ports_config', JSON.stringify(ports));
}

function applyPortsUpdate(ports, socket) {
  const result = validatePorts(ports);
  if (!result.valid) {
    if (socket) {
      socket.emit('ports_nack', { reason: result.error });
    }
    return false;
  }

  portsConfig = result.ports;
  savePortsToDisk(portsConfig);
  publishPortsConfig(portsConfig);
  io.emit('ports_update', portsConfig);

  if (socket) {
    socket.emit('ports_ack', { ports: portsConfig });
  }

  return true;
}

loadPortsFromDisk();

function nowSec() {
  return Date.now() / 1000;
}

function buildSensorUpdate() {
  return {
    readings: { ...sensorData },
    meta: { ...sensorMeta }
  };
}

function pushHistory(field, value) {
  if (!sensorHistory[field]) {
    return;
  }

  sensorHistory[field].push(value);
  if (sensorHistory[field].length > HISTORY_MAX) {
    sensorHistory[field].shift();
  }
}

function computeActionMismatch() {
  const actions = plannerData.actions || {};
  const mismatch = {};

  //if ('led' in actions && Boolean(actions.led) !== Boolean(actuatorState.led)) {
  //  mismatch.led = true;
  //}
  if ('relay1' in actions && Boolean(actions.relay1) !== Boolean(actuatorState.relay1)) {
    mismatch.relay1 = true;
  }
  if ('relay2' in actions && Boolean(actions.relay2) !== Boolean(actuatorState.relay2)) {
    mismatch.relay2 = true;
  }
  if ('relay3' in actions && Boolean(actions.relay3) !== Boolean(actuatorState.relay3)) {
    mismatch.relay3 = true;
  }

  return mismatch;
}

function emitPlannerUpdate() {
  const payload = {
    ...plannerData,
    action_mismatch: computeActionMismatch()
  };
  plannerData.action_mismatch = payload.action_mismatch;
  io.emit('planner_update', payload);
}

function processSensorPayload(rawPayload) {
  const { valid, invalid } = validateSensorPayload(rawPayload);
  const timestamp = nowSec();

  for (const field of SENSOR_FIELDS) {
    if (field in valid) {
      sensorData[field] = valid[field];
      sensorMeta[field] = { stale: false, invalid: false };
      lastSeen[field] = timestamp;

      if (field === 'temperature' || field === 'humidity' || field === 'light') {
        pushHistory(field, valid[field]);
      }
    } else if (field in invalid) {
      sensorMeta[field] = { stale: true, invalid: true };
    }
  }

  io.emit('sensor_update', buildSensorUpdate());
  io.emit('history_update', sensorHistory);
}

function checkStaleSensors() {
  const timestamp = nowSec();
  let changed = false;

  for (const field of SENSOR_FIELDS) {
    const seen = lastSeen[field];
    const isStale = !seen || (timestamp - seen) > STALE_THRESHOLD_SEC;

    if (sensorMeta[field].stale !== isStale) {
      sensorMeta[field] = {
        ...sensorMeta[field],
        stale: isStale
      };
      changed = true;
    }

    if (isStale && field in sensorData) {
      delete sensorData[field];
      changed = true;
    }
  }

  if (changed) {
    io.emit('sensor_update', buildSensorUpdate());
  }
}

function resolvePendingCommands() {
  if (pendingCommands.size === 0) {
    return;
  }

  const toDelete = [];
  const statusCommandId = actuatorState.command_id;

  for (const [id, cmd] of pendingCommands.entries()) {
    const actual = actuatorState[cmd.device];
    const commandConfirmed = statusCommandId === cmd.commandId;
    const stateMatches = actual === cmd.expectedState;

    if (commandConfirmed && stateMatches) {
      io.to(cmd.socketId).emit('actuator_ack', {
        commandId: id,
        device: cmd.device,
        state: cmd.expectedState
      });
      toDelete.push(id);
      continue;
    }

    if (Date.now() - cmd.createdAt > COMMAND_TIMEOUT_MS) {
      io.to(cmd.socketId).emit('actuator_nack', {
        commandId: id,
        device: cmd.device,
        reason: actual === undefined ? 'timeout' : 'hardware_mismatch',
        expected: cmd.expectedState,
        actual
      });
      toDelete.push(id);
    }
  }

  for (const id of toDelete) {
    pendingCommands.delete(id);
  }
}

function publishActuatorCommand(device, state, socketId) {
  for (const [id, cmd] of pendingCommands.entries()) {
    if (cmd.device === device) {
      pendingCommands.delete(id);
    }
  }

  const commandId = `cmd-${++commandCounter}-${Date.now()}`;
  const payload = { [device]: state, command_id: commandId };

  mqttClient.publish('greenhouse/actions', JSON.stringify(payload), { qos: 1 });

  pendingCommands.set(commandId, {
    commandId,
    device,
    expectedState: state,
    socketId,
    createdAt: Date.now()
  });

  actuatorState = { ...actuatorState, [device]: state };
  const clientState = { ...actuatorState };
  delete clientState.command_id;
  io.emit('actuator_update', clientState);

  setImmediate(resolvePendingCommands);

  return commandId;
}

function getInitialData() {
  return {
    sensors: buildSensorUpdate(),
    actuators: actuatorState,
    planner: {
      ...plannerData,
      action_mismatch: computeActionMismatch()
    },
    health: serviceHealth,
    history: sensorHistory,
    events: eventLog,
    rules: rulesConfig,
    ports: portsConfig
  };
}

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');

  mqttClient.subscribe('greenhouse/sensors');
  mqttClient.subscribe('greenhouse/actuator_status');
  mqttClient.subscribe('greenhouse/status');
  mqttClient.subscribe('greenhouse/events');
  mqttClient.subscribe('greenhouse/planner');

  publishRulesConfig(rulesConfig);
  publishPortsConfig(portsConfig);
});

mqttClient.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    if (topic === 'greenhouse/sensors') {
      processSensorPayload(payload);
      return;
    }

    if (topic === 'greenhouse/actuator_status') {
      actuatorState = payload;
      const clientState = { ...payload };
      delete clientState.command_id;
      io.emit('actuator_update', clientState);
      resolvePendingCommands();
      emitPlannerUpdate();
      return;
    }

    if (topic === 'greenhouse/status') {
      const service = payload.service;
      if (serviceHealth[service]) {
        serviceHealth[service].online = true;
        serviceHealth[service].lastHeartbeat = payload.timestamp;
      }
      io.emit('health_update', serviceHealth);
      return;
    }

    if (topic === 'greenhouse/events') {
      const entry = typeof payload === 'string'
        ? { message: payload, timestamp: nowSec() }
        : {
            message: payload.message || JSON.stringify(payload),
            timestamp: payload.timestamp || nowSec()
          };

      eventLog.unshift(entry);
      if (eventLog.length > 50) {
        eventLog.pop();
      }
      io.emit('event_log_update', eventLog);
      return;
    }

    if (topic === 'greenhouse/planner') {
      plannerData = {
        ...plannerData,
        ...payload,
        action_mismatch: {}
      };
      emitPlannerUpdate();
    }
  } catch (err) {
    console.error('MQTT parse error:', err);
  }
});

setInterval(() => {
  const timestamp = nowSec();

  Object.keys(serviceHealth).forEach((service) => {
    const last = serviceHealth[service].lastHeartbeat;
    serviceHealth[service].online = Boolean(last && (timestamp - last) < 20);
  });

  io.emit('health_update', serviceHealth);
  checkStaleSensors();
}, 2000);

setInterval(resolvePendingCommands, 100);

app.get('/api/dashboard', (req, res) => {
  res.json(getInitialData());
});

app.get('/api/sensors', (req, res) => {
  res.json(buildSensorUpdate());
});

app.get('/api/actuators', (req, res) => {
  res.json(actuatorState);
});

app.get('/api/health', (req, res) => {
  res.json(serviceHealth);
});

app.get('/api/history', (req, res) => {
  res.json(sensorHistory);
});

app.get('/api/rules', (req, res) => {
  res.json(rulesConfig);
});

app.get('/api/ports', (req, res) => {
  res.json(portsConfig);
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.emit('initial_data', getInitialData());

  function handleToggle(device, state) {
    if (plannerData.auto_mode) {
      socket.emit('actuator_nack', {
        device,
        reason: 'auto_mode_active'
      });
      return;
    }

    publishActuatorCommand(device, state, socket.id);
  }

  socket.on('toggle_led', (state) => handleToggle('led', state));
  socket.on('toggle_relay1', (state) => handleToggle('relay1', state));
  socket.on('toggle_relay2', (state) => handleToggle('relay2', state));
  socket.on('toggle_relay3', (state) => handleToggle('relay3', state));
  socket.on('toggle_buzzer', (state) => handleToggle('buzzer', state));

  socket.on('set_mode', (mode) => {
    const target = mode === 'auto' ? 'AUTO' : 'MANUAL';
    plannerData.auto_mode = target === 'AUTO';
    emitPlannerUpdate();
    mqttClient.publish(
      'greenhouse/mode',
      JSON.stringify({ mode: target })
    );
  });

  socket.on('update_rules', (rules) => {
    applyRulesUpdate(rules, socket);
  });

  socket.on('update_ports', (ports) => {
    applyPortsUpdate(ports, socket);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const buildPath = path.join(__dirname, 'frontend', 'build');
app.use(express.static(buildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Dashboard build not found. Run: npm run build');
    }
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

function getNetworkAddresses() {
  const addresses = [];
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

server.listen(PORT, HOST, () => {
  console.log(`\nSmart Greenhouse Server running on port ${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  for (const address of getNetworkAddresses()) {
    console.log(`   Network: http://${address}:${PORT}`);
  }
  console.log('WebSocket ready for real-time updates\n');
});
