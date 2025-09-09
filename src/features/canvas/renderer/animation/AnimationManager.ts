/**
 * Animation Manager
 * Handles smooth animations and tweens for canvas elements
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import type Konva from 'konva';
import type { ElementId } from '../../types/enhanced.types';

/**
 * Store adapter interface for animation integration
 */
export interface AnimationStoreAdapter {
  updateElement(id: ElementId, updates: Record<string, any>): void;
  refreshTransformer?(id: ElementId): void;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  stage: Konva.Stage;
  nodeMap: Map<string, Konva.Node>;
  storeAdapter: AnimationStoreAdapter;
  getCurrentEditingId?: () => string | null;
  getCurrentEditorWrapper?: () => HTMLDivElement | null;
  debug?: {
    log?: boolean;
    outlineOverlay?: boolean;
    zeroBaseline?: boolean;
  };
}

/**
 * Tween state and control interface
 */
export interface TweenState {
  id: string;
  startTime: number;
  duration: number;
  fromValue: number;
  toValue: number;
  rafId: number;
  cancel: () => void;
  onUpdate?: (value: number, progress: number) => void;
  onComplete?: (finalValue: number) => void;
}

/**
 * Easing function type
 */
export type EasingFunction = (t: number) => number;

/**
 * Built-in easing functions
 */
export const EasingFunctions = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 2),
  easeIn: (t: number) => t * t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
  elastic: (t: number) => {
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  }
};

/**
 * Animation Manager
 * Manages smooth animations and tweens for canvas elements
 */
export class AnimationManager {
  private config: AnimationConfig;
  private activeTweens = new Set<Konva.Tween>();
  private radiusTweens = new Map<string, TweenState>();
  private customTweens = new Map<string, TweenState>();

  constructor(config: AnimationConfig) {
    this.config = config;

    if (this.config.debug?.log) {
      console.info('[AnimationManager] Initialized animation system');
    }
  }

  /**
   * Smoothly tween a circle's radius with DOM overlay synchronization
   * @param elementId - Element ID to animate
   * @param fromRadius - Starting radius value
   * @param toRadius - Target radius value
   * @param padWorld - Padding in world coordinates
   * @param strokeWidth - Stroke width for calculations
   * @param durationMs - Animation duration in milliseconds
   * @param easing - Easing function to use
   */
  tweenCircleRadius(
    elementId: ElementId,
    fromRadius: number,
    toRadius: number,
    padWorld: number,
    strokeWidth: number,
    durationMs: number = 150,
    easing: EasingFunction = EasingFunctions.easeOut
  ): void {
    // Cancel existing tween for this element
    this.cancelRadiusTween(elementId);

    if (this.config.debug?.log) {
      console.info(`[AnimationManager] Starting radius tween for ${elementId}: ${fromRadius} → ${toRadius}`);
    }

    let rafId = 0;
    const startTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const progress = Math.min(1, (now - startTime) / durationMs);
      const easedProgress = easing(progress);
      const currentRadius = fromRadius + (toRadius - fromRadius) * easedProgress;

      // Update store with current radius values
      this.config.storeAdapter.updateElement(elementId, {
        radius: currentRadius,
        radiusX: currentRadius,
        radiusY: currentRadius,
        width: currentRadius * 2,
        height: currentRadius * 2
      });

      // Synchronize DOM overlay if element is being edited
      this.syncDOMOverlayForRadius(elementId, currentRadius, padWorld, strokeWidth);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Animation complete
        this.completeRadiusTween(elementId);
      }
    };

    rafId = requestAnimationFrame(tick);

    // Create tween state
    const tweenState: TweenState = {
      id: elementId,
      startTime,
      duration: durationMs,
      fromValue: fromRadius,
      toValue: toRadius,
      rafId,
      cancel: () => {
        try {
          cancelAnimationFrame(rafId);
        } catch (error) {
          console.warn('[AnimationManager] Failed to cancel radius tween:', error);
        }
      }
    };

    this.radiusTweens.set(elementId, tweenState);
  }

  /**
   * Create a custom property tween
   * @param elementId - Element ID to animate
   * @param property - Property name to animate
   * @param fromValue - Starting value
   * @param toValue - Target value
   * @param durationMs - Animation duration in milliseconds
   * @param easing - Easing function to use
   * @param onUpdate - Custom update callback
   * @param onComplete - Completion callback
   */
  tweenProperty(
    elementId: ElementId,
    property: string,
    fromValue: number,
    toValue: number,
    durationMs: number = 300,
    easing: EasingFunction = EasingFunctions.easeOut,
    onUpdate?: (value: number, progress: number) => void,
    onComplete?: (finalValue: number) => void
  ): void {
    const tweenKey = `${elementId}_${property}`;
    
    // Cancel existing tween for this property
    this.cancelCustomTween(tweenKey);

    if (this.config.debug?.log) {
      console.info(`[AnimationManager] Starting ${property} tween for ${elementId}: ${fromValue} → ${toValue}`);
    }

    let rafId = 0;
    const startTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const progress = Math.min(1, (now - startTime) / durationMs);
      const easedProgress = easing(progress);
      const currentValue = fromValue + (toValue - fromValue) * easedProgress;

      // Call custom update callback if provided
      if (onUpdate) {
        onUpdate(currentValue, progress);
      } else {
        // Default: update store
        this.config.storeAdapter.updateElement(elementId, {
          [property]: currentValue
        });
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Animation complete
        this.completeCustomTween(tweenKey);
        if (onComplete) {
          onComplete(toValue);
        }
      }
    };

    rafId = requestAnimationFrame(tick);

    // Create tween state
    const tweenState: TweenState = {
      id: tweenKey,
      startTime,
      duration: durationMs,
      fromValue,
      toValue,
      rafId,
      cancel: () => {
        try {
          cancelAnimationFrame(rafId);
        } catch (error) {
          console.warn(`[AnimationManager] Failed to cancel ${property} tween:`, error);
        }
      },
      onUpdate,
      onComplete
    };

    this.customTweens.set(tweenKey, tweenState);
  }

  /**
   * Fade element in or out
   */
  fadeElement(
    elementId: ElementId,
    toOpacity: number,
    durationMs: number = 300,
    easing: EasingFunction = EasingFunctions.easeOut
  ): void {
    const node = this.config.nodeMap.get(elementId);
    if (!node) return;

    const fromOpacity = node.opacity();
    this.tweenProperty(
      elementId,
      'opacity',
      fromOpacity,
      toOpacity,
      durationMs,
      easing,
      (opacity) => {
        node.opacity(opacity);
        node.getLayer()?.batchDraw();
      }
    );
  }

  /**
   * Scale element smoothly
   */
  scaleElement(
    elementId: ElementId,
    toScale: { x: number; y: number },
    durationMs: number = 300,
    easing: EasingFunction = EasingFunctions.easeOut
  ): void {
    const node = this.config.nodeMap.get(elementId);
    if (!node) return;

    const fromScaleX = node.scaleX();
    const fromScaleY = node.scaleY();

    // Tween both scale properties simultaneously
    this.tweenProperty(
      elementId,
      'scaleX',
      fromScaleX,
      toScale.x,
      durationMs,
      easing,
      (scaleX) => {
        node.scaleX(scaleX);
      }
    );

    this.tweenProperty(
      elementId,
      'scaleY',
      fromScaleY,
      toScale.y,
      durationMs,
      easing,
      (scaleY) => {
        node.scaleY(scaleY);
        node.getLayer()?.batchDraw();
      }
    );
  }

  /**
   * Move element smoothly
   */
  moveElement(
    elementId: ElementId,
    toPosition: { x: number; y: number },
    durationMs: number = 300,
    easing: EasingFunction = EasingFunctions.easeOut
  ): void {
    const node = this.config.nodeMap.get(elementId);
    if (!node) return;

    const fromX = node.x();
    const fromY = node.y();

    // Tween both position properties simultaneously
    this.tweenProperty(
      elementId,
      'x',
      fromX,
      toPosition.x,
      durationMs,
      easing,
      (x) => {
        node.x(x);
      }
    );

    this.tweenProperty(
      elementId,
      'y',
      fromY,
      toPosition.y,
      durationMs,
      easing,
      (y) => {
        node.y(y);
        node.getLayer()?.batchDraw();
      }
    );
  }

  /**
   * Cancel radius tween for specific element
   */
  cancelRadiusTween(elementId: ElementId): void {
    const tween = this.radiusTweens.get(elementId);
    if (tween) {
      tween.cancel();
      this.radiusTweens.delete(elementId);
      
      if (this.config.debug?.log) {
        console.info(`[AnimationManager] Cancelled radius tween for ${elementId}`);
      }
    }
  }

  /**
   * Cancel custom tween by key
   */
  cancelCustomTween(tweenKey: string): void {
    const tween = this.customTweens.get(tweenKey);
    if (tween) {
      tween.cancel();
      this.customTweens.delete(tweenKey);
      
      if (this.config.debug?.log) {
        console.info(`[AnimationManager] Cancelled custom tween: ${tweenKey}`);
      }
    }
  }

  /**
   * Cancel all tweens for a specific element
   */
  cancelElementTweens(elementId: ElementId): void {
    // Cancel radius tween
    this.cancelRadiusTween(elementId);

    // Cancel custom tweens for this element
    const elementTweenKeys = Array.from(this.customTweens.keys())
      .filter(key => key.startsWith(`${elementId}_`));
    
    elementTweenKeys.forEach(key => {
      this.cancelCustomTween(key);
    });
  }

  /**
   * Cancel all active animations
   */
  cancelAllAnimations(): void {
    if (this.config.debug?.log) {
      console.info('[AnimationManager] Cancelling all animations');
    }

    // Cancel radius tweens
    this.radiusTweens.forEach(tween => tween.cancel());
    this.radiusTweens.clear();

    // Cancel custom tweens
    this.customTweens.forEach(tween => tween.cancel());
    this.customTweens.clear();

    // Cancel Konva tweens
    this.activeTweens.forEach(tween => {
      try {
        tween.destroy();
      } catch (error) {
        console.warn('[AnimationManager] Failed to destroy Konva tween:', error);
      }
    });
    this.activeTweens.clear();
  }

  /**
   * Get active tween count
   */
  getActiveTweenCount(): number {
    return this.radiusTweens.size + this.customTweens.size + this.activeTweens.size;
  }

  /**
   * Check if element has active animations
   */
  hasElementAnimations(elementId: ElementId): boolean {
    const hasRadius = this.radiusTweens.has(elementId);
    const hasCustom = Array.from(this.customTweens.keys())
      .some(key => key.startsWith(`${elementId}_`));
    
    return hasRadius || hasCustom;
  }

  /**
   * Add Konva tween to tracking (for external tweens)
   */
  addKonvaTween(tween: Konva.Tween): void {
    this.activeTweens.add(tween);
  }

  /**
   * Remove Konva tween from tracking
   */
  removeKonvaTween(tween: Konva.Tween): void {
    this.activeTweens.delete(tween);
  }

  /**
   * Destroy animation manager and cleanup all animations
   */
  destroy(): void {
    this.cancelAllAnimations();
    
    if (this.config.debug?.log) {
      console.info('[AnimationManager] Animation manager destroyed');
    }
  }

  // Private helper methods

  /**
   * Synchronize DOM overlay position and size during radius animation
   */
  private syncDOMOverlayForRadius(
    elementId: ElementId,
    currentRadius: number,
    padWorld: number,
    strokeWidth: number
  ): void {
    try {
      const getCurrentEditingId = this.config.getCurrentEditingId;
      const getCurrentEditorWrapper = this.config.getCurrentEditorWrapper;
      
      if (!getCurrentEditingId || !getCurrentEditorWrapper) return;
      
      const currentEditingId = getCurrentEditingId();
      const currentEditorWrapper = getCurrentEditorWrapper();

    if (currentEditingId === elementId && currentEditorWrapper) {
      try {
        const node = this.config.nodeMap.get(elementId) as Konva.Node | undefined;
        if (!node) return;

        const group = node as Konva.Group;
        const rect = (group as any)?.getClientRect?.({ skipTransform: false }) ?? group?.getClientRect?.();
        const containerRect = this.config.stage.container().getBoundingClientRect();

        // Calculate absolute transform for scaling
        const absTransform = group.getAbsoluteTransform();
        const p0 = absTransform.point({ x: 0, y: 0 });
        const px = absTransform.point({ x: 1, y: 0 });
        const py = absTransform.point({ x: 0, y: 1 });
        const scaleX = Math.abs(px.x - p0.x);
        const scaleY = Math.abs(py.y - p0.y);
        const scaleLimit = Math.min(Math.max(scaleX, 1e-6), Math.max(scaleY, 1e-6));

        // Calculate minimum radius for content area
        const minRadius = Math.max(1, currentRadius - padWorld - strokeWidth / 2);
        const sidePx = Math.max(4, Math.SQRT2 * minRadius * scaleLimit);

        // Calculate center position
        const centerX = containerRect.left + rect.x + rect.width / 2;
        const centerY = containerRect.top + rect.y + rect.height / 2;

        // Device pixel ratio handling for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        const roundPx = (v: number) => Math.round(v * dpr) / dpr;
        const ceilPx = (v: number) => Math.ceil(v * dpr) / dpr;

        const left = roundPx(centerX - sidePx / 2);
        const top = roundPx(centerY - sidePx / 2);
        const size = ceilPx(sidePx);

        // Update wrapper styles
        Object.assign(currentEditorWrapper.style, {
          left: `${left}px`,
          top: `${top}px`,
          width: `${size}px`,
          height: `${size}px`,
          transform: 'translate(-50%, -50%)',
          outline: this.config.debug?.outlineOverlay ? '1px solid red' : ''
        });

        // Debug logging if enabled
        if (this.config.debug?.log) {
          console.debug('[AnimationManager] Synced DOM overlay for radius animation:', {
            elementId,
            currentRadius,
            sidePx: size,
            center: { x: centerX, y: centerY },
            position: { left, top }
          });
        }

      } catch (error) {
        console.warn('[AnimationManager] Failed to sync DOM overlay:', error);
      }
    }
    } catch (error) {
      console.warn('[AnimationManager] Failed to sync DOM overlay:', error);
    }
  }

  /**
   * Complete radius tween and cleanup
   */
  private completeRadiusTween(elementId: ElementId): void {
    // Refresh transformer if available
    if (this.config.storeAdapter.refreshTransformer) {
      this.config.storeAdapter.refreshTransformer(elementId);
    }

    // Clean up tween state
    this.radiusTweens.delete(elementId);

    if (this.config.debug?.log) {
      console.info(`[AnimationManager] Completed radius tween for ${elementId}`);
    }
  }

  /**
   * Complete custom tween and cleanup
   */
  private completeCustomTween(tweenKey: string): void {
    this.customTweens.delete(tweenKey);

    if (this.config.debug?.log) {
      console.info(`[AnimationManager] Completed custom tween: ${tweenKey}`);
    }
  }
}