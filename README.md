# Smart Greenhouse

MQTT-based smart greenhouse system for Raspberry Pi with Grove sensors, relay actuators, an AI planner (PDDL), security alarms, and a React dashboard.

For deployment and development setup, see [DEPLOY.md](DEPLOY.md).

## Hardware

This project targets a **Raspberry Pi** with a **Grove Pi+** hat and standard Grove modules. Port numbers below are **Grove Pi connector ports** as used by the `grovepi` Python library (the number printed on the Grove Pi board next to each socket).

### Sensors

Connect each Grove module to the port listed below. Default mappings are stored in [`config/ports.json`](config/ports.json) and loaded by the sensor node.

| Grove Pi port | Grove module | MQTT / dashboard field | Notes |
|---------------|--------------|------------------------|-------|
| **A0** (port `0`) | Grove Sound Sensor | `sound` | Analog read |
| **A1** (port `1`) | Grove Light Sensor | `light` | Analog read; lower = brighter |
| **A2** (port `2`) | Grove Moisture Sensor | `moisture` | Analog read; soil moisture |
| **D7** (port `7`) | Grove Temperature & Humidity Sensor (DHT) | `temperature`, `humidity` | Blue DHT module (DHT11/DHT22) |
| **D8** (port `8`) | Grove PIR Motion Sensor | `motion` | Digital input; `true` = motion detected |

**Quick wiring checklist**

```
A0  →  Sound Sensor
A1  →  Light Sensor
A2  →  Moisture Sensor
D7  →  Temp & Humidity (DHT)
D8  →  PIR Motion Sensor
```

Sensor data is published every 2 seconds on MQTT topic `greenhouse/sensors`.

### Actuators

Connect relays, LED, and buzzer to the ports below. Default mappings are stored in [`config/ports.json`](config/ports.json) and loaded by the actuator node.

| Grove Pi port | Code name | Dashboard label | Used for |
|---------------|-----------|-----------------|----------|
| **D2** (port `2`) | `buzzer` | Buzzer | Security alarm sound |
| **D4** (port `4`) | `relay1` | Fan | Ventilation (planner turns on when hot or humid) |
| **D3** (port `3`) | `led` | LED | Security alarm indicator light |
| **D5** (port `5`) | `relay2` | Pump | Water pump (planner turns on when soil is dry) |
| **D6** (port `6`) | `relay3` | Grow Light | Grow light relay (planner turns on when light is low during daytime) |

**Quick wiring checklist**

```
D2  →  Buzzer
D4  →  Relay 1  →  Fan
D3  →  LED       →  Alarm / status light
D5  →  Relay 2  →  Water pump
D6  →  Relay 3  →  Grow light
```

Actuator commands arrive on MQTT topic `greenhouse/actions`. The actuator node reports state back on `greenhouse/actuator_status`.

> **Note:** The planner maps the PDDL action `turn-on-led` to **relay3 (Grow Light)**, not the standalone LED on D3. The LED on D3 and buzzer on D2 are mainly driven by the **security node** during intrusion or over-temperature alarms.

## Planner behavior (what triggers what)

| Condition | Actuator action |
|-----------|-----------------|
| Light too low (during day) | Grow Light ON (`relay3`) |
| Temperature too high | Fan ON (`relay1`) |
| Humidity too high | Fan ON (`relay1`) |
| Soil too dry | Pump ON (`relay2`) |
| Motion at night + low light | LED + Buzzer ON (security) |
| Critical temperature | LED + Buzzer ON (security) |

Thresholds for these rules can be changed live from the dashboard **Rules Setup** modal (control icon in the header). Values are stored in [`config/rules.json`](config/rules.json).

## Project layout

| Path | Role |
|------|------|
| `sensor_node/publisher.py` | Reads Grove sensors, publishes MQTT |
| `actuator_node/actuator_subscriber.py` | Controls relays/LED/buzzer |
| `planner/` | AI planner — context rules + PDDL |
| `security_node/security_node.py` | Intrusion and over-temp alarms |
| `server.js` | MQTT ↔ Socket.IO bridge + dashboard server |
| `frontend/` | React dashboard (build output in `frontend/build`) |
| `config/rules.json` | Editable planner/security thresholds |
| `config/ports.json` | Editable sensor/actuator Grove port mappings |

## Running

```bash
# Full stack on Pi
./smart_greenhouse.sh

# Local development
npm run dev
```

Dashboard: **http://\<pi-ip\>:5000**

## Changing ports

You can change mappings in two ways:

1. **Dashboard (recommended):** click **Port mapping** (network icon in header), edit ports, then **Save & Apply**.
   - This updates [`config/ports.json`](config/ports.json) and publishes live updates over MQTT.
   - Sensor and actuator nodes apply the new mappings immediately.
2. **Manual file edit:** update [`config/ports.json`](config/ports.json) directly.

Live updates use MQTT topic `greenhouse/ports_config`.
