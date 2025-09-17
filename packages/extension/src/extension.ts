// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { DefaultView } from "./DefaultView";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "time-trace-local" is now active!'
  );

  const defaultView = DefaultView.getInstance(
    context.extensionUri,
    context.extensionMode
  );

  const defaultViewProvider = vscode.window.registerWebviewViewProvider(
    DefaultView.viewType,
    defaultView
  );

  // Register the refresh command
  const refreshCommand = vscode.commands.registerCommand(
    "timeTraceLocal.refresh",
    () => {
      defaultView.refreshEvents();
    }
  );

  context.subscriptions.push(defaultViewProvider, refreshCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
