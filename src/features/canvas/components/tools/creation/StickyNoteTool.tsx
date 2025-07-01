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
import { nanoid } from 'nanoid';
import { StickyNoteElement, ElementId } from '../../../types/enhanced.types';

interface StickyNoteToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const StickyNoteTool: React.FC<StickyNoteToolProps> = ({ stageRef, isActive }) => {
  // Store selectors
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const editingTextId = useUnifiedCanvasStore(state => state.textEditingElementId);
  const selectedStickyNoteColor = useUnifiedCanvasStore(state => state.selectedStickyNoteColor);
  const enableStickyNoteContainer = useUnifiedCanvasStore(state => state.enableStickyNoteContainer);

  // Local state for UI
  const [showPlacementGuide, setShowPlacementGuide] = React.useState(false);
  const [cursorPosition, setCursorPosition] = React.useState<{ x: number; y: number } | null>(null);
  
  // Ref for cleanup
  const cleanupTextEditor = React.useRef<(() => void) | null>(null);

  // Handle mouse movement for placement guide
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current || editingTextId) {
      console.log('🗒️ [StickyNoteTool] Pointer move blocked:', { isActive, hasStage: !!stageRef.current, editingTextId });
      return;
    }

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    setCursorPosition(pos);
    setShowPlacementGuide(true);
    console.log('🗒️ [StickyNoteTool] Updated cursor position:', pos);
  }, [isActive, stageRef, editingTextId]);

  // Start text editing for newly created sticky note
  const startTextEditing = useCallback((elementId: ElementId) => {
    console.log('🗒️ [StickyNoteTool] Starting text editing for sticky note:', elementId);
    
    // Set the store editing state - StickyNoteShape will handle the actual editing UI
    setTextEditingElement(elementId);
    
    // No tool switching here - already switched to select tool immediately after placement
    
  }, [setTextEditingElement]);

  // Handle click to place sticky note
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    console.log('🗒️ [StickyNoteTool] *** CLICK DETECTED ***:', {
      isActive,
      hasStageRef: !!stageRef.current,
      editingTextId,
      targetId: e.target.id(),
      targetType: e.target.getType(),
      isStage: e.target === stageRef.current,
      targetClass: e.target.className
    });
    
    if (!isActive || !stageRef.current || editingTextId) {
      console.log('🗒️ [StickyNoteTool] Click blocked - conditions not met');
      return;
    }
    
    // Only handle clicks on the stage background (not on existing elements)
    if (e.target !== stageRef.current && e.target.id() && e.target.id() !== '') {
      console.log('🗒️ [StickyNoteTool] Click on existing element, ignoring:', e.target.id());
      return;
    }

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      console.log('🗒️ [StickyNoteTool] No pointer position available');
      return;
    }

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

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
      allowedChildTypes: ['pen', 'marker', 'highlighter', 'washi-tape', 'text', 'connector', 'image', 'table'],
      clipChildren: true,
      maxChildElements: 20
    };

    // Add element to canvas first
    addElement(stickyNoteElement);
    
    // Enable container functionality (this will update the element with container properties)
    setTimeout(() => {
      enableStickyNoteContainer(stickyNoteElement.id, {
        allowedTypes: ['pen', 'marker', 'highlighter', 'washi-tape', 'text', 'connector', 'image', 'table'],
        clipChildren: true,
        maxChildren: 20
      });
    }, 50);
    
    console.log('🗒️ [StickyNoteTool] *** CREATED STICKY NOTE ***:', stickyNoteElement.id, 'at position:', pos, 'color:', backgroundColor);
    
    // Hide placement guide 
    setShowPlacementGuide(false);
    setCursorPosition(null);
    
    // IMMEDIATELY switch to select tool after placement (standard creation tool behavior)
    console.log('🗒️ [StickyNoteTool] *** SWITCHING TO SELECT TOOL IMMEDIATELY ***');
    setSelectedTool('select');
    
    // Select the newly created sticky note
    setTimeout(() => {
      const store = useUnifiedCanvasStore.getState();
      store.clearSelection();
      setTimeout(() => {
        store.selectElement(stickyNoteElement.id, false);
        console.log('🗒️ [StickyNoteTool] Selected newly created sticky note:', stickyNoteElement.id);
      }, 50);
    }, 50);

    // Start text editing after tool switch and selection
    setTimeout(() => {
      console.log('🗒️ [StickyNoteTool] *** STARTING EDITING FOR NEW STICKY NOTE ***:', stickyNoteElement.id);
      startTextEditing(stickyNoteElement.id);
    }, 150); // Delay to ensure tool switch and selection complete first
    
  }, [isActive, stageRef, addElement, editingTextId, startTextEditing, selectedStickyNoteColor]);

  // Handle mouse leave to hide placement guide
  const handlePointerLeave = useCallback(() => {
    if (!editingTextId) {
      console.log('🗒️ [StickyNoteTool] Pointer leave - hiding placement guide');
      setShowPlacementGuide(false);
      setCursorPosition(null);
    }
  }, [editingTextId]);

  // Handle mouse enter to show placement guide
  const handlePointerEnter = useCallback(() => {
    if (isActive && !editingTextId) {
      console.log('🗒️ [StickyNoteTool] Pointer enter - showing placement guide');
      setShowPlacementGuide(true);
    }
  }, [isActive, editingTextId]);

  // No need to watch for text editing completion since we switch tools immediately

  // Set up event listeners and cursor
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;

    const stage = stageRef.current;
    console.log('🗒️ [StickyNoteTool] *** SETTING UP EVENT LISTENERS AND CURSOR ***');

    // FORCE crosshair cursor immediately when tool is active
    const container = stage.container();
    if (container) {
      container.style.cursor = 'crosshair !important';
      // Force cursor update multiple times to override any conflicts
      setTimeout(() => {
        if (container && isActive) {
          container.style.cursor = 'crosshair';
          console.log('🗒️ [StickyNoteTool] *** CURSOR FORCED TO CROSSHAIR ***');
        }
      }, 10);
      setTimeout(() => {
        if (container && isActive) {
          container.style.cursor = 'crosshair';
        }
      }, 50);
    }

    // Remove any existing listeners first to ensure we get priority
    stage.off('pointermove.stickyNoteTool');
    stage.off('pointerdown.stickyNoteTool');
    stage.off('pointerleave.stickyNoteTool');
    stage.off('pointerenter.stickyNoteTool');

    // Add event listeners with namespace for priority (like TextTool)
    stage.on('pointermove.stickyNoteTool', handlePointerMove);
    stage.on('pointerdown.stickyNoteTool', handlePointerDown);
    stage.on('pointerleave.stickyNoteTool', handlePointerLeave);
    stage.on('pointerenter.stickyNoteTool', handlePointerEnter);

    console.log('🗒️ [StickyNoteTool] Event listeners attached with namespace');

    return () => {
      console.log('🗒️ [StickyNoteTool] Cleaning up event listeners');
      
      // Reset cursor when tool becomes inactive
      if (container) {
        container.style.cursor = 'default';
        console.log('🗒️ [StickyNoteTool] Reset cursor to default');
      }
      
      // Remove event listeners
      stage.off('pointermove.stickyNoteTool', handlePointerMove);
      stage.off('pointerdown.stickyNoteTool', handlePointerDown);
      stage.off('pointerleave.stickyNoteTool', handlePointerLeave);
      stage.off('pointerenter.stickyNoteTool', handlePointerEnter);
      
      // Hide placement guide
      setShowPlacementGuide(false);
      setCursorPosition(null);
    };
  }, [isActive, stageRef, handlePointerMove, handlePointerDown, handlePointerLeave, handlePointerEnter]);

  // Clear placement guide when tool becomes inactive
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
      
      // Ensure cursor is reset when tool becomes inactive
      if (stageRef.current?.container()) {
        stageRef.current.container().style.cursor = 'default';
      }
    } else if (isActive && stageRef.current) {
      // FORCE crosshair cursor when becoming active - multiple attempts
      const container = stageRef.current.container();
      if (container) {
        container.style.cursor = 'crosshair';
        setTimeout(() => {
          if (container && isActive) {
            container.style.cursor = 'crosshair';
          }
        }, 10);
        setTimeout(() => {
          if (container && isActive) {
            container.style.cursor = 'crosshair';
          }
        }, 50);
        setTimeout(() => {
          if (container && isActive) {
            container.style.cursor = 'crosshair';
          }
        }, 100);
      }
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

  // Get the current selected color or default - ensure it matches what will be created
  const previewColor = selectedStickyNoteColor || '#FFF2CC';

  return (
    <Group listening={false}>
      {/* Sticky note preview following cursor */}
      {showPlacementGuide && cursorPosition && !editingTextId && (
        <Group>
          {/* Faint sticky note shadow preview */}
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
            <Text
              x={15}
              y={15}
              width={150}
              height={150}
              text="Add text"
              fontSize={14}
              fontFamily="Inter, Arial, sans-serif"
              fill="rgba(31, 41, 55, 0.6)"
              wrap="word"
              align="left"
              verticalAlign="top"
              fontStyle="italic"
              listening={false}
            />
          </Group>
        </Group>
      )}
    </Group>
  );
};

export default StickyNoteTool; 