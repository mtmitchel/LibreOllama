/**
 * MindmapTool - FigJam-style mindmap node placement tool
 * 
 * Features:
 * - Cursor preview with attached mindmap bubble shadow
 * - Click-to-place with immediate text editing
 * - Professional mindmap bubble styling
 * - Auto-sizing based on content
 * - Follows same UX pattern as sticky notes
 */

import React, { useState, useCallback, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { nanoid } from 'nanoid';
import { RectangleElement, ElementId } from '../../../types/enhanced.types';

interface MindmapToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const MindmapTool: React.FC<MindmapToolProps> = ({ stageRef, isActive }) => {
  // Store selectors
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const editingTextId = useUnifiedCanvasStore(state => state.textEditingElementId);

  // Local state for UI
  const [showPlacementGuide, setShowPlacementGuide] = React.useState(false);
  const [cursorPosition, setCursorPosition] = React.useState<{ x: number; y: number } | null>(null);

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

    setCursorPosition(pos);
    setShowPlacementGuide(true);
  }, [isActive, stageRef, editingTextId]);

  // Start text editing for newly created mindmap node
  const startTextEditing = useCallback((elementId: ElementId) => {
    console.log('🧠 [MindmapTool] Starting text editing for mindmap node:', elementId);
    setTextEditingElement(elementId);
  }, [setTextEditingElement]);

  // Handle click to place mindmap node
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    console.log('🧠 [MindmapTool] *** CLICK DETECTED ***:', {
      isActive,
      hasStageRef: !!stageRef.current,
      editingTextId,
      targetId: e.target.id(),
      targetType: e.target.getType(),
      isStage: e.target === stageRef.current,
      targetClass: e.target.className
    });
    
    if (!isActive || !stageRef.current || editingTextId) {
      console.log('🧠 [MindmapTool] Click blocked - conditions not met');
      return;
    }
    
    // Only handle clicks on the stage background (not on existing elements)
    if (e.target !== stageRef.current && e.target.id() && e.target.id() !== '') {
      console.log('🧠 [MindmapTool] Click on existing element, ignoring:', e.target.id());
      return;
    }

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      console.log('🧠 [MindmapTool] No pointer position available');
      return;
    }

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    // Create new mindmap node element with empty text for immediate editing
    const mindmapElement: RectangleElement = {
      id: nanoid() as ElementId,
      type: 'rectangle',
      x: pos.x - 70, // Center the mindmap bubble
      y: pos.y - 35,
      width: 140,
      height: 70, // More oval-like proportions for mindmap nodes
      fill: '#F3F4F6', // Soft gray background
      stroke: '#6366F1', // Indigo border
      strokeWidth: 2,
      cornerRadius: 25, // Very rounded for bubble effect
      text: '', // Start with empty text so immediate editing begins
      textColor: '#1F2937',
      fontSize: 14,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      textAlign: 'center',
      isLocked: false,
      sectionId: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isHidden: false
    };

    // Add element to canvas first
    addElement(mindmapElement);
    
    console.log('🧠 [MindmapTool] *** CREATED MINDMAP NODE ***:', mindmapElement.id, 'at position:', pos);
    
    // Hide placement guide 
    setShowPlacementGuide(false);
    setCursorPosition(null);
    
    // IMMEDIATELY switch to select tool after placement (standard creation tool behavior)
    console.log('🧠 [MindmapTool] *** SWITCHING TO SELECT TOOL IMMEDIATELY ***');
    setSelectedTool('select');
    
    // Select the newly created mindmap node
    setTimeout(() => {
      const store = useUnifiedCanvasStore.getState();
      store.clearSelection();
      setTimeout(() => {
        store.selectElement(mindmapElement.id, false);
        console.log('🧠 [MindmapTool] Selected newly created mindmap node:', mindmapElement.id);
      }, 50);
    }, 50);

    // Start text editing after tool switch and selection
    setTimeout(() => {
      console.log('🧠 [MindmapTool] *** STARTING EDITING FOR NEW MINDMAP NODE ***:', mindmapElement.id);
      startTextEditing(mindmapElement.id);
    }, 150); // Delay to ensure tool switch and selection complete first
    
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
    console.log('🧠 [MindmapTool] *** SETTING UP EVENT LISTENERS AND CURSOR ***');

    // FORCE crosshair cursor immediately when tool is active
    const container = stage.container();
    if (container) {
      container.style.cursor = 'crosshair !important';
      // Force cursor update multiple times to override any conflicts
      setTimeout(() => {
        if (container && isActive) {
          container.style.cursor = 'crosshair';
          console.log('🧠 [MindmapTool] *** CURSOR FORCED TO CROSSHAIR ***');
        }
      }, 10);
    }

    // Remove any existing listeners first to ensure we get priority
    stage.off('pointermove.mindmapTool');
    stage.off('pointerdown.mindmapTool');
    stage.off('pointerleave.mindmapTool');
    stage.off('pointerenter.mindmapTool');

    // Add event listeners with namespace for priority
    stage.on('pointermove.mindmapTool', handlePointerMove);
    stage.on('pointerdown.mindmapTool', handlePointerDown);
    stage.on('pointerleave.mindmapTool', handlePointerLeave);
    stage.on('pointerenter.mindmapTool', handlePointerEnter);

    console.log('🧠 [MindmapTool] Event listeners attached with namespace');

    return () => {
      console.log('🧠 [MindmapTool] Cleaning up event listeners');
      
      // Reset cursor when tool becomes inactive
      if (container) {
        container.style.cursor = 'default';
        console.log('🧠 [MindmapTool] Reset cursor to default');
      }
      
      // Remove event listeners
      stage.off('pointermove.mindmapTool', handlePointerMove);
      stage.off('pointerdown.mindmapTool', handlePointerDown);
      stage.off('pointerleave.mindmapTool', handlePointerLeave);
      stage.off('pointerenter.mindmapTool', handlePointerEnter);
      
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
      
      // Ensure cursor is reset when tool becomes inactive
      if (stageRef.current?.container()) {
        stageRef.current.container().style.cursor = 'default';
      }
    } else if (isActive && stageRef.current) {
      // FORCE crosshair cursor when becoming active
      const container = stageRef.current.container();
      if (container) {
        container.style.cursor = 'crosshair';
      }
    }
  }, [isActive, stageRef]);

  if (!isActive) return null;

  return (
    <Group listening={false}>
      {/* Mindmap bubble preview following cursor */}
      {showPlacementGuide && cursorPosition && !editingTextId && (
        <Group>
          {/* Faint mindmap bubble shadow preview */}
          <Group x={cursorPosition.x - 70} y={cursorPosition.y - 35}>
            <Rect
              width={140}
              height={70}
              fill="#F3F4F6"
              stroke="#6366F1"
              strokeWidth={2}
              cornerRadius={25}
              opacity={0.6}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={8}
              shadowOffset={{ x: 2, y: 2 }}
              shadowOpacity={0.5}
              listening={false}
            />
            <Text
              x={20}
              y={30}
              width={100}
              height={10}
              text="Add idea"
              fontSize={14}
              fontFamily="Inter, Arial, sans-serif"
              fill="rgba(31, 41, 55, 0.7)"
              align="center"
              verticalAlign="middle"
              fontStyle="italic"
              listening={false}
            />
          </Group>
        </Group>
      )}
    </Group>
  );
};

export default MindmapTool; 