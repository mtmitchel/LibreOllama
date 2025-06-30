/**
 * SectionTool - Interactive section drawing component
 * 
 * This component provides real-time visual feedback for section creation
 * with proper coordinate normalization to handle all drag directions.
 */

import React, { useCallback, useRef } from 'react';
import { Rect, Text } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';

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

  // Store actions - unified store
  const startDraftSection = useUnifiedCanvasStore(state => state.startDraftSection);
  const updateDraftSection = useUnifiedCanvasStore(state => state.updateDraftSection);
  const commitDraftSection = useUnifiedCanvasStore(state => state.commitDraftSection);
  const cancelDraftSection = useUnifiedCanvasStore(state => state.cancelDraftSection);
  const draftSection = useUnifiedCanvasStore(state => state.draftSection);

  // Handle pointer down - start drawing
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    setIsDrawing(true);
    startPointRef.current = pos;
    startDraftSection(pos);
    setPreviewSection({ x: pos.x, y: pos.y, width: 0, height: 0 });
  }, [isActive, stageRef, startDraftSection]);

  // Handle pointer move - update preview
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !isDrawing || !startPointRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const startPos = startPointRef.current;
    
    // Update draft section in store
    updateDraftSection(pos);
    
    // Normalize coordinates to handle all drag directions
    const x = Math.min(pos.x, startPos.x);
    const y = Math.min(pos.y, startPos.y);
    const width = Math.abs(pos.x - startPos.x);
    const height = Math.abs(pos.y - startPos.y);
    
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
  }, [isActive, isDrawing, stageRef, updateDraftSection]);

  // Handle pointer up - finish drawing
  const handlePointerUp = useCallback(() => {
    if (!isActive || !isDrawing) return;

    setIsDrawing(false);
    
    // Commit the draft section (this will create it if large enough)
    const sectionId = commitDraftSection();
    
    if (sectionId) {
      console.log('🎯 [SectionTool] Created section:', sectionId);
    }
    
    // Reset state
    setPreviewSection(null);
    startPointRef.current = null;
  }, [isActive, isDrawing, commitDraftSection]);

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

  // Render preview section (use store draft if available, fallback to local preview)
  const renderSection = draftSection || previewSection;
  
  if (!isActive || !isDrawing || !renderSection) {
    return null;
  }

  return (
    <>
      {/* Preview section rectangle */}
      <Rect
        x={renderSection.x}
        y={renderSection.y}
        width={renderSection.width}
        height={renderSection.height}
        fill="#3B82F6"
        fillOpacity={0.1}
        stroke="#3B82F6"
        strokeWidth={2}
        dash={[5, 5]}
        listening={false}
      />
      
      {/* Section size indicator */}
      <Text
        x={renderSection.x + renderSection.width / 2}
        y={renderSection.y - 20}
        text={`${Math.round(renderSection.width)} × ${Math.round(renderSection.height)}`}
        fontSize={12}
        fill="#1E293B"
        align="center"
        listening={false}
      />
    </>
  );
}; 