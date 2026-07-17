#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Flush Python stdout/stderr immediately so logs are written in real time
# (Python block-buffers stdout when it is redirected to a file, not a TTY).
export PYTHONUNBUFFERED=1

echo "Starting Smart Greenhouse..."

if ! pgrep mosquitto > /dev/null; then
    mosquitto -d
    echo "Mosquitto started"
fi

pkill -f publisher.py 2>/dev/null || true
pkill -f sensor_mux.py 2>/dev/null || true
pkill -f actuator_subscriber.py 2>/dev/null || true
pkill -f planner_node.py 2>/dev/null || true
pkill -f security_node.py 2>/dev/null || true
pkill -f sms_notifier.py 2>/dev/null || true
pkill -f cloud_logger.py 2>/dev/null || true
pkill -f dashboard.py 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true

sleep 2

mkdir -p logs

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install --production
fi

if [ ! -d "frontend/build" ]; then
    echo "WARNING: frontend/build not found. Run 'npm run build' before deploying."
fi

nohup python3 "$SCRIPT_DIR/sensor_node/publisher.py" \
    > "$SCRIPT_DIR/logs/publisher.log" 2>&1 &

nohup python3 "$SCRIPT_DIR/sensor_mux/sensor_mux.py" \
    > "$SCRIPT_DIR/logs/sensor_mux.log" 2>&1 &

nohup python3 "$SCRIPT_DIR/actuator_node/actuator_subscriber.py" \
    > "$SCRIPT_DIR/logs/actuator.log" 2>&1 &

nohup python3 "$SCRIPT_DIR/planner/planner_node.py" \
    > "$SCRIPT_DIR/logs/planner.log" 2>&1 &

nohup python3 "$SCRIPT_DIR/security_node/security_node.py" \
    > "$SCRIPT_DIR/logs/security.log" 2>&1 &

nohup python3 "$SCRIPT_DIR/sms_notifier/sms_notifier.py" \
    > "$SCRIPT_DIR/logs/sms_notifier.log" 2>&1 &

nohup python3 "$SCRIPT_DIR/cloud_logger/cloud_logger.py" \
    > "$SCRIPT_DIR/logs/cloud_logger.log" 2>&1 &

nohup node "$SCRIPT_DIR/server.js" \
    > "$SCRIPT_DIR/logs/server.log" 2>&1 &

IP=$(hostname -I | awk '{print $1}')

echo ""
echo "====================================="
echo "Smart Greenhouse Started"
echo "Dashboard: http://$IP:5000"
echo "====================================="
