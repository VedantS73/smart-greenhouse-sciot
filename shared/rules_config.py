import json
import os

RULES_FILE = os.path.join(
    os.path.dirname(__file__),
    "../config/rules.json"
)

DEFAULT_RULES = {
    "temperature": {"coldBelow": 20, "hotAbove": 30},
    "humidity": {"dryBelow": 40, "wetAbove": 70},
    "light": {"lowBelow": 200, "highAbove": 350},
    "soil": {"dryBelow": 450, "wetAbove": 650},
    "security": {"intrusionLightBelow": 200, "criticalTempAbove": 40},
    "schedule": {"dayStartHour": 6, "dayEndHour": 22}
}


def load_rules():

    try:

        with open(RULES_FILE, "r") as f:
            data = json.load(f)

        return _normalize(data)

    except (FileNotFoundError, json.JSONDecodeError, KeyError):

        return _normalize(DEFAULT_RULES)


def apply_rules_update(payload):

    return _normalize(payload)


def _normalize(data):

    return {
        "temperature": {
            "coldBelow": data["temperature"]["coldBelow"],
            "hotAbove": data["temperature"]["hotAbove"]
        },
        "humidity": {
            "dryBelow": data["humidity"]["dryBelow"],
            "wetAbove": data["humidity"]["wetAbove"]
        },
        "light": {
            "lowBelow": data["light"]["lowBelow"],
            "highAbove": data["light"]["highAbove"]
        },
        "soil": {
            "dryBelow": data["soil"]["dryBelow"],
            "wetAbove": data["soil"]["wetAbove"]
        },
        "security": {
            "intrusionLightBelow": data["security"]["intrusionLightBelow"],
            "criticalTempAbove": data["security"]["criticalTempAbove"]
        },
        "schedule": {
            "dayStartHour": data["schedule"]["dayStartHour"],
            "dayEndHour": data["schedule"]["dayEndHour"]
        }
    }
