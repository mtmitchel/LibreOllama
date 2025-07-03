/**
 * RectangleTool - FigJam-style rectangle placement tool
 * 
 * Features:
 * - Cursor preview with attached rectangle shadow
 * - Click-to-place with immediate text editing
 * - Professional rectangle styling
 * - Auto-sizing based on content
 * - Follows same UX pattern as sticky notes
 */

import React, { useState, useCallback, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { nanoid } from 'nanoid';
import { RectangleElement, ElementId } from '../../../types/enhanced.types';

interface RectangleToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const RectangleTool: React.FC<RectangleToolProps> = ({ stageRef, isActive }) => {
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

  // Handle click to place rectangle
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    console.log('🟨 [RectangleTool] *** CLICK DETECTED ***:', {
      isActive,
      hasStageRef: !!stageRef.current,
      editingTextId,
      targetId: e.target.id(),
      targetType: e.target.getType(),
      isStage: e.target === stageRef.current,
      targetClass: e.target.className
    });
    
    if (!isActive || !stageRef.current || editingTextId) {
      console.log('🟨 [RectangleTool] Click blocked - conditions not met');
      return;
    }
    
    // Only handle clicks on the stage background (not on existing elements)
    if (e.target !== stageRef.current && e.target.id() && e.target.id() !== '') {
      console.log('🟨 [RectangleTool] Click on existing element, ignoring:', e.target.id());
      return;
    }

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      console.log('🟨 [RectangleTool] No pointer position available');
      return;
    }

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    // Create new rectangle element with empty text for immediate editing
    const rectangleElement: RectangleElement = {
      id: nanoid() as ElementId,
      type: 'rectangle',
      x: pos.x - 60, // Center the rectangle
      y: pos.y - 40,
      width: 120,
      height: 80,
      fill: '#FFFFFF',
      stroke: '#9CA3AF',
      strokeWidth: 2,
      cornerRadius: 4,
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
    addElement(rectangleElement);
    
    console.log('🟨 [RectangleTool] *** CREATED RECTANGLE ***:', rectangleElement.id, 'at position:', pos);
    
    // Hide placement guide 
    setShowPlacementGuide(false);
    setCursorPosition(null);
    
    // IMMEDIATELY switch to select tool after placement (standard creation tool behavior)
    console.log('🟨 [RectangleTool] *** SWITCHING TO SELECT TOOL IMMEDIATELY ***');
    setSelectedTool('select');
    
    // Select the newly created rectangle
    setTimeout(() => {
      const store = useUnifiedCanvasStore.getState();
      store.clearSelection();
      setTimeout(() => {
        store.selectElement(rectangleElement.id, false);
        console.log('🟨 [RectangleTool] Selected newly created rectangle:', rectangleElement.id);
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
    console.log('🟨 [RectangleTool] *** SETTING UP EVENT LISTENERS AND CURSOR ***');

    // FORCE crosshair cursor immediately when tool is active
    const container = stage.container();
    if (container) {
      container.style.cursor = 'crosshair !important';
      // Force cursor update multiple times to override any conflicts
      setTimeout(() => {
        if (container && isActive) {
          container.style.cursor = 'crosshair';
          console.log('🟨 [RectangleTool] *** CURSOR FORCED TO CROSSHAIR ***');
        }
      }, 10);
    }

    // Remove any existing listeners first to ensure we get priority
    stage.off('pointermove.rectangleTool');
    stage.off('pointerdown.rectangleTool');
    stage.off('pointerleave.rectangleTool');
    stage.off('pointerenter.rectangleTool');

    // Add event listeners with namespace for priority
    stage.on('pointermove.rectangleTool', handlePointerMove);
    stage.on('pointerdown.rectangleTool', handlePointerDown);
    stage.on('pointerleave.rectangleTool', handlePointerLeave);
    stage.on('pointerenter.rectangleTool', handlePointerEnter);

    console.log('🟨 [RectangleTool] Event listeners attached with namespace');

    return () => {
      console.log('🟨 [RectangleTool] Cleaning up event listeners');
      
      // Reset cursor when tool becomes inactive
      if (container) {
        container.style.cursor = 'default';
        console.log('🟨 [RectangleTool] Reset cursor to default');
      }
      
      // Remove event listeners
      stage.off('pointermove.rectangleTool', handlePointerMove);
      stage.off('pointerdown.rectangleTool', handlePointerDown);
      stage.off('pointerleave.rectangleTool', handlePointerLeave);
      stage.off('pointerenter.rectangleTool', handlePointerEnter);
      
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
      {/* Rectangle preview following cursor */}
      {showPlacementGuide && cursorPosition && !editingTextId && (
        <Group>
          {/* Faint rectangle shadow preview */}
          <Group x={cursorPosition.x - 60} y={cursorPosition.y - 40}>
            <Rect
              width={120}
              height={80}
              fill="#FFFFFF"
              stroke="#9CA3AF"
              strokeWidth={2}
              cornerRadius={4}
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

export default RectangleTool; 