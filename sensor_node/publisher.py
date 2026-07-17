#!/usr/bin/env python3

import os
import sys

sys.path.insert(
    0,
    os.path.join(
        os.path.dirname(__file__),
        ".."
    )
)

import grovepi
import paho.mqtt.client as mqtt
import json
import time
import threading
from shared.ports_config import load_ports, apply_ports_update

# ---------------------------------
# SENSOR LIMITS
# ---------------------------------

LIMITS = {
    "temperature": (-10, 60),
    "humidity": (0, 100),
    "light": (0, 1023),
    "sound": (0, 1023),
    "moisture": (0, 1023),
}

BROKER = "localhost"
SENSOR_TOPIC = os.environ.get(
    "GREENHOUSE_HARDWARE_TOPIC",
    "greenhouse/sensors/hardware"
)
PORTS = load_ports()

client = mqtt.Client()

client.connect(
    BROKER,
    1883,
    60
)


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
                "service": "publisher",
                "timestamp": time.time()
            })
        )

        time.sleep(10)


def get_sensor_port(name):

    return PORTS["sensors"][name]


def apply_pin_modes():

    grovepi.pinMode(
        get_sensor_port("motion"),
        "INPUT"
    )


def on_message(client, userdata, msg):

    global PORTS

    try:

        if msg.topic != "greenhouse/ports_config":
            return

        payload = json.loads(
            msg.payload.decode()
        )

        PORTS = apply_ports_update(payload)
        apply_pin_modes()

        print("\nSensor ports updated:")
        print(json.dumps(PORTS["sensors"], indent=2))

    except Exception as e:
        print("Sensor config update error:", e)


apply_pin_modes()

client.on_message = on_message

client.subscribe("greenhouse/ports_config")
client.loop_start()

threading.Thread(
    target=heartbeat,
    daemon=True
).start()

print("===================================")
print(" Smart Greenhouse Publisher Running")
print("===================================")

while True:

    try:

        sound = grovepi.analogRead(
            get_sensor_port("sound")
        )

        light = grovepi.analogRead(
            get_sensor_port("light")
        )

        moisture = grovepi.analogRead(
            get_sensor_port("moisture")
        )

        temp, humidity = grovepi.dht(
            get_sensor_port("temperatureHumidity"),
            0
        )

        motion = grovepi.digitalRead(
            get_sensor_port("motion")
        )

        payload = {
            "timestamp": time.time()
        }

        if is_valid("sound", sound):
            payload["sound"] = sound

        if is_valid("light", light):
            payload["light"] = light

        if is_valid("moisture", moisture):
            payload["moisture"] = moisture

        payload["motion"] = bool(motion)

        if temp != -1 and humidity != -1:
            temp = round(temp, 2)
            humidity = round(humidity, 2)

            if is_valid("temperature", temp):
                payload["temperature"] = temp

            if is_valid("humidity", humidity):
                payload["humidity"] = humidity
        else:
            print("DHT Read Failed - publishing analog sensors only")

        if len(payload) <= 1:
            print("No valid sensor readings")
            time.sleep(2)
            continue

        print(
            json.dumps(
                payload,
                indent=2
            )
        )

        client.publish(
            SENSOR_TOPIC,
            json.dumps(payload)
        )

        time.sleep(2)

    except Exception as e:

        print(
            "Publisher Error:",
            e
        )

        time.sleep(2)
