import { StoreModule, StoreSet, StoreGet } from './types';
import { logger } from '../../../../core/lib/logger';

/**
 * Event module state
 */
export interface EventState {
  // No additional state needed - event handlers are stateless
}

/**
 * Event module actions
 */
export interface EventActions {
  handleMouseDown: (e: any, pos: { x: number; y: number } | null) => void;
  handleMouseMove: (e: any, pos: { x: number; y: number } | null) => void;
  handleMouseUp: (e: any, pos: { x: number; y: number } | null) => void;
  handleMouseLeave: (e: any, pos: { x: number; y: number } | null) => void;
  handleClick: (e: any, pos: { x: number; y: number } | null) => void;
  handleDoubleClick: (e: any, pos: { x: number; y: number } | null) => void;
  handleContextMenu: (e: any, pos: { x: number; y: number } | null) => void;
  handleDragStart: (e: any, pos: { x: number; y: number } | null) => void;
  handleDragMove: (e: any, pos: { x: number; y: number } | null) => void;
  handleDragEnd: (e: any, pos: { x: number; y: number } | null) => void;
}

/**
 * Creates the event module
 */
export const createEventModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<EventState, EventActions> => {
  return {
    state: {
      // No state needed for event handlers
    },
    
    actions: {
      handleMouseDown: (e, pos) => {
        const { selectedTool, startDrawing, clearSelection, selectElement, createElement } = get();
        
        if (!pos) return;
        
        logger.debug('[EventModule] handleMouseDown', { tool: selectedTool, pos });
        
        // Handle different tools
        switch (selectedTool) {
          case 'pen':
          case 'pencil':
          case 'marker':
          case 'highlighter':
          case 'eraser':
            startDrawing(selectedTool as any, pos);
            break;
            
          case 'rectangle':
          case 'circle':
          case 'triangle':
          case 'text':
          case 'sticky-note':
            createElement(selectedTool, pos);
            break;
            
          case 'select':
            // Check if we clicked on an element
            const target = e?.target;
            if (target && target.id && target.id()) {
              const elementId = target.id();
              selectElement(elementId, e?.evt?.ctrlKey || e?.evt?.metaKey);
            } else {
              clearSelection();
            }
            break;
            
          default:
            logger.debug('[EventModule] Unhandled tool in mouseDown:', selectedTool);
            break;
        }
      },

      handleMouseMove: (e, pos) => {
        const { selectedTool, isDrawing, updateDrawing } = get();
        
        if (!pos) return;
        
        // Handle drawing tools
        if (isDrawing && (selectedTool === 'pen' || selectedTool === 'pencil' || selectedTool === 'marker' || selectedTool === 'highlighter' || selectedTool === 'eraser')) {
          updateDrawing(pos);
        }
      },

      handleMouseUp: (e, pos) => {
        const { selectedTool, isDrawing, finishDrawing } = get();
        
        logger.debug('[EventModule] handleMouseUp', { tool: selectedTool, isDrawing });
        
        // Handle drawing tools
        if (isDrawing && (selectedTool === 'pen' || selectedTool === 'pencil' || selectedTool === 'marker' || selectedTool === 'highlighter' || selectedTool === 'eraser')) {
          finishDrawing();
        }
      },

      handleMouseLeave: (e, pos) => {
        const { isDrawing, finishDrawing } = get();
        
        // Finish drawing if we leave the canvas while drawing
        if (isDrawing) {
          finishDrawing();
        }
      },

      handleClick: (e, pos) => {
        // Click events are handled in handleMouseDown for most tools
        logger.debug('[EventModule] handleClick', { pos });
      },

      handleDoubleClick: (e, pos) => {
        const { setTextEditingElement } = get();
        
        if (!pos) return;
        
        // Check if we double-clicked on a text element
        const target = e?.target;
        if (target && target.id && target.id()) {
          const elementId = target.id();
          const element = get().elements.get(elementId);
          
          if (element && (element.type === 'text' || element.type === 'rectangle' || element.type === 'circle' || element.type === 'triangle')) {
            setTextEditingElement(elementId);
          }
        }
      },

      handleContextMenu: (e, pos) => {
        logger.debug('[EventModule] handleContextMenu', { pos });
        // Context menu logic can be added here
      },

      handleDragStart: (e, pos) => {
        logger.debug('[EventModule] handleDragStart', { pos });
        // Drag start logic can be added here
      },

      handleDragMove: (e, pos) => {
        logger.debug('[EventModule] handleDragMove', { pos });
        // Drag move logic can be added here
      },

      handleDragEnd: (e, pos) => {
        const { updateElement } = get();
        
        if (!e?.target) return;
        
        const target = e.target;
        const elementId = target.id();
        
        if (elementId) {
          updateElement(elementId, {
            x: target.x(),
            y: target.y(),
          });
        }
      },
    },
  };
};