// src/components/canvas/shapes/CachedShape.tsx
/**
 * Higher-Order Component for Shape Caching Integration
 * Part of Phase 4.2 - Shape Caching Implementation
 * 
 * Wraps any shape component with intelligent caching capabilities.
 */

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Group } from 'react-konva';
import { logger } from '@/lib/logger';
import Konva from 'konva';
import { useShapeCaching } from '../hooks/useShapeCaching';
import { CanvasElement } from '../stores/types';

interface CachedShapeProps {
  /** The element data for caching decisions */
  element: CanvasElement;
  /** Child components to render inside the cached group */
  children: React.ReactNode;
  /** Optional cache configuration override */
  cacheConfig?: {
    enabled?: boolean;
    forceCache?: boolean;
    complexityThreshold?: number;
    sizeThreshold?: number;
  };
  /** Additional dependencies for cache invalidation */
  cacheDependencies?: any[];
  /** Standard Group props */
  [key: string]: any;
}

export interface CachedShapeRef {
  /** Direct access to the Konva Group node */
  getKonvaNode: () => Konva.Group | null;
  /** Manually refresh the cache */
  refreshCache: () => void;
  /** Check if the shape is currently cached */
  isCached: () => boolean;
}

/**
 * CachedShape - HOC that adds intelligent caching to shape components
 * 
 * Features:
 * - Automatic cache decisions based on complexity and size
 * - Cache invalidation when visual properties change
 * - Performance monitoring and logging
 * - Compatible with existing shape hierarchy
 */
export const CachedShape = forwardRef<CachedShapeRef, CachedShapeProps>(({
  element,
  children,
  cacheConfig,
  cacheDependencies = [],
  ...groupProps
}, ref) => {
  const groupRef = useRef<Konva.Group>(null);
    // Initialize shape caching
  const {
    nodeRef,
    isCached,
    shouldCache,
    refreshCache,
    config
  } = useShapeCaching({
    element,
    cacheConfig,
    dependencies: cacheDependencies
  });

  // Sync nodeRef with groupRef
  React.useEffect(() => {
    nodeRef.current = groupRef.current;
  }, [nodeRef]);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    getKonvaNode: () => groupRef.current,
    refreshCache,
    isCached: () => isCached
  }), [refreshCache, isCached]);
  // Performance logging for development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && shouldCache) {
      logger.log(`🗂️ [CACHE DEBUG] ${element.type} shape caching:`, {
        elementId: element.id,
        shouldCache,
        isCached,
        config,
        size: `${element.width || 0}x${element.height || 0}`
      });
    }
  }, [element.type, element.id, shouldCache, isCached, config, element.width, element.height]);
  return (
    <Group
      ref={groupRef}
      data-testid="cached-shape"
      {...groupProps}
      // Add visual indicator for cached shapes in development
      {...(process.env.NODE_ENV === 'development' && isCached && {
        // Subtle border to indicate cached shapes during development
        onMouseEnter: (e) => {
          const stage = e.target.getStage();
          if (stage?.container()) {
            stage.container().title = `Cached ${element.type} (${element.id})`;
          }
          groupProps.onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          const stage = e.target.getStage();
          if (stage?.container()) {
            stage.container().title = '';
          }
          groupProps.onMouseLeave?.(e);
        }
      })}
    >
      {children}
    </Group>
  );
});

CachedShape.displayName = 'CachedShape';
