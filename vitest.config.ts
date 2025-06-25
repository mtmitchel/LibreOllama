// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [
      './vitest.hoisted.setup.ts', // Hoisted mocks run first
      './src/tests/setup.ts',
      // vitest-canvas-mock removed to avoid conflicts with custom mocks
    ],
    testTimeout: 20000,
  },
  optimizeDeps: {
    include: ['konva', 'react-konva'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
