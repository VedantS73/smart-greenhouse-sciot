#!/usr/bin/env python3

import json
import time
import threading
import paho.mqtt.client as mqtt

BROKER = "localhost"

client = mqtt.Client()

current_state = {
    "led": False,
    "relay1": False,
    "relay2": False
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
                "service": "planner",
                "timestamp": time.time()
            })
        )

        time.sleep(10)

# ---------------------------------
# PUBLISH PLANNER STATUS
# ---------------------------------

def publish_planner_status(
    context=None,
    goal=None,
    actions=None
):

    client.publish(
        "greenhouse/planner",
        json.dumps({

            "context":
            context if context else {},

            "goal":
            goal if goal else {},

            "actions":
            actions if actions else {},

            "auto_mode":
            AUTO_MODE,

            "timestamp":
            time.time()

        })
    )

# ---------------------------------
# CONTEXT MODEL
# ---------------------------------

def get_context(data):

    context = {}

    temp = data.get(
        "temperature",
        0
    )

    humidity = data.get(
        "humidity",
        0
    )

    light = data.get(
        "light",
        0
    )

    moisture = data.get(
        "moisture",
        0
    )

    motion = data.get(
        "motion",
        False
    )

    # -----------------
    # LIGHT
    # -----------------

    if light < 200:

        context["light"] = "LOW"

    elif light > 350:

        context["light"] = "HIGH"

    else:

        context["light"] = "NORMAL"

    # -----------------
    # TEMPERATURE
    # -----------------

    if temp > 30:

        context["temperature"] = "HOT"

    elif temp < 20:

        context["temperature"] = "COLD"

    else:

        context["temperature"] = "NORMAL"

    # -----------------
    # HUMIDITY
    # -----------------

    if humidity < 40:

        context["humidity"] = "DRY"

    elif humidity > 70:

        context["humidity"] = "WET"

    else:

        context["humidity"] = "NORMAL"

    # -----------------
    # SOIL
    # -----------------

    if moisture > 650:

        context["soil"] = "WET"

    elif moisture < 450:

        context["soil"] = "DRY"

    else:

        context["soil"] = "NORMAL"

    context["motion"] = (
        "DETECTED"
        if motion
        else "NONE"
    )

    return context

# ---------------------------------
# GOAL MODEL
# ---------------------------------

def get_goal():

    return {

        "light":
        "NORMAL",

        "temperature":
        "NORMAL",

        "humidity":
        "NORMAL",

        "soil":
        "NORMAL"

    }

# ---------------------------------
# PLANNER
# ---------------------------------

def generate_plan(context):

    actions = {}

    # LED

    if context["light"] == "LOW":

        actions["led"] = True

    else:

        actions["led"] = False

    # Relay1 (Fan)

    if context["temperature"] == "HOT":

        actions["relay1"] = True

    else:

        actions["relay1"] = False

    # Relay2 (Pump)

    if context["soil"] == "DRY":

        actions["relay2"] = True

    else:

        actions["relay2"] = False

    return actions

# ---------------------------------
# ACTUATOR STATUS
# ---------------------------------

def update_actuator_state(payload):

    global current_state

    current_state = payload

# ---------------------------------
# MQTT CALLBACK
# ---------------------------------

def on_message(client, userdata, msg):

    global AUTO_MODE

    try:

        # -----------------
        # ACTUATOR FEEDBACK
        # -----------------

        if msg.topic == "greenhouse/actuator_status":

            payload = json.loads(
                msg.payload.decode()
            )

            update_actuator_state(
                payload
            )

            return

        # -----------------
        # MODE CHANGE
        # -----------------

        if msg.topic == "greenhouse/mode":

            payload = json.loads(
                msg.payload.decode()
            )

            AUTO_MODE = (
                payload["mode"]
                == "AUTO"
            )

            print(
                "\nMode Changed:",
                payload["mode"]
            )

            publish_planner_status()

            return

        # -----------------
        # SENSOR DATA
        # -----------------

        sensor_data = json.loads(
            msg.payload.decode()
        )

        context = get_context(
            sensor_data
        )

        goal = get_goal()

        actions = generate_plan(
            context
        )

        print("\n===================================")
        print("Current Context")
        print(context)

        print("\nGoal State")
        print(goal)

        print("\nPlanner Actions")
        print(actions)

        print("\nAuto Mode")
        print(AUTO_MODE)

        if AUTO_MODE:

            client.publish(
                "greenhouse/actions",
                json.dumps(actions)
            )

        publish_planner_status(
            context,
            goal,
            actions
        )

    except Exception as e:

        print(
            "Planner Error:",
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
    "greenhouse/actuator_status"
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
print(" Smart Greenhouse Planner Running")
print("===================================")

publish_planner_status()

client.loop_forever()
