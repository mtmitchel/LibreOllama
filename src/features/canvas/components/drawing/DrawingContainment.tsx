/**
 * Drawing Containment - Ensures pen strokes are correctly contained within sections.
 * 
 * Part of LibreOllama Canvas Coordinate System Fixes - Priority 4
 * Updated to use store drawing state instead of internal state
 */
import React from 'react';
import { Group, Line } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore, canvasSelectors } from '../../../../stores';

interface DrawingContainmentProps {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  isDrawing: boolean;
  currentTool: string;
}

export const DrawingContainment: React.FC<DrawingContainmentProps> = ({ 
  isDrawing, 
  currentTool 
}) => {
  // Get drawing state from unified store
  const currentPath = useUnifiedCanvasStore((state) => state.currentPath);
  const selectedTool = useUnifiedCanvasStore(canvasSelectors.selectedTool);

  // Debug logging
  React.useEffect(() => {
    console.log('🎨 [DrawingContainment] State:', {
      isDrawing,
      currentTool,
      selectedTool,
      pathLength: Array.isArray(currentPath) ? currentPath.length : 0,
      firstPoints: Array.isArray(currentPath) ? currentPath.slice(0, 4) : []
    });
  }, [isDrawing, currentTool, selectedTool, currentPath]);

  // Don't render anything if not actively drawing with a pen/pencil tool
  const isPenTool = selectedTool === 'pen' || selectedTool === 'pencil';
  if (!isDrawing || !isPenTool || !Array.isArray(currentPath) || currentPath.length < 2) {
    return null;
  }

  // Render the live drawing path
  return (
    <Group>
      <Line 
        points={currentPath} 
        stroke={selectedTool === 'pen' ? '#000000' : '#666666'} 
        strokeWidth={selectedTool === 'pen' ? 2 : 1} 
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation="source-over"
      />
    </Group>
  );
};

export default DrawingContainment;
