(define (domain smart-greenhouse)

    (:requirements :strips :typing)

    (:types
        greenhouse
        actuator
    )

    (:predicates
        (high-temperature)
        (normal-temperature)

        (low-light)
        (adequate-light)

        (low-moisture)
        (adequate-moisture)

        (motion-detected)

        (led-on)
        (fan-on)
    )

    (:action turn-on-led
        :parameters ()
        :precondition (and
            (low-light)
        )
        :effect (and
            (led-on)
        )
    )

)