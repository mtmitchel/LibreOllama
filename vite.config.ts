import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  optimizeDeps: {
    include: [
      'fabric',
      // Fabric.js for canvas functionality
    ],
    exclude: [
      // Prevent pre-bundling issues with Fabric.js
    ],
    esbuildOptions: {
      // Ensure Fabric.js is treated as a module
      target: 'es2020',
    }
  },
  
  ssr: {
    noExternal: ['fabric']
  },

  // Add path alias configuration
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1422, // Changed port from 1420 to 1422
    strictPort: true,
    host: host || "127.0.0.1",
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1423, // Changed HMR port from 1421 to 1423
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
