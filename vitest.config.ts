/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@features': path.resolve(__dirname, './src/features'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@components': path.resolve(__dirname, './src/components'),
      '@tauri-apps/api/core': path.resolve(__dirname, './src/tests/__mocks__/@tauri-apps/api/tauri.js'),
      '@tauri-apps/api/event': path.resolve(__dirname, './src/tests/__mocks__/@tauri-apps/api/event.js'),
      // Force canvas module aliasing for tests
      'canvas': path.resolve(__dirname, './src/tests/__mocks__/canvas.js'),
      'canvas/lib-extra': path.resolve(__dirname, './src/tests/__mocks__/canvas.js'),
    },
  },
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./src/tests/setup-new.ts'],
    
    // Include patterns
    include: ['src/tests/**/*.test.{ts,tsx}'],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'src-tauri',
      'src/tests/_archive'
    ],
    
    // Performance settings
    testTimeout: 10000,
    
    // Mock settings
    clearMocks: true,
    restoreMocks: true,
      // Globals (Jest-like API) - allows using describe, test, expect without imports
    globals: true,
    
    // Coverage settings (disabled for now)
    coverage: {
      enabled: false,
      provider: 'v8'
    },    // Mock file patterns and external dependencies
    server: {
      deps: {
        inline: ['react-konva', 'konva'],
        external: ['canvas', 'canvas/lib-extra']
      }
    },
    
    // Environment setup for canvas mocking
    poolOptions: {
      threads: {
        singleThread: true,
        isolate: false
      }
    },
    
    // Performance optimizations
    isolate: false,
    pool: 'threads',
    
    // Module optimization settings
    deps: {
      optimizer: {
        web: {
          exclude: ['canvas']
        }
      }
    }
  }
})