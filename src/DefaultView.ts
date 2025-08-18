import * as vscode from "vscode";

export function getUri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  pathList: string[]
) {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}

export class DefaultView implements vscode.WebviewViewProvider {
  public static readonly viewType = "timeTraceLocalDefaultView";
  private static instance: DefaultView;
  private readonly disposables: vscode.Disposable[] = [];

  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public static getInstance(extensionUri: vscode.Uri): DefaultView {
    if (!DefaultView.instance) {
      DefaultView.instance = new DefaultView(extensionUri);
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
    const scriptUri = getUri(webview, this.extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.js",
    ]);

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Time Trace Local</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="${scriptUri}"></script>
      </body>
    </html>`;
  }
}
