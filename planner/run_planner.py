#!/usr/bin/env python3

import os
import requests

DOMAIN_FILE = os.path.join(
    os.path.dirname(__file__),
    "../pddl/domain.pddl"
)

PROBLEM_FILE = os.path.join(
    os.path.dirname(__file__),
    "../pddl/problem.pddl"
)

SOLVER_URL = "https://solver.planning.domains/solve"


def run_planner():

    # -------------------------
    # Read PDDL files
    # -------------------------

    with open(DOMAIN_FILE, "r") as f:
        domain = f.read()

    with open(PROBLEM_FILE, "r") as f:
        problem = f.read()

    payload = {
        "domain": domain,
        "problem": problem
    }

    try:

        response = requests.post(
            SOLVER_URL,
            json=payload,
            timeout=30
        )

        response.raise_for_status()

        result = response.json()

    except Exception as e:

        print("Planner request failed:")
        print(e)
        return []

    # -------------------------
    # Check planner response
    # -------------------------

    if result.get("status") != "ok":

        print("Planning failed")
        print(result)
        return []

    plan = []

    planner_result = result.get("result", {})

    for action in planner_result.get("plan", []):

        if "name" in action:
            plan.append(action["name"])

        elif "action" in action:
            plan.append(action["action"])

    return plan


if __name__ == "__main__":

    actions = run_planner()

    print("\nReturned Plan\n")

    for action in actions:
        print(action)