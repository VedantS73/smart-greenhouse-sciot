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
from generate_problem import generate_problem
from run_planner import run_planner
from plan_parser import plan_to_actions
from shared.rules_config import load_rules, apply_rules_update

BROKER = "localhost"

client = mqtt.Client()

current_state = {
    "led": False,
    "buzzer": False,
    "relay1": False,
    "relay2": False,
    "relay3": False
}

AUTO_MODE = True
last_context = None
last_sensor_data = None
RULES = load_rules()

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

            "rules":
            RULES,

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

    temp_rules = RULES["temperature"]
    humidity_rules = RULES["humidity"]
    light_rules = RULES["light"]
    soil_rules = RULES["soil"]

    # -----------------
    # LIGHT
    # -----------------

    if light < light_rules["lowBelow"]:

        context["light"] = "LOW"

    elif light > light_rules["highAbove"]:

        context["light"] = "HIGH"

    else:

        context["light"] = "NORMAL"

    # -----------------
    # TEMPERATURE
    # -----------------

    if temp > temp_rules["hotAbove"]:

        context["temperature"] = "HOT"

    elif temp < temp_rules["coldBelow"]:

        context["temperature"] = "COLD"

    else:

        context["temperature"] = "NORMAL"

    # -----------------
    # HUMIDITY
    # -----------------

    if humidity < humidity_rules["dryBelow"]:

        context["humidity"] = "DRY"

    elif humidity > humidity_rules["wetAbove"]:

        context["humidity"] = "WET"

    else:

        context["humidity"] = "NORMAL"

    # -----------------
    # SOIL
    # -----------------

    if moisture > soil_rules["wetAbove"]:

        context["soil"] = "WET"

    elif moisture < soil_rules["dryBelow"]:

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

def run_planning_pipeline(sensor_data):

    global last_context

    context = get_context(sensor_data)

    if context == last_context:
        print("\nNo context change - planner not executed.")
        return

    last_context = context.copy()
    goal = get_goal()

    problem = generate_problem(context, RULES)

    print("\n===================================")
    print("Generated Problem")
    print(problem)

    plan = run_planner()

    print("\nReturned Plan")
    print(plan)

    actions = plan_to_actions(plan)
    print("\n===================================")
    print("Current Context")
    print(context)

    print("\nGoal State")
    print(goal)

    print("\nMQTT Actions")
    print(actions)

    print("\nAuto Mode")
    print(AUTO_MODE)
    print("===================================")

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

# ---------------------------------
# ACTUATOR STATUS
# ---------------------------------

def update_actuator_state(payload):

    global current_state

    current_state.update(payload)

# ---------------------------------
# CONFIG UPDATE
# ---------------------------------

def handle_config_update(payload):

    global RULES, last_context

    RULES = apply_rules_update(payload)

    print("\nRules updated:")
    print(json.dumps(RULES, indent=2))

    last_context = None

    if last_sensor_data:
        run_planning_pipeline(last_sensor_data)

# ---------------------------------
# MQTT CALLBACK
# ---------------------------------

def on_message(client, userdata, msg):

    global AUTO_MODE, last_sensor_data

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
        # CONFIG UPDATE
        # -----------------

        if msg.topic == "greenhouse/config":

            payload = json.loads(
                msg.payload.decode()
            )

            handle_config_update(payload)

            return

        # -----------------
        # SENSOR DATA
        # -----------------

        sensor_data = json.loads(
            msg.payload.decode()
        )

        last_sensor_data = sensor_data.copy()

        run_planning_pipeline(sensor_data)

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

client.subscribe(
    "greenhouse/config"
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
