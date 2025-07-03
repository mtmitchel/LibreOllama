import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ fastRefresh: false })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Use the new universal canvas mock for all canvas imports
      "canvas": path.resolve(__dirname, "./src/tests/__mocks__/canvas-universal.ts"),
    },
  },
  
  // Optimize dependencies for browser
  optimizeDeps: {
    include: ["konva", "react-konva"],
    // No longer need to exclude canvas as it's properly aliased
    force: true, // Force re-optimization to ensure proper canvas handling
  },
  
  // Build configuration for Tauri
  build: {
    // Target modern browsers for better canvas support
    target: ["chrome89", "edge89", "firefox89", "safari15"],
    // Increase chunk size limit for Konva
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // No longer need to externalize canvas
      output: {
        // Ensure Konva is properly chunked for WebView2
        manualChunks: {
          konva: ['konva', 'react-konva']
        }
      }
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1423,
    strictPort: true,
    host: host ? host : "0.0.0.0",
    hmr: host
      ? {
          protocol: "ws",
          host: host,
          port: 5183,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
});
