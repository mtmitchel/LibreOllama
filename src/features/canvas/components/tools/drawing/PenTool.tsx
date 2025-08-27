import React, { useCallback, useRef } from 'react';
import { Line, Layer } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { useToolEventHandler } from '../../../hooks/useToolEventHandler';
import { createElementId } from '../../../types/enhanced.types';
import { nanoid } from 'nanoid';

interface PenToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const PenTool: React.FC<PenToolProps> = ({ stageRef, isActive }) => {
  // High-performance drawing refs - avoid React state updates during drawing
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<number[]>([]);
  const previewLineRef = useRef<Konva.Line | null>(null);
  const previewLayerRef = useRef<Konva.Layer | null>(null);

  // Store selectors - only for final stroke storage and pen color
  const { penColor, addElement, findStickyNoteAtPoint, addElementToStickyNote } = useUnifiedCanvasStore(
    useShallow((state) => ({
      penColor: state.penColor || '#000000',
      addElement: state.addElement,
      findStickyNoteAtPoint: state.findStickyNoteAtPoint,
      addElementToStickyNote: state.addElementToStickyNote
    }))
  );

  // Handle pointer down - start drawing with high-performance refs
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current || !previewLineRef.current || !previewLayerRef.current) return;
    
    // Only start drawing if clicking on the stage or background layer (not on existing elements)
    const stage = stageRef.current;
    const target = e.target;
    
    // Allow drawing on stage, background layer, or other non-element targets
    if (target !== stage && target.getClassName() !== 'Layer') {
      // Check if target is a shape element - if so, don't start drawing
      if (target.getClassName() === 'Group' || target.getClassName() === 'Rect' || 
          target.getClassName() === 'Circle' || target.getClassName() === 'Line' || 
          target.getClassName() === 'Text') {
        return;
      }
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Initialize drawing with refs (no React state updates)
    isDrawingRef.current = true;
    pointsRef.current = [pointer.x, pointer.y];
    
    // Set up preview line on dedicated layer
    previewLineRef.current.points(pointsRef.current);
    previewLineRef.current.stroke(penColor);
    previewLayerRef.current.batchDraw();
  }, [isActive, stageRef, penColor]);

  // Handle pointer move - ultra-fast updates via Konva refs
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !isDrawingRef.current || !stageRef.current || !previewLineRef.current || !previewLayerRef.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Add points to ref and update Konva directly - no React re-renders
    pointsRef.current.push(pointer.x, pointer.y);
    previewLineRef.current.points(pointsRef.current);
    
    // Batch draw for optimal performance
    previewLayerRef.current.batchDraw();
  }, [isActive, stageRef]);

  // Handle pointer up - commit final stroke to store
  const handlePointerUp = useCallback(() => {
    if (!isActive || !isDrawingRef.current || !previewLineRef.current || !previewLayerRef.current) return;

    isDrawingRef.current = false;
    
    // Only commit to store if we have enough points for a meaningful stroke
    if (pointsRef.current.length >= 4) {
      // Create pen element and add to store
      const penElement = {
        id: createElementId(nanoid()),
        type: 'pen' as const,
        x: 0,
        y: 0,
        points: [...pointsRef.current], // Copy the points array
        stroke: penColor,
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };
      
      // Add to store
      addElement(penElement);
      
      // Check for sticky note integration
      const startPoint = { x: pointsRef.current[0], y: pointsRef.current[1] };
      const stickyNoteId = findStickyNoteAtPoint?.(startPoint);
      
      if (stickyNoteId) {
        addElementToStickyNote?.(penElement.id, stickyNoteId);
      }
    }

    // Clear preview line and reset
    pointsRef.current = [];
    previewLineRef.current.points([]);
    previewLayerRef.current.batchDraw();
  }, [isActive, penColor, addElement, findStickyNoteAtPoint, addElementToStickyNote]);

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

  // Render dedicated preview layer for high-performance drawing
  if (!isActive) {
    return null;
  }

  return (
    <Layer
      ref={previewLayerRef}
      listening={false}
    >
      <Line
        ref={previewLineRef}
        points={[]}
        stroke={penColor}
        strokeWidth={2}
        tension={0}  // No tension for accurate path following
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation="source-over"
        listening={false}
        perfectDrawEnabled={false}  // Performance optimization
      />
    </Layer>
  );
}; 