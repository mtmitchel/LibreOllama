import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { enableMapSet } from 'immer';

enableMapSet();

// Mock import.meta for Vitest environment
(global as any).importMeta = {
  env: {
    DEV: false,
    PROD: true,
    MODE: 'test'
  }
};

// Create a more comprehensive import.meta mock
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        DEV: false,
        PROD: true,
        MODE: 'test'
      }
    }
  }
});

// Mock window.matchMedia 
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Note: ESM modules don't support vi.mock in setup files
// Individual test files should use vi.mock() for proper ESM module mocking
// as recommended in the testing guide

// Store mocks removed - tests will use real store instances with zustand/vanilla
// This provides better test reliability and validates actual store implementation

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Suppress console warnings in tests unless explicitly testing them
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log; // Add this

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
  console.log = vi.fn(); // Add this
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog; // Add this
});
