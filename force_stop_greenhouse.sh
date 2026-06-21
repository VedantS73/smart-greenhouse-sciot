#!/bin/bash

# Smart Greenhouse - Stop All Services

echo "🛑 Stopping Smart Greenhouse Services..."

# Kill all processes
pkill -f "python.*publisher.py" 2>/dev/null || true
pkill -f "python.*actuator_subscriber.py" 2>/dev/null || true
pkill -f "python.*planner_node.py" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
pkill -f "npm" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true

# Optional: Stop Mosquitto (comment out if you want to keep it running)
# pkill -f "mosquitto" 2>/dev/null || true

sleep 1

echo "✓ All Smart Greenhouse services stopped"
echo ""
