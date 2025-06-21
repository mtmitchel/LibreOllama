/**
 * Jest Setup for ESM + TypeScript + React Konva
 * Based on comprehensive testing guide best practices
 */

import '@testing-library/jest-dom';

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

// Note: ESM modules don't support jest.mock() in setup files
// Individual test files should use jest.unstable_mockModule() 
// or dynamic imports for proper ESM module mocking
console.log('✅ ESM Test Setup Complete - Individual tests handle module mocking');
