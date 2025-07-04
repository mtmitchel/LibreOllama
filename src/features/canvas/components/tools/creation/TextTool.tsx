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
import { useShallow } from 'zustand/react/shallow';
import { useToolEventHandler } from '../../../hooks/useToolEventHandler';
import { nanoid } from 'nanoid';
import { TextElement, ElementId } from '../../../types/enhanced.types';

interface TextToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const TextTool: React.FC<TextToolProps> = ({ stageRef, isActive }) => {
  // Store selectors
  // Store selectors using grouped patterns with useShallow for optimization
  const elementActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      addElement: state.addElement,
      updateElement: state.updateElement,
      selectElement: state.selectElement,
      clearSelection: state.clearSelection
    }))
  );
  
  const toolState = useUnifiedCanvasStore(
    useShallow((state) => ({
      selectedTool: state.selectedTool,
      textEditingElementId: state.textEditingElementId
    }))
  );
  
  const toolActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      setSelectedTool: state.setSelectedTool,
      setTextEditingElement: state.setTextEditingElement
    }))
  );
  
  const stickyNoteActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      findStickyNoteAtPoint: state.findStickyNoteAtPoint,
      addElementToStickyNote: state.addElementToStickyNote
    }))
  );

  // Destructure for easier access
  const { addElement, updateElement, selectElement, clearSelection } = elementActions;
  const { selectedTool, textEditingElementId: editingTextId } = toolState;
  const { setSelectedTool, setTextEditingElement } = toolActions;
  const { findStickyNoteAtPoint, addElementToStickyNote } = stickyNoteActions;

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
    
  }, [setTextEditingElement]);

  // Handle click to place text
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    console.log('📝 [TextTool] *** CLICK DETECTED ***:', {
      isActive,
      hasStageRef: !!stageRef.current,
      editingTextId,
      targetId: e.target.id(),
      targetType: e.target.getType(),
      isStage: e.target === stageRef.current,
      targetClass: e.target.className
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

    // Create new text element with empty text for immediate editing
    const textElement: TextElement = {
      id: nanoid() as ElementId,
      type: 'text',
      x: pos.x,
      y: pos.y,
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

    // Add element to canvas first
    addElement(textElement);
    
    // Check if the text was created within a sticky note container
    const stickyNoteId = findStickyNoteAtPoint(pos);
    
    if (stickyNoteId) {
      console.log('📝 [TextTool] Adding text to sticky note container:', stickyNoteId);
      addElementToStickyNote(textElement.id, stickyNoteId);
    }
    
    console.log('📝 [TextTool] *** CREATED TEXT ELEMENT ***:', textElement.id, 'at position:', pos, 'inStickyNote:', !!stickyNoteId);
    
    // Hide placement guide
    setShowPlacementGuide(false);
    setCursorPosition(null);

    // Start text editing immediately after element is added
    // Use setTimeout to ensure the element is rendered before starting edit
    setTimeout(() => {
      console.log('📝 [TextTool] *** STARTING EDITING FOR NEW ELEMENT ***:', textElement.id);
      startTextEditing(textElement.id, pos.x, pos.y, 120, 32);
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

  // Use shared event handler hook with namespaced events
  useToolEventHandler({
    isActive,
    stageRef,
    toolName: 'textTool',
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      onPointerLeave: handlePointerLeave,
      onPointerEnter: handlePointerEnter,
      useNamespacedEvents: true
    }
  });
  
  // Handle cursor separately
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    
    // Always use crosshair cursor when text tool is active
    stage.container().style.cursor = 'crosshair';
    
    return () => {
      // Reset cursor when tool becomes inactive
      if (stage.container()) {
        stage.container().style.cursor = 'default';
      }
    };
  }, [isActive, stageRef]);

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
      
      // Ensure cursor is reset when tool becomes inactive
      if (stageRef.current?.container()) {
        stageRef.current.container().style.cursor = 'default';
      }
    } else if (isActive && stageRef.current) {
      // Ensure crosshair cursor when becoming active
      stageRef.current.container().style.cursor = 'crosshair';
    }
  }, [isActive, setTextEditingElement, stageRef]);

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
          {/* Just the floating "Add text" label */}
          <Text
            x={cursorPosition.x + 8}
            y={cursorPosition.y - 8}
            text="Add text"
            fontSize={12}
            fontFamily="Inter, Arial, sans-serif"
            fill="#94A3B8"
            opacity={0.8}
            listening={false}
          />
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