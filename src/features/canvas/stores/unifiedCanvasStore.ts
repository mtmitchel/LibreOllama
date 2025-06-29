/**
 * Unified Canvas Store - Production Ready with Immer Fix
 * 
 * CRITICAL FIX: Proper Immer Map handling to prevent position sync issues
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { nanoid } from 'nanoid';
import { logger } from '../../../lib/logger';
import {
  CanvasElement,
  ElementId,
  SectionId,
  ElementOrSectionId,
  GroupId,
  TextElement,
  RectangleElement,
  CircleElement,
  SectionElement,
} from '../types/enhanced.types';

enableMapSet();

// Simplified history entry
interface HistoryEntry {
  id: string;
  timestamp: number;
  operation: string;
  elementsSnapshot: Map<string, CanvasElement>;
  selectionSnapshot: Set<ElementId>;
}

// Core state interface
export interface UnifiedCanvasState {
  // Element management
  elements: Map<string, CanvasElement>;
  elementOrder: string[];
  
  // Selection
  selectedElementIds: Set<ElementId>;
  lastSelectedElementId: ElementId | null;
  
  // Viewport
  viewport: {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  };
  
  // Drawing
  isDrawing: boolean;
  currentPath?: number[];
  drawingTool: 'pen' | 'pencil' | null;
  drawingStartPoint: { x: number; y: number } | null;
  
  // Draft section for live preview
  draftSection: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  
  // UI state
  selectedTool: string;
  textEditingElementId: ElementId | null;
  selectedStickyNoteColor: string;
  showGrid: boolean;
  snapToGrid: boolean;
  
  // History
  history: HistoryEntry[];
  currentHistoryIndex: number;
  maxHistorySize: number;
  
  // Computed history properties for API compatibility
  canUndo: boolean;
  canRedo: boolean;
  
  // Sections
  sections: Map<SectionId, SectionElement>;
  sectionElementMap: Map<SectionId, Set<ElementId>>;
  
  // Upload state
  isUploading: boolean;
  
  // Additional properties for compatibility
  drawingCurrentPoint: { x: number; y: number } | null;
  viewportBounds: { left: number; top: number; right: number; bottom: number } | null;
}

export interface UnifiedCanvasActions {
  // Element operations
  createElement: (type: string, position: { x: number; y: number }) => void;
  updateElement: (id: ElementOrSectionId, updates: Partial<CanvasElement>) => void;
  updateMultipleElements: (updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }>) => void;
  deleteElement: (id: ElementOrSectionId) => void;
  deleteSelectedElements: () => void;
  getElementById: (id: ElementOrSectionId) => CanvasElement | undefined;
  
  // Selection
  selectElement: (id: ElementId, multiSelect?: boolean) => void;
  deselectElement: (id: ElementId) => void;
  clearSelection: () => void;
  getSelectedElements: () => CanvasElement[];
  
  // Viewport
  setViewport: (viewport: Partial<UnifiedCanvasState['viewport']>) => void;
  panViewport: (deltaX: number, deltaY: number) => void;
  zoomViewport: (scale: number, centerX?: number, centerY?: number) => void;
  
  // Drawing
  startDrawing: (tool: 'pen' | 'pencil', point: { x: number; y: number }) => void;
  updateDrawing: (point: { x: number; y: number }) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  
  // Draft sections
  startDraftSection: (point: { x: number; y: number }) => void;
  updateDraftSection: (point: { x: number; y: number }) => void;
  commitDraftSection: () => SectionId | null;
  cancelDraftSection: () => void;
  
  // UI
  setSelectedTool: (tool: string) => void;
  setTextEditingElement: (id: ElementId | null) => void;
  setSelectedStickyNoteColor: (color: string) => void;
  
  // API Compatibility Layer  
  setStickyNoteColor: (color: string) => void;
  updateHistoryFlags: () => void;
  
  // History
  addToHistory: (operation: string) => void;
  undo: () => void;
  redo: () => void;
  
  // Sections
  createSection: (x: number, y: number, width: number, height: number) => SectionId;
  updateSection: (id: SectionId, updates: Partial<SectionElement>) => void;
  captureElementsAfterSectionCreation: (sectionId: SectionId) => void;
  
  // Legacy compatibility
  addElement: (element: CanvasElement) => void;
  updateTableCell: (tableId: ElementId, row: number, col: number, value: string) => void;
  clearAllElements: () => void;
  exportElements: () => void;
  importElements: (elements: CanvasElement[]) => void;
  handleElementDrop: (elementId: ElementId, targetId?: ElementId) => void;
  updateElementCoordinatesOnSectionMove: (sectionId: SectionId, deltaX: number, deltaY: number) => void;
  createTestElements: () => void;
  
  // Additional legacy methods
  pan: (deltaX: number, deltaY: number) => void;
  zoom: (scale: number, centerX?: number, centerY?: number) => void;
  
  // More missing methods
  findSectionAtPoint: (point: { x: number; y: number }) => SectionId | null;
  addElementToSection: (elementId: ElementId, sectionId: SectionId) => void;
  groupElements: (elementIds: ElementId[]) => GroupId;
  ungroupElements: (groupId: GroupId) => void;
  isElementInGroup: (elementId: ElementId) => boolean;
  toggleLayersPanel: () => void;
  currentIndex: number;
  addHistoryEntry: (operation: string, metadata?: any) => void;
  clearHistory: () => void;
  getHistoryLength: () => number;
  
  // Utilities
  findNearestSnapPoint: (pointer: { x: number; y: number }, snapRadius?: number) => any;
  uploadImage: (file: File, position: { x: number; y: number }) => Promise<void>;
}

export type UnifiedCanvasStore = UnifiedCanvasState & UnifiedCanvasActions;

export const useUnifiedCanvasStore = create<UnifiedCanvasStore>()(
  subscribeWithSelector(
    immer((set, get) => {
      
      const createHistorySnapshot = (): Pick<HistoryEntry, 'elementsSnapshot' | 'selectionSnapshot'> => {
        const state = get();
        return {
          elementsSnapshot: new Map(state.elements),
          selectionSnapshot: new Set(state.selectedElementIds)
        };
      };

      return {
        // Initial state
        elements: new Map(),
        elementOrder: [],
        selectedElementIds: new Set(),
        lastSelectedElementId: null,
        
        viewport: {
          x: 0,
          y: 0,
          scale: 1,
          width: 1920,
          height: 1080
        },
        
        isDrawing: false,
        currentPath: undefined,
        drawingTool: null,
        drawingStartPoint: null,
        
        draftSection: null,
        
        selectedTool: 'select',
        textEditingElementId: null,
        selectedStickyNoteColor: '#ffeb3b',
        showGrid: true,
        snapToGrid: false,
        
        history: [],
        currentHistoryIndex: -1,
        maxHistorySize: 50,
        
        // Computed history properties for API compatibility
        canUndo: false,
        canRedo: false,
        
        sections: new Map(),
        sectionElementMap: new Map(),
        
        isUploading: false,
        drawingCurrentPoint: null,
        viewportBounds: null,

        // CRITICAL FIX: Proper Immer Map handling
        updateElement: (id: ElementOrSectionId, updates: Partial<CanvasElement>) => {
          set((draft) => {
            const element = draft.elements.get(id);
            if (!element) {
              logger.warn(`[Store] Element ${id} not found for update`);
              return;
            }

            // Validate numeric updates
            const validUpdates = { ...updates };
            
            if ('x' in validUpdates && (typeof validUpdates.x !== 'number' || !Number.isFinite(validUpdates.x))) {
              delete validUpdates.x;
            }
            if ('y' in validUpdates && (typeof validUpdates.y !== 'number' || !Number.isFinite(validUpdates.y))) {
              delete validUpdates.y;
            }
            if ('width' in validUpdates && (typeof validUpdates.width !== 'number' || !Number.isFinite(validUpdates.width) || validUpdates.width <= 0)) {
              delete validUpdates.width;
            }
            if ('height' in validUpdates && (typeof validUpdates.height !== 'number' || !Number.isFinite(validUpdates.height) || validUpdates.height <= 0)) {
              delete validUpdates.height;
            }

            // CRITICAL: Create new object and use draft.elements.set() for Immer tracking
            const updatedElement = { 
              ...element, 
              ...validUpdates, 
              updatedAt: Date.now() 
            };
            
            // Use draft Map.set() method to ensure Immer tracks the change
            draft.elements.set(id, updatedElement);
            
            console.log(`🔄 [Store] Updated ${id}:`, validUpdates);
            logger.debug(`[Store] Updated element ${id}`, validUpdates);
          });
        },

        // NEW: Batch updates for TransformerManager
        updateMultipleElements: (updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }>) => {
          set((draft) => {
            updates.forEach(({ id, updates: elementUpdates }) => {
              const element = draft.elements.get(id);
              if (element) {
                // Validate updates
                const validUpdates = { ...elementUpdates };
                
                Object.keys(validUpdates).forEach(key => {
                  const value = (validUpdates as any)[key];
                  if (['x', 'y', 'width', 'height', 'radius'].includes(key)) {
                    if (typeof value !== 'number' || !Number.isFinite(value)) {
                      delete (validUpdates as any)[key];
                    }
                    if (['width', 'height', 'radius'].includes(key) && value <= 0) {
                      delete (validUpdates as any)[key];
                    }
                  }
                });

                const updatedElement = { 
                  ...element, 
                  ...validUpdates, 
                  updatedAt: Date.now() 
                };
                
                // Use draft Map.set() for proper Immer tracking
                draft.elements.set(id, updatedElement);
              }
            });
            
            logger.debug(`[Store] Batch updated ${updates.length} elements`);
          });
        },

        createElement: (type: string, position: { x: number; y: number }) => {
          set((draft) => {
            const now = Date.now();
            const id = `${type}-${now}` as ElementId;
            let element: CanvasElement;

            switch (type) {
              case 'text':
                element = {
                  id,
                  type: 'text',
                  x: position.x,
                  y: position.y,
                  text: 'Type here...',
                  fontSize: 16,
                  fontFamily: 'Arial',
                  fill: '#333333',
                  width: 200,
                  height: 30,
                  createdAt: now,
                  updatedAt: now
                } as TextElement;
                break;

              case 'sticky-note':
                element = {
                  id,
                  type: 'sticky-note',
                  x: position.x,
                  y: position.y,
                  text: 'Note...',
                  backgroundColor: draft.selectedStickyNoteColor,
                  textColor: '#333333',
                  borderColor: draft.selectedStickyNoteColor,
                  width: 150,
                  height: 150,
                  fontSize: 14,
                  fontFamily: 'Arial',
                  createdAt: now,
                  updatedAt: now
                } as any;
                break;

              case 'rectangle':
                element = {
                  id,
                  type: 'rectangle',
                  x: position.x,
                  y: position.y,
                  width: 100,
                  height: 80,
                  fill: '#4CAF50',
                  stroke: '#333333',
                  strokeWidth: 2,
                  cornerRadius: 4,
                  createdAt: now,
                  updatedAt: now
                } as RectangleElement;
                break;

              case 'circle':
                element = {
                  id,
                  type: 'circle',
                  x: position.x,
                  y: position.y,
                  radius: 50,
                  fill: '#2196F3',
                  stroke: '#333333',
                  strokeWidth: 2,
                  createdAt: now,
                  updatedAt: now
                } as CircleElement;
                break;

              case 'triangle':
                element = {
                  id,
                  type: 'triangle',
                  x: position.x,
                  y: position.y,
                  width: 100,
                  height: 80,
                  fill: '#FF9800',
                  stroke: '#333333',
                  strokeWidth: 2,
                  createdAt: now,
                  updatedAt: now
                } as any;
                break;

              case 'star':
                element = {
                  id,
                  type: 'star',
                  x: position.x,
                  y: position.y,
                  radius: 50,
                  sides: 5,
                  innerRadius: 25,
                  outerRadius: 50,
                  fill: '#9C27B0',
                  stroke: '#333333',
                  strokeWidth: 2,
                  createdAt: now,
                  updatedAt: now
                } as any;
                break;

              case 'table':
                element = {
                  id,
                  type: 'table',
                  x: position.x,
                  y: position.y,
                  width: 200,
                  height: 150,
                  rows: 3,
                  columns: 3,
                  cellData: Array(3).fill(null).map(() => Array(3).fill('')),
                  createdAt: now,
                  updatedAt: now
                } as any;
                break;

              default:
                console.warn('[Store] Unknown element type:', type);
                return;
            }

            // Use draft.elements.set() for proper Immer tracking
            draft.elements.set(id, element);
            draft.elementOrder.push(id);
            
            // Select new element
            draft.selectedElementIds.clear();
            draft.selectedElementIds.add(id as ElementId);
            draft.lastSelectedElementId = id as ElementId;
            
            // Switch to select tool for immediate editing
            draft.selectedTool = 'select';

            console.log(`✨ [Store] Created ${type}:`, { id, position });
            logger.debug(`[Store] Created ${type} element`, { id, position });
          });
        },

        deleteElement: (id: ElementOrSectionId) => {
          set((draft) => {
            draft.elements.delete(id);
            draft.elementOrder = draft.elementOrder.filter(elemId => elemId !== id);
            draft.selectedElementIds.delete(id as ElementId);
            
            if (draft.lastSelectedElementId === id) {
              draft.lastSelectedElementId = null;
            }
            
            logger.debug(`[Store] Deleted element: ${id}`);
          });
        },

        deleteSelectedElements: () => {
          set((draft) => {
            const elementsToDelete = Array.from(draft.selectedElementIds);
            if (elementsToDelete.length === 0) return;

            elementsToDelete.forEach(elementId => {
              draft.elements.delete(elementId);
              draft.elementOrder = draft.elementOrder.filter(id => id !== elementId);
            });

            draft.selectedElementIds.clear();
            draft.lastSelectedElementId = null;
            
            logger.debug(`[Store] Deleted ${elementsToDelete.length} elements`);
          });
        },

        getElementById: (id: ElementOrSectionId) => {
          return get().elements.get(id);
        },

        // Selection operations
        selectElement: (id: ElementId, multiSelect = false) => {
          set((draft) => {
            if (multiSelect) {
              if (draft.selectedElementIds.has(id)) {
                draft.selectedElementIds.delete(id);
              } else {
                draft.selectedElementIds.add(id);
              }
            } else {
              draft.selectedElementIds.clear();
              draft.selectedElementIds.add(id);
            }
            
            draft.lastSelectedElementId = id;
            logger.debug(`[Store] Selected element: ${id} (multi: ${multiSelect})`);
          });
        },

        clearSelection: () => {
          set((draft) => {
            draft.selectedElementIds.clear();
            draft.lastSelectedElementId = null;
            logger.debug('[Store] Cleared selection');
          });
        },

        getSelectedElements: () => {
          const state = get();
          return Array.from(state.selectedElementIds)
            .map(id => state.elements.get(id))
            .filter(Boolean) as CanvasElement[];
        },

        // Viewport operations
        setViewport: (viewport) => {
          set((draft) => {
            Object.assign(draft.viewport, viewport);
          });
        },

        panViewport: (deltaX: number, deltaY: number) => {
          set((draft) => {
            draft.viewport.x += deltaX;
            draft.viewport.y += deltaY;
          });
        },

        zoomViewport: (scale: number, centerX?: number, centerY?: number) => {
          set((draft) => {
            const oldScale = draft.viewport.scale;
            draft.viewport.scale = Math.max(0.1, Math.min(5, scale));

            if (centerX !== undefined && centerY !== undefined) {
              const scaleRatio = draft.viewport.scale / oldScale;
              draft.viewport.x = centerX - (centerX - draft.viewport.x) * scaleRatio;
              draft.viewport.y = centerY - (centerY - draft.viewport.y) * scaleRatio;
            }
          });
        },

        // Drawing operations
        startDrawing: (tool: 'pen' | 'pencil', point: { x: number; y: number }) => {
          set((draft) => {
            draft.isDrawing = true;
            draft.drawingTool = tool;
            draft.drawingStartPoint = point;
            draft.currentPath = [point.x, point.y];
            logger.debug(`[Store] Started drawing with ${tool}`, point);
          });
        },

        updateDrawing: (point: { x: number; y: number }) => {
          const state = get();
          if (!state.isDrawing || !state.currentPath) return;

          // Simple distance filtering
          if (state.currentPath.length >= 2) {
            const lastX = state.currentPath[state.currentPath.length - 2];
            const lastY = state.currentPath[state.currentPath.length - 1];
            const distance = Math.sqrt(
              Math.pow(point.x - lastX, 2) + Math.pow(point.y - lastY, 2)
            );
            if (distance < 2) return;
          }

          set((draft) => {
            if (draft.currentPath) {
              draft.currentPath.push(point.x, point.y);
            }
          });
        },

        finishDrawing: () => {
          set((draft) => {
            const { drawingTool, currentPath, drawingStartPoint } = draft;

            if (drawingTool && currentPath && currentPath.length >= 4 && drawingStartPoint) {
              const now = Date.now();
              const id = `${drawingTool}-${now}` as ElementId;

              const relativePoints = currentPath.map((coord, index) => {
                const isX = index % 2 === 0;
                return isX ? coord - drawingStartPoint.x : coord - drawingStartPoint.y;
              });

              const penElement = {
                id,
                type: drawingTool,
                x: drawingStartPoint.x,
                y: drawingStartPoint.y,
                points: relativePoints,
                stroke: '#000000',
                strokeWidth: drawingTool === 'pen' ? 2 : 1,
                lineCap: 'round',
                lineJoin: 'round',
                createdAt: now,
                updatedAt: now
              } as any;

              draft.elements.set(id, penElement);
              draft.elementOrder.push(id);
              logger.debug(`[Store] Created ${drawingTool} element`, penElement);
            }

            // Reset drawing state
            draft.isDrawing = false;
            draft.drawingTool = null;
            draft.currentPath = undefined;
            draft.drawingStartPoint = null;
          });
        },

        cancelDrawing: () => {
          set((draft) => {
            draft.isDrawing = false;
            draft.drawingTool = null;
            draft.currentPath = undefined;
            draft.drawingStartPoint = null;
          });
        },

        // Draft section operations
        startDraftSection: (point: { x: number; y: number }) => {
          set((draft) => {
            draft.draftSection = {
              id: `draft-section-${nanoid()}`,
              x: point.x,
              y: point.y,
              width: 0,
              height: 0
            };
            logger.debug('[Store] Started draft section', point);
          });
        },

        updateDraftSection: (point: { x: number; y: number }) => {
          set((draft) => {
            if (!draft.draftSection) return;

            const startX = draft.draftSection.x;
            const startY = draft.draftSection.y;

            const minX = Math.min(startX, point.x);
            const minY = Math.min(startY, point.y);
            const maxX = Math.max(startX, point.x);
            const maxY = Math.max(startY, point.y);

            draft.draftSection.x = minX;
            draft.draftSection.y = minY;
            draft.draftSection.width = maxX - minX;
            draft.draftSection.height = maxY - minY;
          });
        },

        commitDraftSection: () => {
          const state = get();
          if (!state.draftSection) return null;

          const { x, y, width, height } = state.draftSection;

          if (width < 20 || height < 20) {
            get().cancelDraftSection();
            return null;
          }

          set((draft) => {
            draft.draftSection = null;
          });

          const sectionId = get().createSection(x, y, width, height);
          get().captureElementsAfterSectionCreation(sectionId);
          
          return sectionId;
        },

        cancelDraftSection: () => {
          set((draft) => {
            draft.draftSection = null;
          });
        },

        // UI operations
        setSelectedTool: (tool: string) => {
          set((draft) => {
            draft.selectedTool = tool;
          });
        },

        setTextEditingElement: (id: ElementId | null) => {
          set((draft) => {
            draft.textEditingElementId = id;
          });
        },

        setSelectedStickyNoteColor: (color: string) => {
          set((draft) => {
            draft.selectedStickyNoteColor = color;
          });
        },

        // API Compatibility Layer - Legacy function names
        setStickyNoteColor: (color: string) => {
          // Delegate to the properly named function
          get().setSelectedStickyNoteColor(color);
        },

        // Helper to update computed history properties
        updateHistoryFlags: () => {
          set((draft) => {
            draft.canUndo = draft.currentHistoryIndex > 0;
            draft.canRedo = draft.currentHistoryIndex < draft.history.length - 1;
          });
        },

        // History operations
        addToHistory: (operation: string) => {
          const snapshot = createHistorySnapshot();
          set((draft) => {
            const entry: HistoryEntry = {
              id: nanoid(),
              timestamp: Date.now(),
              operation,
              ...snapshot
            };

            draft.history = draft.history.slice(0, draft.currentHistoryIndex + 1);
            draft.history.push(entry);

            if (draft.history.length > draft.maxHistorySize) {
              draft.history = draft.history.slice(-draft.maxHistorySize);
            }

            draft.currentHistoryIndex = draft.history.length - 1;
          });
          // Update computed history flags
          get().updateHistoryFlags();
        },

        undo: () => {
          set((draft) => {
            if (draft.currentHistoryIndex > 0) {
              draft.currentHistoryIndex--;
              const entry = draft.history[draft.currentHistoryIndex];
              if (entry) {
                draft.elements = new Map(entry.elementsSnapshot);
                draft.selectedElementIds = new Set(entry.selectionSnapshot);
              }
            }
          });
          // Update computed history flags
          get().updateHistoryFlags();
        },

        redo: () => {
          set((draft) => {
            if (draft.currentHistoryIndex < draft.history.length - 1) {
              draft.currentHistoryIndex++;
              const entry = draft.history[draft.currentHistoryIndex];
              if (entry) {
                draft.elements = new Map(entry.elementsSnapshot);
                draft.selectedElementIds = new Set(entry.selectionSnapshot);
              }
            }
          });
          // Update computed history flags
          get().updateHistoryFlags();
        },

        // Section operations
        createSection: (x: number, y: number, width: number, height: number) => {
          const sectionId = `section-${nanoid()}` as SectionId;
          
          const section: SectionElement = {
            id: sectionId,
            type: 'section',
            x,
            y,
            width,
            height,
            title: 'New Section',
            backgroundColor: '#f8f9fa',
            borderColor: '#dee2e6',
            childElementIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          set((draft) => {
            draft.elements.set(sectionId, section);
            draft.sections.set(sectionId, section);
            draft.sectionElementMap.set(sectionId, new Set());
            draft.elementOrder.push(sectionId);
          });

          return sectionId;
        },

        captureElementsAfterSectionCreation: (sectionId: SectionId) => {
          set((draft) => {
            const section = draft.sections.get(sectionId);
            if (!section) return;

            const elementsToCapture: ElementId[] = [];

            for (const [elementId, element] of draft.elements) {
              if (element.id === sectionId) continue;
              if ((element as any).sectionId) continue;

              const elementCenter = getElementCenter(element);
              
              if (
                elementCenter.x >= section.x &&
                elementCenter.x <= section.x + section.width &&
                elementCenter.y >= section.y &&
                elementCenter.y <= section.y + section.height
              ) {
                elementsToCapture.push(elementId as ElementId);
              }
            }

            elementsToCapture.forEach(elementId => {
              const element = draft.elements.get(elementId);
              if (element) {
                const updatedElement = {
                  ...element,
                  sectionId: sectionId,
                  updatedAt: Date.now()
                };
                
                draft.elements.set(elementId, updatedElement);

                const sectionElements = draft.sectionElementMap.get(sectionId);
                if (sectionElements) {
                  sectionElements.add(elementId);
                }
              }
            });

            logger.debug(`[Store] Captured ${elementsToCapture.length} elements in section ${sectionId}`);
          });
        },

        // Utility functions
        findNearestSnapPoint: (pointer: { x: number; y: number }, snapRadius: number = 20) => {
          return null;
        },

        uploadImage: async (file: File, position: { x: number; y: number }) => {
          set((draft) => {
            draft.isUploading = true;
          });

          try {
            const reader = new FileReader();
            return new Promise<void>((resolve, reject) => {
              reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string') {
                  const now = Date.now();
                  const imageElement = {
                    id: `image-${now}` as ElementId,
                    type: 'image',
                    x: position.x,
                    y: position.y,
                    width: 200,
                    height: 150,
                    src: result,
                    createdAt: now,
                    updatedAt: now
                  } as any;

                  set((draft) => {
                    draft.elements.set(imageElement.id, imageElement);
                    draft.elementOrder.push(imageElement.id);
                    draft.isUploading = false;
                  });
                  
                  resolve();
                } else {
                  reject(new Error('Failed to read image file'));
                }
              };

              reader.onerror = () => {
                set((draft) => {
                  draft.isUploading = false;
                });
                reject(new Error('Error reading image file'));
              };

              reader.readAsDataURL(file);
            });
          } catch (error) {
            set((draft) => {
              draft.isUploading = false;
            });
            throw error;
          }
        },

        // Missing selection method
        deselectElement: (id: ElementId) => {
          set((draft) => {
            draft.selectedElementIds.delete(id);
            if (draft.lastSelectedElementId === id) {
              draft.lastSelectedElementId = Array.from(draft.selectedElementIds)[0] || null;
            }
          });
        },


        // Missing legacy methods - implement as NO-OPs for now
        updateTableCell: (tableId: ElementId, row: number, col: number, value: string) => {
          logger.debug('[Store] updateTableCell called - not implemented yet');
        },

        clearAllElements: () => {
          set((draft) => {
            draft.elements.clear();
            draft.elementOrder = [];
            draft.selectedElementIds.clear();
            draft.lastSelectedElementId = null;
          });
        },

        exportElements: () => {
          logger.debug('[Store] exportElements called - not implemented yet');
        },

        importElements: (elements: CanvasElement[]) => {
          logger.debug('[Store] importElements called - not implemented yet');
        },

        handleElementDrop: (elementId: ElementId, targetId?: ElementId) => {
          logger.debug('[Store] handleElementDrop called - not implemented yet');
        },

        updateElementCoordinatesOnSectionMove: (sectionId: SectionId, deltaX: number, deltaY: number) => {
          logger.debug('[Store] updateElementCoordinatesOnSectionMove called - not implemented yet');
        },

        createTestElements: () => {
          logger.debug('[Store] createTestElements called - not implemented yet');
        },

        // Missing section update method
        updateSection: (id: SectionId, updates: Partial<SectionElement>) => {
          set((draft) => {
            const section = draft.sections.get(id);
            if (section) {
              const updatedSection = { ...section, ...updates, updatedAt: Date.now() };
              draft.sections.set(id, updatedSection);
              draft.elements.set(id, updatedSection);
            }
          });
        },

        // Missing legacy compatibility method
        addElement: (element: CanvasElement) => {
          set((draft) => {
            draft.elements.set(element.id, element);
            draft.elementOrder.push(element.id);
          });
        },

        // Additional legacy alias methods
        pan: (deltaX: number, deltaY: number) => {
          get().panViewport(deltaX, deltaY);
        },

        zoom: (scale: number, centerX?: number, centerY?: number) => {
          get().zoomViewport(scale, centerX, centerY);
        },

        // More missing methods - implement as NO-OPs for now
        findSectionAtPoint: (point: { x: number; y: number }) => {
          logger.debug('[Store] findSectionAtPoint called - not implemented yet');
          return null;
        },

        addElementToSection: (elementId: ElementId, sectionId: SectionId) => {
          logger.debug('[Store] addElementToSection called - not implemented yet');
        },

        groupElements: (elementIds: ElementId[]) => {
          logger.debug('[Store] groupElements called - not implemented yet');
          return `group-${nanoid()}` as GroupId;
        },

        ungroupElements: (groupId: GroupId) => {
          logger.debug('[Store] ungroupElements called - not implemented yet');
        },

        isElementInGroup: (elementId: ElementId) => {
          logger.debug('[Store] isElementInGroup called - not implemented yet');
          return false;
        },

        toggleLayersPanel: () => {
          logger.debug('[Store] toggleLayersPanel called - not implemented yet');
        },

        get currentIndex() {
          return get().currentHistoryIndex;
        },

        addHistoryEntry: (operation: string, metadata?: any) => {
          get().addToHistory(operation);
        },

        clearHistory: () => {
          set((draft) => {
            draft.history = [];
            draft.currentHistoryIndex = -1;
          });
          // Update computed history flags
          get().updateHistoryFlags();
        },

        getHistoryLength: () => {
          return get().history.length;
        }
      };
    })
  )
);

// Optimized selectors
export const canvasSelectors = {
  elements: (state: UnifiedCanvasState) => state.elements,
  elementById: (id: ElementId) => (state: UnifiedCanvasState) => state.elements.get(id),
  selectedElementIds: (state: UnifiedCanvasState) => state.selectedElementIds,
  selectedElements: (state: UnifiedCanvasState) =>
    Array.from(state.selectedElementIds)
      .map(id => state.elements.get(id))
      .filter(Boolean) as CanvasElement[],
  selectedTool: (state: UnifiedCanvasState) => state.selectedTool,
  viewport: (state: UnifiedCanvasState) => state.viewport,
  isDrawing: (state: UnifiedCanvasState) => state.isDrawing,
  draftSection: (state: UnifiedCanvasState) => state.draftSection,
  sections: (state: UnifiedCanvasState) => state.sections,
  canUndo: (state: UnifiedCanvasState) => state.canUndo,
  canRedo: (state: UnifiedCanvasState) => state.canRedo,
  lastSelectedElement: (state: UnifiedCanvasState) => 
    state.lastSelectedElementId ? state.elements.get(state.lastSelectedElementId) : null
};

function getElementCenter(element: CanvasElement): { x: number; y: number } {
  switch (element.type) {
    case 'circle':
      return { x: element.x, y: element.y };
    default:
      const width = (element as any).width || 100;
      const height = (element as any).height || 100;
      return { x: element.x + width / 2, y: element.y + height / 2 };
  }
}

export const useSelectedTool = () => useUnifiedCanvasStore(canvasSelectors.selectedTool);

logger.debug('[Store] Unified Canvas Store initialized with Immer fixes');
