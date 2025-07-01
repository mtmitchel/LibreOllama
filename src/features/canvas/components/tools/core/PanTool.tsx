/**
 * PanTool - Canvas panning functionality
 * Enables dragging the canvas viewport when pan tool is active
 */

import React, { useCallback, useRef, useState } from 'react';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';

interface PanToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const PanTool: React.FC<PanToolProps> = ({ stageRef, isActive }) => {
  const [isPanning, setIsPanning] = useState(false);
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);

  // Store subscriptions (minimal)
  const viewport = useUnifiedCanvasStore(state => state.viewport);
  const setViewport = useUnifiedCanvasStore(state => state.setViewport);

  // Remove unused callbacks since we moved handlers inside useEffect

  // Event listeners - optimized to prevent excessive re-mounting
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;

    const stage = stageRef.current;
    
    // Create stable event handlers that don't depend on closures
    const onPointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
      if (!stageRef.current) return;
      
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      setIsPanning(true);
      lastPointerPos.current = pointer;
      e.evt.preventDefault();
    };

    const onPointerMove = (e: Konva.KonvaEventObject<PointerEvent>) => {
      if (!isPanning || !lastPointerPos.current) return;
       
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const deltaX = pointer.x - lastPointerPos.current.x;
      const deltaY = pointer.y - lastPointerPos.current.y;

      // Store-first update (no direct stage manipulation)
      const currentViewport = useUnifiedCanvasStore.getState().viewport;
      useUnifiedCanvasStore.getState().setViewport({
        ...currentViewport,
        x: currentViewport.x + deltaX,
        y: currentViewport.y + deltaY
      });

      lastPointerPos.current = pointer;
      e.evt.preventDefault();
    };

    const onPointerUp = () => {
      setIsPanning(false);
      lastPointerPos.current = null;
    };
    
    // Attach event listeners
    stage.on('pointerdown', onPointerDown);
    stage.on('pointermove', onPointerMove);
    stage.on('pointerup pointercancel', onPointerUp);

    return () => {
      // Clean up event listeners
      stage.off('pointerdown', onPointerDown);
      stage.off('pointermove', onPointerMove);
      stage.off('pointerup pointercancel', onPointerUp);
    };
  }, [isActive, isPanning]); // Include isPanning dependency

  // Reset state when tool becomes inactive
  React.useEffect(() => {
    if (!isActive) {
      setIsPanning(false);
      lastPointerPos.current = null;
    }
  }, [isActive]);

  return null; // This component doesn't render anything
}; 