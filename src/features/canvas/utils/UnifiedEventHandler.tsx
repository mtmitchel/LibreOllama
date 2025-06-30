import React, { useEffect, useCallback, useRef } from 'react';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { logger } from '../../../core/lib/logger';

interface UnifiedEventHandlerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

/**
 * UnifiedEventHandler - Centralized event delegation for the canvas.
 *
 * This component attaches all necessary event listeners to the Konva Stage
 * and delegates the handling of these events to the unified Zustand store.
 * It is designed to be the single source of truth for all canvas interactions,
 * ensuring a consistent and predictable event handling pipeline.
 */
const UnifiedEventHandler: React.FC<UnifiedEventHandlerProps> = ({ stageRef }) => {
  // Store access
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  const clearSelection = useUnifiedCanvasStore(state => state.clearSelection);
  const selectedElementIds = useUnifiedCanvasStore(state => state.selectedElementIds);
  const textEditingElementId = useUnifiedCanvasStore(state => state.textEditingElementId);
  
  // Protection flag to prevent clearing selection immediately after text operations
  const selectionProtected = useRef<boolean>(false);
  const protectionTimeout = useRef<NodeJS.Timeout | null>(null);

  // Expose protection method to global window for TextTool access
  React.useEffect(() => {
    (window as any).__protectSelection = () => {
      selectionProtected.current = true;
      console.log('🛡️ [UnifiedEventHandler] Selection protected for text operation');
      
      // Clear any existing timeout
      if (protectionTimeout.current) {
        clearTimeout(protectionTimeout.current);
      }
      
      // Clear protection after 500ms (longer for text operations)
      protectionTimeout.current = setTimeout(() => {
        selectionProtected.current = false;
        console.log('🛡️ [UnifiedEventHandler] Selection protection cleared');
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

    console.log('🎯 [UnifiedEventHandler] Attaching minimal event listeners');

    // Handle global drag end for element updates
    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
      const target = e.target;
      const elementId = target.id();
      
      if (elementId && target.isDragging()) {
        console.log('🎯 [UnifiedEventHandler] Element drag end:', elementId, { x: target.x(), y: target.y() });
        updateElement(elementId, { 
          x: target.x(), 
          y: target.y() 
        });
      }
    };

    // Handle clicks for selection
    const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const target = e.target;
      let elementId = target.id();
      
      console.log('🎯 [UnifiedEventHandler] Click event details:', {
        targetClass: target.className,
        targetId: elementId,
        targetName: target.name(),
        hasParent: !!target.parent,
        parentClass: target.parent?.className,
        parentId: target.parent?.id(),
        isStage: target === stage
      });
      
      // Check if this is a text element (has -text or -bg suffix)
      if (elementId && (elementId.endsWith('-text') || elementId.endsWith('-bg'))) {
        elementId = elementId.replace('-text', '').replace('-bg', '');
        console.log('🎯 [UnifiedEventHandler] Detected text element part, using parent ID:', elementId);
      }
      
      // If the target doesn't have an ID, check its parent (for grouped elements like text)
      if (!elementId && target.parent) {
        const parent = target.parent;
        if (parent && parent.id) {
          elementId = parent.id();
          console.log('🎯 [UnifiedEventHandler] Found parent element ID:', elementId);
        }
      }
      
      // Also check if we clicked on a child of a Group with an ID
      let currentNode = target;
      let depth = 0;
      while (!elementId && currentNode && currentNode !== stage && depth < 5) {
        console.log(`🔍 [UnifiedEventHandler] Checking node at depth ${depth}:`, {
          className: currentNode.className,
          id: currentNode.id(),
          hasParent: !!currentNode.parent
        });
        
        if (currentNode.id && currentNode.id()) {
          elementId = currentNode.id();
          console.log('🎯 [UnifiedEventHandler] Found element ID at depth', depth, ':', elementId);
          break;
        }
        currentNode = currentNode.parent;
        depth++;
      }
      
      console.log('🎯 [UnifiedEventHandler] Final result - Click target:', target.className, 'ID:', elementId || 'none');
      
      // Check if we're clicking on a text element that's being edited
      if (textEditingElementId && elementId === textEditingElementId) {
        console.log('🎯 [UnifiedEventHandler] Click on editing text element - ignoring');
        return;
      }
      
      // If we found an element ID, handle element click
      if (elementId) {
        // Clicking on an element
        console.log('🎯 [UnifiedEventHandler] Element clicked:', elementId);
        
        // If clicking on a different element while text is being edited, ignore
        if (textEditingElementId && elementId !== textEditingElementId) {
          console.log('🎯 [UnifiedEventHandler] Click on different element while editing - ignoring');
          return;
        }
        
        // Handle selection with multi-select support
        const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey;
        selectElement(elementId, isMultiSelect);
      } else if (target === stage || target.className === 'Layer') {
        // Only clear selection if we truly clicked on the stage background or a layer
        // Check if selection is protected (e.g., after text operations)
        if (selectionProtected.current) {
          console.log('🛡️ [UnifiedEventHandler] Stage click ignored - selection protected');
          return;
        }
        
        // Check if we have a text element being edited
        if (textEditingElementId) {
          console.log('🎯 [UnifiedEventHandler] Stage clicked while editing text - ignoring');
          return;
        }
        
        console.log('🎯 [UnifiedEventHandler] Stage background clicked - clearing selection');
        clearSelection();
      } else {
        // Clicked on something else - don't clear selection unless it's clearly a background click
        console.log('🎯 [UnifiedEventHandler] Click on unrecognized target:', {
          className: target.className,
          name: target.name(),
          id: elementId || 'none'
        });
      }
    };

    // Handle transform end for element updates
    const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
      const target = e.target;
      const elementId = target.id();
      
      if (elementId) {
        console.log('🎯 [UnifiedEventHandler] Element transform end:', elementId);
        const scaleX = target.scaleX();
        const scaleY = target.scaleY();
        
        // Update element with new position and dimensions
        updateElement(elementId, {
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
  }, [stageRef, updateElement, selectElement, clearSelection, selectedElementIds, textEditingElementId]);

  return null; // This component does not render anything.
};

export default UnifiedEventHandler;
