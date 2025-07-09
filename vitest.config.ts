// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      'vitest-localstorage-mock',    // Auto-mocks localStorage/sessionStorage
      '@vitest/web-worker',          // Web Worker testing support
      './vitest.hoisted.setup.ts',   // Hoisted mocks run first
      './src/tests/setup.ts',        // Manual setup and additional mocks
    ],
    testTimeout: 20000,
    mockReset: true,
    hookTimeout: 10000,
    silent: false,                   // Enable console output for debugging
  },
  // ESBuild configuration for JSX support in all contexts
  esbuild: {
    jsx: 'automatic',
    jsxInject: 'import React from "react"'
  },
  optimizeDeps: {
    include: ['konva', 'react-konva'],
    esbuildOptions: {
      jsx: 'automatic'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
