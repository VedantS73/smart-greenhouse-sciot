(define (problem greenhouse-problem)

    (:domain smart-greenhouse)

    (:init
        (nighttime) (light-normal) (temperature-normal) (humidity-high) (soil-normal)
    )

    (:goal
        (and
            (fan-on)
        )
    )

)
