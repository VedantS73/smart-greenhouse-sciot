import React from 'react';
import { Card, Row, Col, Typography, Tag, Tooltip } from 'antd';
import {
  CloudOutlined,
  SunOutlined,
  FireOutlined,
  SoundOutlined,
  DropboxOutlined,
  RadarChartOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const SENSOR_CONFIG = [
  { key: 'humidity', icon: CloudOutlined, label: 'Humidity', unit: '%', color: '#3b82f6' },
  { key: 'light', icon: SunOutlined, label: 'Light', unit: '', color: '#f59e0b' },
  { key: 'temperature', icon: FireOutlined, label: 'Temp', unit: '°C', color: '#ef4444' },
  { key: 'sound', icon: SoundOutlined, label: 'Sound', unit: '', color: '#8b5cf6' },
  { key: 'moisture', icon: DropboxOutlined, label: 'Moisture', unit: '', color: '#10b981' },
  { key: 'motion', icon: RadarChartOutlined, label: 'Motion', unit: '', color: '#ec4899', isMotion: true }
];

function formatValue(value, isMotion) {
  if (isMotion) return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toFixed(1);
  return '--';
}

function SensorPanel({ readings, meta }) {
  return (
    <Card
      size="small"
      title="Sensor Readings"
      bordered={false}
      className="sensors-card"
    >
      <Row gutter={[8, 0]} wrap={false}>
        {SENSOR_CONFIG.map(({ key, icon: Icon, label, unit, color, isMotion }) => {
          const fieldMeta = meta[key] || { stale: true, invalid: false };
          const stale = fieldMeta.stale;
          const invalid = fieldMeta.invalid;
          const value = readings[key];
          const hasValue = value !== undefined && !stale;

          return (
            <Col flex={1} key={key}>
              <div className={`sensor-tile ${stale ? 'stale' : ''}`}>
                <Icon style={{ color, fontSize: 16 }} />
                <Text type="secondary" className="sensor-name">{label}</Text>
                <Text strong className="sensor-val">
                  {hasValue ? formatValue(value, isMotion) : '--'}
                  {hasValue && unit && !isMotion ? unit : ''}
                </Text>
                {stale && (
                  <Tooltip title="No data for 15+ seconds">
                    <Tag color="error" className="sensor-tag">Stale</Tag>
                  </Tooltip>
                )}
                {invalid && !stale && (
                  <Tag color="warning" className="sensor-tag">Invalid</Tag>
                )}
              </div>
            </Col>
          );
        })}
      </Row>
      <style>{`
        .sensors-card {
          height: 100%;
          background: rgba(30, 41, 59, 0.65) !important;
          border: 1px solid rgba(148, 163, 184, 0.1) !important;
        }
        .sensors-card .ant-card-head {
          min-height: 36px;
          padding: 0 12px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
        }
        .sensors-card .ant-card-head-title {
          font-size: 13px;
          padding: 8px 0;
        }
        .sensors-card .ant-card-body {
          padding: 10px 12px !important;
        }
        .sensor-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px 4px;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.08);
          min-width: 0;
        }
        .sensor-tile.stale {
          border-color: rgba(239, 68, 68, 0.35);
        }
        .sensor-name {
          font-size: 10px;
          white-space: nowrap;
        }
        .sensor-val {
          font-size: 15px;
          line-height: 1.2;
        }
        .sensor-tag {
          font-size: 9px;
          line-height: 14px;
          margin: 0;
          padding: 0 4px;
        }
      `}</style>
    </Card>
  );
}

export default SensorPanel;
