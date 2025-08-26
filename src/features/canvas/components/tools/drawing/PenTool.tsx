import React, { useCallback, useRef } from 'react';
import { Line } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { useToolEventHandler } from '../../../hooks/useToolEventHandler';
import { nanoid } from 'nanoid';
import { PenElement } from '../../../types/enhanced.types';
import { canvasLog } from '../../../utils/canvasLogger';
import { useRafThrottle } from '../../../hooks/useRafThrottle';

interface PenToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const PenTool: React.FC<PenToolProps> = ({ stageRef, isActive }) => {
  const isDrawingRef = useRef(false);

  // Cursor management is handled by CanvasStage's centralized cursor system

  // Store selectors using grouped patterns with useShallow for optimization
  const drawingState = useUnifiedCanvasStore(
    useShallow((state) => ({
      isDrawing: state.isDrawing,
      currentPath: state.currentPath,
      penColor: state.penColor
    }))
  );
  
  const drawingActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      startDrawing: state.startDrawing,
      updateDrawing: state.updateDrawing,
      finishDrawing: state.finishDrawing,
      cancelDrawing: state.cancelDrawing
    }))
  );
  
  const toolActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      setSelectedTool: state.setSelectedTool,
      addElement: state.addElement
    }))
  );
  
  const stickyNoteActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      findStickyNoteAtPoint: state.findStickyNoteAtPoint,
      addElementToStickyNote: state.addElementToStickyNote
    }))
  );

  // Destructure for easier access
  const { isDrawing: isDrawingStore, currentPath } = drawingState;
  const { startDrawing, updateDrawing, finishDrawing, cancelDrawing } = drawingActions;
  const { setSelectedTool, addElement } = toolActions;
  const { findStickyNoteAtPoint, addElementToStickyNote } = stickyNoteActions;

  // Handle pointer down - start drawing
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;
    
    // Only start drawing if clicking on the stage (not on an element)
    if (e.target !== stageRef.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    isDrawingRef.current = true;
    // Starting drawing
    startDrawing('pen', { x: pointer.x, y: pointer.y });
  }, [isActive, stageRef, startDrawing]);

  const throttledUpdateDrawing = useRafThrottle((point: { x: number; y: number }) => {
    updateDrawing(point);
  });

  // Handle pointer move - update drawing
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !isDrawingRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Updating drawing
    throttledUpdateDrawing({ x: pointer.x, y: pointer.y });
  }, [isActive, stageRef, throttledUpdateDrawing]);

  // Handle pointer up - finish drawing
  const handlePointerUp = useCallback(() => {
    if (!isActive || !isDrawingRef.current || !stageRef.current) return;

    isDrawingRef.current = false;
    // Finishing drawing

    // Use store's finishDrawing which now handles sticky note integration
    finishDrawing();

    // Keep pen tool active for multiple strokes
    // Pen stroke completed, keeping tool active
  }, [isActive, finishDrawing]);

  // Attach event listeners to stage when active
  useToolEventHandler({
    isActive,
    stageRef,
    toolName: 'PenTool',
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp
    }
  });

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