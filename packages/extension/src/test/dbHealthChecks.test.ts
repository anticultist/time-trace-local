import * as assert from "node:assert";
import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { events } from "../db/schema";
import { lt } from "drizzle-orm";

suite("Database Health Checks", () => {
  let db: LibSQLDatabase | undefined;
  let dbPath: string | undefined;
  let dbExists = false;

  suiteSetup(async () => {
    // Get the extension's global storage path
    const extension = vscode.extensions.getExtension(
      "anticultist.time-trace-local"
    );
    if (!extension) {
      console.warn("Extension not found, skipping DB health checks");
      return;
    }

    // Construct the expected database path
    // The globalStorageUri would be something like: file:///c%3A/Users/username/AppData/Roaming/Code/User/globalStorage/anticultist.time-trace-local
    const globalStoragePath = path.join(
      process.env.APPDATA || process.env.HOME || "",
      "Code",
      "User",
      "globalStorage",
      "anticultist.time-trace-local"
    );

    dbPath = path.join(globalStoragePath, "events.db");
    dbExists = fs.existsSync(dbPath);

    if (dbExists) {
      // Connect to the actual database
      db = drizzle({ connection: { url: `file:${dbPath}` } });
      console.log(`Connected to database at: ${dbPath}`);
    } else {
      console.warn(`Database not found at: ${dbPath}`);
      console.warn(
        "Database health checks will be skipped. Run the extension first to create the database."
      );
    }
  });

  suiteTeardown(() => {
    // No cleanup needed - tests are read-only
    db = undefined;
  });

  test("Database file exists", function () {
    if (!dbExists) {
      this.skip();
    }
    assert.ok(dbExists, `Database should exist at ${dbPath}`);
  });

  test("Events table: all timestamps should be year 2000 or later", async function () {
    if (!dbExists || !db) {
      this.skip();
    }

    // Query for any events with timestamps before year 2000 (timestamp: 946684800000)
    const year2000Timestamp = new Date("2000-01-01T00:00:00Z");
    const invalidEvents = await db
      .select()
      .from(events)
      .where(lt(events.time, year2000Timestamp));

    assert.strictEqual(
      invalidEvents.length,
      0,
      `Found ${invalidEvents.length} event(s) with invalid timestamps (before year 2000). ` +
        `This likely indicates the date was not properly stored, only the time. ` +
        `Invalid events: ${JSON.stringify(invalidEvents, null, 2)}`
    );
  });

  // Placeholder for future health checks
  // Add more tests here as needed, for example:
  // - test('Events table: type field contains only valid EventType values', ...)
  // - test('Events table: details field is not empty', ...)
  // - test('Events table: no duplicate events with same time and type', ...)
});
