// Mock for @tauri-apps/api/event
import { vi } from 'vitest';

const listeners = new Map();

// Mock the 'listen' function
export const listen = vi.fn((event, handler) => {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(handler);
  
  // Return a mock unlisten function
  return Promise.resolve(() => {
    if (listeners.has(event)) {
      listeners.get(event).delete(handler);
      if (listeners.get(event).size === 0) {
        listeners.delete(event);
      }
    }
  });
});

// Mock the 'once' function
export const once = vi.fn((event, handler) => {
  const wrappedHandler = (eventData) => {
    handler(eventData);
    // Auto-remove after first call
    if (listeners.has(event)) {
      listeners.get(event).delete(wrappedHandler);
    }
  };
  
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(wrappedHandler);
  
  return Promise.resolve(() => {
    if (listeners.has(event)) {
      listeners.get(event).delete(wrappedHandler);
    }
  });
});

// Mock the 'emit' function
export const emit = vi.fn((event, payload) => {
  return Promise.resolve();
});

// Helper function to simulate an event from the Rust backend in tests
export const __emit = (event, payload) => {
  if (listeners.has(event)) {
    listeners.get(event).forEach(handler => {
      // Call the registered handler with the mock event object
      handler({ event, payload });
    });
  }
};

// Helper to clear all listeners between tests
export const __clearListeners = () => {
  listeners.clear();
  listen.mockClear();
  once.mockClear();
  emit.mockClear();
};

// Helper to get current listeners for testing
export const __getListeners = (event) => {
  return listeners.has(event) ? Array.from(listeners.get(event)) : [];
};
