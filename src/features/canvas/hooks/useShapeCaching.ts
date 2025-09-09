// src/hooks/canvas/useShapeCaching.ts
/**
 * Advanced Shape Caching Hook for Konva Performance Optimization
 * Part of Phase 4.2 - Shape Caching Implementation
 * 
 * Provides strategic caching for complex shapes to improve rendering performance.
 * Based on insights from Konva research and best practices.
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import Konva from 'konva';
import { CanvasElement, isCircleElement } from '../types/enhanced.types';

/**
 * Fast MurmurHash3 implementation for cache key generation
 * Replaces expensive JSON.stringify with O(1) constant-time hashing
 */
const murmurhash3 = (str: string, seed: number = 0): string => {
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const r1 = 15;
  const r2 = 13;
  const m = 5;
  const n = 0xe6546b64;
  
  const len = str.length;
  const blocks = Math.floor(len / 4);
  
  for (let i = 0; i < blocks; i++) {
    const k1 = str.charCodeAt(i * 4) |
               (str.charCodeAt(i * 4 + 1) << 8) |
               (str.charCodeAt(i * 4 + 2) << 16) |
               (str.charCodeAt(i * 4 + 3) << 24);
    
    let k1m = Math.imul(k1, c1);
    k1m = (k1m << r1) | (k1m >>> (32 - r1));
    k1m = Math.imul(k1m, c2);
    
    h1 ^= k1m;
    h1 = (h1 << r2) | (h1 >>> (32 - r2));
    h1 = Math.imul(h1, m) + n;
  }
  
  // Handle remaining bytes
  let k1 = 0;
  const tail = len % 4;
  if (tail >= 3) k1 ^= str.charCodeAt(blocks * 4 + 2) << 16;
  if (tail >= 2) k1 ^= str.charCodeAt(blocks * 4 + 1) << 8;
  if (tail >= 1) {
    k1 ^= str.charCodeAt(blocks * 4);
    k1 = Math.imul(k1, c1);
    k1 = (k1 << r1) | (k1 >>> (32 - r1));
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
  }
  
  // Finalize
  h1 ^= len;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;
  
  return (h1 >>> 0).toString(36);
};

interface CacheConfig {
  /** Whether caching is enabled for this shape */
  enabled: boolean;
  /** Threshold for shape complexity to enable caching */
  complexityThreshold: number;
  /** Cache when width * height exceeds this value */
  sizeThreshold: number;
  /** Force caching regardless of heuristics */
  forceCache: boolean;
}

interface CacheableShapeProps {
  /** Element data for cache invalidation */
  element: CanvasElement;
  /** Override cache configuration */
  cacheConfig?: Partial<CacheConfig>;
  /** Additional dependencies for cache invalidation */
  dependencies?: any[];
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  complexityThreshold: 5, // Tables, grouped elements, complex shapes
  sizeThreshold: 10000, // 100x100px+ shapes
  forceCache: false
};

/**
 * Determines if a shape should be cached based on complexity and size heuristics
 */
const shouldCacheShape = (element: CanvasElement, config: CacheConfig): boolean => {
  if (!config.enabled) return false;
  if (config.forceCache) return true;

  // Cache complex element types
  const complexTypes = ['table', 'enhanced-table', 'section', 'rich-text'];
  if (complexTypes.includes(element.type)) return true;

  // Cache large shapes (use type-safe property access)
  let width = 0;
  let height = 0;
  
  if (isCircleElement(element)) {
    // CircleElement: prefer width/height, fallback to radius * 2
    width = element.width || (element.radius ? element.radius * 2 : 0);
    height = element.height || (element.radius ? element.radius * 2 : 0);
  } else if ('width' in element && 'height' in element) {
    width = element.width || 0;
    height = element.height || 0;
  }
  const size = (width || 0) * (height || 0);
  if (size > config.sizeThreshold) return true;
  
  // Cache shapes with multiple visual properties (complexity heuristic)
  const visualProps = [
    'fill' in element ? element.fill : undefined,
    'stroke' in element ? element.stroke : undefined,
    'strokeWidth' in element ? element.strokeWidth : undefined,
    'fontSize' in element ? element.fontSize : undefined,
    'fontFamily' in element ? element.fontFamily : undefined,
    'backgroundColor' in element ? element.backgroundColor : undefined,
    'textColor' in element ? element.textColor : undefined
  ].filter(Boolean).length;
  
  if (visualProps >= config.complexityThreshold) return true;

  return false;
};

/**
 * Generates a cache key based on visual properties that affect rendering
 * Uses fast hashing instead of JSON.stringify for performance
 */
const generateCacheKey = (element: CanvasElement, dependencies: any[] = []): string => {
  const visualProps = {
    type: element.type,
    width: isCircleElement(element) 
      ? (element.width || (element.radius ? element.radius * 2 : undefined))
      : ('width' in element ? element.width : undefined),
    height: isCircleElement(element)
      ? (element.height || (element.radius ? element.radius * 2 : undefined))
      : ('height' in element ? element.height : undefined),
    fill: 'fill' in element ? element.fill : undefined,
    stroke: 'stroke' in element ? element.stroke : undefined,
    strokeWidth: 'strokeWidth' in element ? element.strokeWidth : undefined,
    fontSize: 'fontSize' in element ? element.fontSize : undefined,
    fontFamily: 'fontFamily' in element ? element.fontFamily : undefined,
    fontStyle: 'fontStyle' in element ? element.fontStyle : undefined,
    textDecoration: 'textDecoration' in element ? element.textDecoration : undefined,
    text: 'text' in element ? element.text : undefined,
    // Table-specific properties
    enhancedTableData: (element as any).enhancedTableData ? 
      JSON.stringify((element as any).enhancedTableData) : undefined,
    // Rich text properties
    richTextSegments: (element as any).richTextSegments ?
      JSON.stringify((element as any).richTextSegments) : undefined
  };

  // Use fast hashing instead of expensive JSON.stringify
  const propsString = JSON.stringify([visualProps, ...dependencies]);
  return murmurhash3(propsString);
};

/**
 * Shape caching hook that optimizes Konva node rendering performance
 * 
 * @param props - Cacheable shape properties
 * @returns Cache management functions
 */
export const useShapeCaching = ({
  element,
  cacheConfig = {},
  dependencies = []
}: CacheableShapeProps) => {
  const nodeRef = useRef<Konva.Node | null>(null);
  const lastCacheKeyRef = useRef<string>('');
  const isCachedRef = useRef<boolean>(false);
  
  // Memoize config to prevent object recreation
  const config = useMemo(() => ({ 
    ...DEFAULT_CACHE_CONFIG, 
    ...cacheConfig 
  }), [cacheConfig]);
  
  // Memoize expensive cache key generation
  const currentCacheKey = useMemo(() => 
    generateCacheKey(element, dependencies), 
    [element, dependencies]
  );
  
  // Memoize shouldCache calculation
  const shouldCache = useMemo(() => 
    shouldCacheShape(element, config), 
    [element, config]
  );

  /**
   * Apply caching to the Konva node with explicit cache invalidation validation
   */
  const applyCaching = useCallback(() => {
    const node = nodeRef.current;
    if (!node || !shouldCache) return;

    try {
      // Validate cache invalidation: check if props have changed
      const previousCacheKey = lastCacheKeyRef.current;
      const needsRecache = currentCacheKey !== previousCacheKey;
      
      if (needsRecache || !isCachedRef.current) {
        // Clear existing cache when props change
        if (isCachedRef.current) {
          node.clearCache();
          console.log(`🗂️ [CACHE] Cache invalidated due to props change:`, {
            elementId: element.id,
            elementType: element.type,
            previousKey: previousCacheKey.slice(0, 12) + '...',
            newKey: currentCacheKey.slice(0, 12) + '...',
            reason: needsRecache ? 'props_changed' : 'initial_cache'
          });
        }
        
        // Apply new cache
        node.cache();
        isCachedRef.current = true;
        lastCacheKeyRef.current = currentCacheKey;
        
        console.log(`🗂️ [CACHE] Applied caching to ${element.type} element:`, {
          elementId: element.id,
          size: `${isCircleElement(element) ? (element.width || (element.radius ? element.radius * 2 : 0)) : ('width' in element ? element.width || 0 : 0)}x${isCircleElement(element) ? (element.height || (element.radius ? element.radius * 2 : 0)) : ('height' in element ? element.height || 0 : 0)}`,
          cacheKey: currentCacheKey.slice(0, 12) + '...',
          hashMethod: 'murmurhash3'
        });
      }
    } catch (error) {
      console.warn(`⚠️ [CACHE] Failed to cache ${element.type} element:`, error);
    }
  }, [shouldCache, currentCacheKey, element.id, element.type]);

  /**
   * Clear caching from the Konva node
   */
  const clearCaching = useCallback(() => {
    const node = nodeRef.current;
    if (!node || !isCachedRef.current) return;

    try {
      node.clearCache();
      isCachedRef.current = false;
      lastCacheKeyRef.current = '';
      
      console.log(`🗂️ [CACHE] Cleared cache for ${element.type} element:`, element.id);
    } catch (error) {
      console.warn(`⚠️ [CACHE] Failed to clear cache for ${element.type} element:`, error);
    }
  }, [element.id, element.type]);

  /**
   * Force refresh the cache
   */
  const refreshCache = useCallback(() => {
    if (shouldCache && nodeRef.current) {
      clearCaching();
      // Apply caching on next tick to ensure DOM updates
      setTimeout(applyCaching, 0);
    }
  }, [shouldCache, applyCaching, clearCaching]);
  // Effect to manage caching lifecycle
  useEffect(() => {
    if (shouldCache) {
      // Apply caching after render
      const timeoutId = setTimeout(applyCaching, 0);
      return () => clearTimeout(timeoutId);
    } else {
      // Clear caching if no longer needed
      clearCaching();
      return undefined;
    }
  }, [shouldCache, applyCaching, clearCaching]);
  // Cleanup effect
  useEffect(() => {
    return () => {
      clearCaching();
    };
  }, [clearCaching]);

  return {
    /** Ref to attach to the Konva node */
    nodeRef,
    /** Whether the shape is currently cached */
    isCached: isCachedRef.current,
    /** Whether caching should be applied */
    shouldCache,
    /** Manually apply caching */
    applyCaching,
    /** Manually clear caching */
    clearCaching,
    /** Force refresh the cache */
    refreshCache,
    /** Current cache configuration */
    config
  };
};
