# Smart Greenhouse — Deploy Guide

## Architecture

- **Python nodes** (publisher, actuator, planner) communicate over MQTT on the Pi
- **Node.js server** (`server.js`) bridges MQTT to Socket.IO and serves the React build on port **5000**
- **React dashboard** is built on your laptop and copied to the Pi as static files

## One-time Pi setup (Raspberry Pi 3, Raspbian Buster)

```bash
# Install Node.js 16 LTS (armv7l)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone or copy project to ~/smart_greenhouse
# Ensure Mosquitto is installed
sudo apt-get install -y mosquitto
```

## Deploy from laptop to Pi

```bash
# 1. Build the React frontend
cd frontend && npm install && npm run build && cd ..

# 2. Copy project files to the Pi (adjust user/host)
PI=pi@192.168.1.100
rsync -avz --exclude node_modules --exclude frontend/node_modules \
  ./ $PI:~/smart_greenhouse/

# 3. Install server deps and start on Pi
ssh $PI 'cd ~/smart_greenhouse && npm install --production && chmod +x smart_greenshouse.sh smart_greenhouse.sh && ./smart_greenhouse.sh'
```

Open **http://\<pi-ip\>:5000** in your browser.

## Local development (laptop)

```bash
# Terminal 1: MQTT broker (if not running)
mosquitto -d

# Terminal 2: all services
npm install
npm run dev
```

- Dashboard dev UI: http://localhost:3000 (proxied API/WebSocket to port 5000)
- Or build + serve production-style: `npm run build && npm run start:pi`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build React app to `frontend/build` |
| `npm run start:pi` | Run Node server only (production) |
| `npm run dev` | Node server + CRA dev server |
| `npm run start:python` | Python MQTT nodes only |
| `./smart_greenhouse.sh` | Start full stack on Pi |

## Fallback

If the Node dashboard fails, the legacy Flask dashboard is still available:

```bash
python3 dashboard/dashboard.py
```

## Stopping services

```bash
./force_stop_greenhouse.sh
```

Add `pkill -f "node server.js"` to `force_stop_greenhouse.sh` if needed.
