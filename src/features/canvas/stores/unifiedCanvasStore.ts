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
import { logger } from '../../../core/lib/logger';
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
import { 
  MarkerConfig, 
  HighlighterConfig, 
  WashiTapeConfig, 
  EraserConfig 
} from '../types/drawing.types';

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
  penColor: string;
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
  
  // Drawing tool configurations
  strokeConfig: {
    marker: MarkerConfig;
    highlighter: HighlighterConfig;
    washiTape: WashiTapeConfig;
    eraser: EraserConfig;
  };
}

export interface CanvasEventActions {
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>, pos: { x: number; y: number } | null) => void;
  handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>, pos: { x: number; y: number } | null) => void;
  handleMouseUp: (e: Konva.KonvaEventObject<MouseEvent>, pos: { x: number; y: number } | null) => void;
  handleMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>, pos: { x: number; y: number } | null) => void;
  handleClick: (e: Konva.KonvaEventObject<MouseEvent>, pos: { x: number; y: number } | null) => void;
  handleDoubleClick: (e: Konva.KonvaEventObject<MouseEvent>, pos: { x: number; y: number } | null) => void;
  handleContextMenu: (e: Konva.KonvaEventObject<MouseEvent>, pos: { x: number; y: number } | null) => void;
  handleDragStart: (e: Konva.KonvaEventObject<DragEvent>, pos: { x: number; y: number } | null) => void;
  handleDragMove: (e: Konva.KonvaEventObject<DragEvent>, pos: { x: number; y: number } | null) => void;
  handleDragEnd: (e: Konva.KonvaEventObject<DragEvent>, pos: { x: number; y: number } | null) => void;
}

export interface UnifiedCanvasActions extends CanvasEventActions {
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
  setPenColor: (color: string) => void;
  
  // API Compatibility Layer  
  setStickyNoteColor: (color: string) => void;
  updateHistoryFlags: () => void;
  
  // History
  addToHistory: (operation: string) => void;
  undo: () => void;
  redo: () => void;
  
  // Sections
  createSection: (x: number, y: number, width: number, height: number, title?: string) => SectionId;
  updateSection: (id: SectionId, updates: Partial<SectionElement>) => void;
  captureElementsInSection: (sectionId: SectionId) => void;
  deleteSection: (id: SectionId) => void;
  
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
  
  // Stroke Configuration
  updateStrokeConfig: (tool: 'marker' | 'highlighter' | 'washiTape' | 'eraser', config: Partial<MarkerConfig | HighlighterConfig | WashiTapeConfig | EraserConfig>) => void;
  
  // Sticky Note Container Management
  enableStickyNoteContainer: (stickyNoteId: ElementId, options?: { allowedTypes?: string[]; clipChildren?: boolean; maxChildren?: number }) => void;
  addElementToStickyNote: (elementId: ElementId, stickyNoteId: ElementId) => void;
  removeElementFromStickyNote: (elementId: ElementId, stickyNoteId: ElementId) => void;
  findStickyNoteAtPoint: (point: { x: number; y: number }) => ElementId | null;
  isStickyNoteContainer: (stickyNoteId: ElementId) => boolean;
  getStickyNoteChildren: (stickyNoteId: ElementId) => CanvasElement[];
  constrainElementToStickyNote: (elementId: ElementId, stickyNoteId: ElementId) => void;
  clearStickyNoteChildren: (stickyNoteId: ElementId) => void;
  
  // Test utility methods
  clearSelection: () => void;
  clearAllElements: () => void;
  clearCanvas: () => void;
  
  // Demo function for sticky note containers
  createStickyNoteContainerDemo: () => void;
  
  // Stroke tool action
  updateStrokeConfig: (tool: 'marker' | 'highlighter' | 'washiTape' | 'eraser', config: any) => void;
  
  // Table management
  updateTableCell: (tableId: ElementId, row: number, col: number, value: string) => void;
  addTableRow: (tableId: ElementId, position?: number) => void;
  removeTableRow: (tableId: ElementId, rowIndex: number) => void;
  addTableColumn: (tableId: ElementId, position?: number) => void;
  removeTableColumn: (tableId: ElementId, colIndex: number) => void;
  resizeTableCell: (tableId: ElementId, rowIndex: number, colIndex: number, width?: number, height?: number) => void;
}

export type UnifiedCanvasStore = UnifiedCanvasState & UnifiedCanvasActions;

const getElementIdFromNode = (node: Konva.Node): ElementId | null => {
  if (node && node.id()) {
    return node.id() as ElementId;
  }
  return null;
};

export const createCanvasStoreSlice: (set: any, get: any) => UnifiedCanvasStore = (set, get) => {
  return {
    // #region State
    elements: new Map(),
    elementOrder: [],
    selectedElementIds: new Set(),
    lastSelectedElementId: null,
    viewport: { x: 0, y: 0, scale: 1, width: 1920, height: 1080 },
    isDrawing: false,
    drawingTool: null,
    drawingStartPoint: null,
    draftSection: null,
    selectedTool: 'select',
    textEditingElementId: null,
    selectedStickyNoteColor: '#ffeb3b',
    penColor: '#000000',
    showGrid: true,
    snapToGrid: false,
    history: [],
    currentHistoryIndex: -1,
    maxHistorySize: 50,
    canUndo: false,
    canRedo: false,
    sections: new Map(),
    sectionElementMap: new Map(),
    isUploading: false,
    drawingCurrentPoint: null,
    viewportBounds: null,
    currentIndex: -1,
    strokeConfig: {
      marker: {
        color: '#000000',
        width: 8,
        minWidth: 2,
        maxWidth: 20,
        opacity: 1,
        smoothness: 0.5,
        widthVariation: true,
        pressureSensitive: true,
        lineCap: 'round',
        lineJoin: 'round'
      },
      highlighter: {
        color: '#FFFF00',
        width: 16,
        opacity: 0.4,
        blendMode: 'multiply',
        lockToElements: false
      },
      washiTape: {
        primaryColor: '#FFB3BA',
        secondaryColor: '#A8DAFF',
        width: 20,
        opacity: 0.8,
        pattern: {
          type: 'dots',
          radius: 2
        }
      },
      eraser: {
        size: 30,
        mode: 'stroke'
      }
    },
    // #endregion

    // #region Actions

    // Element Operations
    getElementById: (id) => get().elements.get(id),
    
    addElement: (element) => {
      set(state => {
        // FIXED: Create a new Map to ensure proper change detection
        const newElements = new Map(state.elements);
        newElements.set(element.id, element);
        state.elements = newElements;
        state.elementOrder.push(element.id);
      });
      get().addToHistory('addElement');
    },

    createElement: (type, position) => {
      const newElement = { id: nanoid(), type, ...position } as CanvasElement;
      get().addElement(newElement);
    },

    updateElement: (id, updates) => {
      console.log('🔄 [Store] updateElement called:', { id, updates });
      set(state => {
        const element = state.elements.get(id);
        console.log('🔄 [Store] Current element:', element);
        if (element) {
          const oldX = element.x;
          const oldY = element.y;

          // FIXED: Create a new element object to ensure proper change detection
          const updatedElement = { ...element, ...updates };
          console.log('🔄 [Store] Updated element:', updatedElement);

          // If element is in a section, constrain its position
          if (updatedElement.sectionId) {
            const section = state.sections.get(updatedElement.sectionId);
            if (section) {
              const halfWidth = (updatedElement.width ?? 0) / 2;
              const halfHeight = (updatedElement.height ?? 0) / 2;
              
              updatedElement.x = Math.max(section.x, Math.min(updatedElement.x, section.x + section.width - (updatedElement.width ?? 0)));
              updatedElement.y = Math.max(section.y, Math.min(updatedElement.y, section.y + section.height - (updatedElement.height ?? 0)));
            }
          }

          // FIXED: Properly update the Map to trigger re-renders
          state.elements.set(id, updatedElement);
          console.log('🔄 [Store] Element updated in map');

          // If it's a section, update its children
          if (updatedElement.type === 'section') {
            const oldSectionId = updatedElement.sectionId;
            const hasPositionChanged = updates.x !== undefined || updates.y !== undefined;
    
            if (hasPositionChanged) {
              const newCenter = getElementCenter(updatedElement);
              const newSectionId = get().findSectionAtPoint(newCenter);
    
              if (oldSectionId && oldSectionId !== newSectionId) {
                // Remove from old section
                const oldSection = state.sections.get(oldSectionId);
                if (oldSection) {
                  oldSection.childElementIds = oldSection.childElementIds.filter(childId => childId !== id);
                }
              }
    
              if (newSectionId && oldSectionId !== newSectionId) {
                // Add to new section
                const newSection = state.sections.get(newSectionId);
                if (newSection) {
                  newSection.childElementIds.push(id);
                }
              }
              
              updatedElement.sectionId = newSectionId || undefined;
              // Update the element again with the new sectionId
              state.elements.set(id, updatedElement);
            }
          }

          // If sticky note moved, move its children by same delta
          if (updatedElement.type === 'sticky-note' && updatedElement.childElementIds && (updates.x !== undefined || updates.y !== undefined)) {
            const deltaX = (updates.x ?? element.x) - oldX;
            const deltaY = (updates.y ?? element.y) - oldY;
            console.log('🗒️ [Store] Moving sticky note children:', {
              stickyNoteId: updatedElement.id,
              deltaX,
              deltaY,
              childCount: updatedElement.childElementIds.length
            });
            if (deltaX !== 0 || deltaY !== 0) {
              updatedElement.childElementIds.forEach(childId => {
                const child = state.elements.get(childId);
                if (child) {
                  console.log('🗒️ [Store] Moving child element:', {
                    childId,
                    childType: child.type,
                    oldPosition: { x: child.x, y: child.y },
                    newPosition: { x: child.x + deltaX, y: child.y + deltaY }
                  });
                  
                  let movedChild = { ...child, x: child.x + deltaX, y: child.y + deltaY };
                  
                  // For stroke elements (pen, marker, highlighter), also update the points array
                  if (child.type === 'pen' || child.type === 'marker' || child.type === 'highlighter') {
                    const strokeChild = child as any; // Cast to access points
                    if (strokeChild.points && Array.isArray(strokeChild.points)) {
                      console.log('🗒️ [Store] Updating stroke points for child:', childId);
                      const updatedPoints = strokeChild.points.map((point: number, index: number) => {
                        return index % 2 === 0 ? point + deltaX : point + deltaY;
                      });
                      movedChild = { ...movedChild, points: updatedPoints };
                    }
                  }
                  
                  state.elements.set(childId, movedChild);
                }
              });
            }
          }
        }
      });
      get().addToHistory('updateElement');
    },

    updateMultipleElements: (updates) => {
      set(state => {
        updates.forEach(({ id, updates: elementUpdates }) => {
          const element = state.elements.get(id);
          if (element) {
            Object.assign(element, elementUpdates);
          }
        });
      });
      get().addToHistory('updateMultipleElements');
    },

    deleteElement: (id) => {
      set(state => {
        if (!state.elements.has(id)) return;
    
        const elementToDelete = state.elements.get(id);
        if (elementToDelete?.sectionId) {
          const section = state.sections.get(elementToDelete.sectionId);
          if (section) {
            section.childElementIds = section.childElementIds.filter(childId => childId !== id);
          }
        }
    
        state.elements.delete(id);
        state.elementOrder = state.elementOrder.filter(elementId => elementId !== id);
        state.selectedElementIds.delete(id as ElementId);
      });
      get().addToHistory('deleteElement');
    },

    deleteSelectedElements: () => {
      const { selectedElementIds } = get();
      set(state => {
        for (const id of selectedElementIds) {
          if (!state.elements.has(id)) continue;
          const elementToDelete = state.elements.get(id);
          if (elementToDelete?.sectionId) {
            const section = state.sections.get(elementToDelete.sectionId);
            if (section) {
              section.childElementIds = section.childElementIds.filter(childId => childId !== id);
            }
          }
          state.elements.delete(id);
          state.elementOrder = state.elementOrder.filter(elementId => elementId !== id);
        }
        state.selectedElementIds.clear();
      });
      get().addToHistory('deleteSelectedElements');
    },
    
    // Selection
    selectElement: (id, multiSelect = false) => {
      set(state => {
        if (!multiSelect) {
          state.selectedElementIds.clear();
        }
        state.selectedElementIds.add(id);
        state.lastSelectedElementId = id;
      });
    },

    deselectElement: (id) => {
      set(state => {
        state.selectedElementIds.delete(id);
        if (state.lastSelectedElementId === id) {
          state.lastSelectedElementId = null;
        }
      });
    },

    clearSelection: () => {
      set(state => {
        state.selectedElementIds.clear();
        state.lastSelectedElementId = null;
      });
    },

    getSelectedElements: () => {
      const { elements, selectedElementIds } = get();
      return Array.from(selectedElementIds).map(id => elements.get(id)).filter(Boolean) as CanvasElement[];
    },

    // Section Operations
    createSection: (x, y, width = 400, height = 300, title = 'New Section') => {
      const newSectionId = nanoid() as SectionId;
      const newSection: SectionElement = {
        id: newSectionId,
        type: 'section',
        x,
        y,
        width,
        height,
        title,
        childElementIds: [],
        backgroundColor: 'rgba(240, 240, 240, 0.5)',
        borderColor: '#ccc',
        borderWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      set((state) => {
        const newSections = new Map(state.sections).set(newSectionId, newSection);
        const newElements = new Map(state.elements).set(newSectionId, newSection);
        const newElementOrder = [...state.elementOrder, newSectionId];
        const newSectionElementMap = new Map(state.sectionElementMap).set(newSectionId, new Set());
        
        return { 
          sections: newSections, 
          elements: newElements,
          elementOrder: newElementOrder,
          sectionElementMap: newSectionElementMap,
        };
      });

      get().captureElementsInSection(newSectionId);
      get().addToHistory('createSection');
      return newSectionId;
    },

    updateSection: (id, updates) => {
      set(state => {
        const section = state.sections.get(id);
        if (section) {
          const oldX = section.x;
          const oldY = section.y;

          Object.assign(section, updates);
          
          const deltaX = section.x - oldX;
          const deltaY = section.y - oldY;

          if (deltaX !== 0 || deltaY !== 0) {
            section.childElementIds.forEach(elementId => {
              const element = state.elements.get(elementId);
              if (element) {
                element.x += deltaX;
                element.y += deltaY;
              }
            });
          }

          // Also update the element representation
          const element = state.elements.get(id);
          if (element) {
            Object.assign(element, updates);
          }
        }
      });
      get().addToHistory('updateSection');
    },

    captureElementsInSection: (sectionId) => {
      const section = get().sections.get(sectionId);
      if (!section) return;

      const sectionBounds = {
        x1: section.x,
        y1: section.y,
        x2: section.x + section.width,
        y2: section.y + section.height,
      };

      set(state => {
        const childIds = new Set<ElementId>();
        for (const element of state.elements.values()) {
          if (element.type === 'section' || element.id === sectionId) continue;

          const elementCenter = getElementCenter(element);
          if (
            elementCenter.x >= sectionBounds.x1 &&
            elementCenter.x <= sectionBounds.x2 &&
            elementCenter.y >= sectionBounds.y1 &&
            elementCenter.y <= sectionBounds.y2
          ) {
            if (element.sectionId && element.sectionId !== sectionId) {
              const oldSection = state.sections.get(element.sectionId);
              if (oldSection) {
                oldSection.childElementIds = oldSection.childElementIds.filter(id => id !== element.id);
              }
            }
            element.sectionId = sectionId;
            childIds.add(element.id as ElementId);
          }
        }
        const currentSection = state.sections.get(sectionId);
        if(currentSection) {
            currentSection.childElementIds = Array.from(childIds);
        }
      });
    },

    deleteSection: (id) => {
      set(state => {
        if (!state.sections.has(id)) return;
        
        // Release child elements
        const section = state.sections.get(id);
        if (section?.childElementIds) {
          section.childElementIds.forEach(childId => {
            const child = state.elements.get(childId);
            if (child) {
              child.sectionId = undefined;
            }
          });
        }

        state.sections.delete(id);
        state.elements.delete(id); // Also remove from elements map
        state.sectionElementMap.delete(id);
        state.elementOrder = state.elementOrder.filter(elId => elId !== id);
        state.selectedElementIds.delete(id as ElementId);
      });
      get().addToHistory('deleteSection');
    },

    findSectionAtPoint: (point) => {
        const { sections, elementOrder } = get();
        // Iterate backwards through elementOrder to find the top-most section
        for (let i = elementOrder.length - 1; i >= 0; i--) {
            const id = elementOrder[i] as SectionId;
            const section = sections.get(id);
            if (section &&
                point.x >= section.x &&
                point.x <= section.x + section.width &&
                point.y >= section.y &&
                point.y <= section.y + section.height) {
                return section.id;
            }
        }
        return null;
    },

    // Test utility methods
    clearCanvas: () => {
      set({
        elements: new Map(),
        elementOrder: [],
        selectedElementIds: new Set(),
        sections: new Map(),
        sectionElementMap: new Map(),
        history: [],
        currentHistoryIndex: -1,
      });
    },

    // Viewport operations
    setViewport: (viewport) => {
      set(state => {
        Object.assign(state.viewport, viewport);
      });
    },
    
    panViewport: (deltaX, deltaY) => {
      set(state => {
        state.viewport.x += deltaX;
        state.viewport.y += deltaY;
      });
    },
    
    zoomViewport: (scale, centerX, centerY) => {
      set(state => {
        state.viewport.scale = Math.max(0.1, Math.min(10, scale));
      });
    },

    // Drawing operations
    startDrawing: (tool, point) => {
      set(state => {
        state.isDrawing = true;
        state.drawingTool = tool;
        state.drawingStartPoint = point;
        state.currentPath = [point.x, point.y];
        state.drawingCurrentPoint = point;
      });
    },
    
    updateDrawing: (point) => {
      set(state => {
        if (state.isDrawing && state.currentPath) {
          state.currentPath.push(point.x, point.y);
          state.drawingCurrentPoint = point;
        }
      });
    },
    
    finishDrawing: () => {
      const state = get();
      if (state.isDrawing && state.currentPath && state.currentPath.length >= 4) {
        // Create pen element
        const penElement = {
          id: nanoid(),
          type: 'pen',
          x: 0,
          y: 0,
          points: [...state.currentPath],
          stroke: state.penColor,
          strokeWidth: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false
        };
        
        // Add to store
        get().addElement(penElement as any);
        
        // Check if the stroke was created within a sticky note container
        const startPoint = { x: state.currentPath[0], y: state.currentPath[1] };
        console.log('🖊️ [Store] Checking for sticky note at start point:', startPoint);
        const stickyNoteId = get().findStickyNoteAtPoint(startPoint);
        
        if (stickyNoteId) {
          console.log('🖊️ [Store] Adding pen stroke to sticky note container:', stickyNoteId);
          get().addElementToStickyNote(penElement.id as any, stickyNoteId);
        } else {
          console.log('🖊️ [Store] No sticky note container found at start point');
        }
      }
      
      // Reset drawing state
      set(state => {
        state.isDrawing = false;
        state.drawingTool = null;
        state.drawingStartPoint = null;
        state.currentPath = undefined;
        state.drawingCurrentPoint = null;
      });
    },
    
    cancelDrawing: () => {
      set(state => {
        state.isDrawing = false;
        state.drawingTool = null;
        state.drawingStartPoint = null;
        state.currentPath = undefined;
        state.drawingCurrentPoint = null;
      });
    },
    // Section draft operations  
    startDraftSection: (point) => {
      set(state => {
        state.draftSection = {
          id: nanoid(),
          x: point.x,
          y: point.y,
          width: 0,
          height: 0
        };
      });
    },
    
    updateDraftSection: (point) => {
      set(state => {
        if (state.draftSection) {
          const startX = state.draftSection.x;
          const startY = state.draftSection.y;
          
          // Calculate normalized bounds (handle drag in any direction)
          const x = Math.min(point.x, startX);
          const y = Math.min(point.y, startY);
          const width = Math.abs(point.x - startX);
          const height = Math.abs(point.y - startY);
          
          state.draftSection.x = x;
          state.draftSection.y = y;
          state.draftSection.width = width;
          state.draftSection.height = height;
        }
      });
    },
    
    commitDraftSection: () => {
      const state = get();
      if (state.draftSection && state.draftSection.width > 10 && state.draftSection.height > 10) {
        const sectionId = get().createSection(
          state.draftSection.x,
          state.draftSection.y,
          state.draftSection.width,
          state.draftSection.height
        );
        
        // Clear draft
        set(state => {
          state.draftSection = null;
        });
        
        return sectionId;
      }
      
      // Clear draft even if too small
      set(state => {
        state.draftSection = null;
      });
      
      return null;
    },
    
    cancelDraftSection: () => {
      set(state => {
        state.draftSection = null;
      });
    },
    setSelectedTool: (tool) => set({ selectedTool: tool }),
    setTextEditingElement: (id) => {
      // Log the state change for debugging
      const currentId = get().textEditingElementId;
      console.log('🎯 [Store] setTextEditingElement:', { from: currentId, to: id });
      
      // If we're setting a new element while another is being edited,
      // we need to ensure cleanup happens
      if (currentId && id && currentId !== id) {
        console.log('⚠️ [Store] Switching text editing from', currentId, 'to', id);
      }
      
      set({ textEditingElementId: id });
    },
    setSelectedStickyNoteColor: (color) => set({ selectedStickyNoteColor: color }),
    setPenColor: (color) => set({ penColor: color }),
    setStickyNoteColor: (color) => set({ selectedStickyNoteColor: color }),
    updateHistoryFlags: () => {},
    addToHistory: (operation) => {
      set(state => {
        // Simple history implementation
        const historyEntry = {
          id: nanoid(),
          timestamp: Date.now(),
          operation,
          elementsSnapshot: new Map(state.elements),
          selectionSnapshot: new Set(state.selectedElementIds)
        };
        
        // Remove future history if we're not at the end
        if (state.currentHistoryIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.currentHistoryIndex + 1);
        }
        
        // Add new entry
        state.history.push(historyEntry);
        state.currentHistoryIndex = state.history.length - 1;
        
        // Limit history size
        if (state.history.length > state.maxHistorySize) {
          state.history = state.history.slice(-state.maxHistorySize);
          state.currentHistoryIndex = state.history.length - 1;
        }
        
        // Update flags
        state.canUndo = state.currentHistoryIndex > 0;
        state.canRedo = state.currentHistoryIndex < state.history.length - 1;
      });
    },
    undo: () => {
      const state = get();
      if (state.canUndo && state.currentHistoryIndex > 0) {
        const targetIndex = state.currentHistoryIndex - 1;
        const targetEntry = state.history[targetIndex];
        
        if (targetEntry) {
          set(draft => {
            // Restore elements from history snapshot
            draft.elements = new Map(targetEntry.elementsSnapshot);
            draft.selectedElementIds = new Set(targetEntry.selectionSnapshot);
            
            // Update element order to match restored elements
            draft.elementOrder = Array.from(targetEntry.elementsSnapshot.keys());
            
            // Update history index
            draft.currentHistoryIndex = targetIndex;
            
            // Update history flags
            draft.canUndo = targetIndex > 0;
            draft.canRedo = targetIndex < draft.history.length - 1;
            draft.currentIndex = targetIndex;
          });
          
          console.log('✅ [Store] Undo successful - restored to:', targetEntry.operation);
        }
      }
    },
    
    redo: () => {
      const state = get();
      if (state.canRedo && state.currentHistoryIndex < state.history.length - 1) {
        const targetIndex = state.currentHistoryIndex + 1;
        const targetEntry = state.history[targetIndex];
        
        if (targetEntry) {
          set(draft => {
            // Restore elements from history snapshot
            draft.elements = new Map(targetEntry.elementsSnapshot);
            draft.selectedElementIds = new Set(targetEntry.selectionSnapshot);
            
            // Update element order to match restored elements
            draft.elementOrder = Array.from(targetEntry.elementsSnapshot.keys());
            
            // Update history index
            draft.currentHistoryIndex = targetIndex;
            
            // Update history flags
            draft.canUndo = targetIndex > 0;
            draft.canRedo = targetIndex < draft.history.length - 1;
            draft.currentIndex = targetIndex;
          });
          
          console.log('✅ [Store] Redo successful - restored to:', targetEntry.operation);
        }
      }
    },
    captureElementsAfterSectionCreation: () => {},
    clearAllElements: () => {
      set(state => {
        state.elements = new Map();
        state.elementOrder = [];
        state.selectedElementIds = new Set();
        state.lastSelectedElementId = null;
        state.sections = new Map();
        state.sectionElementMap = new Map();
      });
      get().addToHistory('clearAllElements');
    },
    
    updateTableCell: (tableId, row, col, value) => {
      set(state => {
        const table = state.elements.get(tableId);
        if (table && isTableElement(table)) {
          // Ensure enhancedTableData exists
          if (!table.enhancedTableData) {
            table.enhancedTableData = {
              rows: Array(table.rows).fill(null).map((_, i) => ({ height: 40, id: `row-${i}` })),
              columns: Array(table.cols).fill(null).map((_, i) => ({ width: 120, id: `col-${i}` })),
              cells: Array(table.rows).fill(null).map(() => 
                Array(table.cols).fill(null).map(() => ({ content: '', text: '' }))
              )
            };
          }

          // Ensure cells array exists and has correct dimensions
          if (!table.enhancedTableData.cells || 
              table.enhancedTableData.cells.length !== table.rows ||
              table.enhancedTableData.cells[0]?.length !== table.cols) {
            table.enhancedTableData.cells = Array(table.rows).fill(null).map((_, r) => 
              Array(table.cols).fill(null).map((_, c) => 
                table.enhancedTableData?.cells?.[r]?.[c] || { content: '', text: '' }
              )
            );
          }

          // Update the specific cell
          if (table.enhancedTableData.cells[row] && table.enhancedTableData.cells[row][col]) {
            table.enhancedTableData.cells[row][col] = {
              content: value,
              text: value,
              backgroundColor: row === 0 || col === 0 ? '#F8FAFC' : 'white',
              textColor: '#1F2937',
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              textAlign: col === 0 ? 'left' : 'left',
              verticalAlign: 'middle'
            };
          }

          // Update timestamp
          table.updatedAt = Date.now();
          
          console.log('📝 [updateTableCell] Updated cell:', { tableId, row, col, value });
        }
      });
      get().addToHistory('updateTableCell');
    },

    addTableRow: (tableId, position = -1) => {
      set(state => {
        const table = state.elements.get(tableId);
        if (table && isTableElement(table)) {
          const insertIndex = position === -1 ? table.rows : Math.max(0, Math.min(position, table.rows));
          
          // Update table dimensions
          table.rows += 1;
          table.height += 40; // Default row height
          
          // Ensure enhancedTableData exists
          if (!table.enhancedTableData) {
            table.enhancedTableData = {
              rows: Array(table.rows).fill(null).map((_, i) => ({ height: 40, id: `row-${i}` })),
              columns: Array(table.cols).fill(null).map((_, i) => ({ width: 120, id: `col-${i}` })),
              cells: Array(table.rows).fill(null).map(() => 
                Array(table.cols).fill(null).map(() => ({ content: '', text: '' }))
              )
            };
          } else {
            // Insert new row
            table.enhancedTableData.rows.splice(insertIndex, 0, { height: 40, id: `row-${Date.now()}` });
            
            // Insert new row of cells
            const newRow = Array(table.cols).fill(null).map(() => ({ content: '', text: '' }));
            table.enhancedTableData.cells.splice(insertIndex, 0, newRow);
          }
          
          table.updatedAt = Date.now();
          console.log('➕ [addTableRow] Added row at position:', insertIndex);
        }
      });
      get().addToHistory('addTableRow');
    },

    removeTableRow: (tableId, rowIndex) => {
      set(state => {
        const table = state.elements.get(tableId);
        if (table && isTableElement(table) && table.rows > 1 && rowIndex >= 0 && rowIndex < table.rows) {
          // Update table dimensions
          table.rows -= 1;
          table.height -= table.enhancedTableData?.rows?.[rowIndex]?.height || 40;
          
          // Remove row from enhancedTableData
          if (table.enhancedTableData) {
            table.enhancedTableData.rows.splice(rowIndex, 1);
            table.enhancedTableData.cells.splice(rowIndex, 1);
          }
          
          table.updatedAt = Date.now();
          console.log('➖ [removeTableRow] Removed row at index:', rowIndex);
        }
      });
      get().addToHistory('removeTableRow');
    },

    addTableColumn: (tableId, position = -1) => {
      set(state => {
        const table = state.elements.get(tableId);
        if (table && isTableElement(table)) {
          const insertIndex = position === -1 ? table.cols : Math.max(0, Math.min(position, table.cols));
          
          // Update table dimensions
          table.cols += 1;
          table.width += 120; // Default column width
          
          // Ensure enhancedTableData exists
          if (!table.enhancedTableData) {
            table.enhancedTableData = {
              rows: Array(table.rows).fill(null).map((_, i) => ({ height: 40, id: `row-${i}` })),
              columns: Array(table.cols).fill(null).map((_, i) => ({ width: 120, id: `col-${i}` })),
              cells: Array(table.rows).fill(null).map(() => 
                Array(table.cols).fill(null).map(() => ({ content: '', text: '' }))
              )
            };
          } else {
            // Insert new column
            table.enhancedTableData.columns.splice(insertIndex, 0, { width: 120, id: `col-${Date.now()}` });
            
            // Insert new column cells in each row
            table.enhancedTableData.cells.forEach(row => {
              row.splice(insertIndex, 0, { content: '', text: '' });
            });
          }
          
          table.updatedAt = Date.now();
          console.log('➕ [addTableColumn] Added column at position:', insertIndex);
        }
      });
      get().addToHistory('addTableColumn');
    },

    removeTableColumn: (tableId, colIndex) => {
      set(state => {
        const table = state.elements.get(tableId);
        if (table && isTableElement(table) && table.cols > 1 && colIndex >= 0 && colIndex < table.cols) {
          // Update table dimensions
          table.cols -= 1;
          table.width -= table.enhancedTableData?.columns?.[colIndex]?.width || 120;
          
          // Remove column from enhancedTableData
          if (table.enhancedTableData) {
            table.enhancedTableData.columns.splice(colIndex, 1);
            table.enhancedTableData.cells.forEach(row => {
              row.splice(colIndex, 1);
            });
          }
          
          table.updatedAt = Date.now();
          console.log('➖ [removeTableColumn] Removed column at index:', colIndex);
        }
      });
      get().addToHistory('removeTableColumn');
    },

    resizeTableCell: (tableId, rowIndex, colIndex, width, height) => {
      set(state => {
        const table = state.elements.get(tableId);
        if (table && isTableElement(table) && table.enhancedTableData) {
          // Update column width if provided
          if (width !== undefined && table.enhancedTableData.columns[colIndex]) {
            const oldWidth = table.enhancedTableData.columns[colIndex].width || 120;
            table.enhancedTableData.columns[colIndex].width = Math.max(60, width);
            // Update total table width
            table.width += (table.enhancedTableData.columns[colIndex].width - oldWidth);
          }
          
          // Update row height if provided
          if (height !== undefined && table.enhancedTableData.rows[rowIndex]) {
            const oldHeight = table.enhancedTableData.rows[rowIndex].height || 40;
            table.enhancedTableData.rows[rowIndex].height = Math.max(30, height);
            // Update total table height
            table.height += (table.enhancedTableData.rows[rowIndex].height - oldHeight);
          }
          
          table.updatedAt = Date.now();
        }
      });
      get().addToHistory('resizeTableCell');
    },
    
    exportElements: () => {},
    importElements: () => {},
    handleElementDrop: () => {},
    updateElementCoordinatesOnSectionMove: () => {},
    createTestElements: () => {},
    pan: () => {},
    zoom: () => {},
    addElementToSection: () => {},
    groupElements: () => '' as GroupId,
    ungroupElements: () => {},
    isElementInGroup: () => false,
    toggleLayersPanel: () => {},
    addHistoryEntry: (operation, metadata) => {
      set(state => {
        // Use the same logic as addToHistory for consistency
        const historyEntry = {
          id: nanoid(),
          timestamp: Date.now(),
          operation,
          elementsSnapshot: new Map(state.elements),
          selectionSnapshot: new Set(state.selectedElementIds)
        };
        
        // Remove future history if we're not at the end
        if (state.currentHistoryIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.currentHistoryIndex + 1);
        }
        
        // Add new entry
        state.history.push(historyEntry);
        state.currentHistoryIndex = state.history.length - 1;
        
        // Limit history size
        if (state.history.length > state.maxHistorySize) {
          state.history = state.history.slice(-state.maxHistorySize);
          state.currentHistoryIndex = state.history.length - 1;
        }
        
        // Update flags
        state.canUndo = state.currentHistoryIndex > 0;
        state.canRedo = state.currentHistoryIndex < state.history.length - 1;
        state.currentIndex = state.currentHistoryIndex;
      });
    },
    
    clearHistory: () => {
      set(state => {
        state.history = [];
        state.currentHistoryIndex = -1;
        state.canUndo = false;
        state.canRedo = false;
        state.currentIndex = -1;
      });
    },
    
    getHistoryLength: () => {
      return get().history.length;
    },
    findNearestSnapPoint: () => ({}),
    uploadImage: async () => {},
    handleMouseDown: () => {},
    handleMouseMove: () => {},
    handleMouseUp: () => {},
    handleMouseLeave: () => {},
    handleClick: () => {},
    handleDoubleClick: () => {},
    handleContextMenu: () => {},
    handleDragStart: () => {},
    handleDragMove: () => {},
    handleDragEnd: () => {},
    
    // Stroke Configuration
    updateStrokeConfig: (tool, config) => {
      set(state => {
        Object.assign(state.strokeConfig[tool], config);
      });
    },
    
         // Sticky Note Container Management
     enableStickyNoteContainer: (stickyNoteId, options = {}) => {
       set(state => {
         const stickyNote = state.elements.get(stickyNoteId);
         if (stickyNote && stickyNote.type === 'sticky-note') {
           const updatedStickyNote = {
             ...stickyNote,
             isContainer: true,
             childElementIds: stickyNote.childElementIds || [],
             allowedChildTypes: options.allowedTypes || ['pen', 'marker', 'highlighter', 'washi-tape', 'text', 'connector', 'image', 'table'],
             clipChildren: options.clipChildren ?? true,
             maxChildElements: options.maxChildren || 20
           };
           state.elements.set(stickyNoteId, updatedStickyNote);
         }
       });
       get().addToHistory('enableStickyNoteContainer');
     },

     addElementToStickyNote: (elementId, stickyNoteId) => {
       set(state => {
         const stickyNote = state.elements.get(stickyNoteId);
         const element = state.elements.get(elementId);
         
         if (stickyNote && element && stickyNote.type === 'sticky-note') {
           // Ensure sticky note is a container
           if (!stickyNote.isContainer) {
             return; // Don't add if not enabled as container
           }

           // Check allowed types
           if (stickyNote.allowedChildTypes && !stickyNote.allowedChildTypes.includes(element.type)) {
             console.warn(`Element type ${element.type} not allowed in sticky note ${stickyNoteId}`);
             return;
           }

           // Check max elements limit
           const currentChildCount = stickyNote.childElementIds?.length || 0;
           if (stickyNote.maxChildElements && currentChildCount >= stickyNote.maxChildElements) {
             console.warn(`Sticky note ${stickyNoteId} has reached maximum child elements limit`);
             return;
           }

           // Update sticky note
           const updatedStickyNote = {
             ...stickyNote,
             childElementIds: [...(stickyNote.childElementIds || []), elementId]
           };
           state.elements.set(stickyNoteId, updatedStickyNote);

           // Update element to reference its parent
           const updatedElement = {
             ...element,
             parentId: stickyNoteId,
             stickyNoteId: stickyNoteId
           };
           state.elements.set(elementId, updatedElement);
         }
       });
       get().addToHistory('addElementToStickyNote');
     },

     removeElementFromStickyNote: (elementId, stickyNoteId) => {
       set(state => {
         const stickyNote = state.elements.get(stickyNoteId);
         const element = state.elements.get(elementId);
         
         if (stickyNote && element && stickyNote.type === 'sticky-note') {
           // Update sticky note
           const updatedStickyNote = {
             ...stickyNote,
             childElementIds: (stickyNote.childElementIds || []).filter(id => id !== elementId)
           };
           state.elements.set(stickyNoteId, updatedStickyNote);

           // Update element to remove parent reference
           const updatedElement = {
             ...element,
             parentId: undefined,
             stickyNoteId: undefined
           };
           state.elements.set(elementId, updatedElement);
         }
       });
       get().addToHistory('removeElementFromStickyNote');
     },

     findStickyNoteAtPoint: (point) => {
       const { elements } = get();
       console.log('🔍 [findStickyNoteAtPoint] Searching for sticky note at point:', point);
       
       for (const [id, element] of elements) {
         if (element.type === 'sticky-note' && element.isContainer) {
           const withinBounds = point.x >= element.x && 
                               point.x <= element.x + element.width &&
                               point.y >= element.y && 
                               point.y <= element.y + element.height;
           
           console.log('🔍 [findStickyNoteAtPoint] Checking sticky note:', {
             id,
             point,
             elementBounds: { x: element.x, y: element.y, width: element.width, height: element.height },
             withinBounds,
             isContainer: element.isContainer
           });
           
           if (withinBounds) {
             console.log('✅ [findStickyNoteAtPoint] Found sticky note container:', id);
             return id as ElementId;
           }
         }
       }
       
       console.log('❌ [findStickyNoteAtPoint] No sticky note container found at point');
       return null;
     },

     isStickyNoteContainer: (stickyNoteId) => {
       const { elements } = get();
       const stickyNote = elements.get(stickyNoteId);
       return stickyNote?.type === 'sticky-note' && stickyNote.isContainer === true;
     },

     getStickyNoteChildren: (stickyNoteId) => {
       const { elements } = get();
       const stickyNote = elements.get(stickyNoteId);
       if (stickyNote?.type === 'sticky-note' && stickyNote.childElementIds) {
         return stickyNote.childElementIds
           .map(id => elements.get(id))
           .filter(Boolean) as CanvasElement[];
       }
       return [];
     },

     constrainElementToStickyNote: (elementId, stickyNoteId) => {
       set(state => {
         const stickyNote = state.elements.get(stickyNoteId);
         const element = state.elements.get(elementId);
         
         if (stickyNote && element && stickyNote.type === 'sticky-note' && stickyNote.clipChildren) {
           const padding = 10; // Leave some padding from edges
           
           // Constrain position to sticky note bounds
           const constrainedX = Math.max(
             stickyNote.x + padding,
             Math.min(element.x, stickyNote.x + stickyNote.width - (element.width || 0) - padding)
           );
           
           const constrainedY = Math.max(
             stickyNote.y + padding,
             Math.min(element.y, stickyNote.y + stickyNote.height - (element.height || 0) - padding)
           );

           if (constrainedX !== element.x || constrainedY !== element.y) {
             const updatedElement = {
               ...element,
               x: constrainedX,
               y: constrainedY
             };
             state.elements.set(elementId, updatedElement);
           }
         }
       });
     },

           clearStickyNoteChildren: (stickyNoteId) => {
        const { getStickyNoteChildren, removeElementFromStickyNote } = get();
        const children = getStickyNoteChildren(stickyNoteId);
        
        children.forEach(child => {
          removeElementFromStickyNote(child.id, stickyNoteId);
        });
        
        get().addToHistory('clearStickyNoteChildren');
      },

      // Demo function for sticky note containers
      createStickyNoteContainerDemo: () => {
        const { addElement, enableStickyNoteContainer, addElementToStickyNote } = get();
        
        console.log('✨ [Demo] Creating sticky note container demo...');
        
        // Create a sticky note
        const stickyNote: StickyNoteElement = {
          id: nanoid() as ElementId,
          type: 'sticky-note',
          x: 200,
          y: 150,
          width: 300,
          height: 250,
          text: 'Container Demo\n\nTry drawing on this sticky note!',
          backgroundColor: '#FFF2CC',
          textColor: '#1F2937',
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          isContainer: true,
          childElementIds: [],
          allowedChildTypes: ['pen', 'marker', 'highlighter', 'washi-tape', 'text', 'connector', 'image', 'table'],
          clipChildren: true,
          maxChildElements: 10,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false
        };
        
        addElement(stickyNote);
        
        console.log('✨ [Demo] Created sticky note container:', {
          id: stickyNote.id,
          position: { x: stickyNote.x, y: stickyNote.y },
          size: { width: stickyNote.width, height: stickyNote.height },
          isContainer: stickyNote.isContainer,
          allowedTypes: stickyNote.allowedChildTypes
        });
        
        // Test the detection
        setTimeout(() => {
          const testPoint = { x: 350, y: 275 }; // Center of sticky note
          const foundStickyNote = get().findStickyNoteAtPoint(testPoint);
          console.log('🧪 [Demo] Testing detection at center point:', testPoint, 'Found:', foundStickyNote);
        }, 100);
        
        // Add to window for easy debugging
        if (typeof window !== 'undefined') {
          (window as any).testStickyNote = {
            id: stickyNote.id,
            testPoint: (x: number, y: number) => {
              const found = get().findStickyNoteAtPoint({ x, y });
              console.log(`🧪 Testing point (${x}, ${y}):`, found ? `Found ${found}` : 'Not found');
              return found;
            },
            listStickyNotes: () => {
              const { elements } = get();
              const stickyNotes = Array.from(elements.values()).filter(el => el.type === 'sticky-note');
              console.log('📋 All sticky notes:', stickyNotes.map(sn => ({
                id: sn.id,
                x: sn.x, y: sn.y, width: sn.width, height: sn.height,
                isContainer: (sn as any).isContainer
              })));
              return stickyNotes;
            }
          };
          console.log('🧪 [Debug] Added window.testStickyNote with helper functions');
          console.log('🧪 Try: window.testStickyNote.testPoint(350, 275)');
          console.log('🧪 Try: window.testStickyNote.listStickyNotes()');
        }
        
        return stickyNote.id;
      },
    
    // #endregion
  };
};

export const useUnifiedCanvasStore = create<UnifiedCanvasStore>()(
  subscribeWithSelector(
    immer(createCanvasStoreSlice)
  )
);

// Add debugging to detect infinite loops
if (process.env.NODE_ENV === 'development') {
  let renderCount = 0;
  const originalSubscribe = useUnifiedCanvasStore.subscribe;
  
  useUnifiedCanvasStore.subscribe = (listener) => {
    return originalSubscribe((state, prevState) => {
      renderCount++;
      if (renderCount > 100) {
        console.error('⚠️ [STORE] Potential infinite loop detected! Render count:', renderCount);
        renderCount = 0; // Reset to prevent spam
      }
      listener(state, prevState);
    });
  };
}

function getElementCenter(element: CanvasElement): { x: number; y: number } {
  const width = element.width ?? 0;
  const height = element.height ?? 0;
  return {
    x: element.x + width / 2,
    y: element.y + height / 2,
  };
}

// Cached selectors to prevent infinite loops
const elementsSelector = (state: UnifiedCanvasState) => state.elements;
const selectedElementIdsSelector = (state: UnifiedCanvasState) => state.selectedElementIds;
const selectedToolSelector = (state: UnifiedCanvasState) => state.selectedTool;
const viewportSelector = (state: UnifiedCanvasState) => state.viewport;
const isDrawingSelector = (state: UnifiedCanvasState) => state.isDrawing;
const draftSectionSelector = (state: UnifiedCanvasState) => state.draftSection;
const sectionsSelector = (state: UnifiedCanvasState) => state.sections;
const canUndoSelector = (state: UnifiedCanvasState) => state.canUndo;
const canRedoSelector = (state: UnifiedCanvasState) => state.canRedo;
const penColorSelector = (state: UnifiedCanvasState) => state.penColor;

export const canvasSelectors = {
  elements: elementsSelector,
  elementById: (id: ElementId) => (state: UnifiedCanvasState) => state.elements.get(id),
  selectedElementIds: selectedElementIdsSelector,
  selectedElements: (state: UnifiedCanvasState) =>
    Array.from(state.selectedElementIds)
      .map(id => state.elements.get(id))
      .filter(Boolean) as CanvasElement[],
  selectedTool: selectedToolSelector,
  viewport: viewportSelector,
  isDrawing: isDrawingSelector,
  draftSection: draftSectionSelector,
  sections: sectionsSelector,
  canUndo: canUndoSelector,
  canRedo: canRedoSelector,
  lastSelectedElement: (state: UnifiedCanvasState) => 
    state.lastSelectedElementId ? state.elements.get(state.lastSelectedElementId) : null,
  penColor: penColorSelector,
};

export const useSelectedElements = () => useUnifiedCanvasStore(canvasSelectors.selectedElements);
export const useSelectedTool = () => useUnifiedCanvasStore(canvasSelectors.selectedTool);
export const usePenColor = () => useUnifiedCanvasStore(canvasSelectors.penColor);

logger.debug('[Store] Unified Canvas Store initialized with Immer fixes');

// Expose demo function to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).createStickyNoteDemo = () => {
    const store = useUnifiedCanvasStore.getState();
    return store.createStickyNoteContainerDemo();
  };
  (window as any).useUnifiedCanvasStore = useUnifiedCanvasStore;
  console.log('🧪 [Debug] Added window.createStickyNoteDemo() function');
  console.log('🧪 [Debug] Added window.useUnifiedCanvasStore for debugging');
}
