/**
 * Vitest Setup for ESM + TypeScript + React Konva
 * Based on comprehensive testing guide best practices
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Enhanced canvas module mocking to prevent native module loading
// Mock canvas module before any imports
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Array(4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => new Array(4)),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    })),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
  Image: vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    width: 0,
    height: 0,
    src: '',
    onload: null,
    onerror: null,
  })),
  loadImage: vi.fn(() => Promise.resolve({
    width: 100,
    height: 100,
  })),
}));

// Also mock canvas/lib-extra
vi.mock('canvas/lib-extra', () => ({}));

// Enable Immer Map/Set plugin for store tests
import { enableMapSet } from 'immer';
enableMapSet();

// Basic DOM and Canvas API mocks
HTMLCanvasElement.prototype.getContext = (() => ({
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: new Array(4) }),
  putImageData: () => {},
  createImageData: () => new Array(4),
  setTransform: () => {},
  drawImage: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  arc: () => {},
  fill: () => {},
  measureText: () => ({ width: 0 }),
  transform: () => {},
  rect: () => {},
  clip: () => {},
})) as any;

HTMLCanvasElement.prototype.toDataURL = (() => '') as any;

// Global DOM API mocks for testing
(global as any).IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Window and browser API mocks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// ResizeObserver mock
(global as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Suppress Konva warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress known Konva warnings that are expected in test environment
    if (message.includes('Text components are not supported for now in ReactKonva') ||
        message.includes('Group will be used instead') ||
        message.includes('is a not valid value for "fill" attribute') ||
        message.includes('DOM_Portal.html')) {
      return;
    }
  }
  originalWarn.apply(console, args);
};

console.log('✅ Enhanced ESM Test Setup Complete with Canvas Mocking');
