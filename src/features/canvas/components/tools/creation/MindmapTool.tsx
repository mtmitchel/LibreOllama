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
import { createMindmapStructure } from '../../../utils/mindmapUtils';

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

    // Create the entire mindmap structure
    const { centralNode, childNodes, connectors } = createMindmapStructure(pos.x, pos.y);

    // Add all elements to the canvas
    const store = useUnifiedCanvasStore.getState();
    store.addElement(centralNode);
    childNodes.forEach(node => store.addElement(node));
    connectors.forEach(connector => store.addElement(connector));
    
    console.log('🧠 [MindmapTool] *** CREATED MINDMAP STRUCTURE ***:', centralNode.id, 'at position:', pos);
    
    // Hide placement guide 
    setShowPlacementGuide(false);
    setCursorPosition(null);
    
    // IMMEDIATELY switch to select tool after placement (standard creation tool behavior)
    console.log('🧠 [MindmapTool] *** SWITCHING TO SELECT TOOL IMMEDIATELY ***');
    setSelectedTool('select');
    
    // Select the newly created mindmap central node
    setTimeout(() => {
      store.clearSelection();
      setTimeout(() => {
        store.selectElement(centralNode.id, false);
        console.log('🧠 [MindmapTool] Selected newly created mindmap central node:', centralNode.id);
      }, 50);
    }, 50);

    // Start text editing after tool switch and selection
    setTimeout(() => {
      console.log('🧠 [MindmapTool] *** STARTING EDITING FOR NEW MINDMAP NODE ***:', centralNode.id);
      store.setTextEditingElement(centralNode.id);
    }, 150); // Delay to ensure tool switch and selection complete first
    
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
      {/* Mindmap preview is disabled for now to avoid showing a single bubble */}
    </Group>
  );
};

export default MindmapTool; 