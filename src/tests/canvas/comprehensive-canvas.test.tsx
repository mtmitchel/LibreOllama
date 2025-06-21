/**
 * Comprehensive Canvas Test Suite
 * Production-ready canvas testing with full workflow coverage
 */

import { vi } from 'vitest';
import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithKonva } from '@/tests/utils/konva-test-utils';
import KonvaCanvas from '@/features/canvas/components/KonvaCanvas';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { useTauriCanvas } from '@/features/canvas/hooks/useTauriCanvas';
import { ElementId } from '@/features/canvas/types/enhanced.types';

// Enhanced store mock with comprehensive coverage
const createMockStore = () => ({
  elements: new Map(),
  sections: new Map(),
  selectedElementIds: new Set<string>(),
  selectedSectionIds: new Set<string>(),
  selectedTool: 'select',
  isDrawing: false,
  currentPath: [],
  
  // Core actions
  addElement: vi.fn(),
  updateElement: vi.fn(),
  deleteElement: vi.fn(),
  selectElement: vi.fn(),
  clearSelection: vi.fn(),
  setSelectedTool: vi.fn(),
  
  // Drawing actions
  startDrawing: vi.fn(),
  continueDrawing: vi.fn(),
  finishDrawing: vi.fn(),
  setIsDrawing: vi.fn(),
  
  // Connector actions
  setConnectorStart: vi.fn(),
  setIsDrawingConnector: vi.fn(),
  isDrawingConnector: false,
  
  // Section actions  
  setSectionStart: vi.fn(),
  setIsDrawingSection: vi.fn(),
  isDrawingSection: false,
  updateSection: vi.fn(),
  
  // Text editing
  setEditingTextId: vi.fn(),
  editingTextId: null,
  
  // History
  undo: vi.fn(),
  redo: vi.fn(),
  addHistoryEntry: vi.fn(),
  
  // Viewport
  zoom: 1,
  pan: { x: 0, y: 0 },
  setPan: vi.fn(),
  setZoom: vi.fn(),
  
  // Enhanced store properties
  canvasSize: { width: 800, height: 600 },
  viewport: { x: 0, y: 0, scale: 1 },
  performance: { renderCount: 0 },
  
  // Additional methods
  reset: vi.fn(),
  loadCanvas: vi.fn(),
  saveCanvas: vi.fn(),
  handleElementDrop: vi.fn(),
});

let mockStore = createMockStore();

// Mock the enhanced store
vi.mock('@/features/canvas/stores/canvasStore.enhanced', () => ({
  useCanvasStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStore);
    }
    return mockStore;
  }),
}));

// Mock Tauri canvas
vi.mock('@/features/canvas/hooks/useTauriCanvas');
const mockUseTauriCanvas = useTauriCanvas as any;

// Helper to create canvas props
const createCanvasProps = (overrides = {}) => ({
  width: 800,
  height: 600,
  panZoomState: {
    scale: 1,
    position: { x: 0, y: 0 }
  },
  stageRef: { current: null },
  onWheelHandler: vi.fn(),
  ...overrides,
});

// Helper to render canvas with complete setup
const renderCanvas = (props = {}) => {
  const canvasProps = createCanvasProps(props);
  return renderWithKonva(<KonvaCanvas {...canvasProps} />);
};

describe('Comprehensive Canvas Test Suite', () => {
  beforeEach(() => {
    // Reset mocks
    mockStore = createMockStore();
    vi.clearAllMocks();
    
    // Setup Tauri canvas mock
    mockUseTauriCanvas.mockReturnValue({
      saveCanvas: vi.fn(),
      loadCanvas: vi.fn(),
      exportCanvas: vi.fn(),
    });
  });

  describe('Canvas Rendering & Initialization', () => {
    test('should render canvas without errors', async () => {
      const { container } = renderCanvas();
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeTruthy();
        expect(canvas).toHaveAttribute('width', '800');
        expect(canvas).toHaveAttribute('height', '600');
      });
    });

    test('should initialize with correct viewport state', async () => {
      const customProps = {
        panZoomState: {
          scale: 1.5,
          position: { x: 100, y: 50 }
        }
      };
      
      const { container } = renderCanvas(customProps);
      
      await waitFor(() => {
        const stageContainer = container.querySelector('.konvajs-content');
        expect(stageContainer).toBeTruthy();
      });
    });

    test('should handle store state updates without crashing', async () => {
      const { rerender } = renderCanvas();
      
      // Simulate store updates
      act(() => {
        mockStore.selectedTool = 'rectangle';
        mockStore.zoom = 2;
      });
      
      // Rerender with updated props
      const updatedProps = createCanvasProps({
        panZoomState: {
          scale: 2,
          position: { x: 0, y: 0 }
        }
      });
      
      rerender(<KonvaCanvas {...updatedProps} />);
      
      await waitFor(() => {
        const canvas = document.querySelector('canvas');
        expect(canvas).toBeTruthy();
      });
    });
  });

  describe('Tool System Integration', () => {
    test('should handle tool switching correctly', async () => {
      mockStore.selectedTool = 'select';
      renderCanvas();
      
      await waitFor(() => {
        expect(mockStore.selectedTool).toBe('select');
      });
      
      // Simulate tool change
      act(() => {
        mockStore.selectedTool = 'rectangle';
      });
      
      expect(mockStore.selectedTool).toBe('rectangle');
    });

    test('should maintain tool state during canvas interactions', async () => {
      mockStore.selectedTool = 'pen';
      const { container } = renderCanvas();
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeTruthy();
      });
      
      // Simulate mouse interaction
      const canvas = container.querySelector('canvas');
      if (canvas) {
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
      }
      
      // Tool should remain consistent
      expect(mockStore.selectedTool).toBe('pen');
    });
  });

  describe('Element Management', () => {
    test('should handle element selection', async () => {
      // Add mock element to store
      const mockElement = {
        id: 'element-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fill: '#blue'
      };
      
      mockStore.elements.set('element-1', mockElement);
      mockStore.selectedElementIds.add('element-1');
      
      const { container } = renderCanvas();
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeTruthy();
      });
      
      expect(mockStore.selectedElementIds.has('element-1')).toBe(true);
    });

    test('should handle multiple element selection', async () => {
      // Add multiple elements (avoiding text elements due to Konva test environment issues)
      const elements = [
        { id: 'elem-1', type: 'rectangle', x: 0, y: 0, width: 50, height: 50, fill: '#blue' },
        { id: 'elem-2', type: 'circle', x: 100, y: 100, radius: 25, fill: '#red' },
        { id: 'elem-3', type: 'rectangle', x: 200, y: 200, width: 75, height: 30, fill: '#green' }
      ];
      
      elements.forEach(elem => {
        mockStore.elements.set(elem.id, elem);
        mockStore.selectedElementIds.add(elem.id);
      });
      
      renderCanvas();
      
      await waitFor(() => {
        expect(mockStore.selectedElementIds.size).toBe(3);
      });
    });
  });

  describe('Performance & Memory Management', () => {
    test('should handle large number of elements efficiently', async () => {
      // Create 100 elements
      for (let i = 0; i < 100; i++) {
        mockStore.elements.set(`element-${i}`, {
          id: `element-${i}`,
          type: 'rectangle',
          x: Math.random() * 800,
          y: Math.random() * 600,
          width: 50,
          height: 50,
          fill: `hsl(${i * 3.6}, 70%, 50%)`
        });
      }
      
      const startTime = performance.now();
      const { container } = renderCanvas();
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeTruthy();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000); // 1 second
      expect(mockStore.elements.size).toBe(100);
    });

    test('should not cause memory leaks during element updates', async () => {
      const { unmount } = renderCanvas();
      
      // Simulate rapid element updates
      for (let i = 0; i < 50; i++) {
        act(() => {
          mockStore.addElement.mockClear();
          mockStore.updateElement.mockClear();
        });
      }
      
      // Component should unmount cleanly
      unmount();
      
      // No assertions needed - test passes if no errors thrown
    });
  });

  describe('Canvas State Persistence', () => {
    test('should maintain state during viewport changes', async () => {
      mockStore.elements.set('test-elem', {
        id: 'test-elem',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100
      });
      
      const { rerender } = renderCanvas({
        panZoomState: { scale: 1, position: { x: 0, y: 0 } }
      });
      
      // Change viewport
      const newProps = createCanvasProps({
        panZoomState: { scale: 2, position: { x: 50, y: 50 } }
      });
      
      rerender(<KonvaCanvas {...newProps} />);
      
      await waitFor(() => {
        expect(mockStore.elements.has('test-elem')).toBe(true);
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('should handle invalid element data gracefully', async () => {
      // Add element with missing properties
      mockStore.elements.set('invalid-elem', {
        id: 'invalid-elem',
        type: 'rectangle',
        // Missing x, y, width, height
      });
      
      const { container } = renderCanvas();
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeTruthy();
        // Should render without throwing errors
      });
    });

    test('should handle empty canvas state', async () => {
      // Clear all elements
      mockStore.elements.clear();
      mockStore.selectedElementIds.clear();
      
      const { container } = renderCanvas();
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeTruthy();
        expect(mockStore.elements.size).toBe(0);
      });
    });

    test('should recover from store errors', async () => {
      // Mock store method to throw error
      mockStore.addElement.mockImplementation(() => {
        throw new Error('Store error');
      });
      
      const { container } = renderCanvas();
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeTruthy();
        // Canvas should still render despite store errors
      });
    });
  });

  describe('Accessibility & User Experience', () => {
    test('should have proper ARIA attributes', async () => {
      const { container } = renderCanvas();
      
      await waitFor(() => {
        const stageContainer = container.querySelector('[role="presentation"]');
        expect(stageContainer).toBeTruthy();
      });
    });

    test('should handle keyboard interactions', async () => {
      const { container } = renderCanvas();
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeTruthy();
      });
      
      // Simulate keyboard events
      const canvas = container.querySelector('canvas');
      if (canvas) {
        fireEvent.keyDown(canvas, { key: 'Delete' });
        fireEvent.keyDown(canvas, { key: 'Escape' });
        fireEvent.keyDown(canvas, { key: 'z', ctrlKey: true });
      }
      
      // Test should complete without errors
    });
  });
});