#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

pkill -f publisher.py 2>/dev/null || true
pkill -f actuator_subscriber.py 2>/dev/null || true
pkill -f dashboard.py 2>/dev/null || true
pkill -f planner_node.py 2>/dev/null || true
pkill -f server.js 2>/dev/null || true
pkill -f security_node.py 2>/dev/null || true

sleep 1

# Hard safety fallback: directly force all actuator pins OFF.
python3 - "$SCRIPT_DIR" <<'PY' 2>/dev/null || true
import json
import os
import sys
import grovepi

script_dir = sys.argv[1]
ports_path = os.path.join(script_dir, "config", "ports.json")

defaults = {"buzzer": 2, "relay1": 4, "led": 3, "relay2": 5, "relay3": 6}
ports = defaults

try:
    with open(ports_path, "r") as f:
        data = json.load(f)
        ports = data.get("actuators", defaults)
except Exception:
    pass

for key in ("buzzer", "relay1", "led", "relay2", "relay3"):
    pin = int(ports.get(key, defaults[key]))
    grovepi.pinMode(pin, "OUTPUT")
    grovepi.digitalWrite(pin, 0)
PY

echo "Smart Greenhouse stopped. All actuators forced OFF."
