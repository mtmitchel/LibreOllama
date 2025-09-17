/**
 * TextRenderer - Renders text elements on the Konva canvas
 * Handles both display and editing modes with proper event handling
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { Group, Text, Rect } from 'react-konva';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';
import { useUnifiedCanvasStore } from '../../stores/unifiedCanvasStore';
import { TextElement, ElementId } from '../../types/enhanced.types';
import { CanvasTextInput } from '../ui/CanvasTextInput';

interface TextRendererProps {
  element: TextElement;
  isSelected: boolean;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => void;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>, element: TextElement) => void;
  onStartTextEdit: (elementId: ElementId) => void;
}

export const TextRenderer: React.FC<TextRendererProps> = ({
  element,
  isSelected,
  onDragEnd,
  onClick,
  onStartTextEdit
}) => {
  const textRef = useRef<Konva.Text>(null);

  // Store access for text editing
  const {
    textEditingElementId,
    setTextEditingElement,
    updateElement,
    viewport
  } = useUnifiedCanvasStore(useShallow((state) => ({
    textEditingElementId: state.textEditingElementId,
    setTextEditingElement: state.setTextEditingElement,
    updateElement: state.updateElement,
    viewport: state.viewport
  })));

  const isEditing = textEditingElementId === element.id;

  // Handle double-click to start editing
  const handleDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onStartTextEdit(element.id);
  }, [element.id, onStartTextEdit]);

  // Handle text save from editor
  const handleTextSave = useCallback((newText: string) => {
    updateElement(element.id, { 
      text: newText,
      updatedAt: Date.now()
    });
    setTextEditingElement(null);
  }, [element.id, updateElement, setTextEditingElement]);

  // Handle text edit cancel
  const handleTextCancel = useCallback(() => {
    setTextEditingElement(null);
  }, [setTextEditingElement]);

  // Handle tab navigation (for future multi-text workflows)
  const handleTab = useCallback((backward?: boolean) => {
    setTextEditingElement(null);
    // Could implement tab-to-next-text functionality here
  }, [setTextEditingElement]);

  // Auto-resize text width based on content
  useEffect(() => {
    if (!textRef.current || isEditing) return;

    const textNode = textRef.current;
    const textWidth = textNode.width();
    const textHeight = textNode.height();

    // Update element dimensions if they differ significantly
    if (Math.abs(textWidth - element.width) > 5 || Math.abs(textHeight - element.height) > 5) {
      updateElement(element.id, {
        width: Math.max(textWidth, 20),
        height: Math.max(textHeight, 24)
      });
    }
  }, [element.text, element.width, element.height, element.id, updateElement, isEditing]);

  // Calculate screen position for text editor overlay
  const screenPosition = React.useMemo(() => {
    if (!isEditing) return null;
    
    return {
      x: (element.x * viewport.scale) + viewport.x,
      y: (element.y * viewport.scale) + viewport.y,
      width: element.width * viewport.scale,
      height: element.height * viewport.scale
    };
  }, [isEditing, element.x, element.y, element.width, element.height, viewport]);

  if (isEditing && screenPosition) {
    // Render text editor overlay
    return (
      <>
        {/* Invisible placeholder on canvas to maintain layout */}
        <Group
          x={element.x}
          y={element.y}
          draggable={false}
          id={element.id}
        >
          <Rect
            width={element.width}
            height={element.height}
            fill="transparent"
            stroke="#3B82F6"
            strokeWidth={2}
            dash={[4, 4]}
          />
        </Group>

        {/* Text editing overlay - positioned absolutely over canvas */}
        <div
          style={{
            position: 'fixed',
            left: screenPosition.x,
            top: screenPosition.y,
            width: Math.max(screenPosition.width, 120),
            height: Math.max(screenPosition.height, 32),
            zIndex: 1000,
            pointerEvents: 'all'
          }}
        >
          <CanvasTextInput
            x={0}
            y={0}
            width={Math.max(screenPosition.width, 120)}
            height={Math.max(screenPosition.height, 32)}
            initialText={element.text}
            fontSize={element.fontSize * viewport.scale}
            fontFamily={element.fontFamily}
            fontWeight="normal"
            fill={element.fill}
            backgroundColor="rgba(255, 255, 255, 0.95)"
            isHeader={false}
            absolute={true}
            onSave={handleTextSave}
            onCancel={handleTextCancel}
            onTab={handleTab}
          />
        </div>
      </>
    );
  }

  // Regular text display mode
  const displayText = element.text || 'Double-click to edit';
  const isPlaceholder = !element.text;

  return (
    <Group
      x={element.x}
      y={element.y}
      draggable={!isEditing}
      id={element.id}
      onDragEnd={(e) => onDragEnd(e, element.id)}
      onClick={(e) => onClick(e, element)}
      onDblClick={handleDoubleClick}
    >
      {/* Selection highlight */}
      {isSelected && (
        <Rect
          x={-2}
          y={-2}
          width={element.width + 4}
          height={element.height + 4}
          stroke="#3B82F6"
          strokeWidth={2}
          dash={isPlaceholder ? [4, 4] : undefined}
          fill="rgba(59, 130, 246, 0.1)"
          cornerRadius={4}
        />
      )}

      {/* Text content */}
      <Text
        ref={textRef}
        text={displayText}
        width={element.width}
        height={element.height}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fill={isPlaceholder ? '#9CA3AF' : element.fill}
        fontStyle={isPlaceholder ? 'italic' : element.fontStyle || 'normal'}
        textAlign={element.textAlign || 'left'}
        verticalAlign="top"
        wrap="word"
        ellipsis={false}
        listening={true}
      />
    </Group>
  );
};

export default TextRenderer;