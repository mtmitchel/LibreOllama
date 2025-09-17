import React, { useEffect, useCallback, useRef } from 'react';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { logger } from '../../../core/lib/logger';
import { ElementId, ElementOrSectionId } from '../types/enhanced.types';

interface UnifiedEventHandlerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

/**
 * UnifiedEventHandler - Centralized event delegation for the canvas.
 * PERFORMANCE OPTIMIZATION: Reduced logging and optimized event handling
 * 
 * FIXED: Properly handles text tool events and prevents conflicts with tool-specific event handlers
 */
const UnifiedEventHandler: React.FC<UnifiedEventHandlerProps> = ({ stageRef }) => {
  // Store access - using grouped selectors with useShallow
  const {
    updateElement,
    selectElement,
    clearSelection,
    selectedElementIds,
    textEditingElementId,
    selectedTool
  } = useUnifiedCanvasStore(useShallow((state) => ({
    updateElement: state.updateElement,
    selectElement: state.selectElement,
    clearSelection: state.clearSelection,
    selectedElementIds: state.selectedElementIds,
    textEditingElementId: state.textEditingElementId,
    selectedTool: state.selectedTool
  })));
  
  // Protection flag to prevent clearing selection immediately after text operations
  const selectionProtected = useRef<boolean>(false);
  const protectionTimeout = useRef<NodeJS.Timeout | null>(null);

  // Expose protection method to global window for TextTool access
  React.useEffect(() => {
    (window as any).__protectSelection = () => {
      selectionProtected.current = true;
      
      // Clear any existing timeout
      if (protectionTimeout.current) {
        clearTimeout(protectionTimeout.current);
      }
      
      // Clear protection after 500ms (longer for text operations)
      protectionTimeout.current = setTimeout(() => {
        selectionProtected.current = false;
        protectionTimeout.current = null;
      }, 500);
    };
    
    return () => {
      delete (window as any).__protectSelection;
      if (protectionTimeout.current) {
        clearTimeout(protectionTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Handle global drag end for element updates
    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
      const target = e.target;
      const elementId = target.id() as ElementId;

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
    };

    // PERFORMANCE OPTIMIZATION: Streamlined element ID resolution
    const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
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
        if (selectionProtected.current) {
          return;
        }
        
        // Check if we have a text element being edited
        if (textEditingElementId) {
          return;
        }
        
        // FIXED: Allow text tool to handle stage clicks for text creation
        // Instead of completely blocking stage clicks for text tool, let the TextTool handle them first
        // The TextTool will handle text placement, and if it doesn't handle the click, 
        // it will bubble up to here for selection clearing
        if (selectedTool === 'text') {
          // Don't clear selection immediately - let TextTool handle it first
          // If TextTool doesn't handle the click, it will clear selection via its own logic
          return;
        }
        
        clearSelection();
      }
    };

    // Handle transform end for element updates
    const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
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
    };

    // Attach essential event listeners
    stage.on('dragend', handleDragEnd);
    stage.on('click', handleClick);
    stage.on('transformend', handleTransformEnd);

    // Cleanup function
    return () => {
      stage.off('dragend', handleDragEnd);
      stage.off('click', handleClick);
      stage.off('transformend', handleTransformEnd);
    };
  }, [stageRef, updateElement, selectElement, clearSelection, selectedElementIds, textEditingElementId, selectedTool]);

  return null; // This component does not render anything.
};

export default UnifiedEventHandler;