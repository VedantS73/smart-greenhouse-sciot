#!/usr/bin/env python3

#
# SMS Notifier (software actuator)
#
# Subscribes to security alarm events on greenhouse/events and sends an SMS
# via Twilio. The destination phone number and enable flag are managed from
# the dashboard Settings modal and delivered here over greenhouse/settings
# (retained), seeded from config/settings.json at startup.
#
# Twilio credentials come from .env (never committed):
#   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
#
# If credentials or the destination number are missing, the node stays up and
# simply logs that it skipped sending (the rest of the system is unaffected).
#

import json
import os
import sys
import threading
import time

import paho.mqtt.client as mqtt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def load_env(path):
    # Prefer python-dotenv, but fall back to a minimal parser so the node
    # works even when the package isn't installed (e.g. on the Pi).
    try:
        from dotenv import load_dotenv
        load_dotenv(path)
        return
    except ImportError:
        pass

    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                os.environ.setdefault(
                    key.strip(),
                    value.strip().strip('"').strip("'")
                )
    except FileNotFoundError:
        print("SMS: no .env file found at", path)


load_env(os.path.join(os.path.dirname(__file__), "..", ".env"))

BROKER = os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))

EVENTS_TOPIC = "greenhouse/events"
SETTINGS_TOPIC = "greenhouse/settings"
STATUS_TOPIC = "greenhouse/status"

SETTINGS_FILE = os.path.join(
    os.path.dirname(__file__),
    "..",
    "config",
    "settings.json"
)

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER", "")

# Don't send more than one SMS per reason within this window.
COOLDOWN_SEC = float(os.environ.get("SMS_COOLDOWN_SEC", "120"))

ALERT_MESSAGES = {
    "intrusion": "Smart Greenhouse ALERT: Possible intruder detected at night.",
    "overheat": "Smart Greenhouse ALERT: Critical high temperature detected."
}

sms_settings = {
    "enabled": True,
    "phoneNumber": ""
}

last_sent = {}

client = mqtt.Client()


# ---------------------------------
# TWILIO CLIENT
# ---------------------------------

twilio_client = None

def init_twilio():

    global twilio_client

    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER):
        print("SMS: Twilio credentials missing in .env - SMS sending disabled")
        return

    try:
        from twilio.rest import Client
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        print("SMS: Twilio client ready")
    except ImportError:
        print("SMS: 'twilio' package not installed - run pip install -r requirements.txt")
    except Exception as e:
        print("SMS: Failed to init Twilio client:", e)


# ---------------------------------
# SETTINGS
# ---------------------------------

def load_settings_from_disk():

    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
        sms = data.get("sms", {})
        if isinstance(sms, dict):
            sms_settings["enabled"] = bool(sms.get("enabled", True))
            sms_settings["phoneNumber"] = str(sms.get("phoneNumber", ""))
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        pass


def apply_settings(payload):

    sms = payload.get("sms", {}) if isinstance(payload, dict) else {}
    if not isinstance(sms, dict):
        return

    if "enabled" in sms:
        sms_settings["enabled"] = bool(sms["enabled"])
    if "phoneNumber" in sms:
        sms_settings["phoneNumber"] = str(sms["phoneNumber"])

    print(
        "SMS settings updated:",
        "enabled" if sms_settings["enabled"] else "disabled",
        "->",
        sms_settings["phoneNumber"] or "(no number)"
    )


# ---------------------------------
# SEND
# ---------------------------------

def send_sms(reason):

    body = ALERT_MESSAGES.get(reason)
    if not body:
        return

    if not sms_settings["enabled"]:
        print("SMS: alerts disabled, skipping")
        return

    to_number = sms_settings["phoneNumber"].strip()
    if not to_number:
        print("SMS: no destination number configured, skipping")
        return

    now = time.time()
    if now - last_sent.get(reason, 0) < COOLDOWN_SEC:
        print(f"SMS: '{reason}' within cooldown, skipping")
        return

    if not twilio_client:
        print(f"SMS: (would send) '{body}' -> {to_number}")
        last_sent[reason] = now
        return

    try:
        message = twilio_client.messages.create(
            body=body,
            from_=TWILIO_FROM_NUMBER,
            to=to_number
        )
        last_sent[reason] = now
        print(f"SMS sent ({reason}) to {to_number}: {message.sid}")
    except Exception as e:
        print("SMS: send failed:", e)


# ---------------------------------
# HEARTBEAT
# ---------------------------------

def heartbeat():

    while True:

        client.publish(
            STATUS_TOPIC,
            json.dumps({
                "service": "sms_notifier",
                "timestamp": time.time()
            })
        )

        time.sleep(10)


# ---------------------------------
# MQTT CALLBACKS
# ---------------------------------

def on_message(client, userdata, msg):

    try:

        payload = json.loads(msg.payload.decode())

        if msg.topic == SETTINGS_TOPIC:
            apply_settings(payload)
            return

        if msg.topic == EVENTS_TOPIC:

            if payload.get("source") != "security":
                return

            reason = payload.get("reason")
            if reason in ALERT_MESSAGES:
                send_sms(reason)

    except Exception as e:
        print("SMS Error:", e)


# ---------------------------------
# STARTUP
# ---------------------------------

load_settings_from_disk()
init_twilio()

client.on_message = on_message

client.connect(BROKER, MQTT_PORT, 60)

client.subscribe(EVENTS_TOPIC)
client.subscribe(SETTINGS_TOPIC)

threading.Thread(target=heartbeat, daemon=True).start()

print("===================================")
print(" Smart Greenhouse SMS Notifier Running")
print("===================================")

client.loop_forever()
