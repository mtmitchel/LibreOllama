// src/stores/canvasStore.ts
/**
 * Enhanced Canvas Store - Handles cross-slice operations
 * Resolves circular dependencies by implementing cross-slice logic at the combined store level
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { CoordinateService } from '../utils/coordinateService';

// Import the FIXED store slices for element containment
import { createCanvasElementsStore, type CanvasElementsState } from './slices/canvasElementsStore.fixed';
import { createSectionStore, type SectionState } from './slices/sectionStore.fixed';
// Import other slices as before
import { createTextEditingStore, type TextEditingState } from './slices/textEditingStore';
import { createSelectionStore, type SelectionState } from './slices/selectionStore';
import { createViewportStore, type ViewportState } from './slices/viewportStore';
import { createCanvasUIStore, type CanvasUIState } from './slices/canvasUIStore';
import { createCanvasHistoryStore, type CanvasHistoryState } from './slices/canvasHistoryStore';

// Combined store state
export interface CanvasStoreState extends 
  CanvasElementsState,
  TextEditingState,
  SelectionState,
  ViewportState,
  CanvasUIState,
  CanvasHistoryState,
  SectionState {
  // Enhanced methods for cross-slice operations
  findSectionAtPoint: (point: { x: number; y: number }) => string | null;
  handleElementDrop: (elementId: string, position: { x: number; y: number }) => void;
  captureElementsAfterSectionCreation: (sectionId: string) => void;
  updateElementCoordinatesOnSectionMove: (sectionId: string, deltaX: number, deltaY: number) => void;
  convertElementToAbsoluteCoordinates: (elementId: string) => void;
  convertElementToRelativeCoordinates: (elementId: string, sectionId: string) => void;
}

// Create the enhanced store with cross-slice operations
export const useCanvasStore = create<CanvasStoreState>()(
  subscribeWithSelector(
    immer(
      (set, get, api) => {
        // Create each slice
        const elementsSlice = createCanvasElementsStore(set as any, get as any, api as any);
        const sectionSlice = createSectionStore(set as any, get as any, api as any);
        const textEditingSlice = createTextEditingStore(set as any, get as any, api as any);
        const selectionSlice = createSelectionStore(set as any, get as any, api as any);
        const viewportSlice = createViewportStore(set as any, get as any, api as any);
        const uiSlice = createCanvasUIStore(set as any, get as any, api as any);
        const historySlice = createCanvasHistoryStore(set as any, get as any, api as any);

        // Return combined store with enhanced methods
        return {
          ...elementsSlice,
          ...textEditingSlice,
          ...selectionSlice,
          ...viewportSlice,
          ...uiSlice,
          ...historySlice,
          ...sectionSlice,          // Enhanced cross-slice methods
          findSectionAtPoint: (point: { x: number; y: number }) => {
            console.log('🔍 [CANVAS STORE] findSectionAtPoint called with:', point);
            
            const sections = get().getAllSections();
            const stage = get().stage;
            
            console.log('🔍 [CANVAS STORE] Debug info:', {
              sectionsType: typeof sections,
              sectionsIsArray: Array.isArray(sections),
              sectionsLength: sections ? sections.length : 'undefined',
              sectionsContent: sections,
              stageExists: !!stage
            });
            
            if (!Array.isArray(sections)) {
              console.error('❌ [CANVAS STORE] sections is not an array:', sections);
              return null;
            }
            
            return CoordinateService.findSectionAtPoint(point, sections, stage);
          },

          handleElementDrop: (elementId: string, position: { x: number; y: number }) => {
            console.log('🎯 [CANVAS STORE] handleElementDrop called:', { elementId, position });
            
            const targetSectionId = get().findSectionAtPoint(position);
            
            set((state: any) => {
              const element = state.elements[elementId];
              if (!element) {
                console.warn('❌ [CANVAS STORE] Element not found:', elementId);
                return;
              }

              const oldSectionId = element.sectionId;
              console.log('🔍 [CANVAS STORE] Element drop:', {
                elementId,
                oldSectionId,
                targetSectionId,
                position
              });              // If moving within the same section, just update its relative coordinates
              if (oldSectionId && oldSectionId === targetSectionId) {
                const section = state.sections[oldSectionId];
                if (section) {
                  const relativeX = position.x - section.x;
                  const relativeY = position.y - section.y;
                  element.x = relativeX;
                  element.y = relativeY;
                  console.log(`✅ [CANVAS STORE] Updated element ${elementId} position within section ${oldSectionId}`, {
                    sectionPosition: { x: section.x, y: section.y },
                    newRelativePosition: { x: relativeX, y: relativeY }
                  });
                }
                return; // Done
              }

              // If moving within canvas (no sections), just update absolute coordinates
              if (!oldSectionId && !targetSectionId) {
                element.x = position.x;
                element.y = position.y;
                console.log(`✅ [CANVAS STORE] Updated element ${elementId} position on canvas`, {
                  newPosition: { x: position.x, y: position.y }
                });
                return;
              }

              // Convert to absolute coordinates from old parent
              if (oldSectionId) {
                const oldSection = state.sections[oldSectionId];
                if (oldSection) {
                  element.x += oldSection.x;
                  element.y += oldSection.y;
                  console.log('📐 [CANVAS STORE] Converted to absolute coords from section:', {
                    oldSection: { x: oldSection.x, y: oldSection.y },
                    newCoords: { x: element.x, y: element.y }
                  });
                }
              }

              if (targetSectionId) {
                // Add to new section and convert to relative coordinates
                const targetSection = state.sections[targetSectionId];
                if (targetSection) {
                  element.x -= targetSection.x;
                  element.y -= targetSection.y;
                  element.sectionId = targetSectionId;
                  
                  // Update section's contained elements
                  get().addElementToSection(elementId, targetSectionId);
                  
                  console.log(`✅ [CANVAS STORE] Moved element ${elementId} to section ${targetSectionId}`, {
                    targetSection: { x: targetSection.x, y: targetSection.y },
                    relativeCoords: { x: element.x, y: element.y }
                  });
                }
              } else {
                // Dropped on canvas (no section)
                element.sectionId = undefined;
                if (oldSectionId) {
                  get().removeElementFromSection(elementId, oldSectionId);
                  console.log(`✅ [CANVAS STORE] Moved element ${elementId} from section ${oldSectionId} to canvas`);
                }
              }
            });
          },

          captureElementsAfterSectionCreation: (sectionId: string) => {
            const section = get().getSectionById(sectionId);
            if (!section) return;
            
            const elements = get().elements;
            const capturedElementIds: string[] = [];
            
            Object.entries(elements).forEach(([elementId, element]) => {
              // Skip if element is already in a section or is a text element
              if (element.sectionId || element.type === 'text') return;
              
              // Check if element is within section bounds
              const elementBounds = {
                x: element.x,
                y: element.y,
                width: element.width || 100,
                height: element.height || 100
              };
              
              const sectionBounds = {
                x: section.x,
                y: section.y,
                width: section.width,
                height: section.height
              };
              
              // Check for overlap
              if (elementBounds.x < sectionBounds.x + sectionBounds.width &&
                  elementBounds.x + elementBounds.width > sectionBounds.x &&
                  elementBounds.y < sectionBounds.y + sectionBounds.height &&
                  elementBounds.y + elementBounds.height > sectionBounds.y) {
                capturedElementIds.push(elementId);
              }
            });
            
            if (capturedElementIds.length > 0) {
              // Convert elements to relative coordinates and assign to section
              set((state: any) => {
                capturedElementIds.forEach(elementId => {
                  const element = state.elements[elementId];
                  if (element) {
                    element.x -= section.x;
                    element.y -= section.y;
                    element.sectionId = sectionId;
                  }
                });
              });
              
              // Update section to contain these elements
              get().captureElementsInSection(sectionId, capturedElementIds);
              console.log('✅ [CANVAS STORE] Captured', capturedElementIds.length, 'elements in new section:', sectionId);
            }
          },          updateElementCoordinatesOnSectionMove: (_sectionId: string, _deltaX: number, _deltaY: number) => {
            // Elements in sections use relative coordinates, so they move automatically with the group
            // This method is here for future extensibility
            console.log('ℹ️ [CANVAS STORE] Section moved, elements move automatically via Konva Group');
          },

          convertElementToAbsoluteCoordinates: (elementId: string) => {
            const element = get().getElementById(elementId);
            if (!element || !element.sectionId) return;
            
            const section = get().getSectionById(element.sectionId);
            if (!section) return;
            
            set((state: any) => {
              const elem = state.elements[elementId];
              if (elem) {
                elem.x += section.x;
                elem.y += section.y;
                elem.sectionId = undefined;
              }
            });
            
            console.log('✅ [CANVAS STORE] Converted element to absolute coordinates:', elementId);
          },

          convertElementToRelativeCoordinates: (elementId: string, sectionId: string) => {
            const element = get().getElementById(elementId);
            const section = get().getSectionById(sectionId);
            if (!element || !section) return;
            
            set((state: any) => {
              const elem = state.elements[elementId];
              if (elem) {
                elem.x -= section.x;
                elem.y -= section.y;
                elem.sectionId = sectionId;
              }
            });
            
            get().addElementToSection(elementId, sectionId);
            console.log('✅ [CANVAS STORE] Converted element to relative coordinates:', elementId, 'in section:', sectionId);
          }
        };
      }
    )
  )
);

// Individual hooks for each slice - for better performance and clarity
// Create stable selector functions to prevent infinite re-renders
const canvasElementsSelector = (state: CanvasStoreState) => ({
  elements: state.elements,
  elementOrder: state.elementOrder,
  addElement: state.addElement,
  updateElement: state.updateElement,
  updateMultipleElements: state.updateMultipleElements,
  deleteElement: state.deleteElement,
  deleteElements: state.deleteElements,  duplicateElement: state.duplicateElement,
  clearAllElements: state.clearAllElements,
  clearCanvas: state.clearCanvas,
  exportElements: state.exportElements,
  importElements: state.importElements,
  getElementById: state.getElementById,
  getElementsByType: state.getElementsByType,
  optimizeElement: state.optimizeElement,
  // Table operations - CRITICAL FIX: Expose table methods from main store
  updateTableCell: state.updateTableCell,
  addTableRow: state.addTableRow,
  addTableColumn: state.addTableColumn,
  removeTableRow: state.removeTableRow,
  removeTableColumn: state.removeTableColumn,
  resizeTableRow: state.resizeTableRow,
  resizeTableColumn: state.resizeTableColumn,
  resizeTable: state.resizeTable,
});

export const useCanvasElements = () => useCanvasStore(useShallow(canvasElementsSelector));

const drawingSelector = (state: CanvasStoreState) => ({
  isDrawing: state.isDrawing,
  currentPath: state.currentPath,
  drawingTool: state.drawingTool,
  startDrawing: state.startDrawing,
  updateDrawing: state.updateDrawing,
  finishDrawing: state.finishDrawing,
  cancelDrawing: state.cancelDrawing,
});

export const useDrawing = () => useCanvasStore(useShallow(drawingSelector));

const textEditingSelector = (state: CanvasStoreState) => ({
  editingTextId: state.editingTextId,
  isEditingText: state.isEditingText,
  textSelection: state.textSelection,
  currentTextFormat: state.currentTextFormat,
  textEditingMetrics: state.textEditingMetrics,
  setEditingTextId: state.setEditingTextId,
  setIsEditingText: state.setIsEditingText,
  updateElementText: state.updateElementText,
  insertTextAtCursor: state.insertTextAtCursor,
  deleteTextSelection: state.deleteTextSelection,
  applyTextFormat: state.applyTextFormat,
  clearTextFormat: state.clearTextFormat,
  getTextFormat: state.getTextFormat,
  setTextSelection: state.setTextSelection,
  clearTextSelection: state.clearTextSelection,
  selectAllText: state.selectAllText,
  validateRichTextElement: state.validateRichTextElement,
  optimizeRichTextSegments: state.optimizeRichTextSegments,
  mergeAdjacentSegments: state.mergeAdjacentSegments,
  recordTextEditingMetric: state.recordTextEditingMetric,
  getTextEditingPerformance: state.getTextEditingPerformance,
  resetTextEditingMetrics: state.resetTextEditingMetrics,
});

export const useTextEditing = () => useCanvasStore(useShallow(textEditingSelector));

const selectionSelector = (state: CanvasStoreState) => ({
  selectedElementIds: state.selectedElementIds,
  selectElement: state.selectElement,
  deselectElement: state.deselectElement,
  selectMultipleElements: state.selectMultipleElements,
  clearSelection: state.clearSelection,
  toggleElementSelection: state.toggleElementSelection,
});

export const useSelection = () => useCanvasStore(useShallow(selectionSelector));

const viewportSelector = (state: CanvasStoreState) => ({
  zoom: state.zoom,
  pan: state.pan,
  viewportSize: state.viewportSize,
  viewportBounds: state.viewportBounds,
  visibleElementIds: state.visibleElementIds,
  setZoom: state.setZoom,
  setPan: state.setPan,
  setViewportSize: state.setViewportSize,
  zoomIn: state.zoomIn,
  zoomOut: state.zoomOut,
  resetViewport: state.resetViewport,
  zoomToFit: state.zoomToFit,
  updateViewportBounds: state.updateViewportBounds,
  updateVisibleElements: state.updateVisibleElements,
  screenToCanvas: state.screenToCanvas,
  canvasToScreen: state.canvasToScreen,
});

export const useViewport = () => useCanvasStore(useShallow(viewportSelector));

const canvasUISelector = (state: CanvasStoreState) => ({
  selectedTool: state.selectedTool,
  availableTools: state.availableTools,
  toolGroups: state.toolGroups,
  leftSidebarOpen: state.leftSidebarOpen,
  rightSidebarOpen: state.rightSidebarOpen,
  bottomPanelOpen: state.bottomPanelOpen,
  propertiesPanelOpen: state.propertiesPanelOpen,
  layersPanelOpen: state.layersPanelOpen,
  panelSizes: state.panelSizes,
  cursorType: state.cursorType,
  customCursor: state.customCursor,
  hoveredElementId: state.hoveredElementId,
  hoveredToolId: state.hoveredToolId,
  hoveredUIComponent: state.hoveredUIComponent,
  activeModal: state.activeModal,
  modalStack: state.modalStack,
  overlayVisible: state.overlayVisible,
  activeTooltip: state.activeTooltip,
  tooltipQueue: state.tooltipQueue,
  contextMenu: state.contextMenu,
  loadingStates: state.loadingStates,
  globalLoading: state.globalLoading,
  notifications: state.notifications,
  uiMetrics: state.uiMetrics,
  setSelectedTool: state.setSelectedTool,
  getSelectedTool: state.getSelectedTool,
  getAvailableTools: state.getAvailableTools,
  addTool: state.addTool,
  removeTool: state.removeTool,
  toggleLeftSidebar: state.toggleLeftSidebar,
  toggleRightSidebar: state.toggleRightSidebar,
  toggleBottomPanel: state.toggleBottomPanel,
  togglePropertiesPanel: state.togglePropertiesPanel,
  toggleLayersPanel: state.toggleLayersPanel,
  setPanelSize: state.setPanelSize,
  setCursorType: state.setCursorType,
  resetCursor: state.resetCursor,
  setHoveredElement: state.setHoveredElement,
  setHoveredTool: state.setHoveredTool,
  setHoveredUIComponent: state.setHoveredUIComponent,
  clearAllHover: state.clearAllHover,
  showModal: state.showModal,
  hideModal: state.hideModal,
  hideAllModals: state.hideAllModals,
  getCurrentModal: state.getCurrentModal,
  showTooltip: state.showTooltip,
  hideTooltip: state.hideTooltip,
  hideAllTooltips: state.hideAllTooltips,
  showContextMenu: state.showContextMenu,
  hideContextMenu: state.hideContextMenu,
  setLoading: state.setLoading,
  setGlobalLoading: state.setGlobalLoading,
  isLoading: state.isLoading,
  showNotification: state.showNotification,
  hideNotification: state.hideNotification,
  clearAllNotifications: state.clearAllNotifications,
  getUIPerformance: state.getUIPerformance,
  resetUIMetrics: state.resetUIMetrics,
});

export const useCanvasUI = () => useCanvasStore(useShallow(canvasUISelector));

const canvasHistorySelector = (state: CanvasStoreState) => ({
  history: state.history,
  currentIndex: state.currentIndex,
  maxHistorySize: state.maxHistorySize,
  isGrouping: state.isGrouping,
  currentGroupId: state.currentGroupId,
  groupStartTime: state.groupStartTime,
  maxGroupDuration: state.maxGroupDuration,
  historyMetrics: state.historyMetrics,
  addHistoryEntry: state.addHistoryEntry,
  undo: state.undo,
  redo: state.redo,
  startHistoryGroup: state.startHistoryGroup,
  endHistoryGroup: state.endHistoryGroup,
  isInGroup: state.isInGroup,
  canUndo: state.canUndo,
  canRedo: state.canRedo,
  getHistoryLength: state.getHistoryLength,
  getCurrentHistoryEntry: state.getCurrentHistoryEntry,
  getHistoryPreview: state.getHistoryPreview,
  clearHistory: state.clearHistory,
  clearRedoHistory: state.clearRedoHistory,
  compactHistory: state.compactHistory,
  setMaxHistorySize: state.setMaxHistorySize,
  jumpToHistoryIndex: state.jumpToHistoryIndex,
  findHistoryEntry: state.findHistoryEntry,
  getHistoryStatistics: state.getHistoryStatistics,
  getHistoryPerformance: state.getHistoryPerformance,
  resetHistoryMetrics: state.resetHistoryMetrics,
  optimizeHistoryMemory: state.optimizeHistoryMemory,
});

export const useCanvasHistory = () => useCanvasStore(useShallow(canvasHistorySelector));

const sectionSelector = (state: CanvasStoreState) => ({
  sections: state.sections,
  sectionOrder: state.sectionOrder,
  createSection: state.createSection,
  captureElementsInSection: state.captureElementsInSection,
  updateSection: state.updateSection,
  deleteSection: state.deleteSection,
  duplicateSection: state.duplicateSection,
  addElementToSection: state.addElementToSection,
  removeElementFromSection: state.removeElementFromSection,
  moveElementBetweenSections: state.moveElementBetweenSections,
  getElementsInSection: state.getElementsInSection,
  getSectionForElement: state.getSectionForElement,
  handleSectionDragEnd: state.handleSectionDragEnd,
  resizeSection: state.resizeSection,
  getSectionById: state.getSectionById,
  getAllSections: state.getAllSections,
  clearAllSections: state.clearAllSections,
  isElementInAnySection: state.isElementInAnySection,
});

export const useSections = () => useCanvasStore(useShallow(sectionSelector));

// Enhanced store methods for cross-slice operations
const enhancedStoreSelector = (state: CanvasStoreState) => ({
  findSectionAtPoint: state.findSectionAtPoint,
  handleElementDrop: state.handleElementDrop,
  captureElementsAfterSectionCreation: state.captureElementsAfterSectionCreation,
  updateElementCoordinatesOnSectionMove: state.updateElementCoordinatesOnSectionMove,
  convertElementToAbsoluteCoordinates: state.convertElementToAbsoluteCoordinates,
  convertElementToRelativeCoordinates: state.convertElementToRelativeCoordinates,
});

export const useEnhancedStore = () => useCanvasStore(useShallow(enhancedStoreSelector));

// Main store export for direct access when needed
export default useCanvasStore;
