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
// react-konva removed from runtime per blueprint
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
interface Vector2d {
  x: number;
  y: number;
}
import { nanoid } from 'nanoid';
import { StickyNoteElement, ElementId } from '../../../types/enhanced.types';

interface StickyNoteToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const StickyNoteTool: React.FC<StickyNoteToolProps> = ({ stageRef, isActive }) => {
  // Store selectors for sticky note functionality
  const selectedStickyNoteColor = useUnifiedCanvasStore(state => state.selectedStickyNoteColor);
  const enableStickyNoteContainer = useUnifiedCanvasStore(state => state.enableStickyNoteContainer);
  


  // Debug: Log when selectedStickyNoteColor changes
  React.useEffect(() => {
    console.log('🎨 [StickyNoteTool] selectedStickyNoteColor changed to:', selectedStickyNoteColor);
  }, [selectedStickyNoteColor]);

  // Cursor management is handled by CanvasStage's centralized cursor system

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
      width: 200,
      height: 150,
      padding: 12,
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
      newlyCreated: true, // Signal the renderer to auto-open the editor
      // Container functionality - automatically enabled for new sticky notes
      isContainer: true,
      childElementIds: [],
      allowedChildTypes: ['pen', 'marker', 'highlighter', 'text', 'connector', 'image', 'table'],
      clipChildren: true,
      maxChildElements: 20
    } as StickyNoteElement;
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


  // Simple direct event handling to avoid the infinite loop
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;

    const stage = stageRef.current;
    
    const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const transform = stage.getAbsoluteTransform().copy().invert();
      const position = transform.point(pointer);
      
      // Create sticky note directly with current color
      const stickyNote = createStickyNoteElement(position);
      
      // Add to store
      const addElement = useUnifiedCanvasStore.getState().addElement;
      addElement(stickyNote);
      console.info('[CREATE] sticky-note', stickyNote.id);
      
      // Switch to select tool (ok to switch now; edit overlay is decoupled from tool)
      const setSelectedTool = useUnifiedCanvasStore.getState().setSelectedTool;
      setSelectedTool('select');
      
      // Select the new element
      const selectElement = useUnifiedCanvasStore.getState().selectElement;
      selectElement(stickyNote.id, false);
      
      // Start text editing (defer to end of tick so store updates settle)
      const setTextEditingElement = useUnifiedCanvasStore.getState().setTextEditingElement;
      setTimeout(() => {
        console.info('[EDIT] request', stickyNote.id);
        setTextEditingElement(stickyNote.id);
      }, 0);
    };

    stage.on('click', handleClick);
    
    return () => {
      stage.off('click', handleClick);
    };
  }, [isActive, stageRef, createStickyNoteElement]);

  // Render preview
  if (!isActive) return null;
  
  // No-op react-konva preview; NonReactCanvasStage renders imperatively
  return null;
}; 