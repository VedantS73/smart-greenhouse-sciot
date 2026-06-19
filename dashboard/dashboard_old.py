from flask import Flask, render_template_string, jsonify, request
import paho.mqtt.client as mqtt
import json
import time
from flask_socketio import SocketIO

app = Flask(__name__)

socketio = SocketIO(
    app,
    cors_allowed_origins="*"
)

BROKER = "localhost"

# ----------------------------
# DATA STORES
# ----------------------------

sensor_data = {
    "temperature": 0,
    "humidity": 0,
    "light": 0,
    "sound": 0,
    "moisture": 0,
    "motion": False
}

actuator_state = {
    "led": False,
    "relay1": False,
    "relay2": False
}

heartbeats = {}

event_log = []

mode = "AUTO"

temp_history = []
humidity_history = []
light_history = []

# ----------------------------
# MQTT CALLBACK
# ----------------------------

def on_message(client, userdata, msg):

    global sensor_data
    global actuator_state

    topic = msg.topic

    payload = json.loads(
        msg.payload.decode()
    )

    if topic == "greenhouse/sensors":

        sensor_data = payload

        temp_history.append(
            payload["temperature"]
        )

        humidity_history.append(
            payload["humidity"]
        )

        light_history.append(
            payload["light"]
        )

        if len(temp_history) > 30:
            temp_history.pop(0)

        if len(humidity_history) > 30:
            humidity_history.pop(0)

        if len(light_history) > 30:
            light_history.pop(0)

    elif topic == "greenhouse/actuator_status":

        actuator_state = payload

    elif topic == "greenhouse/status":

        heartbeats[
            payload["service"]
        ] = payload["timestamp"]

    elif topic == "greenhouse/events":

        event_log.insert(
            0,
            payload["message"]
        )

        if len(event_log) > 20:
            event_log.pop()


mqtt_client = mqtt.Client()

mqtt_client.on_message = on_message

mqtt_client.connect(
    BROKER,
    1883,
    60
)

mqtt_client.subscribe(
    "greenhouse/sensors"
)

mqtt_client.subscribe(
    "greenhouse/actuator_status"
)

mqtt_client.subscribe(
    "greenhouse/status"
)

mqtt_client.subscribe(
    "greenhouse/events"
)

mqtt_client.loop_start()

publisher = mqtt.Client()
publisher.connect(
    BROKER,
    1883,
    60
)

# ----------------------------
# HELPERS
# ----------------------------

def online(service):

    if service not in heartbeats:
        return False

    return (
        time.time() -
        heartbeats[service]
    ) < 20


def greenhouse_health():

    score = 100

    t = sensor_data["temperature"]
    h = sensor_data["humidity"]
    l = sensor_data["light"]

    if t < 18 or t > 32:
        score -= 20

    if h < 40:
        score -= 20

    if l < 150:
        score -= 20

    return max(score,0)

# ----------------------------
# HTML
# ----------------------------

HTML = """

<!DOCTYPE html>

<html>

<head>

<title>Smart Greenhouse</title>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>

body{
background:#0f172a;
color:white;
font-family:Arial;
margin:20px;
}

h1{
text-align:center;
}

.grid{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:20px;
}

.card{
background:#1e293b;
padding:20px;
border-radius:15px;
text-align:center;
}

.big{
font-size:30px;
font-weight:bold;
}

.panel{
background:#1e293b;
padding:20px;
border-radius:15px;
margin-top:20px;
}

button{
padding:10px;
border:none;
border-radius:8px;
cursor:pointer;
margin:5px;
}

.toggle{
background:#2563eb;
color:white;
}

.online{
color:#22c55e;
}

.offline{
color:#ef4444;
}

</style>

</head>

<body>

<h1>🌱 Smart Greenhouse Control Center</h1>

<div class="grid">

<div class="card">
<h3>Temperature</h3>
<div id="temp" class="big">0</div>
</div>

<div class="card">
<h3>Humidity</h3>
<div id="humidity" class="big">0</div>
</div>

<div class="card">
<h3>Light</h3>
<div id="light" class="big">0</div>
</div>

<div class="card">
<h3>Sound</h3>
<div id="sound" class="big">0</div>
</div>

<div class="card">
<h3>Moisture</h3>
<div id="moisture" class="big">0</div>
</div>

</div>

<br>

<div class="grid">

<div class="card">
<h3>Motion</h3>
<div id="motion" class="big">None</div>
</div>

<div class="card">
<h3>LED</h3>
<div id="led_state" class="big">OFF</div>

<button
class="toggle"
onclick="toggleLED()">
Toggle
</button>

</div>

<div class="card">
<h3>Relay</h3>
<div id="relay_state" class="big">OFF</div>

<div class="card">

<h3>Relay 2</h3>

<div id="relay2_state" class="big">
OFF
</div>

<button
class="toggle"
onclick="toggleRelay2()">
Toggle
</button>

</div>
<button
class="toggle"
onclick="toggleRelay()">
Toggle
</button>

</div>

<div class="card">
<h3>Health</h3>
<div id="health" class="big">100%</div>
</div>

</div>

<div class="panel">

<h2>System Status</h2>

Publisher :
<span id="publisher"></span><br>

Actuator :
<span id="actuator"></span><br>

Dashboard :
<span class="online">ONLINE</span>

</div>

<div class="panel">

<h2>Mode</h2>

<div id="mode"></div>

<button
class="toggle"
onclick="toggleMode()">
Toggle Mode
</button>

</div>

<div class="panel">

<h2>Planner Panel</h2>

Waiting for planner integration...

</div>

<div class="panel">

<h2>Temperature Trend</h2>

<canvas id="tempChart"></canvas>

</div>

<div class="panel">

<h2>Humidity Trend</h2>

<canvas id="humChart"></canvas>

</div>

<div class="panel">

<h2>Light Trend</h2>

<canvas id="lightChart"></canvas>

</div>

<div class="panel">

<h2>Activity Log</h2>

<div id="events"></div>

</div>

<script>

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

function update(){

fetch('/api/status')
.then(r=>r.json())
.then(data=>{

document.getElementById("temp").innerHTML =
data.temperature

document.getElementById("humidity").innerHTML =
data.humidity

document.getElementById("light").innerHTML =
data.light

document.getElementById("sound").innerHTML =
data.sound

document.getElementById("moisture").innerHTML =
data.moisture

document.getElementById("motion").innerHTML =
data.motion ? "Detected":"None"

document.getElementById("led_state").innerHTML =
data.led ? "ON":"OFF"

document.getElementById("relay_state").innerHTML =
data.relay1 ? "ON":"OFF"

document.getElementById("relay2_state").innerHTML =
data.relay2 ? "ON":"OFF"

document.getElementById("health").innerHTML =
data.health + "%"

document.getElementById("publisher").innerHTML =
data.publisher ? "ONLINE":"OFFLINE"

document.getElementById("actuator").innerHTML =
data.actuator ? "ONLINE":"OFFLINE"

document.getElementById("mode").innerHTML =
data.mode

document.getElementById("events").innerHTML =
data.events.join("<br>")

tempChart.data.labels =
data.temp_history.map((_,i)=>i)

tempChart.data.datasets[0].data =
data.temp_history

tempChart.update()

humChart.data.labels =
data.humidity_history.map((_,i)=>i)

humChart.data.datasets[0].data =
data.humidity_history

humChart.update()

lightChart.data.labels =
data.light_history.map((_,i)=>i)

lightChart.data.datasets[0].data =
data.light_history

lightChart.update()

})

}

function toggleLED(){
fetch('/toggle_led')
}

function toggleRelay(){
fetch('/toggle_relay')
}

function toggleRelay2(){
fetch('/toggle_relay2')
}

function toggleMode(){
fetch('/toggle_mode')
}

setInterval(update,2000)

update()

</script>

</body>

</html>

"""

# ----------------------------
# ROUTES
# ----------------------------

@app.route("/")

def home():
    return render_template_string(HTML)

@app.route("/api/status")

def api_status():

    return jsonify({

        "temperature":
        sensor_data["temperature"],

        "humidity":
        sensor_data["humidity"],

        "light":
        sensor_data["light"],

        "sound":
        sensor_data["sound"],
    	
	"moisture":
	sensor_data["moisture"],

        "motion":
        sensor_data["motion"],

        "led":
        actuator_state["led"],

        "relay1":
        actuator_state["relay1"],
	
	"relay2":
	actuator_state["relay2"],

        "health":
        greenhouse_health(),

        "publisher":
        online("publisher"),

        "actuator":
        online("actuator"),

        "events":
        event_log,

        "mode":
        mode,

        "temp_history":
        temp_history,

        "humidity_history":
        humidity_history,

        "light_history":
        light_history

    })

@app.route("/toggle_led")

def toggle_led():

    publisher.publish(
        "greenhouse/actions",
        json.dumps({
            "led":
            not actuator_state["led"]
        })
    )

    return "ok"

@app.route("/toggle_relay")

def toggle_relay():

    publisher.publish(
        "greenhouse/actions",
        json.dumps({
            "relay1":
            not actuator_state["relay1"]
        })
    )

    return "ok"

@app.route("/toggle_relay2")

def toggle_relay2():

    publisher.publish(
        "greenhouse/actions",
        json.dumps({
            "relay2":
            not actuator_state["relay2"]
        })
    )

    return "ok"

@app.route("/toggle_mode")
def toggle_mode():

    global mode

    if mode == "MANUAL":

        mode = "AUTO"

    else:

        mode = "MANUAL"

    publisher.publish(
        "greenhouse/mode",
        json.dumps({
            "mode": mode
        })
    )

    print(
        "Mode Changed:",
        mode
    )

    return "ok"

app.run(
    host="0.0.0.0",
    port=5000
)

