import React from 'react';
import './Panel.css';

const DEVICE_LABELS = {
  led: 'LED',
  relay1: 'Fan (Relay 1)',
  relay2: 'Pump (Relay 2)'
};

function PlannerPanel({ planner, actuators }) {
  const context = planner?.context || {};
  const goal = planner?.goal || {};
  const actions = planner?.actions || {};
  const mismatch = planner?.action_mismatch || {};
  const hasMismatch = Object.keys(mismatch).length > 0;

  const renderSection = (title, data) => {
    const entries = Object.entries(data || {});
    if (entries.length === 0) {
      return <p className="event-empty">Waiting for planner...</p>;
    }

    return (
      <dl className="planner-kv">
        {entries.map(([key, value]) => (
          <React.Fragment key={key}>
            <dt>{key}</dt>
            <dd>{String(value)}</dd>
          </React.Fragment>
        ))}
      </dl>
    );
  };

  const renderActions = () => {
    const entries = Object.entries(actions);
    if (entries.length === 0) {
      return <p className="event-empty">No actions</p>;
    }

    return (
      <dl className="planner-kv">
        {entries.map(([key, value]) => (
          <React.Fragment key={key}>
            <dt>{DEVICE_LABELS[key] || key}</dt>
            <dd>{value ? 'ON' : 'OFF'}</dd>
          </React.Fragment>
        ))}
      </dl>
    );
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Planner</h2>

      <div className="planner-section">
        <h3>Context</h3>
        {renderSection('Context', context)}
      </div>

      <div className="planner-section">
        <h3>Goal</h3>
        {renderSection('Goal', goal)}
      </div>

      <div className="planner-section">
        <h3>Actions</h3>
        {renderActions()}
      </div>

      {hasMismatch && (
        <div className="planner-mismatch">
          <strong>Hardware mismatch detected</strong>
          <ul>
            {Object.keys(mismatch).map((device) => {
              const commanded = actions[device];
              const actual = actuators[device];
              return (
                <li key={device}>
                  {DEVICE_LABELS[device] || device}: commanded{' '}
                  {commanded ? 'ON' : 'OFF'}, hardware reports{' '}
                  {actual ? 'ON' : 'OFF'}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PlannerPanel;
