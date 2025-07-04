/**
 * Quick test to verify adapter functionality for toolbar
 * TODO: Update this test to use proper ElementId types
 */

import { describe, it, expect } from 'vitest';
import { useUnifiedCanvasStore } from '../features/canvas/stores/unifiedCanvasStore';
import { ElementId, GroupId } from '../features/canvas/types/enhanced.types';

describe.skip('Adapter Functionality', () => {
  it('should provide setSelectedTool function', () => {
    const canvasStore = useUnifiedCanvasStore;
    const state = canvasStore.getState();
    
    expect(typeof state.setSelectedTool).toBe('function');
    
    // Test calling it doesn't throw
    expect(() => {
      state.setSelectedTool('text');
    }).not.toThrow();
    
    // Verify tool was set
    const updatedState = canvasStore.getState();
    expect(updatedState.selectedTool).toBe('text');
  });

  it('should provide all toolbar functions', () => {
    const canvasStore = useUnifiedCanvasStore;
    const state = canvasStore.getState();
    
    expect(typeof state.setStickyNoteColor).toBe('function');
    expect(typeof state.groupElements).toBe('function'); 
    expect(typeof state.ungroupElements).toBe('function');
    expect(typeof state.isElementInGroup).toBe('function');
    
    // These should not throw
    expect(() => {
      state.setStickyNoteColor('#ffcccc');
      state.groupElements(['elem1' as ElementId, 'elem2' as ElementId]);
      state.ungroupElements('elem1' as GroupId);
      state.isElementInGroup('elem1' as ElementId);
    }).not.toThrow();
  });
});