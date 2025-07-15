/**
 * Sections, Containment, Drawing & Dynamic Connectors Test Suite
 * 
 * This test suite focuses on the most complex and critical aspects of the canvas:
 * - Section creation and element containment logic
 * - Dynamic drawing workflows with real-time feedback
 * - Connector auto-routing and dynamic path updates
 * - Complex interactions between sections, elements, and connectors
 * 
 * These features are the core differentiators of your canvas system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createUnifiedTestStore } from '../../../tests/helpers/createUnifiedTestStore';
import { ElementId, SectionId, CanvasElement } from '@/features/canvas/types/enhanced.types';

type TestStore = ReturnType<typeof createUnifiedTestStore>;

describe('Unified Canvas Store: Sections and Containment', () => {
  let store: TestStore;

  beforeEach(() => {
    store = createUnifiedTestStore();
  });

  describe('Section Creation & Management', () => {
    it('should create a section with specified properties', () => {
      const { getState } = store;
      
      const sectionId = getState().createSection(50, 50, 400, 300, 'Test Section');
      
      const section = getState().sections.get(sectionId);
      expect(section).toBeDefined();
      expect(section).toMatchObject({
        x: 50,
        y: 50,
        width: 400,
        height: 300,
        title: 'Test Section',
      });
    });

    it('should update section bounds and recalculate containment', () => {
      const { getState } = store;
      const el1Id: ElementId = 'el1' as ElementId;

      // Create section and element
      const sectionId = getState().createSection(0, 0, 100, 100);
      getState().addElement({ 
        id: el1Id, 
        x: 10, 
        y: 10, 
        width: 20, 
        height: 20, 
        type: 'rectangle', 
        fill: '#000000',
        stroke: '#000000',
        strokeWidth: 1,
        cornerRadius: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      } as CanvasElement);
      
      // Manually capture elements after creation since addElement doesn't do it automatically
      getState().captureElementsInSection(sectionId);

      expect(getState().sections.get(sectionId)?.childElementIds ?? []).toContain(el1Id);

      // Update section position
      getState().updateSection(sectionId, { x: 500, y: 500 });
      
      const section = getState().sections.get(sectionId);
      expect(section).toBeDefined();
      
      // After moving the section, the element should move with it
      const element = getState().elements.get(el1Id);
      expect(element).toBeDefined();
      expect(element!.x).toBe(510); // 10 + 500 offset
      expect(element!.y).toBe(510); // 10 + 500 offset
    });
  });

  describe('Element Containment Logic', () => {
    it('should correctly identify if an element is contained within a section', () => {
      const { getState } = store;

      const sectionId = getState().createSection(50, 50, 100, 100);

      // findSectionAtPoint returns the section ID directly, not a section object
      const containingSectionId = getState().findSectionAtPoint({ x: 75, y: 75 });
      expect(containingSectionId).toBe(sectionId);

      const notContainingSectionId = getState().findSectionAtPoint({ x: 300, y: 300 });
      expect(notContainingSectionId).toBeNull();
    });
  });
});