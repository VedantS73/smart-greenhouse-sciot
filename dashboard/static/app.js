let tempChart =
new Chart(
    document.getElementById("tempChart"),
    {
        type:'line',
        data:{
            labels:[],
            datasets:[{
                label:'Temperature',
                data:[]
            }]
        }
    }
)

let humChart =
new Chart(
    document.getElementById("humChart"),
    {
        type:'line',
        data:{
            labels:[],
            datasets:[{
                label:'Humidity',
                data:[]
            }]
        }
    }
)

let lightChart =
new Chart(
    document.getElementById("lightChart"),
    {
        type:'line',
        data:{
            labels:[],
            datasets:[{
                label:'Light',
                data:[]
            }]
        }
    }
)

function setManualControls(enabled){

    document.getElementById(
        "led_btn"
    ).disabled = !enabled

    document.getElementById(
        "relay1_btn"
    ).disabled = !enabled

    document.getElementById(
        "relay2_btn"
    ).disabled = !enabled
}

function buildPlannerText(planner){

    if(!planner){
        return "Waiting for planner..."
    }

    let text = ""

    text += "Context\n"
    text += "----------------\n"

    if(planner.context){

        Object.keys(
            planner.context
        ).forEach(key => {

            text +=
                key +
                " : " +
                planner.context[key] +
                "\n"
        })
    }

    text += "\nGoal\n"
    text += "----------------\n"

    if(planner.goal){

        Object.keys(
            planner.goal
        ).forEach(key => {

            text +=
                key +
                " : " +
                planner.goal[key] +
                "\n"
        })
    }

    text += "\nActions\n"
    text += "----------------\n"

    if(planner.actions){

        Object.keys(
            planner.actions
        ).forEach(key => {

            text +=
                key +
                " : " +
                (
                    planner.actions[key]
                    ? "ON"
                    : "OFF"
                ) +
                "\n"
        })
    }

    text += "\nMode\n"
    text += "----------------\n"

    text +=
        planner.auto_mode
        ? "AUTO"
        : "MANUAL"

    return text
}

function update(){

    fetch('/api/status')

    .then(
        response => response.json()
    )

    .then(data => {

        document.getElementById(
            "temp"
        ).innerHTML =
        data.temperature

        document.getElementById(
            "humidity"
        ).innerHTML =
        data.humidity

        document.getElementById(
            "light"
        ).innerHTML =
        data.light

        document.getElementById(
            "sound"
        ).innerHTML =
        data.sound

        document.getElementById(
            "moisture"
        ).innerHTML =
        data.moisture

        document.getElementById(
            "motion"
        ).innerHTML =
        data.motion
        ? "Detected"
        : "None"

        document.getElementById(
            "led_state"
        ).innerHTML =
        data.led
        ? "ON"
        : "OFF"

        document.getElementById(
            "relay_state"
        ).innerHTML =
        data.relay1
        ? "ON"
        : "OFF"

        document.getElementById(
            "relay2_state"
        ).innerHTML =
        data.relay2
        ? "ON"
        : "OFF"

        document.getElementById(
            "health"
        ).innerHTML =
        data.health + "%"

        document.getElementById(
            "publisher"
        ).innerHTML =
        data.publisher
        ? "ONLINE"
        : "OFFLINE"

        document.getElementById(
            "actuator"
        ).innerHTML =
        data.actuator
        ? "ONLINE"
        : "OFFLINE"

        document.getElementById(
            "events"
        ).innerHTML =
        data.events.join("<br>")

        document.getElementById(
            "planner"
        ).textContent =
        buildPlannerText(
            data.planner
        )

        document.getElementById(
            "mode"
        ).innerHTML =
        data.mode

        if(data.mode === "AUTO"){

            document.getElementById(
                "mode"
            ).className =
            "big mode-auto"

            setManualControls(
                false
            )

        }else{

            document.getElementById(
                "mode"
            ).className =
            "big mode-manual"

            setManualControls(
                true
            )
        }

        tempChart.data.labels =
        data.temp_history.map(
            (_,i) => i
        )

        tempChart.data.datasets[0].data =
        data.temp_history

        tempChart.update()

        humChart.data.labels =
        data.humidity_history.map(
            (_,i) => i
        )

        humChart.data.datasets[0].data =
        data.humidity_history

        humChart.update()

        lightChart.data.labels =
        data.light_history.map(
            (_,i) => i
        )

        lightChart.data.datasets[0].data =
        data.light_history

        lightChart.update()

    })

    .catch(error => {

        console.log(
            "Dashboard Error:",
            error
        )
    })
}

function toggleLED(){

    fetch(
        '/toggle_led'
    )
}

function toggleRelay(){

    fetch(
        '/toggle_relay'
    )
}

function toggleRelay2(){

    fetch(
        '/toggle_relay2'
    )
}

function toggleMode(){

    fetch(
        '/toggle_mode'
    )
}

setInterval(
    update,
    2000
)

update()
