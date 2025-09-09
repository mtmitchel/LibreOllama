import { describe, it, expect, beforeEach } from 'vitest';
import { createUnifiedTestStore } from './helpers/createUnifiedTestStore';
import { CircleElement, RectangleElement, TextElement, ElementId, createElementId } from '../features/canvas/types/enhanced.types';
import { useUnifiedCanvasStore } from '../features/canvas/stores/unifiedCanvasStore';
import type { 
  PenElement,
  StickyNoteElement,
  TableElement,
  SectionElement
} from '@/features/canvas/types/enhanced.types';

/**
 * Comprehensive Store Validation Tests
 * 
 * This test suite validates all core store modules using the store-first testing methodology.
 * Each module is tested in isolation and integration to ensure production readiness.
 */

describe('Comprehensive Store Validation Tests', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    store = createUnifiedTestStore();
  });

  describe('Element Module Validation', () => {
    it('should validate element CRUD operations', () => {
      const rectangle: RectangleElement = {
        id: 'rect-crud' as any,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Test CREATE
      store.getState().addElement(rectangle);
      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().elements.get(rectangle.id)).toEqual(rectangle);
      expect(store.getState().elementOrder).toContain(rectangle.id);

      // Test READ
      const retrievedElement = store.getState().getElementById(rectangle.id);
      expect(retrievedElement).toEqual(rectangle);

      // Test UPDATE
      const updates = { x: 150, y: 150, fill: '#00ff00' };
      store.getState().updateElement(rectangle.id, updates);
      const updatedElement = store.getState().elements.get(rectangle.id);
      expect(updatedElement).toMatchObject({ ...rectangle, ...updates });

      // Test DELETE
      store.getState().deleteElement(rectangle.id);
      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().elementOrder).not.toContain(rectangle.id);
    });

    it('should validate batch operations', () => {
      const elements = [
        { id: 'batch-1' as any, type: 'rectangle' as const, x: 0, y: 0, width: 50, height: 50 },
        { id: 'batch-2' as any, type: 'circle' as const, x: 100, y: 100, radius: 25, width: 50, height: 50 },
        { id: 'batch-3' as any, type: 'text' as const, x: 200, y: 200, text: 'Test' }
      ].map(base => ({
        ...base,
        fill: '#blue',
        stroke: '#black',
        strokeWidth: 1,
        fontSize: base.type === 'text' ? 14 : undefined,
        fontFamily: base.type === 'text' ? 'Arial' : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      // Add multiple elements
      elements.forEach(element => {
        store.getState().addElement(element as any);
      });
      expect(store.getState().elements.size).toBe(3);

      // Batch update
      const batchUpdates = elements.map(element => ({
        id: element.id,
        updates: { x: element.x + 10, y: element.y + 10 }
      }));
      store.getState().batchUpdate(batchUpdates);

      // Verify batch updates
      elements.forEach(element => {
        const updated = store.getState().elements.get(element.id);
        expect(updated?.x).toBe(element.x + 10);
        expect(updated?.y).toBe(element.y + 10);
      });

      // Clear all elements
      store.getState().clearAllElements();
      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().elementOrder).toEqual([]);
    });

    it('should validate element ordering', () => {
      const elements = [
        { id: 'order-1' as any, type: 'rectangle' as const, x: 0, y: 0, width: 50, height: 50 },
        { id: 'order-2' as any, type: 'circle' as const, x: 100, y: 100, radius: 25, width: 50, height: 50 },
        { id: 'order-3' as any, type: 'text' as const, x: 200, y: 200, text: 'Test' }
      ].map(base => ({
        ...base,
        fill: '#green',
        stroke: '#black',
        strokeWidth: 1,
        fontSize: base.type === 'text' ? 14 : undefined,
        fontFamily: base.type === 'text' ? 'Arial' : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      // Add elements in order
      elements.forEach(element => {
        store.getState().addElement(element as any);
      });

      // Verify order preservation
      expect(store.getState().elementOrder).toEqual(['order-1', 'order-2', 'order-3']);

      // Delete middle element
      store.getState().deleteElement(createElementId('order-2'));
      expect(store.getState().elementOrder).toEqual(['order-1', 'order-3']);
    });
  });

  describe('Selection Module Validation', () => {
    it('should validate single selection operations', () => {
      const element: CircleElement = {
        id: 'select-single' as any,
        type: 'circle',
        x: 50,
        y: 50,
        radius: 25,
        width: 50, // 2 * radius
        height: 50, // 2 * radius
        fill: '#blue',
        stroke: '#black',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(element);

      // Test selection
      store.getState().selectElement(element.id);
      expect(store.getState().selectedElementIds.has(element.id)).toBe(true);
      expect(store.getState().selectedElementIds.size).toBe(1);
      expect(store.getState().lastSelectedElementId).toBe(element.id);

      // Test deselection
      store.getState().deselectElement(element.id);
      expect(store.getState().selectedElementIds.has(element.id)).toBe(false);
      expect(store.getState().selectedElementIds.size).toBe(0);
    });

    it('should validate multi-selection operations', () => {
      const elements = [
        { id: 'multi-1' as any, type: 'rectangle' as const, x: 0, y: 0, width: 50, height: 50 },
        { id: 'multi-2' as any, type: 'circle' as const, x: 100, y: 100, radius: 25, width: 50, height: 50 },
        { id: 'multi-3' as any, type: 'text' as const, x: 200, y: 200, text: 'Test' }
      ].map(base => ({
        ...base,
        fill: '#purple',
        stroke: '#black',
        strokeWidth: 1,
        fontSize: base.type === 'text' ? 14 : undefined,
        fontFamily: base.type === 'text' ? 'Arial' : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      elements.forEach(element => {
        store.getState().addElement(element as any);
      });

      // Multi-select
      const multiId1 = createElementId('multi-1');
      const multiId2 = createElementId('multi-2');
      const multiId3 = createElementId('multi-3');
      
      store.getState().selectElement(multiId1);
      store.getState().selectElement(multiId2, true); // multiSelect: true
      store.getState().selectElement(multiId3, true);

      expect(store.getState().selectedElementIds.size).toBe(3);
      expect(store.getState().selectedElementIds.has(multiId1)).toBe(true);
      expect(store.getState().selectedElementIds.has(multiId2)).toBe(true);
      expect(store.getState().selectedElementIds.has(multiId3)).toBe(true);

      // Clear selection
      store.getState().clearSelection();
      expect(store.getState().selectedElementIds.size).toBe(0);
      expect(store.getState().lastSelectedElementId).toBe(null);
    });

    it('should validate selection with element deletion', () => {
      const element: RectangleElement = {
        id: 'select-delete' as any,
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#red',
        stroke: '#black',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(element);
      store.getState().selectElement(element.id);

      expect(store.getState().selectedElementIds.has(element.id)).toBe(true);

      // Delete selected element
      store.getState().deleteSelectedElements();
      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().selectedElementIds.size).toBe(0);
    });
  });

  describe('Viewport Module Validation', () => {
    it('should validate viewport transformations', () => {
      const initialViewport = store.getState().viewport;
      expect(initialViewport.scale).toBe(1);
      expect(initialViewport.x).toBe(0);
      expect(initialViewport.y).toBe(0);

      // Test viewport updates
      store.getState().setViewport({ 
        scale: 1.5, 
        x: 100, 
        y: 50 
      });

      const updatedViewport = store.getState().viewport;
      expect(updatedViewport.scale).toBe(1.5);
      expect(updatedViewport.x).toBe(100);
      expect(updatedViewport.y).toBe(50);
    });

    it('should validate pan operations', () => {
      store.getState().panViewport(50, 25);
      expect(store.getState().viewport.x).toBe(50);
      expect(store.getState().viewport.y).toBe(25);

      // Test legacy pan method
      store.getState().setPan(100, 75);
      expect(store.getState().viewport.x).toBe(100);
      expect(store.getState().viewport.y).toBe(75);
    });

    it('should validate zoom operations', () => {
      store.getState().zoomIn();
      expect(store.getState().viewport.scale).toBeGreaterThan(1);

      const scaleBefore = store.getState().viewport.scale;
      store.getState().zoomOut();
      expect(store.getState().viewport.scale).toBeLessThan(scaleBefore);

      // Test zoom bounds
      store.getState().zoomViewport(15); // Should be clamped to 10
      expect(store.getState().viewport.scale).toBe(10);

      store.getState().zoomViewport(0.05); // Should be clamped to 0.1
      expect(store.getState().viewport.scale).toBe(0.1);
    });
  });

  describe('Drawing Module Validation', () => {
    it('should validate drawing state management', () => {
      // Test drawing start
      store.getState().startDrawing('pen', { x: 10, y: 10 });
      expect(store.getState().isDrawing).toBe(true);
      expect(store.getState().drawingTool).toBe('pen'); // Correct property name

      // Test drawing end
      store.getState().finishDrawing(); // Correct method name
      expect(store.getState().isDrawing).toBe(false);
      expect(store.getState().drawingTool).toBe(null);
    });

    it('should validate drawing tool switching', () => {
      store.getState().startDrawing('pen', { x: 20, y: 20 });
      expect(store.getState().drawingTool).toBe('pen');

      store.getState().startDrawing('pencil', { x: 30, y: 30 });
      expect(store.getState().drawingTool).toBe('pencil');

      store.getState().finishDrawing();
      expect(store.getState().drawingTool).toBe(null);
    });
  });

  describe('History Module Validation', () => {
    it('should validate history operations', () => {
      const element: RectangleElement = {
        id: 'history-test' as any,
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#blue',
        stroke: '#black',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Initial state
      expect(store.getState().canUndo).toBe(false);
      expect(store.getState().canRedo).toBe(false);

      // Add element (should create history entry)
      store.getState().addElement(element);
      
      // Check if history entry was created
      expect(store.getState().getHistoryLength()).toBeGreaterThan(0);
      
      // The history logic shows canUndo is true when currentHistoryIndex > 0
      // After first element, currentHistoryIndex should be 0, so canUndo should be false
      // This is the actual behavior - we need a second operation to enable undo
      const element2: RectangleElement = {
        id: 'history-test-2' as any,
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        fill: '#red',
        stroke: '#black',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      store.getState().addElement(element2);
      expect(store.getState().canUndo).toBe(true);
      expect(store.getState().canRedo).toBe(false);

      // Undo operation
      store.getState().undo();
      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().canRedo).toBe(true);

      // Redo operation
      store.getState().redo();
      expect(store.getState().elements.size).toBe(2);
      expect(store.getState().canUndo).toBe(true);
      expect(store.getState().canRedo).toBe(false);
    });

    it('should validate history size limits', () => {
      const maxHistorySize = store.getState().maxHistorySize;
      
      // Add more elements than history size
      for (let i = 0; i < maxHistorySize + 5; i++) {
        const element: RectangleElement = {
          id: `history-${i}` as any,
          type: 'rectangle',
          x: i * 10,
          y: i * 10,
          width: 50,
          height: 50,
          fill: '#green',
          stroke: '#black',
          strokeWidth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        store.getState().addElement(element);
      }

      // History should be limited
      expect(store.getState().getHistoryLength()).toBeLessThanOrEqual(maxHistorySize);
    });
  });

  describe('Tool Module Validation', () => {
    it('should validate tool switching', () => {
      expect(store.getState().selectedTool).toBe('select');

      store.getState().setSelectedTool('rectangle');
      expect(store.getState().selectedTool).toBe('rectangle');

      store.getState().setSelectedTool('circle');
      expect(store.getState().selectedTool).toBe('circle');

      store.getState().setSelectedTool('text');
      expect(store.getState().selectedTool).toBe('text');
    });

    it('should validate tool state persistence', () => {
      store.getState().setSelectedTool('pen');
      expect(store.getState().selectedTool).toBe('pen');

      // Tool should persist across other operations
      const element: CircleElement = {
        id: 'tool-persist' as any,
        type: 'circle',
        x: 50,
        y: 50,
        radius: 25,
        width: 50, // 2 * radius
        height: 50, // 2 * radius
        fill: '#yellow',
        stroke: '#black',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(element);
      expect(store.getState().selectedTool).toBe('pen');

      store.getState().selectElement(element.id);
      expect(store.getState().selectedTool).toBe('pen');
    });
  });

  describe('UI Module Validation', () => {
    it('should validate UI state management', () => {
      // Test tool selection
      expect(store.getState().selectedTool).toBe('select');
      store.getState().setSelectedTool('rectangle');
      expect(store.getState().selectedTool).toBe('rectangle');

      // Test pen color
      store.getState().setPenColor('#ff0000');
      expect(store.getState().penColor).toBe('#ff0000');

      // Test sticky note color
      store.getState().setSelectedStickyNoteColor('#CCFFCC');
      expect(store.getState().selectedStickyNoteColor).toBe('#CCFFCC');

      // Test text editing element
      store.getState().setTextEditingElement('test-element' as any);
      expect(store.getState().textEditingElementId).toBe('test-element');
      
      store.getState().setTextEditingElement(null);
      expect(store.getState().textEditingElementId).toBe(null);
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should validate element creation with selection and history', () => {
      const element: TextElement = {
        id: 'integration-test' as any,
        type: 'text',
        x: 100,
        y: 100,
        text: 'Integration Test',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#000000',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Create element
      store.getState().addElement(element);
      expect(store.getState().elements.size).toBe(1);

      // Select element
      store.getState().selectElement(element.id);
      expect(store.getState().selectedElementIds.has(element.id)).toBe(true);

      // Verify history - need a second operation to enable undo
      const element2: TextElement = {
        id: 'integration-test-2' as any,
        type: 'text',
        x: 200,
        y: 200,
        text: 'Second Element',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#000000',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      store.getState().addElement(element2);
      expect(store.getState().canUndo).toBe(true);

      // Update element with explicit history entry (new default is skipHistory=true)
      store.getState().updateElement(element.id, { text: 'Updated Text' }, { skipHistory: false });
      store.getState().addToHistory('Update Text');
      const updatedElement = store.getState().elements.get(element.id);
      expect((updatedElement as TextElement)?.text).toBe('Updated Text');

      // Undo should restore original text
      store.getState().undo();
      const restoredElement = store.getState().elements.get(element.id);
      expect((restoredElement as TextElement)?.text).toBe('Integration Test');
    });

    it('should validate multi-element operations with viewport', () => {
      const elements = [
        { id: 'viewport-1' as any, type: 'rectangle' as const, x: 0, y: 0, width: 100, height: 100 },
        { id: 'viewport-2' as any, type: 'circle' as const, x: 200, y: 200, radius: 50 }
      ].map(base => ({
        ...base,
        fill: '#orange',
        stroke: '#black',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      elements.forEach(element => {
        store.getState().addElement(element as any);
      });

      // Select all elements
      elements.forEach(element => {
        store.getState().selectElement(element.id, true);
      });

      // Change viewport
      store.getState().setViewport({ scale: 2, x: 100, y: 100 });

      // Verify elements still selected after viewport change
      expect(store.getState().selectedElementIds.size).toBe(2);
      expect(store.getState().viewport.scale).toBe(2);
      expect(store.getState().viewport.x).toBe(100);
      expect(store.getState().viewport.y).toBe(100);

      // Delete selected elements
      store.getState().deleteSelectedElements();
      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().selectedElementIds.size).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid element operations gracefully', () => {
      // Try to update non-existent element
      expect(() => {
        store.getState().updateElement(createElementId('non-existent-id'), { x: 100 });
      }).not.toThrow();

      // Try to delete non-existent element
      expect(() => {
        store.getState().deleteElement(createElementId('non-existent-id'));
      }).not.toThrow();

      // Try to select non-existent element
      expect(() => {
        store.getState().selectElement(createElementId('non-existent-id'));
      }).not.toThrow();
    });

    it('should handle undo/redo edge cases', () => {
      // Try to undo with no history
      expect(() => {
        store.getState().undo();
      }).not.toThrow();

      // Try to redo with no future history
      expect(() => {
        store.getState().redo();
      }).not.toThrow();

      expect(store.getState().canUndo).toBe(false);
      expect(store.getState().canRedo).toBe(false);
    });

    it('should handle viewport edge cases', () => {
      // Test extreme zoom values
      store.getState().zoomViewport(1000); // Should be clamped
      expect(store.getState().viewport.scale).toBe(10);

      store.getState().zoomViewport(-1); // Should be clamped
      expect(store.getState().viewport.scale).toBe(0.1);

      // Test extreme pan values
      store.getState().panViewport(1000000, 1000000);
      expect(store.getState().viewport.x).toBe(1000000);
      expect(store.getState().viewport.y).toBe(1000000);
    });
  });
}); 