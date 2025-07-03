import { useMemo, useRef, useCallback, useEffect } from 'react';
import { PanZoom, Size, ViewportBounds } from '../types';
import type { CanvasElement } from '../types/enhanced.types';
import { isRectangularElement } from '../types/enhanced.types';
import { PerformanceMonitor, recordMetric } from '../utils/performance';
import { QuadTree, spatialUtils } from '../utils/spatial/Quadtree';
import { shouldRebuildQuadtree, useMemoryOptimizedCulling } from '../utils/memory/MemoryOptimizedCulling';

export interface UseViewportCullingProps {
  elements: CanvasElement[];
  zoomLevel: number;
  panOffset: PanZoom;
  canvasSize: Size | null;
}

export interface CullingConfig {
  enableHierarchicalCulling: boolean;
  enableLOD: boolean;
  enableIntersectionObserver: boolean;
  enableQuadtree: boolean;
  bufferMultiplier: number;
  lodThresholds: {
    high: number;
    medium: number;
    low: number;
  };
  maxElementsPerGroup: number;
  quadtreeConfig?: {
    maxDepth?: number;
    maxElementsPerNode?: number;
    minNodeSize?: number;
  };
}

export interface ElementGroup {
  id: string;
  elements: CanvasElement[];
  bounds: ViewportBounds;
  level: number;
  isVisible: boolean;
}

export interface LODLevel {
  level: 'high' | 'medium' | 'low' | 'hidden';
  renderComplexity: number;
  enableEffects: boolean;
  enableText: boolean;
  maxTextSize: number;
}

// Helper to get element bounds with proper typing
const getElementBounds = (element: CanvasElement): { left: number; top: number; right: number; bottom: number } => {
  // Fast path: use cached bounding box if available
  if ((element as any).boundingBox) {
    const b = (element as any).boundingBox as {x:number;y:number;width:number;height:number};
    return { left:b.x, top:b.y, right:b.x + b.width, bottom:b.y + b.height };
  }

  switch (element.type) {
    case 'connector':
      if (element.pathPoints && element.pathPoints.length >= 4) {
        let minX = element.pathPoints[0] ?? element.x;
        let maxX = element.pathPoints[0] ?? element.x;
        let minY = element.pathPoints[1] ?? element.y;
        let maxY = element.pathPoints[1] ?? element.y;
        
        for (let i = 0; i < element.pathPoints.length; i += 2) {
          const x = element.pathPoints[i];
          const y = element.pathPoints[i + 1];
          if (x !== undefined && y !== undefined) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
        return { left: minX, top: minY, right: maxX, bottom: maxY };
      }
      const start = element.startPoint;
      const end = element.endPoint;
      return {
          left: Math.min(start.x, end.x),
          top: Math.min(start.y, end.y),
          right: Math.max(start.x, end.x),
          bottom: Math.max(start.y, end.y),
      };
    case 'pen':
      if (!element.points || element.points.length === 0) {
        return { left: element.x, top: element.y, right: element.x + 1, bottom: element.y + 1 };
      }
      let minX = element.points[0] ?? element.x;
      let maxX = element.points[0] ?? element.x;
      let minY = element.points[1] ?? element.y;
      let maxY = element.points[1] ?? element.y;
      
      for (let i = 0; i < element.points.length; i += 2) {
        const x = element.points[i];
        const y = element.points[i + 1];
        if (x !== undefined && y !== undefined) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
      return { left: minX, top: minY, right: maxX, bottom: maxY };
    case 'circle':
        return {
            left: element.x - element.radius,
            top: element.y - element.radius,
            right: element.x + element.radius,
            bottom: element.y + element.radius,
        };
    default:
      if (isRectangularElement(element)) {
          return {
            left: element.x,
            top: element.y,
            right: element.x + element.width,
            bottom: element.y + element.height,
          };
      }
      return { left: element.x, top: element.y, right: element.x + 1, bottom: element.y + 1 };
  }
};

// Enhanced viewport culling with hierarchical and LOD support
export const useViewportCulling = ({
  elements,
  zoomLevel,
  panOffset,
  canvasSize,
  config = {}
}: UseViewportCullingProps & { config?: Partial<CullingConfig> }) => {
  const cullingConfig: CullingConfig = {
    enableHierarchicalCulling: false, // DISABLED: Simplified for performance
    enableLOD: true,
    enableIntersectionObserver: false,
    enableQuadtree: true,
    bufferMultiplier: 0.2, // REDUCED: From 0.5 to 0.2
    lodThresholds: {
      high: 1.0,   // REDUCED: From 1.5 to 1.0
      medium: 0.2, // REDUCED: From 0.3 to 0.2
      low: 0.03    // REDUCED: From 0.05 to 0.03
    },
    maxElementsPerGroup: 20, // REDUCED: From 30 to 20
    quadtreeConfig: {
      maxDepth: 6, // REDUCED: From 8 to 6
      maxElementsPerNode: 3, // REDUCED: From 5 to 3
      minNodeSize: 100 // INCREASED: From 50 to 100
    },
    ...config
  };

  const quadtreeRef = useRef<QuadTree | null>(null);
  const lastElementCountRef = useRef(0);
  const lastRebuildTimeRef = useRef<number>(Date.now());

  // Memory-aware culling helper
  const { memoryPressure } = useMemoryOptimizedCulling();

  // Simplified quadtree rebuild logic
  useEffect(() => {
    if (!cullingConfig.enableQuadtree || !canvasSize) return;

    const elementCountChange = elements.length - lastElementCountRef.current;
    const timeSinceLastRebuild = Date.now() - lastRebuildTimeRef.current;

    const needsRebuild =
      !quadtreeRef.current ||
      shouldRebuildQuadtree(elementCountChange, memoryPressure, timeSinceLastRebuild);

    if (needsRebuild) {
      const canvasBounds = {
        x: -5000,
        y: -5000,
        width: 10000,
        height: 10000
      };

      quadtreeRef.current = spatialUtils.createCanvasQuadtree(canvasBounds, cullingConfig.quadtreeConfig);
      spatialUtils.batchInsertElements(quadtreeRef.current, elements);
      lastElementCountRef.current = elements.length;
      lastRebuildTimeRef.current = Date.now();
    }
  }, [elements.length, cullingConfig.enableQuadtree, canvasSize, memoryPressure]);

  // Calculate LOD level based on zoom
  const getLODLevel = useCallback((zoom: number): LODLevel => {
    if (zoom >= cullingConfig.lodThresholds.high) {
      return {
        level: 'high',
        renderComplexity: 1.0,
        enableEffects: true,
        enableText: true,
        maxTextSize: Infinity
      };
    } else if (zoom >= cullingConfig.lodThresholds.medium) {
      return {
        level: 'medium',
        renderComplexity: 0.7,
        enableEffects: true,
        enableText: true,
        maxTextSize: 100
      };
    } else if (zoom >= cullingConfig.lodThresholds.low) {
      return {
        level: 'low',
        renderComplexity: 0.4,
        enableEffects: false,
        enableText: false,
        maxTextSize: 50
      };
    } else {
      return {
        level: 'hidden',
        renderComplexity: 0,
        enableEffects: false,
        enableText: false,
        maxTextSize: 0
      };
    }
  }, [cullingConfig.lodThresholds]);

  // Simplified viewport bounds calculation
  const viewportBounds = useMemo(() => {
    if (!canvasSize || canvasSize.width === 0 || canvasSize.height === 0) {
      return null;
    }
    
    const buffer = Math.max(canvasSize.width, canvasSize.height) * cullingConfig.bufferMultiplier;
    
    return {
      left: (-panOffset.x - buffer) / zoomLevel,
      top: (-panOffset.y - buffer) / zoomLevel,
      right: (canvasSize.width - panOffset.x + buffer) / zoomLevel,
      bottom: (canvasSize.height - panOffset.y + buffer) / zoomLevel,
    };
  }, [panOffset.x, panOffset.y, canvasSize, zoomLevel, cullingConfig.bufferMultiplier]);

  const lodLevel = useMemo(() => getLODLevel(zoomLevel), [zoomLevel, getLODLevel]);

  return useMemo(() => {
    const endTiming = PerformanceMonitor.startTiming('viewportCulling');
    
    try {
      // Early return for invalid parameters
      if (!canvasSize || canvasSize.width === 0 || canvasSize.height === 0 || zoomLevel === 0 || !viewportBounds) {
        return {
          visibleElements: elements,
          culledElements: [],
          lodLevel,
          elementGroups: [],
          cullingStats: {
            totalElements: elements.length,
            visibleElements: elements.length,
            culledElements: 0,
            groupsCulled: 0,
            lodLevel: lodLevel.level
          }
        };
      }
      
      // Simplified LOD culling
      if (lodLevel.level === 'hidden') {
        const criticalElements = elements.filter(el => el.type === 'text' || el.isLocked);
        
        return {
          visibleElements: criticalElements,
          culledElements: elements.filter(el => !criticalElements.includes(el)),
          lodLevel,
          elementGroups: [],
          cullingStats: {
            totalElements: elements.length,
            visibleElements: criticalElements.length,
            culledElements: elements.length - criticalElements.length,
            groupsCulled: 0,
            lodLevel: lodLevel.level,
            quadtreeEnabled: cullingConfig.enableQuadtree && quadtreeRef.current !== null
          }
        };
      }

      let visibleElements: CanvasElement[] = [];
      let culledElements: CanvasElement[] = [];

      // Simplified culling logic - prefer quadtree when available
      if (cullingConfig.enableQuadtree && quadtreeRef.current && elements.length > 50) {
        const visibleIds = quadtreeRef.current.query(viewportBounds);
        const idSet = new Set<string>(visibleIds.map(id => id as string));
        visibleElements = elements.filter(el => idSet.has(el.id as string));
        culledElements = elements.filter(el => !idSet.has(el.id as string));
      } else {
        // Simple element-by-element culling
        elements.forEach(element => {
          const elementBounds = getElementBounds(element);
          const isIntersecting =
            elementBounds.left < viewportBounds.right &&
            elementBounds.right > viewportBounds.left &&
            elementBounds.top < viewportBounds.bottom &&
            elementBounds.bottom > viewportBounds.top;

          if (isIntersecting) {
            visibleElements.push(element);
          } else {
            culledElements.push(element);
          }
        });
      }

      // Simplified LOD filtering
      if (cullingConfig.enableLOD && lodLevel.level === 'low') {
        const filteredVisible = visibleElements.filter(element => 
          ['rectangle', 'circle', 'line', 'arrow', 'text'].includes(element.type)
        );
        
        const lodCulled = visibleElements.filter(el => !filteredVisible.includes(el));
        culledElements.push(...lodCulled);
        visibleElements = filteredVisible;
      }

      const cullingStats = {
        totalElements: elements.length,
        visibleElements: visibleElements.length,
        culledElements: culledElements.length,
        groupsCulled: 0,
        lodLevel: lodLevel.level
      };

      // Reduced metrics recording
      if (elements.length > 100) {
        recordMetric('viewportCullingVisible', visibleElements.length, 'render');
      }

      return {
        visibleElements,
        culledElements,
        lodLevel,
        elementGroups: [],
        cullingStats
      };
    } finally {
      endTiming();
    }
  }, [elements, zoomLevel, panOffset.x, panOffset.y, canvasSize?.width, canvasSize?.height, cullingConfig, viewportBounds, lodLevel]);
};
