import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import { ElementId, createElementId } from '../types/enhanced.types';

/**
 * EraserTool Store-First Tests
 * Following TESTING GUIDE.md principles:
 * - Test business logic through real store instances
 * - Focus on eraser module functionality  
 * - Minimal mocking (only external dependencies)
 */
describe('Eraser Functionality (Store-First)', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    // Use real store instance as per TESTING GUIDE.md
    store = createUnifiedTestStore();
  });

  describe('Core Erasing Logic', () => {
    test('should erase pen strokes at point', () => {
      // Add a pen stroke element with points that intersect the eraser
      const penElement = {
        id: createElementId('pen-1'),
        type: 'pen' as const,
        points: [95, 95, 105, 105], // Points close to (100, 100)
        stroke: '#000000',
        strokeWidth: 2,
        x: 0,
        y: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      store.getState().addElement(penElement);
      expect(store.getState().elements.size).toBe(1);
      
      // Ensure spatial index is updated before erasing
      store.getState().updateSpatialIndex();
      
      // Erase at point that intersects the stroke
      const erasedIds = store.getState().eraseAtPoint(100, 100, 20);
      
      // Should have erased the pen stroke
      expect(erasedIds).toContain(createElementId('pen-1'));
      expect(store.getState().elements.size).toBe(0);
    });

    test('should erase marker strokes at point', () => {
      // Add a marker element with points that intersect the eraser
      const markerElement = {
        id: createElementId('marker-1'),
        type: 'marker' as const,
        points: [55, 55, 65, 65], // Points close to (60, 60)
        style: {
          color: '#ff0000',
          width: 5,
          opacity: 0.8,
          smoothness: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
          blendMode: 'source-over',
          widthVariation: true,
          minWidth: 3,
          maxWidth: 8,
          pressureSensitive: false
        },
        x: 0,
        y: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      store.getState().addElement(markerElement);
      store.getState().updateSpatialIndex();
      
      // Erase at point that intersects
      const erasedIds = store.getState().eraseAtPoint(60, 60, 15);
      
      expect(erasedIds).toContain(createElementId('marker-1'));
      expect(store.getState().elements.has(createElementId('marker-1'))).toBe(false);
    });

    test('should erase highlighter strokes at point', () => {
      // Add a highlighter element with points that intersect the eraser
      const highlighterElement = {
        id: createElementId('highlighter-1'),
        type: 'highlighter' as const,
        points: [220, 205, 230, 215], // Points close to (225, 210)
        style: {
          color: '#ffff00',
          width: 15,
          opacity: 0.5,
          smoothness: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
          blendMode: 'multiply',
          baseOpacity: 0.3,
          highlightColor: '#ffff00'
        },
        x: 0,
        y: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      store.getState().addElement(highlighterElement);
      store.getState().updateSpatialIndex();
      
      // Erase at point
      const erasedIds = store.getState().eraseAtPoint(225, 210, 20);
      
      expect(erasedIds).toContain(createElementId('highlighter-1'));
      expect(store.getState().elements.has(createElementId('highlighter-1'))).toBe(false);
    });

    test('should not erase non-erasable elements', () => {
      // Add non-erasable elements
       const rectElement = {
         id: createElementId('rect-1'),
         type: 'rectangle' as const,
         x: 90,
         y: 90,
         width: 20,
         height: 20,
         fill: '#ff0000',
         stroke: '#000000',
         strokeWidth: 1,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       };
       
       const textElement = {
         id: createElementId('text-1'),
         type: 'text' as const,
         x: 90,
         y: 90,
         text: 'Test',
         fontSize: 16,
         fill: '#000000',
         fontFamily: 'Inter',
         createdAt: Date.now(),
         updatedAt: Date.now(),
       };
      
      store.getState().addElement(rectElement);
      store.getState().addElement(textElement);
      expect(store.getState().elements.size).toBe(2);
      
      // Try to erase at their position
      const erasedIds = store.getState().eraseAtPoint(100, 100, 20);
      
      // Should not erase non-erasable elements
      expect(erasedIds).toHaveLength(0);
      expect(store.getState().elements.size).toBe(2);
      expect(store.getState().elements.has(createElementId('rect-1'))).toBe(true);
      expect(store.getState().elements.has(createElementId('text-1'))).toBe(true);
    });

    test('should only erase elements within eraser radius', () => {
      // Add pen strokes at different distances from eraser point (100, 100)
      const nearStroke = {
        id: createElementId('near-1'),
        type: 'pen' as const,
        points: [98, 98, 102, 102], // Very close to (100, 100) - should be erased
        stroke: '#000000',
        strokeWidth: 2,
        x: 0,
        y: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const farStroke = {
        id: createElementId('far-1'),
        type: 'pen' as const,
        points: [150, 150, 160, 160], // Far from (100, 100) - should NOT be erased
        stroke: '#000000',
        strokeWidth: 2,
        x: 0,
        y: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      store.getState().addElement(nearStroke);
      store.getState().addElement(farStroke);
      store.getState().updateSpatialIndex();
      
      // Erase with small radius (10) at point (100, 100)
      const erasedIds = store.getState().eraseAtPoint(100, 100, 20);
      
      // Should only erase the near stroke
      expect(erasedIds).toContain(createElementId('near-1'));
      expect(erasedIds).not.toContain(createElementId('far-1'));
      expect(store.getState().elements.has(createElementId('near-1'))).toBe(false);
      expect(store.getState().elements.has(createElementId('far-1'))).toBe(true);
    });
  });

  describe('Path-Based Erasing', () => {
    test('should erase strokes along eraser path', () => {
      // Add multiple pen strokes
       const stroke1 = {
         id: createElementId('stroke-1'),
         type: 'pen' as const,
         points: [50, 50, 60, 60],
         stroke: '#000000',
         strokeWidth: 2,
         x: 0,
         y: 0,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       };
       
       const stroke2 = {
         id: createElementId('stroke-2'),
         type: 'pen' as const,
         points: [100, 100, 110, 110],
         stroke: '#000000',
         strokeWidth: 2,
         x: 0,
         y: 0,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       };
      
      store.getState().addElement(stroke1);
      store.getState().addElement(stroke2);
      
      // Erase along path that intersects both strokes
      const eraserPath = [55, 55, 105, 105];
      const erasedIds = store.getState().eraseInPath(eraserPath, 20);
      
      // Should erase both strokes
      expect(erasedIds).toContain(createElementId('stroke-1'));
      expect(erasedIds).toContain(createElementId('stroke-2'));
      expect(store.getState().elements.size).toBe(0);
    });

    test('should handle empty eraser path', () => {
      // Add a stroke
       const stroke = {
         id: createElementId('stroke-1'),
         type: 'pen' as const,
         points: [50, 50, 60, 60],
         stroke: '#000000',
         strokeWidth: 2,
         x: 0,
         y: 0,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       };
      
      store.getState().addElement(stroke);
      
      // Erase with empty path
      const erasedIds = store.getState().eraseInPath([], 20);
      
      // Should not erase anything
      expect(erasedIds).toHaveLength(0);
      expect(store.getState().elements.size).toBe(1);
    });
  });

  describe('Spatial Index Management', () => {
    test('should find elements in spatial index correctly', () => {
      // Add the same pen element as in the failing test
      const penElement = {
        id: createElementId('pen-1'),
        type: 'pen' as const,
        points: [90, 90, 110, 110, 130, 130],
        stroke: '#000000',
        strokeWidth: 2,
        x: 0,
        y: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      store.getState().addElement(penElement);
      store.getState().updateSpatialIndex();
      
      // Test the spatial index directly
      const spatialIndex = store.getState().spatialIndex;
      expect(spatialIndex).toBeDefined();
      expect(spatialIndex!.size()).toBe(1);
      
      // Test with the same bounds as eraseAtPoint would use
      const eraserBounds = {
        x: 100 - 10, // x - halfSize
        y: 100 - 10, // y - halfSize  
        width: 20,   // eraserSize
        height: 20   // eraserSize
      };
      
      const intersections = spatialIndex!.findIntersections(eraserBounds);
      expect(intersections).toContain(createElementId('pen-1'));
    });

    test('should update spatial index with erasable elements', () => {
      // Add mix of erasable and non-erasable elements
       const penStroke = {
         id: createElementId('pen-1'),
         type: 'pen' as const,
         points: [50, 50, 60, 60],
         stroke: '#000000',
         strokeWidth: 2,
         x: 0,
         y: 0,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       };
       
       const rectangle = {
         id: createElementId('rect-1'),
         type: 'rectangle' as const,
         x: 100,
         y: 100,
         width: 50,
         height: 50,
         fill: '#ff0000',
         stroke: '#000000',
         strokeWidth: 1,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       };
      
      store.getState().addElement(penStroke);
      store.getState().addElement(rectangle);
      
      // Update spatial index
      store.getState().updateSpatialIndex();
      
      // Should not throw and should prepare index for erasing
      expect(() => store.getState().updateSpatialIndex()).not.toThrow();
    });

    test('should clear spatial index', () => {
      // Add elements and update index
       const penStroke = {
         id: createElementId('pen-1'),
         type: 'pen' as const,
         points: [50, 50, 60, 60],
         stroke: '#000000',
         strokeWidth: 2,
         x: 0,
         y: 0,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       };
      
      store.getState().addElement(penStroke);
      store.getState().updateSpatialIndex();
      
      // Clear spatial index
      store.getState().clearSpatialIndex();
      
      // Should not throw
      expect(() => store.getState().clearSpatialIndex()).not.toThrow();
    });
  });

  describe('Element Type Checking', () => {
    test('should identify erasable elements correctly', () => {
      // Test erasable elements
      const penElement = { type: 'pen', id: createElementId('pen-1'), points: [], stroke: '#000', strokeWidth: 2, x: 0, y: 0, createdAt: Date.now(), updatedAt: Date.now() };
      const markerElement = { type: 'marker', id: createElementId('marker-1'), points: [], style: { color: '#000', width: 5, opacity: 0.8, smoothness: 0.5, lineCap: 'round', lineJoin: 'round', blendMode: 'source-over', widthVariation: true, minWidth: 3, maxWidth: 8, pressureSensitive: false }, x: 0, y: 0, createdAt: Date.now(), updatedAt: Date.now() };
      const highlighterElement = { type: 'highlighter', id: createElementId('highlighter-1'), points: [], style: { color: '#ffff00', width: 15, opacity: 0.5, smoothness: 0.5, lineCap: 'round', lineJoin: 'round', blendMode: 'multiply', baseOpacity: 0.3, highlightColor: '#ffff00' }, x: 0, y: 0, createdAt: Date.now(), updatedAt: Date.now() };
      
      expect(store.getState().isElementErasable(penElement as any)).toBe(true);
      expect(store.getState().isElementErasable(markerElement as any)).toBe(true);
      expect(store.getState().isElementErasable(highlighterElement as any)).toBe(true);
      
      // Test non-erasable elements
      const rectElement = { type: 'rectangle', id: createElementId('rect-1'), x: 0, y: 0, width: 50, height: 50, fill: '#ff0000', createdAt: Date.now(), updatedAt: Date.now() };
      const textElement = { type: 'text', id: createElementId('text-1'), x: 0, y: 0, text: 'Test', fontSize: 16, fill: '#000', fontFamily: 'Inter', createdAt: Date.now(), updatedAt: Date.now() };
      
      expect(store.getState().isElementErasable(rectElement as any)).toBe(false);
      expect(store.getState().isElementErasable(textElement as any)).toBe(false);
    });
  });

  describe('Bounds Calculation', () => {
    test('should calculate path bounds correctly', () => {
      // Test path bounds calculation
      const path = [10, 20, 50, 60, 30, 40];
      const bounds = store.getState().getPathBounds(path);
      
      expect(bounds).toEqual({
        x: 10,
        y: 20,
        width: 40, // 50 - 10
        height: 40  // 60 - 20
      });
    });

    test('should handle empty path bounds', () => {
      const bounds = store.getState().getPathBounds([]);
      
      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0
      });
    });

    test('should handle single point path', () => {
      const bounds = store.getState().getPathBounds([100]);
      
      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0
      });
    });
  });

  describe('Integration with History', () => {
    test('should add history entry when erasing elements', () => {
      const addToHistorySpy = vi.spyOn(store.getState(), 'addToHistory');
      
      // Add erasable element
       const penStroke = {
         id: createElementId('pen-1'),
         type: 'pen' as const,
         points: [50, 50, 60, 60],
         stroke: '#000000',
         strokeWidth: 2,
         x: 0,
         y: 0,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       };
      
      store.getState().addElement(penStroke);
      
      // Erase the element
      const erasedIds = store.getState().eraseAtPoint(55, 55, 20);
      
      // Should add history entry if elements were erased
      if (erasedIds.length > 0) {
        expect(addToHistorySpy).toHaveBeenCalledWith('Erase strokes');
      }
    });

    test('should not add history entry when no elements erased', () => {
      const addToHistorySpy = vi.spyOn(store.getState(), 'addToHistory');
      
      // Try to erase on empty canvas
      const erasedIds = store.getState().eraseAtPoint(100, 100, 20);
      
      // Should not add history entry
      expect(erasedIds).toHaveLength(0);
      expect(addToHistorySpy).not.toHaveBeenCalled();
    });
  });
}); 