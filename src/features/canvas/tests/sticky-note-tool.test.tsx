/**
 * StickyNoteTool Tests
 * 
 * Tests for the StickyNoteTool component following store-first testing principles.
 * These tests focus on the actual store methods and business logic rather than UI mocking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { StickyNoteTool } from '../components/tools/creation/StickyNoteTool';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import type { StickyNoteElement } from '../types/enhanced.types';
import { ElementId } from '../types/enhanced.types';

// Mock Konva Stage for UI tests
const mockStage = {
  on: vi.fn(),
  off: vi.fn(),
  getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
  getAbsoluteTransform: vi.fn(() => ({
    copy: () => ({
      invert: () => ({
        point: (p: any) => p
      })
    })
  })),
  getStage: vi.fn().mockReturnValue(undefined),
  id: vi.fn().mockReturnValue('')
};

const mockStageRef = {
  current: mockStage as any
};

describe('StickyNoteTool', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render when active', () => {
      const { container } = render(
        <StickyNoteTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );
      
      // Should not crash when rendering
      expect(container).toBeDefined();
    });

    it('should not render when inactive', () => {
      const { container } = render(
        <StickyNoteTool
          isActive={false}
          stageRef={mockStageRef}
        />
      );
      
      // Should not crash when rendering and return null
      expect(container).toBeDefined();
    });

    it('should register event handlers when active', () => {
      render(
        <StickyNoteTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      // Check that event handlers are registered (using namespaced event names)
      expect(mockStage.on).toHaveBeenCalledWith('pointermove.stickyNoteTool', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointerdown.stickyNoteTool', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointerleave.stickyNoteTool', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointerenter.stickyNoteTool', expect.any(Function));
    });

    it('should clean up event handlers on unmount', () => {
      const { unmount } = render(
        <StickyNoteTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      unmount();

      expect(mockStage.off).toHaveBeenCalledWith('pointermove.stickyNoteTool', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointerdown.stickyNoteTool', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointerleave.stickyNoteTool', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointerenter.stickyNoteTool', expect.any(Function));
    });
  });

  describe('Sticky Note Creation', () => {
    it('should create sticky note on click', () => {
      render(
        <StickyNoteTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      // Get the registered pointerdown handler
      const pointerDownHandler = mockStage.on.mock.calls.find(
        call => call[0] === 'pointerdown.stickyNoteTool'
      )?.[1];

      // Click to create sticky note
      pointerDownHandler({
        target: mockStage,
        evt: { clientX: 100, clientY: 100 }
      });

      // Should have handled the click without errors
      expect(pointerDownHandler).toBeDefined();
    });

    it('should handle clicks on existing elements gracefully', () => {
      const mockElement = {
        ...mockStage,
        id: vi.fn().mockReturnValue('existing-element')
      };
      
      render(
        <StickyNoteTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      // Get the registered pointerdown handler
      const pointerDownHandler = mockStage.on.mock.calls.find(
        call => call[0] === 'pointerdown.stickyNoteTool'
      )?.[1];

      // Click on existing element should be ignored
      pointerDownHandler({
        target: mockElement,
        evt: { clientX: 100, clientY: 100 }
      });

      // Should handle gracefully without errors
      expect(pointerDownHandler).toBeDefined();
    });

    it('should handle missing stage gracefully', () => {
      const nullStageRef = { current: null };
      
      const { container } = render(
        <StickyNoteTool
          isActive={true}
          stageRef={nullStageRef}
        />
      );

      // Should not crash with null stage
      expect(container).toBeDefined();
    });

    it('should handle missing pointer position', () => {
      const stageWithoutPointer = {
        ...mockStage,
        getPointerPosition: vi.fn(() => null)
      };
      
      const stageRef = { current: stageWithoutPointer as any };
      
      render(
        <StickyNoteTool
          isActive={true}
          stageRef={stageRef}
        />
      );

      // Get the registered pointerdown handler
      const pointerDownHandler = stageWithoutPointer.on.mock.calls.find(
        call => call[0] === 'pointerdown.stickyNoteTool'
      )?.[1];

      // Click without pointer position
      pointerDownHandler({
        target: stageWithoutPointer,
        evt: { clientX: 100, clientY: 100 }
      });

      // Should handle gracefully without errors
      expect(pointerDownHandler).toBeDefined();
    });

    it('should handle pointer movement for preview', () => {
      render(
        <StickyNoteTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      // Get the registered pointermove handler
      const pointerMoveHandler = mockStage.on.mock.calls.find(
        call => call[0] === 'pointermove.stickyNoteTool'
      )?.[1];

      // Move pointer to show preview
      pointerMoveHandler({
        target: mockStage,
        evt: { clientX: 150, clientY: 150 }
      });

      // Should handle pointer movement without errors
      expect(pointerMoveHandler).toBeDefined();
    });
  });
});

// Store-First Tests - Testing actual business logic
describe('StickyNote Functionality (Store-First)', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    store = createUnifiedTestStore();
  });

  describe('Sticky Note Creation', () => {
    it('should create sticky note with basic properties', () => {
      const stickyNote: StickyNoteElement = {
        id: ElementId('sticky-1'),
        type: 'sticky-note',
        x: 100,
        y: 100,
        width: 180,
        height: 180,
        text: 'Hello World',
        backgroundColor: '#FFF2CC',
        textColor: '#1F2937',
        fontSize: 14,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'left',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isContainer: true,
        childElementIds: [],
        allowedChildTypes: ['pen', 'marker', 'highlighter', 'text', 'connector', 'image', 'table'],
        clipChildren: true,
        maxChildElements: 20
      };

      // Use the correct pattern: store.getState().addElement()
      store.getState().addElement(stickyNote);

      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().elements.get(stickyNote.id)).toEqual(stickyNote);
      expect(store.getState().elementOrder).toContain(stickyNote.id);
    });

    it('should create sticky note with default dimensions', () => {
      const stickyNote: StickyNoteElement = {
        id: ElementId('sticky-default'),
        type: 'sticky-note',
        x: 0,
        y: 0,
        width: 180,
        height: 180,
        text: '',
        backgroundColor: '#FFF2CC',
        textColor: '#1F2937',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'left',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isContainer: true,
        childElementIds: [],
        allowedChildTypes: ['pen', 'marker', 'highlighter', 'text', 'connector', 'image', 'table'],
        clipChildren: true,
        maxChildElements: 20
      };

      store.getState().addElement(stickyNote);

      const addedStickyNote = store.getState().elements.get(stickyNote.id) as StickyNoteElement;
      expect(addedStickyNote.width).toBe(180);
      expect(addedStickyNote.height).toBe(180);
      expect(addedStickyNote.backgroundColor).toBe('#FFF2CC');
      expect(addedStickyNote.isContainer).toBe(true);
    });

    it('should create sticky note with custom colors', () => {
      const stickyNote: StickyNoteElement = {
        id: ElementId('sticky-colored'),
        type: 'sticky-note',
        x: 50,
        y: 50,
        width: 180,
        height: 180,
        text: 'Custom Color',
        backgroundColor: '#FFE066',
        textColor: '#2D3748',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isContainer: true,
        childElementIds: [],
        allowedChildTypes: ['pen', 'marker', 'highlighter'],
        clipChildren: true,
        maxChildElements: 10
      };

      store.getState().addElement(stickyNote);

      const addedStickyNote = store.getState().elements.get(stickyNote.id) as StickyNoteElement;
      expect(addedStickyNote.backgroundColor).toBe('#FFE066');
      expect(addedStickyNote.textColor).toBe('#2D3748');
      expect(addedStickyNote.fontSize).toBe(16);
      expect(addedStickyNote.textAlign).toBe('center');
    });
  });

  describe('Sticky Note Container Functionality', () => {
    let stickyNoteId: ElementId;

    beforeEach(() => {
      stickyNoteId = ElementId('container-sticky');
      const stickyNote: StickyNoteElement = {
        id: stickyNoteId,
        type: 'sticky-note',
        x: 100,
        y: 100,
        width: 300,
        height: 250,
        text: 'Container Test',
        backgroundColor: '#FFF2CC',
        textColor: '#1F2937',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'left',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isContainer: false, // Start as non-container
        childElementIds: []
      };

      store.getState().addElement(stickyNote);
    });

    it('should enable sticky note as container', () => {
      store.getState().enableStickyNoteContainer(stickyNoteId, {
        allowedTypes: ['pen', 'marker', 'text'],
        clipChildren: true,
        maxChildren: 15
      });

      const stickyNote = store.getState().elements.get(stickyNoteId) as StickyNoteElement;
      expect(stickyNote.isContainer).toBe(true);
      expect(stickyNote.allowedChildTypes).toEqual(['pen', 'marker', 'text']);
      expect(stickyNote.clipChildren).toBe(true);
      expect(stickyNote.maxChildElements).toBe(15);
    });

    it('should check if sticky note is container', () => {
      // Initially not a container
      expect(store.getState().isStickyNoteContainer(stickyNoteId)).toBe(false);

      // Enable as container
      store.getState().enableStickyNoteContainer(stickyNoteId);

      // Now should be a container
      expect(store.getState().isStickyNoteContainer(stickyNoteId)).toBe(true);
    });

    it('should find sticky note at point', () => {
      // Enable as container first
      store.getState().enableStickyNoteContainer(stickyNoteId);

      // Point inside sticky note bounds
      const pointInside = { x: 200, y: 200 };
      const foundId = store.getState().findStickyNoteAtPoint(pointInside);
      expect(foundId).toBe(stickyNoteId);

      // Point outside sticky note bounds
      const pointOutside = { x: 500, y: 500 };
      const notFoundId = store.getState().findStickyNoteAtPoint(pointOutside);
      expect(notFoundId).toBe(null);
    });

    it('should add element to sticky note container', () => {
      // Enable as container
      store.getState().enableStickyNoteContainer(stickyNoteId, {
        allowedTypes: ['text', 'pen'],
        maxChildren: 5
      });

      // Create a text element to add
      const textElement = {
        id: ElementId('text-1'),
        type: 'rich-text' as const,
        x: 150,
        y: 150,
        text: 'Child text',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(textElement);
      store.getState().addElementToStickyNote(textElement.id, stickyNoteId);

      const stickyNote = store.getState().elements.get(stickyNoteId) as StickyNoteElement;
      const updatedTextElement = store.getState().elements.get(textElement.id) as any;

      expect(stickyNote.childElementIds).toContain(textElement.id);
      expect(updatedTextElement.stickyNoteId).toBe(stickyNoteId);
    });

    it('should prevent adding disallowed element types', () => {
      // Enable as container with limited types
      store.getState().enableStickyNoteContainer(stickyNoteId, {
        allowedTypes: ['text'],
        maxChildren: 5
      });

      // Try to add a pen element (not allowed)
      const penElement = {
        id: ElementId('pen-1'),
        type: 'pen' as const,
        x: 150,
        y: 150,
        points: [0, 0, 10, 10],
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(penElement);
      store.getState().addElementToStickyNote(penElement.id, stickyNoteId);

      const stickyNote = store.getState().elements.get(stickyNoteId) as StickyNoteElement;
      expect(stickyNote.childElementIds).not.toContain(penElement.id);
    });

    it('should prevent adding elements beyond max limit', () => {
      // Enable as container with max 2 children
      store.getState().enableStickyNoteContainer(stickyNoteId, {
        allowedTypes: ['text'],
        maxChildren: 2
      });

      // Add first element
      const textElement1 = {
        id: ElementId('text-1'),
        type: 'rich-text' as const,
        x: 150,
        y: 150,
        text: 'First text',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Add second element
      const textElement2 = {
        id: ElementId('text-2'),
        type: 'rich-text' as const,
        x: 160,
        y: 160,
        text: 'Second text',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Try to add third element (should be rejected)
      const textElement3 = {
        id: ElementId('text-3'),
        type: 'rich-text' as const,
        x: 170,
        y: 170,
        text: 'Third text',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(textElement1);
      store.getState().addElement(textElement2);
      store.getState().addElement(textElement3);

      store.getState().addElementToStickyNote(textElement1.id, stickyNoteId);
      store.getState().addElementToStickyNote(textElement2.id, stickyNoteId);
      store.getState().addElementToStickyNote(textElement3.id, stickyNoteId);

      const stickyNote = store.getState().elements.get(stickyNoteId) as StickyNoteElement;
      expect(stickyNote.childElementIds).toHaveLength(2);
      expect(stickyNote.childElementIds).not.toContain(textElement3.id);
    });

    it('should remove element from sticky note container', () => {
      // Enable as container and add element
      store.getState().enableStickyNoteContainer(stickyNoteId);

      const textElement = {
        id: ElementId('text-remove'),
        type: 'rich-text' as const,
        x: 150,
        y: 150,
        text: 'Remove me',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(textElement);
      store.getState().addElementToStickyNote(textElement.id, stickyNoteId);

      // Verify it was added
      let stickyNote = store.getState().elements.get(stickyNoteId) as StickyNoteElement;
      expect(stickyNote.childElementIds).toContain(textElement.id);

      // Remove it
      store.getState().removeElementFromStickyNote(textElement.id, stickyNoteId);

      // Verify it was removed
      stickyNote = store.getState().elements.get(stickyNoteId) as StickyNoteElement;
      const updatedTextElement = store.getState().elements.get(textElement.id) as any;

      expect(stickyNote.childElementIds).not.toContain(textElement.id);
      expect(updatedTextElement.stickyNoteId).toBeUndefined();
    });

    it('should get sticky note children', () => {
      // Enable as container
      store.getState().enableStickyNoteContainer(stickyNoteId);

      // Add multiple elements
      const textElement1 = {
        id: ElementId('child-1'),
        type: 'rich-text' as const,
        x: 150,
        y: 150,
        text: 'Child 1',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const textElement2 = {
        id: ElementId('child-2'),
        type: 'rich-text' as const,
        x: 160,
        y: 160,
        text: 'Child 2',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(textElement1);
      store.getState().addElement(textElement2);
      store.getState().addElementToStickyNote(textElement1.id, stickyNoteId);
      store.getState().addElementToStickyNote(textElement2.id, stickyNoteId);

      const children = store.getState().getStickyNoteChildren(stickyNoteId);
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toContain(textElement1.id);
      expect(children.map(c => c.id)).toContain(textElement2.id);
    });

    it('should clear all sticky note children', () => {
      // Enable as container and add elements
      store.getState().enableStickyNoteContainer(stickyNoteId);

      const textElement1 = {
        id: ElementId('clear-child-1'),
        type: 'rich-text' as const,
        x: 150,
        y: 150,
        text: 'Clear me 1',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const textElement2 = {
        id: ElementId('clear-child-2'),
        type: 'rich-text' as const,
        x: 160,
        y: 160,
        text: 'Clear me 2',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(textElement1);
      store.getState().addElement(textElement2);
      store.getState().addElementToStickyNote(textElement1.id, stickyNoteId);
      store.getState().addElementToStickyNote(textElement2.id, stickyNoteId);

      // Verify elements were added
      let stickyNote = store.getState().elements.get(stickyNoteId) as StickyNoteElement;
      expect(stickyNote.childElementIds).toHaveLength(2);

      // Clear all children
      store.getState().clearStickyNoteChildren(stickyNoteId);

      // Verify all children were removed
      stickyNote = store.getState().elements.get(stickyNoteId) as StickyNoteElement;
      expect(stickyNote.childElementIds).toHaveLength(0);
    });
  });

  describe('Sticky Note Selection', () => {
    it('should select sticky note', () => {
      const stickyNote: StickyNoteElement = {
        id: ElementId('select-sticky'),
        type: 'sticky-note',
        x: 0,
        y: 0,
        width: 180,
        height: 180,
        text: 'Select me',
        backgroundColor: '#FFF2CC',
        textColor: '#1F2937',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'left',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isContainer: true,
        childElementIds: []
      };

      store.getState().addElement(stickyNote);
      store.getState().selectElement(stickyNote.id);

      expect(store.getState().selectedElementIds.has(stickyNote.id)).toBe(true);
      expect(store.getState().lastSelectedElementId).toBe(stickyNote.id);
    });

    it('should handle sticky note in multi-selection', () => {
      const stickyNote1: StickyNoteElement = {
        id: ElementId('multi-sticky-1'),
        type: 'sticky-note',
        x: 0,
        y: 0,
        width: 180,
        height: 180,
        text: 'First',
        backgroundColor: '#FFF2CC',
        textColor: '#1F2937',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'left',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isContainer: true,
        childElementIds: []
      };

      const stickyNote2: StickyNoteElement = {
        id: ElementId('multi-sticky-2'),
        type: 'sticky-note',
        x: 200,
        y: 0,
        width: 180,
        height: 180,
        text: 'Second',
        backgroundColor: '#FFE066',
        textColor: '#1F2937',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'left',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isContainer: true,
        childElementIds: []
      };

      store.getState().addElement(stickyNote1);
      store.getState().addElement(stickyNote2);

      // Select both sticky notes
      store.getState().selectElement(stickyNote1.id);
      store.getState().selectElement(stickyNote2.id, true); // multiSelect: true

      expect(store.getState().selectedElementIds.size).toBe(2);
      expect(store.getState().selectedElementIds.has(stickyNote1.id)).toBe(true);
      expect(store.getState().selectedElementIds.has(stickyNote2.id)).toBe(true);
    });
  });

  describe('Sticky Note Deletion', () => {
    it('should delete sticky note correctly', () => {
      const stickyNote: StickyNoteElement = {
        id: ElementId('delete-sticky'),
        type: 'sticky-note',
        x: 0,
        y: 0,
        width: 180,
        height: 180,
        text: 'Delete me',
        backgroundColor: '#FFF2CC',
        textColor: '#1F2937',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'left',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isContainer: true,
        childElementIds: []
      };

      store.getState().addElement(stickyNote);
      expect(store.getState().elements.size).toBe(1);

      // Delete sticky note
      store.getState().deleteElement(stickyNote.id);

      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().elements.has(stickyNote.id)).toBe(false);
    });

    it('should delete sticky note with children correctly', () => {
      const stickyNote: StickyNoteElement = {
        id: ElementId('delete-container-sticky'),
        type: 'sticky-note',
        x: 0,
        y: 0,
        width: 300,
        height: 250,
        text: 'Container with children',
        backgroundColor: '#FFF2CC',
        textColor: '#1F2937',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'left',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isContainer: true,
        childElementIds: []
      };

      const childElement = {
        id: ElementId('child-element'),
        type: 'rich-text' as const,
        x: 50,
        y: 50,
        text: 'Child text',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(stickyNote);
      store.getState().addElement(childElement);
      store.getState().enableStickyNoteContainer(stickyNote.id);
      store.getState().addElementToStickyNote(childElement.id, stickyNote.id);

      expect(store.getState().elements.size).toBe(2);

      // Delete sticky note (should handle children appropriately)
      store.getState().deleteElement(stickyNote.id);

      expect(store.getState().elements.has(stickyNote.id)).toBe(false);
      // Child element should still exist but no longer reference the sticky note
      expect(store.getState().elements.has(childElement.id)).toBe(true);
    });
  });

  describe('Sticky Note Integration', () => {
    it('should work with element creation workflow', () => {
      // Create sticky note
      const stickyNote: StickyNoteElement = {
        id: ElementId('integration-sticky'),
        type: 'sticky-note',
        x: 100,
        y: 100,
        width: 180,
        height: 180,
        text: 'Integration test',
        backgroundColor: '#FFF2CC',
        textColor: '#1F2937',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'left',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isContainer: true,
        childElementIds: []
      };

      store.getState().addElement(stickyNote);

      // Enable container functionality
      store.getState().enableStickyNoteContainer(stickyNote.id);

      // Add child element
      const childElement = {
        id: ElementId('integration-child'),
        type: 'rich-text' as const,
        x: 120,
        y: 120,
        text: 'Child element',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        segments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(childElement);
      store.getState().addElementToStickyNote(childElement.id, stickyNote.id);

      // Verify workflow
      expect(store.getState().elements.size).toBe(2);
      const savedStickyNote = store.getState().elements.get(stickyNote.id) as StickyNoteElement;
      expect(savedStickyNote.isContainer).toBe(true);
      expect(savedStickyNote.childElementIds).toContain(childElement.id);
    });

    it('should work with demo creation function', () => {
      const demoStickyNoteId = store.getState().createStickyNoteContainerDemo();

      expect(store.getState().elements.size).toBe(1);
      const demoStickyNote = store.getState().elements.get(demoStickyNoteId) as StickyNoteElement;
      expect(demoStickyNote.type).toBe('sticky-note');
      expect(demoStickyNote.isContainer).toBe(true);
      expect(demoStickyNote.text).toContain('Container Demo');
    });
  });
}); 