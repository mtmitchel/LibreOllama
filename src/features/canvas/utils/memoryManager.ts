/**
 * Enhanced Memory Manager with Advanced Leak Prevention
 * 
 * Features:
 * - WeakMap-based element tracking
 * - Automatic memory pressure detection
 * - Resource pooling for frequently created objects
 * - Performance metrics and monitoring
 * - Advanced cleanup algorithms
 */

import { ElementId, CanvasElement } from '../types/enhanced.types';
import { WindowWithGC, ExtendedPerformance } from '../types/type-safe-replacements';

// Enhanced WeakMap for element metadata
const elementMetadataMap = new WeakMap<CanvasElement, ElementMetadata>();
const elementDOMMap = new WeakMap<CanvasElement, DOMReference>();
const elementComputedMap = new WeakMap<CanvasElement, ComputedProperties>();
const elementsToCleanup = new WeakSet<CanvasElement>();

// Object pools for frequently created objects
const boundsPool: Array<{ x: number; y: number; width: number; height: number }> = [];
const positionPool: Array<{ x: number; y: number }> = [];
const transformPool: Array<{ x: number; y: number; rotation: number; scaleX: number; scaleY: number }> = [];

interface ElementMetadata {
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  isDirty: boolean;
  renderCache?: {
    imageData?: ImageData;
    canvas?: HTMLCanvasElement;
    bounds?: { x: number; y: number; width: number; height: number };
    scale?: number;
    timestamp?: number;
  };
}

interface DOMReference {
  konvaNode?: {
    destroy?: () => void;
    remove?: () => void;
    id?: () => string;
    [key: string]: unknown;
  };
  htmlElement?: HTMLElement;
  eventListeners: Map<string, Function[]>;
}

interface ComputedProperties {
  bounds?: { x: number; y: number; width: number; height: number };
  transform?: { x: number; y: number; rotation: number; scaleX: number; scaleY: number };
  isVisible?: boolean;
  zIndex?: number;
}

interface MemoryStats {
  elementsTracked: number;
  metadataSize: number;
  domReferences: number;
  computedCache: number;
  cleanupQueue: number;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTimeoutId: number | null = null;
  private readonly CLEANUP_INTERVAL = 60000; // 60 seconds - increased for better performance
  private readonly MAX_ACCESS_AGE = 300000; // 5 minutes

  private constructor() {
    this.startCleanupCycle();
    
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.cleanup.bind(this));
      window.addEventListener('unload', this.cleanup.bind(this));
    }
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Track element metadata with automatic cleanup
   */
  public trackElement(element: CanvasElement): void {
    const metadata: ElementMetadata = {
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      isDirty: false,
    };
    
    elementMetadataMap.set(element, metadata);
  }

  /**
   * Get element metadata and update access tracking
   */
  public getElementMetadata(element: CanvasElement): ElementMetadata | undefined {
    const metadata = elementMetadataMap.get(element);
    if (metadata) {
      metadata.lastAccessed = Date.now();
      metadata.accessCount++;
    }
    return metadata;
  }

  /**
   * Store DOM reference with automatic cleanup
   */
  public setDOMReference(element: CanvasElement, reference: Partial<DOMReference>): void {
    const existing = elementDOMMap.get(element) || { eventListeners: new Map() };
    const updated = { ...existing, ...reference };
    elementDOMMap.set(element, updated);
  }

  /**
   * Get DOM reference for element
   */
  public getDOMReference(element: CanvasElement): DOMReference | undefined {
    return elementDOMMap.get(element);
  }

  /**
   * Cache computed properties with weak reference
   */
  public setComputedProperties(element: CanvasElement, properties: Partial<ComputedProperties>): void {
    const existing = elementComputedMap.get(element) || {};
    const updated = { ...existing, ...properties };
    elementComputedMap.set(element, updated);
  }

  /**
   * Get cached computed properties
   */
  public getComputedProperties(element: CanvasElement): ComputedProperties | undefined {
    return elementComputedMap.get(element);
  }

  /**
   * Mark element for cleanup
   */
  public markForCleanup(element: CanvasElement): void {
    elementsToCleanup.add(element);
    
    // Clean up DOM references immediately
    const domRef = elementDOMMap.get(element);
    if (domRef) {
      this.cleanupDOMReference(domRef);
      elementDOMMap.delete(element);
    }
  }

  /**
   * Clean up DOM references
   */
  private cleanupDOMReference(domRef: DOMReference): void {
    // Remove event listeners
    domRef.eventListeners.forEach((listeners, event) => {
      listeners.forEach(listener => {
        domRef.htmlElement?.removeEventListener(event, listener as EventListener);
      });
    });
    domRef.eventListeners.clear();

    // Clean up Konva node
    if (domRef.konvaNode) {
      try {
        domRef.konvaNode.destroy?.();
        domRef.konvaNode.remove?.();
      } catch (error) {
        console.warn('Error cleaning up Konva node:', error);
      }
    }

    // Clear HTML element reference
    if (domRef.htmlElement) {
      domRef.htmlElement = undefined;
    }
  }

  /**
   * Start automatic cleanup cycle using requestIdleCallback to avoid main thread blocking
   */
  private startCleanupCycle(): void {
    if (typeof window === 'undefined') return;

    this.scheduleCleanup();
  }

  private scheduleCleanup(): void {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        this.performCleanup();
        // Schedule next cleanup after successful completion
        setTimeout(() => this.scheduleCleanup(), this.CLEANUP_INTERVAL);
      }, { timeout: 2000 }); // Max 2 seconds before forcing execution
    } else {
      // Fallback for older browsers - use setTimeout instead of setInterval
      setTimeout(() => {
        this.performCleanup();
        this.scheduleCleanup();
      }, this.CLEANUP_INTERVAL);
    }
  }

  /**
   * Enhanced periodic cleanup with memory pressure detection
   */
  private performCleanup(): void {
    const memoryInfo = this.getMemoryPressureInfo();
    
    // Aggressive cleanup under high memory pressure
    if (memoryInfo.pressureLevel > 0.7) {
      this.performAggressiveCleanup();
    }
    
    // Clean up object pools
    this.cleanupObjectPools();
    
    // Force garbage collection if available (dev mode)
    if (typeof window !== 'undefined' && (window as WindowWithGC).gc) {
      try {
        (window as WindowWithGC).gc?.();
      } catch (error) {
        // Ignore - gc() not available
      }
    }
  }

  /**
   * Get memory pressure information
   */
  private getMemoryPressureInfo() {
    let pressureLevel = 0;
    let memoryInfo: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit?: number } = { usedJSHeapSize: 0, totalJSHeapSize: 0 };

    if (typeof window !== 'undefined' && (window.performance as ExtendedPerformance).memory) {
      memoryInfo = (window.performance as ExtendedPerformance).memory!;
      // Prefer using jsHeapSizeLimit for a stable headroom-based pressure signal
      const limit = (memoryInfo as any).jsHeapSizeLimit || memoryInfo.totalJSHeapSize;
      if (limit > 0) {
        pressureLevel = memoryInfo.usedJSHeapSize / limit;
      }
    }

    return {
      pressureLevel,
      usedMemory: memoryInfo.usedJSHeapSize,
      totalMemory: (memoryInfo as any).jsHeapSizeLimit || memoryInfo.totalJSHeapSize,
      isHighPressure: pressureLevel > 0.8
    };
  }

  /**
   * Perform aggressive cleanup under memory pressure
   */
  private performAggressiveCleanup(): void {
    // Clear all object pools
    boundsPool.length = 0;
    positionPool.length = 0;
    transformPool.length = 0;

    console.warn('🧠 [MemoryManager] Aggressive cleanup performed due to memory pressure');
  }

  /**
   * Clean up object pools to prevent unbounded growth
   */
  private cleanupObjectPools(): void {
    const MAX_POOL_SIZE = 100;
    
    if (boundsPool.length > MAX_POOL_SIZE) {
      boundsPool.length = Math.floor(MAX_POOL_SIZE / 2);
    }
    if (positionPool.length > MAX_POOL_SIZE) {
      positionPool.length = Math.floor(MAX_POOL_SIZE / 2);
    }
    if (transformPool.length > MAX_POOL_SIZE) {
      transformPool.length = Math.floor(MAX_POOL_SIZE / 2);
    }
  }

  /**
   * Get bounds object from pool or create new
   */
  public getBounds(x: number, y: number, width: number, height: number) {
    const bounds = boundsPool.pop() || { x: 0, y: 0, width: 0, height: 0 };
    bounds.x = x;
    bounds.y = y;
    bounds.width = width;
    bounds.height = height;
    return bounds;
  }

  /**
   * Return bounds object to pool
   */
  public returnBounds(bounds: { x: number; y: number; width: number; height: number }): void {
    if (boundsPool.length < 100) {
      boundsPool.push(bounds);
    }
  }

  /**
   * Get position object from pool or create new
   */
  public getPosition(x: number, y: number) {
    const pos = positionPool.pop() || { x: 0, y: 0 };
    pos.x = x;
    pos.y = y;
    return pos;
  }

  /**
   * Return position object to pool
   */
  public returnPosition(pos: { x: number; y: number }): void {
    if (positionPool.length < 100) {
      positionPool.push(pos);
    }
  }

  /**
   * Get transform object from pool or create new
   */
  public getTransform(x: number, y: number, rotation: number, scaleX: number, scaleY: number) {
    const transform = transformPool.pop() || { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
    transform.x = x;
    transform.y = y;
    transform.rotation = rotation;
    transform.scaleX = scaleX;
    transform.scaleY = scaleY;
    return transform;
  }

  /**
   * Return transform object to pool
   */
  public returnTransform(transform: { x: number; y: number; rotation: number; scaleX: number; scaleY: number }): void {
    if (transformPool.length < 100) {
      transformPool.push(transform);
    }
  }

  /**
   * Get memory usage statistics
   */
  public getMemoryStats(): MemoryStats {
    // Since WeakMaps don't have size property, we can't get exact counts
    // Return estimated stats based on performance.memory if available
    const memoryInfo = (performance as ExtendedPerformance).memory;
    
    return {
      elementsTracked: 0, // Cannot count WeakMap entries
      metadataSize: memoryInfo?.usedJSHeapSize || 0,
      domReferences: 0, // Cannot count WeakMap entries
      computedCache: 0, // Cannot count WeakMap entries
      cleanupQueue: 0, // Cannot count WeakSet entries
    };
  }

  /**
   * Force cleanup of all references
   */
  public cleanup(): void {
    if (this.cleanupTimeoutId) {
      clearTimeout(this.cleanupTimeoutId);
      this.cleanupTimeoutId = null;
    }

    // WeakMaps and WeakSets will be cleaned up automatically by GC
    // No manual cleanup needed
  }

  /**
   * Create memory-efficient element wrapper
   */
  public createElementWrapper<T extends CanvasElement>(element: T): ElementWrapper<T> {
    this.trackElement(element);
    return new ElementWrapper(element, this);
  }
}

/**
 * Element wrapper with automatic memory management
 */
export class ElementWrapper<T extends CanvasElement> {
  private weakRef: any | null;
  private memoryManager: MemoryManager;
  private elementRef: T | null;

  constructor(element: T, memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
    
    // Use WeakRef if available, otherwise fall back to direct reference
    if (typeof (globalThis as any).WeakRef !== 'undefined') {
      this.weakRef = new (globalThis as any).WeakRef(element);
      this.elementRef = null;
    } else {
      this.weakRef = null;
      this.elementRef = element;
    }
  }

  /**
   * Get the wrapped element (may return undefined if GC'd)
   */
  get element(): T | undefined {
    if (this.weakRef) {
      return this.weakRef.deref?.();
    }
    return this.elementRef || undefined;
  }

  /**
   * Check if element is still available
   */
  get isAlive(): boolean {
    if (this.weakRef) {
      return this.weakRef.deref?.() !== undefined;
    }
    return this.elementRef !== null;
  }

  /**
   * Get element metadata safely
   */
  getMetadata(): ElementMetadata | undefined {
    const element = this.element;
    return element ? this.memoryManager.getElementMetadata(element) : undefined;
  }

  /**
   * Set DOM reference safely
   */
  setDOMReference(reference: Partial<DOMReference>): boolean {
    const element = this.element;
    if (element) {
      this.memoryManager.setDOMReference(element, reference);
      return true;
    }
    return false;
  }

  /**
   * Manually trigger cleanup
   */
  cleanup(): void {
    const element = this.element;
    if (element) {
      this.memoryManager.markForCleanup(element);
    }
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

/**
 * Decorator for automatic memory management
 */
export function withMemoryManagement<T extends CanvasElement>(element: T): T {
  memoryManager.trackElement(element);
  return element;
}

/**
 * Hook for cleanup on component unmount
 */
export function useElementCleanup(elements: CanvasElement[]) {
  if (typeof window === 'undefined') return;

  return () => {
    elements.forEach(element => {
      memoryManager.markForCleanup(element);
    });
  };
}