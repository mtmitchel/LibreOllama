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

  // Store actions
  const setViewport = useUnifiedCanvasStore(state => state.setViewport);
  const viewport = useUnifiedCanvasStore(state => state.viewport);

  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    setIsPanning(true);
    lastPointerPos.current = pointer;
    
    // Change cursor to grabbing
    stage.container().style.cursor = 'grabbing';
    
    // Prevent event bubbling
    e.evt.preventDefault();
  }, [isActive, stageRef]);

  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isPanning || !isActive || !stageRef.current || !lastPointerPos.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate delta
    const deltaX = pointer.x - lastPointerPos.current.x;
    const deltaY = pointer.y - lastPointerPos.current.y;

    // Update viewport position
    const newX = viewport.x + deltaX;
    const newY = viewport.y + deltaY;

    // Apply new position to stage
    stage.position({ x: newX, y: newY });
    stage.batchDraw();

    // Update store
    setViewport({ x: newX, y: newY });

    // Update last position
    lastPointerPos.current = pointer;
    
    // Prevent event bubbling
    e.evt.preventDefault();
  }, [isPanning, isActive, stageRef, viewport.x, viewport.y, setViewport]);

  const handlePointerUp = useCallback(() => {
    if (!isPanning || !isActive || !stageRef.current) return;

    setIsPanning(false);
    lastPointerPos.current = null;
    
    // Change cursor back to grab
    stageRef.current.container().style.cursor = 'grab';
  }, [isPanning, isActive, stageRef]);

  // Event listeners
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;

    const stage = stageRef.current;
    
    // Set cursor
    stage.container().style.cursor = 'grab';
    
    // Attach event listeners
    stage.on('pointerdown', handlePointerDown);
    stage.on('pointermove', handlePointerMove);
    stage.on('pointerup pointercancel', handlePointerUp);

    return () => {
      // Clean up event listeners
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerup pointercancel', handlePointerUp);
      
      // Reset cursor
      stage.container().style.cursor = 'default';
    };
  }, [isActive, handlePointerDown, handlePointerMove, handlePointerUp]);

  // Reset state when tool becomes inactive
  React.useEffect(() => {
    if (!isActive) {
      setIsPanning(false);
      lastPointerPos.current = null;
    }
  }, [isActive]);

  return null; // This component doesn't render anything
}; 