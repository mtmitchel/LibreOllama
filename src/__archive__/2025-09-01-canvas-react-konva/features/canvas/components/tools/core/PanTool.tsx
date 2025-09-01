/**
 * PanTool - Canvas panning functionality
 * Enables dragging the canvas viewport when pan tool is active
 */

import React, { useCallback, useRef, useState } from 'react';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';

import { useShallow } from 'zustand/react/shallow';

interface PanToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const PanTool: React.FC<PanToolProps> = ({ stageRef, isActive }) => {
  const [isPanning, setIsPanning] = useState(false);
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);

  // Store subscriptions using grouped selectors for optimization
  const viewportState = useUnifiedCanvasStore(
    useShallow((state) => ({
      viewport: state.viewport,
      setViewport: state.setViewport
    }))
  );

  // Remove unused callbacks since we moved handlers inside useEffect

  // Use shared event handler hook
  const onPointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!stageRef.current) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    setIsPanning(true);
    lastPointerPos.current = pointer;
    e.evt.preventDefault();
  }, [stageRef]);

  const onPointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isPanning || !lastPointerPos.current) return;
     
    const stage = stageRef.current;
    if (!stage) return;
    
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
  }, [isPanning]);

  const onPointerUp = useCallback(() => {
    setIsPanning(false);
    lastPointerPos.current = null;
  }, []);

  

  // Reset state when tool becomes inactive
  React.useEffect(() => {
    if (!isActive) {
      setIsPanning(false);
      lastPointerPos.current = null;
    }
  }, [isActive]);

  return null; // This component doesn't render anything
}; 
// Archived (2025-09-01): Legacy pan tool for react-konva path.
