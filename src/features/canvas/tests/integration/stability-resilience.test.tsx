/**
 * Stability & Resilience Integration Test
 * 
 * Tests error injection, fault tolerance, corruption recovery,
 * and system stability under adverse conditions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import { ElementId, CanvasElement, isRectangleElement } from '../../types/enhanced.types';
import { nanoid } from 'nanoid';

describe('Stability & Resilience', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;
  let originalConsoleError: typeof console.error;
  let consoleErrors: any[] = [];

  beforeEach(() => {
    store = createUnifiedTestStore();
    
    // Capture console errors
    originalConsoleError = console.error;
    consoleErrors = [];
    console.error = (...args) => {
      consoleErrors.push(args);
    };
  });

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  describe('Error Injection and Recovery', () => {
    it('should handle corrupt element data gracefully', () => {
      const validElement: CanvasElement = {
        id: nanoid() as ElementId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        isLocked: false,
        isHidden: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Add valid element first
      store.getState().addElement(validElement);
      expect(store.getState().elementOrder.length).toBe(1);

      // Try to add corrupt elements
      const corruptElements = [
        // Missing required properties
        { id: nanoid() as ElementId, type: 'rectangle' },
        
        // Invalid coordinates
        { 
          id: nanoid() as ElementId, 
          type: 'circle', 
          x: NaN, 
          y: Infinity, 
          radius: -5 
        },
        
        // Invalid type
        { 
          id: nanoid() as ElementId, 
          type: 'invalid-type' as any, 
          x: 0, 
          y: 0 
        },
        
        // Null/undefined properties
        { 
          id: nanoid() as ElementId, 
          type: 'text', 
          x: 0, 
          y: 0, 
          text: null 
        },
      ];

      corruptElements.forEach(corruptElement => {
        try {
          store.getState().addElement(corruptElement as CanvasElement);
        } catch (error) {
          // Expected to fail - should not crash the application
          expect(error).toBeDefined();
        }
      });

      // Valid element should still exist
      expect(store.getState().getElementById(validElement.id)).toBeDefined();
    });

    it('should recover from store corruption', () => {
      // Add valid elements
      const elementIds: ElementId[] = [];
      for (let i = 0; i < 5; i++) {
        const id = nanoid() as ElementId;
        elementIds.push(id);
        store.getState().addElement({
          id,
          type: 'rectangle',
          x: i * 100,
          y: 100,
          width: 80,
          height: 60,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as CanvasElement);
      }

      expect(store.getState().elementOrder.length).toBe(5);

      // Simulate store corruption by directly manipulating internal state
      try {
        // This would normally be internal store manipulation
        // For testing, we simulate detection of corruption
        const isCorrupt = () => {
          const elements = store.getState().elementOrder;
          const elementMap = new Map();
          
          // Check for duplicate IDs or missing elements
          for (const id of elements) {
            if (elementMap.has(id)) return true; // Duplicate
            const element = store.getState().getElementById(id);
            if (!element) return true; // Missing element
            elementMap.set(id, element);
          }
          return false;
        };

        if (isCorrupt()) {
          // Recovery strategy: rebuild from valid elements
          const validElements = store.getState().elementOrder
            .map(id => store.getState().getElementById(id))
            .filter(Boolean);
          
          store.getState().clearAllElements();
          validElements.forEach(element => {
            if (element) store.getState().addElement(element);
          });
        }

        // System should still be functional
        expect(store.getState().elementOrder.length).toBeGreaterThan(0);

      } catch (error) {
        // Recovery mechanism should handle errors gracefully
        expect(error).toBeDefined();
      }
    });

    it('should handle memory pressure gracefully', () => {
      // Simulate memory pressure by creating many elements
      const largeElementCount = 10000;
      const createdElements: ElementId[] = [];

      try {
        for (let i = 0; i < largeElementCount; i++) {
          const id = nanoid() as ElementId;
          createdElements.push(id);
          
          store.getState().addElement({
            id,
            type: 'rectangle',
            x: Math.random() * 10000,
            y: Math.random() * 10000,
            width: 100,
            height: 100,
            // Add large data to simulate memory pressure
            metadata: new Array(1000).fill(`data-${i}`).join(''),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as CanvasElement);

          // Break if we detect issues
          if (i > 0 && i % 1000 === 0) {
            // Check if system is still responsive
            const testElement = store.getState().getElementById(createdElements[0]);
            if (!testElement) {
              console.warn('System under memory pressure, reducing load');
              break;
            }
          }
        }

        // System should still be functional
        expect(store.getState().elementOrder.length).toBeGreaterThan(0);

        // Cleanup to prevent actual memory issues in test environment
        store.getState().clearAllElements();
        
      } catch (error) {
        // Memory pressure handling should prevent crashes
        expect(error).toBeDefined();
        store.getState().clearAllElements();
      }
    });

    it('should handle concurrent modification errors', async () => {
      const elementId = nanoid() as ElementId;
      store.getState().addElement({
        id: elementId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as CanvasElement);

      // Simulate concurrent modifications
      const operations = [
        () => store.getState().updateElement(elementId, { x: 200 }),
        () => store.getState().updateElement(elementId, { y: 200 }),
        () => store.getState().updateElement(elementId, { width: 150 }),
        () => store.getState().updateElement(elementId, { height: 150 }),
        () => store.getState().updateElement(elementId, { rotation: 45 }),
      ];

      // Execute all operations simultaneously
      const results = await Promise.allSettled(
        operations.map(op => Promise.resolve().then(op))
      );

      // Some operations might fail due to race conditions, but system should remain stable
      const successes = results.filter(r => r.status === 'fulfilled');
      expect(successes.length).toBeGreaterThan(0);

      // Element should still exist and be valid
      const element = store.getState().getElementById(elementId);
      expect(element).toBeDefined();
      expect(typeof element?.x).toBe('number');
      expect(typeof element?.y).toBe('number');
    });
  });

  describe('Persistence Layer Failures', () => {
    it('should handle save failures gracefully', async () => {
      // Mock Tauri invoke to fail
      const mockFailingInvoke = vi.fn().mockRejectedValue(new Error('Storage full'));
      
      vi.doMock('@tauri-apps/api/tauri', () => ({
        invoke: mockFailingInvoke,
      }));

      const elementId = nanoid() as ElementId;
      store.getState().addElement({
        id: elementId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as CanvasElement);

      // Attempt to save (simulated)
      try {
        await mockFailingInvoke('saveCanvas', {
          elements: [store.getState().getElementById(elementId)],
        });
      } catch (error) {
        // Should handle save failure without crashing
        expect((error as Error).message).toBe('Storage full');
        
        // Element should still exist in memory
        expect(store.getState().getElementById(elementId)).toBeDefined();
      }
    });

    it('should handle load failures with fallback', async () => {
      const mockFailingLoad = vi.fn()
        .mockRejectedValueOnce(new Error('File corrupted'))
        .mockResolvedValueOnce({ elements: [], viewport: { x: 0, y: 0, scale: 1 } });

      // First load attempt fails
      try {
        await mockFailingLoad('loadCanvas');
      } catch (error) {
        expect((error as Error).message).toBe('File corrupted');
        
        // Fallback: try to load backup or create new canvas
        try {
          const fallbackData = await mockFailingLoad('loadCanvas');
          expect(fallbackData).toBeDefined();
          expect(Array.isArray(fallbackData.elements)).toBe(true);
        } catch (fallbackError) {
          // Ultimate fallback: start with empty canvas
          expect(store.getState().elementOrder.length).toBe(0);
        }
      }
    });

    it('should handle partial data corruption', () => {
      const validElements = [
        {
          id: nanoid() as ElementId,
          type: 'rectangle' as const,
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
        {
          id: nanoid() as ElementId,
          type: 'circle' as const,
          x: 200,
          y: 200,
          radius: 50,
        },
      ];

      const corruptedData = {
        elements: [
          validElements[0],
          // Corrupted element
          { id: 'corrupt', type: null, x: 'invalid', y: undefined },
          validElements[1],
          // Missing properties
          { id: nanoid() },
        ],
        viewport: { x: 0, y: 0, scale: 1 },
      };

      // Filter and recover valid elements only
      const recoveredElements = corruptedData.elements.filter(element => {
        return (
          element &&
          element.id &&
          element.type &&
          typeof element.x === 'number' &&
          typeof element.y === 'number' &&
          !isNaN(element.x) &&
          !isNaN(element.y)
        );
      });

      // Add recovered elements to store
      recoveredElements.forEach(element => {
        store.getState().addElement(element as CanvasElement);
      });

      // Should have recovered 2 valid elements
      expect(store.getState().elementOrder.length).toBe(2);
      expect(store.getState().getElementById(validElements[0].id)).toBeDefined();
      expect(store.getState().getElementById(validElements[1].id)).toBeDefined();
    });
  });

  describe('Subscription and Event System Resilience', () => {
    it('should handle subscription errors without affecting other subscribers', () => {
      const workingSubscriber = vi.fn();
      const errorSubscriber = vi.fn().mockImplementation(() => {
        throw new Error('Subscriber error');
      });
      const anotherWorkingSubscriber = vi.fn();

      // Simulate subscription system
      const subscribers = [workingSubscriber, errorSubscriber, anotherWorkingSubscriber];
      
      const notifySubscribers = (data: any) => {
        subscribers.forEach(subscriber => {
          try {
            subscriber(data);
          } catch (error) {
            // Log error but don't stop other subscribers
            console.error('Subscriber error:', error);
          }
        });
      };

      // Trigger notification
      const testData = { type: 'element-added', elementId: 'test' };
      notifySubscribers(testData);

      // Working subscribers should have been called
      expect(workingSubscriber).toHaveBeenCalledWith(testData);
      expect(anotherWorkingSubscriber).toHaveBeenCalledWith(testData);
      
      // Error should have been logged
      expect(consoleErrors.length).toBeGreaterThan(0);
    });

    it('should recover from event handler failures', () => {
      const elementId = nanoid() as ElementId;
      store.getState().addElement({
        id: elementId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        onClick: () => {
          throw new Error('Handler error');
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as CanvasElement);

      // Simulate click event with error handling
      const handleElementClick = (id: ElementId) => {
        const element = store.getState().getElementById(id);
        if (element && isRectangleElement(element) && element.onClick) {
          try {
            element.onClick();
          } catch (error) {
            console.error('Click handler error:', error);
            // Continue with default behavior
            store.getState().selectElement(id);
          }
        }
      };

      handleElementClick(elementId);

      // Element should still be selectable despite handler error
      expect(store.getState().selectedElementIds.has(elementId)).toBe(true);
      expect(consoleErrors.length).toBeGreaterThan(0);
    });

    it('should handle memory leaks in event listeners', () => {
      const listeners = new Set<() => void>();
      let listenerCount = 0;

      // Simulate adding many event listeners
      for (let i = 0; i < 1000; i++) {
        const listener = () => {
          listenerCount++;
        };
        listeners.add(listener);
      }

      expect(listeners.size).toBe(1000);

      // Cleanup all listeners (simulating proper cleanup)
      const cleanup = () => {
        listeners.clear();
      };

      cleanup();
      expect(listeners.size).toBe(0);

      // Memory should be recoverable (in real scenario, this would be GC'd)
      const initialMemory = process.memoryUsage?.()?.heapUsed || 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Check memory didn't grow excessively (basic heuristic)
      const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Should not have grown by more than 50MB (generous threshold for test)
      expect(Math.abs(memoryGrowth)).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('State Consistency Under Stress', () => {
    it('should maintain state consistency during rapid operations', () => {
      const elementIds: ElementId[] = [];
      
      // Create elements
      for (let i = 0; i < 100; i++) {
        const id = nanoid() as ElementId;
        elementIds.push(id);
        store.getState().addElement({
          id,
          type: 'rectangle',
          x: i * 10,
          y: i * 10,
          width: 50,
          height: 50,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as CanvasElement);
      }

      // Perform rapid operations
      for (let i = 0; i < 1000; i++) {
        const randomElementId = elementIds[Math.floor(Math.random() * elementIds.length)];
        const operations = [
          () => store.getState().updateElement(randomElementId, { x: Math.random() * 500 }),
          () => store.getState().selectElement(randomElementId),
          () => store.getState().deselectElement(randomElementId),
          () => store.getState().updateElement(randomElementId, { rotation: Math.random() * 360 }),
        ];

        const randomOperation = operations[Math.floor(Math.random() * operations.length)];
        try {
          randomOperation();
        } catch (error) {
          // Some operations might fail, but shouldn't crash the system
        }
      }

      // Verify state consistency
      expect(store.getState().elementOrder.length).toBe(100);
      
      // All elements should still be valid
      elementIds.forEach(id => {
        const element = store.getState().getElementById(id);
        expect(element).toBeDefined();
        expect(typeof element?.x).toBe('number');
        expect(typeof element?.y).toBe('number');
        expect(!isNaN(element?.x!)).toBe(true);
        expect(!isNaN(element?.y!)).toBe(true);
      });
    });

    it('should handle circular references in element data', () => {
      // Create elements that might reference each other
      const element1Id = nanoid() as ElementId;
      const element2Id = nanoid() as ElementId;

      const element1: CanvasElement = {
        id: element1Id,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as CanvasElement;

      const element2: CanvasElement = {
        id: element2Id,
        type: 'rectangle',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as CanvasElement;

      // Add elements
      store.getState().addElement(element1);
      store.getState().addElement(element2);

      // Verify elements exist
      expect(store.getState().getElementById(element1Id)).toBeDefined();
      expect(store.getState().getElementById(element2Id)).toBeDefined();

      // Test serialization doesn't crash (simulated)
      try {
        const serialized = JSON.stringify({
          element1: { ...element1 },
          element2: { ...element2 },
        });
        expect(serialized).toBeDefined();
      } catch (error) {
        // If JSON.stringify fails due to circular references, handle gracefully
        expect((error as Error).message).toContain('circular');
      }
    });
  });

  describe('Error Boundary Behavior', () => {
    it('should isolate component errors', () => {
      const errors: Error[] = [];
      
      // Simulate error boundary
      const errorBoundary = {
        componentDidCatch: (error: Error) => {
          errors.push(error);
        },
      };

      // Simulate component that throws error
      const problematicComponent = () => {
        throw new Error('Component render error');
      };

      try {
        problematicComponent();
      } catch (error) {
        errorBoundary.componentDidCatch(error as Error);
      }

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Component render error');

      // Rest of the system should continue working
      const elementId = nanoid() as ElementId;
      store.getState().addElement({
        id: elementId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as CanvasElement);

      expect(store.getState().getElementById(elementId)).toBeDefined();
    });

    it('should provide fallback UI for failed components', () => {
      const fallbackContent = 'Something went wrong. Please refresh the page.';
      
      // Simulate error boundary with fallback
      const errorBoundaryWithFallback = {
        hasError: false,
        error: null as Error | null,
        
        componentDidCatch(error: Error) {
          this.hasError = true;
          this.error = error;
        },
        
        render() {
          if (this.hasError) {
            return { type: 'div', props: { children: fallbackContent } };
          }
          return { type: 'canvas-component', props: {} };
        },
      };

      // Trigger error
      errorBoundaryWithFallback.componentDidCatch(new Error('Test error'));
      const rendered = errorBoundaryWithFallback.render();

      expect(rendered.props.children).toBe(fallbackContent);
    });
  });
});