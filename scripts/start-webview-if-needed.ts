#!/usr/bin/env tsx

import { createServer } from "node:net";
import { exec } from "node:child_process";
import { join } from "node:path";

const PORT = 5173;
const HOST = "localhost";

/**
 * Check if a port is available
 */
function checkPortAvailable(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.listen(port, host, () => {
      server.close(() => {
        resolve(true); // Port is available
      });
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        resolve(false); // Port is in use
      } else {
        resolve(true); // Other error, assume port is available
      }
    });
  });
}

async function main() {
  try {
    console.log("VITE_CHECKING: Checking if Vite dev server is needed...");

    const isPortAvailable = await checkPortAvailable(PORT, HOST);

    if (isPortAvailable) {
      console.log("VITE_STARTING: Port available, starting Vite dev server...");

      // Change to webview-ui directory and run pnpm start
      const webviewUiPath = join(process.cwd(), "packages", "webview-ui");

      // Use exec instead of spawn to allow the process to inherit stdio properly
      const child = exec("pnpm start", {
        cwd: webviewUiPath,
        env: process.env,
      });

      let viteReady = false;

      // Forward all output to console so VS Code can see it
      child.stdout?.on("data", (data) => {
        const output = data.toString();
        process.stdout.write(output);

        // Check if Vite is ready and signal VS Code
        if (
          !viteReady &&
          (output.includes("ready in") ||
            output.includes("Local:   http://localhost:5173"))
        ) {
          viteReady = true;
          console.log("VITE_READY: Vite development server is ready!");
        }
      });

      child.stderr?.on("data", (data) => {
        process.stderr.write(data);
      });

      child.on("error", (error) => {
        console.error("❌ Failed to start Vite dev server:", error);
        process.exit(1);
      });

      child.on("exit", (code) => {
        if (code !== 0) {
          console.error(`❌ Vite dev server exited with code ${code}`);
          process.exit(code || 1);
        }
      });

      // Don't output "started" immediately - wait for Vite to be ready
      console.log("🔄 Waiting for Vite dev server to be ready...");
    } else {
      console.log("VITE_READY: Port in use, Vite dev server already running");
      console.log("🎯 Skipping Vite dev server startup");
      // For the case where server is already running, we exit immediately
      // This allows the task to complete and the launch to proceed
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error in webview startup script:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down Vite dev server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Terminating Vite dev server...");
  process.exit(0);
});

// Run the script
main();
