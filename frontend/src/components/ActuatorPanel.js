import React, { useState } from 'react';
import { Lightbulb, Power } from 'lucide-react';
import './Panel.css';

const ACTUATORS = [
  { id: 'led', icon: Lightbulb, label: 'LED Light', color: '#fbbf24' },
  { id: 'relay1', icon: Power, label: 'Relay 1 (Fan)', color: '#f87171' },
  { id: 'relay2', icon: Power, label: 'Relay 2 (Pump)', color: '#06b6d4' }
];

function ActuatorPanel({
  actuators,
  socket,
  autoMode,
  actuatorFeedback,
  setActuatorFeedback
}) {
  const [pending, setPending] = useState({});

  const handleToggle = (device) => {
    if (autoMode) return;

    const state = !actuators[device];
    setPending((prev) => ({ ...prev, [device]: true }));
    setActuatorFeedback((prev) => {
      const next = { ...prev };
      delete next[device];
      return next;
    });

    socket.emit(`toggle_${device}`, state);

    setTimeout(() => {
      setPending((prev) => ({ ...prev, [device]: false }));
    }, 5000);
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Actuators</h2>
      {autoMode && (
        <p className="auto-mode-notice">
          AUTO mode is active. Switch to MANUAL to control actuators.
        </p>
      )}
      <div className="actuators-grid">
        {ACTUATORS.map(({ id, icon: Icon, label, color }) => {
          const isActive = actuators[id] ?? false;
          const isPending = pending[id];
          const feedback = actuatorFeedback[id];
          const cardClass = [
            'actuator-card',
            isPending ? 'pending' : '',
            feedback?.status === 'error' ? 'error' : ''
          ].filter(Boolean).join(' ');

          return (
            <div key={id} className={cardClass}>
              <div className="actuator-icon" style={{ color }}>
                <Icon size={28} />
              </div>
              <span className="actuator-label">{label}</span>
              <button
                type="button"
                className={`toggle-switch ${isActive ? 'active' : ''}`}
                onClick={() => handleToggle(id)}
                disabled={autoMode || isPending}
                aria-label={`Toggle ${label}`}
              />
              <div className={`actuator-feedback ${feedback?.status || ''}`}>
                {isPending && !feedback && 'Waiting for hardware...'}
                {feedback?.message}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActuatorPanel;
