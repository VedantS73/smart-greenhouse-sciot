import React, { useState } from 'react';
import {
  Card,
  Tag,
  Space,
  Alert,
  Typography,
  Modal,
  Button,
  Descriptions
} from 'antd';
import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';

const { Text } = Typography;

const DEVICE_LABELS = {
  //led: 'LED',
  relay1: 'Fan',
  relay2: 'Pump',
  relay3: 'GrowLight',
  //buzzer: 'Buzzer'
};

const STATUS_COLORS = {
  LOW: 'blue',
  NORMAL: 'green',
  HIGH: 'orange',
  HOT: 'red',
  COLD: 'cyan',
  DRY: 'gold',
  WET: 'geekblue',
  DETECTED: 'magenta',
  NONE: 'default'
};

function tagColor(value) {
  return STATUS_COLORS[value] || 'default';
}

function PlannerPanel({ planner, actuators }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const context = planner?.context || {};
  const goal = planner?.goal || {};
  const actions = planner?.actions || {};
  const mismatch = planner?.action_mismatch || {};
  const hasMismatch = Object.keys(mismatch).length > 0;
  const autoMode = planner?.auto_mode !== false;

  const contextEntries = Object.entries(context);
  const actionEntries = Object.entries(actions);

  return (
    <>
      <Card
        size="small"
        bordered={false}
        className="planner-card"
        title={
          <Space size={8}>
            <span>Planner</span>
            <Tag color={autoMode ? 'processing' : 'warning'}>
              {autoMode ? 'AUTO' : 'MANUAL'}
            </Tag>
          </Space>
        }
        extra={
          <Button
            type="text"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => setDetailOpen(true)}
          >
            Details
          </Button>
        }
      >
        {hasMismatch && (
          <Alert
            type="error"
            showIcon
            icon={<WarningOutlined />}
            message="Hardware mismatch"
            description={
              <Space size={[4, 4]} wrap>
                {Object.keys(mismatch).map((device) => (
                  <Tag key={device} color="error">
                    {DEVICE_LABELS[device]}: want {actions[device] ? 'ON' : 'OFF'},
                    got {actuators[device] ? 'ON' : 'OFF'}
                  </Tag>
                ))}
              </Space>
            }
            className="planner-alert"
          />
        )}

        <div className="planner-compact">
          <div className="planner-group">
            <Text type="secondary" className="planner-label">Context</Text>
            <Space size={[4, 4]} wrap>
              {contextEntries.length === 0 ? (
                <Text type="secondary">—</Text>
              ) : (
                contextEntries.map(([k, v]) => (
                  <Tag key={k} color={tagColor(v)}>{k}: {v}</Tag>
                ))
              )}
            </Space>
          </div>

          <div className="planner-divider" />

          <div className="planner-group">
            <Text type="secondary" className="planner-label">Actions</Text>
            <Space size={6}>
              {actionEntries.length === 0 ? (
                <Text type="secondary">—</Text>
              ) : (
                actionEntries.map(([k, v]) => (
                  <Tag key={k} color={v ? 'success' : 'default'}>
                    {DEVICE_LABELS[k] || k}: {v ? 'ON' : 'OFF'}
                  </Tag>
                ))
              )}
            </Space>
          </div>
        </div>
      </Card>

      <Modal
        title="Planner Details"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={520}
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Mode">{autoMode ? 'AUTO' : 'MANUAL'}</Descriptions.Item>
        </Descriptions>

        <Text strong style={{ display: 'block', margin: '16px 0 8px' }}>Context</Text>
        <Descriptions column={2} size="small" bordered>
          {contextEntries.map(([k, v]) => (
            <Descriptions.Item key={k} label={k}>{v}</Descriptions.Item>
          ))}
        </Descriptions>

        <Text strong style={{ display: 'block', margin: '16px 0 8px' }}>Goal</Text>
        <Descriptions column={2} size="small" bordered>
          {Object.entries(goal).map(([k, v]) => (
            <Descriptions.Item key={k} label={k}>{v}</Descriptions.Item>
          ))}
        </Descriptions>

        <Text strong style={{ display: 'block', margin: '16px 0 8px' }}>Actions</Text>
        <Descriptions column={2} size="small" bordered>
          {actionEntries.map(([k, v]) => (
            <Descriptions.Item key={k} label={DEVICE_LABELS[k] || k}>
              {v ? 'ON' : 'OFF'}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Modal>

      <style>{`
        .planner-card {
          background: rgba(30, 41, 59, 0.65) !important;
          border: 1px solid rgba(148, 163, 184, 0.1) !important;
        }
        .planner-card .ant-card-head {
          min-height: 36px;
          padding: 0 12px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
        }
        .planner-card .ant-card-head-title {
          font-size: 13px;
          padding: 8px 0;
        }
        .planner-card .ant-card-body {
          padding: 10px 12px !important;
        }
        .planner-alert {
          margin-bottom: 8px;
          padding: 6px 10px !important;
        }
        .planner-alert .ant-alert-message {
          font-size: 12px;
        }
        .planner-alert .ant-alert-description {
          font-size: 11px;
        }
        .planner-compact {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .planner-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        .planner-label {
          font-size: 11px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .planner-divider {
          width: 1px;
          height: 24px;
          background: rgba(148, 163, 184, 0.15);
          flex-shrink: 0;
        }
      `}</style>
    </>
  );
}

export default PlannerPanel;
