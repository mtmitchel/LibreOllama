// src/stores/slices/canvasElementsStore.ts
/**
 * Canvas Elements Store - Handles element CRUD operations
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 */

import { StateCreator } from 'zustand';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Draft } from 'immer';
import type { CanvasElement } from '../../../../types';
import { PerformanceMonitor } from '../../../../utils/performance/PerformanceMonitor';

export interface CanvasElementsState {
  // Element data
  elements: Record<string, CanvasElement>;
  elementOrder: string[];
  
  // Drawing state
  isDrawing: boolean;
  currentPath: number[];
  drawingTool: 'pen' | 'pencil' | null;
  
  // Element operations
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateMultipleElements: (updates: Record<string, Partial<CanvasElement>>) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  
  // Table operations - NEW
  updateTableCell: (tableId: string, rowIndex: number, colIndex: number, updates: any) => void;
  addTableRow: (tableId: string, insertIndex?: number) => void;
  addTableColumn: (tableId: string, insertIndex?: number) => void;
  removeTableRow: (tableId: string, rowIndex: number) => void;
  removeTableColumn: (tableId: string, colIndex: number) => void;
  resizeTableRow: (tableId: string, rowIndex: number, newHeight: number) => void;
  resizeTableColumn: (tableId: string, colIndex: number, newWidth: number) => void;
  resizeTable: (tableId: string, newWidth: number, newHeight: number) => void;
  
  // Drawing operations
  startDrawing: (x: number, y: number, tool: 'pen' | 'pencil') => void;
  updateDrawing: (x: number, y: number) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  
  // Element queries
  getElementById: (id: string) => CanvasElement | null;
  getElementsByType: (type: string) => CanvasElement[];
  getElementsByIds: (ids: string[]) => CanvasElement[];
  getAllElements: () => CanvasElement[];
    // Element utilities
  clearAllElements: () => void;
  clearCanvas: () => void; // Clears all elements and resets canvas state
  exportElements: () => CanvasElement[];
  importElements: (elements: CanvasElement[]) => void;
  validateElement: (element: CanvasElement) => boolean;
  optimizeElement: (id: string) => void;
  handleElementDrop: (elementId: string, position: { x: number; y: number }) => void;
}

export const createCanvasElementsStore: StateCreator<
  CanvasElementsState,
  [['zustand/immer', never]],
  [],
  CanvasElementsState
> = (set, get) => ({
  // Initial state
  elements: {},
  elementOrder: [],
  
  // Drawing state
  isDrawing: false,
  currentPath: [],
  drawingTool: null,
  // Element operations with performance monitoring
  addElement: (element: CanvasElement) => {
    const endTiming = PerformanceMonitor.startTiming('addElement');
    
    try {
      console.log('🔧 [ELEMENTS STORE] Adding element:', element.id, element.type);
      console.log('🔧 [ELEMENTS STORE] Element details:', JSON.stringify(element, null, 2));
      
      // Validate element before adding (outside of set function)
      if (!get().validateElement(element)) {
        console.error('🔧 [ELEMENTS STORE] Invalid element rejected:', element);
        return;
      }
      
      set((state: Draft<CanvasElementsState>) => {
        state.elements[element.id] = { ...element };
        if (!state.elementOrder.includes(element.id)) {
          state.elementOrder.push(element.id);
        }
        console.log('✅ [ELEMENTS STORE] Element added successfully:', element.id);
        console.log('🔧 [ELEMENTS STORE] Total elements after add:', Object.keys(state.elements).length);
      });
      
      PerformanceMonitor.recordMetric('elementAdded', 1, 'canvas', { elementType: element.type });
    } finally {
      endTiming();
    }
  },
  updateElement: (id: string, updates: Partial<CanvasElement>) => {
    const endTiming = PerformanceMonitor.startTiming('updateElement');
    
    try {
      console.log('🔧 [ELEMENTS STORE] Updating element:', id, updates);
      console.log('🔧 [ELEMENTS STORE] Current elements in store:', Object.keys(get().elements));
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements[id];        if (!element) {
          console.warn('🔧 [ELEMENTS STORE] Element not found for update:', id);
          console.warn('🔧 [ELEMENTS STORE] Available elements:', Object.keys(state.elements));
          return;
        }
        
        // Prevent storing empty or whitespace-only text (React-Konva issue)
        if (updates.text !== undefined) {
          const trimmedText = updates.text.trim();
          if (trimmedText.length === 0) {
            console.warn('🔧 [ELEMENTS STORE] Preventing whitespace-only text update for element:', id);
            updates.text = 'Text'; // Use default text instead
          }
        }
        
        // Apply updates
        if (state.elements[id]) {
          Object.assign(state.elements[id], updates);
        }
        console.log('✅ [ELEMENTS STORE] Element updated successfully:', id);
      });
      
      PerformanceMonitor.recordMetric('elementUpdated', 1, 'canvas', { elementType: get().elements[id]?.type });
    } finally {
      endTiming();
    }
  },

  updateMultipleElements: (updates: Record<string, Partial<CanvasElement>>) => {
    const endTiming = PerformanceMonitor.startTiming('updateMultipleElements');
    
    try {
      console.log('🔧 [ELEMENTS STORE] Updating multiple elements:', Object.keys(updates));
      
      set((state: Draft<CanvasElementsState>) => {
        Object.entries(updates).forEach(([id, elementUpdates]) => {
          const element = state.elements[id];
          if (element) {
            Object.assign(element, elementUpdates);
          }
        });
      });
      
      PerformanceMonitor.recordMetric('multipleElementsUpdated', Object.keys(updates).length, 'canvas');
    } finally {
      endTiming();
    }
  },

  deleteElement: (id: string) => {
    const endTiming = PerformanceMonitor.startTiming('deleteElement');
    
    try {
      const element = get().elements[id];
      if (!element) {
        console.warn('🔧 [ELEMENTS STORE] Element not found for deletion:', id);
        return;
      }

      set((state: Draft<CanvasElementsState>) => {
        delete state.elements[id];
        state.elementOrder = state.elementOrder.filter(elementId => elementId !== id);
      });
      
      PerformanceMonitor.recordMetric('elementDeleted', 1, 'canvas', { elementType: element.type });
      console.log('✅ [ELEMENTS STORE] Element deleted successfully:', id);
    } finally {
      endTiming();
    }
  },

  deleteElements: (ids: string[]) => {
    const endTiming = PerformanceMonitor.startTiming('deleteElements');
    
    try {
      console.log('🔧 [ELEMENTS STORE] Deleting multiple elements:', ids);
      
      set((state: Draft<CanvasElementsState>) => {
        ids.forEach(id => {
          delete state.elements[id];
        });
        state.elementOrder = state.elementOrder.filter(elementId => !ids.includes(elementId));
      });
      
      PerformanceMonitor.recordMetric('elementsDeleted', ids.length, 'canvas');
    } finally {
      endTiming();
    }
  },

  duplicateElement: (id: string) => {
    const endTiming = PerformanceMonitor.startTiming('duplicateElement');
    
    try {
      const element = get().elements[id];
      if (!element) {
        console.warn('🔧 [ELEMENTS STORE] Element not found for duplication:', id);
        return;
      }

      const duplicatedElement: CanvasElement = {
        ...element,
        id: `${element.id}_copy_${Date.now()}`,
        x: element.x + 10,
        y: element.y + 10
      };      get().addElement(duplicatedElement);
      
      PerformanceMonitor.recordMetric('elementDuplicated', 1, 'canvas', { elementType: element.type });
      console.log('✅ [ELEMENTS STORE] Element duplicated successfully:', id, '→', duplicatedElement.id);
    } finally {
      endTiming();
    }  },

  // Table operations implementation
  updateTableCell: (tableId: string, rowIndex: number, colIndex: number, updates: any) => {
    const endTiming = PerformanceMonitor.startTiming('updateTableCell');
    
    try {
      console.log('🔧 [TABLE] Updating table cell:', { tableId, rowIndex, colIndex, updates });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements[tableId];
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
          console.log('✅ [TABLE] Cell updated successfully:', { tableId, rowIndex, colIndex });
        } else {
          console.warn('🔧 [TABLE] Cell not found:', { tableId, rowIndex, colIndex });
        }
      });
      
      PerformanceMonitor.recordMetric('tableCellUpdated', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  addTableRow: (tableId: string, insertIndex?: number) => {
    const endTiming = PerformanceMonitor.startTiming('addTableRow');
    
    try {
      console.log('🔧 [TABLE] Adding table row:', { tableId, insertIndex });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements[tableId];
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
          text: '',
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
        
        console.log('✅ [TABLE] Row added successfully:', { tableId, newRowIndex, totalRows: rows.length });
      });
      
      PerformanceMonitor.recordMetric('tableRowAdded', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  addTableColumn: (tableId: string, insertIndex?: number) => {
    const endTiming = PerformanceMonitor.startTiming('addTableColumn');
    
    try {
      console.log('🔧 [TABLE] Adding table column:', { tableId, insertIndex });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements[tableId];
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
            text: '',
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
        
        console.log('✅ [TABLE] Column added successfully:', { tableId, newColIndex, totalColumns: columns.length });
      });
      
      PerformanceMonitor.recordMetric('tableColumnAdded', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  removeTableRow: (tableId: string, rowIndex: number) => {
    const endTiming = PerformanceMonitor.startTiming('removeTableRow');
    
    try {
      console.log('🔧 [TABLE] Removing table row:', { tableId, rowIndex });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements[tableId];
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
        
        console.log('✅ [TABLE] Row removed successfully:', { tableId, rowIndex, remainingRows: rows.length });
      });
      
      PerformanceMonitor.recordMetric('tableRowRemoved', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  removeTableColumn: (tableId: string, colIndex: number) => {
    const endTiming = PerformanceMonitor.startTiming('removeTableColumn');
    
    try {
      console.log('🔧 [TABLE] Removing table column:', { tableId, colIndex });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements[tableId];
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
        
        console.log('✅ [TABLE] Column removed successfully:', { tableId, colIndex, remainingColumns: columns.length });
      });
      
      PerformanceMonitor.recordMetric('tableColumnRemoved', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  resizeTableRow: (tableId: string, rowIndex: number, newHeight: number) => {
    const endTiming = PerformanceMonitor.startTiming('resizeTableRow');
    
    try {
      console.log('🔧 [TABLE] Resizing table row:', { tableId, rowIndex, newHeight });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements[tableId];
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
          console.log('✅ [TABLE] Row resized successfully:', { tableId, rowIndex, newHeight: rows[rowIndex].height });
        }
      });
      
      PerformanceMonitor.recordMetric('tableRowResized', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  resizeTableColumn: (tableId: string, colIndex: number, newWidth: number) => {
    const endTiming = PerformanceMonitor.startTiming('resizeTableColumn');
    
    try {
      console.log('🔧 [TABLE] Resizing table column:', { tableId, colIndex, newWidth });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements[tableId];
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
          console.log('✅ [TABLE] Column resized successfully:', { tableId, colIndex, newWidth: columns[colIndex].width });
        }
      });
      
      PerformanceMonitor.recordMetric('tableColumnResized', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  resizeTable: (tableId: string, newWidth: number, newHeight: number) => {
    const endTiming = PerformanceMonitor.startTiming('resizeTable');
    
    try {
      console.log('🔧 [TABLE] Resizing table:', { tableId, newWidth, newHeight });
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements[tableId];
        if (!element || element.type !== 'table') {
          console.warn('🔧 [TABLE] Table not found or invalid:', tableId);
          return;
        }
        
        // Update table element dimensions
        element.width = Math.max(100, newWidth);
        element.height = Math.max(60, newHeight);
        
        console.log('✅ [TABLE] Table resized successfully:', { tableId, newWidth: element.width, newHeight: element.height });
      });
      
      PerformanceMonitor.recordMetric('tableResized', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  // Drawing operations
  startDrawing: (x: number, y: number, tool: 'pen' | 'pencil') => {
    console.log('🖊️ [DRAWING] Starting drawing:', { x, y, tool });
    set((state: Draft<CanvasElementsState>) => {
      state.isDrawing = true;
      state.currentPath = [x, y];
      state.drawingTool = tool;
    });
  },

  updateDrawing: (x: number, y: number) => {
    const state = get();
    if (!state.isDrawing) return;
    
    set((state: Draft<CanvasElementsState>) => {
      state.currentPath.push(x, y);
    });
  },

  finishDrawing: () => {
    const state = get();
    if (!state.isDrawing || state.currentPath.length < 4) {
      console.log('🖊️ [DRAWING] Cannot finish drawing - insufficient points');
      get().cancelDrawing();
      return;
    }

    console.log('🖊️ [DRAWING] Finishing drawing, points:', state.currentPath.length / 2);
      // Create a new pen/pencil element
    const newElement: CanvasElement = {
      id: `${state.drawingTool}-${Date.now()}`,
      type: state.drawingTool === 'pen' ? 'pen' : 'pen', // Use 'pen' type for both
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      points: [...state.currentPath],
      stroke: state.drawingTool === 'pen' ? '#000000' : '#666666',
      strokeWidth: state.drawingTool === 'pen' ? 2 : 1,
      fill: ''
    };

    console.log('🖊️ [DRAWING] Creating new element with points:', newElement.points);
    console.log('🖊️ [DRAWING] Element will be added to store with id:', newElement.id);

    // Add the element and reset drawing state
    set((state: Draft<CanvasElementsState>) => {
      state.elements[newElement.id] = newElement;
      state.elementOrder.push(newElement.id);
      state.isDrawing = false;
      state.currentPath = [];
      state.drawingTool = null;
    });

    console.log('✅ [DRAWING] Drawing finished and saved as element:', newElement.id);
  },

  cancelDrawing: () => {
    console.log('🖊️ [DRAWING] Canceling drawing');
    set((state: Draft<CanvasElementsState>) => {
      state.isDrawing = false;
      state.currentPath = [];
      state.drawingTool = null;
    });
  },

  // Element queries
  getElementById: (id: string) => {
    return get().elements[id] || null;
  },

  getElementsByType: (type: string) => {
    const elements = get().elements;
    return Object.values(elements).filter(element => element.type === type);
  },

  getElementsByIds: (ids: string[]) => {
    const elements = get().elements;
    return ids.map(id => elements[id]).filter(Boolean) as CanvasElement[];
  },

  getAllElements: () => {
    return Object.values(get().elements);
  },

  // Element utilities
  clearAllElements: () => {
    const endTiming = PerformanceMonitor.startTiming('clearAllElements');
    
    try {
      const elementCount = Object.keys(get().elements).length;
      console.log('🔧 [ELEMENTS STORE] Clearing all elements, count:', elementCount);
      
      set((state: Draft<CanvasElementsState>) => {
        state.elements = {};
        state.elementOrder = [];
      });
      
      PerformanceMonitor.recordMetric('allElementsCleared', elementCount, 'canvas');      console.log('✅ [ELEMENTS STORE] All elements cleared successfully');
    } finally {
      endTiming();
    }
  },

  clearCanvas: () => {
    const endTiming = PerformanceMonitor.startTiming('clearCanvas');
    
    try {
      const elementCount = Object.keys(get().elements).length;
      console.log('🔧 [ELEMENTS STORE] Clearing entire canvas, element count:', elementCount);
      
      set((state: Draft<CanvasElementsState>) => {
        // Clear all elements
        state.elements = {};
        state.elementOrder = [];
        
        // Reset drawing state
        state.isDrawing = false;
        state.currentPath = [];
        state.drawingTool = null;
      });
      
      PerformanceMonitor.recordMetric('canvasCleared', elementCount, 'canvas');
      console.log('✅ [ELEMENTS STORE] Canvas cleared successfully');
    } finally {
      endTiming();
    }
  },

  exportElements: () => {
    const endTiming = PerformanceMonitor.startTiming('exportElements');
    
    try {
      const elements = Object.values(get().elements);
      console.log('🔧 [ELEMENTS STORE] Exporting elements, count:', elements.length);
      
      PerformanceMonitor.recordMetric('elementsExported', elements.length, 'canvas');
      return elements;
    } finally {
      endTiming();
    }
  },

  importElements: (elements: CanvasElement[]) => {
    const endTiming = PerformanceMonitor.startTiming('importElements');
    
    try {
      console.log('🔧 [ELEMENTS STORE] Importing elements, count:', elements.length);
      
      // Validate all elements first
      const validElements = elements.filter(element => get().validateElement(element));
      
      if (validElements.length !== elements.length) {
        console.warn('🔧 [ELEMENTS STORE] Some elements failed validation during import');
      }
      
      set((state: Draft<CanvasElementsState>) => {
        validElements.forEach(element => {
          state.elements[element.id] = { ...element };
          if (!state.elementOrder.includes(element.id)) {
            state.elementOrder.push(element.id);
          }
        });
      });
      
      PerformanceMonitor.recordMetric('elementsImported', validElements.length, 'canvas');
      console.log('✅ [ELEMENTS STORE] Elements imported successfully:', validElements.length);
    } finally {
      endTiming();
    }
  },
  validateElement: (element: CanvasElement): boolean => {
    const endTiming = PerformanceMonitor.startTiming('validateElement');
    
    try {
      console.log('🔧 [ELEMENTS STORE] Validating element:', JSON.stringify(element, null, 2));
      
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
      }      // Validate dimensions based on element type
      if (element.type === 'circle') {
        if (typeof element.radius !== 'number' || element.radius <= 0) {
          console.error('🔧 [ELEMENTS STORE] Invalid circle: missing or invalid radius', {
            radius: element.radius,
            typeRadius: typeof element.radius
          });
          return false;
        }
        console.log('✅ [ELEMENTS STORE] Circle validation passed');
      } else if (element.type === 'star') {
        // Star elements use radius and innerRadius
        if (typeof element.radius !== 'number' || element.radius <= 0 ||
            typeof element.innerRadius !== 'number' || element.innerRadius <= 0) {
          console.error('🔧 [ELEMENTS STORE] Invalid star: missing or invalid radius', {
            radius: element.radius,
            innerRadius: element.innerRadius,
            typeRadius: typeof element.radius,
            typeInnerRadius: typeof element.innerRadius
          });
          return false;
        }
        console.log('✅ [ELEMENTS STORE] Star validation passed');
      } else if (element.type === 'text') {
        // Text elements only need width, height is dynamic
        if (typeof element.width !== 'number' || element.width <= 0) {
          console.error('🔧 [ELEMENTS STORE] Invalid text: missing or invalid width', {
            width: element.width,
            typeWidth: typeof element.width
          });
          return false;
        }
        console.log('✅ [ELEMENTS STORE] Text validation passed');      } else if (element.type === 'pen') {
        // Pen elements use points array and don't need width/height
        if (!Array.isArray(element.points) || element.points.length < 4) {
          console.error('🔧 [ELEMENTS STORE] Invalid pen: missing or invalid points', {
            points: element.points,
            pointsLength: Array.isArray(element.points) ? element.points.length : 'not array'
          });
          return false;
        }
        console.log('✅ [ELEMENTS STORE] Pen validation passed');      } else if (element.type === 'table') {
        // Table elements need width, height, and enhancedTableData with rows/cols arrays
        if (typeof element.width !== 'number' || typeof element.height !== 'number' ||
            element.width <= 0 || element.height <= 0 ||
            !element.enhancedTableData || 
            !Array.isArray(element.enhancedTableData.rows) || 
            !Array.isArray(element.enhancedTableData.columns) ||
            element.enhancedTableData.rows.length <= 0 || 
            element.enhancedTableData.columns.length <= 0 ||
            !Array.isArray(element.enhancedTableData.cells)) {
          console.error('🔧 [ELEMENTS STORE] Invalid table: missing or invalid dimensions/structure', {
            width: element.width,
            height: element.height,
            enhancedTableData: element.enhancedTableData
          });
          return false;
        }
        console.log('✅ [ELEMENTS STORE] Table validation passed', {
          rows: element.enhancedTableData.rows.length,
          columns: element.enhancedTableData.columns.length,
          cellsCount: element.enhancedTableData.cells.length
        });
      } else if (element.type === 'section') {
        // Section elements need width and height
        if (typeof element.width !== 'number' || typeof element.height !== 'number' ||
            element.width <= 0 || element.height <= 0) {
          console.error('🔧 [ELEMENTS STORE] Invalid section: missing or invalid dimensions', {
            width: element.width,
            height: element.height
          });
          return false;        }
        console.log('✅ [ELEMENTS STORE] Section validation passed');
      } else if (element.type === 'connector') {
        // Connector elements use points array like pen
        if (!Array.isArray(element.points) || element.points.length < 4) {
          console.error('🔧 [ELEMENTS STORE] Invalid connector: missing or invalid points', {
            points: element.points,
            pointsLength: Array.isArray(element.points) ? element.points.length : 'not array'
          });
          return false;
        }
        console.log('✅ [ELEMENTS STORE] Connector validation passed');
      } else {
        // Most other elements need width and height
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
        console.log('✅ [ELEMENTS STORE] Element validation passed');
      }
      
      PerformanceMonitor.recordMetric('textValidation', 1, 'interaction', {
        isValid: true,
        elementType: element.type
      });
      
      console.log('✅ [ELEMENTS STORE] Element validation successful for:', element.type, element.id);
      return true;
    } finally {
      endTiming();
    }
  },

  optimizeElement: (id: string) => {
    const endTiming = PerformanceMonitor.startTiming('optimizeElement');
    
    try {
      const element = get().elements[id];
      if (!element) {
        console.warn('🔧 [ELEMENTS STORE] Element not found for optimization:', id);
        return;
      }

      console.log('🔧 [ELEMENTS STORE] Optimizing element:', id);
      
      let optimized = false;
      
      set((state: Draft<CanvasElementsState>) => {
        const stateElement = state.elements[id];
        if (!stateElement) return;
        
        // Example optimizations
        if (stateElement.width && stateElement.width < 1) {
          stateElement.width = 1;
          optimized = true;
        }
        if (stateElement.height && stateElement.height < 1) {
          stateElement.height = 1;
          optimized = true;
        }
      });
      
      if (optimized) {
        console.log('✅ [ELEMENTS STORE] Element optimized:', id);
      }
      
      PerformanceMonitor.recordMetric('elementOptimized', 1, 'canvas', { 
        elementType: element.type,
        hadChanges: optimized
      });
    } finally {
      endTiming();
    }  },
  // Placeholder for handleElementDrop - will be overridden in combined store
  handleElementDrop: (_elementId: string, _position: { x: number; y: number }) => {
    console.warn('🔧 [ELEMENTS STORE] handleElementDrop called but not implemented in slice');
    // This will be overridden in the combined store to avoid circular dependencies
  },
});

// Create individual store hook for direct component usage
export const useCanvasElementsStore = create<CanvasElementsState>()(
  subscribeWithSelector(
    immer(createCanvasElementsStore)
  )
);

// Export store selectors for optimized subscriptions
export const useCanvasElements = () => useCanvasElementsStore((state) => state.elements);
export const useElementOrder = () => useCanvasElementsStore((state) => state.elementOrder);
export const useAddElement = () => useCanvasElementsStore((state) => state.addElement);
export const useUpdateElement = () => useCanvasElementsStore((state) => state.updateElement);
export const useDeleteElement = () => useCanvasElementsStore((state) => state.deleteElement);
export const useGetElementById = () => useCanvasElementsStore((state) => state.getElementById);
export const useGetAllElements = () => useCanvasElementsStore((state) => state.getAllElements);

// Table operation selectors
export const useUpdateTableCell = () => useCanvasElementsStore((state) => state.updateTableCell);
export const useAddTableRow = () => useCanvasElementsStore((state) => state.addTableRow);
export const useAddTableColumn = () => useCanvasElementsStore((state) => state.addTableColumn);
export const useRemoveTableRow = () => useCanvasElementsStore((state) => state.removeTableRow);
export const useRemoveTableColumn = () => useCanvasElementsStore((state) => state.removeTableColumn);
export const useResizeTableRow = () => useCanvasElementsStore((state) => state.resizeTableRow);
export const useResizeTableColumn = () => useCanvasElementsStore((state) => state.resizeTableColumn);
export const useResizeTable = () => useCanvasElementsStore((state) => state.resizeTable);
