import React from 'react';
import { Droplet, Sun, Gauge, Volume2, Leaf, Zap } from 'lucide-react';
import './Panel.css';

const SENSOR_CONFIG = [
  { key: 'humidity', icon: Droplet, label: 'Humidity', unit: '%', color: '#3b82f6' },
  { key: 'light', icon: Sun, label: 'Light', unit: '', color: '#f59e0b' },
  { key: 'temperature', icon: Gauge, label: 'Temperature', unit: '°C', color: '#ef4444' },
  { key: 'sound', icon: Volume2, label: 'Sound', unit: '', color: '#8b5cf6' },
  { key: 'moisture', icon: Leaf, label: 'Moisture', unit: '', color: '#10b981' },
  { key: 'motion', icon: Zap, label: 'Motion', unit: '', color: '#ec4899', isMotion: true }
];

function formatValue(key, value, isMotion) {
  if (isMotion) {
    return value ? 'Detected' : 'None';
  }
  if (typeof value === 'number') {
    return value.toFixed(1);
  }
  return '--';
}

function SensorPanel({ readings, meta }) {
  return (
    <div className="panel sensors-panel">
      <h2 className="panel-title">Sensor Readings</h2>
      <div className="sensors-grid">
        {SENSOR_CONFIG.map(({ key, icon: Icon, label, unit, color, isMotion }) => {
          const fieldMeta = meta[key] || { stale: true, invalid: false };
          const stale = fieldMeta.stale;
          const invalid = fieldMeta.invalid;
          const value = readings[key];
          const hasValue = value !== undefined && !stale;

          return (
            <div
              key={key}
              className={`sensor-card ${stale ? 'stale' : ''} ${invalid ? 'invalid' : ''}`}
            >
              <div className="sensor-icon" style={{ color }}>
                <Icon size={24} />
              </div>
              <div className="sensor-content">
                <span className="sensor-label">{label}</span>
                <div className="sensor-value">
                  {hasValue ? formatValue(key, value, isMotion) : '--'}
                  {hasValue && unit && !isMotion ? unit : ''}
                </div>
                {stale && (
                  <span className="sensor-badge stale">No data</span>
                )}
                {invalid && !stale && (
                  <span className="sensor-badge invalid">Invalid</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SensorPanel;
