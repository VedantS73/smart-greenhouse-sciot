#!/usr/bin/env python3

import copy
import json
import os

PORTS_FILE = os.path.join(
    os.path.dirname(__file__),
    "../config/ports.json"
)

DEFAULT_PORTS = {
    "sensors": {
        "sound": 0,
        "light": 1,
        "moisture": 2,
        "temperatureHumidity": 7,
        "motion": 8
    },
    "actuators": {
        "buzzer": 2,
        "relay1": 4,
        "led": 3,
        "relay2": 5,
        "relay3": 6
    }
}


def load_ports():

    try:
        with open(PORTS_FILE, "r") as f:
            data = json.load(f)
        return _normalize(data)
    except (FileNotFoundError, json.JSONDecodeError, KeyError, TypeError):
        return _normalize(DEFAULT_PORTS)


def apply_ports_update(payload):

    return _normalize(payload)


def _normalize(data):

    return {
        "sensors": {
            "sound": int(data["sensors"]["sound"]),
            "light": int(data["sensors"]["light"]),
            "moisture": int(data["sensors"]["moisture"]),
            "temperatureHumidity": int(data["sensors"]["temperatureHumidity"]),
            "motion": int(data["sensors"]["motion"])
        },
        "actuators": {
            "buzzer": int(data["actuators"]["buzzer"]),
            "relay1": int(data["actuators"]["relay1"]),
            "led": int(data["actuators"]["led"]),
            "relay2": int(data["actuators"]["relay2"]),
            "relay3": int(data["actuators"]["relay3"])
        }
    }


def clone_ports(ports):

    return copy.deepcopy(ports)
