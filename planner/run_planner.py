#!/usr/bin/env python3

import os

DOMAIN = os.path.join(
    os.path.dirname(__file__),
    "../pddl/domain.pddl"
)

PROBLEM = os.path.join(
    os.path.dirname(__file__),
    "../pddl/problem.pddl"
)


def get_plan():

    print("\n================================")
    print("Planner Placeholder")
    print("================================")

    print("Domain :", DOMAIN)
    print("Problem:", PROBLEM)

    print("\nNext step:")
    print("Call Fast Downward")

    return [
        "turn-on-led"
    ]


if __name__ == "__main__":

    plan = get_plan()

    print("\nReturned Plan")

    for action in plan:
        print(action)