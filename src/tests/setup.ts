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

// Mock HTMLCanvasElement methods
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: [] })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
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
});

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => '');

// Note: ESM modules don't support vi.mock in setup files
// Individual test files should use vi.mock() for proper ESM module mocking
// as recommended in the testing guide

// Mock Zustand stores
vi.mock('../features/canvas/stores/slices/canvasElementsStore', () => ({
  useCanvasElementsStore: vi.fn(() => ({
    elements: [],
    selectedElementIds: [],
    addElement: vi.fn(),
    updateElement: vi.fn(),
    removeElement: vi.fn(),
    selectElement: vi.fn(),
    deselectElement: vi.fn(),
    clearSelection: vi.fn(),
    moveElement: vi.fn(),
    resizeElement: vi.fn()
  }))
}));

vi.mock('../features/canvas/stores/slices/sectionStore', () => ({
  useSectionStore: vi.fn(() => ({
    sections: [],
    activeSectionId: null,
    addSection: vi.fn(),
    updateSection: vi.fn(),
    removeSection: vi.fn(),
    setActiveSection: vi.fn(),
    moveElementToSection: vi.fn()
  }))
}));

vi.mock('../features/canvas/stores/slices/canvasUIStore', () => ({
  useCanvasUIStore: vi.fn(() => ({
    selectedTool: 'select',
    isDrawing: false,
    showGrid: true,
    snapToGrid: false,
    setSelectedTool: vi.fn(),
    setIsDrawing: vi.fn(),
    toggleGrid: vi.fn(),
    toggleSnapToGrid: vi.fn()
  }))
}));

vi.mock('../features/canvas/stores/slices/viewportStore', () => ({
  useViewportStore: vi.fn(() => ({
    scale: 1,
    x: 0,
    y: 0,
    stageWidth: 800,
    stageHeight: 600,
    setScale: vi.fn(),
    setPosition: vi.fn(),
    setStageSize: vi.fn(),
    resetViewport: vi.fn()
  }))
}));

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

// Mock HTML5 Canvas methods
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
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
  measureText: vi.fn(() => ({ width: 10 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn()
})) as any;

// Suppress console warnings in tests unless explicitly testing them
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
