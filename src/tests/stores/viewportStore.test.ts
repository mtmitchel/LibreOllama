import { describe, test, expect, beforeEach } from '@jest/globals';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import Konva from 'konva';

// Use relative imports to avoid path resolution issues during testing
import * as ViewportStore from '../../features/canvas/stores/slices/viewportStore';
import type { ViewportState } from '../../features/canvas/stores/slices/viewportStore';

// Create a mock Konva.Stage
const mockStage = {
  position: () => ({ x: 0, y: 0 }),
  scale: () => ({ x: 1, y: 1 }),
  width: () => 800,
  height: () => 600,
  getPointerPosition: () => ({ x: 400, y: 300 }),
} as unknown as Konva.Stage;

// Debug logging to understand the export issue
console.log('ViewportStore exports:', Object.keys(ViewportStore));
console.log('ViewportStore.createViewportStore:', ViewportStore.createViewportStore);
console.log('Type of createViewportStore:', typeof ViewportStore.createViewportStore);

// Destructure to get direct access
const { createViewportStore } = ViewportStore;

const createTestStore = () =>
  create<ViewportState>()(immer(createViewportStore));

describe('viewportStore', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    // Set the mock stage and reset to initial state
    store.setState({
      stage: mockStage,
      zoom: 1,
      pan: { x: 0, y: 0 },
      viewportSize: { width: 800, height: 600 },
    });
  });

  test('initializes with default viewport state', () => {
    const { zoom, pan } = store.getState();
    expect(zoom).toBe(1);
    expect(pan).toEqual({ x: 0, y: 0 });
  });

  test('setZoom updates the zoom level', () => {
    store.getState().setZoom(2);
    expect(store.getState().zoom).toBe(2);
  });

  test('setPan updates the pan position', () => {
    store.getState().setPan({ x: 100, y: 150 });
    expect(store.getState().pan).toEqual({ x: 100, y: 150 });
  });

  test('zoomIn increases the zoom level', () => {
    const initialZoom = store.getState().zoom;
    store.getState().zoomIn();
    expect(store.getState().zoom).toBe(initialZoom * 1.2);
  });

  test('zoomOut decreases the zoom level', () => {
    const initialZoom = store.getState().zoom;
    store.getState().zoomOut();
    expect(store.getState().zoom).toBe(initialZoom / 1.2);
  });

  test('resetViewport resets zoom and pan', () => {
    store.getState().setZoom(3);
    store.getState().setPan({ x: 200, y: 250 });
    store.getState().resetViewport();
    expect(store.getState().zoom).toBe(1);
    expect(store.getState().pan).toEqual({ x: 0, y: 0 });
  });

  describe('Coordinate Transformations', () => {
    beforeEach(() => {
      store.setState({
        pan: { x: 100, y: 50 },
        zoom: 2,
        viewportSize: { width: 800, height: 600 },
      });
    });

    test('screenToCanvas correctly transforms coordinates', () => {
      const screenPoint = { x: 500, y: 450 };
      const canvasPoint = store.getState().screenToCanvas(screenPoint);
      // x = (500 - 400 - 100) / 2 = 0
      // y = (450 - 300 - 50) / 2 = 50
      expect(canvasPoint.x).toBe(0);
      expect(canvasPoint.y).toBe(50);
    });

    test('canvasToScreen correctly transforms coordinates', () => {
      const canvasPoint = { x: 150, y: 200 };
      const screenPoint = store.getState().canvasToScreen(canvasPoint);
      // x = 150 * 2 + 100 + 400 = 800
      // y = 200 * 2 + 50 + 300 = 750
      expect(screenPoint.x).toBe(800);
      expect(screenPoint.y).toBe(750);
    });
  });
});
