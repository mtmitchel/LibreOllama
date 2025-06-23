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
import { CanvasElement } from '../types/enhanced.types';

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
  const width = 'width' in element ? element.width : ('radius' in element ? element.radius * 2 : 0);
  const height = 'height' in element ? element.height : ('radius' in element ? element.radius * 2 : 0);
  const size = width * height;
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
 * Memoized to prevent expensive recalculation on every render
 */
const generateCacheKey = (element: CanvasElement, dependencies: any[] = []): string => {
  const visualProps = {
    type: element.type,
    width: 'width' in element ? element.width : ('radius' in element ? element.radius * 2 : undefined),
    height: 'height' in element ? element.height : ('radius' in element ? element.radius * 2 : undefined),
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

  return JSON.stringify([visualProps, ...dependencies]);
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
   * Apply caching to the Konva node
   */
  const applyCaching = useCallback(() => {
    const node = nodeRef.current;
    if (!node || !shouldCache) return;

    try {
      // Check if cache needs to be updated
      const needsRecache = currentCacheKey !== lastCacheKeyRef.current;
      
      if (needsRecache || !isCachedRef.current) {
        // Clear existing cache
        if (isCachedRef.current) {
          node.clearCache();
        }
        
        // Apply new cache
        node.cache();
        isCachedRef.current = true;
        lastCacheKeyRef.current = currentCacheKey;
          console.log(`🗂️ [CACHE] Applied caching to ${element.type} element:`, {
          elementId: element.id,
          size: `${('width' in element ? element.width : ('radius' in element ? element.radius * 2 : 0))}x${('height' in element ? element.height : ('radius' in element ? element.radius * 2 : 0))}`,
          cacheKey: currentCacheKey.slice(0, 50) + '...'
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
