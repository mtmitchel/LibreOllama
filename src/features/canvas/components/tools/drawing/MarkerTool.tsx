/**
 * MarkerTool - High-performance marker drawing component
 * 
 * Uses Konva refs and batchDraw for smooth real-time drawing without React re-renders
 */

import React, { useCallback, useRef } from 'react';
import { Line, Layer } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useToolEventHandler } from '../../../hooks/useToolEventHandler';
import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid';
import { createElementId } from '../../../types/enhanced.types';

interface MarkerToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  strokeStyle: {
    color: string;
    width: number;
    opacity: number;
    smoothness: number;
    lineCap: string;
    lineJoin: string;
  };
}

export const MarkerTool: React.FC<MarkerToolProps> = ({ 
  stageRef, 
  isActive, 
  strokeStyle 
}) => {
  // High-performance drawing refs - avoid React state updates during drawing
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<number[]>([]);
  const previewLineRef = useRef<Konva.Line | null>(null);
  const previewLayerRef = useRef<Konva.Layer | null>(null);

  // Store selectors - only for final stroke storage
  const { addElement, findStickyNoteAtPoint, addElementToStickyNote } = useUnifiedCanvasStore(
    useShallow((state) => ({
      addElement: state.addElement,
      findStickyNoteAtPoint: state.findStickyNoteAtPoint,
      addElementToStickyNote: state.addElementToStickyNote
    }))
  );

  // Handle pointer down - start drawing with high-performance refs
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current || !previewLineRef.current || !previewLayerRef.current) return;
    
    // Only start drawing if clicking on the stage (not on an element)
    if (e.target !== stageRef.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Initialize drawing with refs (no React state updates)
    isDrawingRef.current = true;
    pointsRef.current = [pointer.x, pointer.y];
    
    // Set up preview line on dedicated layer
    previewLineRef.current.points(pointsRef.current);
    previewLineRef.current.stroke(strokeStyle.color);
    previewLineRef.current.strokeWidth(strokeStyle.width);
    previewLineRef.current.opacity(strokeStyle.opacity);
    previewLayerRef.current.batchDraw();
  }, [isActive, stageRef, strokeStyle]);

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
      // Create marker element
      const markerElement = {
        id: createElementId(nanoid()),
        type: 'marker' as const,
        x: 0,
        y: 0,
        points: [...pointsRef.current], // Copy the points array
        style: { 
          color: strokeStyle.color,
          width: strokeStyle.width,
          opacity: strokeStyle.opacity,
          smoothness: strokeStyle.smoothness,
          lineCap: strokeStyle.lineCap,
          lineJoin: strokeStyle.lineJoin,
          blendMode: 'source-over',
          widthVariation: true,
          minWidth: strokeStyle.width * 0.5,
          maxWidth: strokeStyle.width * 1.5,
          pressureSensitive: false
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };

      // Add to store
      addElement(markerElement);

      // Check for sticky note integration
      const startPoint = { x: pointsRef.current[0], y: pointsRef.current[1] };
      const stickyNoteId = findStickyNoteAtPoint?.(startPoint);
      
      if (stickyNoteId) {
        addElementToStickyNote?.(markerElement.id, stickyNoteId);
      }
    }

    // Clear preview line and reset
    pointsRef.current = [];
    previewLineRef.current.points([]);
    previewLayerRef.current.batchDraw();
  }, [isActive, strokeStyle, addElement, findStickyNoteAtPoint, addElementToStickyNote]);

  // Attach event listeners to stage when active
  useToolEventHandler({
    isActive,
    stageRef,
    toolName: 'MarkerTool',
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
        stroke={strokeStyle.color}
        strokeWidth={strokeStyle.width}
        opacity={strokeStyle.opacity}
        tension={strokeStyle.smoothness}
        lineCap={strokeStyle.lineCap as any}
        lineJoin={strokeStyle.lineJoin as any}
        listening={false}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        hitStrokeWidth={0}
      />
    </Layer>
  );
};