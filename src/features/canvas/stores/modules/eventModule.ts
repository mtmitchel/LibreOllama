import { UnifiedCanvasStore } from '../unifiedCanvasStore';
import { StoreModule, StoreSet, StoreGet } from './types';
// Inline logger to avoid circular dependencies
const logger = {
  debug: (...args: any[]) => console.debug(...args),
  info: (...args: any[]) => console.info(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};
import { 
  KonvaMouseEvent, 
  KonvaPointerEvent, 
  KonvaDragEvent, 
  Position 
} from '../../types/event.types';
import { ElementId, ElementOrSectionId } from '../../types/enhanced.types';

/**
 * Event module state
 */
export interface EventState {
  // No additional state needed - event handlers are stateless
  // This empty interface is intentional - events are stateless
  readonly __eventStateMarker?: never;
}

/**
 * Event module actions with proper type safety
 */
export interface EventActions {
  handleMouseDown: (e: KonvaMouseEvent, pos: Position | null) => void;
  handleMouseMove: (e: KonvaMouseEvent, pos: Position | null) => void;
  handleMouseUp: (e: KonvaMouseEvent, pos: Position | null) => void;
  handleMouseLeave: (e: KonvaMouseEvent, pos: Position | null) => void;
  handleClick: (e: KonvaMouseEvent, pos: Position | null) => void;
  handleDoubleClick: (e: KonvaMouseEvent, pos: Position | null) => void;
  handleContextMenu: (e: KonvaMouseEvent, pos: Position | null) => void;
  handleDragStart: (e: KonvaDragEvent, pos: Position | null) => void;
  handleDragMove: (e: KonvaDragEvent, pos: Position | null) => void;
  handleDragEnd: (e: KonvaDragEvent, pos: Position | null) => void;
  resolveElementFromTarget: (target: any) => string | null;
}

/**
 * Creates the event module
 */
export const createEventModule = (
  set: StoreSet,
  get: () => UnifiedCanvasStore
): StoreModule<EventState, EventActions> => {
  // Cast the set and get functions to work with any state for flexibility
  const setState = set as any;
  const getState = get;
  
  return {
    state: {
      // No state needed for event handlers
    },
    
    actions: {
      /**
       * Enhanced target resolution that finds nearest ancestor with an ID
       * This helps with composite shapes where child elements may not have IDs
       */
      resolveElementFromTarget: (target) => {
        if (!target) return null;
        
        let current = target;
        let maxDepth = 10; // Prevent infinite loops
        
        while (current && maxDepth-- > 0) {
          // Check if current node has an ID
          if (current.id && typeof current.id === 'function') {
            const id = current.id();
            if (id && typeof id === 'string') {
              return id;
            }
          }
          
          // Move up to parent
          current = current.getParent ? current.getParent() : null;
        }
        
        return null;
      },

      handleMouseDown: (e, pos) => {
        const { selectedTool, startDrawing, clearSelection, selectElement, createElement, resolveElementFromTarget } = get();
        
        if (!pos) return;
        
        logger.debug('[EventModule] handleMouseDown', { tool: selectedTool, pos });
        
        // Handle different tools
        switch (selectedTool) {
          case 'pen':
          case 'pencil':
          case 'marker':
          case 'highlighter':
            startDrawing(selectedTool, pos);
            break;
            
          case 'rectangle':
          case 'circle':
          case 'triangle':
          case 'text':
          case 'sticky-note':
            createElement(selectedTool, pos);
            break;
            
          case 'select':
            // Enhanced hit-testing: resolve target to nearest ancestor with ID
            const elementId = resolveElementFromTarget(e?.target);
            if (elementId) {
              selectElement(elementId as ElementId, e?.evt?.ctrlKey || e?.evt?.metaKey);
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
        if (isDrawing && (selectedTool === 'pen' || selectedTool === 'pencil' || selectedTool === 'marker' || selectedTool === 'highlighter')) {
          updateDrawing(pos);
        }
      },

      handleMouseUp: (e, pos) => {
        const { selectedTool, isDrawing, finishDrawing } = get();
        
        logger.debug('[EventModule] handleMouseUp', { tool: selectedTool, isDrawing });
        
        // Handle drawing tools
        if (isDrawing && (selectedTool === 'pen' || selectedTool === 'pencil' || selectedTool === 'marker' || selectedTool === 'highlighter')) {
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
        const { setTextEditingElement, resolveElementFromTarget } = get();
        
        if (!pos) return;
        
        // Enhanced hit-testing for double-click
        const elementId = resolveElementFromTarget(e?.target);
        if (elementId) {
          const element = getState().elements.get(elementId);
          
          if (element && (element.type === 'text' || element.type === 'rectangle' || element.type === 'circle' || element.type === 'triangle' || element.type === 'sticky-note')) {
            setTextEditingElement(elementId as ElementId);
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
          updateElement(elementId as ElementOrSectionId, {
            x: target.x(),
            y: target.y(),
          });
        }
      },
    },
  };
};