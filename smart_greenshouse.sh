#!/bin/bash

# Smart Greenhouse - Start All Services via NPM with concurrently
# This script starts: Mosquitto, Python services, Node backend, and React frontend
# All logs will be displayed in this terminal in real-time

set -e

echo ""
echo "🌱 =========================================="
echo "   Smart Greenhouse Control System"
echo "   Starting all services..."
echo "=========================================="
echo ""

# Check if mosquitto is running
echo "📡 Checking MQTT Broker..."
if ! pgrep -x "mosquitto" > /dev/null; then
    echo "Starting Mosquitto..."
    mosquitto -d
    sleep 1
    echo "✓ Mosquitto started"
else
    echo "✓ Mosquitto already running"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing Node dependencies..."
    npm install --silent
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing Frontend dependencies..."
    cd frontend
    npm install --silent
    cd ..
fi

echo ""
echo "🚀 Starting Smart Greenhouse Services..."
echo "   - Python Sensor Publisher"
echo "   - Python Actuator Subscriber"
echo "   - Python Planner Node"
echo "   - Node.js Backend Server"
echo "   - React Dashboard Frontend"
echo ""
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 Backend API: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start all services with concurrently
npm start
