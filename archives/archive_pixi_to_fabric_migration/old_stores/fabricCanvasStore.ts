/**
 * Fabric.js Canvas Store - Core Feature Migration
 * Replaces PIXI.js-specific state management with Fabric.js-compatible store
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Canvas as FabricCanvas, FabricObject } from 'fabric';

// Enhanced CanvasElement interface for Fabric.js compatibility
export interface FabricCanvasElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'sticky-note' | 'triangle' | 'star' | 'hexagon' | 'arrow' | 'square' | 'image' | 'drawing';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  textAlignment?: 'left' | 'center' | 'right';
  isBold?: boolean;
  isItalic?: boolean;
  isLocked?: boolean;
  
  // Fabric.js specific properties
  fabricObject?: fabric.Object; // Reference to the actual Fabric.js object
  fabricId?: string; // Fabric object's internal ID
  
  // Extended properties for different element types
  strokeColor?: string;
  strokeWidth?: number;
  radius?: number; // For circles
  points?: { x: number; y: number }[]; // For lines and drawings
  [key: string]: any;
}

interface FabricCanvasState {
  // Core state
  elements: Record<string, FabricCanvasElement>;
  selectedElementIds: string[];
  isEditingText: string | null;
  activeTool: string;
  
  // Canvas interaction state
  isDragging: boolean;
  dragStartPos: { x: number; y: number } | null;
  dragStartElementPositions: Record<string, { x: number; y: number }> | null;
  
  // History management
  history: FabricCanvasElement[][];
  historyIndex: number;
  
  // Viewport state
  zoom: number;
  pan: { x: number; y: number };
  
  // Drawing state
  isDrawing: boolean;
  previewElement: FabricCanvasElement | null;
  
  // Text formatting
  showTextFormatting: boolean;
  textFormattingPosition: any;
  selectedTextElement: string | null;
  
  // Double-click protection
  pendingDoubleClick: string | null;
  
  // Fabric.js specific state
  fabricCanvas: fabric.Canvas | null;
  isCanvasReady: boolean;
  
  // Actions
  setFabricCanvas: (canvas: fabric.Canvas | null) => void;
  setCanvasReady: (ready: boolean) => void;
  
  // Element management
  addElement: (element: FabricCanvasElement) => void;
  updateElement: (id: string, updates: Partial<FabricCanvasElement>) => void;
  deleteElement: (id: string) => void;
  
  // Selection management
  selectElement: (id: string, addToSelection?: boolean) => void;
  selectMultipleElements: (ids: string[]) => void;
  clearSelection: () => void;
  setSelectedElementIds: (ids: string[]) => void;
  
  // State management
  setIsEditingText: (id: string | null) => void;
  setActiveTool: (tool: string) => void;
  setDragState: (isDragging: boolean, dragStartPos: { x: number; y: number } | null, dragStartElementPositions: Record<string, { x: number; y: number }> | null) => void;
  
  // Drawing state
  setIsDrawing: (isDrawing: boolean) => void;
  setPreviewState: (isActive: boolean, element: FabricCanvasElement | null) => void;
  
  // Text formatting
  setTextFormattingState: (show: boolean) => void;
  setTextSelectionState: (elementId: string | null, position: any, selectedElement: string | null) => void;
  
  // Viewport management
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  
  // History management
  addToHistory: (elementsState: Record<string, FabricCanvasElement>) => void;
  undo: () => void;
  redo: () => void;
  
  // Batch operations for performance
  updateMultipleElements: (updates: Record<string, Partial<FabricCanvasElement>>) => void;
  
  // Double-click protection
  setPendingDoubleClick: (elementId: string | null) => void;
  clearPendingDoubleClick: () => void;
  
  // Fabric.js specific operations
  syncFabricObject: (elementId: string, fabricObject: fabric.Object) => void;
  removeFabricObject: (elementId: string) => void;
  getFabricObjectById: (elementId: string) => fabric.Object | null;
  
  // Utility functions for Fabric.js integration
  createFabricObject: (element: FabricCanvasElement) => fabric.Object | null;
  updateFabricObject: (elementId: string, updates: Partial<FabricCanvasElement>) => void;
}

export const useFabricCanvasStore = create<FabricCanvasState>()(
  immer((set, get) => ({
    // Initialize state
    elements: {},
    selectedElementIds: [],
    isEditingText: null,
    activeTool: 'select',
    isDragging: false,
    dragStartPos: null,
    dragStartElementPositions: null,
    history: [],
    historyIndex: -1,
    zoom: 1,
    pan: { x: 0, y: 0 },
    isDrawing: false,
    previewElement: null,
    showTextFormatting: false,
    textFormattingPosition: null,
    selectedTextElement: null,
    pendingDoubleClick: null,
    fabricCanvas: null,
    isCanvasReady: false,

    // Fabric.js canvas management
    setFabricCanvas: (canvas: fabric.Canvas | null) => {
      set((state) => {
        state.fabricCanvas = canvas;
      });
    },

    setCanvasReady: (ready: boolean) => {
      set((state) => {
        state.isCanvasReady = ready;
      });
    },

    // Element management
    addElement: (element: FabricCanvasElement) => {
      set((state) => {
        state.elements[element.id] = element;
        
        // Create and add Fabric.js object if canvas is ready
        const canvas = state.fabricCanvas;
        if (canvas && state.isCanvasReady) {
          const fabricObject = get().createFabricObject(element);
          if (fabricObject) {
            fabricObject.set('customId', element.id); // Store our custom ID
            canvas.add(fabricObject);
            state.elements[element.id].fabricObject = fabricObject;
            state.elements[element.id].fabricId = fabricObject.get('id') || element.id;
          }
        }
      });
    },

    updateElement: (id: string, updates: Partial<FabricCanvasElement>) => {
      set((state) => {
        if (state.elements[id]) {
          Object.assign(state.elements[id], updates);
          
          // Update corresponding Fabric.js object
          get().updateFabricObject(id, updates);
        }
      });
    },

    deleteElement: (id: string) => {
      set((state) => {
        if (state.elements[id]) {
          // Remove from Fabric.js canvas
          get().removeFabricObject(id);
          
          // Remove from state
          delete state.elements[id];
          state.selectedElementIds = state.selectedElementIds.filter(selectedId => selectedId !== id);
          
          if (state.isEditingText === id) {
            state.isEditingText = null;
          }
          if (state.selectedTextElement === id) {
            state.selectedTextElement = null;
            state.showTextFormatting = false;
          }
        }
      });
    },

    // Selection management
    selectElement: (id: string, addToSelection = false) => {
      set((state) => {
        if (addToSelection) {
          if (state.selectedElementIds.includes(id)) {
            state.selectedElementIds = state.selectedElementIds.filter(selectedId => selectedId !== id);
          } else {
            state.selectedElementIds = [...state.selectedElementIds, id];
          }
        } else {
          state.selectedElementIds = [id];
        }
        
        // Update Fabric.js selection
        const canvas = state.fabricCanvas;
        if (canvas) {
          const selectedObjects = state.selectedElementIds
            .map(elementId => get().getFabricObjectById(elementId))
            .filter(obj => obj !== null) as fabric.Object[];
          
          canvas.discardActiveObject();
          if (selectedObjects.length === 1) {
            canvas.setActiveObject(selectedObjects[0]);
          } else if (selectedObjects.length > 1) {
            const selection = new fabric.ActiveSelection(selectedObjects, { canvas });
            canvas.setActiveObject(selection);
          }
          canvas.renderAll();
        }
      });
    },

    selectMultipleElements: (ids: string[]) => {
      set((state) => {
        state.selectedElementIds = ids;
        
        // Update Fabric.js selection
        const canvas = state.fabricCanvas;
        if (canvas) {
          const selectedObjects = ids
            .map(elementId => get().getFabricObjectById(elementId))
            .filter(obj => obj !== null) as fabric.Object[];
          
          canvas.discardActiveObject();
          if (selectedObjects.length === 1) {
            canvas.setActiveObject(selectedObjects[0]);
          } else if (selectedObjects.length > 1) {
            const selection = new fabric.ActiveSelection(selectedObjects, { canvas });
            canvas.setActiveObject(selection);
          }
          canvas.renderAll();
        }
      });
    },

    clearSelection: () => {
      set((state) => {
        if (!state.pendingDoubleClick) {
          state.selectedElementIds = [];
          state.isEditingText = null;
        }
        state.selectedTextElement = null;
        state.showTextFormatting = false;
        
        // Clear Fabric.js selection
        const canvas = state.fabricCanvas;
        if (canvas) {
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      });
    },

    setSelectedElementIds: (ids: string[]) => {
      set((state) => {
        state.selectedElementIds = ids;
      });
    },

    // State management
    setIsEditingText: (id: string | null) => {
      set((state) => {
        state.isEditingText = id;
      });
    },

    setActiveTool: (tool: string) => {
      set((state) => {
        state.activeTool = tool;
      });
    },

    setDragState: (isDragging: boolean, dragStartPos: { x: number; y: number } | null, dragStartElementPositions: Record<string, { x: number; y: number }> | null) => {
      set((state) => {
        state.isDragging = isDragging;
        state.dragStartPos = dragStartPos;
        state.dragStartElementPositions = dragStartElementPositions;
      });
    },

    // Drawing state
    setIsDrawing: (isDrawing: boolean) => {
      set((state) => {
        state.isDrawing = isDrawing;
      });
    },

    setPreviewState: (isActive: boolean, element: FabricCanvasElement | null) => {
      set((state) => {
        state.isDrawing = isActive;
        state.previewElement = element;
      });
    },

    // Text formatting
    setTextFormattingState: (show: boolean) => {
      set((state) => {
        state.showTextFormatting = show;
      });
    },

    setTextSelectionState: (elementId: string | null, position: any, selectedElement: string | null) => {
      set((state) => {
        state.selectedTextElement = selectedElement;
        state.textFormattingPosition = position;
        if (selectedElement) {
          state.showTextFormatting = true;
        }
      });
    },

    // Viewport management
    setZoom: (zoom: number) => {
      set((state) => {
        state.zoom = zoom;
        
        // Update Fabric.js viewport
        const canvas = state.fabricCanvas;
        if (canvas) {
          canvas.setZoom(zoom);
          canvas.renderAll();
        }
      });
    },

    setPan: (pan: { x: number; y: number }) => {
      set((state) => {
        state.pan = pan;
        
        // Update Fabric.js viewport
        const canvas = state.fabricCanvas;
        if (canvas) {
          canvas.viewportTransform[4] = pan.x;
          canvas.viewportTransform[5] = pan.y;
          canvas.renderAll();
        }
      });
    },

    // History management
    addToHistory: (elementsState: Record<string, FabricCanvasElement>) => {
      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(Object.values(elementsState));
        state.history = newHistory;
        state.historyIndex = newHistory.length - 1;
      });
    },

    undo: () => {
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          const previousElementsArray = state.history[state.historyIndex];
          const newElementsState: Record<string, FabricCanvasElement> = {};
          previousElementsArray.forEach(el => newElementsState[el.id] = el);
          state.elements = newElementsState;
          
          // Recreate Fabric.js objects
          const canvas = state.fabricCanvas;
          if (canvas) {
            canvas.clear();
            Object.values(newElementsState).forEach(element => {
              const fabricObject = get().createFabricObject(element);
              if (fabricObject) {
                fabricObject.set('customId', element.id);
                canvas.add(fabricObject);
              }
            });
            canvas.renderAll();
          }
        } else if (state.historyIndex === 0) {
          state.historyIndex = -1;
          state.elements = {};
          
          // Clear Fabric.js canvas
          const canvas = state.fabricCanvas;
          if (canvas) {
            canvas.clear();
            canvas.renderAll();
          }
        }
      });
    },

    redo: () => {
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          const nextElementsArray = state.history[state.historyIndex];
          const newElementsState: Record<string, FabricCanvasElement> = {};
          nextElementsArray.forEach(el => newElementsState[el.id] = el);
          state.elements = newElementsState;
          
          // Recreate Fabric.js objects
          const canvas = state.fabricCanvas;
          if (canvas) {
            canvas.clear();
            Object.values(newElementsState).forEach(element => {
              const fabricObject = get().createFabricObject(element);
              if (fabricObject) {
                fabricObject.set('customId', element.id);
                canvas.add(fabricObject);
              }
            });
            canvas.renderAll();
          }
        }
      });
    },

    // Batch operations
    updateMultipleElements: (updates: Record<string, Partial<FabricCanvasElement>>) => {
      set((state) => {
        for (const id in updates) {
          if (state.elements[id]) {
            Object.assign(state.elements[id], updates[id]);
            get().updateFabricObject(id, updates[id]);
          }
        }
      });
    },

    // Double-click protection
    setPendingDoubleClick: (elementId: string | null) => {
      set((state) => {
        state.pendingDoubleClick = elementId;
      });
    },

    clearPendingDoubleClick: () => {
      set((state) => {
        state.pendingDoubleClick = null;
      });
    },

    // Fabric.js specific operations
    syncFabricObject: (elementId: string, fabricObject: fabric.Object) => {
      set((state) => {
        if (state.elements[elementId]) {
          state.elements[elementId].fabricObject = fabricObject;
          state.elements[elementId].fabricId = fabricObject.get('id') || elementId;
        }
      });
    },

    removeFabricObject: (elementId: string) => {
      const state = get();
      const element = state.elements[elementId];
      const canvas = state.fabricCanvas;
      
      if (element?.fabricObject && canvas) {
        canvas.remove(element.fabricObject);
        canvas.renderAll();
      }
    },

    getFabricObjectById: (elementId: string): fabric.Object | null => {
      const state = get();
      const element = state.elements[elementId];
      const canvas = state.fabricCanvas;
      
      if (element?.fabricObject) {
        return element.fabricObject;
      }
      
      // Fallback: search by customId
      if (canvas) {
        const objects = canvas.getObjects();
        return objects.find(obj => obj.get('customId') === elementId) || null;
      }
      
      return null;
    },

    // Utility functions for Fabric.js integration
    createFabricObject: (element: FabricCanvasElement): fabric.Object | null => {
      try {
        let fabricObject: fabric.Object | null = null;
        
        const commonProps = {
          left: element.x,
          top: element.y,
          fill: element.backgroundColor || element.color || '#000000',
          stroke: element.strokeColor || undefined,
          strokeWidth: element.strokeWidth || 0,
          selectable: true,
          moveable: true,
        };

        switch (element.type) {
          case 'rectangle':
          case 'square':
            fabricObject = new fabric.Rect({
              ...commonProps,
              width: element.width || 100,
              height: element.height || (element.type === 'square' ? element.width || 100 : 60),
            });
            break;

          case 'circle':
            fabricObject = new fabric.Circle({
              ...commonProps,
              radius: element.radius || element.width / 2 || 40,
            });
            break;

          case 'text':
          case 'sticky-note':
            fabricObject = new fabric.IText(element.content || 'Text', {
              ...commonProps,
              fontSize: element.fontSize === 'small' ? 12 : element.fontSize === 'large' ? 24 : 16,
              fontWeight: element.isBold ? 'bold' : 'normal',
              fontStyle: element.isItalic ? 'italic' : 'normal',
              textAlign: element.textAlignment || 'left',
              fill: element.color || '#000000',
              backgroundColor: element.type === 'sticky-note' ? '#FFFFE0' : element.backgroundColor,
            });
            break;

          case 'line':
            if (element.points && element.points.length >= 2) {
              const startPoint = element.points[0];
              const endPoint = element.points[element.points.length - 1];
              fabricObject = new fabric.Line([
                startPoint.x, startPoint.y,
                endPoint.x, endPoint.y
              ], {
                ...commonProps,
                stroke: element.strokeColor || element.color || '#000000',
                strokeWidth: element.strokeWidth || 2,
                fill: undefined,
              });
            }
            break;

          case 'drawing':
            if (element.points && element.points.length > 1) {
              const pathString = element.points.reduce((path, point, index) => {
                return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
              }, '');
              
              fabricObject = new fabric.Path(pathString, {
                ...commonProps,
                stroke: element.strokeColor || element.color || '#000000',
                strokeWidth: element.strokeWidth || 2,
                fill: undefined,
              });
            }
            break;

          case 'triangle':
            fabricObject = new fabric.Triangle({
              ...commonProps,
              width: element.width || 80,
              height: element.height || 80,
            });
            break;

          default:
            console.warn(`Fabric.js: Unsupported element type: ${element.type}`);
            return null;
        }

        if (fabricObject) {
          fabricObject.set('customId', element.id);
          fabricObject.set('selectable', !element.isLocked);
          fabricObject.set('moveable', !element.isLocked);
        }

        return fabricObject;
      } catch (error) {
        console.error('Failed to create Fabric.js object:', error);
        return null;
      }
    },

    updateFabricObject: (elementId: string, updates: Partial<FabricCanvasElement>) => {
      const state = get();
      const fabricObject = state.getFabricObjectById(elementId);
      const canvas = state.fabricCanvas;
      
      if (fabricObject && canvas) {
        // Update common properties
        if (updates.x !== undefined) fabricObject.set('left', updates.x);
        if (updates.y !== undefined) fabricObject.set('top', updates.y);
        if (updates.width !== undefined) fabricObject.set('width', updates.width);
        if (updates.height !== undefined) fabricObject.set('height', updates.height);
        if (updates.color !== undefined || updates.backgroundColor !== undefined) {
          fabricObject.set('fill', updates.backgroundColor || updates.color);
        }
        if (updates.strokeColor !== undefined) fabricObject.set('stroke', updates.strokeColor);
        if (updates.strokeWidth !== undefined) fabricObject.set('strokeWidth', updates.strokeWidth);
        if (updates.isLocked !== undefined) {
          fabricObject.set('selectable', !updates.isLocked);
          fabricObject.set('moveable', !updates.isLocked);
        }

        // Update text-specific properties
        if (fabricObject instanceof fabric.IText && updates.content !== undefined) {
          fabricObject.set('text', updates.content);
        }

        canvas.renderAll();
      }
    },
  }))
);
