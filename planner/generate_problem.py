#!/usr/bin/env python3

import os

PDDL_FILE = os.path.join(
    os.path.dirname(__file__),
    "../pddl/problem.pddl"
)


def generate_problem(context, rules=None):

    init = []
    goal = []

    from datetime import datetime

    hour = datetime.now().hour

    schedule = (
        rules["schedule"]
        if rules
        else {"dayStartHour": 6, "dayEndHour": 22}
    )

    day_start = schedule["dayStartHour"]
    day_end = schedule["dayEndHour"]

    if day_start < day_end:
        is_daytime = day_start <= hour < day_end
    else:
        is_daytime = hour >= day_start or hour < day_end

    if is_daytime:
        init.append("(daytime)")
    else:
        init.append("(nighttime)")

    # -----------------------------
    # LIGHT
    # -----------------------------

    if context["light"] == "LOW":
        init.append("(light-low)")
        goal.append("(led-on)")
    else:
        init.append("(light-normal)")

    # -----------------------------
    # TEMPERATURE
    # -----------------------------

    if context["temperature"] == "HOT":
        init.append("(temperature-high)")
        goal.append("(fan-on)")
    else:
        init.append("(temperature-normal)")

    # -----------------------------
    # HUMIDITY
    # -----------------------------

    if context["humidity"] == "WET":
        init.append("(humidity-high)")
        goal.append("(fan-on)")
    else:
        init.append("(humidity-normal)")

    # -----------------------------
    # SOIL
    # -----------------------------

    if context["soil"] == "DRY":
        init.append("(soil-dry)")
        goal.append("(pump-on)")
    else:
        init.append("(soil-normal)")

    # -----------------------------
    # WRITE PROBLEM FILE
    # -----------------------------

    text = f"""(define (problem greenhouse-problem)

    (:domain smart-greenhouse)

    (:init
        {' '.join(init)}
    )

    (:goal
        (and
            {' '.join(goal)}
        )
    )

)
"""

    with open(PDDL_FILE, "w") as f:
        f.write(text)

    return text


if __name__ == "__main__":

    context = {
        "light": "LOW",
        "temperature": "HOT",
        "soil": "DRY",
        "humidity": "NORMAL"
    }

    print(generate_problem(context))
