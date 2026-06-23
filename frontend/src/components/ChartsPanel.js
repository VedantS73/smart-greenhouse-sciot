import React, { useState } from 'react';
import { Card, Segmented, Empty } from 'antd';
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

const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'temp', label: 'Temp' },
  { value: 'humidity', label: 'Humidity' },
  { value: 'light', label: 'Light' }
];

const VIEW_CONFIG = {
  temp: { keys: ['temperature'], colors: ['#ef4444'] },
  humidity: { keys: ['humidity'], colors: ['#3b82f6'] },
  light: { keys: ['light'], colors: ['#f59e0b'] },
  all: { keys: ['temperature', 'humidity', 'light'], colors: ['#ef4444', '#3b82f6', '#f59e0b'] }
};

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
  const config = VIEW_CONFIG[view] || VIEW_CONFIG.all;

  return (
    <Card
      size="small"
      title="Sensor History"
      bordered={false}
      className="charts-card"
      extra={
        <Segmented
          size="small"
          options={VIEWS}
          value={view}
          onChange={setView}
        />
      }
    >
      <div className="chart-wrap">
        {chartData.length === 0 ? (
          <Empty description="Waiting for data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="index" stroke="#64748b" fontSize={11} tick={{ fill: '#64748b' }} />
              <YAxis stroke="#64748b" fontSize={11} tick={{ fill: '#64748b' }} width={36} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: '8px',
                  fontSize: 12
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {config.keys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={config.colors[i]}
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <style>{`
        .charts-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: rgba(30, 41, 59, 0.65) !important;
          border: 1px solid rgba(148, 163, 184, 0.1) !important;
        }
        .charts-card .ant-card-head {
          min-height: 36px;
          padding: 0 12px;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
        }
        .charts-card .ant-card-head-title {
          font-size: 13px;
          padding: 8px 0;
        }
        .charts-card .ant-card-body {
          flex: 1;
          padding: 8px 12px 12px !important;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .chart-wrap {
          flex: 1;
          min-height: 0;
        }
        .chart-wrap .ant-empty {
          margin: auto;
        }
      `}</style>
    </Card>
  );
}

export default ChartsPanel;
