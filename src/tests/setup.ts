import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Tauri APIs inline
const tauriMocks = {
  invoke: vi.fn(),
  transformCallback: vi.fn(),
  Channel: vi.fn(),
};

// Apply Tauri mocks globally
Object.assign(global, tauriMocks);

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Comprehensive DOM API mocks for Tiptap/ProseMirror
function getBoundingClientRect(): DOMRect {
  const rect = {
    x: 0,
    y: 0,
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
  };
  return { ...rect, toJSON: () => rect };
}

class FakeDOMRectList extends Array implements DOMRectList {
  item(index: number): DOMRect | null {
    return this[index] || null;
  }
  
  [Symbol.iterator](): ArrayIterator<DOMRect> {
    return super[Symbol.iterator]();
  }
}

// Mock DOM APIs that ProseMirror requires
global.Range = class Range {
  startContainer: Node = document.body;
  startOffset: number = 0;
  endContainer: Node = document.body;
  endOffset: number = 0;
  collapsed: boolean = true;
  commonAncestorContainer: Node = document.body;

  setStart(node: Node, offset: number): void {
    this.startContainer = node;
    this.startOffset = offset;
  }

  setEnd(node: Node, offset: number): void {
    this.endContainer = node;
    this.endOffset = offset;
  }

  getBoundingClientRect(): DOMRect {
    return getBoundingClientRect();
  }

  getClientRects(): DOMRectList {
    return new FakeDOMRectList();
  }

  createContextualFragment(html: string): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const div = document.createElement('div');
    div.innerHTML = html;
    while (div.firstChild) {
      fragment.appendChild(div.firstChild);
    }
    return fragment;
  }

  selectNodeContents(): void {}
  selectNode(): void {}
  collapse(): void {}
  insertNode(): void {}
  deleteContents(): void {}
  extractContents(): DocumentFragment {
    return document.createDocumentFragment();
  }
  cloneContents(): DocumentFragment {
    return document.createDocumentFragment();
  }
  cloneRange(): Range {
    return new Range();
  }
  detach(): void {}
  isPointInRange(): boolean { return false; }
  comparePoint(): number { return 0; }
  intersectsNode(): boolean { return false; }
  toString(): string { return ''; }
} as any;

// Mock document.createRange
document.createRange = (): Range => new Range();

// Mock element methods
document.elementFromPoint = (): null => null;
document.elementsFromPoint = (): Element[] => [];
(document as any).caretRangeFromPoint = (): Range | null => null;

// Mock HTMLElement methods
HTMLElement.prototype.getBoundingClientRect = getBoundingClientRect;
HTMLElement.prototype.getClientRects = (): DOMRectList => new FakeDOMRectList();

// Mock Element methods
Element.prototype.getBoundingClientRect = getBoundingClientRect;
Element.prototype.getClientRects = (): DOMRectList => new FakeDOMRectList();
Element.prototype.scrollIntoView = vi.fn();

// Mock Text node methods
if (typeof Text !== 'undefined') {
  (Text.prototype as any).getBoundingClientRect = getBoundingClientRect;
  (Text.prototype as any).getClientRects = (): DOMRectList => new FakeDOMRectList();
}

// Mock Selection API
class MockSelection implements Selection {
  anchorNode: Node | null = null;
  anchorOffset: number = 0;
  focusNode: Node | null = null;
  focusOffset: number = 0;
  isCollapsed: boolean = true;
  rangeCount: number = 0;
  type: string = 'None';
  direction: string = 'none';

  addRange(): void {}
  collapse(): void {}
  collapseToEnd(): void {}
  collapseToStart(): void {}
  containsNode(): boolean { return false; }
  deleteFromDocument(): void {}
  empty(): void {}
  extend(): void {}
  getRangeAt(): Range { return new Range(); }
  modify(): void {}
  removeAllRanges(): void {}
  removeRange(): void {}
  selectAllChildren(): void {}
  setBaseAndExtent(): void {}
  setPosition(): void {}
  toString(): string { return ''; }
}

Object.defineProperty(window, 'getSelection', {
  value: () => new MockSelection(),
  writable: true,
});

Object.defineProperty(document, 'getSelection', {
  value: () => new MockSelection(),
  writable: true,
});

// Mock ClipboardEvent and DragEvent for Tiptap interactions
class ClipboardDataMock {
  getData = vi.fn().mockReturnValue('');
  setData = vi.fn();
  clearData = vi.fn();
  items: DataTransferItemList = [] as any;
  types: readonly string[] = [];
  files: FileList = [] as any;
}

global.ClipboardEvent = class ClipboardEvent extends Event {
  clipboardData = new ClipboardDataMock();
  constructor(type: string, options?: EventInit) {
    super(type, options);
  }
} as any;

class DataTransferMock {
  data: { [key: string]: string } = {};
  
  setData(format: string, data: string): void {
    this.data[format] = data;
  }
  
  getData(format: string): string {
    return this.data[format] || '';
  }
  
  clearData(): void {
    this.data = {};
  }
  
  items: DataTransferItemList = [] as any;
  types: readonly string[] = [];
  files: FileList = [] as any;
  dropEffect: string = 'none';
  effectAllowed: string = 'uninitialized';
}

global.DragEvent = class DragEvent extends Event {
  dataTransfer = new DataTransferMock();
  constructor(type: string, options?: EventInit) {
    super(type, options);
  }
} as any;

// Mock ResizeObserver if needed
global.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  constructor(callback: ResizeObserverCallback) {}
} as any;

// Mock IntersectionObserver if needed
global.IntersectionObserver = class IntersectionObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
} as any;

// Konva Canvas mocks
// Mock HTMLCanvasElement for Konva
Object.defineProperty(global.HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn().mockImplementation((contextType) => {
    if (contextType === '2d') {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
        createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
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
        quadraticCurveTo: vi.fn(), // Added missing method
        arcTo: vi.fn(),          // Added missing method
        bezierCurveTo: vi.fn(), // Added missing method
      };
    }
    return null;
  }),
});

// Add width and height properties to the prototype for Konva compatibility
Object.defineProperty(global.HTMLCanvasElement.prototype, 'width', {
  configurable: true,
  value: 1000, // Provide a default reasonable value
  writable: true,
});

Object.defineProperty(global.HTMLCanvasElement.prototype, 'height', {
  configurable: true,
  value: 1000, // Provide a default reasonable value
  writable: true,
});

// Mock document.createElement to ensure canvas elements have mocked context
const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'canvas') {
    const canvas = originalCreateElement.call(document, tagName);
    // Ensure getContext is mocked for this specific canvas instance
    Object.defineProperty(canvas, 'getContext', {
      configurable: true,
      value: vi.fn().mockImplementation((contextType: string) => {
        if (contextType === '2d') {
          return {
            fillRect: vi.fn(),
            clearRect: vi.fn(),
            getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
            putImageData: vi.fn(),
            createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
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
            quadraticCurveTo: vi.fn(), // Added missing method
            arcTo: vi.fn(),          // Added missing method
            bezierCurveTo: vi.fn(), // Added missing method
          };
        }
        return null;
      }),
    });
    // Add width and height to the specific canvas instance as well
    Object.defineProperty(canvas, 'width', {
      configurable: true,
      value: 1000,
      writable: true,
    });
    Object.defineProperty(canvas, 'height', {
      configurable: true,
      value: 1000,
      writable: true,
    });
    return canvas;
  }
  return originalCreateElement.call(document, tagName);
}) as any;

// Additional mocks for compatibility
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  value: 100,
});

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  value: 100,
});

// Mock zustand persist middleware
vi.mock('zustand/middleware', () => ({
  persist: vi.fn((fn) => fn),
  subscribeWithSelector: vi.fn((fn) => fn),
  devtools: vi.fn((fn) => fn),
  createJSONStorage: vi.fn(() => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })),
}));

// Canvas Image data mocks
global.createImageBitmap = vi.fn().mockResolvedValue({});

// Additional window/document mocks
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock CSS.supports if needed
if (typeof CSS === 'undefined') {
  global.CSS = {
    supports: vi.fn().mockReturnValue(true),
  } as any;
}

// Global test utilities
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock requestAnimationFrame for Konva
global.requestAnimationFrame = vi.fn((callback) => {
  return Number(setTimeout(() => callback(Date.now()), 0));
});

global.cancelAnimationFrame = vi.fn();

console.log('Test setup complete with comprehensive DOM API mocks');
