from flask import Flask, render_template_string, jsonify
from flask_socketio import SocketIO
import paho.mqtt.client as mqtt
import json, time

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

BROKER = "localhost"

sensor_data = {
    "temperature": 0,
    "humidity": 0,
    "light": 0,
    "sound": 0,
    "motion": False
}

actuator_state = {"led": False, "relay": False}
heartbeats = {}
event_log = []
mode = "MANUAL"

temp_history = []
humidity_history = []
light_history = []

def online(service):
    return service in heartbeats and (time.time() - heartbeats[service] < 20)

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

    return max(score, 0)

publisher = mqtt.Client()
publisher.connect(BROKER, 1883, 60)

def push_update():
    socketio.emit("dashboard_update", {
        "sensor": sensor_data,
        "actuator": actuator_state,
        "events": event_log[:20],
        "health": greenhouse_health(),
        "publisher": online("publisher"),
        "actuator_online": online("actuator"),
        "mode": mode,
        "temp_history": temp_history,
        "humidity_history": humidity_history,
        "light_history": light_history
    })

def on_message(client, userdata, msg):
    global sensor_data, actuator_state

    payload = json.loads(msg.payload.decode())
    print("MQTT:", msg.topic, payload)
    if msg.topic == "greenhouse/sensors":
        sensor_data = payload

        temp_history.append(payload["temperature"])
        humidity_history.append(payload["humidity"])
        light_history.append(payload["light"])

        if len(temp_history) > 50:
            temp_history.pop(0)
            humidity_history.pop(0)
            light_history.pop(0)

    elif msg.topic == "greenhouse/actuator_status":
        actuator_state = payload

    elif msg.topic == "greenhouse/status":
        heartbeats[payload["service"]] = payload["timestamp"]

    elif msg.topic == "greenhouse/events":
        event_log.insert(0, payload["message"])
        if len(event_log) > 50:
            event_log.pop()

    push_update()

mqtt_client = mqtt.Client()
mqtt_client.on_message = on_message
mqtt_client.connect(BROKER,1883,60)

for t in [
    "greenhouse/sensors",
    "greenhouse/actuator_status",
    "greenhouse/status",
    "greenhouse/events"
]:
    mqtt_client.subscribe(t)

mqtt_client.loop_start()

HTML = """
<!DOCTYPE html>
<html>
<head>
<title>Smart Greenhouse</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.5/socket.io.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
body{background:#0f172a;color:white;font-family:Arial;margin:20px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}
.card,.panel{background:#1e293b;padding:15px;border-radius:12px}
.big{font-size:28px;font-weight:bold}
button{padding:10px;border-radius:8px;border:none;cursor:pointer}
canvas{background:white;border-radius:8px}
</style>
</head>
<body>

<h1>🌱 Smart Greenhouse Control Center</h1>

<div class="grid">
<div class="card"><h3>Temperature</h3><div id="temp" class="big">0</div></div>
<div class="card"><h3>Humidity</h3><div id="humidity" class="big">0</div></div>
<div class="card"><h3>Light</h3><div id="light" class="big">0</div></div>
<div class="card"><h3>Sound</h3><div id="sound" class="big">0</div></div>
</div><br>

<div class="grid">
<div class="card"><h3>Motion</h3><div id="motion" class="big">None</div></div>
<div class="card"><h3>LED</h3><div id="led" class="big">OFF</div><button onclick="toggleLED()">Toggle</button></div>
<div class="card"><h3>Relay</h3><div id="relay" class="big">OFF</div><button onclick="toggleRelay()">Toggle</button></div>
<div class="card"><h3>Health</h3><div id="health" class="big">100%</div></div>
</div>

<div class="panel">
<h2>System Status</h2>
Publisher: <span id="pub"></span><br>
Actuator: <span id="act"></span><br>
Mode: <span id="mode"></span>
<button onclick="toggleMode()">Toggle Mode</button>
</div>

<div class="panel"><h2>Temperature</h2><canvas id="tempChart"></canvas></div>
<div class="panel"><h2>Humidity</h2><canvas id="humChart"></canvas></div>
<div class="panel"><h2>Light</h2><canvas id="lightChart"></canvas></div>

<div class="panel">
<h2>Planner Panel</h2>
Waiting for planner integration...
</div>

<div class="panel">
<h2>Activity Log</h2>
<div id="events"></div>
</div>

<script>
const socket = io();

let tempChart = new Chart(document.getElementById("tempChart"),{
type:'line',data:{labels:[],datasets:[{label:'Temperature',data:[]}]} });

let humChart = new Chart(document.getElementById("humChart"),{
type:'line',data:{labels:[],datasets:[{label:'Humidity',data:[]}]} });

let lightChart = new Chart(document.getElementById("lightChart"),{
type:'line',data:{labels:[],datasets:[{label:'Light',data:[]}]} });

socket.on("dashboard_update", function(d){

document.getElementById("temp").innerHTML=d.sensor.temperature;
document.getElementById("humidity").innerHTML=d.sensor.humidity;
document.getElementById("light").innerHTML=d.sensor.light;
document.getElementById("sound").innerHTML=d.sensor.sound;
document.getElementById("motion").innerHTML=d.sensor.motion?"Detected":"None";

document.getElementById("led").innerHTML=d.actuator.led?"ON":"OFF";
document.getElementById("relay").innerHTML=d.actuator.relay?"ON":"OFF";

document.getElementById("health").innerHTML=d.health+"%";
document.getElementById("pub").innerHTML=d.publisher?"ONLINE":"OFFLINE";
document.getElementById("act").innerHTML=d.actuator_online?"ONLINE":"OFFLINE";
document.getElementById("mode").innerHTML=d.mode;

document.getElementById("events").innerHTML=d.events.join("<br>");

tempChart.data.labels=d.temp_history.map((_,i)=>i);
tempChart.data.datasets[0].data=d.temp_history;
tempChart.update();

humChart.data.labels=d.humidity_history.map((_,i)=>i);
humChart.data.datasets[0].data=d.humidity_history;
humChart.update();

lightChart.data.labels=d.light_history.map((_,i)=>i);
lightChart.data.datasets[0].data=d.light_history;
lightChart.update();
});

function toggleLED(){ fetch('/toggle_led'); }
function toggleRelay(){ fetch('/toggle_relay'); }
function toggleMode(){ fetch('/toggle_mode'); }
</script>
</body>
</html>
"""

@app.route("/")
def home():
    return render_template_string(HTML)

@app.route("/toggle_led")
def toggle_led():
    publisher.publish("greenhouse/actions",
                      json.dumps({"led": not actuator_state["led"]}))
    return "ok"

@app.route("/toggle_relay")
def toggle_relay():
    publisher.publish("greenhouse/actions",
                      json.dumps({"relay": not actuator_state["relay"]}))
    return "ok"

@app.route("/toggle_mode")
def toggle_mode():
    global mode
    mode = "AUTO" if mode == "MANUAL" else "MANUAL"
    push_update()
    return "ok"

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)
