/**
 * Drawing Containment - Ensures pen strokes are correctly contained within sections.
 * 
 * Part of LibreOllama Canvas Coordinate System Fixes - Priority 4
 * Updated to use store drawing state instead of internal state
 */
import React from 'react';
import { Group, Line } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../stores/canvasStore.enhanced';
import { useShallow } from 'zustand/react/shallow';

interface DrawingContainmentProps {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  isDrawing: boolean;
  currentTool: string;
}

export const DrawingContainment: React.FC<DrawingContainmentProps> = ({ 
  isDrawing, 
  currentTool 
}) => {
  // Get drawing state from store
  const { currentPath, drawingTool } = useCanvasStore(
    useShallow((state) => ({
      currentPath: state.currentPath,
      drawingTool: state.drawingTool
    }))
  );

  // Debug logging
  React.useEffect(() => {
    console.log('🎨 [DrawingContainment] State:', {
      isDrawing,
      currentTool,
      drawingTool,
      pathLength: currentPath.length,
      firstPoints: currentPath.slice(0, 4)
    });
  }, [isDrawing, currentTool, drawingTool, currentPath]);

  // Don't render anything if not actively drawing
  if (!isDrawing || !drawingTool || currentPath.length < 2) {
    return null;
  }

  // Render the live drawing path
  return (
    <Group>
      <Line 
        points={currentPath} 
        stroke={drawingTool === 'pen' ? '#000000' : '#666666'} 
        strokeWidth={drawingTool === 'pen' ? 2 : 1} 
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation="source-over"
      />
    </Group>
  );
};

export default DrawingContainment;
