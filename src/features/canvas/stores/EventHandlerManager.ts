/**
 * EventHandlerManager - Centralized event logic for Canvas
 * Part of Phase 4: Store Architecture Cleanup
 * 
 * This class consolidates all event handling logic that was previously
 * scattered across UI components, eliminating the need for type casts
 * and ensuring single source of truth for business logic.
 */

import Konva from 'konva';
import { logger } from '../../../lib/logger';
import { 
  CanvasElement, 
  ElementId, 
  SectionId, 
  isTextElement,
  isRectangleElement,
  isCircleElement,
  isSectionElement,
  isConnectorElement
} from '../types/enhanced.types';

export interface EventHandlerManager {
  // Element interaction events
  handleElementClick: (e: Konva.KonvaEventObject<MouseEvent>, elementId: ElementId) => void;
  handleElementDragStart: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => void;
  handleElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => void;
  handleElementDragMove: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => void;
  handleElementTransform: (e: Konva.KonvaEventObject<Event>, elementId: ElementId) => void;
  
  // Canvas interaction events
  handleCanvasClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleCanvasDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleCanvasDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  
  // Text editing events
  handleTextEditStart: (elementId: ElementId) => void;
  handleTextEditEnd: (elementId: ElementId, newText: string) => void;
  
  // Section events
  handleSectionResize: (sectionId: SectionId, newWidth: number, newHeight: number) => void;
}

/**
 * Creates an EventHandlerManager instance bound to a store
 * This follows the pattern: store.eventHandler.handleElementClick()
 */
export function createEventHandlerManager(
  // Store access functions - these will be bound to the actual store methods
  storeAPI: {
    getState: () => any;
    setState: (updater: any) => void;
    // Core operations that the event handler needs
    updateElement: (id: ElementId | SectionId, updates: Partial<CanvasElement>) => void;
    selectElement: (id: ElementId, multiSelect?: boolean) => void;
    clearSelection: () => void;
    setTextEditingElement: (id: ElementId | null) => void;
    addToHistory: (operation: string) => void;
    createElement: (type: string, position: { x: number; y: number }) => void;
  }
): EventHandlerManager {
  
  return {
    handleElementClick: (e: Konva.KonvaEventObject<MouseEvent>, elementId: ElementId) => {
      logger.debug(`[EventHandlerManager] Element clicked: ${elementId}`);
      
      const state = storeAPI.getState();
      const element = state.elements.get(elementId);
      
      if (!element) {
        logger.warn(`[EventHandlerManager] Element not found: ${elementId}`);
        return;
      }

      // Handle multi-selection with Ctrl/Cmd key
      const multiSelect = e.evt.ctrlKey || e.evt.metaKey;
      storeAPI.selectElement(elementId, multiSelect);
      
      // Stop propagation to prevent canvas click
      e.cancelBubble = true;
    },

    handleElementDragStart: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => {
      logger.debug(`[EventHandlerManager] Drag start: ${elementId}`);
      
      const state = storeAPI.getState();
      const element = state.elements.get(elementId);
      
      if (!element) return;
      
      // Ensure element is selected when dragging starts
      if (!state.selectedElementIds.has(elementId)) {
        storeAPI.selectElement(elementId);
      }
      
      // Store initial position for history
      storeAPI.addToHistory(`Move ${element.type} element`);
    },

    handleElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => {
      logger.debug(`[EventHandlerManager] Drag end: ${elementId}`);
      
      // CRITICAL: Use e.target.position() as the source of truth
      // This eliminates coordinate calculation errors that cause "jumping"
      const finalPosition = e.target.position();
      
      storeAPI.updateElement(elementId, {
        x: finalPosition.x,
        y: finalPosition.y
      });
      
      // Handle connector updates if this element has connectors
      const state = storeAPI.getState();
      const connectedElements = Array.from(state.elements.values()).filter(el => 
        isConnectorElement(el) && (el.startElementId === elementId || el.endElementId === elementId)
      );
      
      // Update connected connectors
      connectedElements.forEach(connector => {
        if (isConnectorElement(connector)) {
          // Connector update logic will be handled by the store
          storeAPI.updateElement(connector.id as ElementId, { 
            // Trigger connector recalculation
            lastUpdated: Date.now() 
          });
        }
      });
    },

    handleElementDragMove: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => {
      // Optional: Handle real-time updates during drag
      // Currently, we only update on drag end for performance
    },

    handleElementTransform: (e: Konva.KonvaEventObject<Event>, elementId: ElementId) => {
      logger.debug(`[EventHandlerManager] Transform: ${elementId}`);
      
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      // Reset scale and apply to width/height instead
      node.scaleX(1);
      node.scaleY(1);
      
      const state = storeAPI.getState();
      const element = state.elements.get(elementId);
      
      if (!element) return;
      
      // Type-safe updates based on element type
      if (isRectangleElement(element) || isCircleElement(element)) {
        storeAPI.updateElement(elementId, {
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          x: node.x(),
          y: node.y()
        });
      } else if (isTextElement(element)) {
        storeAPI.updateElement(elementId, {
          fontSize: Math.max(8, (element.fontSize || 16) * scaleX),
          x: node.x(),
          y: node.y()
        });
      }
      
      storeAPI.addToHistory(`Resize ${element.type} element`);
    },

    handleCanvasClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.debug('[EventHandlerManager] Canvas clicked');
      
      // Only process if we clicked on the stage (not an element)
      if (e.target !== e.target.getStage()) {
        return;
      }
      
      const stage = e.target.getStage();
      const position = stage?.getPointerPosition();
      
      if (!stage || !position) {
        storeAPI.clearSelection();
        return;
      }
      
      const state = storeAPI.getState();
      const currentTool = state.selectedTool;
      
      logger.debug(`[EventHandlerManager] Creating element with tool: ${currentTool} at:`, position);
      
      // Create element based on selected tool
      switch (currentTool) {
        case 'text':
          storeAPI.createElement('text', position);
          break;
        case 'sticky-note':
          storeAPI.createElement('sticky-note', position);
          break;
        case 'rectangle':
          storeAPI.createElement('rectangle', position);
          break;
        case 'circle':
          storeAPI.createElement('circle', position);
          break;
        case 'section':
          storeAPI.createElement('section', position);
          break;
        case 'table':
          storeAPI.createElement('table', position);
          break;
        default:
          // For select tool or unknown tools, just clear selection
          storeAPI.clearSelection();
          break;
      }
    },

    handleCanvasDragStart: (e: Konva.KonvaEventObject<DragEvent>) => {
      logger.debug('[EventHandlerManager] Canvas drag start');
      // Selection rectangle start logic will be handled by the store
    },

    handleCanvasDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      logger.debug('[EventHandlerManager] Canvas drag end');
      // Selection rectangle end logic will be handled by the store
    },

    handleTextEditStart: (elementId: ElementId) => {
      logger.debug(`[EventHandlerManager] Text edit start: ${elementId}`);
      storeAPI.setTextEditingElement(elementId);
    },

    handleTextEditEnd: (elementId: ElementId, newText: string) => {
      logger.debug(`[EventHandlerManager] Text edit end: ${elementId}`);
      
      storeAPI.updateElement(elementId, { text: newText });
      storeAPI.setTextEditingElement(null);
      storeAPI.addToHistory(`Edit text: ${newText.substring(0, 20)}...`);
    },

    handleSectionResize: (sectionId: SectionId, newWidth: number, newHeight: number) => {
      logger.debug(`[EventHandlerManager] Section resize: ${sectionId}`);
      
      storeAPI.updateElement(sectionId, {
        width: newWidth,
        height: newHeight
      });
      
      storeAPI.addToHistory(`Resize section`);
    }
  };
}