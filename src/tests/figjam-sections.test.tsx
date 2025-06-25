import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canvasStore } from '../features/canvas/stores/canvasStore.enhanced';
import { ElementId, SectionId } from '../features/canvas/types/enhanced.types';

describe('FigJam-Style Section Functionality', () => {
  let store: ReturnType<typeof canvasStore>;

  beforeEach(() => {
    store = canvasStore;
    store.getState().clearCanvas();
  });

  it('should allow an element to be dragged into a section', () => {
    const element = {
      id: ElementId('elem1'),
      type: 'circle' as const,
      x: 50,
      y: 50,
      radius: 25,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    store.getState().addElement(element);

    const sectionId = store.getState().createSection(100, 100, 200, 200, 'Test Section');

    // Drag the element into the section
    store.getState().updateElement(element.id, { x: 150, y: 150 });

    const updatedElement = store.getState().elements.get(element.id);
    const section = store.getState().sections.get(sectionId);

    expect(updatedElement?.sectionId).toBe(sectionId);
    expect(section?.childElementIds).toContain(element.id);
  });

  it('should allow an element to be dragged out of a section', () => {
    const element = {
      id: ElementId('elem1'),
      type: 'circle' as const,
      x: 150,
      y: 150,
      radius: 25,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    store.getState().addElement(element);

    const sectionId = store.getState().createSection(100, 100, 200, 200, 'Test Section');
    store.getState().updateElement(element.id, { sectionId });

    // Drag the element out of the section
    store.getState().updateElement(element.id, { x: 50, y: 50 });

    const updatedElement = store.getState().elements.get(element.id);
    const section = store.getState().sections.get(sectionId);

    expect(updatedElement?.sectionId).toBeUndefined();
    expect(section?.childElementIds).not.toContain(element.id);
  });

  it('should allow an element to be dragged from one section to another', () => {
    const element = {
      id: ElementId('elem1'),
      type: 'circle' as const,
      x: 150,
      y: 150,
      radius: 25,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    store.getState().addElement(element);

    const section1Id = store.getState().createSection(100, 100, 200, 200, 'Section 1');
    const section2Id = store.getState().createSection(400, 100, 200, 200, 'Section 2');
    store.getState().updateElement(element.id, { sectionId: section1Id });

    // Drag the element from section 1 to section 2
    store.getState().updateElement(element.id, { x: 450, y: 150 });

    const updatedElement = store.getState().elements.get(element.id);
    const section1 = store.getState().sections.get(section1Id);
    const section2 = store.getState().sections.get(section2Id);

    expect(updatedElement?.sectionId).toBe(section2Id);
    expect(section1?.childElementIds).not.toContain(element.id);
    expect(section2?.childElementIds).toContain(element.id);
  });
});
