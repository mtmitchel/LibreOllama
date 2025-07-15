import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { enableMapSet } from 'immer';
import { resetAllStores } from '../test-utils/zustand-reset';

// Mock Konva with comprehensive mock that avoids canvas.node loading
vi.mock('konva', () => {
  return import('./__mocks__/konva');
});

// Mock React-Konva to provide test-friendly DOM structure
vi.mock('react-konva', () => {
  return import('./__mocks__/react-konva');
});

enableMapSet();

// Mock import.meta for Vitest environment to ensure DEV mode is true
Object.defineProperty(import.meta, 'env', {
  value: {
    MODE: 'test',
    DEV: true,
    VITE_APP_NAME: 'LibreOllama',
    VITE_APP_VERSION: '1.0.0',
    BASE_URL: '/',
    PROD: false,
    SSR: false,
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    return localStorageMock.storage[key] || null;
  }),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.storage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.storage[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.storage = {};
  }),
  storage: {} as Record<string, string>,
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => {
  setTimeout(cb, 0);
  return 1; // Return a mock request ID
}) as any;
global.cancelAnimationFrame = vi.fn();

// Mock performance
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
};

// Mock window.matchMedia - robust implementation for all environments
const createMockMatchMedia = () => {
  return vi.fn().mockImplementation((query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
};

const mockMatchMedia = createMockMatchMedia();

// Set up window.matchMedia for all possible environments
// JSDOM environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: mockMatchMedia,
  });
}

// Node.js global environment
if (typeof global !== 'undefined') {
  Object.defineProperty(global, 'matchMedia', {
    writable: true,
    configurable: true,
    value: mockMatchMedia,
  });
  
  // Ensure global.window exists and has matchMedia
  if (!global.window) {
    Object.defineProperty(global, 'window', {
      writable: true,
      configurable: true,
      value: {
        matchMedia: mockMatchMedia,
        document: { 
          documentElement: { 
            classList: { 
              remove: vi.fn(), 
              add: vi.fn() 
            } 
          } 
        },
      },
    });
  } else {
    Object.defineProperty(global.window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: mockMatchMedia,
    });
  }
}
// Note: ESM modules don't support vi.mock in setup files
// Individual test files should use vi.mock() for proper ESM module mocking
// as recommended in the testing guide

// Store mocks removed - tests will use real store instances with zustand/vanilla
// This provides better test reliability and validates actual store implementation

// Global test utilities
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Suppress console warnings in tests unless explicitly testing them
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
  console.log = vi.fn();
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  resetAllStores();
  vi.clearAllMocks();
  
  // Clean up localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});
