#!/usr/bin/env python3

#
# Cloud Data Logger (software actuator)
#
# Subscribes to greenhouse/sensors and pushes readings to a free ThingSpeak
# channel for historical logging / live charts. Writes are throttled to obey
# the ThingSpeak free-tier limit (~1 update / 15 s).
#
# The write API key comes from .env (never committed):
#   THINGSPEAK_WRITE_API_KEY
#
# Field mapping (configure your ThingSpeak channel fields to match):
#   field1=temperature  field2=humidity  field3=light
#   field4=sound        field5=moisture  field6=motion (0/1)
#
# If the key or 'requests' is missing, the node stays up and logs that it
# skipped writing (the rest of the system is unaffected).
#

import json
import os
import sys
import threading
import time

import paho.mqtt.client as mqtt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

try:
    import requests
except ImportError:
    requests = None

BROKER = os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))

SENSOR_TOPIC = "greenhouse/sensors"
STATUS_TOPIC = "greenhouse/status"

THINGSPEAK_WRITE_API_KEY = os.environ.get("THINGSPEAK_WRITE_API_KEY", "")
THINGSPEAK_URL = os.environ.get(
    "THINGSPEAK_URL",
    "https://api.thingspeak.com/update"
)

# ThingSpeak free tier allows ~1 write per 15 seconds.
MIN_INTERVAL_SEC = float(os.environ.get("THINGSPEAK_INTERVAL_SEC", "15"))

# ThingSpeak fieldN <- sensor key
FIELD_MAP = {
    "field1": "temperature",
    "field2": "humidity",
    "field3": "light",
    "field4": "sound",
    "field5": "moisture",
    "field6": "motion"
}

last_write = 0.0

client = mqtt.Client()


# ---------------------------------
# THINGSPEAK WRITE
# ---------------------------------

def build_params(data):

    params = {"api_key": THINGSPEAK_WRITE_API_KEY}

    for field, key in FIELD_MAP.items():
        if key not in data:
            continue

        value = data[key]
        if key == "motion":
            value = 1 if value else 0

        params[field] = value

    return params


def log_to_cloud(data):

    global last_write

    now = time.time()
    if now - last_write < MIN_INTERVAL_SEC:
        return

    if not THINGSPEAK_WRITE_API_KEY:
        print("CLOUD: THINGSPEAK_WRITE_API_KEY missing in .env - skipping write")
        last_write = now
        return

    if requests is None:
        print("CLOUD: 'requests' not installed - run pip install -r requirements.txt")
        last_write = now
        return

    params = build_params(data)

    # Only api_key present means there were no valid sensor fields.
    if len(params) <= 1:
        return

    try:
        resp = requests.get(THINGSPEAK_URL, params=params, timeout=10)
        entry_id = resp.text.strip()
        if resp.status_code == 200 and entry_id not in ("", "0"):
            last_write = now
            print(f"CLOUD: logged to ThingSpeak (entry {entry_id})")
        else:
            print(f"CLOUD: ThingSpeak rejected write (status {resp.status_code}, body '{entry_id}')")
    except Exception as e:
        print("CLOUD: write failed:", e)


# ---------------------------------
# HEARTBEAT
# ---------------------------------

def heartbeat():

    while True:

        client.publish(
            STATUS_TOPIC,
            json.dumps({
                "service": "cloud_logger",
                "timestamp": time.time()
            })
        )

        time.sleep(10)


# ---------------------------------
# MQTT CALLBACK
# ---------------------------------

def on_message(client, userdata, msg):

    try:
        data = json.loads(msg.payload.decode())
        log_to_cloud(data)
    except Exception as e:
        print("CLOUD Error:", e)


# ---------------------------------
# STARTUP
# ---------------------------------

client.on_message = on_message

client.connect(BROKER, MQTT_PORT, 60)

client.subscribe(SENSOR_TOPIC)

threading.Thread(target=heartbeat, daemon=True).start()

print("===================================")
print(" Smart Greenhouse Cloud Logger Running")
print("===================================")

client.loop_forever()
