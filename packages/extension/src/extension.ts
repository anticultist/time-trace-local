// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { DefaultView } from "./DefaultView";

async function showConfigurationQuickPick() {
  const options: vscode.QuickPickItem[] = [
    {
      label: "boot",
      description: "Boot event tracking",
    },
    {
      label: "login",
      description: "Login event tracking",
    },
    {
      label: "sleep",
      description: "Sleep event tracking",
    },
  ];

  const quickPick = vscode.window.createQuickPick();
  quickPick.items = options;
  quickPick.canSelectMany = true;
  quickPick.title = "Configure Time Trace Local";
  quickPick.placeholder = "Select the events you want to track";

  quickPick.onDidAccept(() => {
    const selectedItems = quickPick.selectedItems;
    const selectedLabels = selectedItems.map((item) => item.label);

    if (selectedLabels.length > 0) {
      vscode.window.showInformationMessage(
        `Selected configuration: ${selectedLabels.join(", ")}`
      );
    } else {
      vscode.window.showInformationMessage("No configuration selected");
    }

    quickPick.dispose();
  });

  quickPick.onDidHide(() => {
    quickPick.dispose();
  });

  quickPick.show();
}

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

  // Register the configure command
  const configureCommand = vscode.commands.registerCommand(
    "timeTraceLocal.configure",
    async () => {
      await showConfigurationQuickPick();
    }
  );

  context.subscriptions.push(
    defaultViewProvider,
    refreshCommand,
    configureCommand
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  // Currently no cleanup needed
}
