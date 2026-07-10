#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Greenhouse Sensor Simulator..."

if ! pgrep mosquitto > /dev/null; then
    echo "Error: Mosquitto is not running."
    echo "Start the greenhouse stack first: ./smart_greenhouse.sh"
    exit 1
fi

if ! pgrep -f sensor_mux.py > /dev/null; then
    echo "Error: sensor_mux is not running."
    echo "Start the greenhouse stack first: ./smart_greenhouse.sh"
    exit 1
fi

pkill -f "node simulator_server.js" 2>/dev/null || true
sleep 1

mkdir -p logs

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install --production
fi

if [ ! -d "frontend/build-simulator" ]; then
    echo "WARNING: frontend/build-simulator not found. Run 'npm run build:all' before deploying."
fi

nohup node "$SCRIPT_DIR/simulator_server.js" \
    > "$SCRIPT_DIR/logs/simulator.log" 2>&1 &

IP=$(hostname -I | awk '{print $1}')

echo ""
echo "====================================="
echo "Greenhouse Simulator Started"
echo "Simulator UI: http://$IP:5001"
echo "Main Dashboard: http://$IP:5000"
echo "====================================="
