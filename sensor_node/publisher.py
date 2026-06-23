#!/usr/bin/env python3

import grovepi
import paho.mqtt.client as mqtt
import json
import time
import threading

# ---------------------------------
# SENSOR PORTS
# ---------------------------------

SOUND_SENSOR = 0
LIGHT_SENSOR = 1
MOISTURE_SENSOR = 2

TEMP_SENSOR = 7
PIR_SENSOR = 8

LIMITS = {
    "temperature": (-10, 60),
    "humidity": (0, 100),
    "light": (0, 1023),
    "sound": (0, 1023),
    "moisture": (0, 1023),
}

grovepi.pinMode(
    PIR_SENSOR,
    "INPUT"
)

BROKER = "localhost"

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
            SOUND_SENSOR
        )

        light = grovepi.analogRead(
            LIGHT_SENSOR
        )

        moisture = grovepi.analogRead(
            MOISTURE_SENSOR
        )

        temp, humidity = grovepi.dht(
            TEMP_SENSOR,
            0
        )

        motion = grovepi.digitalRead(
            PIR_SENSOR
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
            "greenhouse/sensors",
            json.dumps(payload)
        )

        time.sleep(2)

    except Exception as e:

        print(
            "Publisher Error:",
            e
        )

        time.sleep(2)
