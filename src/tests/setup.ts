import '@testing-library/jest-dom';
import 'jest-canvas-mock';
import { enableMapSet } from 'immer';

enableMapSet();

// Mock import.meta for Jest environment
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
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock HTMLCanvasElement methods
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: [] })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => []),
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
});

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => '');

// Note: ESM modules don't support jest.mock in setup files
// Individual test files should use vi.mock() or jest.unstable_mockModule()
// for proper ESM module mocking as recommended in the testing guide
  Stage: jest.fn().mockImplementation(() => ({
    container: jest.fn(() => document.createElement('div')),
    getPointerPosition: jest.fn(() => ({ x: 100, y: 100 })),
    getAbsoluteTransform: jest.fn(() => ({
      getMatrix: () => [1, 0, 0, 1, 0, 0],
      invert: () => ({ point: (p: any) => p })
    })),
    draw: jest.fn(),
    batchDraw: jest.fn(),
    destroy: jest.fn(),
    width: jest.fn(() => 800),
    height: jest.fn(() => 600),
    scale: jest.fn(() => ({ x: 1, y: 1 })),
    scaleX: jest.fn(() => 1),
    scaleY: jest.fn(() => 1),
    x: jest.fn(() => 0),
    y: jest.fn(() => 0),
    rotation: jest.fn(() => 0),
    skewX: jest.fn(() => 0),
    skewY: jest.fn(() => 0),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
    getIntersection: jest.fn(),
    find: jest.fn(() => []),
    findOne: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
    removeChildren: jest.fn(),
    getChildren: jest.fn(() => []),
    toDataURL: jest.fn(() => 'data:image/png;base64,'),
    cache: jest.fn(),
    clearCache: jest.fn()
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
    moveUp: jest.fn(),
    moveDown: jest.fn(),
    getZIndex: jest.fn(() => 0),
    setZIndex: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
    find: jest.fn(() => []),
    findOne: jest.fn(),
    visible: jest.fn(() => true),
    opacity: jest.fn(() => 1),
    cache: jest.fn(),
    clearCache: jest.fn()
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
    rotation: jest.fn(() => 0),
    skewX: jest.fn(() => 0),
    skewY: jest.fn(() => 0),
    draggable: jest.fn(() => false),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
    getAbsolutePosition: jest.fn(() => ({ x: 0, y: 0 })),
    getRelativePointerPosition: jest.fn(() => ({ x: 0, y: 0 })),
    getClientRect: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    cache: jest.fn(),
    clearCache: jest.fn(),
    destroy: jest.fn()
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
    fire: jest.fn(),
    getClientRect: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    cache: jest.fn(),
    clearCache: jest.fn(),
    destroy: jest.fn()
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
    fire: jest.fn(),
    getClientRect: jest.fn(() => ({ x: -50, y: -50, width: 100, height: 100 })),
    cache: jest.fn(),
    clearCache: jest.fn(),
    destroy: jest.fn()
  })),
  Star: jest.fn().mockImplementation(() => ({
    x: jest.fn(() => 0),
    y: jest.fn(() => 0),
    numPoints: jest.fn(() => 5),
    innerRadius: jest.fn(() => 30),
    outerRadius: jest.fn(() => 60),
    fill: jest.fn(() => '#000000'),
    stroke: jest.fn(() => '#000000'),
    strokeWidth: jest.fn(() => 1),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
    getClientRect: jest.fn(() => ({ x: -60, y: -60, width: 120, height: 120 })),
    cache: jest.fn(),
    clearCache: jest.fn(),
    destroy: jest.fn()
  })),
  Text: jest.fn().mockImplementation(() => ({
    x: jest.fn(() => 0),
    y: jest.fn(() => 0),
    text: jest.fn(() => ''),
    fontSize: jest.fn(() => 16),
    fontFamily: jest.fn(() => 'Arial'),
    fill: jest.fn(() => '#000000'),
    align: jest.fn(() => 'left'),
    verticalAlign: jest.fn(() => 'top'),
    width: jest.fn(() => 100),
    height: jest.fn(() => 20),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
    getClientRect: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 20 })),
    getTextWidth: jest.fn(() => 100),
    getTextHeight: jest.fn(() => 20),
    cache: jest.fn(),
    clearCache: jest.fn(),
    destroy: jest.fn()
  })),
  Line: jest.fn().mockImplementation(() => ({
    points: jest.fn(() => [0, 0, 100, 100]),
    stroke: jest.fn(() => '#000000'),
    strokeWidth: jest.fn(() => 1),
    tension: jest.fn(() => 0),
    closed: jest.fn(() => false),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
    getClientRect: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    cache: jest.fn(),
    clearCache: jest.fn(),
    destroy: jest.fn()
  })),
  Image: jest.fn().mockImplementation(() => ({
    x: jest.fn(() => 0),
    y: jest.fn(() => 0),
    width: jest.fn(() => 100),
    height: jest.fn(() => 100),
    image: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
    getClientRect: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    cache: jest.fn(),
    clearCache: jest.fn(),
    destroy: jest.fn()
  })),
  Transformer: jest.fn().mockImplementation(() => ({
    nodes: jest.fn(() => []),
    node: jest.fn(),
    attachTo: jest.fn(),
    detach: jest.fn(),
    forceUpdate: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
    destroy: jest.fn(),
    hide: jest.fn(),
    show: jest.fn(),
    visible: jest.fn(() => true)
  })),
  Animation: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    isRunning: jest.fn(() => false)
  })),
  Tween: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    reverse: jest.fn(),
    reset: jest.fn(),
    finish: jest.fn(),
    destroy: jest.fn()
  }))
}));

// Mock react-konva
jest.mock('react-konva', () => ({
  Stage: jest.fn(({ children, ...props }) => 
    jest.fn().mockImplementation(() => ({ children, props }))
  ),
  Layer: jest.fn(({ children, ...props }) => 
    jest.fn().mockImplementation(() => ({ children, props }))
  ),
  Group: jest.fn(({ children, ...props }) => 
    jest.fn().mockImplementation(() => ({ children, props }))
  ),
  Rect: jest.fn((props) => 
    jest.fn().mockImplementation(() => ({ props }))
  ),
  Circle: jest.fn((props) => 
    jest.fn().mockImplementation(() => ({ props }))
  ),
  Star: jest.fn((props) => 
    jest.fn().mockImplementation(() => ({ props }))
  ),
  Text: jest.fn((props) => 
    jest.fn().mockImplementation(() => ({ props }))
  ),
  Line: jest.fn((props) => 
    jest.fn().mockImplementation(() => ({ props }))
  ),
  Image: jest.fn((props) => 
    jest.fn().mockImplementation(() => ({ props }))
  ),
  Transformer: jest.fn((props) => 
    jest.fn().mockImplementation(() => ({ props }))
  )
}));

// Mock Zustand stores
jest.mock('../features/canvas/stores/slices/canvasElementsStore', () => ({
  useCanvasElementsStore: jest.fn(() => ({
    elements: [],
    selectedElementIds: [],
    addElement: jest.fn(),
    updateElement: jest.fn(),
    removeElement: jest.fn(),
    selectElement: jest.fn(),
    deselectElement: jest.fn(),
    clearSelection: jest.fn(),
    moveElement: jest.fn(),
    resizeElement: jest.fn()
  }))
}));

jest.mock('../features/canvas/stores/slices/sectionStore', () => ({
  useSectionStore: jest.fn(() => ({
    sections: [],
    activeSectionId: null,
    addSection: jest.fn(),
    updateSection: jest.fn(),
    removeSection: jest.fn(),
    setActiveSection: jest.fn(),
    moveElementToSection: jest.fn()
  }))
}));

jest.mock('../features/canvas/stores/slices/canvasUIStore', () => ({
  useCanvasUIStore: jest.fn(() => ({
    selectedTool: 'select',
    isDrawing: false,
    showGrid: true,
    snapToGrid: false,
    setSelectedTool: jest.fn(),
    setIsDrawing: jest.fn(),
    toggleGrid: jest.fn(),
    toggleSnapToGrid: jest.fn()
  }))
}));

jest.mock('../features/canvas/stores/slices/viewportStore', () => ({
  useViewportStore: jest.fn(() => ({
    scale: 1,
    x: 0,
    y: 0,
    stageWidth: 800,
    stageHeight: 600,
    setScale: jest.fn(),
    setPosition: jest.fn(),
    setStageSize: jest.fn(),
    resetViewport: jest.fn()
  }))
}));

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock HTML5 Canvas methods
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
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
  measureText: jest.fn(() => ({ width: 10 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn()
})) as any;

// Suppress console warnings in tests unless explicitly testing them
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
