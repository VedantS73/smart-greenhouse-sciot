#!/usr/bin/env python3

import json
import time
import threading
import paho.mqtt.client as mqtt

BROKER = "localhost"

LIGHT_THRESHOLD = 200
CRITICAL_TEMP = 40

client = mqtt.Client()

alarm_state = {
    "led": False,
    "buzzer": False
}


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
# MQTT CALLBACK
# ---------------------------------

def on_message(client, userdata, msg):

    try:

        data = json.loads(
            msg.payload.decode()
        )

        light = data.get("light", 1023)
        motion = data.get("motion", False)
        temperature = data.get("temperature", 25)

        intrusion = (
            motion and
            light < LIGHT_THRESHOLD
        )

        overheat = (
            temperature > CRITICAL_TEMP
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