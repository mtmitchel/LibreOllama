import { describe, it, expect } from 'vitest';
import { useUnifiedCanvasStore } from '../features/canvas/stores/unifiedCanvasStore';
import { nanoid } from 'nanoid';

describe('Modular Store Functionality', () => {
  it('should implement grouping functionality', () => {
    const store = useUnifiedCanvasStore.getState();
    
    // Create some test element IDs
    const elementId1 = nanoid();
    const elementId2 = nanoid();
    const elementIds = [elementId1, elementId2];
    
    // Test groupElements
    const groupId = store.groupElements(elementIds);
    expect(groupId).toBeTruthy();
    expect(typeof groupId).toBe('string');
    
    // Test isElementInGroup
    expect(store.isElementInGroup(elementId1)).toBe(true);
    expect(store.isElementInGroup(elementId2)).toBe(true);
    
    // Test ungroupElements
    store.ungroupElements(groupId);
    expect(store.isElementInGroup(elementId1)).toBe(false);
    expect(store.isElementInGroup(elementId2)).toBe(false);
  });
  
  it('should implement import/export functionality', () => {
    const store = useUnifiedCanvasStore.getState();
    
    // Test exportElements function exists
    expect(typeof store.exportElements).toBe('function');
    
    // Test importElements function exists
    expect(typeof store.importElements).toBe('function');
    
    // Create a test element
    const testElement = {
      id: nanoid(),
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      text: 'Test Element',
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#000000'
    };
    
    // Test importing elements
    store.importElements([testElement]);
    
    // Verify the element was imported
    const importedElement = store.getElementById(testElement.id);
    expect(importedElement).toBeTruthy();
    expect(importedElement?.text).toBe('Test Element');
  });
  
  it('should implement event handling functionality', () => {
    const store = useUnifiedCanvasStore.getState();
    
    // Test that all event handlers exist
    expect(typeof store.handleMouseDown).toBe('function');
    expect(typeof store.handleMouseMove).toBe('function');
    expect(typeof store.handleMouseUp).toBe('function');
    expect(typeof store.handleMouseLeave).toBe('function');
    expect(typeof store.handleClick).toBe('function');
    expect(typeof store.handleDoubleClick).toBe('function');
    expect(typeof store.handleContextMenu).toBe('function');
    expect(typeof store.handleDragStart).toBe('function');
    expect(typeof store.handleDragMove).toBe('function');
    expect(typeof store.handleDragEnd).toBe('function');
    
    // Test that the handlers can be called without errors
    const mockEvent = { target: { id: () => null } };
    const mockPos = { x: 100, y: 100 };
    
    expect(() => store.handleMouseDown(mockEvent, mockPos)).not.toThrow();
    expect(() => store.handleMouseMove(mockEvent, mockPos)).not.toThrow();
    expect(() => store.handleMouseUp(mockEvent, mockPos)).not.toThrow();
  });
  
  it('should maintain legacy compatibility methods', () => {
    // Test legacy tool setting methods exist
    expect(typeof useUnifiedCanvasStore.getState().setActiveTool).toBe('function');
    expect(typeof useUnifiedCanvasStore.getState().setSelectedTool).toBe('function');
    
    // Test legacy viewport methods exist
    expect(typeof useUnifiedCanvasStore.getState().setZoom).toBe('function');
    expect(typeof useUnifiedCanvasStore.getState().setPan).toBe('function');
    expect(typeof useUnifiedCanvasStore.getState().zoomIn).toBe('function');
    expect(typeof useUnifiedCanvasStore.getState().zoomOut).toBe('function');
    
    // Test that they actually work by calling them and then getting fresh state
    useUnifiedCanvasStore.getState().setActiveTool('pen');
    expect(useUnifiedCanvasStore.getState().selectedTool).toBe('pen');
    
    useUnifiedCanvasStore.getState().setZoom(2.0);
    expect(useUnifiedCanvasStore.getState().viewport.scale).toBe(2.0);
    
    useUnifiedCanvasStore.getState().setPan(50, 100);
    const finalState = useUnifiedCanvasStore.getState();
    expect(finalState.viewport.x).toBe(50);
    expect(finalState.viewport.y).toBe(100);
  });
});