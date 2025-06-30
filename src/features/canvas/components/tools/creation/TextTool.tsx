/**
 * TextTool - Interactive text placement tool
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

import React, { useState, useCallback, useRef } from 'react';
import { Group, Text, Line, Circle, Rect } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { nanoid } from 'nanoid';
import { TextElement, ElementId } from '../../../types/enhanced.types';

interface TextToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const TextTool: React.FC<TextToolProps> = ({ stageRef, isActive }) => {
  // Store selectors
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  const clearSelection = useUnifiedCanvasStore(state => state.clearSelection);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const editingTextId = useUnifiedCanvasStore(state => state.textEditingElementId);

  // Local state for UI
  const [showPlacementGuide, setShowPlacementGuide] = React.useState(false);
  const [cursorPosition, setCursorPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [previewBox, setPreviewBox] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Ref for cleanup
  const cleanupTextEditor = React.useRef<(() => void) | null>(null);

  // Handle mouse movement for placement guide
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current || editingTextId) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    setCursorPosition(pos);
    setShowPlacementGuide(true);
  }, [isActive, stageRef, editingTextId]);

  // Start text editing for newly created element
  const startTextEditing = useCallback((elementId: ElementId, x: number, y: number, width: number, height: number) => {
    console.log('📝 [TextTool] Text element created, setting store editing state:', elementId);
    
    // Set the store editing state - TextShape will handle the actual editing UI
    setTextEditingElement(elementId);
    
    // Clear preview
    setPreviewBox(null);
    
  }, [setTextEditingElement]);

  // Handle click to place text
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    console.log('📝 [TextTool] Click detected:', {
      isActive,
      hasStageRef: !!stageRef.current,
      editingTextId,
      targetId: e.target.id(),
      targetType: e.target.getType(),
      isStage: e.target === stageRef.current
    });
    
    if (!isActive || !stageRef.current || editingTextId) return;
    
    // Only handle clicks on the stage background (not on existing elements)
    // Check if the target is the stage itself or doesn't have an element ID
    if (e.target !== stageRef.current && e.target.id() && e.target.id() !== '') {
      console.log('📝 [TextTool] Click on existing element, ignoring:', e.target.id());
      return;
    }

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    // Create preview box at click position
    setPreviewBox({
      x: pos.x,
      y: pos.y,
      width: 200,
      height: 50
    });

    // Create new text element with empty text for immediate editing
    const textElement: TextElement = {
      id: nanoid() as ElementId,
      type: 'text',
      x: pos.x,
      y: pos.y,
      width: 200,
      height: 50,
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

    // Add element to canvas first
    addElement(textElement);
    
    console.log('📝 [TextTool] Created text element:', textElement.id, 'at position:', pos);
    
    // Hide placement guide
    setShowPlacementGuide(false);
    setCursorPosition(null);

    // Start text editing immediately after element is added
    // Use setTimeout to ensure the element is rendered before starting edit
    setTimeout(() => {
      console.log('📝 [TextTool] Starting editing for new element:', textElement.id);
      startTextEditing(textElement.id, pos.x, pos.y, 200, 50);
    }, 10);
    
  }, [isActive, stageRef, addElement, editingTextId, startTextEditing]);

  // Handle mouse leave to hide placement guide
  const handlePointerLeave = useCallback(() => {
    if (!editingTextId) {
      setShowPlacementGuide(false);
      setCursorPosition(null);
    }
  }, [editingTextId]);

  // Handle mouse enter to show placement guide
  const handlePointerEnter = useCallback(() => {
    if (isActive && !editingTextId) {
      setShowPlacementGuide(true);
    }
  }, [isActive, editingTextId]);

  // Set up event listeners and cursor
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;

    const stage = stageRef.current;
    
    // Set crosshairs cursor (only if not editing)
    if (!editingTextId) {
      stage.container().style.cursor = 'crosshair';
    }
    
    // Add event listeners
    stage.on('pointermove', handlePointerMove);
    stage.on('pointerdown', handlePointerDown);
    stage.on('pointerleave', handlePointerLeave);
    stage.on('pointerenter', handlePointerEnter);

    return () => {
      // Clean up event listeners
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointerleave', handlePointerLeave);
      stage.off('pointerenter', handlePointerEnter);
      
      // Reset cursor (only if not editing)
      if (!editingTextId) {
        stage.container().style.cursor = 'default';
      }
    };
  }, [isActive, editingTextId, handlePointerMove, handlePointerDown, handlePointerLeave, handlePointerEnter]);

  // Clear placement guide when tool becomes inactive
  React.useEffect(() => {
    if (!isActive) {
      setShowPlacementGuide(false);
      setCursorPosition(null);
      setPreviewBox(null);
      
      // Clean up any active text editor
      if (cleanupTextEditor.current) {
        cleanupTextEditor.current();
        cleanupTextEditor.current = null;
        setTextEditingElement(null);
      }
    }
  }, [isActive]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (cleanupTextEditor.current) {
        cleanupTextEditor.current();
      }
    };
  }, []);

  if (!isActive) return null;

  return (
    <Group listening={false}>
      {/* Crosshairs cursor visual indicator (only when moving, not when editing) */}
      {showPlacementGuide && cursorPosition && !editingTextId && !previewBox && (
        <Group>
          {/* Horizontal crosshair line */}
          <Line
            points={[
              cursorPosition.x - 15, cursorPosition.y,
              cursorPosition.x + 15, cursorPosition.y
            ]}
            stroke="#666666"
            strokeWidth={1}
            opacity={0.8}
            listening={false}
            dash={[2, 2]}
          />
          
          {/* Vertical crosshair line */}
          <Line
            points={[
              cursorPosition.x, cursorPosition.y - 15,
              cursorPosition.x, cursorPosition.y + 15
            ]}
            stroke="#666666"
            strokeWidth={1}
            opacity={0.8}
            listening={false}
            dash={[2, 2]}
          />
          
          {/* Center dot */}
          <Circle
            x={cursorPosition.x}
            y={cursorPosition.y}
            radius={2}
            fill="#666666"
            opacity={0.8}
            listening={false}
          />
          
          {/* Preview text box outline (dashed rectangle) */}
          <Group x={cursorPosition.x} y={cursorPosition.y}>
            <Rect
              x={0}
              y={0}
              width={100}
              height={30}
              stroke="#3B82F6"
              strokeWidth={2}
              opacity={0.6}
              listening={false}
              dash={[8, 4]}
              cornerRadius={4}
            />
            
            {/* Placeholder text in the preview box */}
            <Text
              x={4}
              y={8}
              text="Add text"
              fontSize={14}
              fontFamily="Inter, Arial, sans-serif"
              fill="#94A3B8"
              opacity={0.7}
              listening={false}
            />
          </Group>
        </Group>
      )}
      
      {/* Solid preview box when clicked (before text editor appears) */}
      {previewBox && editingTextId && (
        <Group x={previewBox.x} y={previewBox.y}>
          <Rect
            x={0}
            y={0}
            width={previewBox.width}
            height={previewBox.height}
            stroke="#3B82F6"
            strokeWidth={2}
            fill="rgba(255, 255, 255, 0.9)"
            listening={false}
            cornerRadius={4}
          />
        </Group>
      )}
    </Group>
  );
};

export default TextTool; 