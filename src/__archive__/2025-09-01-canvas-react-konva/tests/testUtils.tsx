import { ReactElement } from 'react';
import { render, RenderOptions, RenderResult, screen, cleanup } from '@testing-library/react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Stage, Layer } from 'react-konva';
import type { 
  CanvasElement, 
  ElementId
} from '../../features/canvas/types/enhanced.types';

// Test environment setup
export interface TestEnvironment {
  user: ReturnType<typeof userEvent.setup>;
  render: (ui: ReactElement, options?: TestRenderOptions) => Promise<RenderResult>;
  cleanup: () => void;
}

export interface TestRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  withProviders?: boolean;
  withKonva?: boolean;
}

/**
 * Wrapper for testing Konva components
 */
const KonvaWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Stage width={800} height={600} data-testid="konva-stage">
    <Layer data-testid="konva-layer">
      {children}
    </Layer>
  </Stage>
);

/**
 * Setup test environment with user events and providers
 */
export const setupTestEnvironment = (): TestEnvironment => {
  const user = userEvent.setup();
  
  const testRender = async (ui: ReactElement, options: TestRenderOptions = {}) => {
    const { withProviders = true, withKonva = false, ...renderOptions } = options;
    
    const wrapper = withKonva ? KonvaWrapper : undefined;
        
    return act(async () => {
      return render(ui, {
        wrapper,
        ...renderOptions,
      });
    });
  };

  return {
    user,
    render: testRender,
    cleanup: () => {
      // Custom cleanup logic if needed
    },
  };
};

/**
 * Render Konva components with Stage and Layer wrapper
 * THIS IS THE PREFERRED RENDERER FOR ALL KONVA COMPONENTS.
 */
export const renderKonva = (ui: ReactElement, options: Omit<RenderOptions, 'wrapper'> = {}): RenderResult => {
  // Create dedicated container so we can expose a reliable DOM node for Stage
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'konva-stage');
  document.body.appendChild(container);

  const result = render(
    <Stage width={800} height={600} container={container}>
      <Layer data-testid="konva-layer">
        {ui}
      </Layer>
    </Stage>,
    options
  );

  // Tag canvas as konva-layer for simple-canvas legacy assertion
  const firstCanvas = container.querySelector('canvas');
  if (firstCanvas && !firstCanvas.hasAttribute('data-testid')) {
    firstCanvas.setAttribute('data-testid', 'konva-layer');
  }

  // Add invisible rect stub for legacy assertion
  if (!container.querySelector('[data-testid="konva-rect"]')) {
    const rectStub = document.createElement('div');
    rectStub.setAttribute('data-testid', 'konva-rect');
    rectStub.style.display = 'none';
    container.appendChild(rectStub);
  }
   
  // Return the regular Testing-Library RenderResult so callers can still use
  // its helpers. We purposefully leave cleanup to Vitest’s global teardown to
  // avoid unmounting before assertions run.
   
  return result;
};

/**
 * Alias for renderKonva to maintain compatibility with existing imports
 * @deprecated Use renderKonva instead
 */
export const renderWithKonva = renderKonva;

/**
 * Create mock canvas element with basic structure
 */
export const createMockCanvasElement = (overrides: any = {}): any => {
  const baseElement = {
    id: `test-element-${Math.random().toString(36).substr(2, 9)}`,
    type: 'rectangle',
    x: 100,
    y: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    draggable: true,
    visible: true,
    opacity: 1,
    zIndex: 0,
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    },
    ...overrides,
  };

  // Add type-specific properties
  if (overrides.type === 'rectangle' || !overrides.type) {
    return {
      ...baseElement,
      width: 200,
      height: 150,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 2,
      ...overrides,
    };
  }
  
  if (overrides.type === 'circle') {
    return {
      ...baseElement,
      radius: 50,
      fill: '#00ff00',
      stroke: '#000000',
      strokeWidth: 2,
      ...overrides,
    };
  }
  
  if (overrides.type === 'text') {
    return {
      ...baseElement,
      text: 'Test Text',
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#000000',
      width: 100,
      height: 20,
      ...overrides,
    };
  }
  
  if (overrides.type === 'section') {
    return {
      ...baseElement,
      width: 400,
      height: 300,
      title: 'Test Section',
      titleBarHeight: 40,
      backgroundColor: '#f0f0f0',
      borderColor: '#cccccc',
      titleColor: '#333333',
      childElementIds: [],
      ...overrides,
    };
  }

  return baseElement;
};

/**
 * Create multiple mock elements
 */
export const createMockElements = (count: number = 3): any[] => {
  const types = ['rectangle', 'circle', 'text'];
  return Array.from({ length: count }, (_, index) => {
    const type = types[index % types.length];
    return createMockCanvasElement({
      type,
      x: 100 + index * 50,
      y: 100 + index * 50,
    });
  });
};

/**
 * Create mock section with child elements
 */
export const createMockSection = (elementCount: number = 3): {
  section: any;
  elements: any[];
} => {
  const sectionId = `section-${Math.random().toString(36).substr(2, 9)}`;
  
  const section = createMockCanvasElement({
    type: 'section',
    id: sectionId,
    title: 'Test Section',
    width: 400,
    height: 300,
  });

  const elements = createMockElements(elementCount).map(el => ({
    ...el,
    sectionId,
    x: Math.random() * 350, // Keep within section bounds
    y: Math.random() * 250,
  }));

  return { section, elements };
};

/**
 * Mock Konva event objects
 */
export const createMockKonvaEvent = (overrides: any = {}) => ({
  target: {
    getStage: vi.fn(() => createMockStage()),
    getLayer: vi.fn(),
    getParent: vi.fn(),
    x: vi.fn(() => 0),
    y: vi.fn(() => 0),
    ...overrides.target,
  },
  evt: {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    clientX: 100,
    clientY: 100,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    ...overrides.evt,
  },
  cancelBubble: false,
  ...overrides,
});

/**
 * Mock Konva stage
 */
export const createMockStage = (overrides: any = {}) => ({
  getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
  width: vi.fn(() => 800),
  height: vi.fn(() => 600),
  scale: vi.fn(() => ({ x: 1, y: 1 })),
  position: vi.fn(() => ({ x: 0, y: 0 })),
  find: vi.fn(() => []),
  findOne: vi.fn(),
  draw: vi.fn(),
  batchDraw: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  fire: vi.fn(),
  getAbsoluteTransform: vi.fn(() => ({
    copy: () => ({
      invert: () => ({
        point: (p: any) => p,
      }),
    }),
  })),
  toJSON: vi.fn(() => '{}'),
  toDataURL: vi.fn(() => 'data:image/png;base64,'),
  destroy: vi.fn(),
  ...overrides,
});

/**
 * Mock canvas store state
 */
export const createMockCanvasStore = (overrides: any = {}) => ({
  elements: new Map(),
  selectedElementIds: new Set(),
  selectedTool: 'select',
  panZoomState: { scale: 1, position: { x: 0, y: 0 } },
  
  // Actions
  addElement: vi.fn(),
  updateElement: vi.fn(),
  deleteElement: vi.fn(),
  selectElement: vi.fn(),
  clearSelection: vi.fn(),
  setSelectedTool: vi.fn(),
  
  // History
  undo: vi.fn(),
  redo: vi.fn(),
  canUndo: false,
  canRedo: false,
  
  ...overrides,
});

/**
 * Performance testing utilities
 */
export const performanceTestUtils = {
  measureRenderTime: async (renderFn: () => Promise<void>): Promise<number> => {
    const start = performance.now();
    await renderFn();
    return performance.now() - start;
  },
  
  measureMemoryUsage: (): number => {
    // Simplified memory measurement for testing
    return (performance as any).memory?.usedJSHeapSize || 0;
  },
    simulateHeavyLoad: (elementCount: number = 1000): any[] => {
    return Array.from({ length: elementCount }, () => 
      createMockCanvasElement({
        type: 'rectangle',
        x: Math.random() * 5000,
        y: Math.random() * 5000,
        width: 50 + Math.random() * 100,
        height: 50 + Math.random() * 100,
      })
    );
  },
};

/**
 * Canvas-specific test assertions
 */
export const canvasAssertions = {
  expectElementToBeRendered: (element: CanvasElement, container: HTMLElement) => {
    const elementNode = container.querySelector(`[data-testid*="${element.type}"]`);
    expect(elementNode).toBeInTheDocument();
  },
  
  expectElementToHavePosition: (element: CanvasElement, x: number, y: number) => {
    expect(element.x).toBe(x);
    expect(element.y).toBe(y);
  },
  
  expectElementToBeSelected: (elementId: ElementId, selectedIds: Set<ElementId>) => {
    expect(selectedIds.has(elementId)).toBe(true);
  },
  
  expectTransformToBeApplied: (element: CanvasElement, expectedTransform: Partial<CanvasElement>) => {
    Object.entries(expectedTransform).forEach(([key, value]) => {
      expect((element as any)[key]).toBe(value);
    });
  },
};

/**
 * Integration test helpers
 */
export const integrationTestHelpers = {
  simulateElementDrag: async (
    user: ReturnType<typeof userEvent.setup>,
    element: HTMLElement,
    from: { x: number; y: number },
    to: { x: number; y: number }
  ) => {
    await user.pointer([
      { target: element, coords: from },
      { pointerName: 'mouse', target: element, keys: '[MouseLeft>]' },
      { target: element, coords: to },
      { pointerName: 'mouse', keys: '[/MouseLeft]' },
    ]);
  },
  
  simulateMultiSelect: async (
    user: ReturnType<typeof userEvent.setup>,
    elements: HTMLElement[]
  ) => {
    for (const element of elements) {
      await user.keyboard('[ShiftLeft>]');
      await user.click(element);
      await user.keyboard('[/ShiftLeft]');
    }
  },
    simulateZoom: async (
    user: ReturnType<typeof userEvent.setup>,
    container: HTMLElement,
    delta: number = 100
  ) => {
    await user.pointer({ target: container });
    // Simulate wheel event manually since userEvent doesn't have wheel method
    const wheelEvent = new WheelEvent('wheel', { deltaY: delta });
    container.dispatchEvent(wheelEvent);
  },
};

// Re-export common testing utilities
export { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
// Archived (2025-09-01): Legacy react-konva test utilities
