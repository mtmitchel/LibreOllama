import '@testing-library/jest-dom';
import 'jest-canvas-mock';
import React from 'react';
import { enableMapSet } from 'immer';

// Enable Immer Map/Set support globally for all tests
enableMapSet();

// Mock Tauri API
jest.mock('@tauri-apps/api', () => require('../__mocks__/@tauri-apps/api'));
jest.mock('@tauri-apps/api/tauri', () => require('../__mocks__/@tauri-apps/api/tauri'));
jest.mock('@tauri-apps/api/event', () => require('../__mocks__/@tauri-apps/api/event'));

// Extend global types
declare global {
  var testHelpers: {
    createMockKonvaEvent: (overrides?: any) => any;
    createMockStage: () => any;
    mockPerformanceNow: jest.Mock;
  };
}

// Mock Canvas API
(global.HTMLCanvasElement.prototype.getContext as any) = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Konva
jest.mock('konva', () => ({
  default: {
    stages: [],
    Util: {
      haveIntersection: jest.fn(() => false),
      getRandomColor: jest.fn(() => '#000000'),
    },
  },
  Stage: jest.fn().mockImplementation((config) => ({
    ...config,
    container: jest.fn(() => document.createElement('div')),
    getPointerPosition: jest.fn(() => ({ x: 100, y: 100 })),
    getAbsoluteTransform: jest.fn(() => ({
      copy: () => ({
        invert: () => ({
          point: (p: any) => p
        })
      })
    })),
    draw: jest.fn(),
    batchDraw: jest.fn(),
    destroy: jest.fn(),
    width: jest.fn(() => config?.width || 800),
    height: jest.fn(() => config?.height || 600),
    scale: jest.fn(() => ({ x: 1, y: 1 })),
    scaleX: jest.fn(() => 1),
    scaleY: jest.fn(() => 1),
    x: jest.fn(() => config?.x || 0),
    y: jest.fn(() => config?.y || 0),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
    find: jest.fn(() => []),
    findOne: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
    toDataURL: jest.fn(() => 'data:image/png;base64,'),
    cache: jest.fn(),
    clearCache: jest.fn(),
    getClientRect: jest.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
  })),
  Layer: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    removeChildren: jest.fn(),
    getChildren: jest.fn(() => []),
    draw: jest.fn(),
    batchDraw: jest.fn(),
    destroy: jest.fn(),
    moveToTop: jest.fn(),
    moveToBottom: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    find: jest.fn(() => []),
    visible: jest.fn(() => true),
    opacity: jest.fn(() => 1),
    cache: jest.fn(),
    clearCache: jest.fn(),
  })),
  Group: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    removeChildren: jest.fn(),
    getChildren: jest.fn(() => []),
    x: jest.fn(() => 0),
    y: jest.fn(() => 0),
    width: jest.fn(() => 100),
    height: jest.fn(() => 100),
    scaleX: jest.fn(() => 1),
    scaleY: jest.fn(() => 1),
    on: jest.fn(),
    off: jest.fn(),
    getAbsolutePosition: jest.fn(() => ({ x: 0, y: 0 })),
    getClientRect: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    cache: jest.fn(),
    destroy: jest.fn(),
  })),
  Rect: jest.fn().mockImplementation(() => ({
    x: jest.fn(() => 0),
    y: jest.fn(() => 0),
    width: jest.fn(() => 100),
    height: jest.fn(() => 100),
    fill: jest.fn(() => '#000000'),
    stroke: jest.fn(() => '#000000'),
    strokeWidth: jest.fn(() => 1),
    cornerRadius: jest.fn(() => 0),
    on: jest.fn(),
    off: jest.fn(),
    cache: jest.fn(),
    isCached: jest.fn(() => false),
    destroy: jest.fn(),
  })),
  Circle: jest.fn().mockImplementation(() => ({
    x: jest.fn(() => 0),
    y: jest.fn(() => 0),
    radius: jest.fn(() => 50),
    fill: jest.fn(() => '#000000'),
    stroke: jest.fn(() => '#000000'),
    strokeWidth: jest.fn(() => 1),
    on: jest.fn(),
    off: jest.fn(),
    cache: jest.fn(),
    isCached: jest.fn(() => false),
    destroy: jest.fn(),
  })),
  Text: jest.fn().mockImplementation(() => ({
    x: jest.fn(() => 0),
    y: jest.fn(() => 0),
    text: jest.fn(() => ''),
    fontSize: jest.fn(() => 14),
    fontFamily: jest.fn(() => 'Arial'),
    fill: jest.fn(() => '#000000'),
    width: jest.fn(() => 100),
    height: jest.fn(() => 20),
    on: jest.fn(),
    off: jest.fn(),
    cache: jest.fn(),
    destroy: jest.fn(),
  })),
  Line: jest.fn().mockImplementation(() => ({
    points: jest.fn(() => []),
    stroke: jest.fn(() => '#000000'),
    strokeWidth: jest.fn(() => 1),
    on: jest.fn(),
    off: jest.fn(),
    cache: jest.fn(),
    destroy: jest.fn(),
  })),
  Arrow: jest.fn().mockImplementation(() => ({
    points: jest.fn(() => []),
    stroke: jest.fn(() => '#000000'),
    strokeWidth: jest.fn(() => 1),
    pointerLength: jest.fn(() => 10),
    pointerWidth: jest.fn(() => 10),
    on: jest.fn(),
    off: jest.fn(),
    cache: jest.fn(),
    destroy: jest.fn(),
  })),
  Star: jest.fn().mockImplementation(() => ({
    x: jest.fn(() => 0),
    y: jest.fn(() => 0),
    numPoints: jest.fn(() => 5),
    innerRadius: jest.fn(() => 20),
    outerRadius: jest.fn(() => 40),
    fill: jest.fn(() => '#000000'),
    stroke: jest.fn(() => '#000000'),
    on: jest.fn(),
    off: jest.fn(),
    cache: jest.fn(),
    destroy: jest.fn(),
  })),
  Transformer: jest.fn().mockImplementation(() => ({
    nodes: jest.fn(() => []),
    attachTo: jest.fn(),
    detach: jest.fn(),
    forceUpdate: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
}));

// Mock React-Konva
jest.mock('react-konva', () => {
  const mockComponent = (testId: string) => (props: any) => {
    const { children, ...otherProps } = props;
    return React.createElement(
      'div',
      { 'data-testid': testId, ...otherProps },
      children
    );
  };

  return {
    Stage: mockComponent('konva-stage'),
    Layer: mockComponent('konva-layer'),
    Group: mockComponent('konva-group'),
    Rect: mockComponent('konva-rect'),
    Circle: mockComponent('konva-circle'),
    Text: mockComponent('konva-text'),
    Line: mockComponent('konva-line'),
    Arrow: mockComponent('konva-arrow'),
    Star: mockComponent('konva-star'),
    Transformer: mockComponent('konva-transformer'),
  };
});

// Mock react-konva-utils
jest.mock('react-konva-utils', () => ({
  Html: (props: any) => {
    const { children } = props;
    return React.createElement('div', { 'data-testid': 'konva-html' }, children);
  },
}));

// Global test helpers
(global as any).testHelpers = {
  // Mock Konva event object
  createMockKonvaEvent: (overrides = {}) => ({
    target: { getStage: jest.fn(() => (global as any).testHelpers.createMockStage()) },
    evt: { preventDefault: jest.fn(), stopPropagation: jest.fn() },
    cancelBubble: false,
    ...overrides,
  }),
  
  // Mock Konva stage
  createMockStage: () => ({
    getPointerPosition: jest.fn(() => ({ x: 100, y: 100 })),
    width: jest.fn(() => 800),
    height: jest.fn(() => 600),
    scale: jest.fn(() => ({ x: 1, y: 1 })),
    position: jest.fn(() => ({ x: 0, y: 0 })),
    find: jest.fn(() => []),
    draw: jest.fn(),
    batchDraw: jest.fn(),
  }),
  
  // Mock performance.now for animations
  mockPerformanceNow: jest.fn(() => Date.now()),
};

// Mock import.meta.env
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        DEV: false,
        PROD: true,
        MODE: 'test',
        VITE_APP_TITLE: 'LibreOllama Test',
      }
    }
  }
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: (global as any).testHelpers.mockPerformanceNow,
  },
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Suppress console warnings in tests
console.warn = jest.fn();
console.error = jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
