import * as vscode from "vscode";

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
  }

  private getHtml(webview: vscode.Webview) {
    const scriptUri = this.getUri(webview, this.extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.js",
    ]);

    const nonce = this.getNonce();

    const csp = [
      `default-src 'none';`,
      `script-src 'nonce-${nonce}';`,
      `style-src ${webview.cspSource} 'self' 'unsafe-inline';`,
      `font-src ${webview.cspSource};`,
    ];

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="${csp.join(" ")}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Time Trace Local</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
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
