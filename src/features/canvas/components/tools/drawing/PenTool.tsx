/**
 * PenTool - Interactive pen drawing component
 * 
 * This component provides real-time pen drawing functionality with proper
 * state management and stroke rendering.
 */

import React, { useCallback, useRef } from 'react';
import { Line } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { nanoid } from 'nanoid';
import { PenElement } from '../../../types/enhanced.types';
import { canvasLog } from '../../../utils/canvasLogger';

interface PenToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const PenTool: React.FC<PenToolProps> = ({ stageRef, isActive }) => {
  const isDrawingRef = useRef(false);

  // Store selectors and actions - unified store
  const isDrawingStore = useUnifiedCanvasStore(state => state.isDrawing);
  const currentPath = useUnifiedCanvasStore(state => state.currentPath);
  const startDrawing = useUnifiedCanvasStore(state => state.startDrawing);
  const updateDrawing = useUnifiedCanvasStore(state => state.updateDrawing);
  const finishDrawing = useUnifiedCanvasStore(state => state.finishDrawing);
  const cancelDrawing = useUnifiedCanvasStore(state => state.cancelDrawing);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);

  // Container related actions
  const findStickyNoteAtPoint = useUnifiedCanvasStore(state => state.findStickyNoteAtPoint);
  const addElementToStickyNote = useUnifiedCanvasStore(state => state.addElementToStickyNote);
  const addElement = useUnifiedCanvasStore(state => state.addElement);

  // Handle pointer down - start drawing
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;
    
    // Only start drawing if clicking on the stage (not on an element)
    if (e.target !== stageRef.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    isDrawingRef.current = true;
    canvasLog.debug('🖊️ [PenTool] Starting drawing at:', pointer);
    startDrawing('pen', { x: pointer.x, y: pointer.y });
  }, [isActive, stageRef, startDrawing]);

  // Handle pointer move - update drawing
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !isDrawingRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    canvasLog.debug('🖊️ [PenTool] Updating drawing at:', pointer);
    updateDrawing({ x: pointer.x, y: pointer.y });
  }, [isActive, stageRef, updateDrawing]);

  // Handle pointer up - finish drawing
  const handlePointerUp = useCallback(() => {
    if (!isActive || !isDrawingRef.current || !stageRef.current) return;

    isDrawingRef.current = false;
    canvasLog.debug('🖊️ [PenTool] Finishing drawing');

    // Use store's finishDrawing which now handles sticky note integration
    finishDrawing();

    // Keep pen tool active for multiple strokes
    canvasLog.debug('🖊️ [PenTool] Pen stroke completed, keeping tool active');
  }, [isActive, finishDrawing]);

  // Attach event listeners to stage when active
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;

    const stage = stageRef.current;
    stage.on('pointerdown', handlePointerDown);
    stage.on('pointermove', handlePointerMove);
    stage.on('pointerup', handlePointerUp);

    return () => {
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerup', handlePointerUp);
    };
  }, [isActive, handlePointerDown, handlePointerMove, handlePointerUp, stageRef]);

  // Render current drawing stroke as preview
  if (!isActive || !isDrawingStore || !currentPath || currentPath.length < 4) {
    return null;
  }

  return (
    <Line
      points={currentPath}
      stroke="#000000"
      strokeWidth={2}
      tension={0.5}
      lineCap="round"
      lineJoin="round"
      globalCompositeOperation="source-over"
      listening={false}
    />
  );
}; 