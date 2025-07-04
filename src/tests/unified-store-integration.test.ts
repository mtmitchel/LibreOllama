/**
 * Unified Store Integration Test
 * 
 * Tests the integration between the unified store and the adapter,
 * focusing on core functionality that should work immediately.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUnifiedCanvasStore } from '../features/canvas/stores/unifiedCanvasStore';
import { ElementId, GroupId } from '../features/canvas/types/enhanced.types';

describe('Unified Store Integration', () => {
  beforeEach(() => {
    // This will clear any existing state through the unified store
    const state = useUnifiedCanvasStore.getState();
    const currentElements = Array.from(state.elements.keys());
    
    act(() => {
      currentElements.forEach(id => {
        state.deleteElement(id as ElementId);
      });
      state.clearSelection();
    });
  });

  describe('Core Store Integration', () => {
    it('should provide working store interface through unified store', () => {
      const store = useUnifiedCanvasStore.getState();
      
      // Test basic store structure
      expect(store).toBeDefined();
      expect(typeof store.addElement).toBe('function');
      expect(typeof store.updateElement).toBe('function');
      expect(typeof store.deleteElement).toBe('function');
      expect(typeof store.setSelectedTool).toBe('function');
    });

    it('should handle tool selection through unified store', () => {
      // Act: Change tool
      act(() => {
        useUnifiedCanvasStore.getState().setSelectedTool('text');
      });
      
      // Assert: Tool should be updated
      const store = useUnifiedCanvasStore.getState();
      expect(store.selectedTool).toBe('text');
    });

    it('should handle element operations through unified store', () => {
      
      const testElement = {
        id: ElementId('adapter-test-1'),
        type: 'rectangle' as const,
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 1,
        cornerRadius: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Act: Add element through unified store
      act(() => {
        useUnifiedCanvasStore.getState().addElement(testElement);
      });

      // Assert: Element should be accessible
      const store = useUnifiedCanvasStore.getState();
      expect(store.elements.size).toBe(1);
      expect(store.elements.get(ElementId('adapter-test-1'))).toBeDefined();
    });

    it('should provide legacy toolbar functions', () => {
      const store = useUnifiedCanvasStore.getState();
      
      // Test legacy functions exist (even if they're no-ops)
      expect(typeof store.setStickyNoteColor).toBe('function');
      expect(typeof store.groupElements).toBe('function');
      expect(typeof store.ungroupElements).toBe('function');
      expect(typeof store.isElementInGroup).toBe('function');
      
      // These should not throw errors when called
      expect(() => {
        store.setStickyNoteColor('#ffcccc');
        const groupId = store.groupElements(['elem1' as ElementId, 'elem2' as ElementId]);
        store.ungroupElements('elem1' as GroupId);
        const inGroup = store.isElementInGroup('elem1' as ElementId);
      }).not.toThrow();
    });
  });

  describe('Store State Access', () => {
    it('should provide consistent state access patterns', () => {
      const store = useUnifiedCanvasStore.getState();
      
      // Test state properties exist
      expect(store.elements).toBeInstanceOf(Map);
      expect(store.selectedElementIds).toBeInstanceOf(Set);
      expect(Array.isArray(store.elementOrder)).toBe(true);
      expect(typeof store.selectedTool).toBe('string');
      expect(typeof store.canUndo).toBe('boolean');
      expect(typeof store.canRedo).toBe('boolean');
    });

    it('should maintain state consistency during operations', () => {
      
      const testElement = {
        id: ElementId('consistency-test-1'),
        type: 'circle' as const,
        x: 150,
        y: 150,
        radius: 25,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Add element and select it
      act(() => {
        useUnifiedCanvasStore.getState().addElement(testElement);
        useUnifiedCanvasStore.getState().selectElement(ElementId('consistency-test-1'));
      });

      // State should be consistent
      const store = useUnifiedCanvasStore.getState();
      expect(store.elements.size).toBe(1);
      expect(store.selectedElementIds.size).toBe(1);
      expect(store.selectedElementIds.has(ElementId('consistency-test-1'))).toBe(true);
      expect(store.lastSelectedElementId).toBe(ElementId('consistency-test-1'));
    });
  });
});