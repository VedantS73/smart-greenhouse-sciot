import grovepi
import json
import time
import threading
import paho.mqtt.client as mqtt

RELAY1 = 3
RELAY2 = 5
RELAY3 = 6
LED = 4
BUZZER = 2

grovepi.pinMode(
    RELAY1,
    "OUTPUT"
)

grovepi.pinMode(
    RELAY2,
    "OUTPUT"
)

grovepi.pinMode(
    RELAY3,
    "OUTPUT"
)

grovepi.pinMode(
    LED,
    "OUTPUT"
)

grovepi.pinMode(
    BUZZER,
    "OUTPUT"
)

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

    payload = json.loads(
        msg.payload.decode()
    )

    print("Received:", payload)

    if "led" in payload:

        led_state = payload["led"]

        grovepi.digitalWrite(
            LED,
            1 if led_state else 0
        )

        publish_event(
            f"ALARM LED {'ON' if led_state else 'OFF'}"
        )

    if "relay1" in payload:

        relay1_state = payload["relay1"]
        grovepi.digitalWrite(
            RELAY1,
            1 if relay1_state else 0
        )

    if "relay2" in payload:
        relay2_state = payload["relay2"]
        grovepi.digitalWrite(
            RELAY2,
            1 if relay2_state else 0
        )
    
    if "relay3" in payload:

        relay3_state = payload["relay3"]
        grovepi.digitalWrite(
            RELAY3,
            1 if relay3_state else 0
        )

    if "buzzer" in payload:

        buzzer_state = payload["buzzer"]

        grovepi.digitalWrite(
            BUZZER,
            1 if buzzer_state else 0
        )

        publish_event(
            f"Buzzer {'ON' if buzzer_state else 'OFF'}"
        )

    publish_status()


client.on_message = on_message

client.connect(BROKER,1883,60)

client.subscribe(
    "greenhouse/actions"
)

publish_status()

threading.Thread(
    target=heartbeat,
    daemon=True
).start()

print("Actuator node running")

client.loop_forever()
