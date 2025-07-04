/**
 * Quick Test to Verify Current Toolbar Functionality
 * 
 * This test checks if the current toolbar functionality is actually broken
 * or if the audit findings need to be updated.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUnifiedCanvasStore } from '../features/canvas/stores/unifiedCanvasStore';
import { ElementId } from '../features/canvas/types/enhanced.types';

describe('Current Toolbar Functionality Test', () => {
  beforeEach(() => {
    // Clear state
    act(() => {
      const currentElements = Array.from(useUnifiedCanvasStore.getState().elements.keys());
      currentElements.forEach(id => {
        useUnifiedCanvasStore.getState().deleteElement(id as ElementId);
      });
      useUnifiedCanvasStore.getState().clearSelection();
    });
  });

  describe('Tool Selection', () => {
    it('should correctly update selected tool in store', () => {
      // Act: Select text tool
      act(() => {
        useUnifiedCanvasStore.getState().setSelectedTool('text');
      });

      // Assert: Tool should be selected
      expect(useUnifiedCanvasStore.getState().selectedTool).toBe('text');
    });

    it('should handle tool switching', () => {
      // Arrange: Start with select tool
      act(() => {
        useUnifiedCanvasStore.getState().setSelectedTool('select');
      });

      // Act: Switch to different tools
      const tools = ['text', 'sticky-note', 'section', 'pen', 'table'];
      
      tools.forEach(tool => {
        act(() => {
          useUnifiedCanvasStore.getState().setSelectedTool(tool);
        });
        expect(useUnifiedCanvasStore.getState().selectedTool).toBe(tool);
      });
    });
  });

  describe('Element Creation Capability', () => {
    it('should be able to create text elements directly via store', () => {
      // Arrange: Create a text element manually (simulating what event handler should do)
      const textElement = {
        id: ElementId('test-text-1'),
        type: 'text' as const,
        x: 100,
        y: 100,
        text: 'Test Text',
        fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        fill: '#1F2937',
        width: 120,
        height: 24,
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Act: Add element using store action
      act(() => {
        useUnifiedCanvasStore.getState().addElement(textElement);
      });

      // Assert: Element should be added
      expect(useUnifiedCanvasStore.getState().elements.size).toBe(1);
      expect(useUnifiedCanvasStore.getState().elements.get('test-text-1' as ElementId)).toEqual(textElement);
    });

    it('should be able to create sticky note elements', () => {
      // Arrange: Create sticky note element
      const stickyNote = {
        id: ElementId('test-sticky-1'),
        type: 'sticky-note' as const,
        x: 200,
        y: 200,
        width: 160,
        height: 120,
        text: 'Test Note',
        backgroundColor: '#fff2cc',
        fontSize: 14,
        fontFamily: 'Arial',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Act: Add element
      act(() => {
        useUnifiedCanvasStore.getState().addElement(stickyNote);
      });

      // Assert: Element should be added
      expect(useUnifiedCanvasStore.getState().elements.size).toBe(1);
      expect(useUnifiedCanvasStore.getState().elements.get('test-sticky-1' as ElementId)).toEqual(stickyNote);
    });
  });

  describe('Store Actions Availability', () => {
    it('should have all required store actions available', () => {
      const state = useUnifiedCanvasStore.getState();
      
      // Assert: All required actions exist
      expect(typeof state.setSelectedTool).toBe('function');
      expect(typeof state.addElement).toBe('function');
      expect(typeof state.updateElement).toBe('function');
      expect(typeof state.deleteElement).toBe('function');
      expect(typeof state.selectElement).toBe('function');
      expect(typeof state.clearSelection).toBe('function');
    });
  });

  describe('Color Update Functionality', () => {
    it('should be able to update element colors', () => {
      // Arrange: Create and add a sticky note
      const stickyNote = {
        id: ElementId('color-test-1'),
        type: 'sticky-note' as const,
        x: 100, y: 100, width: 160, height: 120,
        text: 'Color Test',
        backgroundColor: '#fff2cc',
        fontSize: 14, fontFamily: 'Arial',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      act(() => {
        useUnifiedCanvasStore.getState().addElement(stickyNote);
        useUnifiedCanvasStore.getState().selectElement('color-test-1' as ElementId);
      });

      // Act: Update color
      act(() => {
        useUnifiedCanvasStore.getState().updateElement('color-test-1' as ElementId, {
          backgroundColor: '#ffcccc'
        });
      });

      // Assert: Color should be updated
      const updatedElement = useUnifiedCanvasStore.getState().elements.get('color-test-1' as ElementId);
      expect((updatedElement as any)?.backgroundColor).toBe('#ffcccc');
    });
  });
});