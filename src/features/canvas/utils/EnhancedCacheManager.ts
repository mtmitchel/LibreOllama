/**
 * Enhanced Cache Manager - Memory-Aware Caching System
 * Part of LibreOllama Canvas Refactoring - Phase 3
 * 
 * This intelligent cache manager makes dynamic decisions about what to cache
 * based on element complexity, render frequency, and available memory.
 */

import Konva from 'konva';
import { CanvasElement, CacheEntry, CacheConfig, ElementId } from '../types/enhanced.types';

export class EnhancedCacheManager {
  private static instance: EnhancedCacheManager;
  private cache = new Map<ElementId, CacheEntry>();
  private memoryLimit = 100 * 1024 * 1024; // 100MB default
  private currentMemoryUsage = 0;
  private accessCounts = new Map<ElementId, number>();
  private renderCounts = new Map<ElementId, number>();
  
  // Performance thresholds
  private readonly COMPLEXITY_THRESHOLD = 50;
  private readonly RENDER_COUNT_THRESHOLD = 3;
  private readonly MEMORY_PRESSURE_RATIO = 0.8;
  private readonly CACHE_TTL = 30000; // 30 seconds

  private constructor() {
    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  public static getInstance(): EnhancedCacheManager {
    if (!EnhancedCacheManager.instance) {
      EnhancedCacheManager.instance = new EnhancedCacheManager();
    }
    return EnhancedCacheManager.instance;
  }

  /**
   * Decides whether to cache based on multiple factors:
   * - Current memory usage
   * - Element complexity
   * - Render frequency
   * - Memory pressure
   */
  shouldCache(element: CanvasElement): boolean {
    const memoryPressure = this.currentMemoryUsage / this.memoryLimit;
    
    if (memoryPressure > this.MEMORY_PRESSURE_RATIO) {
      this.evictLeastUsedCaches();
      return false;
    }

    // Cache if element is complex or frequently rendered
    const complexityScore = this.calculateComplexity(element);
    const renderCount = this.renderCounts.get(element.id as ElementId) || 0;
    
    return (
      complexityScore > this.COMPLEXITY_THRESHOLD ||
      renderCount > this.RENDER_COUNT_THRESHOLD
    );
  }

  /**
   * Calculate complexity score for an element
   * Higher scores indicate more expensive rendering operations
   */
  private calculateComplexity(element: CanvasElement): number {
    let score = 0;

    switch (element.type) {
      case 'table':
        if ('rows' in element && 'cols' in element) {
          score += element.rows * element.cols * 2;
        }
        break;
      case 'pen':
        if ('points' in element) {
          score += Math.floor(element.points.length / 10);
        }
        break;
      case 'text':
        if ('text' in element) {
          score += Math.floor(element.text.length / 10);
        }
        break;
      case 'section':
        if ('childElementIds' in element) {
          score += element.childElementIds.length * 5;
        }
        break;
      case 'image':
        if ('width' in element && 'height' in element) {
          score += Math.floor((element.width * element.height) / 10000);
        }
        break;
      default:
        score = 10; // Base complexity for simple shapes
    }

    // Factor in transformations and effects
    if (element.rotation && element.rotation !== 0) score += 5;
    if (element.isHidden) score -= 20; // Hidden elements shouldn't be cached

    return Math.max(0, score);
  }
  /**
   * Apply cache to a Konva node with optimized configuration
   */
  applyCache(node: Konva.Node, element: CanvasElement): void {
    if (!this.shouldCache(element)) {
      return;
    }

    const config = this.getCacheConfig(element);
    // Extract only the properties that Konva expects
    const konvaConfig = {
      pixelRatio: config.pixelRatio,
      ...(config.scaleX && { scaleX: config.scaleX }),
      ...(config.scaleY && { scaleY: config.scaleY }),
      ...(config.width && { width: config.width }),
      ...(config.height && { height: config.height })
    };
    
    node.cache(konvaConfig);
    
    const memorySize = this.estimateCacheMemory(config);
    const cacheEntry: CacheEntry = {
      data: config,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_TTL,
      memorySize,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(element.id as ElementId, cacheEntry);
    this.currentMemoryUsage += memorySize;
    this.trackRender(element.id as ElementId);
  }

  /**
   * Get optimized cache configuration for an element
   */
  private getCacheConfig(element: CanvasElement): CacheConfig {
    const baseConfig: CacheConfig = {
      enabled: true,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2x for memory
    };

    // Optimize based on element type
    switch (element.type) {
      case 'text':
        return {
          ...baseConfig,
          scaleX: 1,
          scaleY: 1,
        };
      case 'image':
        return {
          ...baseConfig,
          pixelRatio: 1, // Images don't need high DPI caching
        };
      case 'table':
        return {
          ...baseConfig,
          pixelRatio: 1.5, // Tables benefit from slightly higher resolution
        };
      default:
        return baseConfig;
    }
  }

  /**
   * Estimate memory usage of a cache entry
   */
  private estimateCacheMemory(config: CacheConfig): number {
    const pixelRatio = config.pixelRatio || 1;
    const width = config.width || 100;
    const height = config.height || 100;
    
    // 4 bytes per pixel (RGBA) * pixelRatio^2
    return Math.ceil(width * height * 4 * pixelRatio * pixelRatio);
  }

  /**
   * Track render count for an element
   */
  private trackRender(elementId: ElementId): void {
    const currentCount = this.renderCounts.get(elementId) || 0;
    this.renderCounts.set(elementId, currentCount + 1);
  }

  /**
   * Track access to cached element
   */
  trackAccess(elementId: ElementId): void {
    const entry = this.cache.get(elementId);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.accessCounts.set(elementId, (this.accessCounts.get(elementId) || 0) + 1);
    }
  }

  /**
   * Evict least recently used caches when memory pressure is high
   */
  private evictLeastUsedCaches(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by access frequency and recency
    entries.sort(([, a], [, b]) => {
      const aScore = a.accessCount * (Date.now() - a.lastAccessed) / 1000;
      const bScore = b.accessCount * (Date.now() - b.lastAccessed) / 1000;
      return aScore - bScore;
    });    // Evict bottom 25% of caches
    const evictCount = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < evictCount && i < entries.length; i++) {
      const entry = entries[i];
      if (entry) {
        const [elementId, cacheEntry] = entry;
        this.cache.delete(elementId);
        this.currentMemoryUsage -= cacheEntry.memorySize;
      }
    }
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCaches(): void {
    const now = Date.now();
    for (const [elementId, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(elementId);
        this.currentMemoryUsage -= entry.memorySize;
      }
    }
  }

  /**
   * Force clear cache for specific element
   */
  clearCache(elementId: ElementId): void {
    const entry = this.cache.get(elementId);
    if (entry) {
      this.cache.delete(elementId);
      this.currentMemoryUsage -= entry.memorySize;
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.cache.clear();
    this.currentMemoryUsage = 0;
    this.accessCounts.clear();
    this.renderCounts.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats() {
    const hitRate = this.cache.size > 0 ? 
      (Array.from(this.accessCounts.values()).reduce((a, b) => a + b, 0) / this.cache.size) : 0;

    return {
      totalCached: this.cache.size,
      memoryUsed: this.currentMemoryUsage,
      memoryLimit: this.memoryLimit,
      memoryUtilization: this.currentMemoryUsage / this.memoryLimit,
      hitRate,
      expiredEntries: Array.from(this.cache.values()).filter(
        entry => Date.now() > entry.expiresAt
      ).length
    };
  }

  /**
   * Set memory limit for the cache
   */
  setMemoryLimit(limit: number): void {
    this.memoryLimit = limit;
    
    // If current usage exceeds new limit, evict caches
    if (this.currentMemoryUsage > limit) {
      this.evictLeastUsedCaches();
    }
  }

  /**
   * Start periodic memory monitoring and cleanup
   */
  private startMemoryMonitoring(): void {
    // Clean expired caches every 30 seconds
    setInterval(() => {
      this.clearExpiredCaches();
    }, 30000);

    // Monitor memory pressure every 10 seconds
    setInterval(() => {
      if (this.currentMemoryUsage > this.memoryLimit * this.MEMORY_PRESSURE_RATIO) {
        this.evictLeastUsedCaches();
      }
    }, 10000);
  }

  /**
   * Get cache entry if it exists and is valid
   */
  getCacheEntry(elementId: ElementId): CacheEntry | null {
    const entry = this.cache.get(elementId);
    if (entry && Date.now() <= entry.expiresAt) {
      this.trackAccess(elementId);
      return entry;
    }
    return null;
  }
}
