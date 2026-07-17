import React from 'react';
import { List, Typography, Empty } from 'antd';

const { Text } = Typography;

function EventLog({ events }) {
  const items = events || [];

  if (items.length === 0) {
    return <Empty description="No events yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <List
      size="small"
      dataSource={items}
      renderItem={(event, idx) => {
        const message = typeof event === 'string' ? event : event.message;
        return (
          <List.Item key={idx} style={{ padding: '8px 0', borderColor: 'rgba(148,163,184,0.1)' }}>
            <Text style={{ fontSize: 13 }}>{message}</Text>
          </List.Item>
        );
      }}
    />
  );
}

export default EventLog;
