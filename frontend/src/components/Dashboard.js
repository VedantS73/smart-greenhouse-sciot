import React from 'react';
import SensorPanel from './SensorPanel';
import ActuatorPanel from './ActuatorPanel';
import HealthStatus from './HealthStatus';
import ChartsPanel from './ChartsPanel';
import PlannerPanel from './PlannerPanel';
import EventLog from './EventLog';
import './Dashboard.css';
import { Leaf, Activity } from 'lucide-react';

function Dashboard({ data, socket, connected, actuatorFeedback, setActuatorFeedback }) {
  const autoMode = data.planner?.auto_mode !== false;
  const readings = data.sensors?.readings || {};
  const sensorMeta = data.sensors?.meta || {};

  const getHealthScore = () => {
    let score = 100;
    const t = readings.temperature;
    const h = readings.humidity;
    const l = readings.light;

    if (t === undefined || sensorMeta.temperature?.stale) return 0;
    if (t < 18 || t > 32) score -= 20;
    else if (t < 20 || t > 28) score -= 10;

    if (h !== undefined && !sensorMeta.humidity?.stale) {
      if (h < 30 || h > 80) score -= 20;
      else if (h < 50 || h > 70) score -= 10;
    }

    if (l !== undefined && !sensorMeta.light?.stale) {
      if (l < 100 || l > 1000) score -= 15;
    }

    return Math.max(0, score);
  };

  const handleModeToggle = () => {
    const newMode = autoMode ? 'manual' : 'auto';
    socket.emit('set_mode', newMode);
  };

  const healthScore = getHealthScore();

  return (
    <div className={`dashboard ${connected ? 'connected' : 'disconnected'}`}>
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
              <div className="status-dot" />
              <span>{connected ? 'Live' : 'Offline'}</span>
            </div>

            <button
              type="button"
              className={`mode-toggle ${autoMode ? 'auto' : 'manual'}`}
              onClick={handleModeToggle}
            >
              {autoMode ? 'AUTO' : 'MANUAL'}
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="grid-row">
          <HealthStatus score={healthScore} />
          <SensorPanel readings={readings} meta={sensorMeta} />
        </div>

        <div className="grid-row full-width">
          <ChartsPanel history={data.history} />
        </div>

        <div className="grid-row">
          <ActuatorPanel
            actuators={data.actuators}
            socket={socket}
            autoMode={autoMode}
            actuatorFeedback={actuatorFeedback}
            setActuatorFeedback={setActuatorFeedback}
          />
          <PlannerPanel planner={data.planner} actuators={data.actuators} />
        </div>

        <div className="grid-row full-width">
          <EventLog events={data.events} />
        </div>
      </main>

      <footer className="dashboard-footer">
        <div className="services-status">
          <div className="service-item">
            <span className={`status-indicator ${data.health?.publisher?.online ? 'online' : 'offline'}`} />
            <span>Publisher</span>
          </div>
          <div className="service-item">
            <span className={`status-indicator ${data.health?.actuator?.online ? 'online' : 'offline'}`} />
            <span>Actuator</span>
          </div>
          <div className="service-item">
            <span className={`status-indicator ${data.health?.planner?.online ? 'online' : 'offline'}`} />
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
