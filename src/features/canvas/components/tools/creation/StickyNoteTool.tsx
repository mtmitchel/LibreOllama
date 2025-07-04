/**
 * StickyNoteTool - FigJam-style sticky note placement tool
 * 
 * Features:
 * - Cursor preview with attached sticky note shadow
 * - Click-to-place with immediate text editing
 * - FigJam color palette integration
 * - Auto-sizing based on content
 * - Professional sticky note styling
 */

import React, { useState, useCallback, useRef } from 'react';
import { Group, Text, Rect } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { useToolEventHandler } from '../../../hooks/useToolEventHandler';
import { nanoid } from 'nanoid';
import { StickyNoteElement, ElementId } from '../../../types/enhanced.types';

interface StickyNoteToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const StickyNoteTool: React.FC<StickyNoteToolProps> = ({ stageRef, isActive }) => {
  // Store selectors
  // Store selectors using grouped patterns with useShallow for optimization
  const toolActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      addElement: state.addElement,
      setSelectedTool: state.setSelectedTool,
      setTextEditingElement: state.setTextEditingElement
    }))
  );
  
  const stickyNoteState = useUnifiedCanvasStore(
    useShallow((state) => ({
      textEditingElementId: state.textEditingElementId,
      selectedStickyNoteColor: state.selectedStickyNoteColor,
      enableStickyNoteContainer: state.enableStickyNoteContainer
    }))
  );

  // Destructure for easier access
  const { addElement, setSelectedTool, setTextEditingElement } = toolActions;
  const { 
    textEditingElementId: editingTextId, 
    selectedStickyNoteColor, 
    enableStickyNoteContainer
  } = stickyNoteState;

  // Local state for UI
  const [showPlacementGuide, setShowPlacementGuide] = React.useState(false);
  const [cursorPosition, setCursorPosition] = React.useState<{ x: number; y: number } | null>(null);
  
  // Ref for cleanup
  const cleanupTextEditor = React.useRef<(() => void) | null>(null);

  // Handle mouse movement for placement guide
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current || editingTextId) {
      return;
    }

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Use standard Konva coordinate transformation (same as BaseShapeTool/TableTool)
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pointerPos = transform.point(pointer);

    // Store the actual pointer position for consistent placement
    setCursorPosition(pointerPos);
    setShowPlacementGuide(true);
  }, [isActive, stageRef, editingTextId]);

  // Start text editing for newly created sticky note
  const startTextEditing = useCallback((elementId: ElementId) => {
    // Set the store editing state - StickyNoteShape will handle the actual editing UI
    setTextEditingElement(elementId);
  }, [setTextEditingElement]);

  // Handle click to place sticky note
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current || editingTextId) {
      return;
    }
    
    // Only handle clicks on the stage background (not on existing elements)
    if (e.target !== stageRef.current && e.target.id() && e.target.id() !== '') {
      return;
    }

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return;
    }

    // Use standard Konva coordinate transformation (same as BaseShapeTool/TableTool)
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pointerPos = transform.point(pointer);

    // Adjust position to match preview centering - sticky note appears centered on cursor
    const stickyNoteSize = 180; // Same as preview
    const pos = {
      x: pointerPos.x - (stickyNoteSize / 2),
      y: pointerPos.y - (stickyNoteSize / 2)
    };

    // Use selected color or default soft pastel yellow - MUST match preview
    const backgroundColor = selectedStickyNoteColor || '#FFF2CC';

    // Create new sticky note element with empty text for immediate editing
    const stickyNoteElement: StickyNoteElement = {
      id: nanoid() as ElementId,
      type: 'sticky-note',
      x: pos.x,
      y: pos.y,
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

    // Add element to canvas first
    addElement(stickyNoteElement);
    
    // Enable container functionality (this will update the element with container properties)
    setTimeout(() => {
      enableStickyNoteContainer(stickyNoteElement.id, {
        allowedTypes: ['pen', 'marker', 'highlighter', 'text', 'connector', 'image', 'table'],
        clipChildren: true,
        maxChildren: 20
      });
    }, 50);
    
    // Hide placement guide 
    setShowPlacementGuide(false);
    setCursorPosition(null);
    
    // IMMEDIATELY switch to select tool after placement (standard creation tool behavior)
    setSelectedTool('select');
    
    // Select the newly created sticky note
    setTimeout(() => {
      const store = useUnifiedCanvasStore.getState();
      store.clearSelection();
      setTimeout(() => {
        store.selectElement(stickyNoteElement.id, false);
      }, 50);
    }, 50);

    // Start text editing after tool switch and selection
    setTimeout(() => {
      startTextEditing(stickyNoteElement.id);
    }, 150); // Delay to ensure tool switch and selection complete first
    
  }, [isActive, stageRef, addElement, editingTextId, startTextEditing, selectedStickyNoteColor, enableStickyNoteContainer, setSelectedTool]);

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

  // No need to watch for text editing completion since we switch tools immediately

  // Use shared event handler with namespaced events
  useToolEventHandler({
    isActive,
    stageRef,
    toolName: 'stickyNoteTool',
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      onPointerLeave: handlePointerLeave,
      onPointerEnter: handlePointerEnter,
      useNamespacedEvents: true
    }
  });

  // Clear placement guide when tool becomes inactive - let CanvasStage handle cursor
  React.useEffect(() => {
    if (!isActive) {
      setShowPlacementGuide(false);
      setCursorPosition(null);
      
      // Clean up any active text editor
      if (cleanupTextEditor.current) {
        cleanupTextEditor.current();
        cleanupTextEditor.current = null;
        setTextEditingElement(null);
      }
    }
  }, [isActive, setTextEditingElement]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (cleanupTextEditor.current) {
        cleanupTextEditor.current();
      }
    };
  }, []);

  if (!isActive) return null;

  // Get the current selected color or default - ensure it matches what will be created
  const previewColor = selectedStickyNoteColor || '#FFF2CC';

  return (
    <Group listening={false}>
      {/* Sticky note preview following cursor */}
      {showPlacementGuide && cursorPosition && !editingTextId && (
        <Group>
          {/* Faint sticky note shadow preview - centered on cursor */}
          <Group x={cursorPosition.x - 90} y={cursorPosition.y - 90}>
            <Rect
              width={180}
              height={180}
              fill={previewColor}
              stroke="rgba(0, 0, 0, 0.2)"
              strokeWidth={1}
              cornerRadius={8}
              opacity={0.6}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={8}
              shadowOffset={{ x: 2, y: 2 }}
              shadowOpacity={0.5}
              listening={false}
            />
          </Group>
        </Group>
      )}
    </Group>
  );
};

export default StickyNoteTool; 