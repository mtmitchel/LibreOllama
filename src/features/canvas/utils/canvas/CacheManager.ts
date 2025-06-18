// src/utils/canvas/CacheManager.ts
/**
 * Advanced Canvas Caching System for LibreOllama Canvas
 * Implements intelligent shape caching with memory-aware management
 * Part of Phase 4 Performance Optimizations
 */

import { PerformanceMonitor, recordMetric } from '../performance';
import { MemoryUsageMonitor } from '../performance/MemoryUsageMonitor';
import type { CanvasElement } from './types';

export interface CacheEntry {
  id: string;
  elementId: string;
  cachedImageData: ImageData | HTMLCanvasElement;
  lastAccessed: number;
  accessCount: number;
  memorySize: number; // Size in bytes
  cacheReason: 'complex' | 'frequent' | 'static' | 'manual';
  isValid: boolean;
  elementHash: string; // Hash of element properties for invalidation
}

export interface CacheConfig {
  maxMemoryMB: number;
  maxEntries: number;
  complexityThreshold: number; // Number of nodes/complexity points
  accessCountThreshold: number; // Accesses before caching
  staleTtlMs: number; // Time before cache entry is considered stale
  enableAutomaticCleanup: boolean;
  enableMemoryPressureCleanup: boolean;
}

export interface CacheMetrics {
  totalEntries: number;
  totalMemoryMB: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryPressureEvents: number;
}

class CacheManagerImpl {
  private cache = new Map<string, CacheEntry>();
  private accessLog = new Map<string, { count: number; lastAccess: number }>();
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupIntervalId: number | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemoryMB: 50,
      maxEntries: 100,
      complexityThreshold: 100,
      accessCountThreshold: 3,
      staleTtlMs: 5 * 60 * 1000, // 5 minutes
      enableAutomaticCleanup: true,
      enableMemoryPressureCleanup: true,
      ...config
    };

    this.metrics = {
      totalEntries: 0,
      totalMemoryMB: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      memoryPressureEvents: 0
    };

    if (this.config.enableAutomaticCleanup) {
      this.startAutomaticCleanup();
    }

    if (this.config.enableMemoryPressureCleanup) {
      this.startMemoryPressureMonitoring();
    }
  }

  /**
   * Check if an element should be cached based on complexity
   */
  shouldCacheElement(element: CanvasElement): boolean {
    const complexity = this.calculateElementComplexity(element);
    const accessInfo = this.accessLog.get(element.id);
    
    // Cache if element is complex enough
    if (complexity >= this.config.complexityThreshold) {
      return true;
    }

    // Cache if element is accessed frequently
    if (accessInfo && accessInfo.count >= this.config.accessCountThreshold) {
      return true;
    }

    // Cache static elements (no animations, minimal updates)
    if (this.isStaticElement(element)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate element complexity score
   */
  private calculateElementComplexity(element: CanvasElement): number {
    let complexity = 0;

    // Base complexity by type
    switch (element.type) {
      case 'circle':
      case 'rectangle':
        complexity += 10;
        break;
      case 'text':
      case 'rich-text':
        complexity += 20;
        if (element.segments && element.segments.length > 5) {
          complexity += element.segments.length * 5;
        }
        break;
      case 'table':
        complexity += 30;
        if (element.rows && element.cols) {
          complexity += element.rows * element.cols * 2;
        }
        break;
      case 'image':
        complexity += 40;
        break;
      case 'connector':
        complexity += 25;
        if (element.pathPoints && element.pathPoints.length > 10) {
          complexity += element.pathPoints.length;
        }
        break;
      case 'pen':
        complexity += 50;
        if (element.points && element.points.length > 100) {
          complexity += element.points.length / 2;
        }
        break;
      default:
        complexity += 15;
    }

    // Add complexity for effects
    if (element.rotation) complexity += 10;
    if (element.stroke && element.strokeWidth && element.strokeWidth > 1) {
      complexity += element.strokeWidth * 2;
    }

    return complexity;
  }

  /**
   * Check if element is static (rarely changes)
   */
  private isStaticElement(element: CanvasElement): boolean {
    // Images are typically static
    if (element.type === 'image') return true;
    
    // Tables with lots of data are worth caching
    if (element.type === 'table' && element.rows && element.cols && 
        element.rows * element.cols > 50) return true;

    // Large text blocks with rich formatting
    if ((element.type === 'text' || element.type === 'rich-text') && 
        element.segments && element.segments.length > 10) return true;

    return false;
  }

  /**
   * Generate a hash for element to detect changes
   */
  private generateElementHash(element: CanvasElement): string {
    const hashData = {
      type: element.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      text: element.text,
      fill: element.fill,
      stroke: element.stroke,
      rotation: element.rotation,
      segments: element.segments?.length || 0,
      points: element.points?.length || 0
    };
    
    return btoa(JSON.stringify(hashData));
  }

  /**
   * Cache an element's rendered content
   */
  async cacheElement(
    element: CanvasElement, 
    renderFunction: (element: CanvasElement) => Promise<HTMLCanvasElement | ImageData>,
    reason: CacheEntry['cacheReason'] = 'complex'
  ): Promise<boolean> {
    const endTiming = PerformanceMonitor.startTiming('cacheElement');
    
    try {
      // Check if we have memory available
      if (!this.hasMemoryCapacity()) {
        await this.performMemoryPressureCleanup();
        if (!this.hasMemoryCapacity()) {
          recordMetric('cacheElementFailed', 1, 'memory', { reason: 'memory_full' });
          return false;
        }
      }

      // Render the element
      const cachedContent = await renderFunction(element);
      const memorySize = this.calculateMemorySize(cachedContent);
      const elementHash = this.generateElementHash(element);

      const cacheEntry: CacheEntry = {
        id: `cache_${element.id}_${Date.now()}`,
        elementId: element.id,
        cachedImageData: cachedContent,
        lastAccessed: performance.now(),
        accessCount: 1,
        memorySize,
        cacheReason: reason,
        isValid: true,
        elementHash
      };

      // Remove old cache entry if exists
      if (this.cache.has(element.id)) {
        this.removeCacheEntry(element.id);
      }

      this.cache.set(element.id, cacheEntry);
      this.updateMetrics();

      recordMetric('elementCached', 1, 'memory', { 
        reason,
        complexity: this.calculateElementComplexity(element),
        memoryMB: memorySize / 1024 / 1024
      });

      return true;
    } catch (error) {
      console.error('Failed to cache element:', error);
      recordMetric('cacheElementFailed', 1, 'memory', { reason: 'render_error' });
      return false;
    } finally {
      endTiming();
    }
  }

  /**
   * Retrieve cached element content
   */
  getCachedElement(elementId: string): CacheEntry | null {
    const entry = this.cache.get(elementId);
    
    if (!entry) {
      recordMetric('cacheElementMiss', 1, 'memory');
      return null;
    }

    // Update access statistics
    entry.lastAccessed = performance.now();
    entry.accessCount++;

    recordMetric('cacheElementHit', 1, 'memory', {
      reason: entry.cacheReason,
      accessCount: entry.accessCount
    });

    return entry;
  }

  /**
   * Invalidate cache entry for an element
   */
  invalidateElement(elementId: string, newElement?: CanvasElement): boolean {
    const entry = this.cache.get(elementId);
    
    if (!entry) return false;

    // Check if element actually changed
    if (newElement) {
      const newHash = this.generateElementHash(newElement);
      if (newHash === entry.elementHash) {
        // Element didn't actually change, keep cache valid
        return false;
      }
    }

    this.removeCacheEntry(elementId);
    recordMetric('cacheElementInvalidated', 1, 'memory');
    return true;
  }

  /**
   * Track element access for caching decisions
   */
  trackElementAccess(elementId: string): void {
    const current = this.accessLog.get(elementId) || { count: 0, lastAccess: 0 };
    this.accessLog.set(elementId, {
      count: current.count + 1,
      lastAccess: performance.now()
    });
  }

  /**
   * Calculate memory size of cached content
   */
  private calculateMemorySize(content: HTMLCanvasElement | ImageData): number {
    if (content instanceof HTMLCanvasElement) {
      return content.width * content.height * 4; // RGBA pixels
    } else {
      return content.data.length; // ImageData
    }
  }

  /**
   * Check if we have memory capacity for new cache entries
   */
  private hasMemoryCapacity(): boolean {
    return this.metrics.totalMemoryMB < this.config.maxMemoryMB && 
           this.metrics.totalEntries < this.config.maxEntries;
  }

  /**
   * Remove a cache entry and free memory
   */
  private removeCacheEntry(elementId: string): void {
    const entry = this.cache.get(elementId);
    if (entry) {
      this.cache.delete(elementId);
      this.updateMetrics();
    }
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    this.metrics.totalEntries = this.cache.size;
    this.metrics.totalMemoryMB = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.memorySize, 0) / 1024 / 1024;
  }

  /**
   * Clean up stale cache entries
   */
  private cleanupStaleEntries(): number {
    const now = performance.now();
    let cleaned = 0;

    for (const [elementId, entry] of this.cache.entries()) {
      if (now - entry.lastAccessed > this.config.staleTtlMs) {
        this.removeCacheEntry(elementId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      recordMetric('cacheStaleCleanup', cleaned, 'memory');
    }

    return cleaned;
  }

  /**
   * Perform memory pressure cleanup
   */
  private async performMemoryPressureCleanup(): Promise<void> {
    const endTiming = PerformanceMonitor.startTiming('memoryPressureCleanup');
    
    try {
      // Sort cache entries by access frequency and recency
      const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => {
        const scoreA = a.accessCount / Math.max(1, (performance.now() - a.lastAccessed) / 1000);
        const scoreB = b.accessCount / Math.max(1, (performance.now() - b.lastAccessed) / 1000);
        return scoreA - scoreB; // Lower score = more likely to be evicted
      });

      // Remove least valuable entries until we have capacity
      let removed = 0;
      const targetMemoryMB = this.config.maxMemoryMB * 0.8; // Target 80% of max

      for (const [elementId] of entries) {
        if (this.metrics.totalMemoryMB <= targetMemoryMB) break;
        
        this.removeCacheEntry(elementId);
        removed++;
      }

      this.metrics.evictionCount += removed;
      this.metrics.memoryPressureEvents++;

      recordMetric('memoryPressureCleanup', removed, 'memory', {
        targetMemoryMB,
        currentMemoryMB: this.metrics.totalMemoryMB
      });
    } finally {
      endTiming();
    }
  }

  /**
   * Start automatic cleanup process
   */
  private startAutomaticCleanup(): void {
    this.cleanupIntervalId = window.setInterval(() => {
      this.cleanupStaleEntries();
    }, 60000); // Run every minute
  }

  /**
   * Start memory pressure monitoring
   */
  private startMemoryPressureMonitoring(): void {
    // Monitor global memory usage and trigger cleanup when needed
    setInterval(() => {
      const memoryInfo = MemoryUsageMonitor.getCurrentMemoryUsage();
      if (memoryInfo && memoryInfo.usedPercent > 70) {
        this.performMemoryPressureCleanup();
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    // Calculate hit/miss rates
    const totalHits = this.cache.size > 0 ? 
      Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0) : 0;
    const totalMisses = Math.max(1, Array.from(this.accessLog.values())
      .reduce((sum, log) => sum + log.count, 0) - totalHits);

    this.metrics.hitRate = totalHits / (totalHits + totalMisses);
    this.metrics.missRate = totalMisses / (totalHits + totalMisses);

    return { ...this.metrics };
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cache.clear();
    this.accessLog.clear();
    this.updateMetrics();
    recordMetric('cacheClearAll', 1, 'memory');
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // If memory limit was reduced, cleanup immediately
    if (this.metrics.totalMemoryMB > this.config.maxMemoryMB) {
      this.performMemoryPressureCleanup();
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    this.clearCache();
  }
}

// Export singleton instance
export const CacheManager = new CacheManagerImpl();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    CacheManager.destroy();
  });
}