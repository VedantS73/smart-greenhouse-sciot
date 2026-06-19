#!/bin/bash

pkill -f publisher.py
pkill -f actuator_subscriber.py
pkill -f dashboard.py
pkill -f planner_node.py

echo "Smart Greenhouse stopped"
