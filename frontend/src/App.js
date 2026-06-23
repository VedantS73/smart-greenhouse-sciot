import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Dashboard from './components/Dashboard';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000`;

const socket = io(API_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

function App() {
  const [data, setData] = useState({
    sensors: {},
    actuators: {},
    planner: {},
    health: {},
    history: {},
    events: []
  });

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connection events
    socket.on('connect', () => {
      console.log('✓ Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('✗ Disconnected from server');
      setConnected(false);
    });

    // Initial data
    socket.on('initial_data', (initialData) => {
      setData(initialData);
    });

    // Real-time updates
    socket.on('sensor_update', (sensors) => {
      setData(prev => ({ ...prev, sensors }));
    });

    socket.on('actuator_update', (actuators) => {
      setData(prev => ({ ...prev, actuators }));
    });

    socket.on('planner_update', (planner) => {
      setData(prev => ({ ...prev, planner }));
    });

    socket.on('health_update', (health) => {
      setData(prev => ({ ...prev, health }));
    });

    socket.on('history_update', (history) => {
      setData(prev => ({ ...prev, history }));
    });

    socket.on('event_log_update', (events) => {
      setData(prev => ({ ...prev, events }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('initial_data');
      socket.off('sensor_update');
      socket.off('actuator_update');
      socket.off('planner_update');
      socket.off('health_update');
      socket.off('history_update');
      socket.off('event_log_update');
    };
  }, []);

  return (
    <div className="app">
      <Dashboard 
        data={data} 
        socket={socket} 
        connected={connected}
      />
    </div>
  );
}

export default App;
