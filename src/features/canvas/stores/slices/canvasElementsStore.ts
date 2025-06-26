// src/stores/slices/canvasElementsStore.ts
/**
 * Canvas Elements Store - Handles element CRUD operations
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 * Updated to use Map<string, CanvasElement> for O(1) performance
 */

import { StateCreator } from 'zustand';
import { Draft } from 'immer';
import { enableMapSet } from 'immer';
import { logger } from '../../../../lib/logger';

// Enable Immer MapSet plugin for Map/Set support
enableMapSet();
import type { CanvasElement, SectionElement, GroupElement } from '../../types/enhanced.types';
import { ElementId, SectionId, GroupId } from '../../types/enhanced.types';
import { isCircleElement, isStarElement, isTextElement, isPenElement, isTableElement, isSectionElement, isConnectorElement, isTriangleElement, isRectangularElement, isGroupElement } from '../../types/enhanced.types';
import { PerformanceMonitor } from '../../utils/performance/PerformanceMonitor';

export interface CanvasElementsState {
  // Element data - Updated to use Map for O(1) operations
  elements: Map<string, CanvasElement>;
  elementOrder: string[];
  
  // Drawing state
  isDrawing: boolean;
  currentPath?: number[];
  drawingTool: 'pen' | 'pencil' | 'section' | null;
  
  // Element operations
  addElement: (element: CanvasElement) => void;
  updateElement: (id: ElementId, updates: Partial<CanvasElement>) => void;
  updateMultipleElements: (updates: Record<ElementId, Partial<CanvasElement>>) => void;
  deleteElement: (id: ElementId) => void;
  deleteElements: (ids: ElementId[]) => void;
  duplicateElement: (id: ElementId) => void;
  
  // Connector operations - NEW
  startConnector: (startPoint: { x: number; y: number }, subType?: 'line' | 'arrow' | 'straight' | 'bent' | 'curved') => ElementId;
  finishConnector: (connectorId: ElementId, endPoint: { x: number; y: number }) => void;
  updateConnectorPath: (connectorId: ElementId, startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) => void;
  attachConnectorToElement: (connectorId: ElementId, elementId: ElementId, isStart: boolean, anchorPoint?: string) => void;
  detachConnectorFromElement: (connectorId: ElementId, isStart: boolean) => void;
  getConnectorsForElement: (elementId: ElementId) => CanvasElement[];
  
  // Element management - NEW
  hideElement: (id: ElementId) => void;
  showElement: (id: ElementId) => void;
  lockElement: (id: ElementId) => void;
  unlockElement: (id: ElementId) => void;
  toggleElementVisibility: (id: ElementId) => void;
  toggleElementLock: (id: ElementId) => void;
  bulkUpdateElements: (elementIds: ElementId[], updates: Partial<CanvasElement>) => void;
  moveElementToPosition: (id: ElementId, x: number, y: number) => void;
  
  // Table operations - NEW
  updateTableCell: (tableId: ElementId, rowIndex: number, colIndex: number, updates: any) => void;
  addTableRow: (tableId: ElementId, insertIndex?: number) => void;
  addTableColumn: (tableId: ElementId, insertIndex?: number) => void;
  removeTableRow: (tableId: ElementId, rowIndex: number) => void;
  removeTableColumn: (tableId: ElementId, colIndex: number) => void;
  resizeTableRow: (tableId: ElementId, rowIndex: number, newHeight: number) => void;
  resizeTableColumn: (tableId: ElementId, colIndex: number, newWidth: number) => void;
  resizeTable: (tableId: ElementId, newWidth: number, newHeight: number) => void;
  
  // Drawing operations
  startDrawing: (x: number, y: number, tool: 'pen' | 'pencil' | 'section') => void;
  updateDrawing: (x: number, y: number) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  
  // Element queries
  getElementById: (id: ElementId) => CanvasElement | null;
  getElementsByType: (type: string) => CanvasElement[];
  getElementsByIds: (ids: ElementId[]) => CanvasElement[];
  getAllElements: () => CanvasElement[];
  
  // Group operations - NEW
  groupElements: (elementIds: ElementId[], groupName?: string) => ElementId;
  ungroupElements: (groupId: ElementId) => ElementId[];
  addElementToGroup: (groupId: ElementId, elementId: ElementId) => void;
  removeElementFromGroup: (groupId: ElementId, elementId: ElementId) => void;
  getGroupMembers: (groupId: ElementId) => ElementId[];
  isElementInGroup: (elementId: ElementId) => ElementId | null;
  updateGroupTransform: (groupId: ElementId, deltaX: number, deltaY: number, scaleX?: number, scaleY?: number) => void;
  calculateGroupBounds: (groupId: ElementId) => { x: number; y: number; width: number; height: number } | null;
  
  // Element utilities
  clearAllElements: () => void;
  clearCanvas: () => void; // Clears all elements and resets canvas state
  exportElements: () => CanvasElement[];
  importElements: (elements: CanvasElement[]) => void;
  validateElement: (element: CanvasElement) => boolean;
  optimizeElement: (id: ElementId) => void;
  handleElementDrop: (elementId: ElementId, position: { x: number; y: number }) => void;
}

export const createCanvasElementsStore: StateCreator<
  CanvasElementsState,
  [['zustand/immer', never]],
  [],
  CanvasElementsState
> = (set, get) => ({
  // Initial state - Using Map for O(1) performance
  elements: new Map(),
  elementOrder: [],
  
  // Drawing state
  isDrawing: false,
  currentPath: undefined,
  drawingTool: null,
  
  // Element operations with performance monitoring
  addElement: (element: CanvasElement) => {
    const endTiming = PerformanceMonitor.startTiming('addElement');
    
    try {
      logger.log('🔧 [ELEMENTS STORE] Adding element:', element.id, element.type);
      logger.log('🔧 [ELEMENTS STORE] Element details:', JSON.stringify(element, null, 2));
      
      // Validate element before adding (outside of set function)
      if (!get().validateElement(element)) {
        console.error('🔧 [ELEMENTS STORE] Invalid element rejected:', element);
        return;
      }
      
      set((state: Draft<CanvasElementsState>) => {
        // Ensure createdAt and updatedAt are set
        const elementWithTimestamps = {
          ...element,
          createdAt: element.createdAt || Date.now(),
          updatedAt: element.updatedAt || Date.now()
        };
        state.elements.set(element.id as string, elementWithTimestamps);
        if (!state.elementOrder.includes(element.id as string)) {
          state.elementOrder.push(element.id as string);
        }
        logger.log('✅ [ELEMENTS STORE] Element added successfully:', element.id);
        logger.log('🔧 [ELEMENTS STORE] Total elements after add:', state.elements.size);
      });
      
      PerformanceMonitor.recordMetric('elementAdded', 1, 'canvas', { elementType: element.type });
    } finally {
      endTiming();
    }
  },
  
  updateElement: (id: ElementId, updates: Partial<CanvasElement>) => {
    const endTiming = PerformanceMonitor.startTiming('updateElement');
    
    try {
      logger.log('🔧 [ELEMENTS STORE] Updating element:', id, updates);
      logger.log('🔧 [ELEMENTS STORE] Current elements in store:', Array.from(get().elements.keys()));
        set((state: Draft<CanvasElementsState>) => {
        const element = state.elements.get(id as string);
        if (!element) {
          const errorMsg = `Element not found for update: ${id}. Available elements: ${Array.from(state.elements.keys()).join(', ')}`;
          console.error('🔧 [ELEMENTS STORE]', errorMsg);
          throw new Error(errorMsg);
        }
        
        // Use a type guard to safely handle text element updates
        if (isTextElement(element) && 'text' in updates && typeof updates.text === 'string') {
          const trimmedText = updates.text.trim();
          if (trimmedText.length === 0) {
            console.warn('🔧 [ELEMENTS STORE] Preventing whitespace-only text update for element:', id);
            updates.text = 'Text'; // Use default text instead
          }
        }
        
        // Apply updates with proper type handling
        const updatedElement = { 
          ...element, 
          ...updates,
          updatedAt: Date.now() 
        } as CanvasElement;
        state.elements.set(id as string, updatedElement);
        logger.log('✅ [ELEMENTS STORE] Element updated successfully:', id);
      });
      
      PerformanceMonitor.recordMetric('elementUpdated', 1, 'canvas', { elementType: get().elements.get(id as string)?.type });
    } finally {
      endTiming();
    }
  },

  updateMultipleElements: (updates: Record<ElementId, Partial<CanvasElement>>) => {
    const endTiming = PerformanceMonitor.startTiming('updateMultipleElements');
    
    try {
      logger.log('🔧 [ELEMENTS STORE] Updating multiple elements:', Object.keys(updates));
      
      set((state: Draft<CanvasElementsState>) => {
        Object.entries(updates).forEach(([id, elementUpdates]) => {
          const element = state.elements.get(id as string);
          if (element) {
            // Type-safe update that preserves discriminated union integrity
            const updatedElement = { 
              ...element, 
              ...elementUpdates,
              updatedAt: Date.now()
            } as CanvasElement;
            state.elements.set(id as string, updatedElement);
          }
        });
      });
      
      PerformanceMonitor.recordMetric('multipleElementsUpdated', Object.keys(updates).length, 'canvas');
    } finally {
      endTiming();
    }
  },

  deleteElement: (id: ElementId) => {
    const endTiming = PerformanceMonitor.startTiming('deleteElement');
    
    try {
      const element = get().elements.get(id as string);
      if (!element) {
        console.warn('🔧 [ELEMENTS STORE] Element not found for deletion:', id);
        return;
      }

      set((state: Draft<CanvasElementsState>) => {
        state.elements.delete(id as string);
        state.elementOrder = state.elementOrder.filter(elementId => elementId !== (id as string));
      });
      
      PerformanceMonitor.recordMetric('elementDeleted', 1, 'canvas', { elementType: element.type });
      logger.log('✅ [ELEMENTS STORE] Element deleted successfully:', id);
    } finally {
      endTiming();
    }
  },

  deleteElements: (ids: ElementId[]) => {
    const endTiming = PerformanceMonitor.startTiming('deleteElements');
    
    try {
      logger.log('🔧 [ELEMENTS STORE] Deleting multiple elements:', ids);
      
      set((state: Draft<CanvasElementsState>) => {
        ids.forEach(id => {
          state.elements.delete(id as string);
        });
        state.elementOrder = state.elementOrder.filter(elementId => !ids.includes(elementId as ElementId));
      });
      
      PerformanceMonitor.recordMetric('elementsDeleted', ids.length, 'canvas');
    } finally {
      endTiming();
    }
  },

  duplicateElement: (id: ElementId) => {
    const endTiming = PerformanceMonitor.startTiming('duplicateElement');
    
    try {
      const element = get().elements.get(id as string);
      if (!element) {
        console.warn('🔧 [ELEMENTS STORE] Element not found for duplication:', id);
        return;
      }

      let duplicatedElement: CanvasElement;
      
      if (element.type === 'section') {
        // Handle section elements with SectionId
        duplicatedElement = {
          ...element,
          id: SectionId(`${element.id}_copy_${Date.now()}`),
          x: element.x + 10,
          y: element.y + 10,
          createdAt: Date.now(),
          updatedAt: Date.now()
        } as SectionElement;
      } else {
        // Handle regular elements with ElementId
        duplicatedElement = {
          ...element,
          id: ElementId(`${element.id}_copy_${Date.now()}`),
          x: element.x + 10,
          y: element.y + 10,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }
      
      get().addElement(duplicatedElement);
      
      PerformanceMonitor.recordMetric('elementDuplicated', 1, 'canvas', { elementType: element.type });
      logger.log('✅ [ELEMENTS STORE] Element duplicated successfully:', id, '→', duplicatedElement.id);
    } finally {
      endTiming();
    }
  },

  // Table operations implementation
  updateTableCell: (tableId: ElementId, rowIndex: number, colIndex: number, updates: any) => {
    const endTiming = PerformanceMonitor.startTiming('updateTableCell');
    
    try {
      logger.log('🔧 [TABLE] Updating table cell:', { tableId, rowIndex, colIndex, updates });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements.get(tableId as string);
        if (!element || element.type !== 'table' || !element.enhancedTableData) {
          console.warn('🔧 [TABLE] Table not found or invalid:', tableId);
          return;
        }
        
        const { cells } = element.enhancedTableData;
        if (rowIndex < 0 || rowIndex >= cells.length || 
            colIndex < 0 || !cells[rowIndex] || colIndex >= cells[rowIndex].length) {
          console.warn('🔧 [TABLE] Invalid cell indices:', { tableId, rowIndex, colIndex, rows: cells.length, cols: cells[0]?.length });
          return;
        }
        
        const cell = cells[rowIndex]?.[colIndex];
        if (cell) {
          Object.assign(cell, updates);
          // Update the element in the map
          state.elements.set(tableId as string, { ...element });
          logger.log('✅ [TABLE] Cell updated successfully:', { tableId, rowIndex, colIndex });
        } else {
          console.warn('🔧 [TABLE] Cell not found:', { tableId, rowIndex, colIndex });
        }
      });
      
      PerformanceMonitor.recordMetric('tableCellUpdated', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  addTableRow: (tableId: ElementId, insertIndex?: number) => {
    const endTiming = PerformanceMonitor.startTiming('addTableRow');
    
    try {
      logger.log('🔧 [TABLE] Adding table row:', { tableId, insertIndex });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements.get(tableId as string);
        if (!element || element.type !== 'table' || !element.enhancedTableData) {
          console.warn('🔧 [TABLE] Table not found or invalid:', tableId);
          return;
        }
        
        const { rows, columns, cells } = element.enhancedTableData;
        const newRowIndex = insertIndex !== undefined ? insertIndex : rows.length;
        
        // Create new row
        const newRow = {
          id: `row-${Date.now()}`,
          height: 40,
          isResizable: true,
          isHeader: false
        };
        
        // Insert row at specified index
        rows.splice(newRowIndex, 0, newRow);
        
        // Create new cell row with default cell values
        const newCellRow = columns.map((_, colIndex) => ({
          id: `cell-${Date.now()}-${colIndex}`,
          content: '', // Required property
          text: '', // Legacy compatibility
          segments: [],
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left' as const,
          textDecoration: 'none',
          borderColor: '#e0e0e0',
          borderWidth: 1,
          padding: 8,
          isHeader: false,
          isSelected: false,
          containedElementIds: [],
          rowSpan: 1,
          colSpan: 1
        }));
        
        // Insert the new cell row
        cells.splice(newRowIndex, 0, newCellRow);
        
        // Update the element in the map
        state.elements.set(tableId as string, { ...element });
        
        logger.log('✅ [TABLE] Row added successfully:', { tableId, newRowIndex, totalRows: rows.length });
      });
      
      PerformanceMonitor.recordMetric('tableRowAdded', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  addTableColumn: (tableId: ElementId, insertIndex?: number) => {
    const endTiming = PerformanceMonitor.startTiming('addTableColumn');
    
    try {
      logger.log('🔧 [TABLE] Adding table column:', { tableId, insertIndex });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements.get(tableId as string);
        if (!element || element.type !== 'table' || !element.enhancedTableData) {
          console.warn('🔧 [TABLE] Table not found or invalid:', tableId);
          return;
        }
        
        const { columns, cells } = element.enhancedTableData;
        const newColIndex = insertIndex !== undefined ? insertIndex : columns.length;
        
        // Create new column
        const newColumn = {
          id: `col-${Date.now()}`,
          width: 100,
          isResizable: true,
          textAlign: 'left' as const
        };
        
        // Insert column at specified index
        columns.splice(newColIndex, 0, newColumn);
        
        // Add new cell to each row at the specified column index
        cells.forEach((row, rowIndex) => {
          const newCell = {
            id: `cell-${Date.now()}-${rowIndex}`,
            content: '', // Required property
            text: '', // Legacy compatibility
            segments: [],
            backgroundColor: '#FFFFFF',
            textColor: '#000000',
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left' as const,
            textDecoration: 'none',
            borderColor: '#e0e0e0',
            borderWidth: 1,
            padding: 8,
            isHeader: false,
            isSelected: false,
            containedElementIds: [],
            rowSpan: 1,
            colSpan: 1
          };
          
          row.splice(newColIndex, 0, newCell);
        });
        
        // Update the element in the map
        state.elements.set(tableId as string, { ...element });
        
        logger.log('✅ [TABLE] Column added successfully:', { tableId, newColIndex, totalColumns: columns.length });
      });
      
      PerformanceMonitor.recordMetric('tableColumnAdded', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  removeTableRow: (tableId: ElementId, rowIndex: number) => {
    const endTiming = PerformanceMonitor.startTiming('removeTableRow');
    
    try {
      logger.log('🔧 [TABLE] Removing table row:', { tableId, rowIndex });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements.get(tableId as string);
        if (!element || element.type !== 'table' || !element.enhancedTableData) {
          console.warn('🔧 [TABLE] Table not found or invalid:', tableId);
          return;
        }
        
        const { rows, cells } = element.enhancedTableData;
        
        if (rowIndex < 0 || rowIndex >= rows.length) {
          console.warn('🔧 [TABLE] Invalid row index:', { rowIndex, totalRows: rows.length });
          return;
        }
        
        // Remove the row
        rows.splice(rowIndex, 1);
        cells.splice(rowIndex, 1);
        
        // Update the element in the map
        state.elements.set(tableId as string, { ...element });
        
        logger.log('✅ [TABLE] Row removed successfully:', { tableId, rowIndex, remainingRows: rows.length });
      });
      
      PerformanceMonitor.recordMetric('tableRowRemoved', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  removeTableColumn: (tableId: ElementId, colIndex: number) => {
    const endTiming = PerformanceMonitor.startTiming('removeTableColumn');
    
    try {
      logger.log('🔧 [TABLE] Removing table column:', { tableId, colIndex });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements.get(tableId as string);
        if (!element || element.type !== 'table' || !element.enhancedTableData) {
          console.warn('🔧 [TABLE] Table not found or invalid:', tableId);
          return;
        }
        
        const { columns, cells } = element.enhancedTableData;
        
        if (colIndex < 0 || colIndex >= columns.length) {
          console.warn('🔧 [TABLE] Invalid column index:', { colIndex, totalColumns: columns.length });
          return;
        }
        
        // Remove the column
        columns.splice(colIndex, 1);
        
        // Remove the column from each row
        cells.forEach(row => {
          row.splice(colIndex, 1);
        });
        
        // Update the element in the map
        state.elements.set(tableId as string, { ...element });
        
        logger.log('✅ [TABLE] Column removed successfully:', { tableId, colIndex, remainingColumns: columns.length });
      });
      
      PerformanceMonitor.recordMetric('tableColumnRemoved', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  resizeTableRow: (tableId: ElementId, rowIndex: number, newHeight: number) => {
    const endTiming = PerformanceMonitor.startTiming('resizeTableRow');
    
    try {
      logger.log('🔧 [TABLE] Resizing table row:', { tableId, rowIndex, newHeight });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements.get(tableId as string);
        if (!element || element.type !== 'table' || !element.enhancedTableData) {
          console.warn('🔧 [TABLE] Table not found or invalid:', tableId);
          return;
        }
        
        const { rows } = element.enhancedTableData;
        
        if (rowIndex < 0 || rowIndex >= rows.length) {
          console.warn('🔧 [TABLE] Invalid row index:', { rowIndex, totalRows: rows.length });
          return;
        }
        
        // Update row height
        if (rows[rowIndex]) {
          rows[rowIndex].height = Math.max(20, newHeight);
          
          // Update the element in the map
          state.elements.set(tableId as string, { ...element });
          
          logger.log('✅ [TABLE] Row resized successfully:', { tableId, rowIndex, newHeight: rows[rowIndex].height });
        }
      });
      
      PerformanceMonitor.recordMetric('tableRowResized', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  resizeTableColumn: (tableId: ElementId, colIndex: number, newWidth: number) => {
    const endTiming = PerformanceMonitor.startTiming('resizeTableColumn');
    
    try {
      logger.log('🔧 [TABLE] Resizing table column:', { tableId, colIndex, newWidth });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements.get(tableId as string);
        if (!element || element.type !== 'table' || !element.enhancedTableData) {
          console.warn('🔧 [TABLE] Table not found or invalid:', tableId);
          return;
        }
        
        const { columns } = element.enhancedTableData;
        
        if (colIndex < 0 || colIndex >= columns.length) {
          console.warn('🔧 [TABLE] Invalid column index:', { colIndex, totalColumns: columns.length });
          return;
        }
        
        // Update column width
        if (columns[colIndex]) {
          columns[colIndex].width = Math.max(50, newWidth);
          
          // Update the element in the map
          state.elements.set(tableId as string, { ...element });
          
          logger.log('✅ [TABLE] Column resized successfully:', { tableId, colIndex, newWidth: columns[colIndex].width });
        }
      });
      
      PerformanceMonitor.recordMetric('tableColumnResized', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  resizeTable: (tableId: ElementId, newWidth: number, newHeight: number) => {
    const endTiming = PerformanceMonitor.startTiming('resizeTable');
    
    try {
      logger.log('🔧 [TABLE] Resizing table:', { tableId, newWidth, newHeight });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements.get(tableId as string);
        if (!element || element.type !== 'table') {
          console.warn('🔧 [TABLE] Table not found or invalid:', tableId);
          return;
        }
        
        // Update table element dimensions
        const updatedElement = {
          ...element,
          width: Math.max(100, newWidth),
          height: Math.max(60, newHeight)
        };
        
        state.elements.set(tableId as string, updatedElement);
        
        logger.log('✅ [TABLE] Table resized successfully:', { tableId, newWidth: updatedElement.width, newHeight: updatedElement.height });
      });
      
      PerformanceMonitor.recordMetric('tableResized', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  // Drawing operations
  startDrawing: (x: number, y: number, tool: 'pen' | 'pencil' | 'section') => {
    logger.log('🖊️ [DRAWING] Starting drawing:', { x, y, tool });
    set((state: Draft<CanvasElementsState>) => {
      state.isDrawing = true;
      state.currentPath = [x, y];
      state.drawingTool = tool;
    });
  },

  updateDrawing: (x: number, y: number) => {
    const state = get();
    if (!state.isDrawing || !state.currentPath) return;
    
    set((state: Draft<CanvasElementsState>) => {
      state.currentPath!.push(x, y);
    });
  },

  finishDrawing: () => {
    const state = get();
    if (!state.isDrawing || !state.currentPath || state.currentPath.length < 4) { // FIX: Ensure at least two points (4 numbers)
      logger.log('🖊️ [DRAWING] Cannot finish drawing - insufficient points (need at least 2 points)');
      get().cancelDrawing();
      return;
    }

    logger.log('🖊️ [DRAWING] Finishing drawing, points:', state.currentPath.length / 2);
    
    // Create a new pen/pencil element
    const newElement: CanvasElement = {
      id: ElementId(`${state.drawingTool}-${Date.now()}`),
      type: 'pen',
      x: 0,
      y: 0,
      points: [...state.currentPath],
      stroke: state.drawingTool === 'pen' ? '#000000' : '#666666',
      strokeWidth: state.drawingTool === 'pen' ? 2 : 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    } as CanvasElement;

    // Type-safe access to points for pen elements
    if (newElement.type === 'pen' && 'points' in newElement) {
      logger.log('🖊️ [DRAWING] Creating new element with points:', newElement.points);
    }
    logger.log('🖊️ [DRAWING] Element will be added to store with id:', newElement.id);

    // Add the element
    get().addElement(newElement);
    
    // Reset drawing state
    set((state: Draft<CanvasElementsState>) => {
      state.isDrawing = false;
      state.currentPath = undefined;
      state.drawingTool = null;
    });

    logger.log('✅ [DRAWING] Drawing finished and saved as element:', newElement.id);
  },

  cancelDrawing: () => {
    logger.log('🖊️ [DRAWING] Canceling drawing');
    set((state: Draft<CanvasElementsState>) => {
      state.isDrawing = false;
      state.currentPath = undefined;
      state.drawingTool = null;
    });
  },

  // Element queries - Updated to work with Map
  getElementById: (id: ElementId) => {
    return get().elements.get(id as string) || null;
  },

  getElementsByType: (type: string) => {
    const elements = get().elements;
    const result: CanvasElement[] = [];
    
    elements.forEach(element => {
      if (element.type === type) {
        result.push(element);
      }
    });
    
    return result;
  },

  getElementsByIds: (ids: ElementId[]) => {
    const elements = get().elements;
    return ids.map(id => elements.get(id as string)).filter(Boolean) as CanvasElement[];
  },

  getAllElements: () => {
    return Array.from(get().elements.values());
  },

  // Element utilities - Updated to work with Map
  clearAllElements: () => {
    const endTiming = PerformanceMonitor.startTiming('clearAllElements');
    
    try {
      const elementCount = get().elements.size;
      logger.log('🔧 [ELEMENTS STORE] Clearing all elements, count:', elementCount);
      
      set((state: Draft<CanvasElementsState>) => {
        state.elements.clear();
        state.elementOrder = [];
      });
      
      PerformanceMonitor.recordMetric('allElementsCleared', elementCount, 'canvas');
      logger.log('✅ [ELEMENTS STORE] All elements cleared successfully');
    } finally {
      endTiming();
    }
  },

  clearCanvas: () => {
    const endTiming = PerformanceMonitor.startTiming('clearCanvas');
    
    try {
      const elementCount = get().elements.size;
      logger.log('🔧 [ELEMENTS STORE] Clearing entire canvas, element count:', elementCount);
      
      set((state: Draft<CanvasElementsState>) => {
        // Clear all elements
        state.elements.clear();
        state.elementOrder = [];
        
        // Reset drawing state
        state.isDrawing = false;
        state.currentPath = undefined;
        state.drawingTool = null;
      });
      
      PerformanceMonitor.recordMetric('canvasCleared', elementCount, 'canvas');
      logger.log('✅ [ELEMENTS STORE] Canvas cleared successfully');
    } finally {
      endTiming();
    }
  },

  exportElements: () => {
    const endTiming = PerformanceMonitor.startTiming('exportElements');
    
    try {
      const elements = Array.from(get().elements.values());
      logger.log('🔧 [ELEMENTS STORE] Exporting elements, count:', elements.length);
      
      PerformanceMonitor.recordMetric('elementsExported', elements.length, 'canvas');
      return elements;
    } finally {
      endTiming();
    }
  },

  importElements: (elements: CanvasElement[]) => {
    const endTiming = PerformanceMonitor.startTiming('importElements');
    
    try {
      logger.log('🔧 [ELEMENTS STORE] Importing elements, count:', elements.length);
      
      // Validate all elements first
      const validElements = elements.filter(element => get().validateElement(element));
      
      if (validElements.length !== elements.length) {
        console.warn('🔧 [ELEMENTS STORE] Some elements failed validation during import');
      }
      
      set((state: Draft<CanvasElementsState>) => {
        validElements.forEach(element => {
          // Ensure createdAt and updatedAt are set
          const elementWithTimestamps = {
            ...element,
            createdAt: element.createdAt || Date.now(),
            updatedAt: element.updatedAt || Date.now()
          };
          state.elements.set(element.id as string, elementWithTimestamps);
          if (!state.elementOrder.includes(element.id as string)) {
            state.elementOrder.push(element.id as string);
          }
        });
      });
      
      PerformanceMonitor.recordMetric('elementsImported', validElements.length, 'canvas');
      logger.log('✅ [ELEMENTS STORE] Elements imported successfully:', validElements.length);
    } finally {
      endTiming();
    }
  },

  validateElement: (element: CanvasElement): boolean => {
    const endTiming = PerformanceMonitor.startTiming('validateElement');
    
    try {
      logger.log('🔧 [ELEMENTS STORE] Validating element:', JSON.stringify(element, null, 2));
      
      // Basic validation
      if (!element || typeof element !== 'object') {
        console.error('🔧 [ELEMENTS STORE] Invalid element: not an object');
        return false;
      }
      
      if (!element.id || typeof element.id !== 'string') {
        console.error('🔧 [ELEMENTS STORE] Invalid element: missing or invalid id');
        return false;
      }
      
      if (!element.type || typeof element.type !== 'string') {
        console.error('🔧 [ELEMENTS STORE] Invalid element: missing or invalid type');
        return false;
      }
      
      if (typeof element.x !== 'number' || typeof element.y !== 'number') {
        console.error('🔧 [ELEMENTS STORE] Invalid element: missing or invalid coordinates', {
          x: element.x,
          y: element.y,
          typeX: typeof element.x,
          typeY: typeof element.y
        });
        return false;
      }
      
      // Validate dimensions based on element type using type guards
      if (isCircleElement(element)) {
        if (typeof element.radius !== 'number' || element.radius <= 0) {
          console.error('🔧 [ELEMENTS STORE] Invalid circle: missing or invalid radius', {
            radius: element.radius,
            typeRadius: typeof element.radius
          });
          return false;
        }
        logger.log('✅ [ELEMENTS STORE] Circle validation passed');
      } else if (isStarElement(element)) {
        // Star elements use radius and innerRadius
        if (typeof element.innerRadius !== 'number' || element.innerRadius <= 0 ||
            typeof element.outerRadius !== 'number' || element.outerRadius <= 0) {
          console.error('🔧 [ELEMENTS STORE] Invalid star: missing or invalid radius', {
            innerRadius: element.innerRadius,
            outerRadius: element.outerRadius,
            typeInnerRadius: typeof element.innerRadius,
            typeOuterRadius: typeof element.outerRadius
          });
          return false;
        }
        logger.log('✅ [ELEMENTS STORE] Star validation passed');
      } else if (isTextElement(element)) {
        // Text elements only need width, height is dynamic
        if (element.width !== undefined && (typeof element.width !== 'number' || element.width <= 0)) {
          console.error('🔧 [ELEMENTS STORE] Invalid text: invalid width', {
            width: element.width,
            typeWidth: typeof element.width
          });
          return false;
        }
        logger.log('✅ [ELEMENTS STORE] Text validation passed');
      } else if (isPenElement(element)) {
        // Pen elements use points array and don't need width/height
        if (!Array.isArray(element.points) || element.points.length < 4) {
          console.error('🔧 [ELEMENTS STORE] Invalid pen: missing or invalid points', {
            points: element.points,
            pointsLength: Array.isArray(element.points) ? element.points.length : 'not array'
          });
          return false;
        }
        logger.log('✅ [ELEMENTS STORE] Pen validation passed');
      } else if (isTableElement(element)) {
        // Table elements need width, height, and enhancedTableData with rows/cols arrays
        if (typeof element.width !== 'number' || typeof element.height !== 'number' ||
            element.width <= 0 || element.height <= 0) {
          console.error('🔧 [ELEMENTS STORE] Invalid table: missing or invalid dimensions', {
            width: element.width,
            height: element.height
          });
          return false;
        }
        if (element.enhancedTableData && 
            (!Array.isArray(element.enhancedTableData.rows) || 
             !Array.isArray(element.enhancedTableData.columns) ||
             element.enhancedTableData.rows.length <= 0 || 
             element.enhancedTableData.columns.length <= 0 ||
             !Array.isArray(element.enhancedTableData.cells))) {
          console.error('🔧 [ELEMENTS STORE] Invalid table: invalid table structure', {
            enhancedTableData: element.enhancedTableData
          });
          return false;
        }
        if (element.enhancedTableData) {
          logger.log('✅ [ELEMENTS STORE] Table validation passed', {
            rows: element.enhancedTableData.rows.length,
            columns: element.enhancedTableData.columns.length,
            cellsCount: element.enhancedTableData.cells.length
          });
        } else {
          logger.log('✅ [ELEMENTS STORE] Table validation passed (no enhanced data)');
        }
      } else if (isSectionElement(element)) {
        // Section elements need width and height
        if (typeof element.width !== 'number' || typeof element.height !== 'number' ||
            element.width <= 0 || element.height <= 0) {
          console.error('🔧 [ELEMENTS STORE] Invalid section: missing or invalid dimensions', {
            width: element.width,
            height: element.height
          });
          return false;
        }
        logger.log('✅ [ELEMENTS STORE] Section validation passed');
      } else if (isConnectorElement(element)) {
        // Connector elements use startPoint and endPoint
        if (!element.startPoint || !element.endPoint ||
            typeof element.startPoint.x !== 'number' || typeof element.startPoint.y !== 'number' ||
            typeof element.endPoint.x !== 'number' || typeof element.endPoint.y !== 'number') {
          console.error('🔧 [ELEMENTS STORE] Invalid connector: missing or invalid points', {
            startPoint: element.startPoint,
            endPoint: element.endPoint
          });
          return false;
        }
        logger.log('✅ [ELEMENTS STORE] Connector validation passed');
      } else if (isTriangleElement(element)) {
        // Triangle elements use points array but can also have width/height for compatibility
        if (!Array.isArray(element.points) || element.points.length < 6) {
          console.error('🔧 [ELEMENTS STORE] Invalid triangle: missing or invalid points', {
            points: element.points,
            pointsLength: Array.isArray(element.points) ? element.points.length : 'not array'
          });
          return false;
        }
        logger.log('✅ [ELEMENTS STORE] Triangle validation passed');
      } else if (isGroupElement(element)) {
        // Group elements need width, height, and childElementIds array
        if (typeof element.width !== 'number' || typeof element.height !== 'number' ||
            element.width <= 0 || element.height <= 0) {
          console.error('🔧 [ELEMENTS STORE] Invalid group: missing or invalid dimensions', {
            width: element.width,
            height: element.height
          });
          return false;
        }
        if (!Array.isArray(element.childElementIds) || element.childElementIds.length === 0) {
          console.error('🔧 [ELEMENTS STORE] Invalid group: missing or invalid childElementIds', {
            childElementIds: element.childElementIds
          });
          return false;
        }
        logger.log('✅ [ELEMENTS STORE] Group validation passed');
      } else if (isRectangularElement(element)) {
        // Elements with width and height
        if (typeof element.width !== 'number' || typeof element.height !== 'number' ||
            element.width <= 0 || element.height <= 0) {
          console.error('🔧 [ELEMENTS STORE] Invalid element: missing or invalid dimensions', {
            width: element.width,
            height: element.height,
            typeWidth: typeof element.width,
            typeHeight: typeof element.height
          });
          return false;
        }
        logger.log('✅ [ELEMENTS STORE] Element validation passed');
      } else {
        // Unknown element type
        console.error('🔧 [ELEMENTS STORE] Unknown element type:', element);
        return false;
      }
      
      PerformanceMonitor.recordMetric('textValidation', 1, 'interaction', {
        isValid: true,
        elementType: element.type
      });
      
      logger.log('✅ [ELEMENTS STORE] Element validation successful for:', element.type, element.id);
      return true;
    } finally {
      endTiming();
    }
  },

  optimizeElement: (id: ElementId) => {
    const endTiming = PerformanceMonitor.startTiming('optimizeElement');
    
    try {
      const element = get().elements.get(id as string);
      if (!element) {
        console.warn('🔧 [ELEMENTS STORE] Element not found for optimization:', id);
        return;
      }

      logger.log('🔧 [ELEMENTS STORE] Optimizing element:', id);
      
      let optimized = false;
      
      set((state: Draft<CanvasElementsState>) => {
        const stateElement = state.elements.get(id as string);
        if (!stateElement) return;
        
        // Example optimizations - use type guards to check properties
        if (isRectangularElement(stateElement)) {
          if (stateElement.width < 1) {
            stateElement.width = 1;
            optimized = true;
          }
          if (stateElement.height < 1) {
            stateElement.height = 1;
            optimized = true;
          }
        }
        
        if (optimized) {
          // Update the element in the map
          state.elements.set(id as string, { ...stateElement });
        }
      });
      
      if (optimized) {
        logger.log('✅ [ELEMENTS STORE] Element optimized:', id);
      }
      
      PerformanceMonitor.recordMetric('elementOptimized', 1, 'canvas', { 
        elementType: element.type,
        hadChanges: optimized
      });
    } finally {
      endTiming();
    }
  },
  
  // Connector operations implementation
  startConnector: (startPoint: { x: number; y: number }, subType = 'straight') => {
    const endTiming = PerformanceMonitor.startTiming('startConnector');
    
    try {
      const connectorId = ElementId(`connector-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      logger.log('🔗 [CONNECTOR] Starting connector:', connectorId, { startPoint, subType });
      
      const connectorElement: CanvasElement = {
        id: connectorId,
        type: 'connector',
        subType,
        x: startPoint.x,
        y: startPoint.y,
        startPoint,
        endPoint: { ...startPoint }, // Initially same as start
        intermediatePoints: [],
        stroke: '#333333',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      get().addElement(connectorElement);
      
      PerformanceMonitor.recordMetric('connectorStarted', 1, 'canvas', { subType });
      logger.log('✅ [CONNECTOR] Connector started successfully:', connectorId);
      
      return connectorId;
    } finally {
      endTiming();
    }
  },

  finishConnector: (connectorId: ElementId, endPoint: { x: number; y: number }) => {
    const endTiming = PerformanceMonitor.startTiming('finishConnector');
    
    try {
      logger.log('🔗 [CONNECTOR] Finishing connector:', connectorId, { endPoint });
      
      const connector = get().elements.get(connectorId as string);
      if (!connector || connector.type !== 'connector') {
        console.warn('🔗 [CONNECTOR] Connector not found or invalid type:', connectorId);
        return;
      }
      
      get().updateElement(connectorId, {
        endPoint,
        updatedAt: Date.now()
      });
      
      PerformanceMonitor.recordMetric('connectorFinished', 1, 'canvas');
      logger.log('✅ [CONNECTOR] Connector finished successfully:', connectorId);
    } finally {
      endTiming();
    }
  },

  updateConnectorPath: (connectorId: ElementId, startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) => {
    const endTiming = PerformanceMonitor.startTiming('updateConnectorPath');
    
    try {
      logger.log('🔗 [CONNECTOR] Updating connector path:', connectorId, { startPoint, endPoint });
      
      const connector = get().elements.get(connectorId as string);
      if (!connector || connector.type !== 'connector') {
        console.warn('🔗 [CONNECTOR] Connector not found or invalid type:', connectorId);
        return;
      }
      
      // Calculate intermediate points based on connector subType
      let intermediatePoints: { x: number; y: number }[] = [];
      
      if (isConnectorElement(connector)) {
        if (connector.subType === 'bent') {
          // Simple L-shaped connector
          const midX = (startPoint.x + endPoint.x) / 2;
          intermediatePoints = [
            { x: midX, y: startPoint.y },
            { x: midX, y: endPoint.y }
          ];
        } else if (connector.subType === 'curved') {
          // Bezier curve approximation
          const controlPoint1 = {
            x: startPoint.x + (endPoint.x - startPoint.x) * 0.3,
            y: startPoint.y
          };
          const controlPoint2 = {
            x: startPoint.x + (endPoint.x - startPoint.x) * 0.7,
            y: endPoint.y
          };
          intermediatePoints = [controlPoint1, controlPoint2];
        }
      }
      
      get().updateElement(connectorId, {
        startPoint,
        endPoint,
        intermediatePoints,
        updatedAt: Date.now()
      });
      
      PerformanceMonitor.recordMetric('connectorPathUpdated', 1, 'canvas');
      logger.log('✅ [CONNECTOR] Connector path updated successfully:', connectorId);
    } finally {
      endTiming();
    }
  },

  attachConnectorToElement: (connectorId: ElementId, elementId: ElementId, isStart: boolean, anchorPoint = 'center') => {
    const endTiming = PerformanceMonitor.startTiming('attachConnectorToElement');
    
    try {
      logger.log('🔗 [CONNECTOR] Attaching connector to element:', { connectorId, elementId, isStart, anchorPoint });
      
      const connector = get().elements.get(connectorId as string);
      const element = get().elements.get(elementId as string);
      
      if (!connector || connector.type !== 'connector') {
        console.warn('🔗 [CONNECTOR] Connector not found or invalid type:', connectorId);
        return;
      }
      
      if (!element) {
        console.warn('🔗 [CONNECTOR] Element not found:', elementId);
        return;
      }
      
      const updates: Partial<CanvasElement> = {
        updatedAt: Date.now()
      };
      
      if (isStart) {
        (updates as any).startElementId = elementId;
      } else {
        (updates as any).endElementId = elementId;
      }
      
      get().updateElement(connectorId, updates);
      
      PerformanceMonitor.recordMetric('connectorAttached', 1, 'canvas', { isStart });
      logger.log('✅ [CONNECTOR] Connector attached successfully:', { connectorId, elementId, isStart });
    } finally {
      endTiming();
    }
  },

  detachConnectorFromElement: (connectorId: ElementId, isStart: boolean) => {
    const endTiming = PerformanceMonitor.startTiming('detachConnectorFromElement');
    
    try {
      logger.log('🔗 [CONNECTOR] Detaching connector from element:', { connectorId, isStart });
      
      const connector = get().elements.get(connectorId as string);
      if (!connector || connector.type !== 'connector') {
        console.warn('🔗 [CONNECTOR] Connector not found or invalid type:', connectorId);
        return;
      }
      
      const updates: Partial<CanvasElement> = {
        updatedAt: Date.now()
      };
      
      if (isStart) {
        (updates as any).startElementId = undefined;
      } else {
        (updates as any).endElementId = undefined;
      }
      
      get().updateElement(connectorId, updates);
      
      PerformanceMonitor.recordMetric('connectorDetached', 1, 'canvas', { isStart });
      logger.log('✅ [CONNECTOR] Connector detached successfully:', { connectorId, isStart });
    } finally {
      endTiming();
    }
  },

  getConnectorsForElement: (elementId: ElementId) => {
    const endTiming = PerformanceMonitor.startTiming('getConnectorsForElement');
    
    try {
      logger.log('🔗 [CONNECTOR] Getting connectors for element:', elementId);
      
      const connectors: CanvasElement[] = [];
      const elements = get().elements;
      
      elements.forEach(element => {
        if (element.type === 'connector' && isConnectorElement(element)) {
          if (element.startElementId === elementId || element.endElementId === elementId) {
            connectors.push(element);
          }
        }
      });
      
      PerformanceMonitor.recordMetric('connectorsRetrieved', connectors.length, 'canvas');
      logger.log('✅ [CONNECTOR] Found connectors for element:', elementId, 'count:', connectors.length);
      
      return connectors;
    } finally {
      endTiming();
    }
  },

  // Element management implementation
  hideElement: (id: ElementId) => {
    logger.log('👁️ [ELEMENT] Hiding element:', id);
    get().updateElement(id, { isHidden: true });
  },

  showElement: (id: ElementId) => {
    logger.log('👁️ [ELEMENT] Showing element:', id);
    get().updateElement(id, { isHidden: false });
  },

  lockElement: (id: ElementId) => {
    logger.log('🔒 [ELEMENT] Locking element:', id);
    get().updateElement(id, { isLocked: true });
  },

  unlockElement: (id: ElementId) => {
    logger.log('🔓 [ELEMENT] Unlocking element:', id);
    get().updateElement(id, { isLocked: false });
  },

  toggleElementVisibility: (id: ElementId) => {
    const element = get().elements.get(id as string);
    if (element) {
      const newVisibility = !element.isHidden;
      logger.log('👁️ [ELEMENT] Toggling element visibility:', id, 'to:', newVisibility ? 'hidden' : 'visible');
      get().updateElement(id, { isHidden: newVisibility });
    }
  },

  toggleElementLock: (id: ElementId) => {
    const element = get().elements.get(id as string);
    if (element) {
      const newLockState = !element.isLocked;
      logger.log('🔒 [ELEMENT] Toggling element lock:', id, 'to:', newLockState ? 'locked' : 'unlocked');
      get().updateElement(id, { isLocked: newLockState });
    }
  },

  bulkUpdateElements: (elementIds: ElementId[], updates: Partial<CanvasElement>) => {
    const endTiming = PerformanceMonitor.startTiming('bulkUpdateElements');
    
    try {
      logger.log('📦 [ELEMENT] Bulk updating elements:', elementIds.length, 'elements with updates:', updates);
      
      const bulkUpdates: Record<ElementId, Partial<CanvasElement>> = {};
      elementIds.forEach(id => {
        bulkUpdates[id] = updates;
      });
      
      get().updateMultipleElements(bulkUpdates);
      
      PerformanceMonitor.recordMetric('bulkElementsUpdated', elementIds.length, 'canvas');
      logger.log('✅ [ELEMENT] Bulk update completed successfully for', elementIds.length, 'elements');
    } finally {
      endTiming();
    }
  },

  moveElementToPosition: (id: ElementId, x: number, y: number) => {
    logger.log('📍 [ELEMENT] Moving element to position:', id, { x, y });
    get().updateElement(id, { x, y });
  },

  // Group operations implementation
  groupElements: (elementIds: ElementId[], groupName?: string) => {
    const endTiming = PerformanceMonitor.startTiming('groupElements');
    
    try {
      logger.log('🔗 [GROUP] Grouping elements:', elementIds, { groupName });
      
      if (elementIds.length < 2) {
        console.warn('🔗 [GROUP] Cannot group less than 2 elements');
        return ElementId('');
      }
      
      // Get all elements to calculate bounds
      const elements = elementIds.map(id => get().elements.get(id as string)).filter(Boolean) as CanvasElement[];
      if (elements.length !== elementIds.length) {
        console.warn('🔗 [GROUP] Some elements not found for grouping');
        return ElementId('');
      }
      
      // Calculate group bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      elements.forEach(element => {
        const { x, y } = element;
        const width = isRectangularElement(element) ? element.width : (isCircleElement(element) ? element.radius * 2 : 0);
        const height = isRectangularElement(element) ? element.height : (isCircleElement(element) ? element.radius * 2 : 0);
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      });
      
      const groupId = ElementId(`group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      
      // Create group element
      const groupElement: GroupElement = {
        id: groupId,
        type: 'group',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        childElementIds: [...elementIds],
        groupName: groupName || `Group ${Date.now()}`,
        isExpanded: true,
        backgroundColor: 'transparent',
        borderColor: '#007acc',
        borderWidth: 1,
        opacity: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Add group to store
      get().addElement(groupElement);
      
      // Update child elements to reference the group
      elementIds.forEach(elementId => {
        const element = get().elements.get(elementId as string);
        if (element) {
          get().updateElement(elementId, { 
            x: element.x - minX, // Convert to relative coordinates
            y: element.y - minY,
            groupId: ElementId(groupId) 
          });
        }
      });
      
      PerformanceMonitor.recordMetric('elementsGrouped', elementIds.length, 'canvas');
      logger.log('✅ [GROUP] Elements grouped successfully:', groupId, 'with', elementIds.length, 'elements');
      
      return groupId;
    } finally {
      endTiming();
    }
  },

  ungroupElements: (groupId: ElementId) => {
    const endTiming = PerformanceMonitor.startTiming('ungroupElements');
    
    try {
      logger.log('🔗 [GROUP] Ungrouping elements:', groupId);
      
      const group = get().elements.get(groupId as string);
      if (!group || !isGroupElement(group)) {
        console.warn('🔗 [GROUP] Group not found or invalid:', groupId);
        return [];
      }
      
      const ungroupedIds = [...group.childElementIds];
      
      // Update child elements to absolute coordinates and remove group reference
      ungroupedIds.forEach(elementId => {
        const element = get().elements.get(elementId as string);
        if (element) {
          get().updateElement(elementId, { 
            x: element.x + group.x, // Convert back to absolute coordinates
            y: element.y + group.y,
            groupId: undefined 
          });
        }
      });
      
      // Remove the group element
      get().deleteElement(groupId);
      
      PerformanceMonitor.recordMetric('elementsUngrouped', ungroupedIds.length, 'canvas');
      logger.log('✅ [GROUP] Elements ungrouped successfully:', ungroupedIds.length, 'elements');
      
      return ungroupedIds;
    } finally {
      endTiming();
    }
  },

  addElementToGroup: (groupId: ElementId, elementId: ElementId) => {
    logger.log('🔗 [GROUP] Adding element to group:', { groupId, elementId });
    
    const group = get().elements.get(groupId as string);
    const element = get().elements.get(elementId as string);
    
    if (!group || !isGroupElement(group)) {
      console.warn('🔗 [GROUP] Group not found:', groupId);
      return;
    }
    
    if (!element) {
      console.warn('🔗 [GROUP] Element not found:', elementId);
      return;
    }
    
    // Update group to include new element
    const updatedChildIds = [...group.childElementIds, elementId];
    get().updateElement(groupId, { childElementIds: updatedChildIds });
    
    // Update element to reference group and convert to relative coordinates
    get().updateElement(elementId, { 
      x: element.x - group.x,
      y: element.y - group.y,
      groupId: ElementId(groupId)
    });
    
    logger.log('✅ [GROUP] Element added to group successfully');
  },

  removeElementFromGroup: (groupId: ElementId, elementId: ElementId) => {
    logger.log('🔗 [GROUP] Removing element from group:', { groupId, elementId });
    
    const group = get().elements.get(groupId as string);
    const element = get().elements.get(elementId as string);
    
    if (!group || !isGroupElement(group)) {
      console.warn('🔗 [GROUP] Group not found:', groupId);
      return;
    }
    
    if (!element) {
      console.warn('🔗 [GROUP] Element not found:', elementId);
      return;
    }
    
    // Update group to remove element
    const updatedChildIds = group.childElementIds.filter(id => id !== elementId);
    get().updateElement(groupId, { childElementIds: updatedChildIds });
    
    // Update element to remove group reference and convert to absolute coordinates
    get().updateElement(elementId, { 
      x: element.x + group.x,
      y: element.y + group.y,
      groupId: undefined
    });
    
    logger.log('✅ [GROUP] Element removed from group successfully');
  },

  getGroupMembers: (groupId: ElementId) => {
    const group = get().elements.get(groupId as string);
    if (!group || !isGroupElement(group)) {
      return [];
    }
    return [...group.childElementIds];
  },

  isElementInGroup: (elementId: ElementId) => {
    const element = get().elements.get(elementId as string);
    if (!element || !element.groupId) {
      return null;
    }
    return element.groupId as ElementId;
  },

  updateGroupTransform: (groupId: ElementId, deltaX: number, deltaY: number, scaleX = 1, scaleY = 1) => {
    const endTiming = PerformanceMonitor.startTiming('updateGroupTransform');
    
    try {
      logger.log('🔗 [GROUP] Updating group transform:', { groupId, deltaX, deltaY, scaleX, scaleY });
      
      const group = get().elements.get(groupId as string);
      if (!group || !isGroupElement(group)) {
        console.warn('🔗 [GROUP] Group not found:', groupId);
        return;
      }
      
      // Update group position
      get().updateElement(groupId, { 
        x: group.x + deltaX,
        y: group.y + deltaY,
        width: group.width * scaleX,
        height: group.height * scaleY
      });
      
      // Update child elements if they exist (relative transforms remain unchanged)
      group.childElementIds.forEach(elementId => {
        const element = get().elements.get(elementId as string);
        if (element && scaleX !== 1 && scaleY !== 1) {
          // Only apply scaling to relative positions if scaling is involved
          if (isRectangularElement(element)) {
            get().updateElement(elementId, {
              x: element.x * scaleX,
              y: element.y * scaleY,
              width: element.width * scaleX,
              height: element.height * scaleY
            });
          } else if (isCircleElement(element)) {
            get().updateElement(elementId, {
              x: element.x * scaleX,
              y: element.y * scaleY,
              radius: element.radius * Math.min(scaleX, scaleY)
            });
          }
        }
      });
      
      PerformanceMonitor.recordMetric('groupTransformed', 1, 'canvas');
      logger.log('✅ [GROUP] Group transform updated successfully');
    } finally {
      endTiming();
    }
  },

  calculateGroupBounds: (groupId: ElementId) => {
    const group = get().elements.get(groupId as string);
    if (!group || !isGroupElement(group)) {
      return null;
    }
    
    const elements = group.childElementIds
      .map(id => get().elements.get(id as string))
      .filter(Boolean) as CanvasElement[];
    
    if (elements.length === 0) {
      return { x: group.x, y: group.y, width: group.width, height: group.height };
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    elements.forEach(element => {
      const absX = group.x + element.x;
      const absY = group.y + element.y;
      const width = isRectangularElement(element) ? element.width : (isCircleElement(element) ? element.radius * 2 : 0);
      const height = isRectangularElement(element) ? element.height : (isCircleElement(element) ? element.radius * 2 : 0);
      
      minX = Math.min(minX, absX);
      minY = Math.min(minY, absY);
      maxX = Math.max(maxX, absX + width);
      maxY = Math.max(maxY, absY + height);
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },

  // Placeholder for handleElementDrop - will be overridden in combined store
  handleElementDrop: (_elementId: ElementId, _position: { x: number; y: number }) => {
    console.warn('🔧 [ELEMENTS STORE] handleElementDrop called but not implemented in slice');
    // This will be overridden in the combined store to avoid circular dependencies
  },
});

// Note: Store instance and selectors are created in the enhanced store
// This slice only exports the store creator function to avoid namespace import conflicts
