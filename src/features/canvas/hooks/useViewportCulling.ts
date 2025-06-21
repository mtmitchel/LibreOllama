import { useMemo, useRef, useCallback, useEffect } from 'react';
import { PanZoom, Size, ViewportBounds } from '../types';
import type { CanvasElement } from '../types/enhanced.types';
import { isRectangularElement } from '../types/enhanced.types';
import { PerformanceMonitor, recordMetric } from '../../../utils/performance';
import { Quadtree, createCanvasQuadtree, batchInsertElements } from '../utils/spatial/Quadtree';

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
  enableQuadtree: boolean; // New option for quadtree culling
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
  switch (element.type) {
    case 'connector':
      // For connectors and lines, use pathPoints if available
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
      // Fallback to start/end points
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
      // Default for elements without width/height (like text before dimensions are calculated)
      return { left: element.x, top: element.y, right: element.x + 1, bottom: element.y + 1 };
  }
};

// Removed unused defaultCullingConfig - using inline config instead

// Enhanced viewport culling with hierarchical and LOD support
export const useViewportCulling = ({
  elements,
  zoomLevel,
  panOffset,
  canvasSize,
  config = {}
}: UseViewportCullingProps & { config?: Partial<CullingConfig> }) => {
  const cullingConfig: CullingConfig = {
    enableHierarchicalCulling: true,
    enableLOD: true,
    enableIntersectionObserver: false, // Disabled by default for canvas elements
    enableQuadtree: true,
    bufferMultiplier: 1.2,
    lodThresholds: {
      high: 2.0,   // Zoom > 2x = high detail
      medium: 0.5, // Zoom 0.5x-2x = medium detail
      low: 0.1     // Zoom < 0.5x = low detail
    },
    maxElementsPerGroup: 50,
    quadtreeConfig: {
      maxDepth: 8,
      maxElementsPerNode: 10,
      minNodeSize: 50
    },
    ...config
  };

  // Only keep used refs
  const quadtreeRef = useRef<Quadtree | null>(null);
  const lastElementCountRef = useRef(0);

  // Initialize or update quadtree when elements change significantly
  useEffect(() => {
    if (!cullingConfig.enableQuadtree || !canvasSize) return;

    // Only rebuild quadtree if element count changed significantly
    const elementCountChanged = Math.abs(elements.length - lastElementCountRef.current) > 10;
    
    if (!quadtreeRef.current || elementCountChanged) {
      console.log('[Quadtree] Rebuilding spatial index for', elements.length, 'elements');
      
      // Create quadtree with canvas bounds
      const canvasBounds = {
        x: -10000,
        y: -10000,
        width: 20000,
        height: 20000
      };
      
      quadtreeRef.current = createCanvasQuadtree(canvasBounds, cullingConfig.quadtreeConfig);
      
      // Batch insert all elements
      batchInsertElements(quadtreeRef.current, elements);
      lastElementCountRef.current = elements.length;
      
      const stats = quadtreeRef.current.getStats();
      console.log('[Quadtree] Stats:', stats);
    }
  }, [elements.length, cullingConfig.enableQuadtree, cullingConfig.quadtreeConfig, canvasSize]);

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

  // Create hierarchical groups for better culling
  const createElementGroups = useCallback((elements: CanvasElement[]): ElementGroup[] => {
    if (!cullingConfig.enableHierarchicalCulling) {
      return [{
        id: 'default',
        elements,
        bounds: { left: 0, top: 0, right: 0, bottom: 0 },
        level: 0,
        isVisible: true
      }];
    }

    const groups: ElementGroup[] = [];
    const sortedElements = [...elements].sort((a, b) => a.x - b.x);
    
    for (let i = 0; i < sortedElements.length; i += cullingConfig.maxElementsPerGroup) {
      const groupElements = sortedElements.slice(i, i + cullingConfig.maxElementsPerGroup);
      
      // Calculate group bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      groupElements.forEach(element => {
        const bounds = getElementBounds(element);
        minX = Math.min(minX, bounds.left);
        minY = Math.min(minY, bounds.top);
        maxX = Math.max(maxX, bounds.right);
        maxY = Math.max(maxY, bounds.bottom);
      });

      groups.push({
        id: `group_${i / cullingConfig.maxElementsPerGroup}`,
        elements: groupElements,
        bounds: { left: minX, top: minY, right: maxX, bottom: maxY },
        level: 0,
        isVisible: false
      });
    }

    return groups;
  }, [cullingConfig.enableHierarchicalCulling, cullingConfig.maxElementsPerGroup]);

  // Removed unused utility functions (isInteractive, isStatic, isDraggable, isResizable, isEditable, getElementLOD)
  // These were not being used in the culling logic

  return useMemo(() => {
    const endTiming = PerformanceMonitor.startTiming('viewportCulling');
    
    try {
      // Early return for invalid parameters
      const isInitializing = !canvasSize || canvasSize.width === 0 || canvasSize.height === 0 || zoomLevel === 0;
      const isVerySmallCanvas = canvasSize && (canvasSize.width < 200 || canvasSize.height < 200);
      
      if (isInitializing || isVerySmallCanvas) {
        if (import.meta.env.DEV) {
          console.log(`[Enhanced ViewportCulling] ${isInitializing ? 'Initializing' : 'Very small canvas'} - showing all elements`);
        }
        return {
          visibleElements: elements,
          culledElements: [],
          lodLevel: getLODLevel(zoomLevel),
          elementGroups: [],
          cullingStats: {
            totalElements: elements.length,
            visibleElements: elements.length,
            culledElements: 0,
            groupsCulled: 0,
            lodLevel: getLODLevel(zoomLevel).level
          }
        };
      }

      const lodLevel = getLODLevel(zoomLevel);
      
      // If LOD level is hidden, cull everything except critical elements
      if (lodLevel.level === 'hidden') {
        const criticalElements = elements.filter(el =>
          el.type === 'text' || el.isLocked
        );
        
        recordMetric('viewportCullingLODHidden', elements.length - criticalElements.length, 'render');
        
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

      // Calculate viewport bounds with adaptive buffer
      const buffer = Math.max(50, canvasSize.width * 0.1 * cullingConfig.bufferMultiplier);
      
      const viewportBounds: ViewportBounds = {
        left: (-panOffset.x - buffer) / zoomLevel,
        top: (-panOffset.y - buffer) / zoomLevel,
        right: (canvasSize.width - panOffset.x + buffer) / zoomLevel,
        bottom: (canvasSize.height - panOffset.y + buffer) / zoomLevel,
      };

      // Create element groups for hierarchical culling
      const elementGroups = createElementGroups(elements);
      let visibleElements: CanvasElement[] = [];
      let culledElements: CanvasElement[] = [];
      let groupsCulled = 0;

      // Use quadtree for efficient spatial queries if enabled
      if (cullingConfig.enableQuadtree && quadtreeRef.current && elements.length > 100) {
        const startQuery = performance.now();
        
        // Query quadtree for visible element IDs
        const visibleIds = quadtreeRef.current.query(viewportBounds);
        
        // Map IDs back to elements (handle both ElementId and SectionId)
        const idSet = new Set<string>(visibleIds.map(id => id as string));
        visibleElements = elements.filter(el => idSet.has(el.id as string));
        culledElements = elements.filter(el => !idSet.has(el.id as string));
        
        const queryTime = performance.now() - startQuery;
        if (import.meta.env.DEV) {
          console.log(`[Quadtree] Query completed in ${queryTime.toFixed(2)}ms, found ${visibleElements.length} visible elements`);
        }
        
        recordMetric('quadtreeQueryTime', queryTime, 'render');
      } else if (cullingConfig.enableHierarchicalCulling) {
        // Process groups first
        elementGroups.forEach(group => {
          const groupIntersects =
            group.bounds.left < viewportBounds.right &&
            group.bounds.right > viewportBounds.left &&
            group.bounds.top < viewportBounds.bottom &&
            group.bounds.bottom > viewportBounds.top;

          if (groupIntersects) {
            group.isVisible = true;
            // Process individual elements in visible groups
            group.elements.forEach(element => {
              const elementBounds = getElementBounds(element);
              const isElementVisible =
                elementBounds.left < viewportBounds.right &&
                elementBounds.right > viewportBounds.left &&
                elementBounds.top < viewportBounds.bottom &&
                elementBounds.bottom > viewportBounds.top;

              if (isElementVisible) {
                visibleElements.push(element);
              } else {
                culledElements.push(element);
              }
            });
          } else {
            group.isVisible = false;
            groupsCulled++;
            culledElements.push(...group.elements);
          }
        });
      } else {
        // Standard element-by-element culling
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

      // Apply LOD filtering to visible elements
      if (cullingConfig.enableLOD && lodLevel.level !== 'high') {
        const filteredVisible = visibleElements.filter(element => {
          // Filter based on element complexity and LOD level
          if (lodLevel.level === 'low') {
            // Only show simple shapes at low LOD
            return ['rectangle', 'circle', 'line', 'arrow'].includes(element.type);
          } else if (lodLevel.level === 'medium') {
            // Show most elements but filter very complex ones
            if (element.type === 'pen' && element.points && element.points.length > 1000) {
              return false;
            }
            if (element.type === 'table' && element.rows && element.cols &&
                element.rows * element.cols > 100) {
              return false;
            }
          }
          return true;
        });

        const lodCulled = visibleElements.filter(el => !filteredVisible.includes(el));
        culledElements.push(...lodCulled);
        visibleElements = filteredVisible;
      }

      const cullingStats = {
        totalElements: elements.length,
        visibleElements: visibleElements.length,
        culledElements: culledElements.length,
        groupsCulled,
        lodLevel: lodLevel.level
      };

      // Record performance metrics
      recordMetric('viewportCullingVisible', visibleElements.length, 'render', {
        total: elements.length,
        culled: culledElements.length,
        cullRatio: culledElements.length / elements.length,
        lodLevel: lodLevel.level,
        zoom: zoomLevel
      });

      if (import.meta.env.DEV && elements.length > 0) {
        console.log(`[Enhanced ViewportCulling] LOD: ${lodLevel.level}, Visible: ${visibleElements.length}/${elements.length} (${Math.round(visibleElements.length/elements.length*100)}%), Groups: ${groupsCulled} culled`);
      }

      return {
        visibleElements,
        culledElements,
        lodLevel,
        elementGroups,
        cullingStats
      };
    } finally {
      endTiming();
    }
  }, [elements, zoomLevel, panOffset.x, panOffset.y, canvasSize?.width, canvasSize?.height, cullingConfig, getLODLevel, createElementGroups]);
};
