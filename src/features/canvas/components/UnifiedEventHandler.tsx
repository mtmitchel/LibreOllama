import React, { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
// Removed unused import: logger
import { ElementId, ElementOrSectionId, CanvasElement } from '../types/enhanced.types';
import { calculateSnapLines } from '../utils/snappingUtils';
import { useCanvasEvents } from '../contexts/CanvasEventContext';
import { useSingleRAF } from '../hooks/useRAFManager';

interface UnifiedEventHandlerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  visibleElements: CanvasElement[];
}

/**
 * UnifiedEventHandler - Centralized event delegation for the canvas.
 * PERFORMANCE OPTIMIZATION: Event handler delegation with throttling for React 19 + Tauri optimization
 */
const UnifiedEventHandler: React.FC<UnifiedEventHandlerProps> = ({ stageRef, visibleElements }) => {
  // Atomic store selectors (React 19 + Zustand 5.0 optimization)
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  const clearSelection = useUnifiedCanvasStore(state => state.clearSelection);
  const selectedElementIds = useUnifiedCanvasStore(state => state.selectedElementIds);
  const textEditingElementId = useUnifiedCanvasStore(state => state.textEditingElementId);
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  const setSnapLines = useUnifiedCanvasStore(state => state.setSnapLines);
  
  // Use context-based selection protection instead of global window
  const { protectSelection, isSelectionProtected } = useCanvasEvents();

  // Centralized RAF management for drag operations
  const dragMoveRAF = useSingleRAF('UnifiedEventHandler-dragMove');
  const latestDragEvent = useRef<Konva.KonvaEventObject<DragEvent> | null>(null);

  // Context-based selection protection is now handled by CanvasEventContext
  // No need for global window pollution

  // RAF-optimized drag move handler with centralized management
  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Store the latest drag event data
    latestDragEvent.current = e;
    
    // Use centralized RAF management for drag operations
    dragMoveRAF.scheduleRAF(() => {
      // Process the latest drag event
      const latestEvent = latestDragEvent.current;
      if (!latestEvent) return;
      
      const target = latestEvent.target;
      const elementId = target.id() as ElementId;
      const isSnappingEnabled = useUnifiedCanvasStore.getState().snapToGrid;

      if (isSnappingEnabled) {
        const element = useUnifiedCanvasStore.getState().elements.get(elementId) as CanvasElement;
        
        if (element) {
          const draggedElement = { ...element, x: target.x(), y: target.y() };
          const newSnapLines = calculateSnapLines(draggedElement, visibleElements);
          setSnapLines(newSnapLines.flatMap(line => line.points));

          let snappedX = target.x();
          let snappedY = target.y();

          newSnapLines.forEach(line => {
            if (line.points[0] === line.points[2]) { // Vertical line
              snappedX = line.points[0] - (draggedElement.x - target.x());
            } else { // Horizontal line
              snappedY = line.points[1] - (draggedElement.y - target.y());
            }
          });

          target.position({ x: snappedX, y: snappedY });
        }
      }
    }, 'drag-move');
  }, [visibleElements, setSnapLines, dragMoveRAF]);

  // Optimized drag end handler
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const target = e.target;
    const elementId = target.id() as ElementId;
    
    // Clear snap lines after drag
    setSnapLines([]);

    if (elementId && target.isDragging()) {
      const element = useUnifiedCanvasStore.getState().elements.get(elementId);
      // Skip table elements - they handle their own drag events
      if (element?.type === 'table') {
        return;
      }
      
      updateElement(elementId, {
        x: target.x(),
        y: target.y(),
      });
    }
  }, [updateElement, setSnapLines]);

  // Optimized click handler with cached element lookup
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const target = e.target;
    let elementId = target.id();
    
    // Check if this is a text element (has -text or -bg suffix)
    if (elementId && (elementId.endsWith('-text') || elementId.endsWith('-bg'))) {
      elementId = elementId.replace(/-(text|bg)$/, '');
    }
    
    // OPTIMIZED: Limit traversal to maximum 3 levels instead of 5
    if (!elementId) {
      let currentNode = target.parent;
      let depth = 0;
      
      // Check parent and grandparent only (most canvas elements are within 2 levels)
      while (currentNode && currentNode !== stage && depth < 3) {
        const nodeId = currentNode.id();
        if (nodeId) {
          // Clean text/bg suffixes
          elementId = nodeId.endsWith('-text') || nodeId.endsWith('-bg') 
            ? nodeId.replace(/-(text|bg)$/, '') 
            : nodeId;
          break;
        }
        currentNode = currentNode.parent;
        depth++;
      }
    }
    
    // Check if we're clicking on a text element that's being edited
    if (textEditingElementId && elementId === textEditingElementId) {
      return;
    }
    
    // If we found an element ID, handle element click
    if (elementId) {
      // If clicking on a different element while text is being edited, ignore
      if (textEditingElementId && elementId !== textEditingElementId) {
        return;
      }
      
      // Handle selection with multi-select support
      const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey;
      selectElement(elementId as ElementId, isMultiSelect);
    } else if (target === stage || target.className === 'Layer') {
      // Only clear selection if we truly clicked on the stage background or a layer
      // Check if selection is protected (e.g., after text operations)
      if (isSelectionProtected()) {
        return;
      }
      
      // Check if we have a text element being edited
      if (textEditingElementId) {
        return;
      }
      
      // Don't handle stage clicks when text or sticky-note tool is active - let dedicated tools handle them
      if (selectedTool === 'text' || selectedTool === 'sticky-note') {
        return;
      }
      
      clearSelection();
    }
  }, [stageRef, selectElement, clearSelection, textEditingElementId, selectedTool]);

  // Optimized transform end handler
  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const target = e.target;
    const elementId = target.id();
    
    if (elementId) {
      const scaleX = target.scaleX();
      const scaleY = target.scaleY();
      
      // Update element with new position and dimensions
      updateElement(elementId as ElementOrSectionId, {
        x: target.x(),
        y: target.y(),
        width: target.width() * scaleX,
        height: target.height() * scaleY
      });
      
      // Reset scale after applying to dimensions
      target.scaleX(1);
      target.scaleY(1);
    }
  }, [updateElement]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Attach essential event listeners using optimized handlers
    stage.on('dragmove', handleDragMove);
    stage.on('dragend', handleDragEnd);
    stage.on('click', handleClick);
    stage.on('transformend', handleTransformEnd);

    // Cleanup function
    return () => {
      stage.off('dragmove', handleDragMove);
      stage.off('dragend', handleDragEnd);
      stage.off('click', handleClick);
      stage.off('transformend', handleTransformEnd);
    };
  }, [stageRef, handleDragMove, handleDragEnd, handleClick, handleTransformEnd]);

  return null; // This component does not render anything.
};

export default UnifiedEventHandler; 