/**
 * COMPREHENSIVE SECTION FUNCTIONALITY TEST
 * 
 * This test systematically verifies all section behaviors to identify exactly
 * what's broken and what needs to be fixed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
import { ElementId, SectionId } from '../types/enhanced.types';

// Mock Konva
vi.mock('konva', () => ({
  default: {
    Stage: vi.fn(),
    Layer: vi.fn(),
    Group: vi.fn(),
    Rect: vi.fn(),
    Circle: vi.fn(),
    Text: vi.fn(),
  }
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve()),
}));

describe('COMPREHENSIVE SECTION FUNCTIONALITY TEST', () => {
  let store: typeof useUnifiedCanvasStore;

  beforeEach(() => {
    store = useUnifiedCanvasStore;
    store.getState().clearCanvas();
  });

  describe('1. SECTION CREATION', () => {
    it('1.1 should create empty section with correct properties', () => {
      const sectionId = store.getState().createSection(100, 100, 300, 200, 'Test Section');
      
      const section = store.getState().sections.get(sectionId);
      expect(section).toBeDefined();
      expect(section?.x).toBe(100);
      expect(section?.y).toBe(100);
      expect(section?.width).toBe(300);
      expect(section?.height).toBe(200);
      expect(section?.title).toBe('Test Section');
      expect(section?.childElementIds).toEqual([]);
    });

    it('1.2 should create section with default dimensions when not provided', () => {
      const sectionId = store.getState().createSection(50, 50);
      
      const section = store.getState().sections.get(sectionId);
      expect(section?.width).toBe(400); // default width
      expect(section?.height).toBe(300); // default height
      expect(section?.title).toBe('New Section'); // default title
    });
  });

  describe('2. ELEMENT AUTO-CAPTURE ON SECTION CREATION', () => {
    it('2.1 should auto-capture elements when section encompasses them', () => {
      // Create elements first
      const circle = {
        id: ElementId('circle1'),
        type: 'circle' as const,
        x: 150,
        y: 150,
        radius: 25,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const rectangle = {
        id: ElementId('rect1'),
        type: 'rectangle' as const,
        x: 200,
        y: 200,
        width: 100,
        height: 80,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(circle);
      store.getState().addElement(rectangle);

      // Create section that encompasses both elements
      const sectionId = store.getState().createSection(100, 100, 250, 250);
      
      const section = store.getState().sections.get(sectionId);
      const updatedCircle = store.getState().elements.get('circle1');
      const updatedRect = store.getState().elements.get('rect1');

      console.log('🧪 TEST 2.1 - Section created:', section);
      console.log('🧪 TEST 2.1 - Updated circle:', updatedCircle);
      console.log('🧪 TEST 2.1 - Updated rectangle:', updatedRect);

      // Both elements should be captured
      expect(section?.childElementIds).toContain(ElementId('circle1'));
      expect(section?.childElementIds).toContain(ElementId('rect1'));
      
      // Elements should reference the section
      expect(updatedCircle?.sectionId).toBe(sectionId);
      expect(updatedRect?.sectionId).toBe(sectionId);

      // CRITICAL: Elements should NOT have jumped coordinates
      expect(updatedCircle?.x).toBe(150);
      expect(updatedCircle?.y).toBe(150);
      expect(updatedRect?.x).toBe(200);
      expect(updatedRect?.y).toBe(200);
    });

    it('2.2 should NOT capture elements outside section bounds', () => {
      // Create element outside the section area
      const outsideElement = {
        id: ElementId('outside1'),
        type: 'circle' as const,
        x: 500, // Far outside
        y: 500,
        radius: 25,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(outsideElement);

      // Create section that doesn't encompass the element
      const sectionId = store.getState().createSection(100, 100, 200, 200);
      
      const section = store.getState().sections.get(sectionId);
      const element = store.getState().elements.get('outside1');

      expect(section?.childElementIds).toHaveLength(0);
      expect(element?.sectionId).toBeUndefined();
    });

    it('2.3 should capture only elements whose center is inside section', () => {
      // Create element that partially overlaps section
      const partialElement = {
        id: ElementId('partial1'),
        type: 'rectangle' as const,
        x: 180, // Center at 230, which is outside section bounds
        y: 180,
        width: 100,
        height: 100,
        fill: '#0000ff',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(partialElement);

      // Create section (100,100,200,200) - so bounds are 100-300 x 100-300
      // Element center is at (230, 230) which is inside
      const sectionId = store.getState().createSection(100, 100, 200, 200);
      
      const section = store.getState().sections.get(sectionId);
      
      console.log('🧪 TEST 2.3 - Element center:', { x: 180 + 50, y: 180 + 50 });
      console.log('🧪 TEST 2.3 - Section bounds:', { x: 100, y: 100, width: 200, height: 200 });
      console.log('🧪 TEST 2.3 - Captured elements:', section?.childElementIds);

      // Element center (230, 230) should be inside section (100-300, 100-300)
      expect(section?.childElementIds).toContain(ElementId('partial1'));
    });
  });

  describe('3. SECTION MOVEMENT (GROUP BEHAVIOR)', () => {
    it('3.1 should move all child elements when section moves', () => {
      // Create section with child elements
      const element1 = {
        id: ElementId('elem1'),
        type: 'circle' as const,
        x: 150,
        y: 150,
        radius: 25,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const element2 = {
        id: ElementId('elem2'),
        type: 'rectangle' as const,
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(element1);
      store.getState().addElement(element2);

      const sectionId = store.getState().createSection(100, 100, 200, 200);

      // Get initial positions
      const initialCircle = store.getState().elements.get('elem1');
      const initialRect = store.getState().elements.get('elem2');
      const initialSection = store.getState().sections.get(sectionId);

      console.log('🧪 TEST 3.1 - Initial positions:', {
        section: { x: initialSection?.x, y: initialSection?.y },
        circle: { x: initialCircle?.x, y: initialCircle?.y },
        rect: { x: initialRect?.x, y: initialRect?.y }
      });

      // Move section by 50, 50
      store.getState().updateSection(sectionId, { x: 150, y: 150 });

      // Get updated positions
      const updatedCircle = store.getState().elements.get('elem1');
      const updatedRect = store.getState().elements.get('elem2');
      const updatedSection = store.getState().sections.get(sectionId);

      console.log('🧪 TEST 3.1 - Updated positions:', {
        section: { x: updatedSection?.x, y: updatedSection?.y },
        circle: { x: updatedCircle?.x, y: updatedCircle?.y },
        rect: { x: updatedRect?.x, y: updatedRect?.y }
      });

      // Section should have moved
      expect(updatedSection?.x).toBe(150);
      expect(updatedSection?.y).toBe(150);

      // ALL child elements should have moved by the same delta (50, 50)
      expect(updatedCircle?.x).toBe(200); // 150 + 50
      expect(updatedCircle?.y).toBe(200); // 150 + 50
      expect(updatedRect?.x).toBe(250);   // 200 + 50
      expect(updatedRect?.y).toBe(250);   // 200 + 50
    });

    it('3.2 should preserve relative positions between child elements', () => {
      // Create elements with specific relative positioning
      const elem1 = {
        id: ElementId('rel1'),
        type: 'circle' as const,
        x: 120,
        y: 120,
        radius: 10,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const elem2 = {
        id: ElementId('rel2'),
        type: 'circle' as const,
        x: 180,
        y: 180,
        radius: 10,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(elem1);
      store.getState().addElement(elem2);

      const sectionId = store.getState().createSection(100, 100, 150, 150);

      // Calculate initial relative distance
      const initialDistance = {
        x: 180 - 120, // 60
        y: 180 - 120  // 60
      };

      // Move section multiple times
      store.getState().updateSection(sectionId, { x: 200, y: 200 });
      store.getState().updateSection(sectionId, { x: 50, y: 300 });

      const finalElem1 = store.getState().elements.get('rel1');
      const finalElem2 = store.getState().elements.get('rel2');

      // Calculate final relative distance
      const finalDistance = {
        x: finalElem2!.x - finalElem1!.x,
        y: finalElem2!.y - finalElem1!.y
      };

      console.log('🧪 TEST 3.2 - Distance preservation:', {
        initial: initialDistance,
        final: finalDistance
      });

      // Relative distance should be preserved
      expect(finalDistance.x).toBe(initialDistance.x);
      expect(finalDistance.y).toBe(initialDistance.y);
    });
  });

  describe('4. INDIVIDUAL ELEMENT MOVEMENT WITHIN SECTIONS', () => {
    it('4.1 should allow individual element movement without affecting section', () => {
      // Create section with child element
      const element = {
        id: ElementId('movable1'),
        type: 'circle' as const,
        x: 150,
        y: 150,
        radius: 20,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(element);
      const sectionId = store.getState().createSection(100, 100, 200, 200);

      const initialSection = store.getState().sections.get(sectionId);

      // Move individual element
      store.getState().updateElement(ElementId('movable1'), { x: 170, y: 170 });

      const updatedElement = store.getState().elements.get('movable1');
      const updatedSection = store.getState().sections.get(sectionId);

      console.log('🧪 TEST 4.1 - Individual movement:', {
        elementBefore: { x: 150, y: 150 },
        elementAfter: { x: updatedElement?.x, y: updatedElement?.y },
        sectionBefore: { x: initialSection?.x, y: initialSection?.y },
        sectionAfter: { x: updatedSection?.x, y: updatedSection?.y }
      });

      // Element should have moved
      expect(updatedElement?.x).toBe(170);
      expect(updatedElement?.y).toBe(170);

      // Section should NOT have moved
      expect(updatedSection?.x).toBe(initialSection?.x);
      expect(updatedSection?.y).toBe(initialSection?.y);
    });

    it('4.2 should constrain element movement within section boundaries', () => {
      // Create element near section boundary
      const element = {
        id: ElementId('constrained1'),
        type: 'rectangle' as const,
        x: 150,
        y: 150,
        width: 30,
        height: 30,
        fill: '#0000ff',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(element);
      const sectionId = store.getState().createSection(100, 100, 100, 100); // Small section 100x100

      console.log('🧪 TEST 4.2 - Section bounds:', { x: 100, y: 100, width: 100, height: 100 });
      console.log('🧪 TEST 4.2 - Element size:', { width: 30, height: 30 });

      // Try to move element outside section bounds
      // Section is 100-200 x 100-200, element is 30x30
      // So valid range is roughly 110-170 x 110-170 (with padding)
      store.getState().updateElement(ElementId('constrained1'), { x: 250, y: 250 }); // Way outside

      const constrainedElement = store.getState().elements.get('constrained1');

      console.log('🧪 TEST 4.2 - Attempted move to:', { x: 250, y: 250 });
      console.log('🧪 TEST 4.2 - Actual position:', { x: constrainedElement?.x, y: constrainedElement?.y });

      // Element should be constrained within section bounds
      // NOTE: This test might fail if constraint logic isn't implemented yet
      expect(constrainedElement?.x).toBeLessThan(200); // Within section right boundary
      expect(constrainedElement?.y).toBeLessThan(200); // Within section bottom boundary
      expect(constrainedElement?.x).toBeGreaterThan(100); // Within section left boundary  
      expect(constrainedElement?.y).toBeGreaterThan(100); // Within section top boundary
    });
  });

  describe('5. SECTION RESIZING', () => {
    it('5.1 should resize section boundary without moving children', () => {
      // Create section with child elements
      const element1 = {
        id: ElementId('resize1'),
        type: 'circle' as const,
        x: 120,
        y: 120,
        radius: 15,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const element2 = {
        id: ElementId('resize2'),
        type: 'rectangle' as const,
        x: 160,
        y: 160,
        width: 40,
        height: 40,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(element1);
      store.getState().addElement(element2);

      const sectionId = store.getState().createSection(100, 100, 150, 150);

      // Get initial positions
      const initialElem1 = store.getState().elements.get('resize1');
      const initialElem2 = store.getState().elements.get('resize2');
      const initialSection = store.getState().sections.get(sectionId);

      console.log('🧪 TEST 5.1 - Before resize:', {
        section: { width: initialSection?.width, height: initialSection?.height },
        elem1: { x: initialElem1?.x, y: initialElem1?.y },
        elem2: { x: initialElem2?.x, y: initialElem2?.y }
      });

      // Resize section (make it bigger)
      store.getState().updateSection(sectionId, { width: 300, height: 300 });

      const resizedSection = store.getState().sections.get(sectionId);
      const elem1AfterResize = store.getState().elements.get('resize1');
      const elem2AfterResize = store.getState().elements.get('resize2');

      console.log('🧪 TEST 5.1 - After resize:', {
        section: { width: resizedSection?.width, height: resizedSection?.height },
        elem1: { x: elem1AfterResize?.x, y: elem1AfterResize?.y },
        elem2: { x: elem2AfterResize?.x, y: elem2AfterResize?.y }
      });

      // Section should have resized
      expect(resizedSection?.width).toBe(300);
      expect(resizedSection?.height).toBe(300);

      // Child elements should NOT have moved
      expect(elem1AfterResize?.x).toBe(initialElem1?.x);
      expect(elem1AfterResize?.y).toBe(initialElem1?.y);
      expect(elem2AfterResize?.x).toBe(initialElem2?.x);
      expect(elem2AfterResize?.y).toBe(initialElem2?.y);
    });

    it('5.2 should allow children to extend outside section after resize', () => {
      // Create section with child element
      const element = {
        id: ElementId('extend1'),
        type: 'rectangle' as const,
        x: 150,
        y: 150,
        width: 80,
        height: 80,
        fill: '#0000ff',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(element);
      const sectionId = store.getState().createSection(100, 100, 200, 200);

      // Resize section to be smaller than child element
      store.getState().updateSection(sectionId, { width: 80, height: 80 });

      const smallSection = store.getState().sections.get(sectionId);
      const elementAfterResize = store.getState().elements.get('extend1');

      console.log('🧪 TEST 5.2 - Small section vs large element:', {
        sectionBounds: { x: 100, y: 100, width: 80, height: 80 }, // 100-180 x 100-180
        elementBounds: { x: 150, y: 150, width: 80, height: 80 }  // 150-230 x 150-230
      });

      // Element should still be associated with section
      expect(elementAfterResize?.sectionId).toBe(sectionId);
      
      // Element should extend outside section bounds (this is allowed)
      const elementRight = elementAfterResize!.x + (elementAfterResize!.type === 'circle' ? (elementAfterResize as any).radius * 2 : (elementAfterResize as any).width);
      const elementBottom = elementAfterResize!.y + (elementAfterResize!.type === 'circle' ? (elementAfterResize as any).radius * 2 : (elementAfterResize as any).height);
      const sectionRight = smallSection!.x + smallSection!.width;
      const sectionBottom = smallSection!.y + smallSection!.height;

      expect(elementRight).toBeGreaterThan(sectionRight);
      expect(elementBottom).toBeGreaterThan(sectionBottom);
    });
  });

  describe('6. COORDINATE STABILITY AND EDGE CASES', () => {
    it('6.1 should maintain coordinate stability through multiple operations', () => {
      // Create element
      const element = {
        id: ElementId('stable1'),
        type: 'circle' as const,
        x: 150,
        y: 150,
        radius: 25,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(element);

      // Track coordinates through multiple operations
      const coords: Array<{x: number, y: number, operation: string}> = [];
      
      coords.push({ x: 150, y: 150, operation: 'initial' });

      // Create section (should auto-capture)
      const sectionId = store.getState().createSection(100, 100, 200, 200);
      const afterCapture = store.getState().elements.get('stable1');
      coords.push({ x: afterCapture!.x, y: afterCapture!.y, operation: 'after_capture' });

      // Move section
      store.getState().updateSection(sectionId, { x: 200, y: 200 });
      const afterSectionMove = store.getState().elements.get('stable1');
      coords.push({ x: afterSectionMove!.x, y: afterSectionMove!.y, operation: 'after_section_move' });

      // Move element individually
      store.getState().updateElement(ElementId('stable1'), { x: afterSectionMove!.x + 10, y: afterSectionMove!.y + 10 });
      const afterElementMove = store.getState().elements.get('stable1');
      coords.push({ x: afterElementMove!.x, y: afterElementMove!.y, operation: 'after_element_move' });

      // Resize section
      store.getState().updateSection(sectionId, { width: 300, height: 300 });
      const afterResize = store.getState().elements.get('stable1');
      coords.push({ x: afterResize!.x, y: afterResize!.y, operation: 'after_resize' });

      console.log('🧪 TEST 6.1 - Coordinate tracking:', coords);

      // Verify expected coordinate changes
      expect(coords[1]).toEqual({ x: 150, y: 150, operation: 'after_capture' }); // No change on capture
      expect(coords[2]).toEqual({ x: 250, y: 250, operation: 'after_section_move' }); // Moved with section (+100, +100)
      expect(coords[3]).toEqual({ x: 260, y: 260, operation: 'after_element_move' }); // Individual move (+10, +10)
      expect(coords[4]).toEqual({ x: 260, y: 260, operation: 'after_resize' }); // No change on resize
    });

    it('6.2 should handle section deletion properly', () => {
      // Create section with child elements
      const element1 = {
        id: ElementId('delete1'),
        type: 'circle' as const,
        x: 120,
        y: 120,
        radius: 20,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const element2 = {
        id: ElementId('delete2'),
        type: 'rectangle' as const,
        x: 160,
        y: 160,
        width: 40,
        height: 40,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(element1);
      store.getState().addElement(element2);

      const sectionId = store.getState().createSection(100, 100, 150, 150);

      // Verify elements are captured
      const capturedElem1 = store.getState().elements.get('delete1');
      const capturedElem2 = store.getState().elements.get('delete2');
      expect(capturedElem1?.sectionId).toBe(sectionId);
      expect(capturedElem2?.sectionId).toBe(sectionId);

      // Delete section
      store.getState().deleteSection(sectionId);

      // Section should be gone
      const deletedSection = store.getState().sections.get(sectionId);
      expect(deletedSection).toBeUndefined();

      // Elements should become free (no sectionId)
      const freedElem1 = store.getState().elements.get('delete1');
      const freedElem2 = store.getState().elements.get('delete2');
      expect(freedElem1?.sectionId).toBeUndefined();
      expect(freedElem2?.sectionId).toBeUndefined();

      // Elements should maintain their positions
      expect(freedElem1?.x).toBe(capturedElem1?.x);
      expect(freedElem1?.y).toBe(capturedElem1?.y);
      expect(freedElem2?.x).toBe(capturedElem2?.x);
      expect(freedElem2?.y).toBe(capturedElem2?.y);
    });
  });

  describe('7. STORE CONSISTENCY TESTS', () => {
    it('7.1 should maintain bidirectional references', () => {
      // Create elements and section
      const elem1 = {
        id: ElementId('ref1'),
        type: 'circle' as const,
        x: 120,
        y: 120,
        radius: 20,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(elem1);
      const sectionId = store.getState().createSection(100, 100, 200, 200);

      const section = store.getState().sections.get(sectionId);
      const element = store.getState().elements.get('ref1');

      // Check bidirectional references
      expect(section?.childElementIds).toContain(ElementId('ref1'));
      expect(element?.sectionId).toBe(sectionId);

      console.log('🧪 TEST 7.1 - Bidirectional refs:', {
        sectionChildren: section?.childElementIds,
        elementSection: element?.sectionId
      });
    });

    it('7.2 should handle multiple sections correctly', () => {
      // Create elements for two different sections
      const elem1 = {
        id: ElementId('multi1'),
        type: 'circle' as const,
        x: 120,
        y: 120,
        radius: 15,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const elem2 = {
        id: ElementId('multi2'),
        type: 'circle' as const,
        x: 320,
        y: 320,
        radius: 15,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(elem1);
      store.getState().addElement(elem2);

      // Create two separate sections
      const section1Id = store.getState().createSection(100, 100, 100, 100);
      const section2Id = store.getState().createSection(300, 300, 100, 100);

      const section1 = store.getState().sections.get(section1Id);
      const section2 = store.getState().sections.get(section2Id);
      const element1 = store.getState().elements.get('multi1');
      const element2 = store.getState().elements.get('multi2');

      // Each section should have one child
      expect(section1?.childElementIds).toHaveLength(1);
      expect(section2?.childElementIds).toHaveLength(1);
      expect(section1?.childElementIds).toContain(ElementId('multi1'));
      expect(section2?.childElementIds).toContain(ElementId('multi2'));

      // Elements should reference correct sections
      expect(element1?.sectionId).toBe(section1Id);
      expect(element2?.sectionId).toBe(section2Id);

      console.log('🧪 TEST 7.2 - Multiple sections:', {
        section1Children: section1?.childElementIds,
        section2Children: section2?.childElementIds,
        elem1Section: element1?.sectionId,
        elem2Section: element2?.sectionId
      });
    });
  });

  describe('8. INTEGRATION TESTS', () => {
    it('8.1 should work with various element types', () => {
      // Create different types of elements
      const elements = [
        {
          id: ElementId('circle_test'),
          type: 'circle' as const,
          x: 120,
          y: 120,
          radius: 20,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 2,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: ElementId('rect_test'),
          type: 'rectangle' as const,
          x: 160,
          y: 160,
          width: 50,
          height: 40,
          fill: '#00ff00',
          stroke: '#000000',
          strokeWidth: 2,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: ElementId('text_test'),
          type: 'text' as const,
          x: 140,
          y: 200,
          text: 'Test Text',
          fontSize: 16,
          fontFamily: 'Arial',
          fill: '#000000',
          width: 100,
          height: 20,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      elements.forEach(elem => store.getState().addElement(elem));

      // Create section that encompasses all elements
      const sectionId = store.getState().createSection(100, 100, 150, 150);

      const section = store.getState().sections.get(sectionId);
      
      console.log('🧪 TEST 8.1 - Mixed element types captured:', section?.childElementIds);

      // All elements should be captured
      expect(section?.childElementIds).toHaveLength(3);
      expect(section?.childElementIds).toContain(ElementId('circle_test'));
      expect(section?.childElementIds).toContain(ElementId('rect_test'));
      expect(section?.childElementIds).toContain(ElementId('text_test'));
    });
  });

  // FINAL SUMMARY TEST
  describe('9. COMPREHENSIVE BEHAVIOR SUMMARY', () => {
    it('9.1 should demonstrate complete FigJam-like section workflow', async () => {
      console.log('🧪 ========== COMPREHENSIVE WORKFLOW TEST ==========');
      
      // Step 1: Create free elements on canvas
      console.log('🧪 Step 1: Creating free elements...');
      const freeElements = [
        {
          id: ElementId('workflow_circle'),
          type: 'circle' as const,
          x: 150,
          y: 150,
          radius: 25,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 2,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: ElementId('workflow_rect'),
          type: 'rectangle' as const,
          x: 200,
          y: 200,
          width: 80,
          height: 60,
          fill: '#00ff00',
          stroke: '#000000',
          strokeWidth: 2,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      freeElements.forEach(elem => store.getState().addElement(elem));
      console.log('🧪 Free elements created at:', freeElements.map(e => ({ id: e.id, x: e.x, y: e.y })));

      // Step 2: Create section that auto-captures elements
      console.log('🧪 Step 2: Creating section over elements...');
      const sectionId = store.getState().createSection(120, 120, 200, 200, 'Workflow Section');
      
      const section = store.getState().sections.get(sectionId);
      const capturedCircle = store.getState().elements.get('workflow_circle');
      const capturedRect = store.getState().elements.get('workflow_rect');

      console.log('🧪 Section created:', { id: sectionId, children: section?.childElementIds?.length });
      console.log('🧪 Elements after capture:', {
        circle: { x: capturedCircle?.x, y: capturedCircle?.y, sectionId: capturedCircle?.sectionId },
        rect: { x: capturedRect?.x, y: capturedRect?.y, sectionId: capturedRect?.sectionId }
      });

      // Verify auto-capture worked
      expect(section?.childElementIds).toHaveLength(2);
      expect(capturedCircle?.sectionId).toBe(sectionId);
      expect(capturedRect?.sectionId).toBe(sectionId);

      // Step 3: Move section (group behavior)
      console.log('🧪 Step 3: Moving section as group...');
      const moveOffset = { x: 100, y: 50 };
      store.getState().updateSection(sectionId, { 
        x: section!.x + moveOffset.x, 
        y: section!.y + moveOffset.y 
      });

      const movedSection = store.getState().sections.get(sectionId);
      const movedCircle = store.getState().elements.get('workflow_circle');
      const movedRect = store.getState().elements.get('workflow_rect');

      console.log('🧪 After section move:', {
        section: { x: movedSection?.x, y: movedSection?.y },
        circle: { x: movedCircle?.x, y: movedCircle?.y },
        rect: { x: movedRect?.x, y: movedRect?.y }
      });

      // All elements should have moved with section
      expect(movedCircle?.x).toBe(150 + moveOffset.x);
      expect(movedCircle?.y).toBe(150 + moveOffset.y);
      expect(movedRect?.x).toBe(200 + moveOffset.x);
      expect(movedRect?.y).toBe(200 + moveOffset.y);

      // Step 4: Move individual element within section
      console.log('🧪 Step 4: Moving individual element...');
      const individualMove = { x: movedCircle!.x + 20, y: movedCircle!.y + 20 };
      store.getState().updateElement(ElementId('workflow_circle'), individualMove);

      const individuallyMovedCircle = store.getState().elements.get('workflow_circle');
      const unchangedRect = store.getState().elements.get('workflow_rect');
      const unchangedSection = store.getState().sections.get(sectionId);

      console.log('🧪 After individual move:', {
        circle: { x: individuallyMovedCircle?.x, y: individuallyMovedCircle?.y },
        rect: { x: unchangedRect?.x, y: unchangedRect?.y },
        section: { x: unchangedSection?.x, y: unchangedSection?.y }
      });

      // Only the circle should have moved
      expect(individuallyMovedCircle?.x).toBe(individualMove.x);
      expect(individuallyMovedCircle?.y).toBe(individualMove.y);
      expect(unchangedRect?.x).toBe(movedRect?.x); // Should not have changed
      expect(unchangedSection?.x).toBe(movedSection?.x); // Should not have changed

      // Step 5: Resize section
      console.log('🧪 Step 5: Resizing section...');
      const newDimensions = { width: 300, height: 250 };
      store.getState().updateSection(sectionId, newDimensions);

      const resizedSection = store.getState().sections.get(sectionId);
      const elemAfterResize1 = store.getState().elements.get('workflow_circle');
      const elemAfterResize2 = store.getState().elements.get('workflow_rect');

      console.log('🧪 After section resize:', {
        section: { width: resizedSection?.width, height: resizedSection?.height },
        circle: { x: elemAfterResize1?.x, y: elemAfterResize1?.y },
        rect: { x: elemAfterResize2?.x, y: elemAfterResize2?.y }
      });

      // Section should have resized but elements should not have moved
      expect(resizedSection?.width).toBe(newDimensions.width);
      expect(resizedSection?.height).toBe(newDimensions.height);
      expect(elemAfterResize1?.x).toBe(individuallyMovedCircle?.x); // No change
      expect(elemAfterResize2?.x).toBe(unchangedRect?.x); // No change

      console.log('🧪 ========== WORKFLOW TEST COMPLETE ==========');
      console.log('🧪 SUMMARY: All section behaviors working correctly!');
    });
  });
});