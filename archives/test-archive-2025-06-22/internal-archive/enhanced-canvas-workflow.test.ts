/**
 * Enhanced Canvas Workflow Tests
 * Focus on testing canvas workflows that are currently working
 * without the problematic canvas native module dependencies
 */

import { vi } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Import working store slices
import * as CanvasElementsStore from '@/features/canvas/stores/slices/canvasElementsStore';
import * as SelectionStore from '@/features/canvas/stores/slices/selectionStore';
import * as ViewportStore from '@/features/canvas/stores/slices/viewportStore';
import * as CanvasHistoryStore from '@/features/canvas/stores/slices/canvasHistoryStore';

// Import utilities that work
import { createMockCanvasElement } from '@/tests/utils/testUtils.tsx';
import {
  ElementId,
  RectangleElement,
  CircleElement,
  TextElement,
} from '@/features/canvas/types/enhanced.types';

// Test store creation utilities
const createElementsStore = () =>
  create<CanvasElementsStore.CanvasElementsState>()(
    immer(CanvasElementsStore.createCanvasElementsStore),
  );

const createSelectionStore = () =>
  create<SelectionStore.SelectionState>()(
    immer(SelectionStore.createSelectionStore),
  );

const createViewportStore = () =>
  create<ViewportStore.ViewportState>()(
    immer(ViewportStore.createViewportStore),
  );

const createHistoryStore = () =>
  create<CanvasHistoryStore.CanvasHistoryState>()(
    immer(CanvasHistoryStore.createCanvasHistoryStore),
  );

describe('Enhanced Canvas Workflow Tests', () => {
  describe('🎯 Core Element Workflow', () => {
    let elementsStore: ReturnType<typeof createElementsStore>;
    let selectionStore: ReturnType<typeof createSelectionStore>;

    beforeEach(() => {
      elementsStore = createElementsStore();
      selectionStore = createSelectionStore();
    });

    test('Complete Add → Select → Update workflow', () => {
      // 1. Add element
      const element = createMockCanvasElement({ type: 'rectangle' }) as RectangleElement;
      elementsStore.getState().addElement(element);

      // Verify element was added
      expect(elementsStore.getState().elements.has(element.id)).toBe(true);
      
      // 2. Select element
      selectionStore.getState().selectElement(element.id);

      // Verify element was selected
      expect(selectionStore.getState().selectedElementIds.has(element.id)).toBe(true);

      // 3. Update element
      const updatedProps = { width: 200, height: 150 };
      elementsStore.getState().updateElement(element.id, updatedProps);

      // Verify element was updated
      const updatedElement = elementsStore.getState().elements.get(element.id) as RectangleElement;
      expect(updatedElement.width).toBe(200);
      expect(updatedElement.height).toBe(150);
    });

    test('Multi-element selection and bulk operations', () => {
      // Add multiple elements
      const rect1 = createMockCanvasElement({ type: 'rectangle' }) as RectangleElement;
      const rect2 = createMockCanvasElement({ type: 'rectangle' }) as RectangleElement;
      const circle1 = createMockCanvasElement({ type: 'circle' }) as CircleElement;

      elementsStore.getState().addElement(rect1);
      elementsStore.getState().addElement(rect2);
      elementsStore.getState().addElement(circle1);

      // Select multiple elements
      selectionStore.getState().selectMultipleElements([rect1.id, rect2.id], true);

      // Verify both selected
      expect(selectionStore.getState().selectedElementIds.size).toBe(2);
      expect(selectionStore.getState().selectedElementIds.has(rect1.id)).toBe(true);
      expect(selectionStore.getState().selectedElementIds.has(rect2.id)).toBe(true);

      // Add third element to selection
      selectionStore.getState().selectElement(circle1.id, true);

      // Verify all three selected
      expect(selectionStore.getState().selectedElementIds.size).toBe(3);
    });

    test('Element deletion workflow', () => {
      // Add and select element
      const element = createMockCanvasElement({ type: 'rectangle' });
      elementsStore.getState().addElement(element);
      selectionStore.getState().selectElement(element.id);

      // Verify setup
      expect(elementsStore.getState().elements.has(element.id)).toBe(true);
      expect(selectionStore.getState().selectedElementIds.has(element.id)).toBe(true);

      // Delete element
      elementsStore.getState().deleteElement(element.id);

      // Verify element deleted and selection cleared
      expect(elementsStore.getState().elements.has(element.id)).toBe(false);
      // Note: Selection clearing would need coordination between stores
    });
  });

  describe('🔄 Viewport and Coordinate Workflow', () => {
    let viewportStore: ReturnType<typeof createViewportStore>;

    beforeEach(() => {
      viewportStore = createViewportStore();
    });

    test('Zoom and pan workflow', () => {
      const state = viewportStore.getState();

      // Initial state
      expect(state.zoom).toBe(1);
      expect(state.pan).toEqual({ x: 0, y: 0 });

      // Zoom in
      state.zoomIn();
      expect(viewportStore.getState().zoom).toBe(1.2);

      // Pan
      state.setPan({ x: 100, y: 50 });
      expect(viewportStore.getState().pan).toEqual({ x: 100, y: 50 });

      // Zoom out
      state.zoomOut();
      expect(viewportStore.getState().zoom).toBeCloseTo(1);

      // Reset viewport
      state.resetViewport();
      expect(viewportStore.getState().zoom).toBe(1);
      expect(viewportStore.getState().pan).toEqual({ x: 0, y: 0 });
    });    test('Coordinate transformation workflow', () => {
      const state = viewportStore.getState();

      // Set zoom and pan
      state.setZoom(2);
      state.setPan({ x: 50, y: 30 });

      // Test coordinate transformations
      const screenPoint = { x: 200, y: 150 };
      const canvasPoint = state.screenToCanvas(screenPoint);
      const backToScreen = state.canvasToScreen(canvasPoint);

      // Should roundtrip correctly
      expect(backToScreen.x).toBeCloseTo(screenPoint.x);
      expect(backToScreen.y).toBeCloseTo(screenPoint.y);
    });
  });

  describe('📝 History and Undo/Redo Workflow', () => {
    let historyStore: ReturnType<typeof createHistoryStore>;

    beforeEach(() => {
      historyStore = createHistoryStore();
    });    test('History recording and undo/redo workflow', () => {
      const state = historyStore.getState();
      
      // Initial state
      expect(state.canUndo()).toBe(false);
      expect(state.canRedo()).toBe(false);
      
      // Add history entries
      const action1 = 'ADD_ELEMENT';
      const action2 = 'UPDATE_ELEMENT';
      
      state.addHistoryEntry(action1, [], []);
      expect(state.canUndo()).toBe(true);
      expect(state.canRedo()).toBe(false);

      state.addHistoryEntry(action2, [], []);
      expect(state.getHistoryLength()).toBe(2);

      // Undo workflow
      const undoAction = state.undo();
      expect(undoAction).toBeDefined();
      expect(state.canRedo()).toBe(true);

      // Redo workflow
      const redoAction = state.redo();
      expect(redoAction).toBeDefined();
      expect(state.canRedo()).toBe(false);
    });
  });

  describe('🔗 Cross-Store Integration Workflows', () => {
    let elementsStore: ReturnType<typeof createElementsStore>;
    let selectionStore: ReturnType<typeof createSelectionStore>;
    let viewportStore: ReturnType<typeof createViewportStore>;
    let historyStore: ReturnType<typeof createHistoryStore>;

    beforeEach(() => {
      elementsStore = createElementsStore();
      selectionStore = createSelectionStore();
      viewportStore = createViewportStore();
      historyStore = createHistoryStore();
    });

    test('Complete canvas interaction workflow', () => {
      // 1. Set up viewport
      viewportStore.getState().setZoom(1.5);
      viewportStore.getState().setPan({ x: 20, y: 30 });      // 2. Add element with history tracking
      const element = createMockCanvasElement({ type: 'rectangle' });
      elementsStore.getState().addElement(element);
      historyStore.getState().addHistoryEntry('ADD_ELEMENT', [], []);

      // 3. Select element
      selectionStore.getState().selectElement(element.id);

      // 4. Update element with history tracking
      const updateProps = { width: 250, height: 180 };
      elementsStore.getState().updateElement(element.id, updateProps);
      historyStore.getState().addHistoryEntry('UPDATE_ELEMENT', [], []);

      // Verify final state
      expect(elementsStore.getState().elements.has(element.id)).toBe(true);
      expect(selectionStore.getState().selectedElementIds.has(element.id)).toBe(true);
      expect(viewportStore.getState().zoom).toBe(1.5);
      expect(historyStore.getState().getHistoryLength()).toBe(2);
      expect(historyStore.getState().canUndo()).toBe(true);      // Test undo workflow
      historyStore.getState().undo();
      expect(historyStore.getState().canRedo()).toBe(true);
    });

    test('Drawing tool workflow simulation', () => {
      // Simulate drawing tool selection and basic drawing
      const drawingState = {
        selectedTool: 'rectangle',
        isDrawing: false,
        startPoint: null as { x: number, y: number } | null,
        endPoint: null as { x: number, y: number } | null,
      };

      // 1. Select drawing tool
      drawingState.selectedTool = 'rectangle';
      expect(drawingState.selectedTool).toBe('rectangle');

      // 2. Start drawing
      drawingState.isDrawing = true;
      drawingState.startPoint = { x: 100, y: 100 };
      expect(drawingState.isDrawing).toBe(true);

      // 3. Continue drawing (mouse move)
      drawingState.endPoint = { x: 200, y: 150 };

      // 4. Finish drawing
      if (drawingState.startPoint && drawingState.endPoint) {
        const width = Math.abs(drawingState.endPoint.x - drawingState.startPoint.x);
        const height = Math.abs(drawingState.endPoint.y - drawingState.startPoint.y);
        
        const newElement = createMockCanvasElement({
          type: 'rectangle',
          x: Math.min(drawingState.startPoint.x, drawingState.endPoint.x),
          y: Math.min(drawingState.startPoint.y, drawingState.endPoint.y),
          width,
          height,
        }) as RectangleElement;        elementsStore.getState().addElement(newElement);
        historyStore.getState().addHistoryEntry('ADD_ELEMENT', [], []);

        // Verify element created correctly
        expect(elementsStore.getState().elements.has(newElement.id)).toBe(true);
        expect(newElement.width).toBe(100);
        expect(newElement.height).toBe(50);
      }

      // 5. Reset drawing state
      drawingState.isDrawing = false;
      drawingState.startPoint = null;
      drawingState.endPoint = null;
      expect(drawingState.isDrawing).toBe(false);
    });
  });

  describe('⚡ Performance and Stress Testing', () => {
    test('Large number of elements workflow', () => {
      const elementsStore = createElementsStore();
      const selectionStore = createSelectionStore();      // Add many elements
      const elements: any[] = [];
      for (let i = 0; i < 100; i++) {
        const element = createMockCanvasElement({
          type: 'rectangle',
          x: (i % 10) * 50,
          y: Math.floor(i / 10) * 50,
        });
        elements.push(element);
        elementsStore.getState().addElement(element);
      }

      // Verify all elements added
      expect(elementsStore.getState().elements.size).toBe(100);

      // Select half the elements
      const selectedIds = elements.slice(0, 50).map(el => el.id);
      selectionStore.getState().selectMultipleElements(selectedIds, true);

      // Verify selection
      expect(selectionStore.getState().selectedElementIds.size).toBe(50);

      // Clear selection
      selectionStore.getState().clearSelection();
      expect(selectionStore.getState().selectedElementIds.size).toBe(0);
    });

    test('Rapid viewport changes', () => {
      const viewportStore = createViewportStore();
      const state = viewportStore.getState();

      // Rapid zoom changes
      for (let i = 0; i < 10; i++) {
        state.zoomIn();
      }
      expect(viewportStore.getState().zoom).toBeCloseTo(6.19, 1);

      for (let i = 0; i < 5; i++) {
        state.zoomOut();
      }
      
      // Should still be within reasonable bounds
      expect(viewportStore.getState().zoom).toBeGreaterThan(0.1);
      expect(viewportStore.getState().zoom).toBeLessThan(10);
    });
  });
});
