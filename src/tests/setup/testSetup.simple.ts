/**
 * Simplified Test Setup for LibreOllama
 * 
 * This file handles basic test environment setup without complex dynamic imports.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  drawImage = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  canvas = { width: 800, height: 600, toDataURL: vi.fn(() => 'data:image/png;base64,') };
  fillStyle = '#000000';
  strokeStyle = '#000000';
}

// Mock HTMLCanvasElement for Konva
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => new MockContext2D());
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
  };
  
  // Getters/setters for canvas context properties
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
}

// Mock HTMLCanvasElement.prototype.getContext to return our mock context
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockContext2D();
    }
    return null;
  });
  
  // Mock other canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob());
  });
}

// GLOBAL MOCKS: Set up React-Konva mocking at the global level
vi.mock('react-konva', async () => {
  const mocks = await import('../__mocks__/react-konva');
  return mocks;
});

// GLOBAL MOCKS: Set up canvas mocking at the global level
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// CRITICAL: Clear mock call history between tests without resetting implementations
beforeEach(() => {
  vi.clearAllMocks(); // Clears call history but preserves mock implementations
});

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// CRITICAL FIX: Clean DOM and timers between tests, but preserve global mocks
afterEach(() => {
  // Clean up DOM elements from previous tests
  cleanup();
  // Clear all timers to prevent interference
  vi.clearAllTimers();
  // Clear mock call history without removing mock implementations
  vi.clearAllMocks();
  // NOTE: Removed vi.restoreAllMocks() as it was removing our global React-Konva mocks
});

// PERFORMANCE: Suppress excessive console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Suppress verbose store logging but keep errors
console.log = (message: any, ...args: any[]) => {
  // Only suppress store debug logs, keep other logs
  if (typeof message === 'string' && (
    message.includes('[ELEMENTS STORE]') ||
    message.includes('[VIEWPORT STORE]') ||
    message.includes('[SELECTION STORE]') ||
    message.includes('[HISTORY STORE]') ||
    message.includes('🔧') ||
    message.includes('✅')
  )) {
    return; // Suppress these logs
  }
  originalConsoleLog(message, ...args);
};

console.warn = (message: any, ...args: any[]) => {
  // Suppress React-Konva warnings about unrecognized tags
  if (typeof message === 'string' && (
    message.includes('unrecognized in this browser') ||
    message.includes('start its name with an uppercase letter')
  )) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(message, ...args);
};

// CRITICAL: Mock React-Konva and Konva libraries without dynamic imports for now
// Component-level tests will be addressed separately

// CRITICAL: Manual cleanup required when threads are disabled
afterEach(cleanup);

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// ENHANCED CANVAS MOCKING: Extend JSDOM's canvas implementation for Konva compatibility
class MockContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn(() => ({ data: new Array(4) }));
  putImageData = vi.fn();
  createImageData = vi.fn(() => new Array(4));
  setTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  isPointInPath = vi.fn(() => false);
  
  // Canvas properties
  canvas = {
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => '