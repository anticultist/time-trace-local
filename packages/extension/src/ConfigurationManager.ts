import * as vscode from "vscode";

/**
 * Manages configuration UI flows for Time Trace Local services
 */
export class ConfigurationManager {
  /**
   * Shows the main configuration quick pick to select which service to configure
   */
  static async showConfigurationQuickPick(
    context: vscode.ExtensionContext
  ): Promise<void> {
    const serviceOptions: vscode.QuickPickItem[] = [
      {
        label: "OS Events",
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

    if (selectedService.label === "OS Events") {
      await this.showOSEventsConfiguration();
    } else if (selectedService.label === "Jira") {
      await this.showJiraConfiguration(context);
    }
  }

  /**
   * Shows the OS Events configuration UI
   */
  private static async showOSEventsConfiguration(): Promise<void> {
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
    quickPick.title = "Configure OS Events";
    quickPick.placeholder = "Select the events you want to track";

    quickPick.onDidAccept(() => {
      const selectedItems = quickPick.selectedItems;
      const selectedLabels = selectedItems.map((item) => item.label);

      if (selectedLabels.length > 0) {
        vscode.window.showInformationMessage(
          `OS Events configuration: ${selectedLabels.join(", ")}`
        );
      } else {
        vscode.window.showInformationMessage("No OS Events selected");
      }

      quickPick.dispose();
    });

    quickPick.onDidHide(() => {
      quickPick.dispose();
    });

    quickPick.show();
  }

  private static readonly jiraApiTokenKey = "timeTraceLocal.jira.apiToken";

  /**
   * Shows the Jira configuration UI with multi-step input
   */
  private static async showJiraConfiguration(
    context: vscode.ExtensionContext
  ): Promise<void> {
    // Get base URL and email from VS Code configuration
    const config = vscode.workspace.getConfiguration("timeTraceLocal.jira");
    const jiraBase = config.get<string>("baseUrl");
    const email = config.get<string>("email");

    // Validate that base URL and email are configured
    if (!jiraBase || jiraBase.trim().length === 0) {
      const openSettings = "Open Settings";
      const result = await vscode.window.showErrorMessage(
        "Jira base URL is not configured. Please set it in your VS Code settings.",
        openSettings
      );
      if (result === openSettings) {
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "timeTraceLocal.jira.baseUrl"
        );
      }
      return;
    }

    if (!email || email.trim().length === 0) {
      const openSettings = "Open Settings";
      const result = await vscode.window.showErrorMessage(
        "Jira email is not configured. Please set it in your VS Code settings.",
        openSettings
      );
      if (result === openSettings) {
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "timeTraceLocal.jira.email"
        );
      }
      return;
    }

    // Prompt for API Token
    const apiToken = await vscode.window.showInputBox({
      title: "Configure Jira - API Token",
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

    // Store the API token in secrets
    try {
      await context.secrets.store(
        ConfigurationManager.jiraApiTokenKey,
        apiToken
      );

      vscode.window.showInformationMessage(
        `Jira configuration saved successfully!\nBase URL: ${jiraBase}\nEmail: ${email}`
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to save Jira API token: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Retrieves the complete Jira configuration
   * @param context The extension context
   * @returns The Jira configuration or null if incomplete
   */
  static async getJiraConfig(context: vscode.ExtensionContext): Promise<{
    baseUrl: string;
    email: string;
    apiToken: string;
  } | null> {
    const config = vscode.workspace.getConfiguration("timeTraceLocal.jira");
    const baseUrl = config.get<string>("baseUrl");
    const email = config.get<string>("email");
    const apiToken = await context.secrets.get(
      ConfigurationManager.jiraApiTokenKey
    );

    if (!baseUrl || !email || !apiToken) {
      return null;
    }

    return { baseUrl, email, apiToken };
  }

  /**
   * Checks if Jira is fully configured
   * @param context The extension context
   * @returns True if all Jira configuration is present
   */
  static async isJiraConfigured(
    context: vscode.ExtensionContext
  ): Promise<boolean> {
    const config = await this.getJiraConfig(context);
    return config !== null;
  }
}
