import * as vscode from "vscode";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import {
  WindowsEventsService,
  MacEventsService,
  Event,
  EventService,
} from "@time-trace-local/services";
import { runMigrations } from "./db";
import { events, dbProperties, PropertyType } from "./db/schema";
import { and, eq, gte } from "drizzle-orm";
import * as fs from "fs";

export class DefaultView implements vscode.WebviewViewProvider {
  public static readonly viewType = "timeTraceLocalDefaultView";

  private static instance: DefaultView;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly db: LibSQLDatabase;
  private readonly eventServices: EventService[] = [
    new WindowsEventsService(),
    new MacEventsService(),
  ];

  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly globalStorageUri: vscode.Uri,
    private readonly extensionMode: vscode.ExtensionMode
  ) {
    // Ensure the globalStorage directory exists before creating the database
    const storageDir = this.globalStorageUri.fsPath;
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const dbPath = vscode.Uri.joinPath(this.globalStorageUri, "events.db");
    this.db = drizzle({ connection: { url: `file:${dbPath.fsPath}` } });
  }

  public static async getInstance(
    extensionUri: vscode.Uri,
    globalStorageUri: vscode.Uri,
    extensionMode: vscode.ExtensionMode
  ): Promise<DefaultView> {
    if (!DefaultView.instance) {
      DefaultView.instance = new DefaultView(
        extensionUri,
        globalStorageUri,
        extensionMode
      );
      // Initialize database after construction
      await DefaultView.instance.initializeDatabase();
    }
    return DefaultView.instance;
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await runMigrations(this.db, this.extensionUri);
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      vscode.window.showErrorMessage(
        `Failed to initialize Time Trace database: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
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
  }

  private async saveEventsToDatabase(newEvents: Event[]): Promise<void> {
    if (newEvents.length === 0) {
      return;
    }

    try {
      // Filter out duplicates by checking existing events with same time and type
      const uniqueEvents: Event[] = [];

      for (const event of newEvents) {
        const existingEvent = await this.db
          .select()
          .from(events)
          .where(
            and(
              eq(events.time, new Date(event.time)),
              eq(events.type, event.type)
            )
          )
          .limit(1);

        if (existingEvent.length === 0) {
          uniqueEvents.push(event);
        }
      }

      if (uniqueEvents.length === 0) {
        console.log("No new events to insert (all were duplicates)");
        return;
      }

      // Insert all unique events in a batch
      await this.db.insert(events).values(
        uniqueEvents.map((event) => ({
          time: new Date(event.time),
          type: event.type,
          details: event.details,
        }))
      );
      console.log(`Inserted ${uniqueEvents.length} new events into database`);
    } catch (error) {
      console.error("Failed to save events to database:", error);
      vscode.window.showErrorMessage(
        `Failed to save events: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async getLastFetchTime(
    serviceName: string
  ): Promise<Date | undefined> {
    try {
      const propertyName = `${serviceName}.lastFetchTime`;
      const result = await this.db
        .select()
        .from(dbProperties)
        .where(eq(dbProperties.name, propertyName))
        .limit(1);

      if (result.length > 0 && typeof result[0].value === "number") {
        return new Date(result[0].value);
      }
      return undefined;
    } catch (error) {
      console.error(`Failed to get last fetch time for ${serviceName}:`, error);
      return undefined;
    }
  }

  private async saveLastFetchTime(
    serviceName: string,
    timestamp: number
  ): Promise<void> {
    try {
      const propertyName = `${serviceName}.lastFetchTime`;

      // Check if property exists
      const existing = await this.db
        .select()
        .from(dbProperties)
        .where(eq(dbProperties.name, propertyName))
        .limit(1);

      if (existing.length > 0) {
        // Update existing property
        await this.db
          .update(dbProperties)
          .set({ value: timestamp })
          .where(eq(dbProperties.name, propertyName));
      } else {
        // Insert new property
        await this.db.insert(dbProperties).values({
          name: propertyName,
          type: PropertyType.Integer,
          value: timestamp,
        });
      }

      console.log(
        `Saved last fetch time for ${serviceName}: ${new Date(timestamp).toISOString()}`
      );
    } catch (error) {
      console.error(
        `Failed to save last fetch time for ${serviceName}:`,
        error
      );
    }
  }

  private async getStoredEvents(startDate: Date): Promise<Event[]> {
    try {
      const storedEvents = await this.db
        .select()
        .from(events)
        .where(gte(events.time, startDate))
        .orderBy(events.time);

      return storedEvents.map((event) => ({
        time: event.time.getTime(),
        type: event.type,
        details: event.details,
      }));
    } catch (error) {
      console.error("Failed to retrieve stored events:", error);
      return [];
    }
  }

  private async getEventsForService(service: EventService): Promise<Event[]> {
    // Fetch last fetch time from db_properties per service and use as startDate
    const lastFetchTime = await this.getLastFetchTime(service.name);
    const startDate =
      lastFetchTime ||
      (() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return sevenDaysAgo;
      })();

    const newEvents: Event[] = await service.getEvents(undefined, startDate);
    await this.saveEventsToDatabase(newEvents);

    // Save the timestamp of the most recent event retrieved
    if (newEvents.length > 0) {
      const mostRecentTimestamp = Math.max(...newEvents.map((e) => e.time));
      await this.saveLastFetchTime(service.name, mostRecentTimestamp);
    }

    return newEvents;
  }

  private async sendEvents() {
    if (!this.view) {
      return;
    }

    this.view.webview.postMessage({ type: "loadingEvents" });

    // Fetch new events from all services
    const newEvents: Event[] = [];
    await Promise.all(
      this.eventServices.map(async (service) => {
        newEvents.push(...(await this.getEventsForService(service)));
      })
    );

    // Get older events from database to fill gaps (max 7 days back)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const storedEvents = await this.getStoredEvents(sevenDaysAgo);

    // Combine stored events with new events and remove duplicates
    const allEventsMap = new Map<string, Event>();

    // Add stored events first
    for (const event of storedEvents) {
      const key = `${event.time}_${event.type}`;
      allEventsMap.set(key, event);
    }

    // Add/overwrite with new events
    for (const event of newEvents) {
      const key = `${event.time}_${event.type}`;
      allEventsMap.set(key, event);
    }

    // Convert back to array and sort by time
    const combinedEvents = Array.from(allEventsMap.values()).sort(
      (a, b) => a.time - b.time
    );

    this.view.webview.postMessage({
      type: "showEvents",
      events: combinedEvents,
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
