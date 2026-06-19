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

# ---------------------------------
# HEARTBEAT
# ---------------------------------

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

# ---------------------------------
# START HEARTBEAT
# ---------------------------------

threading.Thread(
    target=heartbeat,
    daemon=True
).start()

print("===================================")
print(" Smart Greenhouse Publisher Running")
print("===================================")

# ---------------------------------
# MAIN LOOP
# ---------------------------------

while True:

    try:

        # -----------------
        # ANALOG SENSORS
        # -----------------

        sound = grovepi.analogRead(
            SOUND_SENSOR
        )

        light = grovepi.analogRead(
            LIGHT_SENSOR
        )

        moisture = grovepi.analogRead(
            MOISTURE_SENSOR
        )

        # -----------------
        # DHT SENSOR
        # -----------------

        temp, humidity = grovepi.dht(
            TEMP_SENSOR,
            0
        )

        # -----------------
        # PIR
        # -----------------

        motion = grovepi.digitalRead(
            PIR_SENSOR
        )

        # -----------------
        # VALIDATE DHT
        # -----------------

        if temp == -1 or humidity == -1:

            print(
                "DHT Read Failed"
            )

            time.sleep(2)

            continue

        # -----------------
        # PAYLOAD
        # -----------------

        payload = {

            "temperature":
            round(temp, 2),

            "humidity":
            round(humidity, 2),

            "light":
            light,

            "sound":
            sound,

            "moisture":
            moisture,

            "motion":
            bool(motion),

            "timestamp":
            time.time()

        }

        print(
            json.dumps(
                payload,
                indent=2
            )
        )

        # -----------------
        # MQTT PUBLISH
        # -----------------

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
