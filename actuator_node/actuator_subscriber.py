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
import json
import time
import threading
import paho.mqtt.client as mqtt
from shared.ports_config import load_ports, apply_ports_update

PORTS = load_ports()

def get_actuator_port(name):
    return PORTS["actuators"][name]


def apply_pin_modes():
    grovepi.pinMode(get_actuator_port("relay1"), "OUTPUT")
    grovepi.pinMode(get_actuator_port("relay2"), "OUTPUT")
    grovepi.pinMode(get_actuator_port("relay3"), "OUTPUT")
    grovepi.pinMode(get_actuator_port("led"), "OUTPUT")
    grovepi.pinMode(get_actuator_port("buzzer"), "OUTPUT")

BROKER = "localhost"

led_state = False
relay1_state = False
relay2_state = False
relay3_state = False
buzzer_state = False

client = mqtt.Client()


def publish_status():

    payload = {
        "led": led_state,
        "buzzer": buzzer_state,
        "relay1": relay1_state,
        "relay2": relay2_state,
        "relay3": relay3_state
    }

    client.publish(
        "greenhouse/actuator_status",
        json.dumps(payload)
    )


def publish_event(message):

    client.publish(
        "greenhouse/events",
        json.dumps({
            "source": "actuator",
            "message": message,
            "timestamp": time.time()
        })
    )


def heartbeat():

    while True:

        client.publish(
            "greenhouse/status",
            json.dumps({
                "service": "actuator",
                "timestamp": time.time()
            })
        )

        time.sleep(10)


def on_message(client, userdata, msg):

    global led_state
    global relay1_state
    global relay2_state
    global relay3_state
    global buzzer_state

    payload = json.loads(msg.payload.decode())

    if msg.topic == "greenhouse/ports_config":

        global PORTS
        PORTS = apply_ports_update(payload)
        apply_pin_modes()
        print("\nActuator ports updated:")
        print(json.dumps(PORTS["actuators"], indent=2))
        return

    print("Received:", payload)

    if "led" in payload:

        led_state = payload["led"]

        grovepi.digitalWrite(
            get_actuator_port("led"),
            1 if led_state else 0
        )

        publish_event(
            f"ALARM LED {'ON' if led_state else 'OFF'}"
        )

    if "relay1" in payload:

        relay1_state = payload["relay1"]
        grovepi.digitalWrite(
            get_actuator_port("relay1"),
            1 if relay1_state else 0
        )

    if "relay2" in payload:
        relay2_state = payload["relay2"]
        grovepi.digitalWrite(
            get_actuator_port("relay2"),
            1 if relay2_state else 0
        )
    
    if "relay3" in payload:

        relay3_state = payload["relay3"]
        grovepi.digitalWrite(
            get_actuator_port("relay3"),
            1 if relay3_state else 0
        )

    if "buzzer" in payload:

        buzzer_state = payload["buzzer"]

        grovepi.digitalWrite(
            get_actuator_port("buzzer"),
            1 if buzzer_state else 0
        )

        publish_event(
            f"Buzzer {'ON' if buzzer_state else 'OFF'}"
        )

    publish_status()


client.on_message = on_message

client.connect(BROKER,1883,60)

apply_pin_modes()

client.subscribe(
    "greenhouse/actions"
)
client.subscribe(
    "greenhouse/ports_config"
)

publish_status()

threading.Thread(
    target=heartbeat,
    daemon=True
).start()

print("Actuator node running")

client.loop_forever()
