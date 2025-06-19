import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  CanvasElement, 
  CanvasState, 
  CanvasMode, 
  Viewport, 
  CanvasSettings, 
  SelectionBox,
  ElementType,
  Point,
  Bounds
} from '../types/canvas';
import { ToolType } from '../types/tools';

interface CanvasStore extends CanvasState {
  // Element operations
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElement: (id: string) => string;
  duplicateElements: (ids: string[]) => string[];
  
  // Selection operations
  selectElement: (id: string, addToSelection?: boolean) => void;
  selectElements: (ids: string[]) => void;
  deselectElement: (id: string) => void;
  deselectAll: () => void;
  selectAll: () => void;
  selectInBounds: (bounds: Bounds) => void;
  
  // Clipboard operations
  copy: () => void;
  cut: () => void;
  paste: (offset?: Point) => void;
  
  // Layer operations
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;
  bringForward: (ids: string[]) => void;
  sendBackward: (ids: string[]) => void;
  
  // Group operations
  groupElements: (ids: string[]) => string;
  ungroupElements: (groupId: string) => void;
  
  // Viewport operations
  setViewport: (viewport: Partial<Viewport>) => void;
  panViewport: (dx: number, dy: number) => void;
  zoomViewport: (scale: number, center?: Point) => void;
  zoomToFit: () => void;
  zoomToSelection: () => void;
  
  // Tool operations
  setTool: (tool: ToolType) => void;
  setMode: (mode: CanvasMode) => void;
  
  // Settings
  updateSettings: (settings: Partial<CanvasSettings>) => void;
  
  // Selection box
  setSelectionBox: (box: Partial<SelectionBox>) => void;
  clearSelectionBox: () => void;
  
  // Drag state
  setDragging: (isDragging: boolean) => void;
  setResizing: (isResizing: boolean) => void;
  
  // Canvas operations
  clear: () => void;
  reset: () => void;
  
  // Utility functions
  getElementById: (id: string) => CanvasElement | undefined;
  getSelectedElements: () => CanvasElement[];
  getElementsInBounds: (bounds: Bounds) => CanvasElement[];
  getCanvasBounds: () => Bounds;
  screenToCanvas: (point: Point) => Point;
  canvasToScreen: (point: Point) => Point;
}

const initialSettings: CanvasSettings = {
  gridSize: 20,
  snapToGrid: false,
  showGrid: true,
  backgroundColor: '#ffffff',
  infiniteCanvas: true
};

const initialViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 1
};

const initialSelectionBox: SelectionBox = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  visible: false
};

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      elements: {},
      selectedIds: [],
      clipboard: [],
      viewport: initialViewport,
      settings: initialSettings,
      selectionBox: initialSelectionBox,
      isDragging: false,
      isResizing: false,
      currentTool: ToolType.SELECT,
      mode: CanvasMode.SELECT,

      // Canvas operations
      loadCanvas: (canvasData: Partial<Pick<CanvasState, 'elements' | 'settings'>>) => {
        set((state) => {
          if (canvasData.elements) {
            state.elements = canvasData.elements;
          }
          if (canvasData.settings) {
            state.settings = { ...state.settings, ...canvasData.settings };
          }
          state.selectedIds = [];
        });
      },

      // Element operations
      addElement: (element) => {
        set((state) => {
          state.elements[element.id] = element;
        });
      },

      updateElement: (id, updates) => {
        set((state) => {
          if (state.elements[id]) {
            Object.assign(state.elements[id], updates);
            state.elements[id].modifiedAt = Date.now();
          }
        });
      },

      deleteElement: (id) => {
        set((state) => {
          delete state.elements[id];
          state.selectedIds = state.selectedIds.filter(selectedId => selectedId !== id);
        });
      },

      deleteElements: (ids) => {
        set((state) => {
          ids.forEach(id => {
            delete state.elements[id];
          });
          state.selectedIds = state.selectedIds.filter(selectedId => !ids.includes(selectedId));
        });
      },

      duplicateElement: (id) => {
        const element = get().elements[id];
        if (!element) return '';
        
        const newId = uuidv4();
        const duplicatedElement: CanvasElement = {
          ...element,
          id: newId,
          x: element.x + 20,
          y: element.y + 20,
          createdAt: Date.now(),
          modifiedAt: Date.now()
        };
        
        get().addElement(duplicatedElement);
        return newId;
      },

      duplicateElements: (ids) => {
        const newIds: string[] = [];
        ids.forEach(id => {
          const newId = get().duplicateElement(id);
          if (newId) newIds.push(newId);
        });
        return newIds;
      },

      // Selection operations
      selectElement: (id, addToSelection = false) => {
        set((state) => {
          if (addToSelection) {
            if (!state.selectedIds.includes(id)) {
              state.selectedIds.push(id);
            }
          } else {
            state.selectedIds = [id];
          }
        });
      },

      selectElements: (ids) => {
        set((state) => {
          state.selectedIds = [...ids];
        });
      },

      deselectElement: (id) => {
        set((state) => {
          state.selectedIds = state.selectedIds.filter(selectedId => selectedId !== id);
        });
      },

      deselectAll: () => {
        set((state) => {
          state.selectedIds = [];
        });
      },

      selectAll: () => {
        set((state) => {
          state.selectedIds = Object.keys(state.elements);
        });
      },

      selectInBounds: (bounds) => {
        const elementsInBounds = get().getElementsInBounds(bounds);
        get().selectElements(elementsInBounds.map(el => el.id));
      },

      // Clipboard operations
      copy: () => {
        const selectedElements = get().getSelectedElements();
        set((state) => {
          state.clipboard = selectedElements.map(element => ({ ...element }));
        });
      },

      cut: () => {
        get().copy();
        get().deleteElements(get().selectedIds);
      },

      paste: (offset = { x: 20, y: 20 }) => {
        const { clipboard } = get();
        if (clipboard.length === 0) return;

        const newIds: string[] = [];
        const newElements = clipboard.map(element => {
          const newId = uuidv4();
          const newElement: CanvasElement = {
            ...element,
            id: newId,
            x: element.x + offset.x,
            y: element.y + offset.y,
            createdAt: Date.now(),
            modifiedAt: Date.now()
          };
          newIds.push(newId);
          return newElement;
        });

        set((state) => {
          newElements.forEach(element => {
            state.elements[element.id] = element;
          });
          state.selectedIds = newIds;
        });
      },

      // Layer operations
      bringToFront: (ids) => {
        const allElements = Object.values(get().elements);
        const maxZIndex = Math.max(...allElements.map(el => el.zIndex));
        
        set((state) => {
          ids.forEach((id, index) => {
            if (state.elements[id]) {
              state.elements[id].zIndex = maxZIndex + index + 1;
            }
          });
        });
      },

      sendToBack: (ids) => {
        const allElements = Object.values(get().elements);
        const minZIndex = Math.min(...allElements.map(el => el.zIndex));
        
        set((state) => {
          ids.forEach((id, index) => {
            if (state.elements[id]) {
              state.elements[id].zIndex = minZIndex - ids.length + index;
            }
          });
        });
      },

      bringForward: (ids) => {
        set((state) => {
          ids.forEach(id => {
            if (state.elements[id]) {
              state.elements[id].zIndex += 1;
            }
          });
        });
      },

      sendBackward: (ids) => {
        set((state) => {
          ids.forEach(id => {
            if (state.elements[id]) {
              state.elements[id].zIndex -= 1;
            }
          });
        });
      },

      // Group operations
      groupElements: (ids) => {
        if (ids.length < 2) return '';
        
        const groupId = uuidv4();
        const elements = ids.map(id => get().elements[id]).filter(Boolean);
        
        if (elements.length === 0) return '';
        
        // Calculate group bounds
        const bounds = elements.reduce(
          (acc, el) => ({
            x: Math.min(acc.x, el.x),
            y: Math.min(acc.y, el.y),
            maxX: Math.max(acc.maxX, el.x + el.width),
            maxY: Math.max(acc.maxY, el.y + el.height)
          }),
          { x: Infinity, y: Infinity, maxX: -Infinity, maxY: -Infinity }
        );

        const groupElement: CanvasElement = {
          id: groupId,
          type: ElementType.GROUP,
          x: bounds.x,
          y: bounds.y,
          width: bounds.maxX - bounds.x,
          height: bounds.maxY - bounds.y,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: Math.max(...elements.map(el => el.zIndex)),
          style: {},
          data: {
            childIds: ids,
            name: 'Group'
          },
          createdAt: Date.now(),
          modifiedAt: Date.now()
        };

        set((state) => {
          // Add group element
          state.elements[groupId] = groupElement;
          
          // Update child elements to reference group
          ids.forEach(id => {
            if (state.elements[id]) {
              state.elements[id].groupId = groupId;
            }
          });
          
          // Select the group
          state.selectedIds = [groupId];
        });

        return groupId;
      },

      ungroupElements: (groupId) => {
        const groupElement = get().elements[groupId];
        if (!groupElement || groupElement.type !== ElementType.GROUP) return;
        
        const childIds = (groupElement.data as any).childIds || [];
        
        set((state) => {
          // Remove group reference from children
          childIds.forEach((id: string) => {
            if (state.elements[id]) {
              delete state.elements[id].groupId;
            }
          });
          
          // Delete group element
          delete state.elements[groupId];
          
          // Select the ungrouped elements
          state.selectedIds = childIds.filter((id: string) => state.elements[id]);
        });
      },

      // Viewport operations
      setViewport: (viewport) => {
        set((state) => {
          Object.assign(state.viewport, viewport);
        });
      },

      panViewport: (dx, dy) => {
        set((state) => {
          state.viewport.x += dx;
          state.viewport.y += dy;
        });
      },

      zoomViewport: (scale, center) => {
        set((state) => {
          const oldZoom = state.viewport.zoom;
          const newZoom = Math.max(0.1, Math.min(10, oldZoom * scale));
          
          if (center) {
            const zoomPoint = get().screenToCanvas(center);
            state.viewport.x = zoomPoint.x - (zoomPoint.x - state.viewport.x) * (newZoom / oldZoom);
            state.viewport.y = zoomPoint.y - (zoomPoint.y - state.viewport.y) * (newZoom / oldZoom);
          }
          
          state.viewport.zoom = newZoom;
        });
      },

      zoomToFit: () => {
        const canvasBounds = get().getCanvasBounds();
        if (canvasBounds.width === 0 || canvasBounds.height === 0) return;
        
        const padding = 50;
        const viewportWidth = window.innerWidth - padding * 2;
        const viewportHeight = window.innerHeight - padding * 2;
        
        const scaleX = viewportWidth / canvasBounds.width;
        const scaleY = viewportHeight / canvasBounds.height;
        const scale = Math.min(scaleX, scaleY, 1);
        
        set((state) => {
          state.viewport = {
            x: canvasBounds.x - (viewportWidth / scale - canvasBounds.width) / 2,
            y: canvasBounds.y - (viewportHeight / scale - canvasBounds.height) / 2,
            zoom: scale
          };
        });
      },

      zoomToSelection: () => {
        const selectedElements = get().getSelectedElements();
        if (selectedElements.length === 0) return;
        
        const bounds = selectedElements.reduce(
          (acc, el) => ({
            x: Math.min(acc.x, el.x),
            y: Math.min(acc.y, el.y),
            maxX: Math.max(acc.maxX, el.x + el.width),
            maxY: Math.max(acc.maxY, el.y + el.height)
          }),
          { x: Infinity, y: Infinity, maxX: -Infinity, maxY: -Infinity }
        );

        const padding = 50;
        const viewportWidth = window.innerWidth - padding * 2;
        const viewportHeight = window.innerHeight - padding * 2;
        
        const width = bounds.maxX - bounds.x;
        const height = bounds.maxY - bounds.y;
        
        const scaleX = viewportWidth / width;
        const scaleY = viewportHeight / height;
        const scale = Math.min(scaleX, scaleY, 1);
        
        set((state) => {
          state.viewport = {
            x: bounds.x - (viewportWidth / scale - width) / 2,
            y: bounds.y - (viewportHeight / scale - height) / 2,
            zoom: scale
          };
        });
      },

      // Tool operations
      setTool: (tool) => {
        set((state) => {
          state.currentTool = tool;
          
          // Auto-switch mode based on tool
          switch (tool) {
            case ToolType.SELECT:
              state.mode = CanvasMode.SELECT;
              break;
            case ToolType.TEXT:
              state.mode = CanvasMode.TEXT;
              break;
            case ToolType.PAN:
              state.mode = CanvasMode.PAN;
              break;
            case ToolType.ZOOM:
              state.mode = CanvasMode.ZOOM;
              break;
            case ToolType.FREEFORM:
              state.mode = CanvasMode.DRAW;
              break;
            case ToolType.CONNECTOR:
              state.mode = CanvasMode.CONNECTOR;
              break;
            default:
              state.mode = CanvasMode.SHAPE;
          }
        });
      },

      setMode: (mode) => {
        set((state) => {
          state.mode = mode;
        });
      },

      // Settings
      updateSettings: (settings) => {
        set((state) => {
          Object.assign(state.settings, settings);
        });
      },

      // Selection box
      setSelectionBox: (box) => {
        set((state) => {
          Object.assign(state.selectionBox, box);
        });
      },

      clearSelectionBox: () => {
        set((state) => {
          state.selectionBox = { ...initialSelectionBox };
        });
      },

      // Drag state
      setDragging: (isDragging) => {
        set((state) => {
          state.isDragging = isDragging;
        });
      },

      setResizing: (isResizing) => {
        set((state) => {
          state.isResizing = isResizing;
        });
      },

      // Canvas operations
      clear: () => {
        set((state) => {
          state.elements = {};
          state.selectedIds = [];
          state.clipboard = [];
        });
      },

      reset: () => {
        set((state) => {
          state.elements = {};
          state.selectedIds = [];
          state.clipboard = [];
          state.viewport = { ...initialViewport };
          state.settings = { ...initialSettings };
          state.selectionBox = { ...initialSelectionBox };
          state.isDragging = false;
          state.isResizing = false;
          state.currentTool = ToolType.SELECT;
          state.mode = CanvasMode.SELECT;
        });
      },

      // Utility functions
      getElementById: (id) => {
        return get().elements[id];
      },

      getSelectedElements: () => {
        const { elements, selectedIds } = get();
        return selectedIds.map(id => elements[id]).filter(Boolean);
      },

      getElementsInBounds: (bounds) => {
        const elements = Object.values(get().elements);
        return elements.filter(element => {
          const elementBounds = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height
          };
          
          return (
            elementBounds.x < bounds.x + bounds.width &&
            elementBounds.x + elementBounds.width > bounds.x &&
            elementBounds.y < bounds.y + bounds.height &&
            elementBounds.y + elementBounds.height > bounds.y
          );
        });
      },

      getCanvasBounds: () => {
        const elements = Object.values(get().elements);
        if (elements.length === 0) {
          return { x: 0, y: 0, width: 0, height: 0 };
        }
        
        const bounds = elements.reduce(
          (acc, el) => ({
            x: Math.min(acc.x, el.x),
            y: Math.min(acc.y, el.y),
            maxX: Math.max(acc.maxX, el.x + el.width),
            maxY: Math.max(acc.maxY, el.y + el.height)
          }),
          { x: Infinity, y: Infinity, maxX: -Infinity, maxY: -Infinity }
        );
        
        return {
          x: bounds.x,
          y: bounds.y,
          width: bounds.maxX - bounds.x,
          height: bounds.maxY - bounds.y
        };
      },

      screenToCanvas: (point) => {
        const { viewport } = get();
        return {
          x: (point.x - viewport.x) / viewport.zoom,
          y: (point.y - viewport.y) / viewport.zoom
        };
      },

      canvasToScreen: (point) => {
        const { viewport } = get();
        return {
          x: point.x * viewport.zoom + viewport.x,
          y: point.y * viewport.zoom + viewport.y
        };
      }
    }))
  )
);
