import React from 'react';
import './Panel.css';

function HealthStatus({ score }) {
  return (
    <div className="panel health-panel">
      <h2 className="panel-title">Health</h2>
      <div className="health-score-large">{score}%</div>
      <div className="health-bar">
        <div
          className="health-bar-fill"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default HealthStatus;
