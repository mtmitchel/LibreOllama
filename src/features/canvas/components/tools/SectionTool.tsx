/**
 * SectionTool - Interactive section drawing component
 * 
 * This component provides real-time visual feedback for section creation
 * with proper coordinate normalization to handle all drag directions.
 */

import React, { useCallback, useRef } from 'react';
import { Rect, Text } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../stores/canvasStore.enhanced';

interface SectionToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

interface PreviewSection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const SectionTool: React.FC<SectionToolProps> = ({ stageRef, isActive }) => {
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [previewSection, setPreviewSection] = React.useState<PreviewSection | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  // Store actions
  const createSection = useCanvasStore(state => state.createSection);
  const captureElementsAfterSectionCreation = useCanvasStore(state => state.captureElementsAfterSectionCreation);

  // Handle pointer down - start drawing
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    setIsDrawing(true);
    startPointRef.current = { x: pointer.x, y: pointer.y };
    setPreviewSection({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
  }, [isActive, stageRef]);

  // Handle pointer move - update preview
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !isDrawing || !startPointRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const startPos = startPointRef.current;
    
    // Normalize coordinates to handle all drag directions
    // The rectangle's position should be the minimum of start and current coordinates
    // The width/height should always be positive (absolute difference)
    const x = Math.min(pointer.x, startPos.x);
    const y = Math.min(pointer.y, startPos.y);
    const width = Math.abs(pointer.x - startPos.x);
    const height = Math.abs(pointer.y - startPos.y);
    
    // Ensure minimum size for visibility
    const minSize = 1;
    const normalizedWidth = Math.max(width, minSize);
    const normalizedHeight = Math.max(height, minSize);
    
    setPreviewSection({
      x,
      y,
      width: normalizedWidth,
      height: normalizedHeight
    });
  }, [isActive, isDrawing, stageRef]);

  // Handle pointer up - finish drawing
  const handlePointerUp = useCallback(() => {
    if (!isActive || !isDrawing || !previewSection) return;

    setIsDrawing(false);
    
    // Only create section if it's large enough
    const minSectionSize = 10;
    if (previewSection.width > minSectionSize && previewSection.height > minSectionSize) {
      const sectionId = createSection(
        previewSection.x,
        previewSection.y,
        previewSection.width,
        previewSection.height,
        'Untitled Section'
      );
      
      // Capture any elements that are now within this section
      if (sectionId) {
        captureElementsAfterSectionCreation(sectionId);
      }
    }
    
    // Reset state
    setPreviewSection(null);
    startPointRef.current = null;
  }, [isActive, isDrawing, previewSection, createSection, captureElementsAfterSectionCreation]);

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

  // Render preview section
  if (!isActive || !isDrawing || !previewSection) {
    return null;
  }

  return (
    <>
      {/* Preview section rectangle */}
      <Rect
        x={previewSection.x}
        y={previewSection.y}
        width={previewSection.width}
        height={previewSection.height}
        fill="#3B82F6"
        fillOpacity={0.1}
        stroke="#3B82F6"
        strokeWidth={2}
        dash={[5, 5]}
        listening={false}
      />
      
      {/* Section size indicator */}
      <Text
        x={previewSection.x + previewSection.width / 2}
        y={previewSection.y - 20}
        text={`${Math.round(previewSection.width)} × ${Math.round(previewSection.height)}`}
        fontSize={12}
        fill="#1E293B"
        align="center"
        listening={false}
      />
    </>
  );
};
