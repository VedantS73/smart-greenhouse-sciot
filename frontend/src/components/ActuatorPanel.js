import React, { useState } from 'react';
import { Lightbulb, Power } from 'lucide-react';
import './Panel.css';

function ActuatorPanel({ actuators, socket }) {
  const [loading, setLoading] = useState({});

  const handleToggle = (device) => {
    setLoading(prev => ({ ...prev, [device]: true }));
    
    const state = !actuators[device];
    socket.emit(`toggle_${device}`, state);

    setTimeout(() => {
      setLoading(prev => ({ ...prev, [device]: false }));
    }, 300);
  };

  const actuatorCards = [
    {
      id: 'led',
      icon: Lightbulb,
      label: 'LED Light',
      color: '#fbbf24',
      state: actuators.led ?? false
    },
    {
      id: 'relay1',
      icon: Power,
      label: 'Relay 1',
      color: '#f87171',
      state: actuators.relay1 ?? false
    },
    {
      id: 'relay2',
      icon: Power,
      label: 'Relay 2',
      color: '#06b6d4',
      state: actuators.relay2 ?? false
    }
  ];

  return (
    <div className="panel">
      <h2 className="panel-title">🎛️ Actuators Control</h2>
      <div className="actuators-grid">
        {actuatorCards.map((actuator) => {
          const Icon = actuator.icon;
          const isActive = actuator.state;
          
          return (
            <div key={actuator.id} className="actuator-card">
              <div className="actuator-icon" style={{ color: actuator.color }}>
                <Icon size={28} />
              </div>
              <span className="actuator-label">{actuator.label}</span>
              <button
                className={`toggle-switch ${isActive ? 'active' : ''}`}
                onClick={() => handleToggle(actuator.id)}
                disabled={loading[actuator.id]}
                style={{
                  opacity: loading[actuator.id] ? 0.6 : 1,
                  cursor: loading[actuator.id] ? 'not-allowed' : 'pointer'
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActuatorPanel;
