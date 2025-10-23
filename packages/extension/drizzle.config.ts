import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    // This is just for the config - actual DB path will be dynamic at runtime
    url: "file:local.db",
  },
});
