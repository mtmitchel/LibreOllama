/**
 * Drawing Containment - Ensures pen strokes are correctly contained within sections.
 * 
 * Part of LibreOllama Canvas Coordinate System Fixes - Priority 4
 */
import React, { useCallback, useState, useEffect } from 'react';
import { Group, Line } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../stores/canvasStore.enhanced';
import type { PenElement, SectionId, Coordinates } from '../../types/enhanced.types';

interface DrawingContainmentProps {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  isDrawing: boolean;
  currentTool: string;
}

export const DrawingContainment: React.FC<DrawingContainmentProps> = ({ 
  stageRef, 
  isDrawing, 
  currentTool 
}) => {
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [drawingSectionId, setDrawingSectionId] = useState<SectionId | null>(null);
  const sections = useCanvasStore(state => state.sections);
  const addElement = useCanvasStore(state => state.addElement);

  // Get pointer position relative to containing section
  const getRelativePointerPosition = useCallback((): { pos: Coordinates; sectionId: SectionId | null } | null => {
    if (!stageRef.current) return null;
    
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return null;

    // Transform stage coordinates to canvas coordinates
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const canvasPos = transform.point(pointerPosition);
    
    // Find which section contains this point
    let containingSectionId: SectionId | null = null;
    let relativePos = canvasPos;
    
    for (const section of Object.values(sections)) {
      if (canvasPos.x >= section.x && 
          canvasPos.x <= section.x + section.width &&
          canvasPos.y >= section.y && 
          canvasPos.y <= section.y + section.height) {
        containingSectionId = section.id as SectionId;
        // Convert to relative coordinates within the section
        relativePos = {
          x: canvasPos.x - section.x,
          y: canvasPos.y - section.y
        };
        break;
      }
    }
    
    return {
      pos: relativePos,
      sectionId: containingSectionId
    };
  }, [stageRef, sections]);

  // Handle mouse down - start drawing
  const handleMouseDown = useCallback(() => {
    if (!isDrawing || currentTool !== 'pen') return;
    
    const info = getRelativePointerPosition();
    if (info) {
      setDrawingSectionId(info.sectionId);
      setCurrentPath([info.pos.x, info.pos.y]);
    }
  }, [isDrawing, currentTool, getRelativePointerPosition]);

  // Handle mouse move - continue drawing
  const handleMouseMove = useCallback(() => {
    if (!isDrawing || currentTool !== 'pen' || currentPath.length === 0) return;
    
    const info = getRelativePointerPosition();
    if (info && info.sectionId === drawingSectionId) {
      // Only continue drawing within the same section
      setCurrentPath(prev => [...prev, info.pos.x, info.pos.y]);
    }
  }, [isDrawing, currentTool, currentPath.length, drawingSectionId, getRelativePointerPosition]);

  // Handle mouse up - finish drawing
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || currentTool !== 'pen' || currentPath.length < 4) {
      // Reset state
      setCurrentPath([]);
      setDrawingSectionId(null);
      return;
    }

    // Create the PenElement with relative coordinates
    const penElement: Omit<PenElement, 'id'> = {
      type: 'pen',
      x: 0, // Relative to section
      y: 0, // Relative to section
      points: currentPath,
      sectionId: drawingSectionId,
      stroke: '#000000',
      strokeWidth: 2,
      tension: 0.5,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    addElement(penElement as PenElement);
    
    // Reset state
    setCurrentPath([]);
    setDrawingSectionId(null);
  }, [isDrawing, currentTool, currentPath, drawingSectionId, addElement]);

  // Attach event listeners to stage
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.on('mousedown touchstart', handleMouseDown);
    stage.on('mousemove touchmove', handleMouseMove);
    stage.on('mouseup touchend', handleMouseUp);

    return () => {
      stage.off('mousedown touchstart', handleMouseDown);
      stage.off('mousemove touchmove', handleMouseMove);
      stage.off('mouseup touchend', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  // Don't render anything if not actively drawing
  if (!isDrawing || currentTool !== 'pen' || currentPath.length === 0) {
    return null;
  }

  // Render the live drawing path inside a Group positioned at the section's origin
  const section = drawingSectionId ? sections[drawingSectionId] : null;
  
  return (
    <Group x={section?.x || 0} y={section?.y || 0}>
      <Line 
        points={currentPath} 
        stroke="#000000" 
        strokeWidth={2} 
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation="source-over"
      />
    </Group>
  );
};

export default DrawingContainment;
