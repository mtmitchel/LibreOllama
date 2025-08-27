/**
 * Advanced Animation System for Canvas
 * Timeline-based animations with easing, keyframes, and performance optimization
 */

import { CanvasElement, ElementId } from '../types/enhanced.types';
import { canvasLog } from '../utils/canvasLogger';

// Animation types
export type AnimationType = 
  | 'transform'      // Position, rotation, scale
  | 'style'          // Color, opacity, stroke
  | 'path'           // Path-based animations
  | 'morph'          // Shape morphing
  | 'physics'        // Physics-based animations
  | 'spring'         // Spring physics
  | 'sequence'       // Sequential animations
  | 'parallel'       // Parallel animations
  | 'stagger';       // Staggered animations

// Easing functions
export type EasingFunction = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic'
  | 'back'
  | 'cubic-bezier'
  | 'spring'
  | 'custom';

// Animation states
export type AnimationState = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';

// Keyframe definition
export interface AnimationKeyframe {
  time: number; // 0-1 (normalized time)
  values: Record<string, number | string>;
  easing?: EasingFunction;
  easingParams?: number[]; // For cubic-bezier or custom easing
}

// Animation definition
export interface AnimationDefinition {
  id: string;
  type: AnimationType;
  elementId: ElementId;
  duration: number; // milliseconds
  delay?: number;
  iterations?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  playbackRate?: number;
  easing?: EasingFunction;
  easingParams?: number[];
  
  // Keyframes or property animations
  keyframes?: AnimationKeyframe[];
  fromValues?: Record<string, number | string>;
  toValues?: Record<string, number | string>;
  
  // Event callbacks
  onStart?: () => void;
  onUpdate?: (progress: number, values: Record<string, number | string>) => void;
  onComplete?: () => void;
  onCancel?: () => void;
  
  // Performance options
  useGPU?: boolean;
  optimize?: boolean;
  reducedMotion?: boolean;
}

// Timeline definition
export interface AnimationTimeline {
  id: string;
  animations: AnimationDefinition[];
  duration?: number; // Auto-calculated if not provided
  iterations?: number | 'infinite';
  playbackRate?: number;
  autoplay?: boolean;
  
  // Timeline events
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

// Animation instance
export interface AnimationInstance {
  definition: AnimationDefinition;
  state: AnimationState;
  startTime: number;
  currentTime: number;
  progress: number;
  currentIteration: number;
  rafId?: number;
  element?: CanvasElement;
}

// Spring physics configuration
export interface SpringConfig {
  stiffness: number;     // Spring stiffness (100-1000)
  damping: number;       // Damping ratio (0-1)
  mass: number;          // Mass of the object (0.1-10)
  velocity: number;      // Initial velocity
  precision: number;     // Stop threshold (0.001-0.01)
}

// Performance monitoring
export interface AnimationPerformance {
  frameRate: number;
  droppedFrames: number;
  memoryUsage: number;
  activeAnimations: number;
  averageFrameTime: number;
}

export class AdvancedAnimationSystem {
  private static instance: AdvancedAnimationSystem;
  private animations: Map<string, AnimationInstance> = new Map();
  private timelines: Map<string, AnimationTimeline> = new Map();
  private rafScheduler: RAFScheduler = new RAFScheduler();
  private performanceMonitor: AnimationPerformanceMonitor = new AnimationPerformanceMonitor();
  private easingFunctions: Map<EasingFunction, (t: number, params?: number[]) => number> = new Map();

  private constructor() {
    this.initializeEasingFunctions();
  }

  public static getInstance(): AdvancedAnimationSystem {
    if (!AdvancedAnimationSystem.instance) {
      AdvancedAnimationSystem.instance = new AdvancedAnimationSystem();
    }
    return AdvancedAnimationSystem.instance;
  }

  /**
   * Initialize built-in easing functions
   */
  private initializeEasingFunctions(): void {
    // Linear
    this.easingFunctions.set('linear', (t: number) => t);
    
    // Ease functions
    this.easingFunctions.set('ease', (t: number) => 
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    );
    
    this.easingFunctions.set('ease-in', (t: number) => t * t);
    this.easingFunctions.set('ease-out', (t: number) => t * (2 - t));
    this.easingFunctions.set('ease-in-out', (t: number) => 
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    );
    
    // Bounce
    this.easingFunctions.set('bounce', (t: number) => {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    });
    
    // Elastic
    this.easingFunctions.set('elastic', (t: number) => {
      if (t === 0 || t === 1) return t;
      const p = 0.3;
      const s = p / 4;
      return -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
    });
    
    // Back
    this.easingFunctions.set('back', (t: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return c3 * t * t * t - c1 * t * t;
    });
    
    // Cubic Bezier
    this.easingFunctions.set('cubic-bezier', (t: number, params: number[] = [0.25, 0.1, 0.25, 1]) => {
      return this.cubicBezier(t, params[0], params[1], params[2], params[3]);
    });
    
    // Spring physics
    this.easingFunctions.set('spring', (t: number, params: number[] = [100, 0.8, 1, 0, 0.001]) => {
      return this.springEasing(t, {
        stiffness: params[0],
        damping: params[1],
        mass: params[2],
        velocity: params[3],
        precision: params[4]
      });
    });
  }

  /**
   * Create and start an animation
   */
  public animate(definition: AnimationDefinition): string {
    const instance: AnimationInstance = {
      definition,
      state: 'idle',
      startTime: 0,
      currentTime: 0,
      progress: 0,
      currentIteration: 0
    };

    this.animations.set(definition.id, instance);
    this.startAnimation(definition.id);
    
    canvasLog.info('🎬 [AnimationSystem] Animation created:', definition.id);
    return definition.id;
  }

  /**
   * Start an animation
   */
  public startAnimation(animationId: string): void {
    const instance = this.animations.get(animationId);
    if (!instance) {
      canvasLog.warn('🎬 [AnimationSystem] Animation not found:', animationId);
      return;
    }

    if (instance.state === 'running') return;

    instance.state = 'running';
    instance.startTime = performance.now() + (instance.definition.delay || 0);
    
    // Add to RAF scheduler
    this.rafScheduler.add(animationId, (timestamp) => {
      this.updateAnimation(animationId, timestamp);
    });

    if (instance.definition.onStart) {
      instance.definition.onStart();
    }

    canvasLog.debug('🎬 [AnimationSystem] Animation started:', animationId);
  }

  /**
   * Pause an animation
   */
  public pauseAnimation(animationId: string): void {
    const instance = this.animations.get(animationId);
    if (!instance || instance.state !== 'running') return;

    instance.state = 'paused';
    this.rafScheduler.remove(animationId);
    
    canvasLog.debug('🎬 [AnimationSystem] Animation paused:', animationId);
  }

  /**
   * Resume an animation
   */
  public resumeAnimation(animationId: string): void {
    const instance = this.animations.get(animationId);
    if (!instance || instance.state !== 'paused') return;

    instance.state = 'running';
    instance.startTime = performance.now() - instance.currentTime;
    
    this.rafScheduler.add(animationId, (timestamp) => {
      this.updateAnimation(animationId, timestamp);
    });
    
    canvasLog.debug('🎬 [AnimationSystem] Animation resumed:', animationId);
  }

  /**
   * Cancel an animation
   */
  public cancelAnimation(animationId: string): void {
    const instance = this.animations.get(animationId);
    if (!instance) return;

    instance.state = 'cancelled';
    this.rafScheduler.remove(animationId);

    if (instance.definition.onCancel) {
      instance.definition.onCancel();
    }

    this.animations.delete(animationId);
    canvasLog.debug('🎬 [AnimationSystem] Animation cancelled:', animationId);
  }

  /**
   * Update animation frame
   */
  private updateAnimation(animationId: string, timestamp: number): void {
    const instance = this.animations.get(animationId);
    if (!instance || instance.state !== 'running') return;

    const elapsed = timestamp - instance.startTime;
    const duration = instance.definition.duration;
    
    // Calculate progress
    let progress = Math.max(0, Math.min(1, elapsed / duration));
    
    // Apply playback rate
    if (instance.definition.playbackRate) {
      progress *= instance.definition.playbackRate;
    }

    // Handle direction
    const direction = instance.definition.direction || 'normal';
    const iteration = Math.floor(elapsed / duration);
    
    if (direction === 'reverse' || (direction === 'alternate' && iteration % 2 === 1)) {
      progress = 1 - progress;
    }

    // Apply easing
    const easedProgress = this.applyEasing(progress, instance.definition.easing || 'linear', instance.definition.easingParams);

    // Calculate current values
    const currentValues = this.calculateCurrentValues(instance.definition, easedProgress);

    // Update instance state
    instance.currentTime = elapsed;
    instance.progress = easedProgress;
    instance.currentIteration = iteration;

    // Apply animation to element
    this.applyAnimationValues(instance.definition.elementId, currentValues);

    // Call update callback
    if (instance.definition.onUpdate) {
      instance.definition.onUpdate(easedProgress, currentValues);
    }

    // Check if animation is complete
    const iterations = instance.definition.iterations || 1;
    const isComplete = iterations !== 'infinite' && iteration >= iterations;

    if (isComplete) {
      this.completeAnimation(animationId);
    }
  }

  /**
   * Complete an animation
   */
  private completeAnimation(animationId: string): void {
    const instance = this.animations.get(animationId);
    if (!instance) return;

    instance.state = 'completed';
    this.rafScheduler.remove(animationId);

    // Apply fill mode
    const fillMode = instance.definition.fillMode || 'none';
    if (fillMode === 'forwards' || fillMode === 'both') {
      const finalValues = this.calculateCurrentValues(instance.definition, 1);
      this.applyAnimationValues(instance.definition.elementId, finalValues);
    }

    if (instance.definition.onComplete) {
      instance.definition.onComplete();
    }

    this.animations.delete(animationId);
    canvasLog.debug('🎬 [AnimationSystem] Animation completed:', animationId);
  }

  /**
   * Apply easing function
   */
  private applyEasing(progress: number, easing: EasingFunction, params?: number[]): number {
    const easingFn = this.easingFunctions.get(easing);
    if (!easingFn) {
      canvasLog.warn('🎬 [AnimationSystem] Unknown easing function:', easing);
      return progress;
    }

    return easingFn(progress, params);
  }

  /**
   * Calculate current animation values
   */
  private calculateCurrentValues(definition: AnimationDefinition, progress: number): Record<string, number | string> {
    if (definition.keyframes) {
      return this.interpolateKeyframes(definition.keyframes, progress);
    }

    if (definition.fromValues && definition.toValues) {
      return this.interpolateValues(definition.fromValues, definition.toValues, progress);
    }

    return {};
  }

  /**
   * Interpolate between keyframes
   */
  private interpolateKeyframes(keyframes: AnimationKeyframe[], progress: number): Record<string, number | string> {
    if (keyframes.length === 0) return {};
    if (keyframes.length === 1) return keyframes[0].values;

    // Find surrounding keyframes
    let startFrame = keyframes[0];
    let endFrame = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
        startFrame = keyframes[i];
        endFrame = keyframes[i + 1];
        break;
      }
    }

    // Calculate local progress between keyframes
    const localProgress = (progress - startFrame.time) / (endFrame.time - startFrame.time);

    return this.interpolateValues(startFrame.values, endFrame.values, localProgress);
  }

  /**
   * Interpolate between two value sets
   */
  private interpolateValues(
    fromValues: Record<string, number | string>,
    toValues: Record<string, number | string>,
    progress: number
  ): Record<string, number | string> {
    const result: Record<string, number | string> = {};

    for (const key in fromValues) {
      const fromValue = fromValues[key];
      const toValue = toValues[key];

      if (typeof fromValue === 'number' && typeof toValue === 'number') {
        result[key] = fromValue + (toValue - fromValue) * progress;
      } else if (typeof fromValue === 'string' && typeof toValue === 'string') {
        // Handle color interpolation
        if (this.isColor(fromValue) && this.isColor(toValue)) {
          result[key] = this.interpolateColor(fromValue, toValue, progress);
        } else {
          result[key] = progress < 0.5 ? fromValue : toValue;
        }
      }
    }

    return result;
  }

  /**
   * Apply animation values to canvas element
   */
  private applyAnimationValues(elementId: ElementId, values: Record<string, number | string>): void {
    // This would integrate with the canvas store to update element properties
    canvasLog.debug('🎬 [AnimationSystem] Applying values to element:', elementId, values);
  }

  /**
   * Create a timeline with multiple animations
   */
  public createTimeline(timeline: AnimationTimeline): string {
    this.timelines.set(timeline.id, timeline);

    if (timeline.autoplay !== false) {
      this.playTimeline(timeline.id);
    }

    canvasLog.info('🎬 [AnimationSystem] Timeline created:', timeline.id);
    return timeline.id;
  }

  /**
   * Play a timeline
   */
  public playTimeline(timelineId: string): void {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return;

    // Start all animations in the timeline
    timeline.animations.forEach(animation => {
      this.animate(animation);
    });

    if (timeline.onStart) {
      timeline.onStart();
    }

    canvasLog.debug('🎬 [AnimationSystem] Timeline started:', timelineId);
  }

  /**
   * Cubic bezier easing implementation
   */
  private cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
    // Simplified cubic bezier implementation
    // In a production system, this would use a more precise algorithm
    return t * t * (3 - 2 * t);
  }

  /**
   * Spring easing implementation
   */
  private springEasing(t: number, config: SpringConfig): number {
    const { stiffness, damping, mass } = config;
    const w = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    
    if (zeta < 1) {
      // Underdamped
      const wd = w * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * w * t) * Math.cos(wd * t);
    } else {
      // Overdamped or critically damped
      return 1 - Math.exp(-w * t);
    }
  }

  /**
   * Check if string is a color
   */
  private isColor(value: string): boolean {
    return /^#([A-Fa-f0-9]{3}){1,2}$/.test(value) || 
           /^rgb\(/.test(value) || 
           /^rgba\(/.test(value) ||
           /^hsl\(/.test(value);
  }

  /**
   * Interpolate between colors
   */
  private interpolateColor(fromColor: string, toColor: string, progress: number): string {
    // Simplified color interpolation
    // In a production system, this would properly parse and interpolate RGB values
    return progress < 0.5 ? fromColor : toColor;
  }

  /**
   * Get animation performance metrics
   */
  public getPerformanceMetrics(): AnimationPerformance {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Cleanup system
   */
  public cleanup(): void {
    // Cancel all animations
    this.animations.forEach((_, animationId) => {
      this.cancelAnimation(animationId);
    });

    // Clear timelines
    this.timelines.clear();

    // Cleanup RAF scheduler
    this.rafScheduler.cleanup();

    canvasLog.info('🎬 [AnimationSystem] System cleaned up');
  }
}

// RAF Scheduler for efficient animation updates
class RAFScheduler {
  private callbacks: Map<string, (timestamp: number) => void> = new Map();
  private rafId: number | null = null;
  private isRunning = false;

  public add(id: string, callback: (timestamp: number) => void): void {
    this.callbacks.set(id, callback);
    
    if (!this.isRunning) {
      this.start();
    }
  }

  public remove(id: string): void {
    this.callbacks.delete(id);
    
    if (this.callbacks.size === 0) {
      this.stop();
    }
  }

  private start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.tick();
  }

  private stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (timestamp: number = performance.now()): void => {
    if (!this.isRunning) return;

    // Execute all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(timestamp);
      } catch (error) {
        canvasLog.error('🎬 [RAFScheduler] Animation callback error:', error);
      }
    });

    // Schedule next frame
    if (this.callbacks.size > 0) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.stop();
    }
  };

  public cleanup(): void {
    this.stop();
    this.callbacks.clear();
  }
}

// Performance monitoring for animations
class AnimationPerformanceMonitor {
  private frameCount = 0;
  private lastFrameTime = 0;
  private frameRate = 60;
  private droppedFrames = 0;
  private frameTimes: number[] = [];
  private maxFrameTimes = 60; // Store last 60 frame times

  public recordFrame(timestamp: number): void {
    if (this.lastFrameTime > 0) {
      const frameTime = timestamp - this.lastFrameTime;
      this.frameTimes.push(frameTime);
      
      if (this.frameTimes.length > this.maxFrameTimes) {
        this.frameTimes.shift();
      }

      // Calculate frame rate
      this.frameRate = 1000 / frameTime;
      
      // Detect dropped frames (> 20ms indicates dropped frames at 60fps)
      if (frameTime > 20) {
        this.droppedFrames++;
      }
    }

    this.lastFrameTime = timestamp;
    this.frameCount++;
  }

  public getMetrics(): AnimationPerformance {
    const averageFrameTime = this.frameTimes.length > 0 
      ? this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length 
      : 0;

    return {
      frameRate: Math.round(this.frameRate),
      droppedFrames: this.droppedFrames,
      memoryUsage: this.getMemoryUsage(),
      activeAnimations: 0, // Would be populated from animation system
      averageFrameTime: Math.round(averageFrameTime * 100) / 100
    };
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }
}

// Helper functions for common animations
export const createFadeInAnimation = (elementId: ElementId, duration = 500): AnimationDefinition => ({
  id: `fade-in-${elementId}-${Date.now()}`,
  type: 'style',
  elementId,
  duration,
  fromValues: { opacity: 0 },
  toValues: { opacity: 1 },
  easing: 'ease-out'
});

export const createSlideInAnimation = (elementId: ElementId, direction: 'left' | 'right' | 'up' | 'down', duration = 500): AnimationDefinition => {
  const transforms: Record<string, Record<string, number>> = {
    left: { x: -100 },
    right: { x: 100 },
    up: { y: -100 },
    down: { y: 100 }
  };

  return {
    id: `slide-in-${direction}-${elementId}-${Date.now()}`,
    type: 'transform',
    elementId,
    duration,
    fromValues: transforms[direction],
    toValues: { x: 0, y: 0 },
    easing: 'ease-out'
  };
};

export const createBounceAnimation = (elementId: ElementId, scale = 1.2, duration = 400): AnimationDefinition => ({
  id: `bounce-${elementId}-${Date.now()}`,
  type: 'transform',
  elementId,
  duration,
  keyframes: [
    { time: 0, values: { scaleX: 1, scaleY: 1 } },
    { time: 0.5, values: { scaleX: scale, scaleY: scale } },
    { time: 1, values: { scaleX: 1, scaleY: 1 } }
  ],
  easing: 'bounce'
});

// Export singleton instance
export const animationSystem = AdvancedAnimationSystem.getInstance();