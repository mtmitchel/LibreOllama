/**
 * Quick test to verify adapter functionality for toolbar
 */

import { describe, it, expect } from 'vitest';
import { canvasStore } from '../stores';

describe('Adapter Functionality', () => {
  it('should provide setSelectedTool function', () => {
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
    const state = canvasStore.getState();
    
    expect(typeof state.setStickyNoteColor).toBe('function');
    expect(typeof state.groupElements).toBe('function'); 
    expect(typeof state.ungroupElements).toBe('function');
    expect(typeof state.isElementInGroup).toBe('function');
    
    // These should not throw
    expect(() => {
      state.setStickyNoteColor('#ffcccc');
      state.groupElements(['elem1', 'elem2']);
      state.ungroupElements('elem1');
      state.isElementInGroup('elem1');
    }).not.toThrow();
  });
});