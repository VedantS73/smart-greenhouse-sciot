#!/usr/bin/env python3

import os

PDDL_FILE = os.path.join(
    os.path.dirname(__file__),
    "../pddl/problem.pddl"
)


def generate_problem(context):

    init = []

    # -----------------------------
    # LIGHT
    # -----------------------------

    if context["light"] == "LOW":
        init.append("(light-low)")
    else:
        init.append("(light-normal)")

    # -----------------------------
    # TEMPERATURE
    # -----------------------------

    if context["temperature"] == "HOT":
        init.append("(temperature-high)")
    else:
        init.append("(temperature-normal)")

    # -----------------------------
    # SOIL
    # -----------------------------

    if context["soil"] == "DRY":
        init.append("(soil-dry)")
    else:
        init.append("(soil-normal)")

    # -----------------------------
    # DEVICE STATES
    # -----------------------------

    #
    # Initially assume everything OFF
    #

    # Nothing is written here because
    # under the Closed World Assumption
    # predicates not listed are FALSE.

    # -----------------------------
    # GOAL
    # -----------------------------

    goal = []

    #
    # We always want
    #

    goal.append("(led-on)")
    goal.append("(not (fan-on))")
    goal.append("(not (pump-on))")

    # -----------------------------
    # WRITE FILE
    # -----------------------------

    text = f"""
(define (problem greenhouse-problem)

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


# ----------------------------------------------------
# TEST
# ----------------------------------------------------

if __name__ == "__main__":

    context = {

        "light": "LOW",

        "temperature": "HOT",

        "soil": "DRY"

    }

    print(generate_problem(context))