#!/usr/bin/env python3

import subprocess
import os

BASE = os.path.dirname(__file__)

DOMAIN = os.path.join(BASE, "../pddl/domain.pddl")
PROBLEM = os.path.join(BASE, "../pddl/problem.pddl")
PLAN_FILE = PROBLEM + ".soln"


def run_planner():

    # Remove old plan
    if os.path.exists(PLAN_FILE):
        os.remove(PLAN_FILE)

    command = [
        "python3",
        "-m",
        "pyperplan",
        DOMAIN,
        PROBLEM
    ]

    try:
        subprocess.run(command, check=True)

    except subprocess.CalledProcessError:
        print("Planning failed")
        return []

    if not os.path.exists(PLAN_FILE):
        print("Plan file not found")
        return []

    actions = []

    with open(PLAN_FILE, "r") as f:

        for line in f:

            line = line.strip()

            if not line:
                continue

            if line.startswith(";"):
                continue

            actions.append(
                line.replace("(", "")
                    .replace(")", "")
            )

    return actions


if __name__ == "__main__":

    plan = run_planner()

    print("\nReturned Plan")
    print("----------------")

    for action in plan:
        print(action)