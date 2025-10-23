// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { DefaultView } from "./DefaultView";

async function showConfigurationQuickPick() {
  // First step: Select service
  const serviceOptions: vscode.QuickPickItem[] = [
    {
      label: "Windows Events",
      description: "Track system events like boot, login, sleep",
    },
    {
      label: "Jira",
      description: "Track Jira activities (not yet implemented)",
    },
  ];

  const selectedService = await vscode.window.showQuickPick(serviceOptions, {
    title: "Configure Time Trace Local - Select Service",
    placeHolder: "Choose the service you want to configure",
  });

  if (!selectedService) {
    return; // User cancelled
  }

  if (selectedService.label === "Windows Events") {
    await showWindowsEventsConfiguration();
  } else if (selectedService.label === "Jira") {
    await showJiraConfiguration();
  }
}

async function showWindowsEventsConfiguration() {
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
  quickPick.title = "Configure Windows Events";
  quickPick.placeholder = "Select the events you want to track";

  quickPick.onDidAccept(() => {
    const selectedItems = quickPick.selectedItems;
    const selectedLabels = selectedItems.map((item) => item.label);

    if (selectedLabels.length > 0) {
      vscode.window.showInformationMessage(
        `Windows Events configuration: ${selectedLabels.join(", ")}`
      );
    } else {
      vscode.window.showInformationMessage("No Windows Events selected");
    }

    quickPick.dispose();
  });

  quickPick.onDidHide(() => {
    quickPick.dispose();
  });

  quickPick.show();
}

async function showJiraConfiguration() {
  // Step 1: Jira Base URL
  const jiraBase = await vscode.window.showInputBox({
    title: "Configure Jira - Step 1/3",
    prompt: "Enter your Jira base URL",
    placeHolder: "https://your-company.atlassian.net",
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return "Jira base URL is required";
      }
      try {
        new URL(value);
        return null;
      } catch {
        return "Please enter a valid URL";
      }
    },
  });

  if (!jiraBase) {
    return; // User cancelled
  }

  // Step 2: Email
  const email = await vscode.window.showInputBox({
    title: "Configure Jira - Step 2/3",
    prompt: "Enter your Jira email address",
    placeHolder: "your-email@company.com",
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return "Email is required";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
      return null;
    },
  });

  if (!email) {
    return; // User cancelled
  }

  // Step 3: API Token
  const apiToken = await vscode.window.showInputBox({
    title: "Configure Jira - Step 3/3",
    prompt: "Enter your Jira API token",
    placeHolder: "Your API token from Atlassian account settings",
    password: true,
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return "API token is required";
      }
      return null;
    },
  });

  if (!apiToken) {
    return; // User cancelled
  }

  // Show configuration summary with masked values
  const maskedJiraBase = jiraBase;
  const maskedEmail = email;
  const maskedApiToken = maskSensitiveValue(apiToken);

  vscode.window.showInformationMessage(
    `Jira configuration:\nBase: ${maskedJiraBase}\nEmail: ${maskedEmail}\nToken: ${maskedApiToken}`
  );
}

function maskSensitiveValue(value: string): string {
  if (value.length <= 5) {
    return "*".repeat(value.length);
  }
  return value.substring(0, 5) + "*".repeat(value.length - 5);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "time-trace-local" is now active!'
  );

  const defaultView = DefaultView.getInstance(
    context.extensionUri,
    context.globalStorageUri,
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
