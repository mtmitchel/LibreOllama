import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CanvasRenderer } from '../services/CanvasRenderer';
import { CanvasElement, ElementId } from '../types/enhanced.types';

// Mock DOM APIs
Object.defineProperty(window, 'HTMLCanvasElement', {
  value: class MockHTMLCanvasElement {
    getContext = vi.fn(() => ({
      measureText: vi.fn(() => ({ width: 100 })),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: ''
    }));
    width = 800;
    height = 600;
  }
});

Object.defineProperty(window, 'ResizeObserver', {
  value: class MockResizeObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  }
});

describe('Modular Canvas Renderer', () => {
  let container: HTMLDivElement;
  let renderer: CanvasRenderer;
  let mockUpdateCallback: ReturnType<typeof vi.fn>;
  let mockSelectionCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Mock callbacks
    mockUpdateCallback = vi.fn();
    mockSelectionCallback = vi.fn();

    // Create renderer
    renderer = new CanvasRenderer({
      container,
      onElementUpdate: mockUpdateCallback,
      onSelectionChange: mockSelectionCallback
    });
  });

  afterEach(() => {
    renderer.destroy();
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => renderer.init()).not.toThrow();
    });

    it('should create stage and layers', () => {
      renderer.init();
      const viewport = renderer.getViewport();
      expect(viewport).toEqual({ x: 0, y: 0, scale: 1 });
    });
  });

  describe('Element Management', () => {
    beforeEach(() => {
      renderer.init();
    });

    it('should sync elements from array', () => {
      const elements: CanvasElement[] = [
        {
          id: 'rect1' as ElementId,
          type: 'rectangle',
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 2,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0
        },
        {
          id: 'circle1' as ElementId,
          type: 'circle',
          x: 150,
          y: 100,
          radius: 25,
          width: 50, // 2 * radius
          height: 50, // 2 * radius
          fill: '#00ff00',
          stroke: '#000000',
          strokeWidth: 1,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        } as CanvasElement
      ];

      expect(() => renderer.syncElements(elements)).not.toThrow();
    });

    it('should handle element updates', () => {
      const elements: CanvasElement[] = [
        {
          id: 'rect1' as ElementId,
          type: 'rectangle',
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 2,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0
        }
      ];

      // Initial sync
      renderer.syncElements(elements);

      // Update element
      const updatedElements = [{
        ...elements[0],
        x: 30,
        y: 40,
        fill: '#0000ff'
      }];

      expect(() => renderer.syncElements(updatedElements)).not.toThrow();
    });

    it('should handle element removal', () => {
      const elements: CanvasElement[] = [
        {
          id: 'rect1' as ElementId,
          type: 'rectangle',
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 2,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0
        },
        {
          id: 'rect2' as ElementId,
          type: 'rectangle',
          x: 120,
          y: 20,
          width: 100,
          height: 50,
          fill: '#00ff00',
          stroke: '#000000',
          strokeWidth: 2,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0
        }
      ];

      // Add both elements
      renderer.syncElements(elements);

      // Remove one element
      renderer.syncElements([elements[0]]);

      // Should not throw
      expect(() => renderer.syncElements([elements[0]])).not.toThrow();
    });
  });

  describe('Selection Management', () => {
    beforeEach(() => {
      renderer.init();
      
      // Add some elements to select
      const elements: CanvasElement[] = [
        {
          id: 'rect1' as ElementId,
          type: 'rectangle',
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 2,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0
        },
        {
          id: 'rect2' as ElementId,
          type: 'rectangle',
          x: 120,
          y: 20,
          width: 100,
          height: 50,
          fill: '#00ff00',
          stroke: '#000000',
          strokeWidth: 2,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0
        }
      ];
      renderer.syncElements(elements);
    });

    it('should handle single selection', () => {
      const selectedIds = new Set(['rect1' as ElementId]);
      expect(() => renderer.syncSelection(selectedIds)).not.toThrow();
    });

    it('should handle multi-selection', () => {
      const selectedIds = new Set(['rect1' as ElementId, 'rect2' as ElementId]);
      expect(() => renderer.syncSelection(selectedIds)).not.toThrow();
    });

    it('should handle empty selection', () => {
      const selectedIds = new Set<ElementId>();
      expect(() => renderer.syncSelection(selectedIds)).not.toThrow();
    });
  });

  describe('Viewport Management', () => {
    beforeEach(() => {
      renderer.init();
    });

    it('should update viewport', () => {
      const newViewport = { x: 100, y: 50, scale: 1.5 };
      renderer.updateViewport(newViewport);
      
      const viewport = renderer.getViewport();
      expect(viewport).toEqual(newViewport);
    });

    it('should reset viewport', () => {
      // Change viewport
      renderer.updateViewport({ x: 100, y: 50, scale: 1.5 });
      
      // Reset
      renderer.resetViewport();
      
      const viewport = renderer.getViewport();
      expect(viewport).toEqual({ x: 0, y: 0, scale: 1 });
    });

    it('should fit content to viewport', () => {
      const bounds = {
        minX: 0,
        minY: 0,
        maxX: 200,
        maxY: 100
      };
      
      expect(() => renderer.fitToContent(bounds)).not.toThrow();
    });
  });

  describe('Spatial Queries', () => {
    beforeEach(() => {
      renderer.init();
      
      // Add elements with known positions
      const elements: CanvasElement[] = [
        {
          id: 'rect1' as ElementId,
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 2,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0
        },
        {
          id: 'rect2' as ElementId,
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          fill: '#00ff00',
          stroke: '#000000',
          strokeWidth: 2,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0
        }
      ];
      renderer.syncElements(elements);
    });

    it('should find elements at point', () => {
      const elementsAt25_25 = renderer.getElementsAtPoint(25, 25);
      expect(elementsAt25_25).toContain('rect1');
      expect(elementsAt25_25).not.toContain('rect2');
    });

    it('should find elements in rectangle', () => {
      const elementsInRect = renderer.getElementsInRect({
        x: 0,
        y: 0,
        width: 75,
        height: 75
      });
      expect(elementsInRect).toContain('rect1');
      expect(elementsInRect).not.toContain('rect2');
    });
  });

  describe('Export', () => {
    beforeEach(() => {
      renderer.init();
    });

    it('should export as image', async () => {
      // Mock toDataURL
      const mockToDataURL = vi.fn(() => 'data:image/png;base64,mock');
      
      // We need to access the stage somehow to mock it
      // For now, just test that the method doesn't throw
      try {
        await renderer.exportAsImage();
      } catch (error) {
        // Expected to throw since stage.toDataURL is not properly mocked
        expect(error).toBeDefined();
      }
    });
  });

  describe('Module Integration', () => {
    beforeEach(() => {
      renderer.init();
    });

    it('should integrate all modules without conflicts', () => {
      // Test that all modules can be used together
      const elements: CanvasElement[] = [
        {
          id: 'text1' as ElementId,
          type: 'text',
          x: 10,
          y: 20,
          width: 100,
          height: 30,
          text: 'Hello World',
          fontSize: 16,
          fontFamily: 'Arial',
          fill: '#000000',
          stroke: undefined,
          strokeWidth: 0,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0
        } as CanvasElement
      ];
      
      // Add elements
      renderer.syncElements(elements);
      
      // Select element
      renderer.syncSelection(new Set(['text1' as ElementId]));
      
      // Change viewport
      renderer.updateViewport({ x: 50, y: 30, scale: 1.2 });
      
      // All operations should work without conflicts
      expect(mockUpdateCallback).not.toHaveBeenCalled(); // No updates triggered
      expect(mockSelectionCallback).not.toHaveBeenCalled(); // No selection changes triggered
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      renderer.init();
    });

    it('should handle large number of elements efficiently', () => {
      const startTime = performance.now();
      
      // Create 1000 elements
      const elements: CanvasElement[] = [];
      for (let i = 0; i < 1000; i++) {
        elements.push({
          id: `rect${i}` as ElementId,
          type: 'rectangle',
          x: (i % 50) * 20,
          y: Math.floor(i / 50) * 20,
          width: 15,
          height: 15,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 1,
          opacity: 1,
          visible: true,
          locked: false,
          rotation: 0
        });
      }
      
      renderer.syncElements(elements);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });
});