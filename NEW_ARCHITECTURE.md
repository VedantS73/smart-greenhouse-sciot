# Smart Greenhouse - IoT System with Real-time Dashboard

A modern smart greenhouse management system with real-time sensor monitoring, actuator control, and intelligent planning using **WebSockets (Socket.IO)** for instant updates.

## 🚀 New Architecture (NPM-based)

### What's Changed:
- ✅ **Unified npm start** - All services run from a single command with `concurrently`
- ✅ **Real-time WebSocket updates** - No more polling delays
- ✅ **Modern React Dashboard** - Fast, responsive UI with live charts
- ✅ **Node.js Backend Bridge** - Connects Python MQTT services to WebSocket clients
- ✅ **Better UX** - Dashboard reflects changes instantly

### Components:
```
├── server.js                    # Node.js backend (Express + Socket.IO)
├── frontend/                    # React dashboard
│   ├── src/
│   │   ├── App.js             # Main app component
│   │   ├── components/        # React components
│   │   │   ├── Dashboard.js   # Main dashboard
│   │   │   ├── SensorPanel.js # Sensor readings
│   │   │   ├── ActuatorPanel.js # Control switches
│   │   │   ├── ChartsPanel.js # Real-time charts
│   │   │   ├── HealthStatus.js # Overall health
│   │   │   └── EventLog.js    # Event stream
│   │   └── index.js           # Entry point
│   └── package.json           # Frontend dependencies
├── sensor_node/               # Python sensor publisher
├── actuator_node/             # Python actuator controller
├── planner/                   # Python planning engine
└── package.json              # Root npm config
```

## 📋 Quick Start

### Prerequisites:
- Node.js 16+
- Python 3.6+
- Mosquitto (MQTT broker)
- GrovePi+ hardware (for sensors/actuators)

### Installation:

```bash
# 1. Navigate to project directory
cd ~/Documents/Code/Personal/smart-greenhouse-sciot

# 2. Make scripts executable (first time only)
chmod +x smart_greenshouse.sh force_stop_greenhouse.sh dev.sh

# 3. Start everything
./smart_greenshouse.sh
```

This single command will:
1. ✓ Start Mosquitto MQTT broker
2. ✓ Install Node dependencies
3. ✓ Start Python services (publisher, actuator, planner)
4. ✓ Start Node.js backend server
5. ✓ Start React frontend

**Dashboard will be available at:** `http://localhost:3000`

## 🛑 Stopping Services

```bash
./force_stop_greenhouse.sh
```

Or press `Ctrl+C` in the terminal where you started the system.

## 💻 Development Mode (Hot-reload)

For development with automatic reload on code changes:

```bash
./dev.sh
```

This uses `nodemon` for the backend and React's built-in hot-reload for the frontend.

## 📊 NPM Commands

```bash
# Production start (all services)
npm start

# Start only Node backend + React frontend
npm run server        # Backend only (port 5000)
npm run client        # Frontend only (port 3000)

# Development mode with auto-reload
npm run dev

# Start Python services only
npm run start:python

# Start everything (including Mosquitto)
npm run start:all

# Stop all services
npm run stop
```

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Dashboard (React)                   │
│         WebSocket Connection (Socket.IO)             │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │  Node.js Backend        │
        │  (Express + Socket.IO)  │
        │  (Bridges MQTT↔WS)      │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  MQTT Broker            │
        │  (Mosquitto)            │
        └────────────┬────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
  Publisher    Actuator          Planner
  (Python)     (Python)          (Python)
  Sensors      Relays/LEDs       Logic
```

## 🔌 Real-time Communication

The system uses **Socket.IO** (WebSocket protocol) for real-time updates:

- **Publish (Backend → Frontend):**
  - `sensor_update` - New sensor readings (10-100ms latency)
  - `actuator_update` - Actuator state changes
  - `health_update` - Service health status
  - `event_log_update` - System events
  - `history_update` - Historical sensor data

- **Subscribe (Frontend → Backend):**
  - `toggle_led` - Toggle LED
  - `toggle_relay1` / `toggle_relay2` - Control relays
  - `set_mode` - Switch auto/manual mode

## 📱 Dashboard Features

### Real-time Displays:
- **Sensor Readings**: Temperature, humidity, light, sound, moisture, motion
- **Actuator Control**: Toggle LED and relays with instant feedback
- **Health Score**: 0-100% based on environmental conditions
- **Live Charts**: Temperature, humidity, and light trends
- **Event Log**: System events and alerts
- **Service Status**: Monitor if Python services are online
- **Auto/Manual Mode**: Switch between automatic and manual control

### Optimal Conditions:
- 🌡️ Temperature: 20-28°C
- 💧 Humidity: 50-70%
- ☀️ Light: 200-800 lux

## 🔧 Configuration

Edit `.env` file to change settings:

```env
PORT=5000                                    # Backend port
MQTT_BROKER=localhost                       # MQTT broker address
MQTT_PORT=1883                              # MQTT port
NODE_ENV=development                        # Node environment
REACT_APP_API_URL=http://localhost:5000    # API URL for frontend
```

## 📡 MQTT Topics

The backend listens to and publishes to these MQTT topics:

**Subscribed:**
- `greenhouse/sensors` - Sensor data from publisher
- `greenhouse/actuator_status` - Current actuator states
- `greenhouse/status` - Service heartbeats
- `greenhouse/events` - System events
- `greenhouse/planner` - Planner status

**Published:**
- `greenhouse/actuator_command` - Commands to actuators
- `greenhouse/planner_command` - Commands to planner

## 🐛 Troubleshooting

### Dashboard not updating?
```bash
# Check if WebSocket connection is working
# Open browser console (F12) and look for Socket.IO messages
```

### Services not connecting to MQTT?
```bash
# Check if Mosquitto is running
pgrep mosquitto

# Restart Mosquitto
mosquitto -d
```

### High CPU/Memory usage?
```bash
# Check running processes
ps aux | grep python
ps aux | grep node

# Kill specific process
kill <PID>
```

### Port already in use?
```bash
# Check what's using port 3000 or 5000
lsof -i :3000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

## 📈 Performance Improvements

**Why WebSocket (Socket.IO)?**
- ✅ Bidirectional real-time communication
- ✅ Lower latency than polling (10-100ms vs 1000ms+)
- ✅ Reduced bandwidth
- ✅ Automatic reconnection
- ✅ Room-based broadcasting

**Why React?**
- ✅ Virtual DOM for fast updates
- ✅ Component reusability
- ✅ Hot-reload in development
- ✅ Rich ecosystem (Recharts for graphs, Lucide for icons)

## 📦 Dependencies

### Backend:
- `express` - Web framework
- `socket.io` - Real-time communication
- `mqtt` - MQTT client
- `cors` - Cross-origin resource sharing
- `nodemon` - Auto-reload in development

### Frontend:
- `react` - UI framework
- `socket.io-client` - WebSocket client
- `recharts` - Chart library
- `lucide-react` - Icon library

## 🚀 Production Deployment

For production, you may want to:

1. Build the React app:
```bash
cd frontend
npm run build
```

2. Serve static files from Node:
```javascript
app.use(express.static('frontend/build'));
```

3. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name greenhouse
```

## 📝 Logs

Logs are stored in the `logs/` directory:
- `publisher.log` - Sensor readings
- `actuator.log` - Actuator commands
- `planner.log` - Planning decisions
- `dashboard.log` - Dashboard events

View in real-time with:
```bash
tail -f logs/*.log
```

## 🤝 Contributing

To modify the system:

1. **Backend changes:** Edit `server.js` and restart (`Ctrl+C`, then `npm start`)
2. **Frontend changes:** Edit files in `frontend/src/` (auto-reloads)
3. **Python changes:** Edit Python files and restart services

## 📞 Support

For issues or questions, check:
1. Browser console for WebSocket errors
2. Server logs in the terminal
3. Python logs in `logs/` directory
4. Mosquitto status with `mosquitto_sub -t '#'`

---

**Happy Growing! 🌱**
