/**
 * CircleTool - FigJam-style circle placement tool
 * 
 * Features:
 * - Cursor preview with attached circle shadow
 * - Click-to-place with immediate text editing
 * - Professional circle styling
 * - Auto-sizing based on content
 * - Follows same UX pattern as sticky notes
 */

import React, { useState, useCallback, useRef } from 'react';
import { Group, Circle, Text } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { nanoid } from 'nanoid';
import { CircleElement, ElementId } from '../../../types/enhanced.types';

interface CircleToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const CircleTool: React.FC<CircleToolProps> = ({ stageRef, isActive }) => {
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

  // Handle click to place circle
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    console.log('⭕ [CircleTool] *** CLICK DETECTED ***:', {
      isActive,
      hasStageRef: !!stageRef.current,
      editingTextId,
      targetId: e.target.id(),
      targetType: e.target.getType(),
      isStage: e.target === stageRef.current,
      targetClass: e.target.className
    });
    
    if (!isActive || !stageRef.current || editingTextId) {
      console.log('⭕ [CircleTool] Click blocked - conditions not met');
      return;
    }
    
    // Only handle clicks on the stage background (not on existing elements)
    if (e.target !== stageRef.current && e.target.id() && e.target.id() !== '') {
      console.log('⭕ [CircleTool] Click on existing element, ignoring:', e.target.id());
      return;
    }

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      console.log('⭕ [CircleTool] No pointer position available');
      return;
    }

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const radius = 50;

    // Create new circle element with empty text for immediate editing
    const circleElement: CircleElement = {
      id: nanoid() as ElementId,
      type: 'circle',
      x: pos.x - radius, // Top-left position for consistency
      y: pos.y - radius,
      radius,
      fill: '#FFFFFF',
      stroke: '#9CA3AF',
      strokeWidth: 2,
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
    addElement(circleElement);
    
    console.log('⭕ [CircleTool] *** CREATED CIRCLE ***:', circleElement.id, 'at position:', pos);
    
    // Hide placement guide 
    setShowPlacementGuide(false);
    setCursorPosition(null);
    
    // IMMEDIATELY switch to select tool after placement (standard creation tool behavior)
    console.log('⭕ [CircleTool] *** SWITCHING TO SELECT TOOL IMMEDIATELY ***');
    setSelectedTool('select');
    
    // Select the newly created circle
    setTimeout(() => {
      const store = useUnifiedCanvasStore.getState();
      store.clearSelection();
      setTimeout(() => {
        store.selectElement(circleElement.id, false);
        console.log('⭕ [CircleTool] Selected newly created circle:', circleElement.id);
      }, 50);
    }, 50);
    
  }, [isActive, stageRef, addElement, editingTextId, setSelectedTool]);

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
    console.log('⭕ [CircleTool] *** SETTING UP EVENT LISTENERS AND CURSOR ***');

    // FORCE crosshair cursor immediately when tool is active
    const container = stage.container();
    if (container) {
      container.style.cursor = 'crosshair !important';
      // Force cursor update multiple times to override any conflicts
      setTimeout(() => {
        if (container && isActive) {
          container.style.cursor = 'crosshair';
          console.log('⭕ [CircleTool] *** CURSOR FORCED TO CROSSHAIR ***');
        }
      }, 10);
    }

    // Remove any existing listeners first to ensure we get priority
    stage.off('pointermove.circleTool');
    stage.off('pointerdown.circleTool');
    stage.off('pointerleave.circleTool');
    stage.off('pointerenter.circleTool');

    // Add event listeners with namespace for priority
    stage.on('pointermove.circleTool', handlePointerMove);
    stage.on('pointerdown.circleTool', handlePointerDown);
    stage.on('pointerleave.circleTool', handlePointerLeave);
    stage.on('pointerenter.circleTool', handlePointerEnter);

    console.log('⭕ [CircleTool] Event listeners attached with namespace');

    return () => {
      console.log('⭕ [CircleTool] Cleaning up event listeners');
      
      // Reset cursor when tool becomes inactive
      if (container) {
        container.style.cursor = 'default';
        console.log('⭕ [CircleTool] Reset cursor to default');
      }
      
      // Remove event listeners
      stage.off('pointermove.circleTool', handlePointerMove);
      stage.off('pointerdown.circleTool', handlePointerDown);
      stage.off('pointerleave.circleTool', handlePointerLeave);
      stage.off('pointerenter.circleTool', handlePointerEnter);
      
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

  const radius = 50;

  return (
    <Group listening={false}>
      {/* Circle preview following cursor */}
      {showPlacementGuide && cursorPosition && !editingTextId && (
        <Group>
          {/* Faint circle shadow preview */}
          <Group x={cursorPosition.x} y={cursorPosition.y}>
            <Circle
              radius={radius}
              fill="#FFFFFF"
              stroke="#9CA3AF"
              strokeWidth={2}
              opacity={0.75}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={8}
              shadowOffset={{ x: 2, y: 2 }}
              shadowOpacity={0.5}
              listening={false}
            />
            {/* Placeholder text removed for cleaner preview */}
          </Group>
        </Group>
      )}
    </Group>
  );
};

export default CircleTool; 