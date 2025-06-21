import { describe, test, expect, beforeEach } from '@jest/globals';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import Konva from 'konva';
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

const useTestStore = create<ViewportState>()(
  immer(ViewportStore.createViewportStore),
);

describe('viewportStore', () => {
  beforeEach(() => {
    // Reset the store to its initial state before each test
    const initialState = useTestStore.getState();
    useTestStore.setState(
      {
        ...initialState,
        stage: mockStage, // Set the mock stage
        zoom: 1,
        pan: { x: 0, y: 0 },
        viewportSize: { width: 800, height: 600 },
      },
      true,
    );
  });

  test('initializes with default viewport state', () => {
    const { zoom, pan } = useTestStore.getState();
    expect(zoom).toBe(1);
    expect(pan).toEqual({ x: 0, y: 0 });
  });

  test('setZoom updates the zoom level', () => {
    useTestStore.getState().setZoom(2);
    expect(useTestStore.getState().zoom).toBe(2);
  });

  test('setPan updates the pan position', () => {
    useTestStore.getState().setPan({ x: 100, y: 150 });
    expect(useTestStore.getState().pan).toEqual({ x: 100, y: 150 });
  });

  test('zoomIn increases the zoom level', () => {
    const initialZoom = useTestStore.getState().zoom;
    useTestStore.getState().zoomIn();
    expect(useTestStore.getState().zoom).toBe(initialZoom * 1.2);
  });

  test('zoomOut decreases the zoom level', () => {
    const initialZoom = useTestStore.getState().zoom;
    useTestStore.getState().zoomOut();
    expect(useTestStore.getState().zoom).toBe(initialZoom / 1.2);
  });

  test('resetViewport resets zoom and pan', () => {
    useTestStore.getState().setZoom(3);
    useTestStore.getState().setPan({ x: 200, y: 250 });
    useTestStore.getState().resetViewport();
    expect(useTestStore.getState().zoom).toBe(1);
    expect(useTestStore.getState().pan).toEqual({ x: 0, y: 0 });
  });

  describe('Coordinate Transformations', () => {
    beforeEach(() => {
      useTestStore.setState({
        pan: { x: 100, y: 50 },
        zoom: 2,
        viewportSize: { width: 800, height: 600 },
      });
    });

    test('screenToCanvas correctly transforms coordinates', () => {
      const screenPoint = { x: 500, y: 450 };
      const canvasPoint = useTestStore.getState().screenToCanvas(screenPoint);
      // x = (500 - 400 - 100) / 2 = 0
      // y = (450 - 300 - 50) / 2 = 50
      expect(canvasPoint.x).toBe(0);
      expect(canvasPoint.y).toBe(50);
    });

    test('canvasToScreen correctly transforms coordinates', () => {
      const canvasPoint = { x: 150, y: 200 };
      const screenPoint = useTestStore.getState().canvasToScreen(canvasPoint);
      // x = 150 * 2 + 100 + 400 = 800
      // y = 200 * 2 + 50 + 300 = 750
      expect(screenPoint.x).toBe(800);
      expect(screenPoint.y).toBe(750);
    });
  });
});
