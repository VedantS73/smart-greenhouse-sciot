import React from 'react';
import { Card, Progress, Typography } from 'antd';

const { Text } = Typography;

function HealthStatus({ score }) {
  const strokeColor = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';

  return (
    <Card size="small" className="health-card" bordered={false}>
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
  );
}

export default HealthStatus;
