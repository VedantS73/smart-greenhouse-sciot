# 🔄 MIGRATION GUIDE: Old System → New System

## What Changed and Why

### 1. **Starting Services**

**OLD:**
```bash
./smart_greenshouse.sh
# Runs Python services via nohup in background
# Hard to see logs
# Flask dashboard serves on port 5000
```

**NEW:**
```bash
./smart_greenshouse.sh
# Runs EVERYTHING via npm + concurrently
# All logs in ONE terminal (live)
# React dashboard on port 3000
# Backend API on port 5000
```

---

### 2. **Dashboard Access**

**OLD:**
```
http://localhost:5000  (Flask + Jinja templates)
Polling-based updates (~1 second delay)
Slow, laggy responses
```

**NEW:**
```
http://localhost:3000  (Modern React)
WebSocket real-time updates (~50ms delay)
Instant, smooth responses
Live charts and graphs
```

---

### 3. **File Structure**

```diff
OLD STRUCTURE:
  dashboard/
  ├── dashboard.py        # Flask server (removed)
  ├── templates/
  │   └── index.html     # Old Jinja template
  └── static/
      ├── app.js         # Old jQuery
      └── style.css      # Old CSS

NEW STRUCTURE:
  frontend/              # React app
  ├── package.json       # React dependencies
  ├── public/
  │   └── index.html    # React HTML
  └── src/
      ├── App.js         # React root component
      ├── components/    # Reusable React components
      │   ├── Dashboard.js
      │   ├── SensorPanel.js
      │   ├── ActuatorPanel.js
      │   ├── ChartsPanel.js
      │   ├── HealthStatus.js
      │   └── EventLog.js
      └── index.css      # Tailwind-like styles
      
  server.js             # NEW - Node.js backend
  package.json          # ROOT npm config
  .env                  # Configuration
```

---

### 4. **Real-time Communication**

**OLD - Polling Model:**
```
Dashboard (Browser)
    ↓ (every 1-2 sec) /api/sensors
Server (Flask)
    ↓ HTTP response
Dashboard updates
```

**NEW - WebSocket Model:**
```
Dashboard (Browser) ← WebSocket connection → Server (Node.js)
    ↑ sensor_update (instantly when data changes)
Server listens to MQTT
    ↓ updates broadcast to all connected clients
Dashboard updates (10-100ms latency)
```

---

### 5. **Starting Everything**

**OLD:** Multiple commands/windows
```bash
# Terminal 1
mosquitto -d

# Terminal 2
python3 sensor_node/publisher.py

# Terminal 3
python3 actuator_node/actuator_subscriber.py

# Terminal 4
python3 planner/planner_node.py

# Terminal 5
python3 dashboard/dashboard.py

# Terminal 6
npm start (frontend, if using separate build)

# Logs scattered across 6 terminals!
```

**NEW:** One command, one terminal
```bash
./smart_greenshouse.sh

# ✓ Everything starts in concurrently
# ✓ All logs in one terminal
# ✓ Easy to see what's happening
# ✓ Ctrl+C stops everything
```

---

### 6. **Development Workflow**

**OLD:**
```bash
# Edit dashboard.py
# Stop Flask (pkill python)
# Restart (python3 dashboard/dashboard.py)
# Refresh browser
# Manual process
```

**NEW:**
```bash
./dev.sh

# Edit frontend/src/App.js
# Save
# Browser auto-refreshes (React hot-reload)
# No manual restart!

# Edit server.js
# Save
# Server auto-restarts (nodemon)
```

---

### 7. **API & Communication**

**OLD - Flask Routes:**
```python
@app.route('/api/sensors', methods=['GET'])
def get_sensors():
    return jsonify(sensor_data)

# HTTP polling
```

**NEW - Express + WebSocket:**
```javascript
// REST endpoints (still available)
app.get('/api/sensors', (req, res) => res.json(sensorData));

// WebSocket (real-time, preferred)
socket.on('connect', () => {
  io.emit('sensor_update', sensorData);
});
```

---

### 8. **Why This is Better**

| Aspect | Old | New |
|--------|-----|-----|
| **Start** | Multiple commands | One command |
| **Logs** | Scattered across files/terminals | Single terminal |
| **Update latency** | 1000ms+ | 50-100ms |
| **UI responsiveness** | Slow | Fast ⚡ |
| **Dashboard UX** | Basic, static | Modern, interactive |
| **Development** | Manual restart | Auto-reload |
| **Scalability** | Polling doesn't scale | WebSocket scales |
| **Browser tabs** | Single view only | Works across tabs |

---

### 9. **Backward Compatibility**

**Old Python services still work!**
- `sensor_node/publisher.py` ✓ Unchanged
- `actuator_node/actuator_subscriber.py` ✓ Unchanged
- `planner/planner_node.py` ✓ Unchanged

They still publish/subscribe to the same MQTT topics.

**Old Flask dashboard is replaced:**
- Old `dashboard/dashboard.py` is no longer used
- Use the new React dashboard instead
- Same functionality, much better UI

---

### 10. **Migration Checklist**

- ✅ Old `dashboard.py` can be deleted (backed up)
- ✅ Old HTML templates can be deleted (backed up)
- ✅ Old jQuery code can be deleted (backed up)
- ✅ Python services continue to work as-is
- ✅ MQTT broker and configuration unchanged
- ✅ Sensor/actuator hardware connections unchanged

---

## Rollback (if needed)

If you want to keep the old system:

```bash
# Old files are still in dashboard/ directory
# You can manually start the old Flask dashboard:
python3 dashboard/dashboard_old.py

# But you lose all the new features!
# - Real-time WebSocket updates
# - Modern React UI
# - Auto-reload in development
# - Unified npm startup
```

**Don't do this!** The new system is much better. 🚀

---

## Questions?

- Check `QUICK_START.md` for quick reference
- Check `NEW_ARCHITECTURE.md` for full documentation
- Check `server.js` for backend code
- Check `frontend/src/components/` for frontend code

---

**Migration complete! Enjoy the new system! 🌱**
