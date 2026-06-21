import React from 'react';
import { Droplet, Sun, Gauge, Volume2, Leaf, Zap } from 'lucide-react';
import './Panel.css';

function SensorPanel({ sensors }) {
  const sensorCards = [
    {
      icon: Droplet,
      label: 'Humidity',
      value: sensors.humidity ?? 0,
      unit: '%',
      color: '#3b82f6'
    },
    {
      icon: Sun,
      label: 'Light',
      value: sensors.light ?? 0,
      unit: 'lux',
      color: '#f59e0b'
    },
    {
      icon: Gauge,
      label: 'Temperature',
      value: sensors.temperature ?? 0,
      unit: '°C',
      color: '#ef4444'
    },
    {
      icon: Volume2,
      label: 'Sound',
      value: sensors.sound ?? 0,
      unit: 'dB',
      color: '#8b5cf6'
    },
    {
      icon: Leaf,
      label: 'Moisture',
      value: sensors.moisture ?? 0,
      unit: '%',
      color: '#10b981'
    },
    {
      icon: Zap,
      label: 'Motion',
      value: sensors.motion ? 'Detected' : 'None',
      unit: '',
      color: '#ec4899'
    }
  ];

  return (
    <div className="panel sensors-panel">
      <h2 className="panel-title">📊 Sensor Readings</h2>
      <div className="sensors-grid">
        {sensorCards.map((sensor, idx) => {
          const Icon = sensor.icon;
          return (
            <div key={idx} className="sensor-card">
              <div className="sensor-icon" style={{ color: sensor.color }}>
                <Icon size={24} />
              </div>
              <div className="sensor-content">
                <span className="sensor-label">{sensor.label}</span>
                <div className="sensor-value">
                  {typeof sensor.value === 'string' 
                    ? sensor.value 
                    : sensor.value.toFixed(1)}{sensor.unit}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SensorPanel;
