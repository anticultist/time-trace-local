// Import the VSCode Elements React wrapper components
import { VscodeIcon } from "@vscode-elements/react-elements";
import { useState, useEffect } from "react";
import type { VsCodeApi } from "./types/vscode";
import type { Event } from "./types/services";

interface AppProps {
  readonly vscode: VsCodeApi;
}

export function App({ vscode }: AppProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for messages from the extension
    const messageListener = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "showEvents") {
        setEvents(message.events || []);
        setIsLoading(false);
      } else if (message.type === "loadingEvents") {
        setEvents([]);
        setIsLoading(true);
      }
    };

    window.addEventListener("message", messageListener);

    // Send ready message to extension to request initial data
    vscode.postMessage({
      type: "webviewReady",
    });

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("message", messageListener);
    };
  }, [vscode]);

  const formatEventType = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTime = (timeString: number): string => {
    const date = new Date(timeString);
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (timeString: number): string => {
    const date = new Date(timeString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // For other dates, use weekday + yyyy-mm-dd format
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const dateString = date.toISOString().split("T")[0];
    return `${weekday}, ${dateString}`;
  };

  const groupEventsByDay = (events: Event[]) => {
    const grouped: { [key: string]: Event[] } = {};

    events.forEach((event) => {
      const dateKey = formatDate(event.time);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // Sort events within each day (newest first)
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => b.time - a.time);
    });

    return grouped;
  };

  return (
    <div style={{ fontFamily: "var(--vscode-font-family)" }}>
      {isLoading && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--vscode-descriptionForeground)",
          }}
        >
          Loading events...
        </div>
      )}

      {!isLoading && events.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--vscode-descriptionForeground)",
          }}
        >
          No events found for last week.
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div>
          <h3 style={{ marginBottom: "15px" }}>
            System Events ({events.length})
          </h3>
          {Object.entries(groupEventsByDay(events))
            .sort(([dateA], [dateB]) => {
              // Sort by day order: Today, Yesterday, then chronological
              const order = ["Today", "Yesterday"];
              const indexA = order.indexOf(dateA);
              const indexB = order.indexOf(dateB);

              if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
              } else if (indexA !== -1) {
                return -1;
              } else if (indexB !== -1) {
                return 1;
              } else {
                // For other dates, sort by actual date (newest first)
                const eventsA = groupEventsByDay(events)[dateA];
                const eventsB = groupEventsByDay(events)[dateB];
                return eventsB[0].time - eventsA[0].time;
              }
            })
            .map(([date, dayEvents]) => (
              <div key={date} style={{ marginBottom: "20px" }}>
                <h4
                  style={{
                    marginBottom: "10px",
                    color: "var(--vscode-foreground)",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  {date} ({dayEvents.length})
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {dayEvents.map((event) => (
                    <div
                      key={`${event.time}-${event.name}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8px 12px",
                        backgroundColor: "var(--vscode-editor-background)",
                        border: "1px solid var(--vscode-panel-border)",
                        borderRadius: "4px",
                        fontSize: "14px",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          color: "var(--vscode-descriptionForeground)",
                          fontFamily: "monospace",
                          minWidth: "70px",
                        }}
                      >
                        {formatTime(event.time)}
                      </span>
                      <span
                        style={{
                          color: "var(--vscode-foreground)",
                          flex: 1,
                        }}
                      >
                        {formatEventType(event.name)}
                      </span>
                      <VscodeIcon
                        name="info"
                        actionIcon
                        title={event.details}
                        style={{
                          color: "var(--vscode-descriptionForeground)",
                          cursor: "pointer",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
