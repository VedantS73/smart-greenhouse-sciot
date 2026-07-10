import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Typography, Badge, Button, Space, message } from 'antd';
import { ExperimentOutlined, LinkOutlined } from '@ant-design/icons';
import io from 'socket.io-client';
import SimulatorPanel from './components/SimulatorPanel';
import './App.css';
import './components/Dashboard.css';

const { Header, Content } = Layout;
const { Title } = Typography;

const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

const DEFAULT_LIMITS = {
  temperature: { min: -10, max: 60, step: 0.5 },
  humidity: { min: 0, max: 100, step: 1 },
  light: { min: 0, max: 1023, step: 1 },
  sound: { min: 0, max: 1023, step: 1 },
  moisture: { min: 0, max: 1023, step: 1 }
};

function getDashboardUrl() {
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000`;
}

function SimulatorApp() {
  const [connected, setConnected] = useState(false);
  const [hardware, setHardware] = useState({});
  const [effective, setEffective] = useState({});
  const [overrideState, setOverrideState] = useState({ overrides: {}, enabled: {} });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10
    });

    setSocket(s);

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('initial_data', (data) => {
      setHardware(data.hardware || {});
      setEffective(data.effective || {});
      setOverrideState(data.overrideState || { overrides: {}, enabled: {} });
    });

    s.on('hardware_update', setHardware);
    s.on('effective_update', setEffective);
    s.on('override_state', setOverrideState);

    s.on('override_nack', (payload) => {
      message.error(payload.reason === 'invalid_value'
        ? `Invalid value for ${payload.field}`
        : `Could not update ${payload.field || 'override'}`);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const handleSetOverride = useCallback((field, value, enabled) => {
    socket?.emit('set_override', { field, value, enabled });
  }, [socket]);

  const handleSendOnce = useCallback((field, value) => {
    socket?.emit('send_once', { field, value });
    message.info(`Sent one-shot override for ${field}`);
  }, [socket]);

  const handleClearOverrides = useCallback(() => {
    socket?.emit('clear_overrides');
    message.success('All overrides cleared');
  }, [socket]);

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <div className="header-brand">
          <ExperimentOutlined className="header-logo" />
          <Title level={4} className="header-title">Sensor Simulator</Title>
          <Badge
            status={connected ? 'success' : 'error'}
            text={connected ? 'Connected' : 'Offline'}
          />
        </div>
        <Space className="header-actions">
          <Button
            type="link"
            icon={<LinkOutlined />}
            href={getDashboardUrl()}
            target="_blank"
            rel="noreferrer"
          >
            Main Dashboard
          </Button>
          <Button danger onClick={handleClearOverrides}>
            Clear All Overrides
          </Button>
        </Space>
      </Header>

      <Content className="dashboard-content">
        <SimulatorPanel
          hardware={hardware}
          effective={effective}
          overrideState={overrideState}
          limits={DEFAULT_LIMITS}
          onSetOverride={handleSetOverride}
          onSendOnce={handleSendOnce}
        />
      </Content>
    </Layout>
  );
}

export default SimulatorApp;
