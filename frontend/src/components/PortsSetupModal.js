import React, { useEffect, useState } from 'react';
import { Modal, Card, Row, Col, InputNumber, Button, Space, Typography, Divider } from 'antd';
import { ApartmentOutlined, GatewayOutlined } from '@ant-design/icons';

const { Text } = Typography;

const DEFAULT_PORTS = {
  sensors: {
    sound: 0,
    light: 1,
    moisture: 2,
    temperatureHumidity: 7,
    motion: 8
  },
  actuators: {
    buzzer: 2,
    relay1: 4,
    led: 3,
    relay2: 5,
    relay3: 6
  }
};

const SENSOR_FIELDS = [
  { key: 'sound', label: 'Sound sensor', range: '0-8' },
  { key: 'light', label: 'Light sensor', range: '0-8' },
  { key: 'moisture', label: 'Moisture sensor', range: '0-8' },
  { key: 'temperatureHumidity', label: 'Temp/Humidity (DHT)', range: '0-8' },
  { key: 'motion', label: 'Motion (PIR)', range: '0-8' }
];

const ACTUATOR_FIELDS = [
  { key: 'buzzer', label: 'Buzzer', range: '0-8' },
  { key: 'relay1', label: 'Fan relay', range: '0-8' },
  { key: 'led', label: 'Alarm LED', range: '0-8' },
  { key: 'relay2', label: 'Pump relay', range: '0-8' },
  { key: 'relay3', label: 'Grow light relay', range: '0-8' }
];

function hasDuplicatePorts(group) {
  const values = Object.values(group);
  return new Set(values).size !== values.length;
}

function PortsSetupModal({ open, onClose, ports, socket, onPortsSaved }) {
  const [form, setForm] = useState(DEFAULT_PORTS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && ports) {
      setForm(JSON.parse(JSON.stringify(ports)));
      setError(null);
    }
  }, [open, ports]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleAck = () => {
      setSaving(false);
      onPortsSaved?.();
    };

    const handleNack = ({ reason }) => {
      setSaving(false);
      setError(reason || 'Failed to save ports mapping');
    };

    socket.on('ports_ack', handleAck);
    socket.on('ports_nack', handleNack);

    return () => {
      socket.off('ports_ack', handleAck);
      socket.off('ports_nack', handleNack);
    };
  }, [socket, onPortsSaved]);

  const setPortValue = (section, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setError(null);
  };

  const validate = () => {
    if (hasDuplicatePorts(form.sensors)) {
      return 'Sensor ports must be unique';
    }
    if (hasDuplicatePorts(form.actuators)) {
      return 'Actuator ports must be unique';
    }
    return null;
  };

  const handleSave = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    socket.emit('update_ports', form);
  };

  const handleReset = () => {
    setForm(JSON.parse(JSON.stringify(DEFAULT_PORTS)));
    setError(null);
  };

  return (
    <Modal
      title="Port Mapping Setup"
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      className="ports-setup-modal"
      destroyOnClose
    >
      <Text type="secondary" className="ports-subtitle">
        Change Grove port mappings for sensors and actuators. Saving updates `config/ports.json`
        and applies live.
      </Text>

      <Row gutter={12}>
        <Col span={12}>
          <Card size="small" bordered={false} className="ports-card">
            <Space size={8} className="ports-card-title">
              <ApartmentOutlined />
              <Text strong>Sensors</Text>
            </Space>
            <div className="ports-grid">
              {SENSOR_FIELDS.map((field) => (
                <div key={field.key} className="ports-row">
                  <Text type="secondary" className="ports-label">{field.label}</Text>
                  <InputNumber
                    min={0}
                    max={8}
                    size="small"
                    value={form.sensors[field.key]}
                    onChange={(value) => {
                      if (value !== null) setPortValue('sensors', field.key, value);
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card size="small" bordered={false} className="ports-card">
            <Space size={8} className="ports-card-title">
              <GatewayOutlined />
              <Text strong>Actuators</Text>
            </Space>
            <div className="ports-grid">
              {ACTUATOR_FIELDS.map((field) => (
                <div key={field.key} className="ports-row">
                  <Text type="secondary" className="ports-label">{field.label}</Text>
                  <InputNumber
                    min={0}
                    max={8}
                    size="small"
                    value={form.actuators[field.key]}
                    onChange={(value) => {
                      if (value !== null) setPortValue('actuators', field.key, value);
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {error && (
        <Text type="danger" className="ports-error">{error}</Text>
      )}

      <Divider style={{ margin: '16px 0 12px' }} />
      <div className="ports-footer">
        <Button onClick={handleReset}>Reset to defaults</Button>
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Save & Apply
          </Button>
        </Space>
      </div>

      <style>{`
        .ports-setup-modal .ant-modal-content {
          background: #0f172a;
        }
        .ports-setup-modal .ant-modal-header {
          background: transparent;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }
        .ports-subtitle {
          display: block;
          margin-bottom: 14px;
          font-size: 13px;
        }
        .ports-card {
          background: rgba(30, 41, 59, 0.65) !important;
          border: 1px solid rgba(148, 163, 184, 0.1) !important;
          height: 100%;
        }
        .ports-card .ant-card-body {
          padding: 12px 14px !important;
        }
        .ports-card-title {
          margin-bottom: 10px;
          color: #22c55e;
        }
        .ports-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ports-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .ports-label {
          font-size: 12px;
        }
        .ports-error {
          display: block;
          margin-top: 10px;
        }
        .ports-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      `}</style>
    </Modal>
  );
}

export default PortsSetupModal;
