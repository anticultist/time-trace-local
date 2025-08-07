import * as vscode from 'vscode';
import { TimeTraceSidebarProvider } from './sidebarProvider.js';

export function activate(context: vscode.ExtensionContext) {
  console.log('Time Trace Local extension is now active!');

  // Register the sidebar provider
  const sidebarProvider = new TimeTraceSidebarProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'timeTraceLocal.sidebar',
      sidebarProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    )
  );

  // Register commands
  const openPanelCommand = vscode.commands.registerCommand(
    'timeTraceLocal.openPanel',
    () => {
      vscode.commands.executeCommand('timeTraceLocal.sidebar.focus');
    }
  );

  context.subscriptions.push(openPanelCommand);
}

export function deactivate() {
  console.log('Time Trace Local extension is now deactivated!');
}
