/**
 * EraserTool - Optimized eraser with spatial indexing and batched operations
 * PERFORMANCE OPTIMIZATION: Uses spatial index and batching for dramatically improved performance
 * STROKE ERASING: Implements efficient incremental erasing with segment-based options
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Circle } from 'react-konva';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useToolEventHandler } from '../../../hooks/useToolEventHandler';
import { EraserConfig } from '../../../types/drawing.types';
import { ElementId } from '../../../types/enhanced.types';

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
  const eraserPathRef = useRef<number[]>([]);
  
  // Store selectors and actions - using grouped selectors with useShallow
  const {
    strokeConfig,
    updateSpatialIndex,
    eraseAtPoint,
    eraseInPath
  } = useUnifiedCanvasStore(useShallow((state) => ({
    strokeConfig: state.strokeConfig,
    updateSpatialIndex: state.updateSpatialIndex,
    eraseAtPoint: state.eraseAtPoint,
    eraseInPath: state.eraseInPath
  })));
  
  const eraserSize = eraserConfig.size;
  
  // Update spatial index when tool becomes active
  useEffect(() => {
    if (isActive) {
      updateSpatialIndex();
    }
  }, [isActive, updateSpatialIndex]);
  
  // Optimized distance check (squared distance for performance)
  const getDistanceSquared = useCallback((x1: number, y1: number, x2: number, y2: number): number => {
    return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
  }, []);
  
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;
    
    e.cancelBubble = true;
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    setIsErasing(true);
    setEraserPosition(pos);
    
    // Initialize eraser path for path-based erasing
    eraserPathRef.current = [pos.x, pos.y];
    lastErasePosition.current = pos;
    
    // Erase at initial point
    eraseAtPoint(pos.x, pos.y, eraserSize);
  }, [isActive, eraserSize, eraseAtPoint]);
  
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!stageRef.current) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    setEraserPosition(pos);
    
    if (isErasing) {
      e.cancelBubble = true;
      
      // Throttle erasing by distance to reduce redundant processing
      if (lastErasePosition.current) {
        const moveDistanceSquared = getDistanceSquared(
          pos.x, pos.y, 
          lastErasePosition.current.x, lastErasePosition.current.y
        );
        
        // Skip if moved less than eraserSize/4 squared (for performance)
        const minMoveDistanceSquared = Math.pow(eraserSize / 4, 2);
        if (moveDistanceSquared < minMoveDistanceSquared) return;
      }
      
      lastErasePosition.current = pos;
      eraserPathRef.current.push(pos.x, pos.y);
      
      // Erase at current point
      eraseAtPoint(pos.x, pos.y, eraserSize);
    }
  }, [isErasing, eraserSize, eraseAtPoint, getDistanceSquared]);
  
  const handlePointerUp = useCallback(() => {
    if (!isActive || !isErasing) return;
    
    setIsErasing(false);
    
    // Use path-based erasing for the entire path
    if (eraserPathRef.current.length > 2) {
      eraseInPath(eraserPathRef.current, eraserSize);
    }
    
    // Reset state
    eraserPathRef.current = [];
    lastErasePosition.current = null;
  }, [isActive, isErasing, eraseInPath, eraserSize]);
  
  const handlePointerLeave = useCallback(() => {
    setEraserPosition(null);
  }, []);
  
  // Event listeners with cleanup
  useToolEventHandler({
    isActive,
    stageRef,
    toolName: 'EraserTool',
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave
    }
  });

  // Additional window events for reliable pointer up detection
  useEffect(() => {
    if (!isActive) return;
    
    const handleWindowPointerUp = () => handlePointerUp();
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
    
    return () => {
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [isActive, handlePointerUp]);
  
  // Clean eraser cursor visual - simple circle with center dot for precision
  if (!isActive || !eraserPosition) {
    return null;
  }
  
  return (
    <>
      {/* Main eraser circle */}
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
      {/* Center dot for precision */}
      <Circle
        x={eraserPosition.x}
        y={eraserPosition.y}
        radius={1}
        fill="#ff4444"
        listening={false}
        perfectDrawEnabled={false}
      />
    </>
  );
};

// PERFORMANCE FIX: Memoize component to prevent unnecessary re-renders
export const EraserTool = React.memo(EraserToolComponent);

export default EraserTool;

// PATCH: Safeguard Konva event firing against read-only currentTarget errors
if (!(Konva as any).__safeFirePatched) {
  const originalFire = Konva.Node.prototype._fire;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Necessary for Konva monkey patch to fix currentTarget errors
  Konva.Node.prototype._fire = function (eventType: string, evt: any, bubble?: boolean) {
    try {
      return originalFire.call(this, eventType, evt);
    } catch (err: any) {
      if (err?.message?.includes('currentTarget')) {
        const safeEvt = { ...(evt || {}) };
        return originalFire.call(this, eventType, safeEvt);
      }
      throw err;
    }
  };
  (Konva as any).__safeFirePatched = true;
} 