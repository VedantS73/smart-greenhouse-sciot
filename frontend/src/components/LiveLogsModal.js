import React, { useEffect, useRef, useState } from 'react';
import { Modal, Select, Space, Typography, Badge, Button, Empty } from 'antd';
import { ClearOutlined, FileTextOutlined } from '@ant-design/icons';

const { Text } = Typography;

function LiveLogsModal({ open, onClose, socket }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const preRef = useRef(null);
  const selectedRef = useRef(null);

  useEffect(() => {
    selectedRef.current = selectedFile;
  }, [selectedFile]);

  // Attach socket listeners + list files while the modal is open.
  useEffect(() => {
    if (!open || !socket) {
      return undefined;
    }

    const handleList = ({ files: nextFiles, defaultFile }) => {
      const list = nextFiles || [];
      setFiles(list);
      setSelectedFile((prev) => {
        if (prev && list.includes(prev)) {
          return prev;
        }
        return defaultFile || list[0] || null;
      });
    };

    const handleSnapshot = ({ file, content: nextContent, files: nextFiles }) => {
      if (file !== selectedRef.current) {
        return;
      }
      if (nextFiles) {
        setFiles(nextFiles);
      }
      setContent(nextContent || '');
      setError(null);
      setAutoScroll(true);
    };

    const handleAppend = ({ file, chunk }) => {
      if (file !== selectedRef.current) {
        return;
      }
      setContent((prev) => prev + chunk);
    };

    const handleError = ({ reason }) => {
      setError(reason || 'Failed to read log');
    };

    socket.on('logs_list', handleList);
    socket.on('log_snapshot', handleSnapshot);
    socket.on('log_append', handleAppend);
    socket.on('log_error', handleError);

    setContent('');
    setError(null);
    socket.emit('list_logs');

    return () => {
      socket.off('logs_list', handleList);
      socket.off('log_snapshot', handleSnapshot);
      socket.off('log_append', handleAppend);
      socket.off('log_error', handleError);
      socket.emit('unsubscribe_log');
    };
  }, [open, socket]);

  // Switch / start live tail when the selected file changes.
  useEffect(() => {
    if (!open || !socket || !selectedFile) {
      return undefined;
    }
    setContent('');
    setError(null);
    socket.emit('subscribe_log', { file: selectedFile });
    return undefined;
  }, [open, socket, selectedFile]);

  useEffect(() => {
    if (!autoScroll || !preRef.current) {
      return;
    }
    preRef.current.scrollTop = preRef.current.scrollHeight;
  }, [content, autoScroll]);

  const handleScroll = () => {
    const el = preRef.current;
    if (!el) {
      return;
    }
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>Live Logs</span>
          <Badge status="processing" text="tailing" />
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      className="live-logs-modal"
      destroyOnClose
    >
      <div className="live-logs-toolbar">
        <Space wrap>
          <Text type="secondary">File</Text>
          <Select
            style={{ minWidth: 220 }}
            value={selectedFile}
            placeholder="Select a log file"
            options={files.map((f) => ({ value: f, label: f }))}
            onChange={(value) => {
              setSelectedFile(value);
              setAutoScroll(true);
            }}
            disabled={!files.length}
          />
          <Button
            icon={<ClearOutlined />}
            onClick={() => setContent('')}
            disabled={!content}
          >
            Clear view
          </Button>
        </Space>
      </div>

      {error && (
        <Text type="danger" className="live-logs-error">{error}</Text>
      )}

      {!files.length ? (
        <Empty
          description="No log files in logs/. Start the greenhouse system first."
          style={{ margin: '40px 0' }}
        />
      ) : (
        <pre
          ref={preRef}
          className="live-logs-pre"
          onScroll={handleScroll}
        >
          {content || 'Waiting for log output…'}
        </pre>
      )}

      <style>{`
        .live-logs-modal .ant-modal-content {
          background: #0f172a;
        }
        .live-logs-modal .ant-modal-header {
          background: transparent;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }
        .live-logs-toolbar {
          margin-bottom: 12px;
        }
        .live-logs-error {
          display: block;
          margin-bottom: 8px;
        }
        .live-logs-pre {
          margin: 0;
          height: 55vh;
          overflow: auto;
          padding: 12px 14px;
          background: #020617;
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 8px;
          color: #e2e8f0;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          line-height: 1.45;
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </Modal>
  );
}

export default LiveLogsModal;
