(define (domain smart-greenhouse)

    (:requirements :strips)

    (:predicates

        ;; ============================================
        ;; Environment State
        ;; ============================================

        (light-low)
        (light-normal)

        (temperature-high)
        (temperature-normal)

        (humidity-high)
        (humidity-normal)

        (soil-dry)
        (soil-normal)
        
        (daytime)
        (nighttime)
        ;; ============================================
        ;; Device State
        ;; ============================================

        (led-on)
        (fan-on)
        (pump-on)
    )

    ;; ============================================
    ;; LED
    ;; ============================================

    (:action turn-on-led

        :parameters ()

        :precondition
            (and
                (light-low)
                (daytime)
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

    ;; ============================================
    ;; FAN
    ;; ============================================

    (:action turn-on-fan

        :parameters ()

        :precondition
            (temperature-high)

        :effect
            (fan-on)
    )

    (:action turn-off-fan

        :parameters ()

        :precondition
            (and
                (temperature-normal)
                (humidity-normal)
                (fan-on)
            )

        :effect
            (not (fan-on))
    )

    (:action turn-on-fan-humidity

        :parameters ()

        :precondition
            (humidity-high)

        :effect
            (fan-on)
    )



    ;; ============================================
    ;; PUMP
    ;; ============================================

    (:action turn-on-pump

        :parameters ()

        :precondition
            (soil-dry)

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