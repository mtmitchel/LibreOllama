import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from "path";
import analyzer from 'rollup-plugin-analyzer';
import detectPort from 'detect-port';

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const DEFAULT_PORT = 1423;
  const port = await detectPort(DEFAULT_PORT);
  
  if (port !== DEFAULT_PORT) {
    console.log(`⚠️  Port ${DEFAULT_PORT} is in use, using port ${port} instead`);
  }

  return {
  define: {
    'global': 'window',
  },
  plugins: [
    react(),
    nodePolyfills(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Use the new universal canvas mock for all canvas imports
      "canvas": path.resolve(__dirname, "./src/tests/__mocks__/canvas-universal.ts"),
      'events': 'events',
    },
  },
  
  // Optimize dependencies for browser
  optimizeDeps: {
    include: ["konva"],
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
      plugins: process.env.ANALYZE ? [analyzer()] : [],
      output: {
        // Better chunk splitting for performance
        manualChunks: {
          // Core framework chunks
          'react-vendor': ['react', 'react-dom'],
          'canvas-vendor': ['konva'],
          
          // Canvas core functionality 
          'canvas-core': [
            './src/features/canvas/stores/unifiedCanvasStore',
            './src/features/canvas/components/CanvasStage'
          ],
          
          // Canvas tools (split into smaller chunks)
          'canvas-tools-drawing': [
            './src/features/canvas/components/tools/drawing/PenTool',
            './src/features/canvas/components/tools/drawing/MarkerTool',
            './src/features/canvas/components/tools/drawing/HighlighterTool',
            './src/features/canvas/components/tools/drawing/EraserTool'
          ],
          
          'canvas-tools-creation': [
            './src/features/canvas/components/tools/creation/RectangleTool',
            './src/features/canvas/components/tools/creation/CircleTool',
            './src/features/canvas/components/tools/creation/TriangleTool'
          ],
          
          // Lazy-loaded tools (loaded on demand)
          'canvas-tools-text': [
            './src/features/canvas/components/tools/creation/TextTool'
          ],
          
          'canvas-tools-sticky-note': [
            './src/features/canvas/components/tools/creation/StickyNoteTool'
          ],
          

          
          // Heavy tools that can be lazy loaded
          'canvas-tools-heavy': [
            './src/features/canvas/components/tools/creation/TableTool',
            './src/features/canvas/components/tools/creation/MindmapTool',
            './src/features/canvas/components/tools/creation/ConnectorTool',
            './src/features/canvas/components/tools/creation/SectionTool'
          ]
        }
      }
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. use dynamic port detection to avoid conflicts
  server: {
    port: port,
    strictPort: false, // Allow fallback to alternative ports
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
  };
});
