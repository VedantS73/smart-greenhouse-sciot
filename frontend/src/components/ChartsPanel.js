import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import './ChartsPanel.css';

const VIEWS = [
  { id: 'temp', label: 'Temperature', keys: ['temperature'], colors: ['#ef4444'] },
  { id: 'humidity', label: 'Humidity', keys: ['humidity'], colors: ['#3b82f6'] },
  { id: 'light', label: 'Light', keys: ['light'], colors: ['#f59e0b'] },
  { id: 'all', label: 'All', keys: ['temperature', 'humidity', 'light'], colors: ['#ef4444', '#3b82f6', '#f59e0b'] }
];

function buildChartData(history) {
  const maxLen = Math.max(
    history.temperature?.length || 0,
    history.humidity?.length || 0,
    history.light?.length || 0
  );

  const data = [];
  for (let i = 0; i < maxLen; i++) {
    data.push({
      index: i + 1,
      temperature: history.temperature?.[i],
      humidity: history.humidity?.[i],
      light: history.light?.[i]
    });
  }
  return data;
}

function ChartsPanel({ history }) {
  const [view, setView] = useState('all');
  const chartData = buildChartData(history || {});
  const currentView = VIEWS.find((v) => v.id === view) || VIEWS[3];

  return (
    <div className="panel charts-panel">
      <div className="charts-header">
        <h2 className="panel-title">Sensor History</h2>
        <div className="chart-tabs">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`chart-tab ${view === v.id ? 'active' : ''}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        {chartData.length === 0 ? (
          <p className="chart-empty">Waiting for sensor data...</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="index" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {currentView.keys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={currentView.colors[i]}
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default ChartsPanel;
