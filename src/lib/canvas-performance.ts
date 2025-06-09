/**
 * Performance utilities for canvas operations
 * Includes object pooling, batching, and memory management
 */

import { Graphics, Texture, DisplayObject } from 'pixi.js';
import { CanvasElement } from '@/stores/canvasStore';

/**
 * Generic object pool for reusing expensive objects
 */
export class ObjectPool<T> {
  private objects: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(createFn: () => T, resetFn: (obj: T) => void, maxSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  get(): T {
    if (this.objects.length > 0) {
      return this.objects.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    if (this.objects.length < this.maxSize) {
      this.resetFn(obj);
      this.objects.push(obj);
    } else {
      // If pool is full, let the object be garbage collected
      if (obj && typeof (obj as any).destroy === 'function') {
        (obj as any).destroy();
      }
    }
  }

  clear(): void {
    this.objects.forEach(obj => {
      if (obj && typeof (obj as any).destroy === 'function') {
        (obj as any).destroy();
      }
    });
    this.objects.length = 0;
  }

  get size(): number {
    return this.objects.length;
  }
}

/**
 * PixiJS Graphics object pool for selection rectangles, previews, etc.
 */
export const graphicsPool = new ObjectPool<Graphics>(
  () => new Graphics(),
  (graphics) => {
    graphics.clear();
    graphics.removeAllListeners();
    graphics.x = 0;
    graphics.y = 0;
    graphics.scale.set(1);
    graphics.rotation = 0;
    graphics.alpha = 1;
    graphics.visible = true;
    graphics.eventMode = 'none';
  }
);

/**
 * Batch operation manager for optimal performance
 */
export class BatchManager {
  private updateQueue: Map<string, Partial<CanvasElement>> = new Map();
  private deleteQueue: Set<string> = new Set();
  private batchTimeoutId: number | null = null;
  private onBatchUpdate: (updates: Record<string, Partial<CanvasElement>>) => void;
  private onBatchDelete: (ids: string[]) => void;

  constructor(
    onBatchUpdate: (updates: Record<string, Partial<CanvasElement>>) => void,
    onBatchDelete: (ids: string[]) => void,
    batchDelay = 16 // ~60fps
  ) {
    this.onBatchUpdate = onBatchUpdate;
    this.onBatchDelete = onBatchDelete;
  }

  scheduleUpdate(elementId: string, updates: Partial<CanvasElement>): void {
    // Merge with existing updates for this element
    const existing = this.updateQueue.get(elementId) || {};
    this.updateQueue.set(elementId, { ...existing, ...updates });
    
    this.scheduleBatch();
  }

  scheduleDelete(elementId: string): void {
    this.deleteQueue.add(elementId);
    // Remove from update queue if it was scheduled for update
    this.updateQueue.delete(elementId);
    
    this.scheduleBatch();
  }

  private scheduleBatch(): void {
    if (this.batchTimeoutId !== null) {
      return; // Batch already scheduled
    }

    this.batchTimeoutId = window.requestAnimationFrame(() => {
      this.executeBatch();
    });
  }

  private executeBatch(): void {
    // Execute updates
    if (this.updateQueue.size > 0) {
      const updates = Object.fromEntries(this.updateQueue);
      this.onBatchUpdate(updates);
      this.updateQueue.clear();
    }

    // Execute deletes
    if (this.deleteQueue.size > 0) {
      const deletes = Array.from(this.deleteQueue);
      this.onBatchDelete(deletes);
      this.deleteQueue.clear();
    }

    this.batchTimeoutId = null;
  }

  flush(): void {
    if (this.batchTimeoutId !== null) {
      cancelAnimationFrame(this.batchTimeoutId);
      this.batchTimeoutId = null;
      this.executeBatch();
    }
  }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  private textureCache = new Map<string, Texture>();
  private maxTextureAge = 5 * 60 * 1000; // 5 minutes
  private textureTimestamps = new Map<string, number>();
  private cleanupInterval: number;

  constructor() {
    // Clean up unused textures every minute
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupTextures();
    }, 60 * 1000);
  }

  getTexture(url: string): Promise<Texture> {
    const cached = this.textureCache.get(url);
    if (cached) {
      this.textureTimestamps.set(url, Date.now());
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      const texture = Texture.from(url);
      texture.once('update', () => {
        this.textureCache.set(url, texture);
        this.textureTimestamps.set(url, Date.now());
        resolve(texture);
      });
      texture.once('error', reject);
    });
  }

  private cleanupTextures(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.textureTimestamps.forEach((timestamp, url) => {
      if (now - timestamp > this.maxTextureAge) {
        toDelete.push(url);
      }
    });

    toDelete.forEach(url => {
      const texture = this.textureCache.get(url);
      if (texture) {
        texture.destroy(true);
        this.textureCache.delete(url);
        this.textureTimestamps.delete(url);
      }
    });
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.textureCache.forEach(texture => texture.destroy(true));
    this.textureCache.clear();
    this.textureTimestamps.clear();
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private frameStart = 0;
  private frameCount = 0;
  private fps = 0;
  private callbacks: Array<(fps: number) => void> = [];

  start(): void {
    this.frameStart = performance.now();
    this.tick();
  }

  private tick = (): void => {
    const now = performance.now();
    this.frameCount++;

    if (now - this.frameStart >= 1000) {
      this.fps = (this.frameCount * 1000) / (now - this.frameStart);
      this.frameCount = 0;
      this.frameStart = now;

      this.callbacks.forEach(callback => callback(this.fps));
    }

    requestAnimationFrame(this.tick);
  };

  onFpsUpdate(callback: (fps: number) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  getCurrentFps(): number {
    return this.fps;
  }
}

/**
 * Optimize PixiJS display objects for performance
 */
export const optimizeDisplayObject = (obj: DisplayObject, isInteractive = false): void => {
  // Set appropriate event mode
  obj.eventMode = isInteractive ? 'static' : 'none';
  
  // Enable caching for static objects
  if (!isInteractive && obj.width > 0 && obj.height > 0) {
    obj.cacheAsBitmap = true;
  }
  
  // Round positions to avoid sub-pixel rendering
  obj.x = Math.round(obj.x);
  obj.y = Math.round(obj.y);
};

/**
 * Global performance utilities instance
 */
export const performanceUtils = {
  graphicsPool,
  MemoryManager,
  BatchManager,
  PerformanceMonitor,
  optimizeDisplayObject
};
