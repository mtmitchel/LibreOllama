// Vitest globals enabled in config - no need to import describe, test, expect, beforeEach
import { vi } from 'vitest';

// Mock canvas module before any imports that might use it
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';

// Import the store creator directly
import {
  createCanvasElementsStore,
  CanvasElementsState,
} from '@/features/canvas/stores/slices/canvasElementsStore';

// Mock element helper that creates valid elements matching the schema
const createMockCanvasElement = (overrides: any = {}): any => {
  const baseId = overrides.id || `test-element-${Math.random().toString(36).substr(2, 9)}`;
  const baseType = overrides.type || 'rectangle';
  
  // Base element properties required by all types
  const baseElement = {
    id: baseId,
    type: baseType,
    x: 100,
    y: 100,
    rotation: 0,
    isLocked: false,
    isHidden: false,
    zIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };

  // Add type-specific required properties
  switch (baseType) {
    case 'rectangle':
      return {
        ...baseElement,
        width: 100,
        height: 50,
        fill: '#0074D9',
        stroke: '#001f3f',
        strokeWidth: 1,
        cornerRadius: 0,
        ...overrides,
      };
    
    case 'circle':
      return {
        ...baseElement,
        radius: 25,
        fill: '#0074D9',
        stroke: '#001f3f',
        strokeWidth: 1,
        ...overrides,
      };
    
    case 'text':
      return {
        ...baseElement,
        text: 'Sample Text',
        fontSize: 16,
        fontFamily: 'Arial',
        textAlign: 'left',
        fill: '#000000',
        width: 100,
        height: 20,
        ...overrides,
      };
    
    case 'pen':
      return {
        ...baseElement,
        points: [0, 0, 50, 25, 100, 0, 150, 25], // Valid points array with minimum 4 numbers
        stroke: '#000000',
        strokeWidth: 2,
        tension: 0.5,
        ...overrides,
      };
    
    case 'triangle':
      return {
        ...baseElement,
        points: [50, 0, 0, 100, 100, 100], // Valid triangle points (minimum 6 numbers)
        width: 100,
        height: 100,
        fill: '#0074D9',
        stroke: '#001f3f',
        strokeWidth: 1,
        ...overrides,
      };
    
    case 'table':
      return {
        ...baseElement,
        rows: 2,
        cols: 2,
        width: 200,
        height: 100,
        enhancedTableData: {
          rows: [{height: 50, id: 'row1'}, {height: 50, id: 'row2'}],
          columns: [{width: 100, id: 'col1'}, {width: 100, id: 'col2'}],
          cells: [
            [{content: 'Cell 1,1'}, {content: 'Cell 1,2'}],
            [{content: 'Cell 2,1'}, {content: 'Cell 2,2'}]
          ]
        },
        cellPadding: 5,
        borderWidth: 1,
        borderColor: '#000000',
        ...overrides,
      };
    
    case 'section':
      return {
        ...baseElement,
        width: 300,
        height: 200,
        title: 'Section Title',
        backgroundColor: '#f0f0f0',
        borderColor: '#cccccc',
        borderWidth: 1,
        cornerRadius: 5,
        collapsed: false,
        childElementIds: [],
        ...overrides,
      };
    
    case 'connector':
      return {
        ...baseElement,
        subType: 'line',
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        stroke: '#000000',
        strokeWidth: 2,
        ...overrides,
      };
    
    default:
      // Default to rectangle for unknown types
      return {
        ...baseElement,
        type: 'rectangle',
        width: 100,
        height: 50,
        fill: '#0074D9',
        stroke: '#001f3f',
        strokeWidth: 1,
        cornerRadius: 0,
        ...overrides,
      };
  }
};

// A helper to create a fresh, isolated store for each test with proper middleware
const createTestStore = () => createStore<CanvasElementsState>()(immer(createCanvasElementsStore));

describe('canvasElementsStore', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Element Management', () => {
    test('initializes with empty elements map', () => {
      expect(store.getState().elements).toEqual(new Map());
    });

    test('adds element correctly', () => {
      const element = createMockCanvasElement({ type: 'rectangle' });

      store.getState().addElement(element);

      const state = store.getState();
      expect(state.elements.get(element.id)).toEqual(
        expect.objectContaining(element),
      );
    });

    test('updates element properties', () => {
      const element = createMockCanvasElement({ type: 'rectangle', x: 100, y: 200 });

      // Add the element first
      store.getState().addElement(element);

      const updates = { x: 200, y: 300, fill: '#00ff00' };
      store.getState().updateElement(element.id, updates);

      const updatedElement = store.getState().elements.get(element.id);
      expect(updatedElement.x).toBe(200);
      expect(updatedElement.y).toBe(300);
      expect(updatedElement.fill).toBe('#00ff00');
    });

    test('updates multiple elements in batch', () => {
      const element1 = createMockCanvasElement({ id: 'elem1', type: 'rectangle' });
      const element2 = createMockCanvasElement({ id: 'elem2', type: 'circle' });

      store.getState().addElement(element1);
      store.getState().addElement(element2);

      const updates = {
        'elem1': { x: 100 },
        'elem2': { radius: 75 },
      };

      store.getState().updateMultipleElements(updates as any);

      const state = store.getState();
      const updatedElement1 = state.elements.get('elem1');
      const updatedElement2 = state.elements.get('elem2');
      
      expect(updatedElement1.x).toBe(100);
      expect(updatedElement2.radius).toBe(75);
    });    test('deletes an element', () => {
      const element = createMockCanvasElement({ type: 'rectangle' });
      store.getState().addElement(element);
      expect(store.getState().elements.has(element.id)).toBe(true);

      store.getState().deleteElement(element.id);
      expect(store.getState().elements.has(element.id)).toBe(false);
    });

    test('deletes multiple elements', () => {
      const element1 = createMockCanvasElement({ id: 'elem1' });
      const element2 = createMockCanvasElement({ id: 'elem2' });
      store.getState().addElement(element1);
      store.getState().addElement(element2);

      store.getState().deleteElements(['elem1', 'elem2']);

      expect(store.getState().elements.has('elem1')).toBe(false);
      expect(store.getState().elements.has('elem2')).toBe(false);
    });

    test('clears all elements', () => {
      const element1 = createMockCanvasElement({ type: 'rectangle' });
      const element2 = createMockCanvasElement({ type: 'circle' });
      
      store.getState().addElement(element1);
      store.getState().addElement(element2);
      store.getState().clearCanvas();

      const state = store.getState();
      expect(state.elements.size).toBe(0);
    });
  });

  describe('Element Queries', () => {
    test('gets element by id', () => {
      const element = createMockCanvasElement({ type: 'rectangle' });
      store.getState().addElement(element);

      const retrievedElement = store.getState().getElementById(element.id);
      expect(retrievedElement).toEqual(element);
    });

    test('gets elements by type', () => {
      const rect1 = createMockCanvasElement({ type: 'rectangle' });
      const rect2 = createMockCanvasElement({ type: 'rectangle' });
      const circle = createMockCanvasElement({ type: 'circle' });
      
      store.getState().addElement(rect1);
      store.getState().addElement(rect2);
      store.getState().addElement(circle);

      const rectangles = store.getState().getElementsByType('rectangle');
      expect(rectangles).toHaveLength(2);
      expect(rectangles.map((r: any) => r.id)).toContain(rect1.id);
      expect(rectangles.map((r: any) => r.id)).toContain(rect2.id);
    });

    test('gets all elements', () => {
      const element1 = createMockCanvasElement({ type: 'rectangle' });
      const element2 = createMockCanvasElement({ type: 'circle' });
      
      store.getState().addElement(element1);
      store.getState().addElement(element2);

      const allElements = store.getState().getAllElements();
      expect(allElements).toHaveLength(2);
    });
  });
});
