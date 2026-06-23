import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Dashboard from './components/Dashboard';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

const emptySensors = {
  readings: {},
  meta: {}
};

function App() {
  const [data, setData] = useState({
    sensors: emptySensors,
    actuators: { led: false, relay1: false, relay2: false },
    planner: { context: {}, goal: {}, actions: {}, auto_mode: true, action_mismatch: {} },
    health: {},
    history: { temperature: [], humidity: [], light: [] },
    events: []
  });
  const [connected, setConnected] = useState(false);
  const [actuatorFeedback, setActuatorFeedback] = useState({});
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
        events: initialData.events || []
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

    s.on('actuator_ack', ({ device }) => {
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
      }, 2000);
    });

    s.on('actuator_nack', ({ device, reason }) => {
      const messages = {
        timeout: 'Hardware did not respond',
        hardware_mismatch: 'Hardware state mismatch',
        auto_mode_active: 'Switch to MANUAL mode first'
      };
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

  return (
    <div className="app">
      <Dashboard
        data={data}
        socket={socket}
        connected={connected}
        actuatorFeedback={actuatorFeedback}
        setActuatorFeedback={setActuatorFeedback}
      />
    </div>
  );
}

export default App;
