import React, { useState } from 'react';
import SensorPanel from './SensorPanel';
import ActuatorPanel from './ActuatorPanel';
import HealthStatus from './HealthStatus';
import ChartsPanel from './ChartsPanel';
import EventLog from './EventLog';
import './Dashboard.css';
import { Leaf, Zap, Activity } from 'lucide-react';

function Dashboard({ data, socket, connected }) {
  const [mode, setMode] = useState('auto');

  const handleModeToggle = () => {
    const newMode = mode === 'auto' ? 'manual' : 'auto';
    setMode(newMode);
    socket.emit('set_mode', newMode);
  };

  const getHealthScore = () => {
    const { sensors } = data;
    let score = 100;

    if (!sensors.temperature) return 0;

    const t = sensors.temperature;
    const h = sensors.humidity;
    const l = sensors.light;

    // Temperature: ideal 20-28°C
    if (t < 18 || t > 32) score -= 20;
    else if (t < 20 || t > 28) score -= 10;

    // Humidity: ideal 50-70%
    if (h < 30 || h > 80) score -= 20;
    else if (h < 50 || h > 70) score -= 10;

    // Light: ideal 200-800 lux
    if (l < 100 || l > 1000) score -= 15;

    return Math.max(0, score);
  };

  const healthScore = getHealthScore();

  return (
    <div className={`dashboard ${connected ? 'connected' : 'disconnected'}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <Leaf size={32} className="logo-icon" />
              <h1>Smart Greenhouse</h1>
            </div>
          </div>

          <div className="header-right">
            <div className={`connection-status ${connected ? 'online' : 'offline'}`}>
              <div className="status-dot"></div>
              <span>{connected ? 'Connected' : 'Offline'}</span>
            </div>

            <button 
              className={`mode-toggle ${mode}`}
              onClick={handleModeToggle}
            >
              {mode === 'auto' ? '🤖 AUTO' : '🎮 MANUAL'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Row - Health & Sensors */}
        <div className="grid-row">
          <HealthStatus score={healthScore} />
          <SensorPanel sensors={data.sensors} />
        </div>

        {/* Charts */}
        <div className="grid-row full-width">
          <ChartsPanel history={data.history} />
        </div>

        {/* Actuators & Health */}
        <div className="grid-row">
          <ActuatorPanel 
            actuators={data.actuators} 
            socket={socket}
          />
          <EventLog events={data.events} />
        </div>
      </main>

      {/* Service Health Footer */}
      <footer className="dashboard-footer">
        <div className="services-status">
          <div className="service-item">
            <span className={`status-indicator ${data.health?.publisher?.online ? 'online' : 'offline'}`}></span>
            <span>Publisher</span>
          </div>
          <div className="service-item">
            <span className={`status-indicator ${data.health?.actuator?.online ? 'online' : 'offline'}`}></span>
            <span>Actuator</span>
          </div>
          <div className="service-item">
            <span className={`status-indicator ${data.health?.planner?.online ? 'online' : 'offline'}`}></span>
            <span>Planner</span>
          </div>
        </div>
        <div className="health-score">
          <Activity size={18} />
          <span>Greenhouse Health: <strong>{healthScore}%</strong></span>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
