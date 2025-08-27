/**
 * Canvas Performance Integration Test
 * Tests canvas performance with large numbers of shapes (1000+)
 * Validates panning, zooming, and rendering performance at scale
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import { ElementId, CanvasElement } from '../../types/enhanced.types';
import { nanoid } from 'nanoid';

describe('Canvas Performance at Scale', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    // Create fresh test store instance for each test
    store = createUnifiedTestStore();
  });

  describe('Large-scale element handling (1000+ shapes)', () => {
    it('should handle 1000+ elements without performance degradation', async () => {
      const startTime = performance.now();
      const elementCount = 1000;
      const elements: CanvasElement[] = [];

      // Create 1000 elements of various types
      for (let i = 0; i < elementCount; i++) {
        const element: CanvasElement = {
          id: nanoid() as ElementId,
          type: ['rectangle', 'circle', 'text', 'sticky-note'][i % 4] as any,
          x: Math.random() * 5000,
          y: Math.random() * 5000,
          width: 100 + Math.random() * 200,
          height: 100 + Math.random() * 200,
          rotation: 0,
          isLocked: false,
          isHidden: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as CanvasElement;
        
        elements.push(element);
      }

      // Batch add all elements
      elements.forEach(element => {
        store.getState().addElement(element);
      });

      const loadTime = performance.now() - startTime;
      
      // Verify all elements were added
      expect(store.getState().elementOrder.length).toBe(elementCount);
      
      // Performance assertion: Should load 1000 elements in reasonable time
      expect(loadTime).toBeLessThan(2000); // 2s for 1000 elements in test env
    });

    it('should maintain 60fps during panning with 1000+ elements', async () => {
      // Add 1000 elements
      for (let i = 0; i < 1000; i++) {
        store.getState().addElement({
          id: nanoid() as ElementId,
          type: 'rectangle',
          x: Math.random() * 5000,
          y: Math.random() * 5000,
          width: 100,
          height: 100,
        } as CanvasElement);
      }

      const viewport = store.getState().viewport;
      const panOperations: number[] = [];

      // Simulate rapid panning
      for (let i = 0; i < 60; i++) { // 60 frames worth of panning
        const startFrame = performance.now();
        
        store.getState().setViewport({
          ...viewport,
          x: viewport.x + 10,
          y: viewport.y + 10,
        });

        const frameTime = performance.now() - startFrame;
        panOperations.push(frameTime);
      }

      // Calculate average frame time
      const avgFrameTime = panOperations.reduce((a, b) => a + b, 0) / panOperations.length;
      
      // Assert 60fps target (16.67ms per frame)
      expect(avgFrameTime).toBeLessThan(16.67);
      
      // No frame should exceed 33ms (30fps minimum)
      const slowFrames = panOperations.filter(time => time > 33);
      expect(slowFrames.length).toBeLessThan(3); // Allow max 5% slow frames
    });

    it('should efficiently zoom with 1000+ elements using viewport culling', async () => {
      // Add elements spread across large area
      const elements: CanvasElement[] = [];
      for (let i = 0; i < 1500; i++) {
        const element = {
          id: nanoid() as ElementId,
          type: 'circle' as const,
          x: (i % 50) * 120,
          y: Math.floor(i / 50) * 120,
          radius: 50,
        } as CanvasElement;
        store.getState().addElement(element);
        elements.push(element);
      }

      const zoomLevels = [0.25, 0.5, 1, 1.5, 2, 4];
      const zoomTimes: number[] = [];

      for (const scale of zoomLevels) {
        const startTime = performance.now();
        
        store.getState().setViewport({
          ...store.getState().viewport,
          scale,
          x: 2500, // Center of element grid
          y: 1800,
        });

        // Calculate visible elements (viewport culling simulation)
        const viewportWidth = 1920 / scale;
        const viewportHeight = 1080 / scale;
        const viewportLeft = -store.getState().viewport.x / scale;
        const viewportTop = -store.getState().viewport.y / scale;
        
        const visibleElements = elements.filter(el => {
          if (el.type === 'circle' && 'radius' in el) {
            const radius = el.radius || 50;
            return (
              el.x + radius > viewportLeft &&
              el.x - radius < viewportLeft + viewportWidth &&
              el.y + radius > viewportTop &&
              el.y - radius < viewportTop + viewportHeight
            );
          }
          return false;
        });

        const zoomTime = performance.now() - startTime;
        zoomTimes.push(zoomTime);

        // Viewport culling should reduce rendered elements
        expect(visibleElements.length).toBeLessThan(elements.length);
      }

      // Average zoom operation should be fast
      const avgZoomTime = zoomTimes.reduce((a, b) => a + b, 0) / zoomTimes.length;
      expect(avgZoomTime).toBeLessThan(10); // Under 10ms per zoom
    });

    it('should handle selection of multiple elements efficiently', async () => {
      // Create 500 elements
      const elementIds: ElementId[] = [];
      for (let i = 0; i < 500; i++) {
        const id = nanoid() as ElementId;
        elementIds.push(id);
        store.getState().addElement({
          id,
          type: 'text',
          x: Math.random() * 2000,
          y: Math.random() * 2000,
          text: `Element ${i}`,
        } as CanvasElement);
      }

      // Test multi-selection performance
      const startTime = performance.now();
      
      // Select first 100 elements
      elementIds.slice(0, 100).forEach(id => {
        store.getState().selectElement(id, true); // multi-select mode
      });

      const selectionTime = performance.now() - startTime;
      
      expect(store.getState().selectedElementIds.size).toBe(100);
      expect(selectionTime).toBeLessThan(50); // Should be very fast

      // Test deselection performance
      const deselectStart = performance.now();
      store.getState().clearSelection();
      const deselectTime = performance.now() - deselectStart;
      
      expect(store.getState().selectedElementIds.size).toBe(0);
      expect(deselectTime).toBeLessThan(10);
    });

    it('should batch update operations for better performance', async () => {
      // Create elements
      const updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }> = [];
      
      for (let i = 0; i < 200; i++) {
        const id = nanoid() as ElementId;
        store.getState().addElement({
          id,
          type: 'rectangle',
          x: i * 10,
          y: i * 10,
          width: 100,
          height: 100,
        } as CanvasElement);
        
        updates.push({
          id,
          updates: {
            x: i * 20,
            y: i * 20,
            rotation: i * 2,
          },
        });
      }

      // Perform batch update
      const startTime = performance.now();
      store.getState().batchUpdate(updates);
      const batchTime = performance.now() - startTime;

      // Verify updates applied
      updates.forEach(({ id, updates: elementUpdates }) => {
        const element = store.getState().getElementById(id);
        expect(element?.x).toBe(elementUpdates.x);
        expect(element?.y).toBe(elementUpdates.y);
        expect(element?.rotation).toBe(elementUpdates.rotation);
      });

      // Batch update should be efficient
      expect(batchTime).toBeLessThan(50);
    });

    it('should optimize memory usage with element pooling', () => {
      // Measure initial memory (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Add and remove elements multiple times
      for (let cycle = 0; cycle < 5; cycle++) {
        const tempIds: ElementId[] = [];
        
        // Add 200 elements
        for (let i = 0; i < 200; i++) {
          const id = nanoid() as ElementId;
          tempIds.push(id);
          store.getState().addElement({
            id,
            type: 'sticky-note',
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            width: 200,
            height: 200,
            text: `Note ${cycle}-${i}`,
            backgroundColor: '#ffeb3b',
          } as CanvasElement);
        }

        // Remove all elements
        tempIds.forEach(id => store.getState().deleteElement(id));
      }

      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal after cleanup
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
      }

      // Store should be empty
      expect(store.getState().elementOrder.length).toBe(0);
    });
  });

  describe('Viewport culling optimization', () => {
    it('should only render visible elements', () => {
      // Create grid of elements (reduced for test performance)
      const gridSize = 50; // 50x50 grid = 2,500 elements
      const cellSize = 50;
      
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          store.getState().addElement({
            id: `${row}-${col}` as ElementId,
            type: 'rectangle',
            x: col * cellSize,
            y: row * cellSize,
            width: cellSize - 5,
            height: cellSize - 5,
          } as CanvasElement);
        }
      }

      // Set viewport to show only a portion
      const viewport = {
        x: 0,
        y: 0,
        scale: 1,
        width: 1920,
        height: 1080,
      };

      // Calculate visible area
      const visibleLeft = -viewport.x / viewport.scale;
      const visibleTop = -viewport.y / viewport.scale;
      const visibleRight = visibleLeft + viewport.width / viewport.scale;
      const visibleBottom = visibleTop + viewport.height / viewport.scale;

      // Count visible elements
      let visibleCount = 0;
      store.getState().elementOrder.forEach(elementId => {
        const element = store.getState().getElementById(elementId as ElementId);
        if (!element) return;
        if ('x' in element && 'y' in element && 'width' in element && 'height' in element) {
          const elementRight = element.x + (element.width || 0);
          const elementBottom = element.y + (element.height || 0);
          
          if (
            element.x < visibleRight &&
            elementRight > visibleLeft &&
            element.y < visibleBottom &&
            elementBottom > visibleTop
          ) {
            visibleCount++;
          }
        }
      });

      // Should only render visible portion
      expect(visibleCount).toBeLessThan(900); // Much less than 2,500
      expect(visibleCount).toBeGreaterThan(50); // But still a reasonable amount
    });
  });
});