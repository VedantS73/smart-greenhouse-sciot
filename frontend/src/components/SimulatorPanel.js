import React from 'react';
import { Card, Row, Col, Typography, Tag, Switch, Slider, InputNumber, Button, Space } from 'antd';
import {
  CloudOutlined,
  SunOutlined,
  FireOutlined,
  SoundOutlined,
  DropboxOutlined,
  RadarChartOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const SENSOR_CONFIG = [
  { key: 'temperature', icon: FireOutlined, label: 'Temperature', unit: '°C', color: '#ef4444' },
  { key: 'humidity', icon: CloudOutlined, label: 'Humidity', unit: '%', color: '#3b82f6' },
  { key: 'light', icon: SunOutlined, label: 'Light', unit: '', color: '#f59e0b' },
  { key: 'sound', icon: SoundOutlined, label: 'Sound', unit: '', color: '#8b5cf6' },
  { key: 'moisture', icon: DropboxOutlined, label: 'Moisture', unit: '', color: '#10b981' },
  { key: 'motion', icon: RadarChartOutlined, label: 'Motion', unit: '', color: '#ec4899', isMotion: true }
];

function formatValue(value, isMotion) {
  if (isMotion) return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toFixed(1);
  return '--';
}

function getDefaultValue(key, limits) {
  if (key === 'motion') return false;
  const limit = limits[key];
  if (!limit) return 0;
  return Math.round((limit.min + limit.max) / 2);
}

function SimulatorField({
  config,
  hardware,
  effective,
  overrideState,
  limits,
  onSetOverride,
  onSendOnce
}) {
  const { key, icon: Icon, label, unit, color, isMotion } = config;
  const limit = limits[key] || { min: 0, max: 100, step: 1 };
  const enabled = Boolean(overrideState.enabled?.[key]);
  const overrideValue = overrideState.overrides?.[key];
  const draftValue = overrideValue !== undefined
    ? overrideValue
    : getDefaultValue(key, limits);

  const realValue = hardware[key];
  const effectiveValue = effective[key];

  return (
    <Card
      size="small"
      className={`simulator-card ${enabled ? 'simulator-card-overridden' : ''}`}
      title={(
        <Space>
          <Icon style={{ color }} />
          <span>{label}</span>
          {enabled && <Tag color="orange">Overridden</Tag>}
        </Space>
      )}
    >
      <Row gutter={[12, 12]}>
        <Col span={12}>
          <Text type="secondary">Real</Text>
          <div>
            <Text strong>
              {formatValue(realValue, isMotion)}
              {!isMotion && realValue !== undefined ? unit : ''}
            </Text>
          </div>
        </Col>
        <Col span={12}>
          <Text type="secondary">Effective</Text>
          <div>
            <Text strong style={{ color: enabled ? '#f59e0b' : undefined }}>
              {formatValue(effectiveValue, isMotion)}
              {!isMotion && effectiveValue !== undefined ? unit : ''}
            </Text>
          </div>
        </Col>
      </Row>

      <div className="simulator-controls">
        <Space style={{ marginBottom: 8 }}>
          <Text>Override</Text>
          <Switch
            checked={enabled}
            onChange={(checked) => {
              const value = checked
                ? (hardware[key] !== undefined ? hardware[key] : draftValue)
                : draftValue;
              onSetOverride(key, value, checked);
            }}
          />
        </Space>

        {isMotion ? (
          <Space>
            <Switch
              checked={Boolean(draftValue)}
              disabled={!enabled}
              onChange={(checked) => onSetOverride(key, checked, true)}
            />
            <Text>{draftValue ? 'Motion detected' : 'No motion'}</Text>
          </Space>
        ) : (
          <>
            <Slider
              min={limit.min}
              max={limit.max}
              step={limit.step}
              value={draftValue}
              disabled={!enabled}
              onChange={(value) => onSetOverride(key, value, enabled)}
            />
            <Space>
              <InputNumber
                min={limit.min}
                max={limit.max}
                step={limit.step}
                value={draftValue}
                disabled={!enabled}
                onChange={(value) => {
                  if (value !== null) {
                    onSetOverride(key, value, enabled);
                  }
                }}
              />
              <Text type="secondary">{unit}</Text>
              <Button
                size="small"
                onClick={() => onSendOnce(key, draftValue)}
              >
                Send once
              </Button>
            </Space>
          </>
        )}
      </div>
    </Card>
  );
}

function SimulatorPanel({
  hardware,
  effective,
  overrideState,
  limits,
  onSetOverride,
  onSendOnce
}) {
  return (
    <div className="simulator-panel">
      <Title level={5} style={{ color: '#94a3b8', marginBottom: 12 }}>
        Override individual sensor fields. Enabled overrides replace real readings in the live greenhouse pipeline.
      </Title>
      <Row gutter={[12, 12]}>
        {SENSOR_CONFIG.map((config) => (
          <Col xs={24} md={12} xl={8} key={config.key}>
            <SimulatorField
              config={config}
              hardware={hardware}
              effective={effective}
              overrideState={overrideState}
              limits={limits}
              onSetOverride={onSetOverride}
              onSendOnce={onSendOnce}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default SimulatorPanel;
