import {
  ActivityEvent,
  EventService,
  EventSource,
  EventType,
} from '@time-trace-local/core';
import React, { useEffect, useState } from 'react';
import './App.css';

// Mock VS Code API for development
declare global {
  interface Window {
    acquireVsCodeApi?: () => {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
  }
}

const App: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize event service for demo purposes
  const eventService = new EventService();

  useEffect(() => {
    // Add some demo events
    eventService.addEvent({
      timestamp: new Date(),
      source: EventSource.GIT,
      type: EventType.COMMIT,
      data: { message: 'Initial commit', repository: 'time-trace-local' },
    });

    eventService.addEvent({
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      source: EventSource.JIRA,
      type: EventType.TICKET_CREATED,
      data: { ticketId: 'TT-123', title: 'Implement activity tracking' },
    });

    eventService.addEvent({
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      source: EventSource.FILE_SYSTEM,
      type: EventType.FILE_SAVED,
      data: { filePath: '/src/extension.ts', size: 1024 },
    });
  }, []);

  const handleLoadEvents = () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const allEvents = eventService.getAllEvents();
      setEvents(allEvents);
      setLoading(false);
    }, 500);
  };

  const handleShowInfo = () => {
    // Try to communicate with VS Code if available
    if (window.acquireVsCodeApi) {
      const vscode = window.acquireVsCodeApi();
      vscode.postMessage({
        type: 'info',
        text: 'Time Trace Local is ready to track your activities!',
      });
    } else {
      alert('Time Trace Local is ready to track your activities!');
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSourceIcon = (source: EventSource) => {
    switch (source) {
      case EventSource.GIT:
        return '🔀';
      case EventSource.JIRA:
        return '🎫';
      case EventSource.FILE_SYSTEM:
        return '📁';
      case EventSource.PC_LOGIN:
        return '🔐';
      case EventSource.SYSLOG:
        return '📋';
      default:
        return '📝';
    }
  };

  const getTypeColor = (type: EventType) => {
    switch (type) {
      case EventType.COMMIT:
        return '#4CAF50';
      case EventType.TICKET_CREATED:
        return '#2196F3';
      case EventType.FILE_SAVED:
        return '#FF9800';
      case EventType.LOGIN:
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h2>🕒 Time Trace Local</h2>
        <p>Track your activity and map events to bookable elements</p>
      </div>

      <div className="actions">
        <button
          className="button primary"
          onClick={handleLoadEvents}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load Events'}
        </button>
        <button className="button secondary" onClick={handleShowInfo}>
          Show Info
        </button>
      </div>

      <div className="events-section">
        <h3>Recent Events ({events.length})</h3>

        {events.length === 0 ? (
          <div className="empty-state">
            <p>Click "Load Events" to see your activity data</p>
          </div>
        ) : (
          <div className="events-list">
            {events.map((event) => (
              <div key={event.id} className="event-item">
                <div className="event-header">
                  <span className="event-icon">
                    {getSourceIcon(event.source)}
                  </span>
                  <span
                    className="event-type"
                    style={{ color: getTypeColor(event.type) }}
                  >
                    {event.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="event-source">from {event.source}</span>
                </div>

                <div className="event-timestamp">
                  {formatTimestamp(event.timestamp)}
                </div>

                <div className="event-data">
                  {Object.entries(event.data).map(([key, value]) => (
                    <div key={key} className="data-item">
                      <strong>{key}:</strong> {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="footer">
        <small>Ready to map events to bookable elements</small>
      </div>
    </div>
  );
};

export default App;
