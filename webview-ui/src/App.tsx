// Import the VSCode Elements React wrapper components
import { VscodeButton } from "@vscode-elements/react-elements";
import { useState, useEffect } from "react";
import type { VsCodeApi } from "./types/vscode";

interface Event {
  time: string; // Will be converted from Date to string when sent from extension
  type: string;
  details: string;
}

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

  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    return date.toLocaleString();
  };

  const handleRefresh = () => {
    setIsLoading(true);
    vscode.postMessage({
      type: "updateEvents",
    });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "var(--vscode-font-family)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Time Trace Local</h1>
        <VscodeButton
          icon="refresh"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh
        </VscodeButton>
      </div>

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
          No events found for today.
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div>
          <h3 style={{ marginBottom: "15px" }}>
            System Events ({events.length})
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {events.map((event, index) => (
              <div
                key={`${event.time}-${event.type}-${index}`}
                style={{
                  padding: "12px",
                  backgroundColor: "var(--vscode-editor-background)",
                  border: "1px solid var(--vscode-panel-border)",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "var(--vscode-foreground)",
                    }}
                  >
                    {formatEventType(event.type)}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--vscode-descriptionForeground)",
                    }}
                  >
                    {formatTime(event.time)}
                  </span>
                </div>
                <div
                  style={{
                    color: "var(--vscode-descriptionForeground)",
                    lineHeight: "1.4",
                  }}
                >
                  {event.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
