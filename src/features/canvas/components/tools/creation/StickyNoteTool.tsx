/**
 * StickyNoteTool - FigJam-style sticky note placement tool (Refactored)
 * 
 * Features:
 * - Cursor preview with attached sticky note shadow
 * - Click-to-place with immediate text editing
 * - FigJam color palette integration
 * - Auto-sizing based on content
 * - Professional sticky note styling
 */

import React, { useCallback } from 'react';
import { Group, Text, Rect } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { BaseCreationTool, Vector2d } from '../base';
import { nanoid } from 'nanoid';
import { StickyNoteElement, ElementId } from '../../../types/enhanced.types';

interface StickyNoteToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const StickyNoteTool: React.FC<StickyNoteToolProps> = ({ stageRef, isActive }) => {
  // Store selectors for sticky note functionality
  const stickyNoteState = useUnifiedCanvasStore(
    useShallow((state) => ({
      selectedStickyNoteColor: state.selectedStickyNoteColor,
      enableStickyNoteContainer: state.enableStickyNoteContainer
    }))
  );

  const { selectedStickyNoteColor, enableStickyNoteContainer } = stickyNoteState;

  // Create sticky note element function
  const createStickyNoteElement = useCallback((position: Vector2d): StickyNoteElement => {
    // Adjust position to center the sticky note on cursor (same as preview)
    const stickyNoteSize = 180;
    const adjustedPosition = {
      x: position.x - (stickyNoteSize / 2),
      y: position.y - (stickyNoteSize / 2)
    };

    // Use selected color or default soft pastel yellow
    const backgroundColor = selectedStickyNoteColor || '#FFF2CC';

    return {
      id: nanoid() as ElementId,
      type: 'sticky-note',
      x: adjustedPosition.x,
      y: adjustedPosition.y,
      width: 180, // FigJam default size
      height: 180,
      text: '', // Start with empty text so immediate editing begins
      backgroundColor: backgroundColor,
      textColor: '#1F2937', // Dark gray for good contrast
      fontSize: 14,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      textAlign: 'left',
      isLocked: false,
      sectionId: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isHidden: false,
      // Container functionality - automatically enabled for new sticky notes
      isContainer: true,
      childElementIds: [],
      allowedChildTypes: ['pen', 'marker', 'highlighter', 'text', 'connector', 'image', 'table'],
      clipChildren: true,
      maxChildElements: 20
    };
  }, [selectedStickyNoteColor]);

  // Custom creation handler for container setup
  const handleElementCreated = useCallback((element: StickyNoteElement) => {
    // Enable container functionality
    setTimeout(() => {
      enableStickyNoteContainer(element.id, {
        allowedTypes: ['pen', 'marker', 'highlighter', 'text', 'connector', 'image', 'table'],
        clipChildren: true,
        maxChildren: 20
      });
    }, 50);
  }, [enableStickyNoteContainer]);

  // Render preview with sticky note shadow
  const renderPreview = useCallback((position: Vector2d, showGuide: boolean, startPos?: Vector2d, endPos?: Vector2d) => {
    if (!showGuide) return null;

    const stickyNoteSize = 180;
    const backgroundColor = selectedStickyNoteColor || '#FFF2CC';
    
    // Center the preview on cursor position
    const previewX = position.x - (stickyNoteSize / 2);
    const previewY = position.y - (stickyNoteSize / 2);

    return (
      <Group>
        {/* Sticky note preview */}
        <Rect
          x={previewX}
          y={previewY}
          width={stickyNoteSize}
          height={stickyNoteSize}
          fill={backgroundColor}
          stroke="#DDD"
          strokeWidth={1}
          cornerRadius={4}
          opacity={0.8}
          listening={false}
          shadowEnabled={true}
          shadowColor="#000000"
          shadowBlur={4}
          shadowOpacity={0.2}
          shadowOffsetX={2}
          shadowOffsetY={2}
        />
        
        {/* Preview text */}
        <Text
          x={previewX + 10}
          y={previewY + 10}
          text="Click to add note"
          fontSize={14}
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fill="#666666"
          opacity={0.7}
          listening={false}
        />
      </Group>
    );
  }, [selectedStickyNoteColor]);

  return (
    <BaseCreationTool
      stageRef={stageRef}
      isActive={isActive}
      type="sticky-note"
      onCreate={createStickyNoteElement}
      onCreated={handleElementCreated}
      renderPreview={renderPreview}
      requiresDrag={false}
      shouldSwitchToSelect={true}
      shouldStartTextEdit={true}
    />
  );
}; 