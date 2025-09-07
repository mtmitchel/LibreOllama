/**
 * Tween/Animation Module
 * Handles smooth animations for canvas elements
 */

import Konva from 'konva';
import type { TweenConfig } from './types';

export interface ActiveTween {
  id: string;
  tween: Konva.Tween;
  cancel: () => void;
}

/**
 * Easing functions
 */
export const Easing = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  elasticIn: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  elasticOut: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  bounceOut: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
};

/**
 * Tween Manager
 */
export class TweenManager {
  private activeTweens = new Map<string, ActiveTween>();
  private nextId = 0;

  /**
   * Create a tween for uniform radius animation (circles)
   */
  tweenRadius(
    ellipse: Konva.Ellipse,
    startRadius: number,
    endRadius: number,
    config: TweenConfig = {}
  ): string {
    const id = this.generateId();
    
    // Cancel any existing tween on this node
    this.cancelNodeTweens(ellipse);

    const tween = new Konva.Tween({
      node: ellipse,
      radiusX: endRadius,
      radiusY: endRadius,
      duration: (config.duration || 150) / 1000, // Convert to seconds
      easing: config.easing || Easing.easeOut,
      onFinish: () => {
        this.activeTweens.delete(id);
        config.onComplete?.();
      },
      onUpdate: () => {
        const progress = tween.getPosition();
        const currentRadius = startRadius + (endRadius - startRadius) * progress;
        config.onUpdate?.(currentRadius);
      }
    });

    const activeTween: ActiveTween = {
      id,
      tween,
      cancel: () => {
        tween.destroy();
        this.activeTweens.delete(id);
      }
    };

    this.activeTweens.set(id, activeTween);
    tween.play();

    return id;
  }

  /**
   * Create a tween for position animation
   */
  tweenPosition(
    node: Konva.Node,
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    config: TweenConfig = {}
  ): string {
    const id = this.generateId();
    
    // Cancel any existing tween on this node
    this.cancelNodeTweens(node);

    const tween = new Konva.Tween({
      node,
      x: endPos.x,
      y: endPos.y,
      duration: (config.duration || 300) / 1000,
      easing: config.easing || Easing.easeInOut,
      onFinish: () => {
        this.activeTweens.delete(id);
        config.onComplete?.();
      },
      onUpdate: () => {
        const progress = tween.getPosition();
        const currentX = startPos.x + (endPos.x - startPos.x) * progress;
        const currentY = startPos.y + (endPos.y - startPos.y) * progress;
        config.onUpdate?.(progress);
      }
    });

    const activeTween: ActiveTween = {
      id,
      tween,
      cancel: () => {
        tween.destroy();
        this.activeTweens.delete(id);
      }
    };

    this.activeTweens.set(id, activeTween);
    tween.play();

    return id;
  }

  /**
   * Create a tween for opacity animation
   */
  tweenOpacity(
    node: Konva.Node,
    startOpacity: number,
    endOpacity: number,
    config: TweenConfig = {}
  ): string {
    const id = this.generateId();

    const tween = new Konva.Tween({
      node,
      opacity: endOpacity,
      duration: (config.duration || 200) / 1000,
      easing: config.easing || Easing.linear,
      onFinish: () => {
        this.activeTweens.delete(id);
        config.onComplete?.();
      }
    });

    const activeTween: ActiveTween = {
      id,
      tween,
      cancel: () => {
        tween.destroy();
        this.activeTweens.delete(id);
      }
    };

    this.activeTweens.set(id, activeTween);
    tween.play();

    return id;
  }

  /**
   * Create a tween for scale animation
   */
  tweenScale(
    node: Konva.Node,
    startScale: { x: number; y: number },
    endScale: { x: number; y: number },
    config: TweenConfig = {}
  ): string {
    const id = this.generateId();

    const tween = new Konva.Tween({
      node,
      scaleX: endScale.x,
      scaleY: endScale.y,
      duration: (config.duration || 300) / 1000,
      easing: config.easing || Easing.elasticOut,
      onFinish: () => {
        this.activeTweens.delete(id);
        config.onComplete?.();
      }
    });

    const activeTween: ActiveTween = {
      id,
      tween,
      cancel: () => {
        tween.destroy();
        this.activeTweens.delete(id);
      }
    };

    this.activeTweens.set(id, activeTween);
    tween.play();

    return id;
  }

  /**
   * Create a custom tween
   */
  tweenCustom(
    node: Konva.Node,
    properties: any,
    config: TweenConfig = {}
  ): string {
    const id = this.generateId();

    const tween = new Konva.Tween({
      node,
      ...properties,
      duration: (config.duration || 300) / 1000,
      easing: config.easing || Easing.easeInOut,
      onFinish: () => {
        this.activeTweens.delete(id);
        config.onComplete?.();
      },
      onUpdate: () => {
        const progress = tween.getPosition();
        config.onUpdate?.(progress);
      }
    });

    const activeTween: ActiveTween = {
      id,
      tween,
      cancel: () => {
        tween.destroy();
        this.activeTweens.delete(id);
      }
    };

    this.activeTweens.set(id, activeTween);
    tween.play();

    return id;
  }

  /**
   * Cancel a specific tween
   */
  cancel(id: string): void {
    const activeTween = this.activeTweens.get(id);
    if (activeTween) {
      activeTween.cancel();
    }
  }

  /**
   * Cancel all tweens for a specific node
   */
  cancelNodeTweens(node: Konva.Node): void {
    const toCancel: string[] = [];
    
    this.activeTweens.forEach((activeTween, id) => {
      if (activeTween.tween.node === node) {
        toCancel.push(id);
      }
    });

    toCancel.forEach(id => this.cancel(id));
  }

  /**
   * Cancel all active tweens
   */
  cancelAll(): void {
    this.activeTweens.forEach(activeTween => {
      activeTween.tween.destroy();
    });
    this.activeTweens.clear();
  }

  /**
   * Pause a tween
   */
  pause(id: string): void {
    const activeTween = this.activeTweens.get(id);
    if (activeTween) {
      activeTween.tween.pause();
    }
  }

  /**
   * Resume a paused tween
   */
  resume(id: string): void {
    const activeTween = this.activeTweens.get(id);
    if (activeTween) {
      activeTween.tween.play();
    }
  }

  /**
   * Check if a tween is active
   */
  isActive(id: string): boolean {
    return this.activeTweens.has(id);
  }

  /**
   * Get active tween count
   */
  getActiveCount(): number {
    return this.activeTweens.size;
  }

  /**
   * Generate unique tween ID
   */
  private generateId(): string {
    return `tween_${this.nextId++}`;
  }

  /**
   * Dispose of tween manager
   */
  dispose(): void {
    this.cancelAll();
  }
}

/**
 * Create a simple value animator (not tied to a node)
 */
export function animateValue(
  from: number,
  to: number,
  config: TweenConfig & { onUpdate: (value: number) => void }
): { cancel: () => void } {
  let cancelled = false;
  const startTime = performance.now();
  const duration = config.duration || 300;
  const easing = config.easing || Easing.easeInOut;

  const animate = () => {
    if (cancelled) return;

    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const currentValue = from + (to - from) * easedProgress;

    config.onUpdate(currentValue);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      config.onComplete?.();
    }
  };

  requestAnimationFrame(animate);

  return {
    cancel: () => {
      cancelled = true;
    }
  };
}