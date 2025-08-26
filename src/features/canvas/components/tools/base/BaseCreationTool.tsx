/**
 * BaseCreationTool - Common functionality for complex creation tools
 * 
 * Consolidates shared logic across ConnectorTool, StickyNoteTool, and TextTool:
 * - Cursor preview and placement guides
 * - Click-to-place and drag-to-create functionality
 * - Shared event handling and coordinate transformation
 * - Consistent UX patterns with customizable behaviors
 * - Automatic tool switching and element selection
 * - Text editing initialization support
 */

import React, { useState, useCallback } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { useToolEventHandler } from '../../../hooks/useToolEventHandler';
import { CanvasElement } from '../../../types/enhanced.types';
import { BaseCreationToolProps, Vector2d, CreationToolState } from './types';
import { canvasLog } from '../../../utils/canvasLogger';

export const BaseCreationTool = <T extends CanvasElement>({
  stageRef,
  isActive,
  type,
  onCreate,
  onCreated,
  renderPreview,
  renderCursor,
  requiresDrag = false,
  minDragDistance = 10,
  shouldSwitchToSelect = true,
  shouldStartTextEdit = false,
  onPointerMove: customPointerMove,
  onPointerDown: customPointerDown,
  onPointerUp: customPointerUp
}: BaseCreationToolProps<T>) => {
  
  // Store selectors using grouped patterns with useShallow for optimization
  const toolActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      addElement: state.addElement,
      setSelectedTool: state.setSelectedTool,
      setTextEditingElement: state.setTextEditingElement,
      selectElement: state.selectElement,
      clearSelection: state.clearSelection
    }))
  );
  
  const toolState = useUnifiedCanvasStore(
    useShallow((state) => ({
      textEditingElementId: state.textEditingElementId
    }))
  );

  // Destructure for easier access
  const { 
    addElement, 
    setSelectedTool, 
    setTextEditingElement, 
    selectElement, 
    clearSelection 
  } = toolActions;
  const { textEditingElementId: editingTextId } = toolState;

  // Local state for UI
  const [state, setState] = useState<CreationToolState>({
    showPlacementGuide: false,
    cursorPosition: null,
    isCreating: false,
    startPosition: null,
    currentEndPosition: null
  });

  // Common coordinate transformation helper
  const getCanvasPosition = useCallback((e: Konva.KonvaEventObject<PointerEvent>): Vector2d | null => {
    const stage = stageRef.current;
    if (!stage) return null;

    const pointer = stage.getPointerPosition();
    if (!pointer) return null;

    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pointer);
  }, [stageRef]);

  // Handle mouse movement for placement guide
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current || editingTextId) {
      return;
    }

    const position = getCanvasPosition(e);
    if (!position) return;

    // Call custom pointer move handler if provided
    if (customPointerMove) {
      customPointerMove(e, position);
    }

    // Update state for preview
    setState(prev => ({
      ...prev,
      cursorPosition: position,
      showPlacementGuide: true,
      // Update end position if creating (for drag tools)
      ...(prev.isCreating && { currentEndPosition: position })
    }));
  }, [isActive, stageRef, editingTextId, getCanvasPosition, customPointerMove]);

  // Handle mouse leave to hide guide
  const handlePointerLeave = useCallback(() => {
    if (!editingTextId) {
      setState(prev => ({
        ...prev,
        showPlacementGuide: false,
        cursorPosition: null
      }));
    }
  }, [editingTextId]);

  // Handle mouse enter to show guide
  const handlePointerEnter = useCallback(() => {
    if (isActive && !editingTextId) {
      setState(prev => ({
        ...prev,
        showPlacementGuide: true
      }));
    }
  }, [isActive, editingTextId]);

  // Handle pointer down - start creation
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current || editingTextId) {
      return;
    }

    const position = getCanvasPosition(e);
    if (!position) return;

    // Call custom pointer down handler FIRST - before filtering existing elements
    // This allows tools to intercept clicks on existing elements for editing
    if (customPointerDown && customPointerDown(e, position)) {
      return; // Custom handler handled the event
    }

    // Only handle clicks on the stage background (not on existing elements)
    if (e.target !== stageRef.current && e.target.id() && e.target.id() !== '') {
      return;
    }

    // Prevent event bubbling
    e.cancelBubble = true;

    if (requiresDrag) {
      // Start drag creation
      setState(prev => ({
        ...prev,
        isCreating: true,
        startPosition: position,
        currentEndPosition: position,
        showPlacementGuide: false
      }));
    } else {
      // Immediate creation for click-to-place tools
      createAndPlaceElement(position);
    }
  }, [isActive, stageRef, editingTextId, getCanvasPosition, customPointerDown, requiresDrag]);

  // Handle pointer up - complete creation for drag tools
  const handlePointerUp = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !state.isCreating || !state.startPosition) {
      return;
    }

    const endPosition = getCanvasPosition(e);
    if (!endPosition) return;

    // Call custom pointer up handler if provided
    if (customPointerUp) {
      customPointerUp(e, endPosition);
    }

    // Check minimum distance for drag tools
    if (minDragDistance > 0) {
      const distance = Math.sqrt(
        Math.pow(endPosition.x - state.startPosition.x, 2) + 
        Math.pow(endPosition.y - state.startPosition.y, 2)
      );

      if (distance < minDragDistance) {
        // Too short, cancel creation
        setState(prev => ({
          ...prev,
          isCreating: false,
          startPosition: null,
          currentEndPosition: null,
          showPlacementGuide: true
        }));
        return;
      }
    }

    // Create element with drag parameters
    createAndPlaceElement(state.startPosition, endPosition);

    // Reset creation state
    setState(prev => ({
      ...prev,
      isCreating: false,
      startPosition: null,
      currentEndPosition: null
    }));
  }, [isActive, state.isCreating, state.startPosition, getCanvasPosition, customPointerUp, minDragDistance]);

  // Common element creation and placement logic
  const createAndPlaceElement = useCallback((
    startPos: Vector2d, 
    endPos?: Vector2d
  ) => {
    try {
      // Create the element using the provided onCreate function
      const element = endPos ? onCreate(startPos, endPos) : onCreate(startPos);
      
      // Add to store
      addElement(element);

      // Element created

      // Call custom created handler if provided
      if (onCreated) {
        onCreated(element);
      }

      // Hide placement guide
      setState(prev => ({
        ...prev,
        showPlacementGuide: false,
        cursorPosition: null
      }));

      // Switch to select tool if requested
      if (shouldSwitchToSelect) {
        setSelectedTool('select');
        
        // Select the newly created element
        setTimeout(() => {
          clearSelection();
          setTimeout(() => {
            selectElement(element.id as any, false);
          }, 50);
        }, 50);
      }

      // Start text editing if requested
      if (shouldStartTextEdit && 'text' in element) {
        setTimeout(() => {
          setTextEditingElement(element.id);
        }, shouldSwitchToSelect ? 150 : 50); // Delay if tool switching
      }

    } catch (error) {
      canvasLog.error(`Failed to create ${type}:`, error);
    }
  }, [onCreate, addElement, type, onCreated, shouldSwitchToSelect, shouldStartTextEdit, 
      setSelectedTool, clearSelection, selectElement, setTextEditingElement]);

  // Set up event listeners
  useToolEventHandler({
    isActive,
    stageRef,
    toolName: `BaseCreationTool-${type}`,
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
      onPointerEnter: handlePointerEnter,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp
    }
  });

  // Don't render anything if not active or no position
  if (!isActive || (!state.showPlacementGuide && !state.isCreating) || (!state.cursorPosition && !state.startPosition)) {
    return null;
  }

  // Determine what to render based on state
  const shouldShowPreview = state.showPlacementGuide && state.cursorPosition;
  const shouldShowCreation = state.isCreating && state.startPosition && state.currentEndPosition;

  return (
    <Group>
      {/* Preview during hover */}
      {shouldShowPreview && !state.isCreating && renderPreview(state.cursorPosition!, true)}
      
      {/* Creation preview during drag - pass both start and end positions */}
      {shouldShowCreation && (
        <Group>
          {renderPreview(state.startPosition!, false, state.startPosition!, state.currentEndPosition!)}
        </Group>
      )}
      
      {/* Custom cursor if provided */}
      {shouldShowPreview && renderCursor && renderCursor(state.cursorPosition!)}
    </Group>
  );
}; 