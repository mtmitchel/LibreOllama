import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnimationManager, EasingFunctions, type AnimationConfig, type AnimationStoreAdapter } from '../renderer/animation/AnimationManager';
import type { ElementId } from '../types/enhanced.types';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  },
  writable: true
});

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();
global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

// Mock Konva objects
const createMockStage = () => ({
  container: vi.fn(() => ({
    getBoundingClientRect: vi.fn(() => ({
      left: 10,
      top: 20,
      width: 800,
      height: 600
    }))
  }))
} as any);

const createMockNode = () => ({
  opacity: vi.fn(() => 1),
  scaleX: vi.fn(() => 1),
  scaleY: vi.fn(() => 1),
  x: vi.fn(() => 0),
  y: vi.fn(() => 0),
  getLayer: vi.fn(() => ({
    batchDraw: vi.fn()
  })),
  getAbsoluteTransform: vi.fn(() => ({
    point: vi.fn((coords: any) => coords)
  })),
  getClientRect: vi.fn(() => ({
    x: 100,
    y: 100,
    width: 200,
    height: 200
  }))
} as any);

// Mock Konva globally
global.Konva = {
  Tween: vi.fn(() => ({
    destroy: vi.fn()
  }))
} as any;

// Mock store adapter
class MockAnimationStoreAdapter implements AnimationStoreAdapter {
  updateElement = vi.fn();
  refreshTransformer = vi.fn();

  reset(): void {
    this.updateElement.mockClear();
    this.refreshTransformer.mockClear();
  }
}

describe('Animation System', () => {
  describe('AnimationManager', () => {
    let animationManager: AnimationManager;
    let mockStage: any;
    let mockNodeMap: Map<string, any>;
    let mockStoreAdapter: MockAnimationStoreAdapter;
    let config: AnimationConfig;
    let rafCallbacks: Array<() => void>;
    let rafId: number;

    beforeEach(() => {
      // Reset mocks
      mockPerformanceNow.mockReturnValue(0);
      mockRequestAnimationFrame.mockClear();
      mockCancelAnimationFrame.mockClear();

      // Track RAF callbacks
      rafCallbacks = [];
      rafId = 0;
      mockRequestAnimationFrame.mockImplementation((callback: () => void) => {
        rafCallbacks.push(callback);
        return ++rafId;
      });

      // Setup test objects
      mockStage = createMockStage();
      mockNodeMap = new Map();
      mockStoreAdapter = new MockAnimationStoreAdapter();

      config = {
        stage: mockStage,
        nodeMap: mockNodeMap,
        storeAdapter: mockStoreAdapter,
        getCurrentEditingId: vi.fn(() => null),
        getCurrentEditorWrapper: vi.fn(() => null),
        debug: { log: true }
      };

      animationManager = new AnimationManager(config);
    });

    afterEach(() => {
      animationManager.destroy();
      mockStoreAdapter.reset();
    });

    it('creates animation manager with proper initialization', () => {
      expect(animationManager).toBeDefined();
      expect(animationManager.getActiveTweenCount()).toBe(0);
    });

    describe('Circle Radius Tweening', () => {
      it('starts radius tween with correct parameters', () => {
        const elementId = 'circle-1' as ElementId;
        const fromRadius = 50;
        const toRadius = 100;
        const padWorld = 8;
        const strokeWidth = 2;
        const duration = 300;

        animationManager.tweenCircleRadius(elementId, fromRadius, toRadius, padWorld, strokeWidth, duration);

        expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
        expect(animationManager.getActiveTweenCount()).toBe(1);
        expect(animationManager.hasElementAnimations(elementId)).toBe(true);
      });

      it('updates store during radius animation', () => {
        const elementId = 'circle-1' as ElementId;
        
        // Start animation
        mockPerformanceNow.mockReturnValue(0);
        animationManager.tweenCircleRadius(elementId, 50, 100, 8, 2, 300);

        // Simulate animation frame at 50% progress
        mockPerformanceNow.mockReturnValue(150);
        const callback = rafCallbacks[0];
        callback();

        // Should update store with interpolated values
        expect(mockStoreAdapter.updateElement).toHaveBeenCalledWith(elementId, {
          radius: expect.any(Number),
          radiusX: expect.any(Number),
          radiusY: expect.any(Number),
          width: expect.any(Number),
          height: expect.any(Number)
        });

        // Should schedule next frame
        expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2);
      });

      it('completes radius animation and cleans up', () => {
        const elementId = 'circle-1' as ElementId;
        
        // Start animation
        mockPerformanceNow.mockReturnValue(0);
        animationManager.tweenCircleRadius(elementId, 50, 100, 8, 2, 300);
        expect(animationManager.getActiveTweenCount()).toBe(1);

        // Complete animation (100% progress)
        mockPerformanceNow.mockReturnValue(300);
        const callback = rafCallbacks[0];
        callback();

        // Should refresh transformer and clean up
        expect(mockStoreAdapter.refreshTransformer).toHaveBeenCalledWith(elementId);
        expect(animationManager.getActiveTweenCount()).toBe(0);
        expect(animationManager.hasElementAnimations(elementId)).toBe(false);
      });

      it('cancels existing radius tween when starting new one', () => {
        const elementId = 'circle-1' as ElementId;

        // Start first animation
        animationManager.tweenCircleRadius(elementId, 50, 75, 8, 2, 300);
        const firstRafId = rafId;

        // Start second animation for same element
        animationManager.tweenCircleRadius(elementId, 75, 100, 8, 2, 300);

        // Should cancel previous animation
        expect(mockCancelAnimationFrame).toHaveBeenCalledWith(firstRafId);
        expect(animationManager.getActiveTweenCount()).toBe(1);
      });

      it('synchronizes DOM overlay during radius animation', () => {
        const elementId = 'circle-1' as ElementId;
        const mockEditorWrapper = {
          style: {}
        };

        // Setup editing state
        config.getCurrentEditingId = vi.fn(() => elementId);
        config.getCurrentEditorWrapper = vi.fn(() => mockEditorWrapper as any);
        mockNodeMap.set(elementId, createMockNode());

        // Start animation
        mockPerformanceNow.mockReturnValue(0);
        animationManager.tweenCircleRadius(elementId, 50, 100, 8, 2, 300);

        // Execute animation frame
        mockPerformanceNow.mockReturnValue(150);
        const callback = rafCallbacks[0];
        callback();

        // Should update DOM overlay styles
        expect(mockEditorWrapper.style).toHaveProperty('left');
        expect(mockEditorWrapper.style).toHaveProperty('top');
        expect(mockEditorWrapper.style).toHaveProperty('width');
        expect(mockEditorWrapper.style).toHaveProperty('height');
      });

      it('uses custom easing function', () => {
        const elementId = 'circle-1' as ElementId;
        const customEasing = vi.fn(t => t * t); // Square easing

        animationManager.tweenCircleRadius(elementId, 50, 100, 8, 2, 300, customEasing);

        // Execute animation frame at 50% time progress
        mockPerformanceNow.mockReturnValue(150);
        const callback = rafCallbacks[0];
        callback();

        // Should call custom easing function
        expect(customEasing).toHaveBeenCalledWith(0.5);
      });
    });

    describe('Property Tweening', () => {
      it('tweens custom property with store updates', () => {
        const elementId = 'element-1' as ElementId;
        const property = 'rotation';
        const fromValue = 0;
        const toValue = 90;

        animationManager.tweenProperty(elementId, property, fromValue, toValue, 300);

        expect(animationManager.getActiveTweenCount()).toBe(1);

        // Execute animation frame
        mockPerformanceNow.mockReturnValue(150);
        const callback = rafCallbacks[0];
        callback();

        expect(mockStoreAdapter.updateElement).toHaveBeenCalledWith(elementId, {
          [property]: expect.any(Number)
        });
      });

      it('uses custom update and completion callbacks', () => {
        const elementId = 'element-1' as ElementId;
        const onUpdate = vi.fn();
        const onComplete = vi.fn();

        animationManager.tweenProperty(
          elementId,
          'opacity',
          0,
          1,
          300,
          EasingFunctions.linear,
          onUpdate,
          onComplete
        );

        // Execute animation frame (50% progress)
        mockPerformanceNow.mockReturnValue(150);
        rafCallbacks[0]();

        expect(onUpdate).toHaveBeenCalledWith(0.5, 0.5);
        expect(onComplete).not.toHaveBeenCalled();

        // Complete animation
        mockPerformanceNow.mockReturnValue(300);
        rafCallbacks[1]();

        expect(onComplete).toHaveBeenCalledWith(1);
      });

      it('cancels existing property tween when starting new one', () => {
        const elementId = 'element-1' as ElementId;
        const property = 'opacity';

        // Start first tween
        animationManager.tweenProperty(elementId, property, 0, 0.5, 300);
        const firstRafId = rafId;

        // Start second tween for same property
        animationManager.tweenProperty(elementId, property, 0.5, 1, 300);

        expect(mockCancelAnimationFrame).toHaveBeenCalledWith(firstRafId);
      });
    });

    describe('Convenience Animation Methods', () => {
      it('fades element in/out', () => {
        const elementId = 'element-1' as ElementId;
        const mockNode = createMockNode();
        mockNode.opacity.mockReturnValue(0);
        mockNodeMap.set(elementId, mockNode);

        animationManager.fadeElement(elementId, 1, 300);

        expect(animationManager.getActiveTweenCount()).toBe(1);

        // Execute animation frame
        mockPerformanceNow.mockReturnValue(150);
        rafCallbacks[0]();

        expect(mockNode.opacity).toHaveBeenCalled();
      });

      it('scales element smoothly', () => {
        const elementId = 'element-1' as ElementId;
        const mockNode = createMockNode();
        mockNodeMap.set(elementId, mockNode);

        animationManager.scaleElement(elementId, { x: 2, y: 2 }, 300);

        expect(animationManager.getActiveTweenCount()).toBe(2); // x and y scale tweens

        // Execute animation frames
        mockPerformanceNow.mockReturnValue(150);
        rafCallbacks.forEach(callback => callback());

        expect(mockNode.scaleX).toHaveBeenCalled();
        expect(mockNode.scaleY).toHaveBeenCalled();
      });

      it('moves element smoothly', () => {
        const elementId = 'element-1' as ElementId;
        const mockNode = createMockNode();
        mockNodeMap.set(elementId, mockNode);

        animationManager.moveElement(elementId, { x: 100, y: 200 }, 300);

        expect(animationManager.getActiveTweenCount()).toBe(2); // x and y position tweens

        // Execute animation frames
        mockPerformanceNow.mockReturnValue(150);
        rafCallbacks.forEach(callback => callback());

        expect(mockNode.x).toHaveBeenCalled();
        expect(mockNode.y).toHaveBeenCalled();
      });
    });

    describe('Animation Control', () => {
      it('cancels radius tween for specific element', () => {
        const elementId = 'circle-1' as ElementId;
        
        animationManager.tweenCircleRadius(elementId, 50, 100, 8, 2, 300);
        expect(animationManager.hasElementAnimations(elementId)).toBe(true);

        animationManager.cancelRadiusTween(elementId);
        
        expect(mockCancelAnimationFrame).toHaveBeenCalled();
        expect(animationManager.hasElementAnimations(elementId)).toBe(false);
      });

      it('cancels custom tween by key', () => {
        const elementId = 'element-1' as ElementId;
        
        animationManager.tweenProperty(elementId, 'opacity', 0, 1, 300);
        expect(animationManager.getActiveTweenCount()).toBe(1);

        animationManager.cancelCustomTween(`${elementId}_opacity`);
        
        expect(mockCancelAnimationFrame).toHaveBeenCalled();
        expect(animationManager.getActiveTweenCount()).toBe(0);
      });

      it('cancels all tweens for specific element', () => {
        const elementId = 'element-1' as ElementId;
        
        // Start multiple animations
        animationManager.tweenCircleRadius(elementId, 50, 100, 8, 2, 300);
        animationManager.tweenProperty(elementId, 'opacity', 0, 1, 300);
        animationManager.tweenProperty(elementId, 'rotation', 0, 90, 300);
        
        expect(animationManager.hasElementAnimations(elementId)).toBe(true);
        expect(animationManager.getActiveTweenCount()).toBe(3);

        animationManager.cancelElementTweens(elementId);
        
        expect(animationManager.hasElementAnimations(elementId)).toBe(false);
        expect(animationManager.getActiveTweenCount()).toBe(0);
      });

      it('cancels all active animations', () => {
        // Start animations for multiple elements
        animationManager.tweenCircleRadius('circle-1' as ElementId, 50, 100, 8, 2, 300);
        animationManager.tweenProperty('element-1' as ElementId, 'opacity', 0, 1, 300);
        
        // Add Konva tween
        const mockKonvaTween = { destroy: vi.fn() } as any;
        animationManager.addKonvaTween(mockKonvaTween);
        
        expect(animationManager.getActiveTweenCount()).toBe(3);

        animationManager.cancelAllAnimations();
        
        expect(animationManager.getActiveTweenCount()).toBe(0);
        expect(mockKonvaTween.destroy).toHaveBeenCalled();
      });
    });

    describe('Konva Tween Integration', () => {
      it('tracks external Konva tweens', () => {
        const mockTween = { destroy: vi.fn() } as any;
        
        expect(animationManager.getActiveTweenCount()).toBe(0);
        
        animationManager.addKonvaTween(mockTween);
        expect(animationManager.getActiveTweenCount()).toBe(1);
        
        animationManager.removeKonvaTween(mockTween);
        expect(animationManager.getActiveTweenCount()).toBe(0);
      });

      it('destroys Konva tweens on cleanup', () => {
        const mockTween = { destroy: vi.fn() } as any;
        
        animationManager.addKonvaTween(mockTween);
        animationManager.destroy();
        
        expect(mockTween.destroy).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('handles DOM overlay sync errors gracefully', () => {
        const elementId = 'circle-1' as ElementId;
        
        // Setup to cause error
        config.getCurrentEditingId = vi.fn(() => elementId);
        config.getCurrentEditorWrapper = vi.fn(() => {
          throw new Error('DOM error');
        });

        // Should not throw
        expect(() => {
          animationManager.tweenCircleRadius(elementId, 50, 100, 8, 2, 300);
          mockPerformanceNow.mockReturnValue(150);
          rafCallbacks[0]();
        }).not.toThrow();
      });

      it('handles RAF cancellation errors gracefully', () => {
        mockCancelAnimationFrame.mockImplementation(() => {
          throw new Error('RAF error');
        });

        const elementId = 'circle-1' as ElementId;
        animationManager.tweenCircleRadius(elementId, 50, 100, 8, 2, 300);

        // Should not throw
        expect(() => {
          animationManager.cancelRadiusTween(elementId);
        }).not.toThrow();
      });

      it('handles Konva tween destruction errors gracefully', () => {
        const mockTween = {
          destroy: vi.fn(() => {
            throw new Error('Konva error');
          })
        } as any;

        animationManager.addKonvaTween(mockTween);

        // Should not throw
        expect(() => {
          animationManager.destroy();
        }).not.toThrow();
      });
    });

    describe('Animation State', () => {
      it('tracks active tween count correctly', () => {
        expect(animationManager.getActiveTweenCount()).toBe(0);

        animationManager.tweenCircleRadius('circle-1' as ElementId, 50, 100, 8, 2, 300);
        expect(animationManager.getActiveTweenCount()).toBe(1);

        animationManager.tweenProperty('element-1' as ElementId, 'opacity', 0, 1, 300);
        expect(animationManager.getActiveTweenCount()).toBe(2);

        const mockTween = { destroy: vi.fn() } as any;
        animationManager.addKonvaTween(mockTween);
        expect(animationManager.getActiveTweenCount()).toBe(3);

        animationManager.cancelAllAnimations();
        expect(animationManager.getActiveTweenCount()).toBe(0);
      });

      it('correctly identifies element animations', () => {
        const elementId = 'element-1' as ElementId;
        
        expect(animationManager.hasElementAnimations(elementId)).toBe(false);

        animationManager.tweenProperty(elementId, 'opacity', 0, 1, 300);
        expect(animationManager.hasElementAnimations(elementId)).toBe(true);

        animationManager.cancelElementTweens(elementId);
        expect(animationManager.hasElementAnimations(elementId)).toBe(false);
      });
    });
  });

  describe('Easing Functions', () => {
    it('provides linear easing', () => {
      expect(EasingFunctions.linear(0)).toBe(0);
      expect(EasingFunctions.linear(0.5)).toBe(0.5);
      expect(EasingFunctions.linear(1)).toBe(1);
    });

    it('provides easeOut function', () => {
      expect(EasingFunctions.easeOut(0)).toBe(0);
      expect(EasingFunctions.easeOut(1)).toBe(1);
      expect(EasingFunctions.easeOut(0.5)).toBeCloseTo(0.75, 2);
    });

    it('provides easeIn function', () => {
      expect(EasingFunctions.easeIn(0)).toBe(0);
      expect(EasingFunctions.easeIn(1)).toBe(1);
      expect(EasingFunctions.easeIn(0.5)).toBe(0.25);
    });

    it('provides easeInOut function', () => {
      expect(EasingFunctions.easeInOut(0)).toBe(0);
      expect(EasingFunctions.easeInOut(1)).toBe(1);
      expect(EasingFunctions.easeInOut(0.5)).toBe(0.5);
    });

    it('provides cubic easing variants', () => {
      expect(EasingFunctions.easeOutCubic(0)).toBe(0);
      expect(EasingFunctions.easeOutCubic(1)).toBe(1);
      expect(EasingFunctions.easeInOutCubic(0)).toBe(0);
      expect(EasingFunctions.easeInOutCubic(1)).toBe(1);
    });

    it('provides special easing functions', () => {
      expect(EasingFunctions.bounce(0)).toBe(0);
      expect(EasingFunctions.elastic(0)).toBe(0);
      expect(EasingFunctions.elastic(1)).toBe(1);
    });
  });
});