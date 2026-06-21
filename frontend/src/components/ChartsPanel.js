import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ComposedChart, Bar
} from 'recharts';
import './Panel.css';
import './ChartsPanel.css';

function ChartsPanel({ history }) {
  const [view, setView] = useState('temperature');

  const prepareChartData = () => {
    const temp = history.temperature || [];
    const humidity = history.humidity || [];
    const light = history.light || [];
    const maxLength = Math.max(temp.length, humidity.length, light.length);

    return Array.from({ length: maxLength }, (_, i) => ({
      idx: i + 1,
      temperature: temp[i] ?? null,
      humidity: humidity[i] ?? null,
      light: light[i] !== undefined ? Math.round(light[i] / 100) : null // Scale light for better visualization
    }));
  };

  const data = prepareChartData();

  if (data.length === 0) {
    return (
      <div className="panel charts-panel">
        <h2 className="panel-title">📈 Real-time Trends</h2>
        <div className="chart-placeholder">Loading sensor data...</div>
      </div>
    );
  }

  return (
    <div className="panel charts-panel">
      <div className="charts-header">
        <h2 className="panel-title">📈 Real-time Trends</h2>
        <div className="chart-buttons">
          <button 
            className={`chart-btn ${view === 'temperature' ? 'active' : ''}`}
            onClick={() => setView('temperature')}
          >
            🌡️ Temperature
          </button>
          <button 
            className={`chart-btn ${view === 'humidity' ? 'active' : ''}`}
            onClick={() => setView('humidity')}
          >
            💧 Humidity
          </button>
          <button 
            className={`chart-btn ${view === 'light' ? 'active' : ''}`}
            onClick={() => setView('light')}
          >
            ☀️ Light
          </button>
          <button 
            className={`chart-btn ${view === 'all' ? 'active' : ''}`}
            onClick={() => setView('all')}
          >
            📊 All Data
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {view === 'temperature' && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" />
            <YAxis domain={[0, 40]} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="temperature" 
              stroke="#ef4444" 
              dot={false}
              name="Temperature (°C)"
              isAnimationActive={false}
            />
          </LineChart>
        )}

        {view === 'humidity' && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="humidity" 
              stroke="#3b82f6" 
              dot={false}
              name="Humidity (%)"
              isAnimationActive={false}
            />
          </LineChart>
        )}

        {view === 'light' && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="light" 
              stroke="#f59e0b" 
              dot={false}
              name="Light (×100 lux)"
              isAnimationActive={false}
            />
          </LineChart>
        )}

        {view === 'all' && (
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="temperature" 
              stroke="#ef4444" 
              dot={false}
              name="Temp (°C)"
              isAnimationActive={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="humidity" 
              stroke="#3b82f6" 
              dot={false}
              name="Humidity (%)"
              isAnimationActive={false}
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default ChartsPanel;
