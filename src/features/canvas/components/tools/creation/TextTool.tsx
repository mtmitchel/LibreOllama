/**
 * TextTool - Interactive text placement tool (Refactored)
 * 
 * Features:
 * - Crosshairs cursor when active
 * - Floating "Add text" label following cursor
 * - Dashed preview box before placement
 * - Click-to-place with immediate text editing
 * - In-place editing with blinking cursor
 * - Save on Tab/click elsewhere, Enter for line breaks
 * - Automatic selection for resize/move
 */

import React, { useCallback } from 'react';
import { Group, Text, Rect } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { BaseCreationTool, Vector2d } from '../base';
import { nanoid } from 'nanoid';
import { TextElement, ElementId } from '../../../types/enhanced.types';

interface TextToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const TextTool: React.FC<TextToolProps> = ({ stageRef, isActive }) => {
  // Store selectors for sticky note integration
  const stickyNoteActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      findStickyNoteAtPoint: state.findStickyNoteAtPoint,
      addElementToStickyNote: state.addElementToStickyNote
    }))
  );

  const { findStickyNoteAtPoint, addElementToStickyNote } = stickyNoteActions;

  // Cursor management is handled by CanvasStage's centralized cursor system

  // Create text element function
  const createTextElement = useCallback((position: Vector2d): TextElement => {
    return {
      id: nanoid() as ElementId,
      type: 'text',
      x: position.x,
      y: position.y,
      width: 20, // Start minimal - will auto-expand during typing
      height: 24, // Just enough for one line of text
      text: '', // Start with empty text so placeholder shows
      fontSize: 16,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fill: '#000000',
      fontStyle: 'normal',
      textAlign: 'left',
      isLocked: false,
      sectionId: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isHidden: false
    };
  }, []);

  // Custom creation handler for sticky note integration
  const handleElementCreated = useCallback((element: TextElement) => {
    // Check if the text was created within a sticky note container
    const stickyNoteId = findStickyNoteAtPoint({ x: element.x, y: element.y });
    
    if (stickyNoteId) {
      console.log('📝 [TextTool] Adding text to sticky note container:', stickyNoteId);
      addElementToStickyNote(element.id, stickyNoteId);
    }
  }, [findStickyNoteAtPoint, addElementToStickyNote]);

  // Render preview with dashed box and label
  const renderPreview = useCallback((position: Vector2d, showGuide: boolean, startPos?: Vector2d, endPos?: Vector2d) => {
    if (!showGuide) return null;

    return (
      <Group>
        {/* Dashed preview box */}
        <Rect
          x={position.x}
          y={position.y}
          width={120}
          height={32}
          stroke="#3B82F6"
          strokeWidth={1}
          dash={[4, 4]}
          fill="rgba(59, 130, 246, 0.1)"
          listening={false}
        />
        
        {/* "Add text" label */}
        <Text
          x={position.x + 5}
          y={position.y + 8}
          text="Add text"
          fontSize={14}
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fill="#666666"
          listening={false}
        />
      </Group>
    );
  }, []);

  return (
    <BaseCreationTool
      stageRef={stageRef}
      isActive={isActive}
      type="text"
      onCreate={createTextElement}
      onCreated={handleElementCreated}
      renderPreview={renderPreview}
      requiresDrag={false}
      shouldSwitchToSelect={false} // Stay in text tool for multiple text creation
      shouldStartTextEdit={true}
    />
  );
}; 