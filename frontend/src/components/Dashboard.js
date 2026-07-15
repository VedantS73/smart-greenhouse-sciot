import React, { useState } from 'react';
import {
  Layout,
  Space,
  Switch,
  Badge,
  Typography,
  Row,
  Col,
  Drawer,
  Button,
  Tooltip
} from 'antd';
import {
  ExperimentOutlined,
  UnorderedListOutlined,
  ApiOutlined,
  ControlOutlined,
  DeploymentUnitOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import SensorPanel from './SensorPanel';
import ActuatorPanel from './ActuatorPanel';
import HealthStatus from './HealthStatus';
import ChartsPanel from './ChartsPanel';
import PlannerPanel from './PlannerPanel';
import EventLog from './EventLog';
import RulesSetupModal from './RulesSetupModal';
import PortsSetupModal from './PortsSetupModal';
import SettingsModal from './SettingsModal';
import PlannerExplorerModal from './PlannerExplorerModal';
import './Dashboard.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function Dashboard({
  data,
  socket,
  connected,
  actuatorFeedback,
  setActuatorFeedback,
  pendingActuators,
  onActuatorToggle,
  onRulesSaved,
  onPortsSaved,
  onSettingsSaved,
  onLogout
}) {
  const [logOpen, setLogOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [portsOpen, setPortsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [plannerExplorerOpen, setPlannerExplorerOpen] = useState(false);
  const autoMode = data.planner?.auto_mode !== false;
  const readings = data.sensors?.readings || {};
  const sensorMeta = data.sensors?.meta || {};

  const getHealthScore = () => {
    let score = 100;
    const t = readings.temperature;
    const h = readings.humidity;
    const l = readings.light;

    if (t === undefined || sensorMeta.temperature?.stale) return 0;
    if (t < 18 || t > 32) score -= 20;
    else if (t < 20 || t > 28) score -= 10;

    if (h !== undefined && !sensorMeta.humidity?.stale) {
      if (h < 30 || h > 80) score -= 20;
      else if (h < 50 || h > 70) score -= 10;
    }

    if (l !== undefined && !sensorMeta.light?.stale) {
      if (l < 100 || l > 1000) score -= 15;
    }

    return Math.max(0, score);
  };

  const handleModeToggle = (checked) => {
    socket.emit('set_mode', checked ? 'auto' : 'manual');
  };

  const healthScore = getHealthScore();
  const eventCount = data.events?.length || 0;

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <div className="header-brand">
          <ExperimentOutlined className="header-logo" />
          <Title level={4} className="header-title">Smart Greenhouse</Title>
        </div>

        <Space size="middle" className="header-actions">
          <Badge status={connected ? 'success' : 'error'} text={connected ? 'Live' : 'Offline'} />
          <Space size={4}>
            <Text type="secondary" className="mode-label">Mode</Text>
            <Switch
              checked={autoMode}
              onChange={handleModeToggle}
              checkedChildren="Auto"
              unCheckedChildren="Manual"
            />
          </Space>
          <Tooltip title="Rules setup">
            <Button
              type="text"
              icon={<ControlOutlined />}
              onClick={() => setRulesOpen(true)}
            />
          </Tooltip>
          <Tooltip title="Port mapping">
            <Button
              type="text"
              icon={<DeploymentUnitOutlined />}
              onClick={() => setPortsOpen(true)}
            />
          </Tooltip>
          <Tooltip title="Activity log">
            <Badge count={eventCount} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                icon={<UnorderedListOutlined />}
                onClick={() => setLogOpen(true)}
              />
            </Badge>
          </Tooltip>
          <Tooltip title="Settings">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setSettingsOpen(true)}
            />
          </Tooltip>
          <Tooltip title="Log out">
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={onLogout}
            />
          </Tooltip>
        </Space>
      </Header>

      <Content className="dashboard-content">
        <Row gutter={[12, 12]} className="row-sensors">
          <Col flex="140px">
            <HealthStatus
              score={healthScore}
              onClick={() => setPlannerExplorerOpen(true)}
            />
          </Col>
          <Col flex="auto">
            <SensorPanel readings={readings} meta={sensorMeta} />
          </Col>
        </Row>

        <Row gutter={12} className="row-charts">
          <Col flex="auto" className="charts-col">
            <ChartsPanel history={data.history} />
          </Col>
          <Col flex="88px" className="actuators-col">
            <ActuatorPanel
              actuators={data.actuators}
              autoMode={autoMode}
              actuatorFeedback={actuatorFeedback}
              pendingActuators={pendingActuators}
              onActuatorToggle={onActuatorToggle}
            />
          </Col>
        </Row>

        <div className="row-planner">
          <PlannerPanel planner={data.planner} actuators={data.actuators} />
        </div>
      </Content>

      <Footer className="dashboard-footer">
        <Space size="large">
          <Space size={6}>
            <Badge status={data.health?.publisher?.online ? 'success' : 'error'} />
            <Text type="secondary">Publisher</Text>
          </Space>
          <Space size={6}>
            <Badge status={data.health?.actuator?.online ? 'success' : 'error'} />
            <Text type="secondary">Actuator</Text>
          </Space>
          <Space size={6}>
            <Badge status={data.health?.planner?.online ? 'success' : 'error'} />
            <Text type="secondary">Planner</Text>
          </Space>
        </Space>
        <Space size={6}>
          <ApiOutlined />
          <Text type="secondary">Health: <Text strong style={{ color: '#4ade80' }}>{healthScore}%</Text></Text>
        </Space>
      </Footer>

      <Drawer
        title="Activity Log"
        placement="right"
        width={360}
        open={logOpen}
        onClose={() => setLogOpen(false)}
        className="event-drawer"
      >
        <EventLog events={data.events} />
      </Drawer>

      <PlannerExplorerModal
        open={plannerExplorerOpen}
        onClose={() => setPlannerExplorerOpen(false)}
        score={healthScore}
        readings={readings}
        sensorMeta={sensorMeta}
        planner={data.planner}
        actuators={data.actuators}
        socket={socket}
        autoMode={autoMode}
      />

      <RulesSetupModal
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        rules={data.rules}
        readings={readings}
        socket={socket}
        onRulesSaved={onRulesSaved}
      />
      <PortsSetupModal
        open={portsOpen}
        onClose={() => setPortsOpen(false)}
        ports={data.ports}
        socket={socket}
        onPortsSaved={onPortsSaved}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={data.settings}
        socket={socket}
        onSettingsSaved={onSettingsSaved}
      />
    </Layout>
  );
}

export default Dashboard;
