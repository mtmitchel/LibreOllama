/**
 * Unified Store Architecture Validation Test
 * 
 * This test validates the core unified store architecture using the
 * store-first testing methodology recommended in the Canvas Testing Plan.
 * 
 * Key patterns used:
 * - Vanilla Zustand testing with real store instances
 * - Direct store API testing (no UI rendering)
 * - Proper branded type usage
 * - Type-safe operations without 'as any' casts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { 
  useUnifiedCanvasStore, 
  canvasSelectors 
} from '../features/canvas/stores/unifiedCanvasStore';
import { 
  CanvasElement, 
  ElementId, 
  SectionId,
  RectangleElement,
  TextElement
} from '../features/canvas/types/enhanced.types';

describe('Unified Store Architecture Validation', () => {
  let store: ReturnType<typeof useUnifiedCanvasStore>;

  beforeEach(() => {
    // Reset store state before each test
    // Using the unified store directly
    store = useUnifiedCanvasStore;
    
    // Clear any existing state using store actions
    act(() => {
      // Clear elements by getting all IDs and deleting them
      const currentElements = Array.from(store.getState().elements.keys());
      currentElements.forEach(id => {
        store.getState().deleteElement(id as ElementId);
      });
      
      // Clear selection
      store.getState().clearSelection();
      
      // Clear history
      store.getState().clearHistory();
    });
  });

  describe('Core Store Operations', () => {
    it('should add elements with proper type safety', () => {
      // Arrange: Create properly typed elements using branded types
      const rectElement: RectangleElement = {
        id: ElementId('test-rect-1'),
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 1,
        cornerRadius: 0
      };

      const textElement: TextElement = {
        id: ElementId('test-text-1'),
        type: 'text',
        x: 200,
        y: 200,
        text: 'Test Text',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#000000'
      };

      // Act: Add elements using store API
      act(() => {
        store.getState().addElement(rectElement);
        store.getState().addElement(textElement);
      });

      // Assert: Verify elements were added correctly
      const state = store.getState();
      expect(state.elements.size).toBe(2);
      expect(state.elements.get(ElementId('test-rect-1'))).toEqual(rectElement);
      expect(state.elements.get(ElementId('test-text-1'))).toEqual(textElement);
      expect(state.elementOrder).toEqual([ElementId('test-rect-1'), ElementId('test-text-1')]);
    });

    it('should update elements without type casting', () => {
      // Arrange: Add an element
      const initialElement: RectangleElement = {
        id: ElementId('test-update-1'),
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 1,
        cornerRadius: 0
      };

      act(() => {
        store.getState().addElement(initialElement);
      });

      // Act: Update element position
      act(() => {
        store.getState().updateElement(ElementId('test-update-1'), {
          x: 200,
          y: 250,
          fill: '#00ff00'
        });
      });

      // Assert: Verify update was applied correctly
      const updatedElement = store.getState().elements.get(ElementId('test-update-1'));
      expect(updatedElement).toBeDefined();
      expect(updatedElement?.x).toBe(200);
      expect(updatedElement?.y).toBe(250);
      expect(updatedElement?.fill).toBe('#00ff00');
      // Ensure other properties weren't affected
      expect(updatedElement?.width).toBe(50);
      expect(updatedElement?.height).toBe(50);
    });

    it('should handle selection operations correctly', () => {
      // Arrange: Add multiple elements
      const element1: RectangleElement = {
        id: ElementId('select-test-1'),
        type: 'rectangle',
        x: 100, y: 100, width: 50, height: 50,
        fill: '#ff0000', stroke: '#000000', strokeWidth: 1, cornerRadius: 0
      };

      const element2: RectangleElement = {
        id: ElementId('select-test-2'),
        type: 'rectangle', 
        x: 200, y: 200, width: 50, height: 50,
        fill: '#00ff00', stroke: '#000000', strokeWidth: 1, cornerRadius: 0
      };

      act(() => {
        store.getState().addElement(element1);
        store.getState().addElement(element2);
      });

      // Act & Assert: Test single selection
      act(() => {
        store.getState().selectElement(ElementId('select-test-1'));
      });

      expect(store.getState().selectedElementIds.has(ElementId('select-test-1'))).toBe(true);
      expect(store.getState().selectedElementIds.size).toBe(1);
      expect(store.getState().lastSelectedElementId).toBe(ElementId('select-test-1'));

      // Act & Assert: Test multi-selection
      act(() => {
        store.getState().selectElement(ElementId('select-test-2'), true);
      });

      expect(store.getState().selectedElementIds.has(ElementId('select-test-1'))).toBe(true);
      expect(store.getState().selectedElementIds.has(ElementId('select-test-2'))).toBe(true);
      expect(store.getState().selectedElementIds.size).toBe(2);

      // Act & Assert: Test clear selection
      act(() => {
        store.getState().clearSelection();
      });

      expect(store.getState().selectedElementIds.size).toBe(0);
      expect(store.getState().lastSelectedElementId).toBe(null);
    });
  });

  describe('Type-Safe Selectors', () => {
    it('should provide type-safe element access', () => {
      // Arrange: Add test element
      const testElement: TextElement = {
        id: ElementId('selector-test-1'),
        type: 'text',
        x: 100, y: 100,
        text: 'Selector Test',
        fontSize: 18,
        fontFamily: 'Arial',
        fill: '#000000'
      };

      act(() => {
        store.getState().addElement(testElement);
        store.getState().selectElement(ElementId('selector-test-1'));
      });

      // Act: Use selectors to access data
      const state = store.getState();
      const elements = canvasSelectors.elements(state);
      const selectedElements = canvasSelectors.selectedElements(state);
      const lastSelected = canvasSelectors.lastSelectedElement(state);

      // Assert: Verify selector results
      expect(elements.size).toBe(1);
      expect(selectedElements).toHaveLength(1);
      expect(selectedElements[0]).toEqual(testElement);
      expect(lastSelected).toEqual(testElement);
    });
  });

  describe('Unified Event Handler Integration', () => {
    it('should have store methods available for event handling', () => {
      // Act: Get core event-handling methods from store
      const state = store.getState();

      // Assert: Verify store has required event handling methods
      expect(typeof state.selectElement).toBe('function');
      expect(typeof state.updateElement).toBe('function');
      expect(typeof state.createElement).toBe('function');
      expect(typeof state.clearSelection).toBe('function');
      
      // Verify the store can handle element operations
      expect(state.elements).toBeDefined();
      expect(state.selectedElementIds).toBeDefined();
      expect(state.elementOrder).toBeDefined();
    });
  });

  describe('Viewport Operations', () => {
    it('should handle viewport updates correctly', () => {
      // Act: Update viewport
      act(() => {
        store.getState().setViewport({
          x: 100,
          y: 200,
          scale: 1.5
        });
      });

      // Assert: Verify viewport state
      const viewport = canvasSelectors.viewport(store.getState());
      expect(viewport.x).toBe(100);
      expect(viewport.y).toBe(200);
      expect(viewport.scale).toBe(1.5);

      // Act: Test pan operation
      act(() => {
        store.getState().panViewport(50, -30);
      });

      // Assert: Verify pan applied correctly
      const updatedViewport = canvasSelectors.viewport(store.getState());
      expect(updatedViewport.x).toBe(150); // 100 + 50
      expect(updatedViewport.y).toBe(170); // 200 + (-30)
    });
  });

  describe('History Operations', () => {
    it('should track history operations', () => {
      // Arrange: Add an element and make changes
      const testElement: RectangleElement = {
        id: ElementId('history-test-1'),
        type: 'rectangle',
        x: 100, y: 100, width: 50, height: 50,
        fill: '#ff0000', stroke: '#000000', strokeWidth: 1, cornerRadius: 0
      };

      act(() => {
        store.getState().addElement(testElement);
        store.getState().addToHistory('Add rectangle element');
      });

      // Act: Make a change and add to history
      act(() => {
        store.getState().updateElement(ElementId('history-test-1'), { x: 200 });
        store.getState().addToHistory('Move rectangle element');
      });

      // Assert: Verify history tracking
      const state = store.getState();
      expect(state.history.length).toBe(2);
      expect(canvasSelectors.canUndo(state)).toBe(true);
      expect(canvasSelectors.canRedo(state)).toBe(false);
    });
  });

  describe('Section Operations', () => {
    it('should create and manage sections', () => {
      // Act: Create a section
      let sectionId: SectionId;
      act(() => {
        sectionId = store.getState().createSection(50, 50, 200, 150);
      });

      // Assert: Verify section creation
      const state = store.getState();
      expect(state.sections.has(sectionId!)).toBe(true);
      expect(state.elements.has(sectionId!)).toBe(true);
      
      const section = state.sections.get(sectionId!);
      expect(section).toBeDefined();
      expect(section?.x).toBe(50);
      expect(section?.y).toBe(50);
      expect(section?.width).toBe(200);
      expect(section?.height).toBe(150);
    });
  });
});