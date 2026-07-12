#!/usr/bin/env python3

from datetime import datetime


def plan_to_actions(plan):

    actions = {
        "led": False,
        "buzzer": False,
        "relay1": False,
        "relay2": False,
        "relay3": False,
    }

    for action in plan:

        action = action.lower().strip()

        if action == "turn-on-led":
            actions["relay3"] = True

        elif action == "turn-off-led":
            actions["relay3"] = False

        elif action in ("turn-on-fan", "turn-on-fan-humidity"):
            actions["relay1"] = True

        elif action == "turn-off-fan":
            actions["relay1"] = False

        elif action == "turn-on-pump":
            actions["relay2"] = True

        elif action == "turn-off-pump":
            actions["relay2"] = False

    return actions


def is_daytime(rules):

    schedule = rules.get("schedule", {})
    day_start = schedule.get("dayStartHour", 6)
    day_end = schedule.get("dayEndHour", 22)
    hour = datetime.now().hour

    if day_start < day_end:
        return day_start <= hour < day_end

    return hour >= day_start or hour < day_end


def context_to_actions(context, rules):

    actions = {
        "led": False,
        "buzzer": False,
        "relay1": False,
        "relay2": False,
        "relay3": False,
    }

    if context.get("temperature") == "HOT" or context.get("humidity") == "WET":
        actions["relay1"] = True

    if context.get("soil") == "DRY":
        actions["relay2"] = True

    if context.get("light") == "LOW" and is_daytime(rules):
        actions["relay3"] = True

    return actions


def plan_has_relay_commands(plan):

    relay_actions = {
        "turn-on-led",
        "turn-off-led",
        "turn-on-fan",
        "turn-off-fan",
        "turn-on-fan-humidity",
        "turn-on-pump",
        "turn-off-pump",
    }

    for action in plan:
        if action.lower().strip() in relay_actions:
            return True

    return False


if __name__ == "__main__":

    test_plan = [
        "turn-on-led",
        "turn-on-fan"
    ]

    print(plan_to_actions(test_plan))

    context = {
        "light": "NORMAL",
        "temperature": "HOT",
        "humidity": "NORMAL",
        "soil": "DRY",
    }

    rules = {
        "schedule": {"dayStartHour": 6, "dayEndHour": 22}
    }

    print(context_to_actions(context, rules))
