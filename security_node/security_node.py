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

import json
import time
import threading
import paho.mqtt.client as mqtt
from shared.rules_config import load_rules, apply_rules_update

BROKER = "localhost"

RULES = load_rules()

client = mqtt.Client()

alarm_state = {
    "led": False,
    "buzzer": False
}

AUTO_MODE = True


# ---------------------------------
# HEARTBEAT
# ---------------------------------

def heartbeat():

    while True:

        client.publish(
            "greenhouse/status",
            json.dumps({
                "service": "security",
                "timestamp": time.time()
            })
        )

        time.sleep(10)


# ---------------------------------
# EVENTS
# ---------------------------------

def publish_event(message):

    client.publish(
        "greenhouse/events",
        json.dumps({
            "source": "security",
            "message": message,
            "timestamp": time.time()
        })
    )


# ---------------------------------
# PUBLISH ALARM
# ---------------------------------

def publish_alarm(led, buzzer):

    global alarm_state

    if not AUTO_MODE:
        return

    #
    # Don't publish if nothing changed
    #

    if alarm_state["led"] == led and alarm_state["buzzer"] == buzzer:
        return

    alarm_state["led"] = led
    alarm_state["buzzer"] = buzzer

    client.publish(
        "greenhouse/actions",
        json.dumps({
            "led": led,
            "buzzer": buzzer
        })
    )

    if led or buzzer:
        publish_event("Alarm activated")
    else:
        publish_event("Alarm cleared")


# ---------------------------------
# SENSOR EVALUATION
# ---------------------------------

def evaluate_sensor_data(data):

    security = RULES["security"]

    light = data.get("light", 1023)
    motion = data.get("motion", False)
    temperature = data.get("temperature", 25)

    intrusion = (
        motion and
        light < security["intrusionLightBelow"]
    )

    overheat = (
        temperature > security["criticalTempAbove"]
    )

    if intrusion:

        print("\nSECURITY: Night intrusion detected")

        publish_alarm(
            True,
            True
        )

    elif overheat:

        print("\nSECURITY: Critical temperature")

        publish_alarm(
            True,
            True
        )

    else:

        publish_alarm(
            False,
            False
        )


# ---------------------------------
# MQTT CALLBACK
# ---------------------------------

def on_message(client, userdata, msg):

    global AUTO_MODE

    try:

        if msg.topic == "greenhouse/config":

            global RULES

            payload = json.loads(
                msg.payload.decode()
            )

            RULES = apply_rules_update(payload)

            print("\nSecurity rules updated:")
            print(json.dumps(RULES["security"], indent=2))

            return

        if msg.topic == "greenhouse/mode":
            payload = json.loads(msg.payload.decode())
            AUTO_MODE = payload.get("mode") == "AUTO"
            print("\nSecurity mode:", "AUTO" if AUTO_MODE else "MANUAL")
            return

        data = json.loads(
            msg.payload.decode()
        )

        evaluate_sensor_data(data)

    except Exception as e:

        print(
            "Security Error:",
            e
        )


# ---------------------------------
# MQTT SETUP
# ---------------------------------

client.on_message = on_message

client.connect(
    BROKER,
    1883,
    60
)

client.subscribe(
    "greenhouse/sensors"
)

client.subscribe(
    "greenhouse/config"
)

client.subscribe(
    "greenhouse/mode"
)


# ---------------------------------
# STARTUP
# ---------------------------------

threading.Thread(
    target=heartbeat,
    daemon=True
).start()

print("===================================")
print(" Smart Greenhouse Security Running")
print("===================================")

client.loop_forever()
