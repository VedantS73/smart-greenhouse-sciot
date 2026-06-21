import React from 'react';
import { AlertCircle } from 'lucide-react';
import './Panel.css';

function EventLog({ events }) {
  return (
    <div className="panel">
      <h2 className="panel-title">📋 Event Log</h2>
      <div className="event-log-container">
        {events && events.length > 0 ? (
          events.map((event, idx) => (
            <div key={idx} className="event-item">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{event}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="event-empty">
            No events yet. System is running smoothly.
          </div>
        )}
      </div>
    </div>
  );
}

export default EventLog;
