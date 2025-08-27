import * as vscode from "vscode";
import { execFile } from "child_process";

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
          case "winEvents":
            // Execute the provided PowerShell one-liner and return its JSON result
            this.handleWinEventsRequest();
            break;
          case "webviewReady":
            // Webview is ready, send the startup message
            await this.sendStartupMessage();
            break;
        }
      },
      null,
      this.disposables
    );

    // Send initial message to webview with startup text
    this.sendStartupMessage();
  }

  private async sendStartupMessage() {
    if (this.view) {
      // const startupText =
      //   "VSCode Elements has been successfully integrated with React 19 using React wrapper components. The buttons above demonstrate different styles and functionality available with proper React event handling.";

      const startupText =
        (await this.getWinEvents()) || "No Windows event data available.";

      // Send message with a slight delay to ensure webview is ready
      setTimeout(() => {
        if (this.view) {
          this.view.webview.postMessage({
            type: "updateText",
            text: startupText,
          });
        }
      }, 100);
    }
  }

  private async handleWinEventsRequest() {
    if (!this.view) {
      return;
    }

    // The exact one-liner provided by the user
    // TODO: add an other id for os startup
    const script = `Get-WinEvent -FilterHashtable @{LogName='System';Id=6005,6006,6008,1074,42,1;StartTime='2025-08-27T00:00:00'} | Select-Object TimeCreated, Id, ProviderName, Message | ConvertTo-Json`;

    // Only supported on Windows hosts
    if (process.platform !== "win32") {
      this.view.webview.postMessage({
        type: "winEventsResult",
        ok: false,
        error: "Windows-only feature: requires PowerShell on Windows.",
      });
      return;
    }

    try {
      const { stdout } = await this.runPowerShell(script);
      this.view.webview.postMessage({
        type: "winEventsResult",
        ok: true,
        data: stdout,
      });
    } catch (err: any) {
      const msg = err?.stderr || err?.message || String(err);
      this.view.webview.postMessage({
        type: "winEventsResult",
        ok: false,
        error: msg,
      });
    }
  }

  private async getWinEvents(): Promise<string | undefined> {
    if (!this.view) {
      return;
    }

    // The exact one-liner provided by the user
    const script = `Get-WinEvent -FilterHashtable @{LogName='System';Id=6005,6006,6008,1074,42,1;StartTime='2025-08-27T00:00:00'} | Select-Object TimeCreated, Id, ProviderName, Message | ConvertTo-Json`;

    // Only supported on Windows hosts
    if (process.platform !== "win32") {
      return;
    }

    try {
      const { stdout } = await this.runPowerShell(script);
      return stdout;
    } catch {
      return undefined;
    }
  }

  private runPowerShell(
    script: string
  ): Promise<{ stdout: string; stderr: string }> {
    const args = [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      script,
    ];

    const tryExec = (exe: string) =>
      new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        execFile(
          exe,
          args,
          { maxBuffer: 20 * 1024 * 1024 },
          (error, stdout, stderr) => {
            if (error) {
              // Attach streams to the error for better diagnostics
              (error as any).stdout = stdout;
              (error as any).stderr = stderr;
              const reason =
                error instanceof Error
                  ? error
                  : new Error(
                      (typeof stderr === "string" && stderr.trim()) ||
                        (typeof (error as any)?.message === "string" &&
                          (error as any).message) ||
                        "PowerShell process failed"
                    );
              reject(reason);
            } else {
              resolve({ stdout, stderr });
            }
          }
        );
      });

    // Prefer PowerShell 7 if available, fall back to Windows PowerShell
    return tryExec("pwsh").catch((firstErr: any) => {
      // If pwsh is not found, try Windows PowerShell
      if (firstErr?.code === "ENOENT") {
        return tryExec("powershell.exe");
      }
      // Otherwise, propagate the original error
      throw firstErr;
    });
  }

  private getHtml(webview: vscode.Webview) {
    const isDevelopment =
      this.extensionMode === vscode.ExtensionMode.Development;

    // Get the Codicons CSS URI for VSCode Elements icons
    const codiconsUri = this.getUri(webview, this.extensionUri, [
      "node_modules",
      "@vscode",
      "codicons",
      "dist",
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
        "webview-ui",
        "build",
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
