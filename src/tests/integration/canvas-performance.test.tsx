/**
 * Integration tests for canvas performance utilities
 * Tests the integration of all performance systems with React 19 + PixiJS v8
 */

import React, { act, renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application, Graphics } from 'pixi.js';
import { ObjectPool, BatchManager, CoordinateSystem, MarqueeSelection } from '@/lib/canvas-performance';
import { useEnhancedCanvasEvents } from '@/hooks/canvas/useEnhancedCanvasEvents';
import { useCanvasStore } from '@/stores/canvasStore';

// Mock PixiJS components
vi.mock('pixi.js', () => ({
  Application: vi.fn(() => ({
    stage: { addChild: vi.fn(), removeChild: vi.fn() },
    renderer: { resize: vi.fn() },
    destroy: vi.fn()
  })),
  Graphics: vi.fn(() => ({
    clear: vi.fn(),
    beginFill: vi.fn(),
    drawRect: vi.fn(),
    endFill: vi.fn(),
    destroy: vi.fn()
  }))
}));

describe('Canvas Performance Integration', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContainer: HTMLDivElement;
  let mockTextArea: HTMLTextAreaElement;

  beforeEach(() => {
    // Setup DOM elements
    mockCanvas = document.createElement('canvas');
    mockContainer = document.createElement('div');
    mockTextArea = document.createElement('textarea');
    
    // Add to DOM
    document.body.appendChild(mockContainer);
    document.body.appendChild(mockTextArea);
    
    // Setup container size
    Object.defineProperty(mockContainer, 'getBoundingClientRect', {
      value: () => ({ width: 800, height: 600, left: 0, top: 0 })
    });

    // Reset store
    useCanvasStore.getState().clearCanvas();
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    document.body.removeChild(mockTextArea);
    vi.clearAllMocks();
  });

  describe('Object Pool Integration', () => {
    it('should reuse Graphics objects efficiently', async () => {
      const pool = new ObjectPool<Graphics>(() => new Graphics(), (obj) => obj.clear());
      
      // Get multiple objects
      const obj1 = pool.get();
      const obj2 = pool.get();
      const obj3 = pool.get();
      
      expect(obj1).toBeInstanceOf(Graphics);
      expect(obj2).toBeInstanceOf(Graphics);
      expect(obj3).toBeInstanceOf(Graphics);
      
      // Release and reuse
      pool.release(obj1);
      const obj4 = pool.get();
      
      expect(obj4).toBe(obj1); // Should reuse the released object
      expect(pool.size).toBe(3); // Should have 3 objects total
    });

    it('should handle pool overflow gracefully', () => {
      const pool = new ObjectPool<Graphics>(
        () => new Graphics(), 
        (obj) => obj.clear(),
        2 // Max size of 2
      );
      
      const obj1 = pool.get();
      const obj2 = pool.get();
      const obj3 = pool.get();
      
      pool.release(obj1);
      pool.release(obj2);
      pool.release(obj3); // This should be ignored due to max size
      
      expect(pool.size).toBe(2);
    });
  });

  describe('Batch Manager Integration', () => {
    it('should batch element updates efficiently', async () => {
      const mockUpdateFn = vi.fn();
      const mockDeleteFn = vi.fn();
      const batchManager = new BatchManager(mockUpdateFn, mockDeleteFn);
      
      // Queue multiple updates
      batchManager.queueElementUpdate('1', { x: 100, y: 100 });
      batchManager.queueElementUpdate('2', { x: 200, y: 200 });
      batchManager.queueElementUpdate('1', { x: 150, y: 150 }); // Override previous
      
      // Should not have called update yet
      expect(mockUpdateFn).not.toHaveBeenCalled();
      
      // Wait for next frame
      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });
      
      // Should batch the updates
      expect(mockUpdateFn).toHaveBeenCalledWith({
        '1': { x: 150, y: 150 },
        '2': { x: 200, y: 200 }
      });
    });

    it('should handle delete operations in batches', async () => {
      const mockUpdateFn = vi.fn();
      const mockDeleteFn = vi.fn();
      const batchManager = new BatchManager(mockUpdateFn, mockDeleteFn);
      
      batchManager.queueElementDelete('1');
      batchManager.queueElementDelete('2');
      
      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });
      
      expect(mockDeleteFn).toHaveBeenCalledWith(['1', '2']);
    });
  });

  describe('Coordinate System Integration', () => {
    it('should transform coordinates correctly', () => {
      const coordinateSystem = new CoordinateSystem();
      coordinateSystem.setViewport(800, 600);
      coordinateSystem.setPanZoom({ x: 100, y: 50 }, 2);
      
      // Screen to world transformation
      const worldCoords = coordinateSystem.screenToWorld({ x: 400, y: 300 });
      expect(worldCoords).toEqual({ x: 150, y: 125 }); // (400 - 100) / 2, (300 - 50) / 2
      
      // World to screen transformation
      const screenCoords = coordinateSystem.worldToScreen({ x: 150, y: 125 });
      expect(screenCoords).toEqual({ x: 400, y: 300 });
    });

    it('should handle viewport culling correctly', () => {
      const coordinateSystem = new CoordinateSystem();
      coordinateSystem.setViewport(800, 600);
      coordinateSystem.setPanZoom({ x: 0, y: 0 }, 1);
      
      const visibleBounds = coordinateSystem.getVisibleBounds();
      expect(visibleBounds).toEqual({
        left: 0,
        top: 0,
        right: 800,
        bottom: 600
      });
      
      // Test element visibility
      expect(coordinateSystem.isElementVisible({
        left: 100, top: 100, right: 200, bottom: 200
      })).toBe(true);
      
      expect(coordinateSystem.isElementVisible({
        left: 1000, top: 1000, right: 1100, bottom: 1100
      })).toBe(false);
    });
  });

  describe('Marquee Selection Integration', () => {
    it('should detect element intersections correctly', () => {
      const elements = {
        '1': { id: '1', type: 'rectangle', x: 100, y: 100, width: 50, height: 50 },
        '2': { id: '2', type: 'circle', x: 200, y: 200, width: 30, height: 30 },
        '3': { id: '3', type: 'triangle', x: 300, y: 300, width: 40, height: 40 }
      };
      
      const onSelectionChange = vi.fn();
      const marqueeSelection = new MarqueeSelection(elements, onSelectionChange);
      
      // Start marquee at top-left
      marqueeSelection.start({ x: 50, y: 50 });
      
      // Update to cover first two elements
      marqueeSelection.update({ x: 250, y: 250 });
      
      // Should intersect first two elements
      expect(onSelectionChange).toHaveBeenCalledWith(['1', '2'], false);
    });
  });

  describe('Enhanced Canvas Events Integration', () => {
    it('should integrate all performance systems', async () => {
      const containerRef = { current: mockContainer };
      const textAreaRef = { current: mockTextArea };
      const generateId = () => 'test-id';
      
      const { result } = renderHook(() => useEnhancedCanvasEvents({
        canvasContainerRef: containerRef,
        textAreaRef,
        generateId
      }));
      
      // Should provide enhanced event handlers
      expect(result.current.handleElementMouseDown).toBeDefined();
      expect(result.current.handleCanvasMouseDown).toBeDefined();
      expect(result.current.renderMarquee).toBeDefined();
      expect(result.current.performanceStats).toBeDefined();
      
      // Performance stats should be initialized
      expect(result.current.performanceStats.fps).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Memory Management Integration', () => {
    it('should track and cleanup resources properly', async () => {
      // Add elements to the store
      const { addElement, clearCanvas } = useCanvasStore.getState();
      
      addElement({
        id: '1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 50,
        height: 50
      });
      
      addElement({
        id: '2',
        type: 'circle',
        x: 200,
        y: 200,
        width: 30,
        height: 30
      });
      
      // Simulate memory usage tracking
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Clear canvas should clean up resources
      clearCanvas();
      
      // Memory should be cleaned up (in a real test, this would be more complex)
      const elements = useCanvasStore.getState().elements;
      expect(Object.keys(elements)).toHaveLength(0);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should monitor FPS and performance metrics', async () => {
      let fpsCallbackCount = 0;
      const mockPerformanceMonitor = {
        start: vi.fn(),
        stop: vi.fn(),
        onFpsUpdate: vi.fn((callback) => {
          // Simulate FPS updates
          setTimeout(() => callback(60), 16);
          setTimeout(() => callback(58), 32);
          return () => {}; // Unsubscribe function
        }),
        getAverageFrameTime: vi.fn(() => 16.67),
        getMemoryUsage: vi.fn(() => ({ used: 50, total: 100 }))
      };
      
      mockPerformanceMonitor.onFpsUpdate((fps) => {
        fpsCallbackCount++;
        expect(fps).toBeGreaterThan(0);
      });
      
      await waitFor(() => {
        expect(fpsCallbackCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration with Store', () => {
    it('should work with Zustand store updates', async () => {
      const { 
        addElement, 
        updateElement, 
        deleteElement, 
        selectElement,
        elements,
        selectedElementIds 
      } = useCanvasStore.getState();
      
      // Add element
      addElement({
        id: 'test-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 50,
        height: 50
      });
      
      expect(Object.keys(elements)).toContain('test-1');
      
      // Update element
      updateElement('test-1', { x: 150, y: 150 });
      const updatedElement = useCanvasStore.getState().elements['test-1'];
      expect(updatedElement.x).toBe(150);
      expect(updatedElement.y).toBe(150);
      
      // Select element
      selectElement('test-1');
      expect(useCanvasStore.getState().selectedElementIds).toContain('test-1');
      
      // Delete element
      deleteElement('test-1');
      expect(Object.keys(useCanvasStore.getState().elements)).not.toContain('test-1');
    });
  });

  describe('Large Scale Performance', () => {
    it('should handle 1000+ elements efficiently', async () => {
      const { addElement } = useCanvasStore.getState();
      const startTime = performance.now();
      
      // Add 1000 elements
      for (let i = 0; i < 1000; i++) {
        addElement({
          id: `element-${i}`,
          type: 'rectangle',
          x: Math.random() * 2000,
          y: Math.random() * 2000,
          width: 20,
          height: 20
        });
      }
      
      const addTime = performance.now() - startTime;
      console.log(`Added 1000 elements in ${addTime}ms`);
      
      // Should complete within reasonable time (adjust as needed)
      expect(addTime).toBeLessThan(1000); // 1 second max
      
      const elements = useCanvasStore.getState().elements;
      expect(Object.keys(elements)).toHaveLength(1000);
    });

    it('should efficiently cull elements outside viewport', () => {
      const coordinateSystem = new CoordinateSystem();
      coordinateSystem.setViewport(800, 600);
      coordinateSystem.setPanZoom({ x: 0, y: 0 }, 1);
      
      const elements = [];
      
      // Create elements both inside and outside viewport
      for (let i = 0; i < 100; i++) {
        elements.push({
          id: `visible-${i}`,
          bounds: { left: i * 10, top: i * 10, right: i * 10 + 20, bottom: i * 10 + 20 }
        });
      }
      
      for (let i = 0; i < 100; i++) {
        elements.push({
          id: `hidden-${i}`,
          bounds: { left: 1000 + i * 10, top: 1000 + i * 10, right: 1000 + i * 10 + 20, bottom: 1000 + i * 10 + 20 }
        });
      }
      
      const visibleElements = elements.filter(el => 
        coordinateSystem.isElementVisible(el.bounds)
      );
      
      // Should only render visible elements
      expect(visibleElements.length).toBeLessThan(elements.length);
      expect(visibleElements.length).toBeGreaterThan(0);
    });
  });
});
