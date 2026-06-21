import React from 'react';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';
import './Panel.css';

function HealthStatus({ score }) {
  const getHealthStatus = () => {
    if (score >= 80) return { label: 'Excellent', color: '#10b981', icon: CheckCircle };
    if (score >= 60) return { label: 'Good', color: '#3b82f6', icon: CheckCircle };
    if (score >= 40) return { label: 'Fair', color: '#f59e0b', icon: AlertCircle };
    return { label: 'Poor', color: '#ef4444', icon: AlertCircle };
  };

  const status = getHealthStatus();
  const StatusIcon = status.icon;

  return (
    <div className="panel health-panel">
      <h2 className="panel-title">🏥 Greenhouse Health</h2>
      <div className="health-display">
        <div className="health-score-display">
          <div className="health-percentage">{score}%</div>
          <div className="health-label">Overall Health Status</div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          color: status.color,
          fontSize: '1.1rem',
          fontWeight: 600
        }}>
          <StatusIcon size={20} />
          <span>{status.label}</span>
        </div>

        <div className="health-bar">
          <div 
            className="health-bar-fill" 
            style={{ 
              width: `${score}%`,
              background: score >= 80 
                ? 'linear-gradient(90deg, #10b981, #6ee7b7)'
                : score >= 60
                ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                : score >= 40
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, #ef4444, #f87171)'
            }}
          />
        </div>

        <div style={{
          fontSize: '0.8rem',
          color: 'var(--gray-500)',
          textAlign: 'center',
          marginTop: '0.5rem',
          lineHeight: '1.5'
        }}>
          <p>Optimal conditions:</p>
          <p>🌡️ 20-28°C | 💧 50-70% | ☀️ 200-800 lux</p>
        </div>
      </div>
    </div>
  );
}

export default HealthStatus;
