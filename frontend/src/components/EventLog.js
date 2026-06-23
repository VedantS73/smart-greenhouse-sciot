import React from 'react';
import './Panel.css';

function EventLog({ events }) {
  const items = events || [];

  return (
    <div className="panel">
      <h2 className="panel-title">Activity Log</h2>
      <div className="event-log-list">
        {items.length === 0 ? (
          <p className="event-empty">No events yet</p>
        ) : (
          items.map((event, idx) => {
            const message = typeof event === 'string' ? event : event.message;
            return (
              <div key={idx} className="event-item">
                {message}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default EventLog;
