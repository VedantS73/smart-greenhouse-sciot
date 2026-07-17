import React from 'react';
import { Card, Progress, Typography, Tooltip } from 'antd';

const { Text } = Typography;

function HealthStatus({ score, onClick }) {
  const strokeColor = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';

  return (
    <Tooltip title="Open planner explorer">
      <Card
        size="small"
        className="health-card health-card-clickable"
        bordered={false}
        onClick={onClick}
      >
        <div className="health-inner">
          <Progress
            type="circle"
            percent={score}
            size={72}
            strokeColor={strokeColor}
            format={(p) => (
              <span className="health-percent">{p}</span>
            )}
          />
          <Text type="secondary" className="health-label">Health</Text>
        </div>
        <style>{`
          .health-card {
            height: 100%;
            background: rgba(30, 41, 59, 0.65) !important;
            border: 1px solid rgba(148, 163, 184, 0.1) !important;
          }
          .health-card-clickable {
            cursor: pointer;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .health-card-clickable:hover {
            border-color: rgba(34, 197, 94, 0.45) !important;
            box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.15);
          }
          .health-card .ant-card-body {
            padding: 10px 8px !important;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
          }
          .health-inner {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          }
          .health-percent {
            font-size: 16px;
            font-weight: 700;
            color: #f1f5f9;
          }
          .health-label {
            font-size: 11px;
          }
        `}</style>
      </Card>
    </Tooltip>
  );
}

export default HealthStatus;
