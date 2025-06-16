/**
 * Fabric.js Canvas Store - Production Ready
 * Centralized state management for Fabric.js-based canvas functionality
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as fabric from 'fabric';

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
  fabricObject?: any; // Reference to the actual Fabric.js object
  fabricId?: string; // Fabric object's internal ID
  
  // Extended properties for different element types
  strokeColor?: string;
  strokeWidth?: number;
  radius?: number; // For circles
  points?: { x: number; y: number }[]; // For lines and drawings
  src?: string; // For images
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
  fabricCanvas: any | null; // The Fabric.js Canvas instance
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

// Utility functions
const validateCanvas = (canvas: any): boolean => {
  return canvas && !canvas.isDisposed && canvas.getElement && typeof canvas.getElement === 'function';
};

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
        const prevCanvas = state.fabricCanvas;
        state.fabricCanvas = canvas;
        
        // If we're setting a new canvas and we have existing elements, restore them
        if (canvas && prevCanvas !== canvas && Object.keys(state.elements).length > 0) {
          console.log('🔄 New canvas detected with existing elements - scheduling restoration');
          
          // Use setTimeout to avoid immediate recreation during store update
          setTimeout(() => {
            const currentState = get();
            const elements = currentState.elements;
            
            // Check if canvas is still empty and we have elements to restore
            if (canvas.getObjects().length === 0 && Object.keys(elements).length > 0) {
              console.log('🔄 Restoring elements to new canvas:', Object.keys(elements));
              
              Object.values(elements).forEach(element => {
                // Clear any existing fabric object references since canvas is new
                element.fabricObject = undefined;
                element.fabricId = undefined;
                
                // Create new Fabric object for this element
                currentState.createFabricObject(element).then(fabricObject => {
                  if (fabricObject && canvas && !canvas.isDisposed) {
                    fabricObject.customId = element.id;
                    canvas.add(fabricObject);
                    
                    // Update element with new fabric object reference
                    set((state) => {
                      if (state.elements[element.id]) {
                        state.elements[element.id].fabricObject = fabricObject;
                        state.elements[element.id].fabricId = fabricObject.id || element.id;
                      }
                    });
                  }
                });
              });
              
              // Render all at once after all elements are added
              setTimeout(() => {
                if (canvas && !canvas.isDisposed) {
                  canvas.renderAll();
                  console.log('✅ Canvas restoration complete');
                }
              }, 200);
            }
          }, 100);
        }
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
      
      // Create and add Fabric.js object if canvas is ready
      const state = get();
      const canvas = state.fabricCanvas;
      
      console.log('🔧 Canvas state check:', {
        hasCanvas: !!canvas,
        canvasReady: state.isCanvasReady,
        canvasObjects: canvas ? canvas.getObjects().length : 'N/A'
      });
      
      if (canvas && state.isCanvasReady && validateCanvas(canvas)) {
        console.log(`🔧 Creating Fabric.js object for ${element.type} element:`, element.id);
        
        // Create mount tracking for the async operation
        let isMounted = true;
        
        // Create the Fabric object asynchronously with mount checks
        (async () => {
          try {
            // Check if still mounted before creating object
            if (!isMounted) return;
            
            const currentStoreState = get(); // Get a fresh state proxy for this operation
            const fabricObject = await currentStoreState.createFabricObject(element);
            
            // Check if still mounted and canvas is still valid before adding
            if (isMounted && validateCanvas(canvas) && fabricObject && currentStoreState.isCanvasReady) {
              console.log(`🔧 Fabric object created successfully:`, fabricObject.type);
              fabricObject.customId = element.id; // Store our custom ID
              
              // Add to canvas
              canvas.add(fabricObject);
              canvas.renderAll();
              
              console.log(`✅ Added ${element.type} to Fabric.js canvas:`, element.id, `Total objects: ${canvas.getObjects().length}`);
              
              // Update the element with fabric object reference only if still mounted
              if (isMounted) {
                set((state) => {
                  if (state.elements[element.id]) {
                    state.elements[element.id].fabricObject = fabricObject;
                    state.elements[element.id].fabricId = fabricObject.id || element.id;
                  }
                });
                
                // Set as active object if it's the only selected element
                const freshState = get();
                if (freshState.selectedElementIds.length === 1 && freshState.selectedElementIds[0] === element.id) {
                  canvas.setActiveObject(fabricObject);
                  canvas.renderAll();
                }
              }
            } else {
              if (!isMounted) {
                console.log(`🔧 Component unmounted during object creation for ${element.type}:`, element.id);
              } else {
                console.error(`❌ Failed to create Fabric.js object for ${element.type}:`, element.id);
              }
            }
          } catch (error) {
            if (isMounted) {
              console.error('Failed to create and add Fabric.js object:', error);
            }
          }
        })();
        
        // Return cleanup function to mark as unmounted
        return () => { 
          isMounted = false;
        };
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
          
          // Recreate Fabric.js objects with cleanup guards
          const canvas = state.fabricCanvas;
          if (canvas) {
            canvas.clear();
            
            // Create AbortController for cleanup management
            const controller = new AbortController();
            
            // Process elements asynchronously with abort signal
            Promise.all(
              Object.values(newElementsState).map(element => {
                // Check if operation was aborted before processing
                if (controller.signal.aborted) {
                  return Promise.resolve(null);
                }
                return useFabricCanvasStore.getState().createFabricObject(element);
              })
            ).then((fabricObjects) => {
              // Check if operation was aborted before applying results
              if (!controller.signal.aborted && canvas && !canvas.isDisposed) {
                fabricObjects.forEach((fabricObject, index) => {
                  if (fabricObject && canvas && !controller.signal.aborted) {
                    const element = Object.values(newElementsState)[index];
                    fabricObject.customId = element.id;
                    canvas.add(fabricObject);
                  }
                });
                get().requestRender(); // Use centralized rendering for better performance
              }
            }).catch(error => {
              if (!controller.signal.aborted) {
                console.error('Error recreating fabric objects during undo:', error);
              }
            });
            
            // Cleanup function to abort operations if component unmounts
            return () => controller.abort();
          }
        } else if (state.historyIndex === 0) {
          state.historyIndex = -1;
          state.elements = {};
          
          // Clear Fabric.js canvas
          const canvas = state.fabricCanvas;
          if (canvas && !canvas.isDisposed) {
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
          
          // Recreate Fabric.js objects with cleanup guards
          const canvas = state.fabricCanvas;
          if (canvas) {
            canvas.clear();
            
            // Create AbortController for cleanup management
            const controller = new AbortController();
            
            // Process elements asynchronously with abort signal
            Promise.all(
              Object.values(newElementsState).map(element => {
                // Check if operation was aborted before processing
                if (controller.signal.aborted) {
                  return Promise.resolve(null);
                }
                return useFabricCanvasStore.getState().createFabricObject(element);
              })
            ).then((fabricObjects) => {
              // Check if operation was aborted before applying results
              if (!controller.signal.aborted && canvas && !canvas.isDisposed) {
                fabricObjects.forEach((fabricObject, index) => {
                  if (fabricObject && canvas && !controller.signal.aborted) {
                    const element = Object.values(newElementsState)[index];
                    fabricObject.customId = element.id;
                    canvas.add(fabricObject);
                  }
                });
                get().requestRender(); // Use centralized rendering for better performance
              }
            }).catch(error => {
              if (!controller.signal.aborted) {
                console.error('Error recreating fabric objects during redo:', error);
              }
            });
            
            // Cleanup function to abort operations if component unmounts
            return () => controller.abort();
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
    },
    createFabricObject: async (element: FabricCanvasElement): Promise<any | null> => {
      try {
        const plainElement = { ...element };

        let fabricObject: any = null;

        const commonProps: any = {
          left: plainElement.x,
          top: plainElement.y,
          fill: plainElement.backgroundColor || plainElement.color || '#000000',
          stroke: plainElement.strokeColor || undefined,
          strokeWidth: plainElement.strokeWidth || 0,
          selectable: true,
          moveable: true,
          angle: plainElement.angle || 0,
          opacity: plainElement.opacity === undefined ? 1 : plainElement.opacity,
        };

        switch (plainElement.type) {
          case 'rectangle':
          case 'square':
            fabricObject = new fabric.Rect({
              ...commonProps,
              width: plainElement.width || 100,
              height: plainElement.height || (plainElement.type === 'square' ? plainElement.width || 100 : 60),
            });
            break;

          case 'circle':
            fabricObject = new fabric.Circle({
              ...commonProps,
              radius: plainElement.radius || (plainElement.width || 80) / 2,
            });
            break;

          case 'text':
          case 'sticky-note':
            // Ensure text color is always visible - prioritize explicit hex colors
            const textColor = (() => {
              if (plainElement.color && plainElement.color.startsWith('#')) {
                return plainElement.color;
              }
              // Force black text for visibility in all themes
              return '#000000';
            })();
            
            fabricObject = new fabric.IText(plainElement.content || 'Text', {
              ...commonProps,
              fontSize: plainElement.fontSize === 'small' ? 14 : plainElement.fontSize === 'large' ? 24 : 18,
              fontWeight: plainElement.isBold ? 'bold' : 'normal',
              fontStyle: plainElement.isItalic ? 'italic' : 'normal',
              textAlign: plainElement.textAlignment || 'left',
              fill: textColor,
              backgroundColor: plainElement.type === 'sticky-note' ? '#FFFFE0' : plainElement.backgroundColor,
              width: plainElement.width, 
              height: plainElement.height, 
            });
            break;

          case 'line':
            if (plainElement.points && plainElement.points.length >= 2) {
              const startPoint = plainElement.points[0];
              const endPoint = plainElement.points[plainElement.points.length - 1];
              fabricObject = new fabric.Line([
                startPoint.x, startPoint.y,
                endPoint.x, endPoint.y
              ], {
                ...commonProps,
                stroke: plainElement.strokeColor || plainElement.color || '#000000',
                strokeWidth: plainElement.strokeWidth || 2,
                fill: undefined, 
              });
            }
            break;

          case 'drawing':
            if (plainElement.points && plainElement.points.length > 1) {
              const pathString = plainElement.points.reduce((path, point, index) => {
                return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
              }, '');

              fabricObject = new fabric.Path(pathString, {
                ...commonProps,
                stroke: plainElement.strokeColor || plainElement.color || '#000000',
                strokeWidth: plainElement.strokeWidth || 2,
                fill: undefined, 
              });
            }
            break;

          case 'triangle':
            fabricObject = new fabric.Triangle({
              ...commonProps,
              width: plainElement.width || 80,
              height: plainElement.height || 80,
            });
            break;

          case 'star':
            const numPoints = 5;
            const outerRadius = (plainElement.width || 80) / 2;
            const innerRadius = outerRadius / 2;
            const starPoints: {x: number, y: number}[] = [];
            for (let i = 0; i < numPoints * 2; i++) {
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const angle = (i * Math.PI) / numPoints - Math.PI / 2; 
              starPoints.push({
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
              });
            }
            fabricObject = new fabric.Polygon(starPoints, {
              ...commonProps,
            });
            fabricObject.set({ left: plainElement.x + outerRadius, top: plainElement.y + outerRadius });
            break;

          case 'hexagon':
            const hexRadius = (plainElement.width || 80) / 2;
            const hexPoints: {x: number, y: number}[] = [];
            for (let i = 0; i < 6; i++) {
              hexPoints.push({
                x: hexRadius * Math.cos((i * Math.PI) / 3),
                y: hexRadius * Math.sin((i * Math.PI) / 3),
              });
            }
            fabricObject = new fabric.Polygon(hexPoints, {
              ...commonProps,
            });
            fabricObject.set({ left: plainElement.x + hexRadius, top: plainElement.y + hexRadius });
            break;

          case 'arrow':
            const arrowWidth = plainElement.width || 100;
            const arrowHeight = plainElement.height || 40; 
            const headLength = Math.min(arrowHeight * 0.5, arrowWidth * 0.3); 
            const shaftWidth = arrowHeight * 0.4; 

            const arrowPath = [
                `M 0 ${ (arrowHeight - shaftWidth) / 2}`,
                `L ${arrowWidth - headLength} ${(arrowHeight - shaftWidth) / 2}`,
                `L ${arrowWidth - headLength} 0`,
                `L ${arrowWidth} ${arrowHeight / 2}`,
                `L ${arrowWidth - headLength} ${arrowHeight}`,
                `L ${arrowWidth - headLength} ${(arrowHeight + shaftWidth) / 2}`,
                `L 0 ${(arrowHeight + shaftWidth) / 2}`,
                `Z`
            ].join(' ');

            fabricObject = new fabric.Path(arrowPath, {
              ...commonProps,
            });
            break;

          case 'image':
            if (plainElement.src) {
              const img = await fabric.Image.fromURL(plainElement.src);
              img.set({
                ...commonProps,
                left: plainElement.x, 
                top: plainElement.y,
              });

              if (plainElement.width && plainElement.height) {
                const scaleX = plainElement.width / (img.width || 1);
                const scaleY = plainElement.height / (img.height || 1);
                img.scaleX = scaleX;
                img.scaleY = scaleY;
              }
              fabricObject = img;
            }
            break;

          default:
            console.warn(`Fabric.js: Unsupported element type: ${plainElement.type}`);
            return null;
        }

        if (fabricObject) {
          fabricObject.customId = plainElement.id;
          fabricObject.selectable = !plainElement.isLocked;
          fabricObject.moveable = !plainElement.isLocked;
          Object.keys(plainElement).forEach(key => {
            if (!(key in commonProps) && key !== 'type' && key !== 'id' && fabricObject.get(key) !== undefined && plainElement[key] !== undefined) {
              try {
                fabricObject.set(key, plainElement[key]);
              } catch (e) { /* ignore */ }
            }
          });
        }

        return fabricObject;
      } catch (error) {
        console.error(`Failed to create Fabric.js object for element type ${element?.type} (ID: ${element?.id}):`, error);
        return null;
      }
    },
    updateFabricObject: (elementId: string, updates: Partial<FabricCanvasElement>) => {
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

        // Mark the object as dirty to ensure its cache is regenerated
        fabricObject.dirty = true;

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
