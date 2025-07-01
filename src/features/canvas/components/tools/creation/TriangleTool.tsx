/**
 * TriangleTool - FigJam-style triangle placement tool
 * 
 * Features:
 * - Cursor preview with attached triangle shadow
 * - Click-to-place with immediate text editing
 * - Professional triangle styling
 * - Auto-sizing based on content
 * - Follows same UX pattern as sticky notes
 */

import React, { useState, useCallback, useRef } from 'react';
import { Group, Line, Text } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { nanoid } from 'nanoid';
import { TriangleElement, ElementId } from '../../../types/enhanced.types';

interface TriangleToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const TriangleTool: React.FC<TriangleToolProps> = ({ stageRef, isActive }) => {
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

  // Handle click to place triangle
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    console.log('🔺 [TriangleTool] *** CLICK DETECTED ***:', {
      isActive,
      hasStageRef: !!stageRef.current,
      editingTextId,
      targetId: e.target.id(),
      targetType: e.target.getType(),
      isStage: e.target === stageRef.current,
      targetClass: e.target.className
    });
    
    if (!isActive || !stageRef.current || editingTextId) {
      console.log('🔺 [TriangleTool] Click blocked - conditions not met');
      return;
    }
    
    // Only handle clicks on the stage background (not on existing elements)
    if (e.target !== stageRef.current && e.target.id() && e.target.id() !== '') {
      console.log('🔺 [TriangleTool] Click on existing element, ignoring:', e.target.id());
      return;
    }

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      console.log('🔺 [TriangleTool] No pointer position available');
      return;
    }

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const size = 120;
    const height = size * Math.sqrt(3) / 2;

    // Create new triangle element with empty text for immediate editing
    const triangleElement: TriangleElement = {
      id: nanoid() as ElementId,
      type: 'triangle',
      x: pos.x - size / 2,
      y: pos.y - height / 2,
      width: size,
      height,
      points: [
        size / 2, 0,        // Top point
        0, height,          // Bottom left
        size, height,       // Bottom right
        size / 2, 0         // Close path
      ],
      fill: '#10B981',
      stroke: '#059669',
      strokeWidth: 2,
      text: '', // Start with empty text so immediate editing begins
      textColor: '#FFFFFF',
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
    addElement(triangleElement);
    
    console.log('🔺 [TriangleTool] *** CREATED TRIANGLE ***:', triangleElement.id, 'at position:', pos);
    
    // Hide placement guide 
    setShowPlacementGuide(false);
    setCursorPosition(null);
    
    // IMMEDIATELY switch to select tool after placement (standard creation tool behavior)
    console.log('🔺 [TriangleTool] *** SWITCHING TO SELECT TOOL IMMEDIATELY ***');
    setSelectedTool('select');
    
    // Select the newly created triangle
    setTimeout(() => {
      const store = useUnifiedCanvasStore.getState();
      store.clearSelection();
      setTimeout(() => {
        store.selectElement(triangleElement.id, false);
        console.log('🔺 [TriangleTool] Selected newly created triangle:', triangleElement.id);
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
    console.log('🔺 [TriangleTool] *** SETTING UP EVENT LISTENERS AND CURSOR ***');

    // FORCE crosshair cursor immediately when tool is active
    const container = stage.container();
    if (container) {
      container.style.cursor = 'crosshair !important';
      // Force cursor update multiple times to override any conflicts
      setTimeout(() => {
        if (container && isActive) {
          container.style.cursor = 'crosshair';
          console.log('🔺 [TriangleTool] *** CURSOR FORCED TO CROSSHAIR ***');
        }
      }, 10);
    }

    // Remove any existing listeners first to ensure we get priority
    stage.off('pointermove.triangleTool');
    stage.off('pointerdown.triangleTool');
    stage.off('pointerleave.triangleTool');
    stage.off('pointerenter.triangleTool');

    // Add event listeners with namespace for priority
    stage.on('pointermove.triangleTool', handlePointerMove);
    stage.on('pointerdown.triangleTool', handlePointerDown);
    stage.on('pointerleave.triangleTool', handlePointerLeave);
    stage.on('pointerenter.triangleTool', handlePointerEnter);

    console.log('🔺 [TriangleTool] Event listeners attached with namespace');

    return () => {
      console.log('🔺 [TriangleTool] Cleaning up event listeners');
      
      // Reset cursor when tool becomes inactive
      if (container) {
        container.style.cursor = 'default';
        console.log('🔺 [TriangleTool] Reset cursor to default');
      }
      
      // Remove event listeners
      stage.off('pointermove.triangleTool', handlePointerMove);
      stage.off('pointerdown.triangleTool', handlePointerDown);
      stage.off('pointerleave.triangleTool', handlePointerLeave);
      stage.off('pointerenter.triangleTool', handlePointerEnter);
      
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

  const size = 120;
  const height = size * Math.sqrt(3) / 2;
  const trianglePoints = [
    size / 2, 0,        // Top point
    0, height,          // Bottom left
    size, height        // Bottom right
  ];

  return (
    <Group listening={false}>
      {/* Triangle preview following cursor */}
      {showPlacementGuide && cursorPosition && !editingTextId && (
        <Group>
          {/* Faint triangle shadow preview */}
          <Group x={cursorPosition.x - size / 2} y={cursorPosition.y - height / 2}>
            <Line
              points={trianglePoints}
              closed
              fill="#10B981"
              stroke="#059669"
              strokeWidth={2}
              opacity={0.6}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={8}
              shadowOffset={{ x: 2, y: 2 }}
              shadowOpacity={0.5}
              listening={false}
            />
            <Text
              x={0}
              y={height * 0.62}
              width={size}
              height={14}
              text="Add text"
              fontSize={14}
              fontFamily="Inter, Arial, sans-serif"
              fill="rgba(255, 255, 255, 0.8)"
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

export default TriangleTool; 