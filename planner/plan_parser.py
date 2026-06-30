#!/usr/bin/env python3

def plan_to_actions(plan):

    actions = {
        "led": False,
        "relay1": False,
        "relay2": False
    }

    for action in plan:

        action = action.lower().strip()

        if action == "turn-on-led":
            actions["led"] = True

        elif action == "turn-off-led":
            actions["led"] = False

        elif action == "turn-on-fan":
            actions["relay1"] = True

        elif action == "turn-off-fan":
            actions["relay1"] = False

        elif action == "turn-on-pump":
            actions["relay2"] = True

        elif action == "turn-off-pump":
            actions["relay2"] = False

    return actions


if __name__ == "__main__":

    test_plan = [
        "turn-on-led",
        "turn-on-fan"
    ]

    print(plan_to_actions(test_plan))