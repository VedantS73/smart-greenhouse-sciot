#!/usr/bin/env python3

import os

PDDL_FILE = os.path.join(
    os.path.dirname(__file__),
    "../pddl/problem.pddl"
)


def generate_problem(context, goal):

    predicates = []

    # ----------------------------
    # LIGHT
    # ----------------------------

    if context["light"] == "LOW":
        predicates.append("(low-light)")

    elif context["light"] == "HIGH":
        predicates.append("(adequate-light)")

    # ----------------------------
    # TEMPERATURE
    # ----------------------------

    if context["temperature"] == "HOT":
        predicates.append("(high-temperature)")

    else:
        predicates.append("(normal-temperature)")

    # ----------------------------
    # SOIL
    # ----------------------------

    if context["soil"] == "DRY":
        predicates.append("(low-moisture)")

    else:
        predicates.append("(adequate-moisture)")

    # ----------------------------
    # MOTION
    # ----------------------------

    if context["motion"] == "DETECTED":
        predicates.append("(motion-detected)")

    # ----------------------------
    # GOALS
    # ----------------------------

    goals = []

    if goal["light"] == "NORMAL":
        goals.append("(led-on)")

    if goal["temperature"] == "NORMAL":
        goals.append("(fan-on)")

    # ----------------------------
    # WRITE FILE
    # ----------------------------

    text = f"""(define (problem greenhouse-problem)

(:domain smart-greenhouse)

(:objects
)

(:init
    {' '.join(predicates)}
)

(:goal
    (and
        {' '.join(goals)}
    )
)

)
"""

    with open(PDDL_FILE, "w") as f:
        f.write(text)

    print("\nGenerated problem.pddl")
    print(text)


# -------------------------------------------------------
# Test
# -------------------------------------------------------

if __name__ == "__main__":

    context = {
        "light": "LOW",
        "temperature": "HOT",
        "soil": "DRY",
        "motion": "NONE"
    }

    goal = {
        "light": "NORMAL",
        "temperature": "NORMAL"
    }

    generate_problem(context, goal)