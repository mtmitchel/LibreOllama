import { describe, it, expect } from 'vitest';
import { createCanvasTestStore } from '../../../tests/helpers/createCanvasTestStore';

describe('Canvas Test Store Validation', () => {
  it('should create a store with all slice methods available', () => {
    const store = createCanvasTestStore();
    const state = store.getState();

    // Validate CanvasElementsStore methods
    expect(typeof state.importElements).toBe('function'); // FIXED: Was setElements
    expect(typeof state.addElement).toBe('function');
    expect(typeof state.updateElement).toBe('function');
    expect(typeof state.deleteElement).toBe('function');
    expect(typeof state.createElement).toBe('function');

    // Validate CanvasUIStore methods
    expect(typeof state.setActiveTool).toBe('function');
    expect(typeof state.setPenColor).toBe('function');    // Validate SelectionStore methods
    expect(typeof state.selectElement).toBe('function');
    expect(typeof state.deselectElement).toBe('function');
    expect(typeof state.clearSelection).toBe('function');    // Validate ViewportStore methods
    expect(typeof state.setZoom).toBe('function');
    expect(typeof state.setPan).toBe('function');
    expect(typeof state.zoomIn).toBe('function');
    expect(typeof state.zoomOut).toBe('function');

    // Validate SectionStore methods
    expect(typeof state.createSection).toBe('function');
    expect(typeof state.deleteSection).toBe('function');

    // Validate enhanced cross-slice methods
    expect(typeof state.findSectionAtPoint).toBe('function');
    expect(typeof state.handleElementDrop).toBe('function');
  });
});
