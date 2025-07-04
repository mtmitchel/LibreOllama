/**
 * HighlighterTool - Interactive highlighter drawing component
 * 
 * Simplified version based on working PenTool pattern
 */

import React, { useCallback, useRef, useState } from 'react';
import { Line } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useToolEventHandler } from '../../../hooks/useToolEventHandler';
import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid';
import { HighlighterElement } from '../../../types/enhanced.types';
import { ElementId } from '../../../types';
import { getStrokeBoundingBox } from '../../../utils/spatial/getStrokeBoundingBox';

interface HighlighterToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  strokeStyle: {
    color: string;
    width: number;
    opacity: number;
    blendMode: string;
  };
}

// Simple stroke smoothing function
const smoothStroke = (points: number[]): number[] => {
  if (points.length < 6) return points;
  
  const smoothed = [points[0], points[1]]; // Keep first point
  
  for (let i = 2; i < points.length - 2; i += 2) {
    const prevX = points[i - 2];
    const prevY = points[i - 1];
    const currX = points[i];
    const currY = points[i + 1];
    const nextX = points[i + 2];
    const nextY = points[i + 3];
    
    // Simple smoothing: average with neighbors
    const smoothX = (prevX + currX + nextX) / 3;
    const smoothY = (prevY + currY + nextY) / 3;
    
    smoothed.push(smoothX, smoothY);
  }
  
  // Keep last point
  smoothed.push(points[points.length - 2], points[points.length - 1]);
  return smoothed;
};

export const HighlighterTool: React.FC<HighlighterToolProps> = ({ 
  stageRef, 
  isActive, 
  strokeStyle 
}) => {
  const isDrawingRef = useRef(false);
  const [currentStroke, setCurrentStroke] = useState<number[]>([]);

  // Cursor management is handled by CanvasStage's centralized cursor system

  // Store actions using grouped selectors for optimization
  const stickyNoteActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      addElement: state.addElement,
      findStickyNoteAtPoint: state.findStickyNoteAtPoint,
      addElementToStickyNote: state.addElementToStickyNote
    }))
  );

  // Handle pointer down - start drawing
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;
    
    // Only start drawing if clicking on the stage (not on an element)
    if (e.target !== stageRef.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    isDrawingRef.current = true;
    setCurrentStroke([pointer.x, pointer.y]);
  }, [isActive, stageRef]);

  // Handle pointer move - update drawing with throttling
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !isDrawingRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Simple distance check to avoid adding too many points
    if (currentStroke.length >= 2) {
      const lastX = currentStroke[currentStroke.length - 2];
      const lastY = currentStroke[currentStroke.length - 1];
      const distance = Math.sqrt((pointer.x - lastX) ** 2 + (pointer.y - lastY) ** 2);
      
      // Only add point if moved at least 2 pixels (reduces point density)
      if (distance < 2) return;
    }

    setCurrentStroke(prev => [...prev, pointer.x, pointer.y]);
  }, [isActive, stageRef, currentStroke]);

  // Handle pointer up - finish drawing
  const handlePointerUp = useCallback(() => {
    if (!isActive || !isDrawingRef.current || !stageRef.current) return;

    isDrawingRef.current = false;

    if (currentStroke.length < 4) {
      setCurrentStroke([]);
      return;
    }

    // Smooth the stroke
    const smoothedStroke = smoothStroke(currentStroke);

    // Create highlighter element
    const bounds = getStrokeBoundingBox(smoothedStroke);
    const highlighterElement: HighlighterElement = {
      id: nanoid() as ElementId,
      type: 'highlighter',
      points: smoothedStroke,
      style: { 
        ...strokeStyle,
        smoothness: (strokeStyle as any).smoothness || 0.5,
        lineCap: (strokeStyle as any).lineCap || 'round',
        lineJoin: (strokeStyle as any).lineJoin || 'round',
        blendMode: 'multiply',
        baseOpacity: strokeStyle.opacity,
        highlightColor: strokeStyle.color
      },
      ...bounds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLocked: false,
      isHidden: false
    };

    // Add to store
    stickyNoteActions.addElement(highlighterElement);

    // Check for sticky note container
    const startPoint = { x: smoothedStroke[0], y: smoothedStroke[1] };
    const stickyNoteId = stickyNoteActions.findStickyNoteAtPoint(startPoint);
    if (stickyNoteId) {
      stickyNoteActions.addElementToStickyNote(highlighterElement.id, stickyNoteId);
    }

    // Clear current stroke
    setCurrentStroke([]);
  }, [isActive, currentStroke, strokeStyle, stickyNoteActions]);

  // Attach event listeners to stage when active
  useToolEventHandler({
    isActive,
    stageRef,
    toolName: 'HighlighterTool',
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp
    }
  });

  // Render current drawing stroke as preview
  if (!isActive || !isDrawingRef.current || currentStroke.length < 4) {
    return null;
  }

  return (
    <Line
      points={currentStroke}
      stroke={strokeStyle.color}
      strokeWidth={strokeStyle.width}
      opacity={strokeStyle.opacity}
      globalCompositeOperation={strokeStyle.blendMode as any}
      tension={0.3}
      lineCap="round"
      lineJoin="round"
      listening={false}
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
      hitStrokeWidth={0}
    />
  );
};

export default HighlighterTool; 