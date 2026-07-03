#!/bin/bash

pkill -f publisher.py 2>/dev/null || true
pkill -f actuator_subscriber.py 2>/dev/null || true
pkill -f dashboard.py 2>/dev/null || true
pkill -f planner_node.py 2>/dev/null || true
pkill -f server.js 2>/dev/null || true
pkill -f security_node.py 2>/dev/null || true

echo "Smart Greenhouse stopped"
