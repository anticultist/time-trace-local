import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@time-trace-local/services/types": resolve(
        __dirname,
        "../services/src/types.ts"
      ),
    },
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
  server: {
    port: 5173,
    host: "localhost",
    cors: {
      origin: true,
    },
    hmr: {
      port: 5173,
      host: "localhost",
      protocol: "ws",
    },
  },
});
