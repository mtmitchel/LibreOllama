// src/features/canvas/stores/slices/tableStore.ts
/**
 * Table Store Slice - Handles table-specific operations
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 */

import { StateCreator } from 'zustand';
import { Draft } from 'immer';
import type { CanvasElement } from '../types';
import { TableCell, TableRow, TableColumn, EnhancedTableData } from '../types';

export interface TableState {
  // Table operations
  updateTableCell: (tableId: string, rowIndex: number, colIndex: number, updates: Partial<TableCell>) => void;
  addTableRow: (tableId: string, insertIndex?: number) => void;
  addTableColumn: (tableId: string, insertIndex?: number) => void;
  removeTableRow: (tableId: string, rowIndex: number) => void;
  removeTableColumn: (tableId: string, colIndex: number) => void;
  resizeTableRow: (tableId: string, rowIndex: number, newHeight: number) => void;
  resizeTableColumn: (tableId: string, colIndex: number, newWidth: number) => void;
  resizeTable: (tableId: string, newWidth: number, newHeight: number) => void;
  
  // Table utilities
  createEnhancedTable: (x: number, y: number, rows?: number, cols?: number) => string;
  validateTableData: (tableData: EnhancedTableData) => boolean;
}

// Simple table creation utility
const createTableData = (id: string, rows: number, cols: number) => {
  const tableRows: TableRow[] = Array.from({ length: rows }, (_, i) => ({
    id: `row_${id}_${i}`,
    height: 50,
    minHeight: 30,
    isResizable: true,
    isHeader: i === 0
  }));

  const tableColumns: TableColumn[] = Array.from({ length: cols }, (_, i) => ({
    id: `col_${id}_${i}`,
    width: 120,
    minWidth: 80,
    isResizable: true
  }));

  const tableCells: TableCell[][] = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => ({
      id: `cell_${id}_${rowIndex}_${colIndex}`,
      text: '',
      segments: [{
        text: '',
        fontSize: 14,
        fontFamily: 'Inter, system-ui, sans-serif',
        fill: '#1F2937'
      }],
      containedElementIds: [],
      isHeader: rowIndex === 0,
      backgroundColor: rowIndex === 0 ? '#F9FAFB' : '#FFFFFF',
      textAlign: 'left' as const
    }))
  );

  return { rows: tableRows, columns: tableColumns, cells: tableCells };
};

export const createTableStore: StateCreator<
  TableState,
  [['zustand/immer', never]],
  [],
  TableState
> = (set) => ({
  updateTableCell: (tableId: string, rowIndex: number, colIndex: number, updates: Partial<TableCell>) => {
    console.log('📊 [TABLE STORE] updateTableCell called:', { tableId, rowIndex, colIndex, updates });
    
    set((state: Draft<any>) => {
      const element = state.elements[tableId];
      if (!element || element.type !== 'table' || !element.enhancedTableData) {
        console.warn('📊 [TABLE STORE] Invalid table element:', tableId);
        return;
      }
      
      const cell = element.enhancedTableData.cells[rowIndex]?.[colIndex];
      if (!cell) {
        console.warn('📊 [TABLE STORE] Cell not found:', { rowIndex, colIndex });
        return;
      }
      
      // Update the cell with new data
      Object.assign(cell, updates);
      
      // Handle rich text segments updates
      if (updates.segments) {
        cell.segments = updates.segments;
        cell.richTextSegments = updates.segments; // Backward compatibility
      }
      
      // Force element reference update to trigger re-render
      state.elements[tableId] = { ...element };
      
      console.log('✅ [TABLE STORE] Cell updated successfully');
    });
  },

  addTableRow: (tableId: string, insertIndex?: number) => {
    set((state: Draft<any>) => {
      const element = state.elements[tableId];
      if (!element || element.type !== 'table' || !element.enhancedTableData) return;
      
      const { enhancedTableData } = element;
      const actualIndex = insertIndex ?? enhancedTableData.rows.length;
      
      // Create new row
      const newRow: TableRow = {
        id: `row_${tableId}_${Date.now()}`,
        height: 50,
        minHeight: 30,
        isResizable: true,
        isHeader: false
      };
      
      // Create new cells for this row
      const newCells: TableCell[] = enhancedTableData.columns.map((_column: any, colIndex: number) => ({
        id: `cell_${tableId}_${actualIndex}_${colIndex}_${Date.now()}`,
        text: '',
        segments: [{
          text: '',
          fontSize: 14,
          fontFamily: 'Inter, system-ui, sans-serif',
          fill: '#1F2937'
        }],
        containedElementIds: [],
        isHeader: false,
        backgroundColor: '#FFFFFF'
      }));
      
      // Insert the new row and cells
      enhancedTableData.rows.splice(actualIndex, 0, newRow);
      enhancedTableData.cells.splice(actualIndex, 0, newCells);
      
      // Update table height
      element.height = enhancedTableData.rows.reduce((sum: number, row: any) => sum + row.height, 0);
      
      // Force element reference update
      state.elements[tableId] = { ...element };
    });
  },

  addTableColumn: (tableId: string, insertIndex?: number) => {
    set((state: Draft<any>) => {
      const element = state.elements[tableId];
      if (!element || element.type !== 'table' || !element.enhancedTableData) return;
      
      const { enhancedTableData } = element;
      const actualIndex = insertIndex ?? enhancedTableData.columns.length;
      
      // Create new column
      const newColumn: TableColumn = {
        id: `col_${tableId}_${Date.now()}`,
        width: 120,
        minWidth: 80,
        isResizable: true
      };
      
      // Insert the new column
      enhancedTableData.columns.splice(actualIndex, 0, newColumn);
      
      // Add new cells to each row
      enhancedTableData.cells.forEach((row: any, rowIndex: number) => {
        const newCell: TableCell = {
          id: `cell_${tableId}_${rowIndex}_${actualIndex}_${Date.now()}`,
          text: '',
          segments: [{
            text: '',
            fontSize: 14,
            fontFamily: 'Inter, system-ui, sans-serif',
            fill: '#1F2937'
          }],
          containedElementIds: [],
          isHeader: rowIndex === 0,
          backgroundColor: rowIndex === 0 ? '#F9FAFB' : '#FFFFFF'
        };
        row.splice(actualIndex, 0, newCell);
      });
      
      // Update table width
      element.width = enhancedTableData.columns.reduce((sum: number, col: any) => sum + col.width, 0);
      
      // Force element reference update
      state.elements[tableId] = { ...element };
    });
  },

  removeTableRow: (tableId: string, rowIndex: number) => {
    set((state: Draft<any>) => {
      const element = state.elements[tableId];
      if (!element || element.type !== 'table' || !element.enhancedTableData) return;
      
      const { enhancedTableData } = element;
      if (enhancedTableData.rows.length <= 1) return; // Don't allow removing all rows
      
      // Remove the row and its cells
      enhancedTableData.rows.splice(rowIndex, 1);
      enhancedTableData.cells.splice(rowIndex, 1);
      
      // Update table height
      element.height = enhancedTableData.rows.reduce((sum: number, row: any) => sum + row.height, 0);
      
      // Force element reference update
      state.elements[tableId] = { ...element };
    });
  },

  removeTableColumn: (tableId: string, colIndex: number) => {
    set((state: Draft<any>) => {
      const element = state.elements[tableId];
      if (!element || element.type !== 'table' || !element.enhancedTableData) return;
      
      const { enhancedTableData } = element;
      if (enhancedTableData.columns.length <= 1) return; // Don't allow removing all columns
      
      // Remove the column
      enhancedTableData.columns.splice(colIndex, 1);
      
      // Remove cells from each row
      enhancedTableData.cells.forEach((row: any) => {
        row.splice(colIndex, 1);
      });
      
      // Update table width
      element.width = enhancedTableData.columns.reduce((sum: number, col: any) => sum + col.width, 0);
      
      // Force element reference update
      state.elements[tableId] = { ...element };
    });
  },

  resizeTableRow: (tableId: string, rowIndex: number, newHeight: number) => {
    set((state: Draft<any>) => {
      const element = state.elements[tableId];
      if (!element || element.type !== 'table' || !element.enhancedTableData) return;
      
      const row = element.enhancedTableData.rows[rowIndex];
      if (row) {
        row.height = Math.max(30, newHeight); // Minimum height of 30px
        
        // Update total table height
        element.height = element.enhancedTableData.rows.reduce((sum: number, r: any) => sum + r.height, 0);
        
        // Force element reference update
        state.elements[tableId] = { ...element };
      }
    });
  },

  resizeTableColumn: (tableId: string, colIndex: number, newWidth: number) => {
    set((state: Draft<any>) => {
      const element = state.elements[tableId];
      if (!element || element.type !== 'table' || !element.enhancedTableData) return;
      
      const column = element.enhancedTableData.columns[colIndex];
      if (column) {
        column.width = Math.max(80, newWidth); // Minimum width of 80px
        
        // Update total table width
        element.width = element.enhancedTableData.columns.reduce((sum: number, c: any) => sum + c.width, 0);
        
        // Force element reference update
        state.elements[tableId] = { ...element };
      }
    });
  },

  resizeTable: (tableId: string, newWidth: number, newHeight: number) => {
    set((state: Draft<any>) => {
      const element = state.elements[tableId];
      if (!element || element.type !== 'table' || !element.enhancedTableData) return;
      
      const { enhancedTableData } = element;
      
      // Calculate scaling ratios
      const widthRatio = newWidth / element.width;
      const heightRatio = newHeight / element.height;
      
      // Scale columns proportionally
      enhancedTableData.columns.forEach((col: any) => {
        col.width = Math.max(80, col.width * widthRatio);
      });
      
      // Scale rows proportionally
      enhancedTableData.rows.forEach((row: any) => {
        row.height = Math.max(30, row.height * heightRatio);
      });
      
      // Update element dimensions
      element.width = newWidth;
      element.height = newHeight;
      
      // Force element reference update
      state.elements[tableId] = { ...element };
    });
  },

  createEnhancedTable: (x: number, y: number, rows = 3, cols = 3) => {
    const tableId = `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create table data
    const tableData = createTableData(tableId, rows, cols);
    
    // Calculate initial dimensions
    const initialWidth = tableData.columns.reduce((sum: number, col: any) => sum + col.width, 0);
    const initialHeight = tableData.rows.reduce((sum: number, row: any) => sum + row.height, 0);
    
    // Create table element
    const tableElement: CanvasElement = {
      id: tableId,
      type: 'table',
      x,
      y,
      width: initialWidth,
      height: initialHeight,
      enhancedTableData: tableData as EnhancedTableData,
      // Backward compatibility
      tableData: tableData.cells.map((row: any) => row.map((cell: any) => cell.text))
    };
    
    // Add to store (assuming this is part of the elements store)
    set((state: Draft<any>) => {
      state.elements[tableId] = tableElement;
    });
    
    return tableId;
  },

  validateTableData: (tableData: EnhancedTableData) => {
    if (!tableData || !tableData.rows || !tableData.columns || !tableData.cells) {
      return false;
    }
    
    // Check if rows and cells count match
    if (tableData.rows.length !== tableData.cells.length) {
      return false;
    }
    
    // Check if columns and cell row lengths match
    for (const cellRow of tableData.cells) {
      if (cellRow.length !== tableData.columns.length) {
        return false;
      }
    }
    
    return true;
  }
});
