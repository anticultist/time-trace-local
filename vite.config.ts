import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  // Configure library mode for VS Code extension
  build: {
    lib: {
      entry: resolve(__dirname, "src/extension.ts"),
      name: "TimeTraceLocal",
      fileName: "extension",
      formats: ["cjs"], // VS Code extensions require CommonJS format
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: ["vscode"],
      output: {
        // Ensure the output is in the correct format for VS Code
        format: "cjs",
        entryFileNames: "[name].js",
        dir: "dist",
      },
    },
    // Configure sourcemaps for development
    sourcemap: process.env.NODE_ENV !== "production",
    // Disable minification in development for better debugging
    minify: process.env.NODE_ENV === "production",
    // Target Node.js environment for VS Code extensions (explicitly set for Vite 7+)
    target: "node20",
    // Output directory
    outDir: "dist",
    // Empty the output directory before building
    emptyOutDir: true,
  },
  // Configure for Node.js environment
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  // Ensure proper module resolution
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
});
