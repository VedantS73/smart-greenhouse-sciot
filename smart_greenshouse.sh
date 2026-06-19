#!/bin/bash

echo "Starting Smart Greenhouse..."

# Start Mosquitto if needed
pgrep mosquitto > /dev/null
if [ $? -ne 0 ]; then
    mosquitto -d
    echo "Mosquitto started"
fi

# Kill old instances
pkill -f publisher.py
pkill -f actuator_subscriber.py
pkill -f dashboard.py

sleep 2

# Start services

nohup python3 ~/smart_greenhouse/sensor_node/publisher.py \
> ~/smart_greenhouse/logs/publisher.log 2>&1 &

nohup python3 ~/smart_greenhouse/actuator_node/actuator_subscriber.py \
> ~/smart_greenhouse/logs/actuator.log 2>&1 &

nohup python3 ~/smart_greenhouse/dashboard/dashboard.py \
> ~/smart_greenhouse/logs/dashboard.log 2>&1 &

nohup python3 ~/smart_greenhouse/planner/planner_node.py \
> ~/smart_greenhouse/logs/planner.log 2>&1 &

IP=$(hostname -I | awk '{print $1}')

echo ""
echo "====================================="
echo "Smart Greenhouse Started"
echo "Dashboard: http://$IP:5000"
echo "====================================="
