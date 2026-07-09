import React, { useState } from 'react';
import { Card, Button, Tooltip, Typography, message } from 'antd';
import {
  AlertOutlined,
  SoundOutlined,
  SunOutlined
} from '@ant-design/icons';

const { Text } = Typography;

function FanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="2.1" />
      <path d="M12 3.2c2.3 0 3.7 2.5 2.6 4.5l-1.1 2a1 1 0 0 1-1.7.1l-1.2-1.9c-1.2-2 .2-4.7 2.4-4.7zM20.8 12c0 2.3-2.5 3.7-4.5 2.6l-2-1.1a1 1 0 0 1-.1-1.7l1.9-1.2c2-1.2 4.7.2 4.7 2.4zM12 20.8c-2.3 0-3.7-2.5-2.6-4.5l1.1-2a1 1 0 0 1 1.7-.1l1.2 1.9c1.2 2-.2 4.7-2.4 4.7zM3.2 12c0-2.3 2.5-3.7 4.5-2.6l2 1.1a1 1 0 0 1 .1 1.7l-1.9 1.2c-2 1.2-4.7-.2-4.7-2.4z" />
    </svg>
  );
}

function WaterDropIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden>
      <path d="M12 2.69 17.66 8.35a6 6 0 1 1-8.49 0L12 2.69z" />
    </svg>
  );
}

const ACTUATORS = [
  { id: 'led', icon: AlertOutlined, label: 'Alarm LED', color: '#fbbf24' },
  { id: 'relay1', icon: FanIcon, label: 'Fan', color: '#f87171' },
  { id: 'relay2', icon: WaterDropIcon, label: 'Pump', color: '#06b6d4' },
  { id: 'relay3', icon: SunOutlined, label: 'Grow Light', color: '#fbbf24' },
  { id: 'buzzer', icon: SoundOutlined, label: 'Buzzer', color: '#f87171' }
];

function ActuatorPanel({
  actuators,
  socket,
  autoMode,
  actuatorFeedback,
  setActuatorFeedback
}) {
  const [pending, setPending] = useState({});
  const [msgApi, contextHolder] = message.useMessage();

  const handleToggle = (device, label) => {
    if (autoMode) {
      msgApi.warning('Switch to Manual mode to control actuators');
      return;
    }

    const state = !actuators[device];
    setPending((prev) => ({ ...prev, [device]: true }));
    setActuatorFeedback((prev) => {
      const next = { ...prev };
      delete next[device];
      return next;
    });

    socket.emit(`toggle_${device}`, state);

    setTimeout(() => {
      setPending((prev) => ({ ...prev, [device]: false }));
    }, 5000);
  };

  return (
    <Card
      size="small"
      title="Actuators"
      bordered={false}
      className="actuators-card"
    >
      {contextHolder}
      <div className="actuators-stack">
        {ACTUATORS.map(({ id, icon: Icon, label, color }) => {
          const isActive = actuators[id] ?? false;
          const isPending = pending[id];
          const feedback = actuatorFeedback[id];
          const hasError = feedback?.status === 'error';

          return (
            <Tooltip
              key={id}
              title={
                autoMode
                  ? 'AUTO mode — switch to Manual'
                  : `${label}: ${isActive ? 'ON' : 'OFF'}${hasError ? ` — ${feedback.message}` : ''}`
              }
            >
              <Button
                type={isActive ? 'primary' : 'default'}
                shape="circle"
                size="large"
                icon={<Icon />}
                loading={isPending && !hasError}
                danger={hasError}
                disabled={autoMode}
                onClick={() => handleToggle(id, label)}
                className="actuator-btn"
                style={{
                  borderColor: isActive ? color : undefined,
                  background: isActive ? color : undefined
                }}
              />
            </Tooltip>
          );
        })}
      </div>
      {autoMode && (
        <Text type="secondary" className="auto-hint">AUTO</Text>
      )}
      <style>{`
        .actuators-card {
          height: 100%;
          background: rgba(30, 41, 59, 0.65) !important;
          border: 1px solid rgba(148, 163, 184, 0.1) !important;
        }
        .actuators-card .ant-card-head {
          min-height: 36px;
          padding: 0 10px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
        }
        .actuators-card .ant-card-head-title {
          font-size: 12px;
          padding: 8px 0;
          text-align: center;
        }
        .actuators-card .ant-card-body {
          padding: 10px 8px !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: calc(100% - 36px);
          gap: 8px;
        }
        .actuators-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        .actuator-btn {
          width: 48px !important;
          height: 48px !important;
          font-size: 20px !important;
        }
        .auto-hint {
          font-size: 10px;
          text-align: center;
        }
      `}</style>
    </Card>
  );
}

export default ActuatorPanel;
