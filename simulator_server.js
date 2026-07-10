const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const socketIo = require('socket.io');
const mqtt = require('mqtt');
const cors = require('cors');
require('dotenv').config();

const {
  SENSOR_FIELDS,
  validateSensorPayload
} = require('./shared/sensorLimits');

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
const HARDWARE_TOPIC = process.env.GREENHOUSE_HARDWARE_TOPIC || 'greenhouse/sensors/hardware';
const EFFECTIVE_TOPIC = process.env.GREENHOUSE_SENSOR_TOPIC || 'greenhouse/sensors';
const OVERRIDE_TOPIC = process.env.GREENHOUSE_OVERRIDE_TOPIC || 'greenhouse/sensors/override';

const mqttClient = mqtt.connect(`mqtt://${BROKER}:${MQTT_PORT}`);

let hardwareReadings = {};
let effectiveReadings = {};
let overrideState = {
  overrides: {},
  enabled: {}
};

function publishOverrideState() {
  mqttClient.publish(OVERRIDE_TOPIC, JSON.stringify(overrideState));
  io.emit('override_state', overrideState);
}

function buildInitialData() {
  return {
    hardware: hardwareReadings,
    effective: effectiveReadings,
    overrideState
  };
}

mqttClient.on('connect', () => {
  console.log('Simulator connected to MQTT broker');
  mqttClient.subscribe(HARDWARE_TOPIC);
  mqttClient.subscribe(EFFECTIVE_TOPIC);
  publishOverrideState();
});

mqttClient.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    if (topic === HARDWARE_TOPIC) {
      const { valid } = validateSensorPayload(payload);
      hardwareReadings = { ...valid, timestamp: payload.timestamp };
      io.emit('hardware_update', hardwareReadings);
      return;
    }

    if (topic === EFFECTIVE_TOPIC) {
      const { valid } = validateSensorPayload(payload);
      effectiveReadings = { ...valid, timestamp: payload.timestamp };
      io.emit('effective_update', effectiveReadings);
    }
  } catch (err) {
    console.error('Simulator MQTT parse error:', err);
  }
});

io.on('connection', (socket) => {
  console.log(`Simulator client connected: ${socket.id}`);
  socket.emit('initial_data', buildInitialData());

  socket.on('set_override', ({ field, value, enabled }) => {
    if (!SENSOR_FIELDS.includes(field)) {
      socket.emit('override_nack', { reason: 'invalid_field', field });
      return;
    }

    const testPayload = { [field]: value };
    const { valid, invalid } = validateSensorPayload(testPayload);
    if (invalid[field]) {
      socket.emit('override_nack', { reason: 'invalid_value', field });
      return;
    }

    overrideState.overrides[field] = valid[field];
    overrideState.enabled[field] = Boolean(enabled);
    publishOverrideState();
    socket.emit('override_ack', { field, value: valid[field], enabled: Boolean(enabled) });
  });

  socket.on('clear_overrides', () => {
    overrideState = { overrides: {}, enabled: {} };
    publishOverrideState();
    socket.emit('override_ack', { cleared: true });
  });

  socket.on('send_once', ({ field, value }) => {
    if (!SENSOR_FIELDS.includes(field)) {
      socket.emit('override_nack', { reason: 'invalid_field', field });
      return;
    }

    const testPayload = { [field]: value };
    const { valid, invalid } = validateSensorPayload(testPayload);
    if (invalid[field]) {
      socket.emit('override_nack', { reason: 'invalid_value', field });
      return;
    }

    const previousOverrides = { ...overrideState.overrides };
    const previousEnabled = { ...overrideState.enabled };

    overrideState.overrides[field] = valid[field];
    overrideState.enabled[field] = true;
    publishOverrideState();

    setTimeout(() => {
      if (previousEnabled[field]) {
        overrideState.overrides[field] = previousOverrides[field];
        overrideState.enabled[field] = true;
      } else {
        delete overrideState.overrides[field];
        delete overrideState.enabled[field];
      }
      publishOverrideState();
    }, 2000);

    socket.emit('override_ack', { field, value: valid[field], sendOnce: true });
  });

  socket.on('disconnect', () => {
    console.log(`Simulator client disconnected: ${socket.id}`);
  });
});

const buildPath = path.join(__dirname, 'frontend', 'build-simulator');
app.use(express.static(buildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Simulator build not found. Run: npm run build:all');
    }
  });
});

const PORT = process.env.SIMULATOR_PORT || 5001;
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
  console.log(`\nGreenhouse Simulator running on port ${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  for (const address of getNetworkAddresses()) {
    console.log(`   Network: http://${address}:${PORT}`);
  }
  console.log('Override topic:', OVERRIDE_TOPIC);
  console.log('WebSocket ready for simulator UI\n');
});
