import * as vscode from "vscode";
import { WindowsEventsService } from "@time-trace-local/services";

export class DefaultView implements vscode.WebviewViewProvider {
  public static readonly viewType = "timeTraceLocalDefaultView";
  private static instance: DefaultView;
  private readonly disposables: vscode.Disposable[] = [];

  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly extensionMode: vscode.ExtensionMode
  ) {}

  public static getInstance(
    extensionUri: vscode.Uri,
    extensionMode: vscode.ExtensionMode
  ): DefaultView {
    if (!DefaultView.instance) {
      DefaultView.instance = new DefaultView(extensionUri, extensionMode);
    }
    return DefaultView.instance;
  }

  public refreshEvents() {
    this.sendEvents();
  }

  public dispose() {
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): Thenable<void> | void {
    this.view = webviewView;

    this.view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    this.view.webview.html = this.getHtml(this.view.webview);

    // Listen for messages from the webview
    this.view.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "showInfo":
            vscode.window.showInformationMessage(message.text);
            break;
          case "showWarning":
            vscode.window.showWarningMessage(message.text);
            break;
          case "showError":
            vscode.window.showErrorMessage(message.text);
            break;
          case "updateEvents":
            await this.sendEvents();
            break;
          case "webviewReady":
            await this.sendEvents();
            break;
        }
      },
      null,
      this.disposables
    );

    // Send initial message to webview with startup text
    this.sendEvents(); // TODO: <- is this necessary?
  }

  private async sendEvents() {
    if (!this.view) {
      return;
    }

    this.view.webview.postMessage({ type: "loadingEvents" });

    const events = await WindowsEventsService.getEvents();
    if (!events) {
      return;
    }
    this.view.webview.postMessage({
      type: "showEvents",
      events: events,
    });
  }

  private getHtml(webview: vscode.Webview) {
    const isDevelopment =
      this.extensionMode === vscode.ExtensionMode.Development;

    // Get the Codicons CSS URI for VSCode Elements icons
    const codiconsUri = this.getUri(webview, this.extensionUri, [
      "dist",
      "assets",
      "codicon.css",
    ]);

    const nonce = this.getNonce();

    let scriptTags: string;
    let csp: string[];

    if (isDevelopment) {
      // HMR support: https://vite.dev/guide/backend-integration
      scriptTags = `
        <script type="module" nonce="${nonce}">
          import RefreshRuntime from 'http://localhost:5173/@react-refresh'
          RefreshRuntime.injectIntoGlobalHook(window)
          window.$RefreshReg$ = () => {}
          window.$RefreshSig$ = () => (type) => type
          window.__vite_plugin_react_preamble_installed__ = true
        </script>
        <script type="module" nonce="${nonce}" src="http://localhost:5173/@vite/client"></script>
        <script type="module" nonce="${nonce}" src="http://localhost:5173/src/index.tsx"></script>
      `;

      // CSP for development with Vite dev server (include WebSocket for error overlay)
      csp = [
        `default-src 'none';`,
        `script-src 'nonce-${nonce}' http://localhost:5173;`,
        `style-src ${webview.cspSource} 'self' 'unsafe-inline' http://localhost:5173;`,
        `font-src ${webview.cspSource} 'self';`,
        `img-src ${webview.cspSource} 'self' data:;`,
        `connect-src http://localhost:5173 ws://127.0.0.1:5173 ws://localhost:5173;`,
      ];
    } else {
      // Production mode: use built assets
      const scriptUri = this.getUri(webview, this.extensionUri, [
        "dist",
        "webview-ui",
        "assets",
        "index.js",
      ]);

      scriptTags = `<script type="module" nonce="${nonce}" src="${scriptUri}"></script>`;

      // CSP for production
      csp = [
        `default-src 'none';`,
        `script-src 'nonce-${nonce}';`,
        `style-src ${webview.cspSource} 'self' 'unsafe-inline';`,
        `font-src ${webview.cspSource} 'self';`,
        `img-src ${webview.cspSource} 'self' data:;`,
      ];
    }

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="${csp.join(" ")}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Time Trace Local</title>
        <link rel="stylesheet" href="${codiconsUri}" id="vscode-codicon-stylesheet">
      </head>
      <body>
        <div id="root"></div>
        ${scriptTags}
      </body>
    </html>`;
  }

  private getUri(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    pathList: string[]
  ) {
    return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
  }

  private getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
