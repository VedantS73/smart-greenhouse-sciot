(define (problem greenhouse-problem)

    (:domain smart-greenhouse)

    (:init
        (nighttime) (light-normal) (temperature-high) (humidity-normal) (soil-dry)
    )

    (:goal
        (and
            (fan-on) (pump-on)
        )
    )

)
