import { type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as vscode from "vscode";

/**
 * Runs database migrations from the bundled migrations folder.
 * This ensures the database schema is up-to-date when the extension starts.
 */
export async function runMigrations(
  db: LibSQLDatabase,
  extensionUri: vscode.Uri
): Promise<void> {
  try {
    // In production, migrations are bundled in dist/db/migrations
    // In development, they're in src/db/migrations
    const migrationsFolder = vscode.Uri.joinPath(
      extensionUri,
      "dist",
      "db",
      "migrations"
    );

    await migrate(db, { migrationsFolder: migrationsFolder.fsPath });
    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Failed to run database migrations:", error);
    throw new Error(
      `Database migration failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
