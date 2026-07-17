import React, { useEffect, useState } from 'react';
import {
  Modal,
  Card,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  Switch,
  Alert
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MobileOutlined,
  MessageOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// E.164-ish: optional +, 8-15 digits.
const PHONE_RE = /^\+?[0-9]{8,15}$/;

function SettingsModal({ open, onClose, settings, socket, onSettingsSaved }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setUsername(settings?.auth?.username || '');
    setPassword('');
    setConfirmPassword('');
    setPhoneNumber(settings?.sms?.phoneNumber || '');
    setSmsEnabled(settings?.sms?.enabled !== false);
    setError(null);
    setSaving(false);
  }, [open, settings]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleAck = () => {
      setSaving(false);
      onSettingsSaved?.();
      onClose?.();
    };

    const handleNack = ({ reason }) => {
      setSaving(false);
      setError(reason || 'Failed to save settings');
    };

    socket.on('settings_ack', handleAck);
    socket.on('settings_nack', handleNack);

    return () => {
      socket.off('settings_ack', handleAck);
      socket.off('settings_nack', handleNack);
    };
  }, [socket, onSettingsSaved, onClose]);

  const validate = () => {
    if (!username.trim()) {
      return 'Username cannot be empty';
    }
    if (password && password.length < 3) {
      return 'Password must be at least 3 characters';
    }
    if (password && password !== confirmPassword) {
      return 'Passwords do not match';
    }
    if (smsEnabled && phoneNumber.trim() && !PHONE_RE.test(phoneNumber.trim())) {
      return 'Enter a valid phone number, e.g. +14155552671';
    }
    return null;
  };

  const handleSave = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      auth: { username: username.trim() },
      sms: { enabled: smsEnabled, phoneNumber: phoneNumber.trim() }
    };

    // Only send password when the user actually typed a new one.
    if (password) {
      payload.auth.password = password;
    }

    setSaving(true);
    setError(null);
    socket.emit('update_settings', payload);
  };

  return (
    <Modal
      title="Settings"
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      className="settings-modal"
      destroyOnClose
    >
      <Text type="secondary" className="settings-subtitle">
        Manage the dashboard login and the phone number that receives SMS alerts.
        Changes apply immediately.
      </Text>

      <div className="settings-sections">
        <Card size="small" bordered={false} className="settings-section-card">
          <div className="settings-section-header">
            <Space size={8}>
              <span className="settings-section-icon"><UserOutlined /></span>
              <Text strong>Account</Text>
            </Space>
          </div>

          <Text type="secondary" className="settings-input-label">Username</Text>
          <Input
            prefix={<UserOutlined />}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            autoComplete="username"
          />

          <Text type="secondary" className="settings-input-label">
            New password <Text type="secondary" italic>(leave blank to keep current)</Text>
          </Text>
          <Input.Password
            prefix={<LockOutlined />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
          />

          <Text type="secondary" className="settings-input-label">Confirm new password</Text>
          <Input.Password
            prefix={<LockOutlined />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
        </Card>

        <Card size="small" bordered={false} className="settings-section-card">
          <div className="settings-section-header">
            <Space size={8}>
              <span className="settings-section-icon"><MessageOutlined /></span>
              <Text strong>SMS Alerts</Text>
            </Space>
          </div>

          <Space className="settings-sms-toggle">
            <Switch checked={smsEnabled} onChange={setSmsEnabled} />
            <Text>Send SMS on security alerts</Text>
          </Space>

          <Text type="secondary" className="settings-input-label">Alert phone number</Text>
          <Input
            prefix={<MobileOutlined />}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+14155552671"
            disabled={!smsEnabled}
          />
          <Text type="secondary" className="settings-hint">
            Use full international format. On a Twilio trial, the number must be verified.
          </Text>
        </Card>
      </div>

      {error && (
        <Alert type="error" message={error} showIcon style={{ marginTop: 12 }} />
      )}

      <Divider style={{ margin: '16px 0 12px' }} />

      <div className="settings-footer">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="primary" loading={saving} onClick={handleSave}>
          Save
        </Button>
      </div>

      <style>{`
        .settings-modal .ant-modal-content {
          background: #0f172a;
        }
        .settings-modal .ant-modal-header {
          background: transparent;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }
        .settings-subtitle {
          display: block;
          margin-bottom: 16px;
          font-size: 13px;
        }
        .settings-section-card {
          background: rgba(30, 41, 59, 0.65) !important;
          border: 1px solid rgba(148, 163, 184, 0.1) !important;
          margin-bottom: 12px;
        }
        .settings-section-card .ant-card-body {
          padding: 12px 14px !important;
        }
        .settings-section-header {
          margin-bottom: 12px;
        }
        .settings-section-icon {
          color: #22c55e;
        }
        .settings-input-label {
          display: block;
          margin: 12px 0 4px;
          font-size: 12px;
        }
        .settings-hint {
          display: block;
          margin-top: 6px;
          font-size: 11px;
        }
        .settings-sms-toggle {
          margin-bottom: 4px;
        }
        .settings-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
      `}</style>
    </Modal>
  );
}

export default SettingsModal;
