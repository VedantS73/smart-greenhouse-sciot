import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import io from 'socket.io-client';
import Dashboard from './components/Dashboard';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

const emptySensors = {
  readings: {},
  meta: {}
};

const defaultRules = {
  temperature: { coldBelow: 20, hotAbove: 30 },
  humidity: { dryBelow: 40, wetAbove: 70 },
  light: { lowBelow: 200, highAbove: 350 },
  soil: { dryBelow: 450, wetAbove: 650 },
  security: { intrusionLightBelow: 200, criticalTempAbove: 40, buzzerOnIntrusion: true, buzzerOnOverheat: true },
  schedule: { dayStartHour: 6, dayEndHour: 22 }
};

const defaultPorts = {
  sensors: {
    sound: 0,
    light: 1,
    moisture: 2,
    temperatureHumidity: 7,
    motion: 8
  },
  actuators: {
    buzzer: 2,
    relay1: 4,
    led: 3,
    relay2: 5,
    relay3: 6
  }
};

function App() {
  const [data, setData] = useState({
    sensors: emptySensors,
    actuators: { led: false, relay1: false, relay2: false, relay3: false, buzzer: false },
    planner: { context: {}, goal: {}, actions: {}, auto_mode: true, action_mismatch: {} },
    health: {},
    history: { temperature: [], humidity: [], light: [] },
    events: [],
    rules: defaultRules,
    ports: defaultPorts
  });
  const [connected, setConnected] = useState(false);
  const [actuatorFeedback, setActuatorFeedback] = useState({});
  const [pendingActuators, setPendingActuators] = useState({});
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10
    });

    setSocket(s);

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('initial_data', (initialData) => {
      setData({
        sensors: initialData.sensors || emptySensors,
        actuators: initialData.actuators || {},
        planner: initialData.planner || {},
        health: initialData.health || {},
        history: initialData.history || {},
        events: initialData.events || [],
        rules: initialData.rules || defaultRules,
        ports: initialData.ports || defaultPorts
      });
    });

    s.on('sensor_update', (sensors) => {
      setData((prev) => ({ ...prev, sensors }));
    });

    s.on('actuator_update', (actuators) => {
      setData((prev) => ({ ...prev, actuators }));
    });

    s.on('planner_update', (planner) => {
      setData((prev) => ({ ...prev, planner }));
    });

    s.on('health_update', (health) => {
      setData((prev) => ({ ...prev, health }));
    });

    s.on('history_update', (history) => {
      setData((prev) => ({ ...prev, history }));
    });

    s.on('event_log_update', (events) => {
      setData((prev) => ({ ...prev, events }));
    });

    s.on('rules_update', (rules) => {
      setData((prev) => ({ ...prev, rules }));
    });

    s.on('ports_update', (ports) => {
      setData((prev) => ({ ...prev, ports }));
    });

    s.on('actuator_ack', ({ device }) => {
      const labels = { led: 'Alarm LED', relay1: 'Fan', relay2: 'Pump', relay3: 'Grow Light', buzzer: 'Buzzer' };
      message.success(`${labels[device] || device} confirmed`, 1);
      setPendingActuators((prev) => {
        const next = { ...prev };
        delete next[device];
        return next;
      });
      setActuatorFeedback((prev) => ({
        ...prev,
        [device]: { status: 'ok', message: 'Confirmed' }
      }));
      setTimeout(() => {
        setActuatorFeedback((prev) => {
          const next = { ...prev };
          delete next[device];
          return next;
        });
      }, 1500);
    });

    s.on('actuator_nack', ({ device, reason, actual }) => {
      const messages = {
        timeout: 'Hardware did not respond',
        hardware_mismatch: 'Hardware state mismatch',
        auto_mode_active: 'Switch to MANUAL mode first'
      };
      const labels = { led: 'Alarm LED', relay1: 'Fan', relay2: 'Pump', relay3: 'Grow Light', buzzer: 'Buzzer' };
      message.error(`${labels[device] || device}: ${messages[reason] || 'Command failed'}`);
      setPendingActuators((prev) => {
        const next = { ...prev };
        delete next[device];
        return next;
      });
      if (actual !== undefined) {
        setData((prev) => ({
          ...prev,
          actuators: { ...prev.actuators, [device]: actual }
        }));
      }
      setActuatorFeedback((prev) => ({
        ...prev,
        [device]: {
          status: 'error',
          message: messages[reason] || 'Command failed'
        }
      }));
    });

    return () => {
      s.disconnect();
    };
  }, []);

  if (!socket) {
    return null;
  }

  const handleRulesSaved = () => {
    message.success('Rules updated and applied');
  };

  const handlePortsSaved = () => {
    message.success('Port mapping updated and applied');
  };

  const handleActuatorToggle = (device, state) => {
    setPendingActuators((prev) => ({ ...prev, [device]: true }));
    setData((prev) => ({
      ...prev,
      actuators: { ...prev.actuators, [device]: state }
    }));
    setActuatorFeedback((prev) => {
      const next = { ...prev };
      delete next[device];
      return next;
    });
    socket.emit(`toggle_${device}`, state);
  };

  return (
    <div className="app">
      <Dashboard
        data={data}
        socket={socket}
        connected={connected}
        actuatorFeedback={actuatorFeedback}
        setActuatorFeedback={setActuatorFeedback}
        pendingActuators={pendingActuators}
        onActuatorToggle={handleActuatorToggle}
        onRulesSaved={handleRulesSaved}
        onPortsSaved={handlePortsSaved}
      />
    </div>
  );
}

export default App;
