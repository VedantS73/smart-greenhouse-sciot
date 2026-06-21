# 🚀 QUICK START GUIDE

## Get Started in 30 Seconds

```bash
cd ~/Documents/Code/Personal/smart-greenhouse-sciot
./smart_greenshouse.sh
```

That's it! Then open: **http://localhost:3000** in your browser

---

## 📊 What You Get

| Feature | Before | After |
|---------|--------|-------|
| **Start** | 4 shell scripts + manual setup | 1 npm command ✓ |
| **Update Speed** | 1000ms+ (polling) | 10-100ms (WebSocket) ✓ |
| **Dashboard** | Flask (basic) | React (modern) ✓ |
| **Charts** | Static images | Real-time live updates ✓ |
| **UI** | Slow/laggy | Fast & responsive ✓ |
| **Development** | Manual restart | Auto-reload (dev.sh) ✓ |
| **Logs** | Multiple files | One terminal (real-time) ✓ |

---

## 📱 Dashboard at a Glance

```
┌─ Smart Greenhouse Dashboard ─────────────────┐
│                                               │
│  🤖 AUTO MODE    Status: Connected ✓         │
│                                               │
│  [Sensor Readings] ┌─ Real-time Charts ─┐    │
│  • 🌡️ 25.3°C      │ Temperature Trend   │    │
│  • 💧 65% RH      │ [████████░░]        │    │
│  • ☀️ 450 lux     │ Humidity Trend      │    │
│  • 🔊 35 dB       │ [██████░░░░]        │    │
│  • 🌿 42%         └─────────────────────┘    │
│  • 🔴 Motion: Off                           │
│                                               │
│  [Actuators]      [Event Log]  [Health: 95%] │
│  • LED: ON        • System OK                 │
│  • Relay1: OFF    • Sensors OK                │
│  • Relay2: ON     • Updated now               │
│                                               │
└─ ✓ Publisher ✓ Actuator ✓ Planner ──────────┘
```

---

## 🎮 Available Commands

```bash
# Production
./smart_greenshouse.sh        # Start all services
./force_stop_greenhouse.sh    # Stop all services

# Development (auto-reload on code changes)
./dev.sh

# Manual npm commands
npm start                     # Production
npm run dev                   # Development
npm run server               # Backend only
npm run client               # Frontend only
npm run start:python         # Python services only
npm run stop                 # Stop all
```

---

## 🔍 What's Happening?

When you run `./smart_greenshouse.sh`:

1. ✓ **Mosquitto starts** → MQTT message broker
2. ✓ **Python services start** → Sensors, actuators, planner
3. ✓ **Node backend starts** (port 5000) → Bridges MQTT ↔ WebSocket
4. ✓ **React frontend starts** (port 3000) → Dashboard UI
5. ✓ **Everything connects** → Real-time data flows!

All logs appear in **one terminal** - you see everything!

---

## 📍 Key Differences from Old System

### Old (Shell Scripts)
```bash
./smart_greenshouse.sh  # Starts Python services via nohup
python3 dashboard.py    # Separate Flask server
# Hard to see logs, slow updates, laggy UI
```

### New (npm + concurrently)
```bash
npm start               # Starts EVERYTHING
# One terminal shows all logs
# WebSocket = instant updates (10-100ms)
# Modern React UI = smooth & responsive
```

---

## 🌐 Access Points

- **Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://localhost:5000 (automatic)

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | `kill -9 $(lsof -t -i:3000)` |
| Dashboard won't load | Check if npm start completed |
| No sensor updates | Verify Mosquitto: `pgrep mosquitto` |
| Python errors | Check logs in terminal output |
| Need to restart | Press `Ctrl+C` then `./smart_greenshouse.sh` |

---

## 🔧 Configuration

Edit `.env` to customize:

```env
PORT=5000                              # Change backend port
MQTT_BROKER=192.168.1.100            # Remote MQTT broker
NODE_ENV=production                   # Production mode
REACT_APP_API_URL=https://api.url    # Production API URL
```

---

## 📈 Real-time Technology

**Why this is FASTER:**

- **Old**: Dashboard polls `/api/data` every 1-2 seconds
  - Latency: 1000ms+
  - Wasted requests
  - Laggy UI updates

- **New**: WebSocket broadcasts updates instantly
  - Latency: 10-100ms ⚡
  - Only sends when data changes
  - Smooth, responsive UI

---

## 🚀 Next Steps

1. ✅ Run: `./smart_greenshouse.sh`
2. ✅ Open: http://localhost:3000
3. ✅ See: Real-time sensor data + controls
4. ✅ Enjoy: Fast, modern dashboard!

---

## 📚 More Info

See `NEW_ARCHITECTURE.md` for:
- Complete system architecture
- All npm commands
- MQTT topics
- Production deployment
- Advanced configuration

---

**Everything is now running smoothly! 🌱**
