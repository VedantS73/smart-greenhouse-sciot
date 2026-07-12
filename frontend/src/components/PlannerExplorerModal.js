import React, { useEffect, useState } from 'react';
import {
  Modal,
  Tabs,
  Button,
  Space,
  Typography,
  Tag,
  Steps,
  Alert,
  Tooltip,
  Divider,
  Progress
} from 'antd';
import {
  ReloadOutlined,
  ThunderboltOutlined,
  NodeIndexOutlined,
  CodeOutlined,
  ApartmentOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

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

const DEVICE_LABELS = {
  relay1: 'Fan',
  relay2: 'Pump',
  relay3: 'Grow Light'
};

const ACTION_LABELS = {
  'turn-on-fan': 'Turn on fan',
  'turn-off-fan': 'Turn off fan',
  'turn-on-fan-humidity': 'Turn on fan (humidity)',
  'turn-on-pump': 'Turn on pump',
  'turn-off-pump': 'Turn off pump',
  'turn-on-led': 'Turn on grow light',
  'turn-off-led': 'Turn off grow light'
};

function formatAction(step) {
  return ACTION_LABELS[step] || step.replace(/-/g, ' ');
}

function HealthBreakdown({ score, readings, sensorMeta }) {
  const items = [];

  const t = readings.temperature;
  if (t === undefined || sensorMeta.temperature?.stale) {
    items.push({ label: 'Temperature', delta: -100, note: 'No data' });
  } else if (t < 18 || t > 32) {
    items.push({ label: 'Temperature', delta: -20, note: `${t}°C — far from ideal` });
  } else if (t < 20 || t > 28) {
    items.push({ label: 'Temperature', delta: -10, note: `${t}°C — slightly off` });
  } else {
    items.push({ label: 'Temperature', delta: 0, note: `${t}°C — good` });
  }

  const h = readings.humidity;
  if (h !== undefined && !sensorMeta.humidity?.stale) {
    if (h < 30 || h > 80) {
      items.push({ label: 'Humidity', delta: -20, note: `${h}% — far from ideal` });
    } else if (h < 50 || h > 70) {
      items.push({ label: 'Humidity', delta: -10, note: `${h}% — slightly off` });
    } else {
      items.push({ label: 'Humidity', delta: 0, note: `${h}% — good` });
    }
  }

  const l = readings.light;
  if (l !== undefined && !sensorMeta.light?.stale) {
    if (l < 100 || l > 1000) {
      items.push({ label: 'Light', delta: -15, note: `${l} — far from ideal` });
    } else {
      items.push({ label: 'Light', delta: 0, note: `${l} — good` });
    }
  }

  return (
    <div className="explorer-health-breakdown">
      <Space align="center" style={{ marginBottom: 12 }}>
        <Progress
          type="circle"
          percent={score}
          size={64}
          strokeColor={score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444'}
        />
        <div>
          <Text strong>Environment health</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Based on temperature, humidity, and light readings
          </Text>
        </div>
      </Space>
      {items.map((item) => (
        <div key={item.label} className="health-breakdown-row">
          <Text>{item.label}</Text>
          <Tag color={item.delta === 0 ? 'success' : 'warning'}>
            {item.delta === 0 ? 'OK' : `${item.delta}`}
          </Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>{item.note}</Text>
        </div>
      ))}
    </div>
  );
}

function FlowGraph({ planner, actuators, readings }) {
  const context = planner?.context || {};
  const actions = planner?.actions || {};
  const planSteps = planner?.plan_steps || [];
  const planSource = planner?.plan_source || 'rules';

  const contextNodes = Object.entries(context).filter(([k]) => k !== 'motion');
  const actionNodes = Object.entries(actions).filter(([k]) => DEVICE_LABELS[k]);
  const actuatorNodes = Object.entries(actuators).filter(([k]) => DEVICE_LABELS[k]);

  return (
    <div className="planner-flow-graph">
      <div className="flow-row">
        <div className="flow-node flow-node-sensors">
          <Text className="flow-node-title">Sensors</Text>
          <div className="flow-node-body">
            {['temperature', 'humidity', 'light', 'moisture'].map((key) => (
              <Tag key={key} className="flow-tag">
                {key}: {readings[key] ?? '—'}
              </Tag>
            ))}
          </div>
        </div>

        <div className="flow-arrow">→</div>

        <div className="flow-node flow-node-context">
          <Text className="flow-node-title">Context</Text>
          <div className="flow-node-body">
            {contextNodes.length === 0 ? (
              <Text type="secondary">Waiting…</Text>
            ) : (
              contextNodes.map(([k, v]) => (
                <Tag key={k} color={STATUS_COLORS[v] || 'default'}>{k}: {v}</Tag>
              ))
            )}
          </div>
        </div>

        <div className="flow-arrow">→</div>

        <div className="flow-node flow-node-planner">
          <Text className="flow-node-title">PDDL Planner</Text>
          <div className="flow-node-body">
            <Tag color={planSource === 'pddl' ? 'processing' : 'warning'}>
              {planSource === 'pddl' ? 'PDDL plan' : 'Rule fallback'}
            </Tag>
            {planSteps.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 11 }}>No plan steps</Text>
            ) : (
              planSteps.map((step, i) => (
                <Tag key={`${step}-${i}`} className="flow-tag">{formatAction(step)}</Tag>
              ))
            )}
          </div>
        </div>

        <div className="flow-arrow">→</div>

        <div className="flow-node flow-node-actions">
          <Text className="flow-node-title">Actions</Text>
          <div className="flow-node-body">
            {actionNodes.map(([k, v]) => (
              <Tag key={k} color={v ? 'success' : 'default'}>
                {DEVICE_LABELS[k]}: {v ? 'ON' : 'OFF'}
              </Tag>
            ))}
          </div>
        </div>

        <div className="flow-arrow">→</div>

        <div className="flow-node flow-node-actuators">
          <Text className="flow-node-title">Hardware</Text>
          <div className="flow-node-body">
            {actuatorNodes.map(([k, v]) => (
              <Tag
                key={k}
                color={v === actions[k] ? 'success' : 'error'}
              >
                {DEVICE_LABELS[k]}: {v ? 'ON' : 'OFF'}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PddlViewer({ title, content, loading, emptyMessage }) {
  return (
    <div className="pddl-viewer">
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        {title}
      </Text>
      {loading ? (
        <Text type="secondary">Loading…</Text>
      ) : (
        <pre className="pddl-code">{content || emptyMessage}</pre>
      )}
    </div>
  );
}

function PlannerExplorerModal({
  open,
  onClose,
  score,
  readings,
  sensorMeta,
  planner,
  actuators,
  socket,
  autoMode
}) {
  const [domainPddl, setDomainPddl] = useState('');
  const [problemPddl, setProblemPddl] = useState('');
  const [loadingDomain, setLoadingDomain] = useState(false);
  const [replanning, setReplanning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const planSteps = planner?.plan_steps || [];
  const liveProblem = planner?.problem_pddl || '';
  const mismatch = planner?.action_mismatch || {};
  const hasMismatch = Object.keys(mismatch).length > 0;

  useEffect(() => {
    if (!open) return undefined;

    setLoadingDomain(true);
    setStatusMsg(null);

    Promise.all([
      fetch(`${API_URL}/api/planner/domain`).then((r) => (r.ok ? r.text() : '')),
      fetch(`${API_URL}/api/planner/problem`).then((r) => (r.ok ? r.text() : ''))
    ])
      .then(([domain, problem]) => {
        setDomainPddl(domain);
        setProblemPddl(problem);
      })
      .catch(() => {
        setStatusMsg({ type: 'error', text: 'Failed to load PDDL files' });
      })
      .finally(() => setLoadingDomain(false));

    return undefined;
  }, [open, planner?.timestamp]);

  useEffect(() => {
    if (!socket) return undefined;

    const onReplanAck = () => {
      setReplanning(false);
      setStatusMsg({ type: 'success', text: 'Replan requested — waiting for planner…' });
    };

    const onApplyAck = () => {
      setApplying(false);
      setStatusMsg({ type: 'success', text: 'Planner actions sent to actuators' });
    };

    const onApplyNack = ({ reason }) => {
      setApplying(false);
      setStatusMsg({
        type: 'warning',
        text: reason === 'manual_mode_active'
          ? 'Switch to AUTO mode to apply planner actions'
          : 'Could not apply planner actions'
      });
    };

    socket.on('replan_ack', onReplanAck);
    socket.on('apply_planner_ack', onApplyAck);
    socket.on('apply_planner_nack', onApplyNack);

    return () => {
      socket.off('replan_ack', onReplanAck);
      socket.off('apply_planner_ack', onApplyAck);
      socket.off('apply_planner_nack', onApplyNack);
    };
  }, [socket]);

  useEffect(() => {
    if (liveProblem) {
      setProblemPddl(liveProblem);
    }
  }, [liveProblem]);

  useEffect(() => {
    if (replanning && planner?.timestamp) {
      setReplanning(false);
      setStatusMsg({ type: 'success', text: 'Planner updated' });
    }
  }, [planner?.timestamp, replanning]);

  const handleReplan = () => {
    setReplanning(true);
    setStatusMsg(null);
    socket?.emit('request_replan');
    setTimeout(() => setReplanning(false), 8000);
  };

  const handleApply = () => {
    setApplying(true);
    setStatusMsg(null);
    socket?.emit('apply_planner_actions');
    setTimeout(() => setApplying(false), 5000);
  };

  const tabItems = [
    {
      key: 'flow',
      label: (
        <span><NodeIndexOutlined /> Flow</span>
      ),
      children: (
        <FlowGraph
          planner={planner}
          actuators={actuators}
          readings={readings}
        />
      )
    },
    {
      key: 'problem',
      label: (
        <span><CodeOutlined /> Problem</span>
      ),
      children: (
        <PddlViewer
          title="Generated problem.pddl from current context"
          content={liveProblem || problemPddl}
          loading={loadingDomain && !liveProblem}
          emptyMessage="No problem generated yet. Trigger a replan when sensors are active."
        />
      )
    },
    {
      key: 'domain',
      label: (
        <span><ApartmentOutlined /> Domain</span>
      ),
      children: (
        <PddlViewer
          title="PDDL domain — available actions and preconditions"
          content={domainPddl}
          loading={loadingDomain}
          emptyMessage="Domain file not available"
        />
      )
    },
    {
      key: 'plan',
      label: (
        <span><ThunderboltOutlined /> Plan</span>
      ),
      children: (
        <div className="plan-steps-panel">
          <Space style={{ marginBottom: 12 }}>
            <Tag color={planner?.plan_source === 'pddl' ? 'processing' : 'warning'}>
              Source: {planner?.plan_source === 'pddl' ? 'PDDL solver' : 'Rule-based fallback'}
            </Tag>
            <Tag color={autoMode ? 'processing' : 'warning'}>
              {autoMode ? 'AUTO mode' : 'MANUAL mode'}
            </Tag>
          </Space>
          {planSteps.length === 0 ? (
            <Alert
              type="info"
              showIcon
              message="No PDDL plan steps"
              description="The planner used rule-based fallback, or pyperplan returned an empty plan. Use Replan to try again."
            />
          ) : (
            <Steps
              direction="vertical"
              size="small"
              current={planSteps.length}
              items={planSteps.map((step) => ({
                title: formatAction(step),
                description: step
              }))}
            />
          )}
          <Divider />
          <Text type="secondary" style={{ fontSize: 12 }}>Resolved actuator commands</Text>
          <div style={{ marginTop: 8 }}>
            <Space wrap>
              {Object.entries(planner?.actions || {})
                .filter(([k]) => DEVICE_LABELS[k])
                .map(([k, v]) => (
                  <Tag key={k} color={v ? 'success' : 'default'}>
                    {DEVICE_LABELS[k]}: {v ? 'ON' : 'OFF'}
                  </Tag>
                ))}
            </Space>
          </div>
        </div>
      )
    }
  ];

  return (
    <Modal
      title="Planner Explorer"
      open={open}
      onCancel={onClose}
      width={920}
      className="planner-explorer-modal"
      footer={(
        <Space>
          <Tooltip title="Re-run PDDL planner with current sensor context">
            <Button
              icon={<ReloadOutlined />}
              loading={replanning}
              onClick={handleReplan}
            >
              Replan
            </Button>
          </Tooltip>
          <Tooltip title="Force-send current planner actions to actuators (AUTO mode)">
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={applying}
              disabled={!autoMode}
              onClick={handleApply}
            >
              Apply Actions
            </Button>
          </Tooltip>
          <Button onClick={onClose}>Close</Button>
        </Space>
      )}
    >
      <HealthBreakdown
        score={score}
        readings={readings}
        sensorMeta={sensorMeta}
      />

      <Divider style={{ margin: '16px 0' }} />

      {hasMismatch && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message="Hardware mismatch"
          description={(
            <Space wrap>
              {Object.keys(mismatch).map((device) => (
                <Tag key={device} color="error">
                  {DEVICE_LABELS[device]}: want {planner.actions[device] ? 'ON' : 'OFF'},
                  got {actuators[device] ? 'ON' : 'OFF'}
                </Tag>
              ))}
            </Space>
          )}
        />
      )}

      {statusMsg && (
        <Alert
          type={statusMsg.type}
          showIcon
          closable
          style={{ marginBottom: 12 }}
          message={statusMsg.text}
          onClose={() => setStatusMsg(null)}
        />
      )}

      <Tabs items={tabItems} size="small" />

      <style>{`
        .planner-explorer-modal .ant-modal-content {
          background: #0f172a;
        }
        .planner-explorer-modal .ant-modal-header {
          background: transparent;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }
        .explorer-health-breakdown .health-breakdown-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .planner-flow-graph {
          overflow-x: auto;
          padding: 8px 0 16px;
        }
        .flow-row {
          display: flex;
          align-items: stretch;
          gap: 8px;
          min-width: 720px;
        }
        .flow-node {
          flex: 1;
          min-width: 120px;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 8px;
          padding: 10px;
        }
        .flow-node-title {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .flow-node-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .flow-tag {
          font-size: 10px !important;
          margin: 0 !important;
        }
        .flow-arrow {
          display: flex;
          align-items: center;
          color: #22c55e;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .flow-node-sensors { border-color: rgba(59, 130, 246, 0.35); }
        .flow-node-context { border-color: rgba(34, 197, 94, 0.35); }
        .flow-node-planner { border-color: rgba(168, 85, 247, 0.35); }
        .flow-node-actions { border-color: rgba(245, 158, 11, 0.35); }
        .flow-node-actuators { border-color: rgba(239, 68, 68, 0.35); }
        .pddl-viewer {
          max-height: 360px;
          overflow: auto;
        }
        .pddl-code {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 8px;
          padding: 12px;
          margin: 0;
          font-size: 11px;
          line-height: 1.5;
          color: #e2e8f0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .plan-steps-panel {
          min-height: 200px;
        }
      `}</style>
    </Modal>
  );
}

export default PlannerExplorerModal;
