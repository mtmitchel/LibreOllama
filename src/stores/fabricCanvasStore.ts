/**
 * Fabric.js Canvas Store - Production Ready
 * Centralized state management for Fabric.js-based canvas functionality
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Define tool types (migrated from canvasStore.ts)
export type CanvasTool = 
  | 'select' 
  | 'text' 
  | 'rectangle' 
  | 'circle' 
  | 'triangle' 
  | 'square' 
  | 'hexagon' 
  | 'star' 
  | 'line' 
  | 'arrow' 
  | 'pen' 
  | 'eraser' 
  | 'sticky-note'
  | 'image'
  | 'shapes';

// Define saved canvas interface (migrated from canvasStore.ts)
export interface SavedCanvas {
  id: string;
  name: string;
  elements: FabricCanvasElement[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

// Legacy CanvasElement interface for backward compatibility
export interface CanvasElement extends FabricCanvasElement {}

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
  fabricObject?: any; // Reference to the actual Fabric.js object (using any for now)
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
  isEditingText: string | boolean | null;
  activeTool: CanvasTool;
  
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
  fabricCanvas: any | null; // Using any for now
  isCanvasReady: boolean;
  
  // Actions
  setFabricCanvas: (canvas: any | null) => void;
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
  setIsEditingText: (id: string | boolean | null) => void;
  setActiveTool: (tool: CanvasTool) => void;
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
  addToHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Batch operations for performance
  updateMultipleElements: (updates: Record<string, Partial<FabricCanvasElement>>) => void;
  
  // Double-click protection
  setPendingDoubleClick: (elementId: string | null) => void;
  clearPendingDoubleClick: () => void;
  
  // Fabric.js specific operations
  syncFabricObject: (elementId: string, fabricObject: any) => void;
  removeFabricObject: (elementId: string) => void;
  getFabricObjectById: (elementId: string) => any | null;
  
  // Utility functions for Fabric.js integration
  createFabricObject: (element: FabricCanvasElement) => any | null;
  updateFabricObject: (elementId: string, updates: Partial<FabricCanvasElement>) => void;
  
  // Centralized rendering management
  requestRender: () => void;
  addObject: (obj: any) => void;
  updateObject: (obj: any, properties: Partial<any>) => void;
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
    setFabricCanvas: (canvas: any | null) => {
      set((state) => {
        state.fabricCanvas = canvas;
      });
    },

    setCanvasReady: (ready: boolean) => {
      set((state) => {
        state.isCanvasReady = ready;
      });
    },    // Element management
    addElement: (element: FabricCanvasElement) => {
      console.log('🔧 Adding element to store:', element.id, element.type);
      
      set((state) => {
        state.elements[element.id] = element;
      });
      
      // Create and add Fabric.js object if canvas is ready (outside of set to handle async properly)
      const state = get();
      const canvas = state.fabricCanvas;
      
      console.log('🔧 Canvas state check:', {
        hasCanvas: !!canvas,
        canvasReady: state.isCanvasReady,
        canvasObjects: canvas ? canvas.getObjects().length : 'N/A'
      });
      
      if (canvas && state.isCanvasReady) {
        console.log(`🔧 Creating Fabric.js object for ${element.type} element:`, element.id);
        
        // Handle the async creation
        state.createFabricObject(element).then((fabricObject: any) => {
          if (fabricObject && canvas) {
            console.log(`🔧 Fabric object created successfully:`, fabricObject.type);
            fabricObject.customId = element.id; // Store our custom ID
            
            // Use centralized addObject method
            get().addObject(fabricObject);
            
            console.log(`✅ Added ${element.type} to Fabric.js canvas:`, element.id, `Total objects: ${canvas.getObjects().length}`);
            
            // Update the element with fabric object reference
            set((state) => {
              if (state.elements[element.id]) {
                state.elements[element.id].fabricObject = fabricObject;
                state.elements[element.id].fabricId = fabricObject.id || element.id;
              }
            });
          } else {
            console.error(`❌ Failed to create Fabric.js object for ${element.type}:`, element.id);
          }
        }).catch((error: any) => {
          console.error('Failed to create and add Fabric.js object:', error);
        });
      } else {
        console.warn('Canvas not ready or not available for element creation:', {
          canvasReady: state.isCanvasReady,
          hasCanvas: !!canvas
        });
      }
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
            .filter(obj => obj !== null);
          
          canvas.discardActiveObject();
          if (selectedObjects.length === 1) {
            canvas.setActiveObject(selectedObjects[0]);
          } else if (selectedObjects.length > 1) {
            // Try to create selection if possible
            try {
              if (canvas.ActiveSelection) {
                const selection = new canvas.ActiveSelection(selectedObjects, { canvas });
                canvas.setActiveObject(selection);
              }
            } catch (e) {
              // Fallback: just select first object
              if (selectedObjects[0]) {
                canvas.setActiveObject(selectedObjects[0]);
              }
            }
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
            .filter(obj => obj !== null);
          
          canvas.discardActiveObject();
          if (selectedObjects.length === 1) {
            canvas.setActiveObject(selectedObjects[0]);
          } else if (selectedObjects.length > 1) {
            try {
              if (canvas.ActiveSelection) {
                const selection = new canvas.ActiveSelection(selectedObjects, { canvas });
                canvas.setActiveObject(selection);
              }
            } catch (e) {
              if (selectedObjects[0]) {
                canvas.setActiveObject(selectedObjects[0]);
              }
            }
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
          get().requestRender(); // Use centralized rendering
        }
      });
    },

    setSelectedElementIds: (ids: string[]) => {
      set((state) => {
        state.selectedElementIds = ids;
      });
    },

    // State management
    setIsEditingText: (id: string | boolean | null) => {
      set((state) => {
        state.isEditingText = id;
      });
    },

    setActiveTool: (tool: CanvasTool) => {
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

    setTextSelectionState: (_elementId: string | null, position: any, selectedElement: string | null) => {
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
          get().requestRender(); // Use centralized rendering
        }
      });
    },

    setPan: (pan: { x: number; y: number }) => {
      set((state) => {
        state.pan = pan;
        
        // Update Fabric.js viewport
        const canvas = state.fabricCanvas;
        if (canvas && canvas.viewportTransform) {
          canvas.viewportTransform[4] = pan.x;
          canvas.viewportTransform[5] = pan.y;
          get().requestRender(); // Use centralized rendering
        }
      });
    },

    // History management
    addToHistory: () => {
      set((state) => {
        const currentElements = Object.values(state.elements);
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push([...currentElements]);
        state.history = newHistory;
        state.historyIndex = newHistory.length - 1;
      });
    },    undo: () => {
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
            // Process elements asynchronously
            Promise.all(
              Object.values(newElementsState).map(element => 
                get().createFabricObject(element)
              )
            ).then((fabricObjects) => {
              fabricObjects.forEach((fabricObject, index) => {
                if (fabricObject && canvas) {
                  const element = Object.values(newElementsState)[index];
                  fabricObject.customId = element.id;
                  canvas.add(fabricObject);
                }
              });
              get().requestRender(); // Use centralized rendering for better performance
            }).catch(error => {
              console.error('Error recreating fabric objects during undo:', error);
            });
          }
        } else if (state.historyIndex === 0) {
          state.historyIndex = -1;
          state.elements = {};
          
          // Clear Fabric.js canvas
          const canvas = state.fabricCanvas;
          if (canvas) {
            canvas.clear();
            get().requestRender(); // Use centralized rendering
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
            // Process elements asynchronously
            Promise.all(
              Object.values(newElementsState).map(element => 
                get().createFabricObject(element)
              )
            ).then((fabricObjects) => {
              fabricObjects.forEach((fabricObject, index) => {
                if (fabricObject && canvas) {
                  const element = Object.values(newElementsState)[index];
                  fabricObject.customId = element.id;
                  canvas.add(fabricObject);
                }
              });
              get().requestRender(); // Use centralized rendering for better performance
            }).catch(error => {
              console.error('Error recreating fabric objects during redo:', error);
            });
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
    syncFabricObject: (elementId: string, fabricObject: any) => {
      set((state) => {
        if (state.elements[elementId]) {
          state.elements[elementId].fabricObject = fabricObject;
          state.elements[elementId].fabricId = fabricObject.id || elementId;
        }
      });
    },

    removeFabricObject: (elementId: string) => {
      const state = get();
      const element = state.elements[elementId];
      const canvas = state.fabricCanvas;
      
      if (element?.fabricObject && canvas) {
        canvas.remove(element.fabricObject);
        get().requestRender(); // Use centralized rendering
      }
    },    getFabricObjectById: (elementId: string): any | null => {
      const state = get();
      const element = state.elements[elementId];
      const canvas = state.fabricCanvas;
      
      if (element?.fabricObject) {
        return element.fabricObject;
      }
      
      // Fallback: search by customId
      if (canvas && canvas.getObjects) {
        const objects = canvas.getObjects();
        return objects.find((obj: any) => obj.customId === elementId) || null;
      }
      
      return null;
    },// Utility functions for Fabric.js integration
    createFabricObject: async (element: FabricCanvasElement): Promise<any | null> => {
      try {
        const fabricModule = await import('fabric');
        const { Rect, Circle, IText, Line, Path, Triangle } = fabricModule;
        
        let fabricObject: any = null;
        
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
            fabricObject = new Rect({
              ...commonProps,
              width: element.width || 100,
              height: element.height || (element.type === 'square' ? element.width || 100 : 60),
            });
            break;

          case 'circle':
            fabricObject = new Circle({
              ...commonProps,
              radius: element.radius || (element.width || 80) / 2,
            });
            break;

          case 'text':
          case 'sticky-note':
            fabricObject = new IText(element.content || 'Text', {
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
              fabricObject = new Line([
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
              
              fabricObject = new Path(pathString, {
                ...commonProps,
                stroke: element.strokeColor || element.color || '#000000',
                strokeWidth: element.strokeWidth || 2,
                fill: undefined,
              });
            }
            break;

          case 'triangle':
            fabricObject = new Triangle({
              ...commonProps,
              width: element.width || 80,
              height: element.height || 80,
            });
            break;

          case 'star':
            // Create a star using Polygon
            const numPoints = 5;
            const outerRadius = (element.width || 80) / 2;
            const innerRadius = outerRadius / 2;
            const center = { x: 0, y: 0 };
            const angle = Math.PI / numPoints;
            const starPoints = [];

            for (let i = 0; i < numPoints * 2; i++) {
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const x = center.x + radius * Math.sin(i * angle);
              const y = center.y - radius * Math.cos(i * angle);
              starPoints.push({ x, y });
            }

            fabricObject = new fabricModule.Polygon(starPoints, {
              ...commonProps,
              width: element.width || 80,
              height: element.height || 80,
            });
            break;

          case 'hexagon':
            // Create a hexagon using Polygon
            const hexRadius = (element.width || 80) / 2;
            const hexPoints = [];
            for (let i = 0; i < 6; i++) {
              const x = hexRadius * Math.cos((i * 2 * Math.PI) / 6);
              const y = hexRadius * Math.sin((i * 2 * Math.PI) / 6);
              hexPoints.push({ x, y });
            }

            fabricObject = new fabricModule.Polygon(hexPoints, {
              ...commonProps,
              width: element.width || 80,
              height: element.height || 80,
            });
            break;

          case 'arrow':
            // Create an arrow shape using Path
            const arrowWidth = element.width || 100;
            const arrowHeight = element.height || 40;
            const headSize = arrowHeight * 0.7;
            const shaftHeight = arrowHeight * 0.4;
            const shaftY = (arrowHeight - shaftHeight) / 2;

            const arrowPath = `
              M 0 ${shaftY}
              L ${arrowWidth - headSize} ${shaftY}
              L ${arrowWidth - headSize} 0
              L ${arrowWidth} ${arrowHeight / 2}
              L ${arrowWidth - headSize} ${arrowHeight}
              L ${arrowWidth - headSize} ${shaftY + shaftHeight}
              L 0 ${shaftY + shaftHeight}
              Z
            `;

            fabricObject = new Path(arrowPath, {
              ...commonProps,
              width: arrowWidth,
              height: arrowHeight,
            });
            break;

          default:
            console.warn(`Fabric.js: Unsupported element type: ${element.type}`);
            return null;
        }

        if (fabricObject) {
          fabricObject.customId = element.id;
          fabricObject.selectable = !element.isLocked;
          fabricObject.moveable = !element.isLocked;
        }

        return fabricObject;
      } catch (error) {
        console.error('Failed to create Fabric.js object:', error);
        return null;
      }
    },    updateFabricObject: (elementId: string, updates: Partial<FabricCanvasElement>) => {
      const state = get();
      const fabricObject = get().getFabricObjectById(elementId);
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
        if (fabricObject.type === 'i-text' && updates.content !== undefined) {
          fabricObject.set('text', updates.content);
        }

        // CRITICAL: Update coordinates after any property changes to prevent desynchronization
        fabricObject.setCoords();
        
        // Use optimized render method for better performance
        canvas.requestRenderAll();
      }
    },

    // Centralized rendering management for optimal performance
    requestRender: () => {
      const { fabricCanvas } = get();
      if (fabricCanvas) {
        fabricCanvas.requestRenderAll();
      }
    },

    // Centralized object addition with automatic rendering
    addObject: (obj: any) => {
      const { fabricCanvas, requestRender } = get();
      if (fabricCanvas) {
        fabricCanvas.add(obj);
        requestRender(); // Use optimized render request
      }
    },

    // Centralized object updates with coordinate synchronization
    updateObject: (obj: any, properties: Partial<any>) => {
      const { requestRender } = get();
      obj.set(properties);
      obj.setCoords(); // IMPORTANT: Update coordinates on change
      requestRender();
    },
  }))
);
