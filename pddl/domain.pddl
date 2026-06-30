(define (domain smart-greenhouse)

    (:requirements :strips)

    (:predicates

        ;; -----------------------------
        ;; Environment State
        ;; -----------------------------

        (light-low)
        (light-normal)

        (temperature-high)
        (temperature-normal)

        (soil-dry)
        (soil-normal)

        ;; -----------------------------
        ;; Device State
        ;; -----------------------------

        (led-on)
        (fan-on)
        (pump-on)
    )

    ;; ==================================================
    ;; LED
    ;; ==================================================

    (:action turn-on-led

        :parameters ()

        :precondition
            (and
                (light-low)
                (not (led-on))
            )

        :effect
            (led-on)
    )

    (:action turn-off-led

        :parameters ()

        :precondition
            (and
                (light-normal)
                (led-on)
            )

        :effect
            (not (led-on))
    )

    ;; ==================================================
    ;; FAN
    ;; ==================================================

    (:action turn-on-fan

        :parameters ()

        :precondition
            (and
                (temperature-high)
                (not (fan-on))
            )

        :effect
            (fan-on)
    )

    (:action turn-off-fan

        :parameters ()

        :precondition
            (and
                (temperature-normal)
                (fan-on)
            )

        :effect
            (not (fan-on))
    )

    ;; ==================================================
    ;; PUMP
    ;; ==================================================

    (:action turn-on-pump

        :parameters ()

        :precondition
            (and
                (soil-dry)
                (not (pump-on))
            )

        :effect
            (pump-on)
    )

    (:action turn-off-pump

        :parameters ()

        :precondition
            (and
                (soil-normal)
                (pump-on)
            )

        :effect
            (not (pump-on))
    )

)