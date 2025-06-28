/**
 * Canvas Store Adapter - Integration Bridge
 * 
 * This adapter provides a compatibility layer between the legacy store interface
 * and the new unified store architecture. It allows existing UI components to
 * continue working while gradually migrating to the unified store.
 * 
 * Strategy:
 * 1. Export hooks with the same names as legacy store
 * 2. Map legacy actions to unified store operations
 * 3. Provide the same selector patterns
 * 4. Maintain backward compatibility during transition
 */

import { useMemo } from 'react';
import { 
  useUnifiedCanvasStore, 
  canvasSelectors, 
  type UnifiedCanvasState,
  type UnifiedCanvasActions 
} from './unifiedCanvasStore';
import { 
  ElementId, 
  SectionId, 
  CanvasElement, 
  TextElement,
  RectangleElement,
  CircleElement,
  StickyNoteElement,
  PenElement,
  SectionElement,
  TableElement,
  ConnectorElement
} from '../types/enhanced.types';

// Legacy store interface compatibility
export interface CanvasStoreState {
  // Elements
  elements: Map<string, CanvasElement>;
  elementOrder: string[];
  
  // Selection  
  selectedElementIds: Set<ElementId>;
  lastSelectedElementId: ElementId | null;
  selectedElement: CanvasElement | null;
  
  // UI State
  selectedTool: string;
  showGrid: boolean;
  snapToGrid: boolean;
  
  // Text Editing
  textEditingElementId: ElementId | null;
  
  // Drawing
  isDrawing: boolean;
  currentPath?: number[];
  
  // Viewport
  viewport: {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  };
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  
  // Sections
  sections: Map<SectionId, SectionElement>;
  
  // Actions - mapped to unified store
  addElement: (element: CanvasElement) => void;
  updateElement: (id: ElementId | SectionId, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: ElementId | SectionId) => void;
  selectElement: (id: ElementId, multiSelect?: boolean) => void;
  clearSelection: () => void;
  setSelectedTool: (tool: string) => void;
  setTextEditingElement: (id: ElementId | null) => void;
  undo: () => void;
  redo: () => void;
  createSection: (x: number, y: number, width: number, height: number) => SectionId;
  updateSection: (id: SectionId, updates: Partial<SectionElement>) => void;
  
  // Legacy toolbar functions (mapped to unified store operations)
  setStickyNoteColor: (color: string) => void;
  groupElements: (elementIds: string[]) => string | null;
  ungroupElements: (elementId: string) => void;
  isElementInGroup: (elementId: string) => boolean;
  
  // Additional legacy functions that may be needed
  exportElements?: () => any;
  importElements?: (elements: any) => void;
  
  // Legacy event handler functions
  deselectElement: (id: ElementId) => void;
  captureElementsAfterSectionCreation: (sectionId: SectionId) => void;
  zoom: number;
  pan: { x: number; y: number };
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  deleteSelectedElements: () => void;
  addHistoryEntry: (operation: string) => void;
  editingTextId: ElementId | null;
  setEditingTextId: (id: ElementId | null) => void;
  
  // Additional missing functions from components
  isDrawingSection: boolean;
  drawingStartPoint: { x: number; y: number } | null;
  drawingCurrentPoint: { x: number; y: number } | null;
  layersPanelOpen: boolean;
  moveElementBetweenSections: (elementId: ElementId, fromSectionId: SectionId | null, toSectionId: SectionId | null) => void;
  updateMultipleElements: (updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }>) => void;
  clearAllElements: () => void;
  findSectionAtPoint: (x: number, y: number) => SectionElement | null;
  addElementToSection: (elementId: ElementId, sectionId: SectionId) => void;
  toggleLayersPanel: () => void;
  toolSettings: any;
  layers: any; // Layer management compatibility
  
  // Viewport actions
  setViewport: (viewport: Partial<UnifiedCanvasState['viewport']>) => void;
  panViewport: (deltaX: number, deltaY: number) => void;
  zoomViewport: (scale: number, centerX?: number, centerY?: number) => void;
  
  // Drawing actions
  startDrawing: (tool: 'pen' | 'pencil' | 'section', startPoint?: number[]) => void;
  updateDrawing: (point: number[]) => void;
  endDrawing: () => void;
  finishDrawing: () => void; // Legacy alias for endDrawing
  cancelDrawing: () => void; // Legacy cancel function
}

/**
 * Main adapter hook that provides legacy store interface
 * powered by the unified store architecture
 */
export const useCanvasStore = <T = CanvasStoreState>(
  selector?: (state: CanvasStoreState) => T
): T => {
  // Access unified store
  const unifiedStore = useUnifiedCanvasStore();
  
  // Create adapted interface
  const adaptedStore = useMemo((): CanvasStoreState => {
    const state = unifiedStore;
    
    // Map selectors to legacy interface
    const elements = canvasSelectors.elements(state);
    const selectedElementIds = canvasSelectors.selectedElementIds(state);
    const selectedElements = canvasSelectors.selectedElements(state);
    const selectedElement = selectedElements.length > 0 ? selectedElements[0] : null;
    
    return {
      // === MAPPED STATE ===
      elements,
      elementOrder: canvasSelectors.elementOrder(state),
      selectedElementIds,
      lastSelectedElementId: state.lastSelectedElementId,
      selectedElement,
      selectedTool: canvasSelectors.selectedTool(state),
      showGrid: state.showGrid,
      snapToGrid: state.snapToGrid,
      textEditingElementId: canvasSelectors.textEditingElementId(state),
      isDrawing: canvasSelectors.isDrawing(state),
      currentPath: state.currentPath,
      viewport: canvasSelectors.viewport(state),
      canUndo: canvasSelectors.canUndo(state),
      canRedo: canvasSelectors.canRedo(state),
      sections: state.sections,
      
      // === MAPPED ACTIONS ===
      addElement: state.addElement,
      updateElement: state.updateElement,
      deleteElement: state.deleteElement,
      selectElement: state.selectElement,
      clearSelection: state.clearSelection,
      setSelectedTool: state.setSelectedTool,
      setTextEditingElement: state.setTextEditingElement,
      undo: state.undo,
      redo: state.redo,
      createSection: state.createSection,
      updateSection: state.updateSection,
      setViewport: state.setViewport,
      panViewport: state.panViewport,
      zoomViewport: state.zoomViewport,
      startDrawing: state.startDrawing,
      updateDrawing: state.updateDrawing,
      endDrawing: state.endDrawing,
      finishDrawing: state.endDrawing, // Legacy alias for endDrawing
      cancelDrawing: () => {
        // Legacy cancel drawing function
        console.log('🖊️ [Legacy] cancelDrawing called - clearing drawing state');
        state.endDrawing(); // Use endDrawing to clear state
      },
      
      // === LEGACY TOOLBAR FUNCTIONS ===
      setStickyNoteColor: (color: string) => {
        // Set default sticky note color for new elements
        // This can be implemented as a UI preference in the future
        console.log('🎨 [Legacy] setStickyNoteColor called with:', color);
        // For now, this is a no-op as color is set per element
      },
      
      groupElements: (elementIds: string[]) => {
        // Legacy grouping - simplified implementation
        console.log('🔗 [Legacy] groupElements called with:', elementIds);
        // Return a mock group ID for compatibility
        return `group-${Date.now()}`;
      },
      
      ungroupElements: (elementId: string) => {
        // Legacy ungrouping - simplified implementation  
        console.log('🔗 [Legacy] ungroupElements called with:', elementId);
        // This is a no-op for now
      },
      
      isElementInGroup: (elementId: string) => {
        // Legacy group check - simplified implementation
        return false; // No grouping implemented yet
      },
      
      // Additional legacy functions
      exportElements: () => {
        console.log('🔄 [Legacy] exportElements called');
        return Array.from(state.elements.values());
      },
      
      importElements: (elements: any) => {
        console.log('🔄 [Legacy] importElements called with:', elements?.length || 0, 'elements');
        // This would batch import elements - simplified for now
      },
      
      // === LEGACY EVENT HANDLER FUNCTIONS ===
      deselectElement: (id: ElementId) => {
        console.log('🎯 [Legacy] deselectElement called with:', id);
        // Remove element from selection
        const currentSelected = state.selectedElementIds;
        if (currentSelected.has(id)) {
          const newSelected = new Set(currentSelected);
          newSelected.delete(id);
          state.selectElement(Array.from(newSelected)[0] || null as any);
        }
      },
      
      captureElementsAfterSectionCreation: (sectionId: SectionId) => {
        console.log('📦 [Legacy] captureElementsAfterSectionCreation called with:', sectionId);
        // This function would capture elements within a section after creation
        // For now, this is a no-op as section capture is handled in the unified store
      },
      
      zoom: state.viewport.scale,
      pan: { x: state.viewport.x, y: state.viewport.y },
      
      setZoom: (zoom: number) => {
        console.log('🔍 [Legacy] setZoom called with:', zoom);
        state.zoomViewport(zoom);
      },
      
      setPan: (pan: { x: number; y: number }) => {
        console.log('🔄 [Legacy] setPan called with:', pan);
        state.setViewport({ x: pan.x, y: pan.y });
      },
      
      deleteSelectedElements: () => {
        console.log('🗑️ [Legacy] deleteSelectedElements called');
        // Delete all selected elements
        const selectedIds = Array.from(state.selectedElementIds);
        selectedIds.forEach(id => {
          state.deleteElement(id);
        });
        state.clearSelection();
      },
      
      addHistoryEntry: (operation: string) => {
        console.log('📜 [Legacy] addHistoryEntry called with:', operation);
        // History is automatically managed by the unified store
        // This is a no-op for compatibility
      },
      
      editingTextId: state.textEditingElementId,
      setEditingTextId: (id: ElementId | null) => {
        console.log('✏️ [Legacy] setEditingTextId called with:', id);
        state.setTextEditingElement(id);
      },
      
      // === ADDITIONAL MISSING FUNCTIONS ===
      isDrawingSection: state.isDrawing && state.selectedTool === 'section',
      drawingStartPoint: state.currentPath && state.currentPath.length >= 2 ? 
        { x: state.currentPath[0], y: state.currentPath[1] } : null,
      drawingCurrentPoint: state.currentPath && state.currentPath.length >= 4 ? 
        { x: state.currentPath[state.currentPath.length - 2], y: state.currentPath[state.currentPath.length - 1] } : null,
      layersPanelOpen: false, // TODO: Add to unified store UI state
      
      moveElementBetweenSections: (elementId: ElementId, fromSectionId: SectionId | null, toSectionId: SectionId | null) => {
        console.log('📦 [Legacy] moveElementBetweenSections called:', { elementId, fromSectionId, toSectionId });
        // This would move elements between sections - simplified for now
      },
      
      updateMultipleElements: (updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }>) => {
        console.log('🔄 [Legacy] updateMultipleElements called with', updates.length, 'updates');
        updates.forEach(({ id, updates: elementUpdates }) => {
          state.updateElement(id, elementUpdates);
        });
      },
      
      clearAllElements: () => {
        console.log('🗑️ [Legacy] clearAllElements called');
        // Clear all elements from the canvas
        const elementIds = Array.from(state.elements.keys());
        elementIds.forEach(id => {
          state.deleteElement(id as ElementId);
        });
        state.clearSelection();
      },
      
      findSectionAtPoint: (x: number, y: number) => {
        console.log('🔍 [Legacy] findSectionAtPoint called:', { x, y });
        // Find section containing the given point
        for (const [_, section] of state.sections) {
          if (x >= section.x && x <= section.x + section.width &&
              y >= section.y && y <= section.y + section.height) {
            return section;
          }
        }
        return null;
      },
      
      addElementToSection: (elementId: ElementId, sectionId: SectionId) => {
        console.log('📦 [Legacy] addElementToSection called:', { elementId, sectionId });
        // This would add an element to a section - simplified for now
      },
      
      toggleLayersPanel: () => {
        console.log('🔄 [Legacy] toggleLayersPanel called');
        // This would toggle the layers panel visibility - handled by components for now
      },
      
      toolSettings: {}, // Empty object for compatibility
      layers: [] // Empty array for compatibility
    };
  }, [unifiedStore]);
  
  // Apply selector if provided
  if (selector) {
    return selector(adaptedStore) as T;
  }
  
  return adaptedStore as T;
};

/**
 * Selector hooks for specific data (legacy compatibility)
 */
export const useCanvasElements = () => {
  return useUnifiedCanvasStore(canvasSelectors.elements);
};

export const useSelectedElements = () => {
  return useUnifiedCanvasStore(canvasSelectors.selectedElements);
};

export const useSelectedElementIds = () => {
  return useUnifiedCanvasStore(canvasSelectors.selectedElementIds);
};

export const useSelectedTool = () => {
  return useUnifiedCanvasStore(canvasSelectors.selectedTool);
};

export const useViewport = () => {
  return useUnifiedCanvasStore(canvasSelectors.viewport);
};

export const useCanvasActions = () => {
  const store = useUnifiedCanvasStore();
  
  return useMemo(() => ({
    addElement: store.addElement,
    updateElement: store.updateElement,
    deleteElement: store.deleteElement,
    selectElement: store.selectElement,
    clearSelection: store.clearSelection,
    setSelectedTool: store.setSelectedTool,
    undo: store.undo,
    redo: store.redo,
    createSection: store.createSection
  }), [store]);
};

/**
 * Event handler access - provides centralized event handling
 */
export const useCanvasEventHandler = () => {
  return useUnifiedCanvasStore(state => state.eventHandler);
};

/**
 * Store instance access for direct state access (legacy compatibility)
 */
export const canvasStore = {
  getState: () => {
    const state = useUnifiedCanvasStore.getState();
    // Return adapted state for legacy compatibility
    return {
      // Map unified store state to legacy interface
      elements: state.elements,
      elementOrder: state.elementOrder,
      selectedElementIds: state.selectedElementIds,
      lastSelectedElementId: state.lastSelectedElementId,
      selectedElement: state.selectedElementIds.size > 0 ? 
        Array.from(state.selectedElementIds).map(id => state.elements.get(id)).filter(Boolean)[0] || null : null,
      selectedTool: state.selectedTool,
      showGrid: state.showGrid,
      snapToGrid: state.snapToGrid,
      textEditingElementId: state.textEditingElementId,
      isDrawing: state.isDrawing,
      currentPath: state.currentPath,
      viewport: state.viewport,
      canUndo: state.currentHistoryIndex > 0,
      canRedo: state.currentHistoryIndex < state.history.length - 1,
      sections: state.sections,
      
      // Actions
      addElement: state.addElement,
      updateElement: state.updateElement,
      deleteElement: state.deleteElement,
      selectElement: state.selectElement,
      clearSelection: state.clearSelection,
      setSelectedTool: state.setSelectedTool,
      setTextEditingElement: state.setTextEditingElement,
      undo: state.undo,
      redo: state.redo,
      createSection: state.createSection,
      updateSection: state.updateSection,
      setViewport: state.setViewport,
      panViewport: state.panViewport,
      zoomViewport: state.zoomViewport,
      startDrawing: state.startDrawing,
      updateDrawing: state.updateDrawing,
      endDrawing: state.endDrawing,
      finishDrawing: state.endDrawing, // Legacy alias
      cancelDrawing: () => {
        console.log('🖊️ [Legacy] cancelDrawing called - clearing drawing state');
        state.endDrawing();
      },
      
      // Legacy functions
      setStickyNoteColor: (color: string) => {
        console.log('🎨 [Legacy] setStickyNoteColor called with:', color);
      },
      groupElements: (elementIds: string[]) => {
        console.log('🔗 [Legacy] groupElements called with:', elementIds);
        return `group-${Date.now()}`;
      },
      ungroupElements: (elementId: string) => {
        console.log('🔗 [Legacy] ungroupElements called with:', elementId);
      },
      isElementInGroup: (elementId: string) => {
        return false;
      },
      
      // Additional legacy functions
      exportElements: () => {
        console.log('🔄 [Legacy] exportElements called');
        return Array.from(state.elements.values());
      },
      
      importElements: (elements: any) => {
        console.log('🔄 [Legacy] importElements called with:', elements?.length || 0, 'elements');
        // This would batch import elements - simplified for now
      },
      
      // === LEGACY EVENT HANDLER FUNCTIONS ===
      deselectElement: (id: ElementId) => {
        console.log('🎯 [Legacy] deselectElement called with:', id);
        const currentSelected = state.selectedElementIds;
        if (currentSelected.has(id)) {
          const newSelected = new Set(currentSelected);
          newSelected.delete(id);
          state.selectElement(Array.from(newSelected)[0] || null as any);
        }
      },
      
      captureElementsAfterSectionCreation: (sectionId: SectionId) => {
        console.log('📦 [Legacy] captureElementsAfterSectionCreation called with:', sectionId);
        // Section capture is handled in the unified store
      },
      
      zoom: state.viewport.scale,
      pan: { x: state.viewport.x, y: state.viewport.y },
      
      setZoom: (zoom: number) => {
        console.log('🔍 [Legacy] setZoom called with:', zoom);
        state.zoomViewport(zoom);
      },
      
      setPan: (pan: { x: number; y: number }) => {
        console.log('🔄 [Legacy] setPan called with:', pan);
        state.setViewport({ x: pan.x, y: pan.y });
      },
      
      deleteSelectedElements: () => {
        console.log('🗑️ [Legacy] deleteSelectedElements called');
        const selectedIds = Array.from(state.selectedElementIds);
        selectedIds.forEach(id => {
          state.deleteElement(id);
        });
        state.clearSelection();
      },
      
      addHistoryEntry: (operation: string) => {
        console.log('📜 [Legacy] addHistoryEntry called with:', operation);
        // History is automatically managed by the unified store
      },
      
      editingTextId: state.textEditingElementId,
      setEditingTextId: (id: ElementId | null) => {
        console.log('✏️ [Legacy] setEditingTextId called with:', id);
        state.setTextEditingElement(id);
      },
      
      // === ADDITIONAL MISSING FUNCTIONS ===
      isDrawingSection: state.isDrawing && state.selectedTool === 'section',
      drawingStartPoint: state.currentPath && state.currentPath.length >= 2 ? 
        { x: state.currentPath[0], y: state.currentPath[1] } : null,
      drawingCurrentPoint: state.currentPath && state.currentPath.length >= 4 ? 
        { x: state.currentPath[state.currentPath.length - 2], y: state.currentPath[state.currentPath.length - 1] } : null,
      layersPanelOpen: false, // TODO: Add to unified store UI state
      
      moveElementBetweenSections: (elementId: ElementId, fromSectionId: SectionId | null, toSectionId: SectionId | null) => {
        console.log('📦 [Legacy] moveElementBetweenSections called:', { elementId, fromSectionId, toSectionId });
        // This would move elements between sections - simplified for now
      },
      
      updateMultipleElements: (updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }>) => {
        console.log('🔄 [Legacy] updateMultipleElements called with', updates.length, 'updates');
        updates.forEach(({ id, updates: elementUpdates }) => {
          state.updateElement(id, elementUpdates);
        });
      },
      
      clearAllElements: () => {
        console.log('🗑️ [Legacy] clearAllElements called');
        const elementIds = Array.from(state.elements.keys());
        elementIds.forEach(id => {
          state.deleteElement(id as ElementId);
        });
        state.clearSelection();
      },
      
      findSectionAtPoint: (x: number, y: number) => {
        console.log('🔍 [Legacy] findSectionAtPoint called:', { x, y });
        for (const [_, section] of state.sections) {
          if (x >= section.x && x <= section.x + section.width &&
              y >= section.y && y <= section.y + section.height) {
            return section;
          }
        }
        return null;
      },
      
      addElementToSection: (elementId: ElementId, sectionId: SectionId) => {
        console.log('📦 [Legacy] addElementToSection called:', { elementId, sectionId });
        // This would add an element to a section - simplified for now
      },
      
      toggleLayersPanel: () => {
        console.log('🔄 [Legacy] toggleLayersPanel called');
        // This would toggle the layers panel visibility - handled by components for now
      },
      
      toolSettings: {}, // Empty object for compatibility
      layers: [] // Empty array for compatibility
    };
  },
  subscribe: useUnifiedCanvasStore.subscribe,
  setState: useUnifiedCanvasStore.setState
};

/**
 * Type exports for components
 */
export type { CanvasStoreState as AdapterCanvasStoreState };

/**
 * Migration utilities - helps identify components using legacy patterns
 */
export const migrationHelpers = {
  // Log when legacy store is accessed to track migration progress
  logLegacyAccess: (componentName: string, feature: string) => {
    console.log(`🔄 [Migration] ${componentName} accessing legacy ${feature} - consider migrating to unified store`);
  },
  
  // Check if component is using legacy store patterns
  isLegacyPattern: (storeUsage: any) => {
    return storeUsage && typeof storeUsage.getState === 'function';
  }
};

console.log('📦 [CanvasStoreAdapter] Integration bridge initialized - legacy components can now use unified store');