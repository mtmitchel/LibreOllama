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
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/__archive__/**',                 // Exclude any __archive__ trees
      '**/_archive/**',                    // Exclude any _archive trees
      '**/_archive*/**',                   // Exclude patterns like _archive_react_konva
      'src/**/_archive*/**',               // Extra guard inside src
      'src/features/canvas/tests/_archive*/**',
      'src/features/canvas/tests/_archive_react_konva/**',
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
      '@tests': path.resolve(__dirname, './src/tests'),
    },
  },
});
