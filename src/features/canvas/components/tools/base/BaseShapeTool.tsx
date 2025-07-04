// src/features/canvas/components/tools/base/BaseShapeTool.tsx
/**
 * BaseShapeTool - Common functionality for shape creation tools
 * 
 * Consolidates shared logic across CircleTool, RectangleTool, and TriangleTool:
 * - Cursor preview with shape shadow
 * - Click-to-place functionality
 * - Shared event handling
 * - Consistent UX patterns
 * - Automatic tool switching after creation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { useToolEventHandler } from '../../../hooks/useToolEventHandler';
import { nanoid } from 'nanoid';
import { CanvasElement, ElementId, SectionElement } from '../../../types/enhanced.types';
import { BaseShapeToolProps, Vector2d, ShapeToolState } from './types';
import { canvasLog } from '../../../utils/canvasLogger';

export const BaseShapeTool = <T extends Exclude<CanvasElement, SectionElement>>({
  stageRef,
  isActive,
  type,
  createShape,
  renderPreview,
  shouldStartTextEdit = true
}: BaseShapeToolProps<T>) => {
  // Store selectors
  // Store selectors using grouped patterns with useShallow for optimization
  const toolActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      addElement: state.addElement,
      setSelectedTool: state.setSelectedTool,
      setTextEditingElement: state.setTextEditingElement
    }))
  );
  
  const toolState = useUnifiedCanvasStore(
    useShallow((state) => ({
      textEditingElementId: state.textEditingElementId
    }))
  );

  // Destructure for easier access
  const { addElement, setSelectedTool, setTextEditingElement } = toolActions;
  const { textEditingElementId: editingTextId } = toolState;

  // Local state for UI
  const [state, setState] = useState<ShapeToolState>({
    showPlacementGuide: false,
    cursorPosition: null
  });

  // Handle mouse movement for placement guide
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current || editingTextId) {
      return;
    }

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    setState(prev => ({
      ...prev,
      cursorPosition: pos,
      showPlacementGuide: true
    }));
  }, [isActive, stageRef, editingTextId]);

  // Handle mouse leave to hide guide
  const handlePointerLeave = useCallback(() => {
    setState(prev => ({
      ...prev,
      showPlacementGuide: false,
      cursorPosition: null
    }));
  }, []);

  // Handle pointer down to place shape (more responsive than click)
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current || editingTextId) {
      return;
    }

    // Only handle clicks on the stage background (not on existing elements)
    if (e.target !== stageRef.current && e.target.id() && e.target.id() !== '') {
      return;
    }

    // Prevent event bubbling
    e.cancelBubble = true;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const position = transform.point(pointer);

    try {
      // Create the shape element
      const shapeElement = createShape(position);
      
      // Add to store
      addElement(shapeElement as CanvasElement);

      // Switch back to select tool immediately
      setSelectedTool('select');

      // Select the newly created shape with blue resize frame
      setTimeout(() => {
        const store = useUnifiedCanvasStore.getState();
        store.clearSelection();
        setTimeout(() => {
          store.selectElement(shapeElement.id, false);
        }, 50);
      }, 50);

      // Start text editing if enabled (after selection)
      if (shouldStartTextEdit && 'text' in shapeElement) {
        setTimeout(() => {
          setTextEditingElement(shapeElement.id);
        }, 150); // Delay to ensure selection is complete first
      }

    } catch (error) {
      canvasLog.error(`Failed to create ${type}:`, error);
    }
  }, [isActive, stageRef, editingTextId, createShape, addElement, shouldStartTextEdit, setTextEditingElement, setSelectedTool, type]);

  // Set up event listeners
  useToolEventHandler({
    isActive,
    stageRef,
    toolName: `BaseShapeTool-${type}`,
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
      onPointerDown: handlePointerDown
    }
  });

  // Cursor management is handled by CanvasStage's centralized cursor system

  // Don't render preview if not active or position not set
  if (!isActive || !state.showPlacementGuide || !state.cursorPosition || editingTextId) {
    return null;
  }

  return (
    <Group>
      {renderPreview(state.cursorPosition)}
    </Group>
  );
};
