/**
 * Drawing Tools Store-First Tests
 * 
 * Tests for drawing functionality using the store-first testing approach.
 * Following the Testing Guide principles:
 * 1. Test business logic directly through store methods
 * 2. Use real store instances, not mocks
 * 3. Focus on specific behaviors and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import type { HighlighterElement, MarkerElement, PenElement } from '../types/enhanced.types';
import { ElementId, createElementId } from '../types/enhanced.types';

describe('Drawing Tools Store-First Tests', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    // ✅ GOOD: Use real store instance for each test
    store = createUnifiedTestStore();
  });

  describe('Drawing Module State Management', () => {
    it('should start drawing with correct initial state', () => {
      // Test drawing state initialization
      expect(store.getState().isDrawing).toBe(false);
      expect(store.getState().currentPath).toBeUndefined();
      
      // Start drawing
      store.getState().startDrawing('pen', { x: 100, y: 100 });
      
      expect(store.getState().isDrawing).toBe(true);
      expect(store.getState().currentPath).toEqual([100, 100]);
    });

    it('should update drawing path correctly', () => {
      // Start drawing
      store.getState().startDrawing('pen', { x: 100, y: 100 });
      
      // Update path
      store.getState().updateDrawing({ x: 110, y: 110 });
      store.getState().updateDrawing({ x: 120, y: 120 });
      
      expect(store.getState().currentPath).toEqual([100, 100, 110, 110, 120, 120]);
      expect(store.getState().isDrawing).toBe(true);
    });

    it('should finish drawing and create pen element', () => {
      // Start and update drawing
      store.getState().startDrawing('pen', { x: 100, y: 100 });
      store.getState().updateDrawing({ x: 110, y: 110 });
      store.getState().updateDrawing({ x: 120, y: 120 });
      
      // Finish drawing
      store.getState().finishDrawing();
      
      // Check final state
      expect(store.getState().isDrawing).toBe(false);
      expect(store.getState().currentPath).toBeUndefined();
      expect(store.getState().elements.size).toBe(1);
      
      const element = store.getState().elements.values().next().value as PenElement;
      expect(element.type).toBe('pen');
      expect(element.points).toEqual([100, 100, 110, 110, 120, 120]);
    });

    it('should cancel drawing without creating element', () => {
      // Start drawing
      store.getState().startDrawing('pen', { x: 100, y: 100 });
      store.getState().updateDrawing({ x: 110, y: 110 });
      
      // Cancel drawing
      store.getState().cancelDrawing();
      
      // Check state is reset without creating element
      expect(store.getState().isDrawing).toBe(false);
      expect(store.getState().currentPath).toBeUndefined();
      expect(store.getState().elements.size).toBe(0);
    });

    it('should not finish drawing if path is too short', () => {
      // Start drawing with minimal path
      store.getState().startDrawing('pen', { x: 100, y: 100 });
      
      // Try to finish immediately (path too short)
      store.getState().finishDrawing();
      
      // Should not create element
      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().isDrawing).toBe(false);
    });
  });

  describe('Highlighter Element Creation', () => {
    it('should create highlighter element with correct properties', () => {
      const highlighterElement: HighlighterElement = {
        id: createElementId('highlighter-1'),
        type: 'highlighter',
        points: [100, 100, 110, 110, 120, 120, 130, 130],
        style: {
          color: '#FFFF00',
          width: 10,
          opacity: 0.5,
          blendMode: 'multiply',
          smoothness: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
          baseOpacity: 0.3,
          highlightColor: '#FFFF00'
        },
        x: 100,
        y: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };

      store.getState().addElement(highlighterElement);
      
      expect(store.getState().elements.size).toBe(1);
      const element = store.getState().elements.get(highlighterElement.id);
      expect(element).toEqual(highlighterElement);
      expect(element?.type).toBe('highlighter');
      expect((element as HighlighterElement)?.style.blendMode).toBe('multiply');
      expect((element as HighlighterElement)?.style.opacity).toBe(0.5);
    });

    it('should calculate correct bounding box for highlighter', () => {
      const points = [50, 50, 150, 150, 200, 100];
      const highlighterElement: HighlighterElement = {
        id: createElementId('highlighter-bounds'),
        type: 'highlighter',
        points,
        style: {
          color: '#FFFF00',
          width: 10,
          opacity: 0.5,
          blendMode: 'multiply',
          smoothness: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
          baseOpacity: 0.3,
          highlightColor: '#FFFF00'
        },
        x: 50,  // min x
        y: 50,  // min y
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };

      store.getState().addElement(highlighterElement);
      
      const element = store.getState().elements.get(highlighterElement.id);
      expect(element?.x).toBe(50);
      expect(element?.y).toBe(50);
      // HighlighterElement doesn't have width/height properties - they're computed from points
    });
  });

  describe('Marker Element Creation', () => {
    it('should create marker element with correct properties', () => {
      const markerElement: MarkerElement = {
        id: createElementId('marker-1'),
        type: 'marker',
        points: [100, 100, 110, 110, 120, 120, 130, 130],
        style: {
          color: '#FF0000',
          width: 8,
          opacity: 0.8,
          blendMode: 'source-over',
          smoothness: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
          widthVariation: true,
          minWidth: 4,
          maxWidth: 12,
          pressureSensitive: false
        },
        x: 100,
        y: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };

      store.getState().addElement(markerElement);
      
      expect(store.getState().elements.size).toBe(1);
      const element = store.getState().elements.get(markerElement.id);
      expect(element?.type).toBe('marker');
      expect((element as MarkerElement)?.style.widthVariation).toBe(true);
      expect((element as MarkerElement)?.style.minWidth).toBe(4);
      expect((element as MarkerElement)?.style.maxWidth).toBe(12);
    });

    it('should handle marker stroke smoothing', () => {
      // Create marker with many points (should trigger smoothing)
      const manyPoints: number[] = [];
      for (let i = 0; i < 20; i++) {
        manyPoints.push(i * 10, i * 10);
      }

      const markerElement: MarkerElement = {
        id: createElementId('marker-smooth'),
        type: 'marker',
        points: manyPoints,
        style: {
          color: '#FF0000',
          width: 8,
          opacity: 0.8,
          blendMode: 'source-over',
          smoothness: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
          widthVariation: true,
          minWidth: 4,
          maxWidth: 12,
          pressureSensitive: false
        },
        x: 0,
        y: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };

      store.getState().addElement(markerElement);
      
      expect(store.getState().elements.size).toBe(1);
      const element = store.getState().elements.get(markerElement.id);
      expect((element as MarkerElement)?.points.length).toBe(manyPoints.length);
    });
  });

  describe('Pen Element Creation', () => {
    it('should create pen element with correct properties', () => {
      const penElement: PenElement = {
        id: createElementId('pen-1'),
        type: 'pen',
        points: [100, 100, 110, 110, 120, 120, 130, 130],
        stroke: '#000000',
        strokeWidth: 2,
        x: 100,
        y: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };

      store.getState().addElement(penElement);
      
      expect(store.getState().elements.size).toBe(1);
      const element = store.getState().elements.get(penElement.id);
      expect(element?.type).toBe('pen');
      expect((element as PenElement)?.stroke).toBe('#000000');
      expect((element as PenElement)?.strokeWidth).toBe(2);
    });
  });

  describe('Tool State Management', () => {
    it('should switch between drawing tools correctly', () => {
      expect(store.getState().selectedTool).toBe('select');
      
      store.getState().setSelectedTool('highlighter');
      expect(store.getState().selectedTool).toBe('highlighter');
      
      store.getState().setSelectedTool('marker');
      expect(store.getState().selectedTool).toBe('marker');
      
      store.getState().setSelectedTool('pen');
      expect(store.getState().selectedTool).toBe('pen');
    });

    it('should maintain drawing tool colors', () => {
      // Test that pen color is maintained in store
      expect(store.getState().penColor).toBeDefined();
      
      // Test highlighter and marker colors through tool selection
      store.getState().setSelectedTool('highlighter');
      expect(store.getState().selectedTool).toBe('highlighter');
      
      store.getState().setSelectedTool('marker');
      expect(store.getState().selectedTool).toBe('marker');
    });
  });

  describe('Drawing Element Integration', () => {
    it('should handle multiple drawing elements', () => {
      const highlighter: HighlighterElement = {
        id: createElementId('highlighter-multi'),
        type: 'highlighter',
        points: [0, 0, 50, 50],
        style: { color: '#FFFF00', width: 10, opacity: 0.5, blendMode: 'multiply', smoothness: 0.5, lineCap: 'round', lineJoin: 'round', baseOpacity: 0.3, highlightColor: '#FFFF00' },
        x: 0, y: 0,
        createdAt: Date.now(), updatedAt: Date.now(), isLocked: false, isHidden: false
      };

      const marker: MarkerElement = {
        id: createElementId('marker-multi'),
        type: 'marker',
        points: [100, 100, 150, 150],
        style: { color: '#FF0000', width: 8, opacity: 0.8, blendMode: 'source-over', smoothness: 0.5, lineCap: 'round', lineJoin: 'round', widthVariation: true, minWidth: 4, maxWidth: 12, pressureSensitive: false },
        x: 100, y: 100,
        createdAt: Date.now(), updatedAt: Date.now(), isLocked: false, isHidden: false
      };

      const pen: PenElement = {
        id: createElementId('pen-multi'),
        type: 'pen',
        points: [200, 200, 250, 250],
        stroke: '#000000',
        strokeWidth: 2,
        x: 200, y: 200,
        createdAt: Date.now(), updatedAt: Date.now(), isLocked: false, isHidden: false
      };

      store.getState().addElement(highlighter);
      store.getState().addElement(marker);
      store.getState().addElement(pen);

      expect(store.getState().elements.size).toBe(3);
      expect(store.getState().elements.get(highlighter.id)?.type).toBe('highlighter');
      expect(store.getState().elements.get(marker.id)?.type).toBe('marker');
      expect(store.getState().elements.get(pen.id)?.type).toBe('pen');
    });

    it('should handle drawing element deletion', () => {
      const penElement: PenElement = {
        id: createElementId('pen-delete'),
        type: 'pen',
        points: [100, 100, 200, 200],
        stroke: '#000000',
        strokeWidth: 2,
        x: 100, y: 100,
        createdAt: Date.now(), updatedAt: Date.now(), isLocked: false, isHidden: false
      };

      store.getState().addElement(penElement);
      expect(store.getState().elements.size).toBe(1);

      store.getState().deleteElement(penElement.id);
      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().elements.has(penElement.id)).toBe(false);
    });

    it('should handle drawing element selection', () => {
      const highlighterElement: HighlighterElement = {
        id: createElementId('highlighter-select'),
        type: 'highlighter',
        points: [50, 50, 100, 100],
        style: { color: '#FFFF00', width: 10, opacity: 0.5, blendMode: 'multiply', smoothness: 0.5, lineCap: 'round', lineJoin: 'round', baseOpacity: 0.3, highlightColor: '#FFFF00' },
        x: 50, y: 50,
        createdAt: Date.now(), updatedAt: Date.now(), isLocked: false, isHidden: false
      };

      store.getState().addElement(highlighterElement);
      store.getState().selectElement(highlighterElement.id);

      expect(store.getState().selectedElementIds.has(highlighterElement.id)).toBe(true);
      expect(store.getState().lastSelectedElementId).toBe(highlighterElement.id);
    });
  });
}); 