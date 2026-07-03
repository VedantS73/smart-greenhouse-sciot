from flask import Flask, render_template, jsonify
import paho.mqtt.client as mqtt
import json
import time

app = Flask(__name__)

BROKER = "localhost"

# ----------------------------
# DATA STORES
# ----------------------------

sensor_data = {
    "temperature": 0,
    "humidity": 0,
    "light": 0,
    "sound": 0,
    "moisture": 0,
    "motion": False
}

actuator_state = {
    "led": False,
    "relay1": False,
    "relay2": False,
    "relay3": False
}

planner_data = {
    "context": {},
    "goal": {},
    "actions": {},
    "auto_mode": True
}

heartbeats = {}

event_log = []

mode = "LOADING"

temp_history = []
humidity_history = []
light_history = []

# ----------------------------
# MQTT CALLBACK
# ----------------------------

def on_message(client, userdata, msg):

    global sensor_data
    global actuator_state
    global planner_data
    global mode

    try:

        topic = msg.topic

        payload = json.loads(
            msg.payload.decode()
        )

        if topic == "greenhouse/sensors":

            sensor_data = payload

            temp_history.append(
                payload["temperature"]
            )

            humidity_history.append(
                payload["humidity"]
            )

            light_history.append(
                payload["light"]
            )

            if len(temp_history) > 30:
                temp_history.pop(0)

            if len(humidity_history) > 30:
                humidity_history.pop(0)

            if len(light_history) > 30:
                light_history.pop(0)

        elif topic == "greenhouse/actuator_status":

            actuator_state = payload

        elif topic == "greenhouse/status":

            heartbeats[
                payload["service"]
            ] = payload["timestamp"]

        elif topic == "greenhouse/events":

            event_log.insert(
                0,
                payload["message"]
            )

            if len(event_log) > 20:
                event_log.pop()

        elif topic == "greenhouse/planner":
            global planner_data
            global mode
            planner_data = payload
            print("PLANNER RECEIVED:", payload)
            mode = (
                "AUTO"
                if payload.get(
                    "auto_mode",
                    True
                )
                else "MANUAL"
            )

    except Exception as e:

        print(
            "Dashboard MQTT Error:",
            e
        )

# ----------------------------
# MQTT SETUP
# ----------------------------

mqtt_client = mqtt.Client()

mqtt_client.on_message = on_message

mqtt_client.connect(
    BROKER,
    1883,
    60
)

mqtt_client.subscribe(
    "greenhouse/sensors"
)

mqtt_client.subscribe(
    "greenhouse/actuator_status"
)

mqtt_client.subscribe(
    "greenhouse/status"
)

mqtt_client.subscribe(
    "greenhouse/events"
)

mqtt_client.subscribe(
    "greenhouse/planner"
)

mqtt_client.loop_start()

publisher = mqtt.Client()

publisher.connect(
    BROKER,
    1883,
    60
)

# ----------------------------
# HELPERS
# ----------------------------

def online(service):

    if service not in heartbeats:
        return False

    return (
        time.time() -
        heartbeats[service]
    ) < 20


def greenhouse_health():

    score = 100

    t = sensor_data["temperature"]
    h = sensor_data["humidity"]
    l = sensor_data["light"]

    if t < 18 or t > 32:
        score -= 20

    if h < 40:
        score -= 20

    if l < 150:
        score -= 20

    return max(score, 0)

# ----------------------------
# ROUTES
# ----------------------------

@app.route("/")
def home():

    return render_template(
        "index.html"
    )

@app.route("/api/status")
def api_status():

    return jsonify({

        "temperature":
        sensor_data["temperature"],

        "humidity":
        sensor_data["humidity"],

        "light":
        sensor_data["light"],

        "sound":
        sensor_data["sound"],

        "moisture":
        sensor_data["moisture"],

        "motion":
        sensor_data["motion"],

        "led":
        actuator_state.get(
            "led",
            False
        ),

        "relay1":
        actuator_state.get(
            "relay1",
            False
        ),

        "relay2":
        actuator_state.get(
            "relay2",
            False
        ),

        "relay3":
        actuator_state.get(
            "relay3",
            False
        ),

        "health":
        greenhouse_health(),

        "publisher":
        online(
            "publisher"
        ),

        "actuator":
        online(
            "actuator"
        ),

        "events":
        event_log,

        "mode":
        mode,

        "planner":
        planner_data,

        "temp_history":
        temp_history,

        "humidity_history":
        humidity_history,

        "light_history":
        light_history

    })

# ----------------------------
# MANUAL CONTROLS
# ----------------------------

@app.route("/toggle_led")
def toggle_led():

    if mode != "MANUAL":

        return "AUTO MODE ACTIVE"

    publisher.publish(
        "greenhouse/actions",
        json.dumps({
            "led":
            not actuator_state.get(
                "led",
                False
            )
        })
    )

    return "ok"

@app.route("/toggle_relay")
def toggle_relay():

    if mode != "MANUAL":

        return "AUTO MODE ACTIVE"

    publisher.publish(
        "greenhouse/actions",
        json.dumps({
            "relay1":
            not actuator_state.get(
                "relay1",
                False
            )
        })
    )

    return "ok"

@app.route("/toggle_relay2")
def toggle_relay2():

    if mode != "MANUAL":

        return "AUTO MODE ACTIVE"

    publisher.publish(
        "greenhouse/actions",
        json.dumps({
            "relay2":
            not actuator_state.get(
                "relay2",
                False
            )
        })
    )

    return "ok"

@app.route("/toggle_relay3")
def toggle_relay3():

    if mode != "MANUAL":

        return "AUTO MODE ACTIVE"

    publisher.publish(
        "greenhouse/actions",
        json.dumps({
            "relay3":
            not actuator_state.get(
                "relay3",
                False
            )
        })
    )

    return "ok"

# ----------------------------
# MODE CONTROL
# ----------------------------

@app.route("/toggle_mode")
def toggle_mode():

    target = (
        "MANUAL"
        if mode == "AUTO"
        else "AUTO"
    )

    publisher.publish(
        "greenhouse/mode",
        json.dumps({
            "mode": target
        })
    )

    print(
        "Requested Mode:",
        target
    )

    return "ok"

# ----------------------------
# START
# ----------------------------

app.run(
    host="0.0.0.0",
    port=5000
)
