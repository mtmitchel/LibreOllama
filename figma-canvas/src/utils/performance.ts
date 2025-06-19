import { CanvasElement, Bounds } from '../types/canvas';

// Debouncing and Throttling utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func(...args);
    }, wait);
    
    if (callNow) func(...args);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// RequestAnimationFrame utilities
export class AnimationFrameScheduler {
  private callbacks = new Set<() => void>();
  private isScheduled = false;

  add(callback: () => void): () => void {
    this.callbacks.add(callback);
    this.schedule();
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private schedule(): void {
    if (this.isScheduled) return;
    
    this.isScheduled = true;
    requestAnimationFrame(() => {
      this.isScheduled = false;
      const callbacks = Array.from(this.callbacks);
      this.callbacks.clear();
      
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Animation frame callback error:', error);
        }
      });
    });
  }
}

// Singleton instance
export const scheduler = new AnimationFrameScheduler();

// Performance monitoring
export class PerformanceMonitor {
  private measurements = new Map<string, number[]>();
  private maxSamples = 100;

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.addMeasurement(name, end - start);
    return result;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    return fn().then(result => {
      const end = performance.now();
      this.addMeasurement(name, end - start);
      return result;
    });
  }

  private addMeasurement(name: string, duration: number): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    
    const samples = this.measurements.get(name)!;
    samples.push(duration);
    
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  getStats(name: string): PerformanceStats | null {
    const samples = this.measurements.get(name);
    if (!samples || samples.length === 0) return null;
    
    const sorted = [...samples].sort((a, b) => a - b);
    const sum = samples.reduce((a, b) => a + b, 0);
    
    return {
      name,
      count: samples.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / samples.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  getAllStats(): PerformanceStats[] {
    return Array.from(this.measurements.keys())
      .map(name => this.getStats(name))
      .filter(Boolean) as PerformanceStats[];
  }

  clear(): void {
    this.measurements.clear();
  }
}

export interface PerformanceStats {
  name: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  p99: number;
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Object pooling for frequently created/destroyed objects
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize = 100
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  acquire(): T {
    const obj = this.pool.pop();
    if (obj) {
      this.resetFn(obj);
      return obj;
    }
    return this.createFn();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }

  size(): number {
    return this.pool.length;
  }
}

// Memory management utilities
export class MemoryManager {
  private static instance: MemoryManager;
  private pools = new Map<string, ObjectPool<any>>();
  private observers = new Set<any>();
  private cleanupCallbacks = new Map<object, (() => void)[]>();

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  createPool<T>(
    name: string,
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize = 100
  ): ObjectPool<T> {
    const pool = new ObjectPool(createFn, resetFn, maxSize);
    this.pools.set(name, pool);
    return pool;
  }

  getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  observe(obj: object, cleanupCallback?: () => void): void {
    this.observers.add(obj);
    
    if (cleanupCallback) {
      if (!this.cleanupCallbacks.has(obj)) {
        this.cleanupCallbacks.set(obj, []);
      }
      this.cleanupCallbacks.get(obj)!.push(cleanupCallback);
    }
  }

  cleanup(): void {
    // Clean up dead references
    const deadRefs: any[] = [];
    
    this.observers.forEach(ref => {
      const obj = ref.deref();
      if (!obj) {
        deadRefs.push(ref);
      }
    });
    
    deadRefs.forEach(ref => {
      this.observers.delete(ref);
    });
    
    // Execute cleanup callbacks for dead objects
    Array.from(this.cleanupCallbacks.keys()).forEach(obj => {
      // Check if object is still alive by trying to access it
      try {
        // This is a weak check - in practice you'd use WeakRefs
        const callbacks = this.cleanupCallbacks.get(obj);
        if (callbacks) {
          callbacks.forEach(callback => callback());
          this.cleanupCallbacks.delete(obj);
        }
      } catch (error) {
        // Object is likely garbage collected
        this.cleanupCallbacks.delete(obj);
      }
    });
    
    // Clear object pools
    this.pools.forEach(pool => pool.clear());
  }

  getMemoryStats(): MemoryStats {
    return {
      poolCount: this.pools.size,
      observerCount: this.observers.size,
      cleanupCallbackCount: this.cleanupCallbacks.size,
      totalPoolSize: Array.from(this.pools.values()).reduce(
        (sum, pool) => sum + pool.size(),
        0
      )
    };
  }
}

export interface MemoryStats {
  poolCount: number;
  observerCount: number;
  cleanupCallbackCount: number;
  totalPoolSize: number;
}

// Viewport virtualization for large canvases
export class ViewportVirtualizer {
  private viewportBounds: Bounds;
  private allElements: CanvasElement[];
  private visibleElements: CanvasElement[] = [];
  private buffer: number;
  private lastUpdateTime = 0;
  private updateThrottle = 16; // ~60fps

  constructor(buffer = 200) {
    this.buffer = buffer;
    this.viewportBounds = { x: 0, y: 0, width: 0, height: 0 };
    this.allElements = [];
  }

  setViewport(bounds: Bounds): void {
    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateThrottle) {
      return;
    }
    
    this.viewportBounds = bounds;
    this.updateVisibleElements();
    this.lastUpdateTime = now;
  }

  setElements(elements: CanvasElement[]): void {
    this.allElements = elements;
    this.updateVisibleElements();
  }

  private updateVisibleElements(): void {
    const expandedViewport = {
      x: this.viewportBounds.x - this.buffer,
      y: this.viewportBounds.y - this.buffer,
      width: this.viewportBounds.width + this.buffer * 2,
      height: this.viewportBounds.height + this.buffer * 2
    };

    this.visibleElements = this.allElements.filter(element => {
      // Quick bounds check
      if (
        element.x + element.width < expandedViewport.x ||
        element.x > expandedViewport.x + expandedViewport.width ||
        element.y + element.height < expandedViewport.y ||
        element.y > expandedViewport.y + expandedViewport.height
      ) {
        return false;
      }
      
      return true;
    });
  }

  getVisibleElements(): CanvasElement[] {
    return this.visibleElements;
  }

  getElementCount(): { total: number; visible: number } {
    return {
      total: this.allElements.length,
      visible: this.visibleElements.length
    };
  }
}

// Batch operations for improved performance
export class BatchProcessor<T> {
  private queue: T[] = [];
  private processor: (items: T[]) => void;
  private batchSize: number;
  private timeout: NodeJS.Timeout | null = null;
  private delay: number;

  constructor(
    processor: (items: T[]) => void,
    batchSize = 50,
    delay = 16
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(item: T): void {
    this.queue.push(item);
    this.scheduleProcess();
  }

  addBatch(items: T[]): void {
    this.queue.push(...items);
    this.scheduleProcess();
  }

  private scheduleProcess(): void {
    if (this.timeout) return;
    
    this.timeout = setTimeout(() => {
      this.process();
      this.timeout = null;
    }, this.delay);
  }

  private process(): void {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      this.processor(batch);
    } catch (error) {
      console.error('Batch processing error:', error);
    }
    
    // Schedule next batch if there are more items
    if (this.queue.length > 0) {
      this.scheduleProcess();
    }
  }

  flush(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    if (this.queue.length > 0) {
      const items = this.queue.splice(0);
      this.processor(items);
    }
  }

  clear(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.queue.length = 0;
  }

  size(): number {
    return this.queue.length;
  }
}

// Dirty region tracking for optimized rendering
export class DirtyRegionTracker {
  private regions: Set<string> = new Set();
  private bounds: Map<string, Bounds> = new Map();
  private mergeThreshold = 100;

  markDirty(id: string, bounds: Bounds): void {
    this.regions.add(id);
    this.bounds.set(id, bounds);
  }

  markClean(id: string): void {
    this.regions.delete(id);
    this.bounds.delete(id);
  }

  getDirtyRegions(): Bounds[] {
    const regions = Array.from(this.regions)
      .map(id => this.bounds.get(id))
      .filter(Boolean) as Bounds[];
    
    return this.mergeOverlappingRegions(regions);
  }

  private mergeOverlappingRegions(regions: Bounds[]): Bounds[] {
    if (regions.length <= 1) return regions;
    
    const merged: Bounds[] = [];
    const processed = new Set<number>();
    
    for (let i = 0; i < regions.length; i++) {
      if (processed.has(i)) continue;
      
      let currentRegion = regions[i];
      processed.add(i);
      
      // Try to merge with other regions
      let merged_any = true;
      while (merged_any) {
        merged_any = false;
        
        for (let j = i + 1; j < regions.length; j++) {
          if (processed.has(j)) continue;
          
          const otherRegion = regions[j];
          
          if (this.shouldMergeRegions(currentRegion, otherRegion)) {
            currentRegion = this.mergeRegions(currentRegion, otherRegion);
            processed.add(j);
            merged_any = true;
          }
        }
      }
      
      merged.push(currentRegion);
    }
    
    return merged;
  }

  private shouldMergeRegions(region1: Bounds, region2: Bounds): boolean {
    // Calculate the area of the merged region
    const mergedRegion = this.mergeRegions(region1, region2);
    const mergedArea = mergedRegion.width * mergedRegion.height;
    const region1Area = region1.width * region1.height;
    const region2Area = region2.width * region2.height;
    const combinedArea = region1Area + region2Area;
    
    // Merge if the merged area is not much larger than the combined area
    return (mergedArea - combinedArea) <= this.mergeThreshold;
  }

  private mergeRegions(region1: Bounds, region2: Bounds): Bounds {
    const x = Math.min(region1.x, region2.x);
    const y = Math.min(region1.y, region2.y);
    const maxX = Math.max(region1.x + region1.width, region2.x + region2.width);
    const maxY = Math.max(region1.y + region1.height, region2.y + region2.height);
    
    return {
      x,
      y,
      width: maxX - x,
      height: maxY - y
    };
  }

  clear(): void {
    this.regions.clear();
    this.bounds.clear();
  }

  size(): number {
    return this.regions.size;
  }
}

// Frame rate monitor
export class FrameRateMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();
  private maxSamples = 60;

  update(): number {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    const fps = 1000 / deltaTime;
    
    this.frames.push(fps);
    
    if (this.frames.length > this.maxSamples) {
      this.frames.shift();
    }
    
    this.lastTime = currentTime;
    return fps;
  }

  getAverageFPS(): number {
    if (this.frames.length === 0) return 0;
    
    const sum = this.frames.reduce((a, b) => a + b, 0);
    return sum / this.frames.length;
  }

  getMinFPS(): number {
    return this.frames.length > 0 ? Math.min(...this.frames) : 0;
  }

  getMaxFPS(): number {
    return this.frames.length > 0 ? Math.max(...this.frames) : 0;
  }

  reset(): void {
    this.frames.length = 0;
    this.lastTime = performance.now();
  }
}

// Export singleton instances for easy use
export const memoryManager = MemoryManager.getInstance();
export const frameRateMonitor = new FrameRateMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const measureRender = (name: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      performanceMonitor.measure(name, () => end - start);
    };
  };

  const measureAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureAsync(name, fn);
  };

  return {
    measureRender,
    measureAsync,
    getStats: performanceMonitor.getStats.bind(performanceMonitor),
    getAllStats: performanceMonitor.getAllStats.bind(performanceMonitor)
  };
};
