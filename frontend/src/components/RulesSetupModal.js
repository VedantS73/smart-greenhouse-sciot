import React, { useEffect, useState } from 'react';
import {
  Modal,
  Card,
  Slider,
  InputNumber,
  Button,
  Space,
  Typography,
  Tag,
  Divider,
  Row,
  Col
} from 'antd';
import {
  FireOutlined,
  CloudOutlined,
  BulbOutlined,
  ExperimentOutlined,
  SafetyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const DEFAULT_RULES = {
  temperature: { coldBelow: 20, hotAbove: 30 },
  humidity: { dryBelow: 40, wetAbove: 70 },
  light: { lowBelow: 200, highAbove: 350 },
  soil: { dryBelow: 450, wetAbove: 650 },
  security: { intrusionLightBelow: 200, criticalTempAbove: 40 },
  schedule: { dayStartHour: 6, dayEndHour: 22 }
};

const RANGE_SECTIONS = [
  {
    key: 'temperature',
    title: 'Temperature',
    icon: <FireOutlined />,
    unit: '°C',
    min: -10,
    max: 60,
    lowKey: 'coldBelow',
    highKey: 'hotAbove',
    lowLabel: 'Cold below',
    highLabel: 'Hot above',
    readingKey: 'temperature'
  },
  {
    key: 'humidity',
    title: 'Humidity',
    icon: <CloudOutlined />,
    unit: '%',
    min: 0,
    max: 100,
    lowKey: 'dryBelow',
    highKey: 'wetAbove',
    lowLabel: 'Dry below',
    highLabel: 'Wet above',
    readingKey: 'humidity'
  },
  {
    key: 'light',
    title: 'Light',
    icon: <BulbOutlined />,
    unit: '',
    min: 0,
    max: 1023,
    lowKey: 'lowBelow',
    highKey: 'highAbove',
    lowLabel: 'Low below',
    highLabel: 'High above',
    readingKey: 'light'
  },
  {
    key: 'soil',
    title: 'Soil Moisture',
    icon: <ExperimentOutlined />,
    unit: '',
    min: 0,
    max: 1023,
    lowKey: 'dryBelow',
    highKey: 'wetAbove',
    lowLabel: 'Dry below',
    highLabel: 'Wet above',
    readingKey: 'moisture'
  }
];

function contextLabel(sectionKey, value, rules) {
  if (value === undefined || value === null) return null;

  const section = rules[sectionKey];
  if (!section) return null;

  if (sectionKey === 'temperature') {
    if (value > section.hotAbove) return 'HOT';
    if (value < section.coldBelow) return 'COLD';
    return 'NORMAL';
  }

  if (sectionKey === 'humidity') {
    if (value < section.dryBelow) return 'DRY';
    if (value > section.wetAbove) return 'WET';
    return 'NORMAL';
  }

  if (sectionKey === 'light') {
    if (value < section.lowBelow) return 'LOW';
    if (value > section.highAbove) return 'HIGH';
    return 'NORMAL';
  }

  if (sectionKey === 'soil') {
    if (value < section.dryBelow) return 'DRY';
    if (value > section.wetAbove) return 'WET';
    return 'NORMAL';
  }

  return null;
}

const STATUS_COLORS = {
  LOW: 'blue',
  NORMAL: 'green',
  HIGH: 'orange',
  HOT: 'red',
  COLD: 'cyan',
  DRY: 'gold',
  WET: 'geekblue'
};

function ThresholdSection({ section, values, onChange, currentValue }) {
  const { key, title, icon, unit, min, max, lowKey, highKey, lowLabel, highLabel } = section;
  const low = values[lowKey];
  const high = values[highKey];
  const label = contextLabel(key, currentValue, { [key]: values });
  const markerPct = currentValue !== undefined
    ? Math.min(100, Math.max(0, ((currentValue - min) / (max - min)) * 100))
    : null;

  const handleRangeChange = ([nextLow, nextHigh]) => {
    onChange(key, { [lowKey]: nextLow, [highKey]: nextHigh });
  };

  return (
    <Card size="small" bordered={false} className="rules-section-card">
      <div className="rules-section-header">
        <Space size={8}>
          <span className="rules-section-icon">{icon}</span>
          <Text strong>{title}</Text>
          {currentValue !== undefined && (
            <Tag color={STATUS_COLORS[label] || 'default'}>
              Live: {currentValue}{unit} → {label || '—'}
            </Tag>
          )}
        </Space>
      </div>

      <div className="rules-track-wrap">
        {markerPct !== null && (
          <div
            className="rules-live-marker"
            style={{ left: `${markerPct}%` }}
            title={`Current: ${currentValue}${unit}`}
          />
        )}
        <div
          className="rules-zone-track"
          style={{
            background: `linear-gradient(to right,
              rgba(59, 130, 246, 0.35) 0%,
              rgba(59, 130, 246, 0.35) ${((low - min) / (max - min)) * 100}%,
              rgba(34, 197, 94, 0.35) ${((low - min) / (max - min)) * 100}%,
              rgba(34, 197, 94, 0.35) ${((high - min) / (max - min)) * 100}%,
              rgba(249, 115, 22, 0.35) ${((high - min) / (max - min)) * 100}%,
              rgba(249, 115, 22, 0.35) 100%)`
          }}
        />
        <Slider
          range
          min={min}
          max={max}
          value={[low, high]}
          onChange={handleRangeChange}
          tooltip={{ formatter: (v) => `${v}${unit}` }}
        />
      </div>

      <Row gutter={12} className="rules-inputs">
        <Col span={12}>
          <Text type="secondary" className="rules-input-label">{lowLabel}</Text>
          <InputNumber
            size="small"
            min={min}
            max={max - 1}
            value={low}
            addonAfter={unit || undefined}
            onChange={(v) => v !== null && onChange(key, { [lowKey]: v })}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={12}>
          <Text type="secondary" className="rules-input-label">{highLabel}</Text>
          <InputNumber
            size="small"
            min={min + 1}
            max={max}
            value={high}
            addonAfter={unit || undefined}
            onChange={(v) => v !== null && onChange(key, { [highKey]: v })}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
    </Card>
  );
}

function RulesSetupModal({ open, onClose, rules, readings, socket, onRulesSaved }) {
  const [form, setForm] = useState(DEFAULT_RULES);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && rules) {
      setForm(JSON.parse(JSON.stringify(rules)));
      setError(null);
    }
  }, [open, rules]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleAck = () => {
      setSaving(false);
      onRulesSaved?.();
    };

    const handleNack = ({ reason }) => {
      setSaving(false);
      setError(reason || 'Failed to save rules');
    };

    socket.on('rules_ack', handleAck);
    socket.on('rules_nack', handleNack);

    return () => {
      socket.off('rules_ack', handleAck);
      socket.off('rules_nack', handleNack);
    };
  }, [socket, onRulesSaved]);

  const updateSection = (sectionKey, patch) => {
    setForm((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], ...patch }
    }));
    setError(null);
  };

  const validateForm = () => {
    for (const section of RANGE_SECTIONS) {
      const { key, lowKey, highKey } = section;
      const low = form[key][lowKey];
      const high = form[key][highKey];
      if (low >= high) {
        return `${section.title}: low threshold must be less than high threshold`;
      }
    }

    if (form.schedule.dayStartHour === form.schedule.dayEndHour) {
      return 'Day start and end hours must differ';
    }

    return null;
  };

  const handleSave = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    socket.emit('update_rules', form);
  };

  const handleReset = () => {
    setForm(JSON.parse(JSON.stringify(DEFAULT_RULES)));
    setError(null);
  };

  const schedule = form.schedule || DEFAULT_RULES.schedule;
  const security = form.security || DEFAULT_RULES.security;
  const currentHour = new Date().getHours();
  const isDaytime = schedule.dayStartHour < schedule.dayEndHour
    ? currentHour >= schedule.dayStartHour && currentHour < schedule.dayEndHour
    : currentHour >= schedule.dayStartHour || currentHour < schedule.dayEndHour;

  return (
    <Modal
      title="Rules Setup"
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      className="rules-setup-modal"
      destroyOnClose
    >
      <Text type="secondary" className="rules-subtitle">
        Adjust thresholds for planner context, security alarms, and day/night schedule.
        Changes apply immediately.
      </Text>

      <div className="rules-sections">
        {RANGE_SECTIONS.map((section) => (
          <ThresholdSection
            key={section.key}
            section={section}
            values={form[section.key]}
            onChange={updateSection}
            currentValue={readings[section.readingKey]}
          />
        ))}

        <Card size="small" bordered={false} className="rules-section-card">
          <div className="rules-section-header">
            <Space size={8}>
              <span className="rules-section-icon"><SafetyOutlined /></span>
              <Text strong>Security</Text>
              {readings.motion !== undefined && (
                <Tag color={readings.motion ? 'magenta' : 'default'}>
                  Motion: {readings.motion ? 'DETECTED' : 'NONE'}
                </Tag>
              )}
            </Space>
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Text type="secondary" className="rules-input-label">Intrusion light below</Text>
              <InputNumber
                size="small"
                min={0}
                max={1023}
                value={security.intrusionLightBelow}
                onChange={(v) => v !== null && updateSection('security', { intrusionLightBelow: v })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={12}>
              <Text type="secondary" className="rules-input-label">Critical temp above (°C)</Text>
              <InputNumber
                size="small"
                min={-10}
                max={60}
                value={security.criticalTempAbove}
                onChange={(v) => v !== null && updateSection('security', { criticalTempAbove: v })}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Card>

        <Card size="small" bordered={false} className="rules-section-card">
          <div className="rules-section-header">
            <Space size={8}>
              <span className="rules-section-icon"><ClockCircleOutlined /></span>
              <Text strong>Day / Night Schedule</Text>
              <Tag color={isDaytime ? 'gold' : 'purple'}>
                Now: {isDaytime ? 'DAY' : 'NIGHT'} ({currentHour}:00)
              </Tag>
            </Space>
          </div>
          <Row gutter={12} align="middle">
            <Col span={10}>
              <Text type="secondary" className="rules-input-label">Day starts at</Text>
              <InputNumber
                size="small"
                min={0}
                max={23}
                value={schedule.dayStartHour}
                addonAfter="h"
                onChange={(v) => v !== null && updateSection('schedule', { dayStartHour: v })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={10}>
              <Text type="secondary" className="rules-input-label">Day ends at</Text>
              <InputNumber
                size="small"
                min={0}
                max={23}
                value={schedule.dayEndHour}
                addonAfter="h"
                onChange={(v) => v !== null && updateSection('schedule', { dayEndHour: v })}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Card>
      </div>

      {error && (
        <Text type="danger" className="rules-error">{error}</Text>
      )}

      <Divider style={{ margin: '16px 0 12px' }} />

      <div className="rules-footer">
        <Button onClick={handleReset}>Reset to defaults</Button>
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Save & Apply
          </Button>
        </Space>
      </div>

      <style>{`
        .rules-setup-modal .ant-modal-content {
          background: #0f172a;
        }
        .rules-setup-modal .ant-modal-header {
          background: transparent;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }
        .rules-subtitle {
          display: block;
          margin-bottom: 16px;
          font-size: 13px;
        }
        .rules-sections {
          max-height: 60vh;
          overflow-y: auto;
          padding-right: 4px;
        }
        .rules-section-card {
          background: rgba(30, 41, 59, 0.65) !important;
          border: 1px solid rgba(148, 163, 184, 0.1) !important;
          margin-bottom: 12px;
        }
        .rules-section-card .ant-card-body {
          padding: 12px 14px !important;
        }
        .rules-section-header {
          margin-bottom: 10px;
        }
        .rules-section-icon {
          color: #22c55e;
        }
        .rules-track-wrap {
          position: relative;
          padding: 0 4px;
        }
        .rules-zone-track {
          position: absolute;
          top: 14px;
          left: 8px;
          right: 8px;
          height: 4px;
          border-radius: 2px;
          pointer-events: none;
        }
        .rules-live-marker {
          position: absolute;
          top: 8px;
          width: 3px;
          height: 16px;
          background: #4ade80;
          border-radius: 2px;
          transform: translateX(-50%);
          z-index: 2;
          box-shadow: 0 0 6px rgba(74, 222, 128, 0.8);
        }
        .rules-inputs {
          margin-top: 4px;
        }
        .rules-input-label {
          display: block;
          font-size: 11px;
          margin-bottom: 4px;
        }
        .rules-error {
          display: block;
          margin-top: 8px;
          font-size: 12px;
        }
        .rules-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>
    </Modal>
  );
}

export default RulesSetupModal;
