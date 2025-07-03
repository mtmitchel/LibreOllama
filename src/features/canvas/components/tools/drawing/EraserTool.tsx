/**
 * EraserTool - High-performance eraser with optimized incremental stroke erasing
 * PERFORMANCE OPTIMIZATION: Throttled updates and spatial optimization
 * STROKE ERASING: Implements efficient incremental erasing for pen/marker strokes
 */

import React, { useRef, useCallback, useState } from 'react';
import { Circle } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { EraserConfig } from '../../../types/drawing.types';
import { ElementId, CanvasElement } from '../../../types/enhanced.types';
import { Quadtree, createCanvasQuadtree, batchInsertElements } from '../../../utils/spatial/Quadtree';
import { unstable_batchedUpdates } from 'react-dom';

interface EraserToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  eraserConfig: EraserConfig;
}

const EraserToolComponent: React.FC<EraserToolProps> = ({
  stageRef,
  isActive,
  eraserConfig
}) => {
  const [isErasing, setIsErasing] = useState(false);
  const [eraserPosition, setEraserPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Performance optimization refs
  const lastErasePosition = useRef<{ x: number; y: number } | null>(null);
  const erasingThrottleRef = useRef<number | null>(null);
  const modifiedElementsRef = useRef<Set<ElementId>>(new Set());
  // Spatial index for fast erase candidate queries
  const quadtreeRef = useRef<Quadtree | null>(null);
  const lastElementCountRef = useRef<number>(0);
  
  // Store selectors and actions
  const elements = useUnifiedCanvasStore(state => state.elements);
  const deleteElement = useUnifiedCanvasStore(state => state.deleteElement);
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const addToHistory = useUnifiedCanvasStore(state => state.addToHistory);
  
  // Fast distance calculation (no sqrt for better performance)
  const getDistanceSquared = useCallback((x1: number, y1: number, x2: number, y2: number): number => {
    return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
  }, []);
  
  // Quick bounds check to filter out distant elements
  const isElementNearEraser = useCallback((element: CanvasElement, eraserX: number, eraserY: number, radius: number): boolean => {
    const buffer = radius + 50; // Add buffer for quick rejection
    
    // Stroke elements (pen/marker/highlighter) use absolute points and usually have x=y=0.
    if (['pen', 'marker', 'highlighter'].includes(element.type)) {
      // Check bounding box of stroke once (coarse)
      if (!element.points || element.points.length < 2) return false;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < element.points.length; i += 2) {
        const px = element.points[i];
        const py = element.points[i + 1];
        if (px === undefined || py === undefined) continue;
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
      }
      // Enlarge bounding box by buffer
      return eraserX >= minX - buffer && eraserX <= maxX + buffer && eraserY >= minY - buffer && eraserY <= maxY + buffer;
    }

    // For other elements use element's x,y quick check
    if (Math.abs(element.x - eraserX) > buffer || Math.abs(element.y - eraserY) > buffer) {
      return false;
    }
    return true;
  }, []);
  
  // Helper: distance from point to segment squared
  const getDistToSegmentSquared = useCallback((px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const l2 = getDistanceSquared(x1, y1, x2, y2);
    if (l2 === 0) return getDistanceSquared(px, py, x1, y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return getDistanceSquared(px, py, projX, projY);
  }, [getDistanceSquared]);
  
  // Optimized stroke erasing with point sampling
  const eraseFromStroke = useCallback((element: CanvasElement, eraserX: number, eraserY: number): CanvasElement | null => {
    const strokeElement = element as any;
    const points = strokeElement.points;
    const radiusSquared = Math.pow(eraserConfig.size / 2, 2);
    
    if (!points || points.length < 4) {
      return null;
    }
    
    const newPoints: number[] = [];
    let hasRemainingPoints = false;
    
    for (let i = 0; i < points.length - 2; i += 2) {
      const x1 = points[i];
      const y1 = points[i + 1];
      const x2 = points[i + 2];
      const y2 = points[i + 3];

      const distSegSq = getDistToSegmentSquared(eraserX, eraserY, x1, y1, x2, y2);
      const intersects = distSegSq <= radiusSquared;

      if (!intersects) {
        // keep first point (x1,y1) except when it's duplicate of last kept
        if (newPoints.length === 0 || newPoints[newPoints.length - 2] !== x1 || newPoints[newPoints.length - 1] !== y1) {
          newPoints.push(x1, y1);
        }
        // also push second point at loop end; ensure last point added outside loop
        hasRemainingPoints = true;
      }
      // if intersects, skip adding segment points (erases)
    }

    // push last original point if not erased
    const lastIdx = points.length - 2;
    const lastX = points[lastIdx];
    const lastY = points[lastIdx + 1];
    if (lastX !== undefined && lastY !== undefined) {
      // Ensure last point kept is not duplicate
      if (newPoints.length === 0 || newPoints[newPoints.length - 2] !== lastX || newPoints[newPoints.length - 1] !== lastY) {
        newPoints.push(lastX, lastY);
      }
    }
    
    // Clean up: if too few points remain, delete entire stroke
    if (!hasRemainingPoints || newPoints.length < 4) {
      return null;
    }
    
    return {
      ...element,
      points: newPoints,
      updatedAt: Date.now()
    } as CanvasElement;
  }, [eraserConfig.size, getDistToSegmentSquared]);
  
  // Fast intersection check for stroke elements
  const strokeIntersectsEraser = useCallback((element: CanvasElement, eraserX: number, eraserY: number, radius: number): boolean => {
    const points = (element as any).points as number[] | undefined;
    if (!points || points.length < 4) return false;

    const radiusSquared = radius * radius;

    // Check each line segment for distance to eraser center
    for (let i = 0; i < points.length - 2; i += 2) {
      const x1 = points[i];
      const y1 = points[i + 1];
      const x2 = points[i + 2];
      const y2 = points[i + 3];
      if ([x1, y1, x2, y2].some(v => v === undefined)) continue;
      const distSegSq = getDistToSegmentSquared(eraserX, eraserY, x1, y1, x2, y2);
      if (distSegSq <= radiusSquared) return true;
    }
    return false;
  }, [getDistToSegmentSquared]);
  
  // Simplified bounds-based intersection for other elements
  const elementIntersectsEraser = useCallback((element: CanvasElement, x: number, y: number, radius: number): boolean => {
    // Quick distance check first
    if (!isElementNearEraser(element, x, y, radius)) {
      return false;
    }
    
    // Handle stroke elements with optimized checking
    if (['pen', 'marker', 'highlighter'].includes(element.type)) {
      return strokeIntersectsEraser(element, x, y, radius);
    }
    
    // Simple distance check for other elements
    const distSquared = getDistanceSquared(element.x, element.y, x, y);
    return distSquared <= radius * radius;
  }, [isElementNearEraser, strokeIntersectsEraser, getDistanceSquared]);
  
  // Throttled element processing
  const processElementErasing = useCallback((x: number, y: number): void => {
    const radius = eraserConfig.size / 2;
    
    // Skip if we haven't moved much (reduce redundant processing)
    if (lastErasePosition.current) {
      const moveDistance = getDistanceSquared(x, y, lastErasePosition.current.x, lastErasePosition.current.y);
      if (moveDistance < 16) { // Less than 4px movement
        return;
      }
    }
    
    lastErasePosition.current = { x, y };
    
    // Process only elements that might intersect
    const elementsToProcess: Array<[ElementId, CanvasElement]> = [];

    const boundingBox = {
      left: x - radius,
      top: y - radius,
      right: x + radius,
      bottom: y + radius
    };

    let candidateIds: ElementId[];

    if (quadtreeRef.current && elements.size > 50) {
      candidateIds = quadtreeRef.current.query(boundingBox) as ElementId[];
    } else {
      candidateIds = Array.from(elements.keys());
    }

    candidateIds.forEach(id => {
      if (modifiedElementsRef.current.has(id)) return;
      const element = elements.get(id);
      if (!element) return;
      if (isElementNearEraser(element, x, y, radius)) {
        elementsToProcess.push([id, element]);
      }
    });
    
    // Limit processing to avoid lag
    const maxElementsPerFrame = 10;
    const elementsThisFrame = elementsToProcess.slice(0, maxElementsPerFrame);
    
    const deletes: ElementId[] = [];
    const updates: Array<[ElementId, CanvasElement]> = [];

    elementsThisFrame.forEach(([id, element]) => {
      const intersects = elementIntersectsEraser(element, x, y, radius);

      if (!intersects) return;

      if (['pen', 'marker', 'highlighter'].includes(element.type)) {
        const modifiedElement = eraseFromStroke(element, x, y);

        if (modifiedElement === null) {
          deletes.push(id);
          modifiedElementsRef.current.add(id);
        } else {
          updates.push([id, modifiedElement]);
          // keep id open for further erasing without adding to modified set
        }
      } else {
        deletes.push(id);
        modifiedElementsRef.current.add(id);
      }
    });

    if (deletes.length || updates.length) {
      unstable_batchedUpdates(() => {
        deletes.forEach(id => deleteElement(id));
        updates.forEach(([id, el]) => updateElement(id, el));
      });
    }
  }, [elements, eraserConfig.size, isElementNearEraser, elementIntersectsEraser, eraseFromStroke, deleteElement, updateElement, getDistanceSquared]);
  
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    setIsErasing(true);
    setEraserPosition(pos);
    modifiedElementsRef.current.clear();
    lastErasePosition.current = null;
    
    // Process initial erasing
    processElementErasing(pos.x, pos.y);
  }, [isActive, stageRef, processElementErasing]);
  
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!stageRef.current) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    setEraserPosition(pos);
    
    if (isErasing) {
      // Throttle erasing updates for better performance
      if (erasingThrottleRef.current) {
        cancelAnimationFrame(erasingThrottleRef.current);
      }
      
      erasingThrottleRef.current = requestAnimationFrame(() => {
        processElementErasing(pos.x, pos.y);
      });
    }
  }, [isErasing, processElementErasing]);
  
  const handlePointerUp = useCallback(() => {
    if (!isErasing) return;
    
    setIsErasing(false);
    
    // Clean up throttle
    if (erasingThrottleRef.current) {
      cancelAnimationFrame(erasingThrottleRef.current);
      erasingThrottleRef.current = null;
    }
    
    // Add to history
    addToHistory('eraseElements');
    
    modifiedElementsRef.current.clear();
    lastErasePosition.current = null;
  }, [isErasing, addToHistory]);
  
  const handlePointerLeave = useCallback(() => {
    setEraserPosition(null);
    if (erasingThrottleRef.current) {
      cancelAnimationFrame(erasingThrottleRef.current);
      erasingThrottleRef.current = null;
    }
  }, []);
  
  // Event listeners with cleanup
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    
    // Attach down & move on stage, but pointerup/cancel on window to avoid Konva event mutation bug
    stage.on('pointerleave', handlePointerLeave);
    stage.on('pointerdown', handlePointerDown);
    stage.on('pointermove', handlePointerMove);
    const winListener = () => handlePointerUp();
    window.addEventListener('pointerup', winListener);
    window.addEventListener('pointercancel', winListener);
    
    return () => {
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerleave', handlePointerLeave);
      window.removeEventListener('pointerup', winListener);
      window.removeEventListener('pointercancel', winListener);
      
      // Clean up throttle on unmount
      if (erasingThrottleRef.current) {
        cancelAnimationFrame(erasingThrottleRef.current);
      }
    };
  }, [isActive, stageRef, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave]);
  
  // Rebuild quadtree when element count changes significantly
  React.useEffect(() => {
    const totalElements = elements.size;
    const needsRebuild = !quadtreeRef.current || Math.abs(totalElements - lastElementCountRef.current) > 20;

    if (needsRebuild) {
      // Static generous canvas bounds – adjust if you have world bounds elsewhere
      const canvasBounds = { x: -5000, y: -5000, width: 10000, height: 10000 };
      quadtreeRef.current = createCanvasQuadtree(canvasBounds, {
        maxDepth: 6,
        maxElementsPerNode: 4,
        minNodeSize: 100
      });
      batchInsertElements(quadtreeRef.current, Array.from(elements.values()));
      lastElementCountRef.current = totalElements;
    }
  }, [elements]);
  
  // Simple cursor visual
  if (!isActive || !eraserPosition) {
    return null;
  }
  
  return (
    <Circle
      x={eraserPosition.x}
      y={eraserPosition.y}
      radius={eraserConfig.size / 2}
      stroke="#ff4444"
      strokeWidth={2}
      fill="rgba(255, 68, 68, 0.1)"
      listening={false}
      perfectDrawEnabled={false}
    />
  );
};

// PERFORMANCE FIX: Memoize component to prevent unnecessary re-renders
export const EraserTool = React.memo(EraserToolComponent);

export default EraserTool;

// PATCH: Safeguard Konva event firing against read-only currentTarget errors
if (!(Konva as any).__safeFirePatched) {
  const originalFire = Konva.Node.prototype._fire;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  Konva.Node.prototype._fire = function (eventType: string, evt: any, bubble?: boolean) {
    try {
      return originalFire.call(this, eventType, evt, bubble);
    } catch (err: any) {
      if (err?.message?.includes('currentTarget')) {
        const safeEvt = { ...(evt || {}) };
        return originalFire.call(this, eventType, safeEvt, bubble);
      }
      throw err;
    }
  };
  (Konva as any).__safeFirePatched = true;
} 