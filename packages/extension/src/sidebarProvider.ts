import * as vscode from 'vscode';

export class TimeTraceSidebarProvider implements vscode.WebviewViewProvider {
  private _webviewView?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this.context.extensionUri,
        vscode.Uri.joinPath(
          this.context.extensionUri,
          '..',
          'sidebar-ui',
          'dist'
        ),
      ],
    };

    webviewView.webview.html = this.getWebviewContent(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage((message: any) => {
      switch (message.type) {
        case 'info':
          vscode.window.showInformationMessage(message.text);
          break;
        case 'error':
          vscode.window.showErrorMessage(message.text);
          break;
        case 'getEvents':
          this.handleGetEvents();
          break;
      }
    });
  }

  private handleGetEvents() {
    // This will be implemented later with actual event fetching
    const mockEvents = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        source: 'git',
        type: 'commit',
        data: { message: 'Initial commit' },
      },
    ];

    this._webviewView?.webview.postMessage({
      type: 'events',
      data: mockEvents,
    });
  }

  private getWebviewContent(webview: vscode.Webview): string {
    // For now, we'll use a simple HTML structure
    // Later this will load the React app from the sidebar-ui package

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Time Trace Local</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            font-weight: var(--vscode-font-weight);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 16px;
          }
          .container {
            max-width: 100%;
          }
          .welcome {
            text-align: center;
            margin-bottom: 20px;
          }
          .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 4px;
            margin: 4px;
          }
          .button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .events-section {
            margin-top: 20px;
          }
          .event-item {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 8px;
            margin: 4px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="welcome">
            <h2>🕒 Time Trace Local</h2>
            <p>Track your activity and map events to bookable elements</p>
          </div>
          
          <div class="actions">
            <button class="button" onclick="getEvents()">Load Events</button>
            <button class="button" onclick="showInfo()">Show Info</button>
          </div>
          
          <div class="events-section">
            <h3>Recent Events</h3>
            <div id="events-container">
              <p>Click "Load Events" to see your activity data</p>
            </div>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          function getEvents() {
            vscode.postMessage({
              type: 'getEvents'
            });
          }

          function showInfo() {
            vscode.postMessage({
              type: 'info',
              text: 'Time Trace Local is ready to track your activities!'
            });
          }

          // Listen for messages from the extension
          window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
              case 'events':
                displayEvents(message.data);
                break;
            }
          });

          function displayEvents(events) {
            const container = document.getElementById('events-container');
            
            if (events.length === 0) {
              container.innerHTML = '<p>No events found</p>';
              return;
            }

            container.innerHTML = events.map(event => 
              \`<div class="event-item">
                <strong>\${event.type}</strong> from \${event.source}<br>
                <small>\${new Date(event.timestamp).toLocaleString()}</small><br>
                <em>\${JSON.stringify(event.data)}</em>
              </div>\`
            ).join('');
          }
        </script>
      </body>
      </html>
    `;
  }
}
