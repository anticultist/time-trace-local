import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { viteStaticCopy } from "vite-plugin-static-copy";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        // Copy entire webview-ui build directory
        {
          src: "../webview-ui/build",
          dest: "webview-ui",
        },
        // Copy codicons assets
        {
          src: "node_modules/@vscode/codicons/dist/codicon.css",
          dest: "assets",
        },
        {
          src: "node_modules/@vscode/codicons/dist/codicon.ttf",
          dest: "assets",
        },
      ],
    }),
  ],
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
    // Configure to use Node.js built-ins for extension environment (allows usage of child_process)
    ssr: true,
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
    alias: {
      "@time-trace-local/services": resolve(
        __dirname,
        "../services/src/index.ts"
      ),
    },
  },
});
