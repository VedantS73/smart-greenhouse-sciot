#!/usr/bin/env python3

import json
import os
import sys
import threading
import time

import paho.mqtt.client as mqtt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

BROKER = os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))
HARDWARE_TOPIC = os.environ.get(
    "GREENHOUSE_HARDWARE_TOPIC",
    "greenhouse/sensors/hardware"
)
OVERRIDE_TOPIC = os.environ.get(
    "GREENHOUSE_OVERRIDE_TOPIC",
    "greenhouse/sensors/override"
)
OUTPUT_TOPIC = os.environ.get(
    "GREENHOUSE_SENSOR_TOPIC",
    "greenhouse/sensors"
)
PUBLISH_INTERVAL_SEC = float(os.environ.get("SENSOR_MUX_INTERVAL_SEC", "2"))

SENSOR_FIELDS = [
    "temperature",
    "humidity",
    "light",
    "sound",
    "moisture",
    "motion",
]

LIMITS = {
    "temperature": (-10, 60),
    "humidity": (0, 100),
    "light": (0, 1023),
    "sound": (0, 1023),
    "moisture": (0, 1023),
}

hardware_payload = {}
override_state = {
    "overrides": {},
    "enabled": {},
}

client = mqtt.Client()
client.connect(BROKER, MQTT_PORT, 60)


def is_valid(field, value):
    if field == "motion":
        return isinstance(value, bool)

    if not isinstance(value, (int, float)):
        return False

    if field not in LIMITS:
        return False

    low, high = LIMITS[field]
    return low <= value <= high


def heartbeat():
    while True:
        client.publish(
            "greenhouse/status",
            json.dumps({
                "service": "sensor_mux",
                "timestamp": time.time()
            })
        )
        time.sleep(10)


def merge_payload():
    merged = dict(hardware_payload)
    merged["timestamp"] = time.time()

    overrides = override_state.get("overrides", {})
    enabled = override_state.get("enabled", {})

    for field in SENSOR_FIELDS:
        if not enabled.get(field):
            continue

        if field not in overrides:
            continue

        value = overrides[field]
        if is_valid(field, value):
            merged[field] = value

    return merged


def publish_merged():
    if not hardware_payload:
        return

    payload = merge_payload()
    if len(payload) <= 1:
        return

    client.publish(OUTPUT_TOPIC, json.dumps(payload))
    print(json.dumps(payload, indent=2))


def publish_loop():
    while True:
        try:
            publish_merged()
        except Exception as exc:
            print("Sensor mux publish error:", exc)
        time.sleep(PUBLISH_INTERVAL_SEC)


def on_message(_client, _userdata, msg):
    global hardware_payload, override_state

    try:
        payload = json.loads(msg.payload.decode())

        if msg.topic == HARDWARE_TOPIC:
            hardware_payload = payload
            return

        if msg.topic == OVERRIDE_TOPIC:
            overrides = payload.get("overrides", {})
            enabled = payload.get("enabled", {})

            if not isinstance(overrides, dict):
                overrides = {}
            if not isinstance(enabled, dict):
                enabled = {}

            override_state = {
                "overrides": overrides,
                "enabled": enabled,
            }
    except Exception as exc:
        print("Sensor mux message error:", exc)


client.on_message = on_message
client.subscribe(HARDWARE_TOPIC)
client.subscribe(OVERRIDE_TOPIC)
client.loop_start()

threading.Thread(target=heartbeat, daemon=True).start()
threading.Thread(target=publish_loop, daemon=True).start()

print("===================================")
print(" Smart Greenhouse Sensor Mux Running")
print("===================================")
print(f" Hardware topic: {HARDWARE_TOPIC}")
print(f" Override topic: {OVERRIDE_TOPIC}")
print(f" Output topic:   {OUTPUT_TOPIC}")

while True:
    time.sleep(60)
