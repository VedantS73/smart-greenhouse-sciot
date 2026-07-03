#!/usr/bin/env python3

import os

PDDL_FILE = os.path.join(
    os.path.dirname(__file__),
    "../pddl/problem.pddl"
)


def generate_problem(context):

    init = []
    goal = []


    from datetime import datetime

    hour = datetime.now().hour

    if 6 <= hour < 22:
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
        "soil": "DRY"
    }

    print(generate_problem(context))