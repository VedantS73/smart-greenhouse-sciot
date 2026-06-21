const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mqtt = require('mqtt');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// ============================
// MQTT SETUP
// ============================

const BROKER = process.env.MQTT_BROKER || 'localhost';
const MQTT_PORT = process.env.MQTT_PORT || 1883;

const mqttClient = mqtt.connect(`mqtt://${BROKER}:${MQTT_PORT}`);

// ============================
// DATA STORES
// ============================

let sensorData = {
  temperature: 0,
  humidity: 0,
  light: 0,
  sound: 0,
  moisture: 0,
  motion: false
};

let actuatorState = {
  led: false,
  relay1: false,
  relay2: false
};

let plannerData = {
  context: {},
  goal: {},
  actions: {},
  auto_mode: true
};

let serviceHealth = {
  publisher: { online: false, lastHeartbeat: null },
  actuator: { online: false, lastHeartbeat: null },
  planner: { online: false, lastHeartbeat: null }
};

let eventLog = [];
let sensorHistory = {
  temperature: [],
  humidity: [],
  light: []
};

// ============================
// MQTT HANDLERS
// ============================

mqttClient.on('connect', () => {
  console.log('✓ Connected to MQTT Broker');
  
  // Subscribe to all greenhouse topics
  mqttClient.subscribe('greenhouse/sensors');
  mqttClient.subscribe('greenhouse/actuator_status');
  mqttClient.subscribe('greenhouse/status');
  mqttClient.subscribe('greenhouse/events');
  mqttClient.subscribe('greenhouse/planner');
});

mqttClient.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    if (topic === 'greenhouse/sensors') {
      sensorData = payload;
      
      // Keep history for charts
      sensorHistory.temperature.push(payload.temperature);
      sensorHistory.humidity.push(payload.humidity);
      sensorHistory.light.push(payload.light);

      // Keep only last 60 entries
      if (sensorHistory.temperature.length > 60) sensorHistory.temperature.shift();
      if (sensorHistory.humidity.length > 60) sensorHistory.humidity.shift();
      if (sensorHistory.light.length > 60) sensorHistory.light.shift();

      // Broadcast to all connected clients in real-time
      io.emit('sensor_update', sensorData);
      io.emit('history_update', sensorHistory);

    } else if (topic === 'greenhouse/actuator_status') {
      actuatorState = payload;
      io.emit('actuator_update', actuatorState);

    } else if (topic === 'greenhouse/status') {
      const service = payload.service;
      if (serviceHealth[service]) {
        serviceHealth[service].online = true;
        serviceHealth[service].lastHeartbeat = payload.timestamp;
      }
      io.emit('health_update', serviceHealth);

    } else if (topic === 'greenhouse/events') {
      eventLog.unshift(payload);
      if (eventLog.length > 50) eventLog.pop();
      io.emit('event_log_update', eventLog);

    } else if (topic === 'greenhouse/planner') {
      plannerData = payload;
      io.emit('planner_update', plannerData);
    }

  } catch (err) {
    console.error('MQTT Parse Error:', err);
  }
});

// Check service health periodically
setInterval(() => {
  const now = Date.now() / 1000;
  
  Object.keys(serviceHealth).forEach(service => {
    if (serviceHealth[service].lastHeartbeat) {
      serviceHealth[service].online = (now - serviceHealth[service].lastHeartbeat) < 20;
    }
  });
  
  io.emit('health_update', serviceHealth);
}, 5000);

// ============================
// REST API ENDPOINTS
// ============================

app.get('/api/dashboard', (req, res) => {
  res.json({
    sensors: sensorData,
    actuators: actuatorState,
    planner: plannerData,
    health: serviceHealth,
    history: sensorHistory,
    events: eventLog
  });
});

app.get('/api/sensors', (req, res) => {
  res.json(sensorData);
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

app.post('/api/actuators/toggle', (req, res) => {
  const { device, state } = req.body;

  const command = {
    led: actuatorState.led,
    relay1: actuatorState.relay1,
    relay2: actuatorState.relay2
  };

  if (device === 'led') command.led = state;
  if (device === 'relay1') command.relay1 = state;
  if (device === 'relay2') command.relay2 = state;

  mqttClient.publish('greenhouse/actuator_command', JSON.stringify(command));

  res.json({ success: true, command });
});

app.post('/api/planner/mode', (req, res) => {
  const { mode } = req.body;
  const newMode = mode === 'auto';

  const command = {
    ...plannerData,
    auto_mode: newMode
  };

  mqttClient.publish('greenhouse/planner_command', JSON.stringify(command));

  res.json({ success: true, mode: newMode ? 'AUTO' : 'MANUAL' });
});

// ============================
// SOCKET.IO HANDLERS
// ============================

io.on('connection', (socket) => {
  console.log(`✓ Client connected: ${socket.id}`);

  // Send current state to new client
  socket.emit('initial_data', {
    sensors: sensorData,
    actuators: actuatorState,
    planner: plannerData,
    health: serviceHealth,
    history: sensorHistory,
    events: eventLog
  });

  // Handle actuator commands from client
  socket.on('toggle_led', (state) => {
    const command = { ...actuatorState, led: state };
    mqttClient.publish('greenhouse/actuator_command', JSON.stringify(command));
  });

  socket.on('toggle_relay1', (state) => {
    const command = { ...actuatorState, relay1: state };
    mqttClient.publish('greenhouse/actuator_command', JSON.stringify(command));
  });

  socket.on('toggle_relay2', (state) => {
    const command = { ...actuatorState, relay2: state };
    mqttClient.publish('greenhouse/actuator_command', JSON.stringify(command));
  });

  socket.on('set_mode', (mode) => {
    const command = {
      ...plannerData,
      auto_mode: mode === 'auto'
    };
    mqttClient.publish('greenhouse/planner_command', JSON.stringify(command));
  });

  socket.on('disconnect', () => {
    console.log(`✗ Client disconnected: ${socket.id}`);
  });
});

// ============================
// START SERVER
// ============================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🌱 Smart Greenhouse Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready for real-time updates\n`);
});
