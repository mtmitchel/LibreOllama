import { 
  ElementId,
  isTableElement,
  TableCell 
} from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';

/**
 * Table module state - no additional state needed as tables are stored in elements
 */
export interface TableState {
  // Table state is managed within element state
}

/**
 * Table module actions
 */
export interface TableActions {
  updateTableCell: (tableId: ElementId, row: number, col: number, value: string) => void;
  addTableRow: (tableId: ElementId, position?: number) => void;
  removeTableRow: (tableId: ElementId, rowIndex: number) => void;
  addTableColumn: (tableId: ElementId, position?: number) => void;
  removeTableColumn: (tableId: ElementId, colIndex: number) => void;
  resizeTableCell: (tableId: ElementId, rowIndex: number, colIndex: number, width?: number, height?: number) => void;
}

/**
 * Creates the table module
 */
export const createTableModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<TableState, TableActions> => {
  return {
    state: {
      // No additional state needed
    },
    
    actions: {
      updateTableCell: (tableId, row, col, value) => {
        console.log('🔥 [updateTableCell] CALLED with:', { tableId, row, col, value });
        
        set(state => {
          const table = state.elements.get(tableId);
          console.log('🔥 [updateTableCell] Found table:', !!table, table?.type);
          
          if (table && isTableElement(table)) {
            // Ensure enhancedTableData exists
            if (!table.enhancedTableData) {
              console.log('🔥 [updateTableCell] Creating enhancedTableData');
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
              console.log('🔥 [updateTableCell] Fixing cells array dimensions');
              table.enhancedTableData.cells = Array(table.rows).fill(null).map((_, r) => 
                Array(table.cols).fill(null).map((_, c) => 
                  table.enhancedTableData?.cells?.[r]?.[c] || { content: '', text: '' }
                )
              );
            }

            // Update the specific cell
            if (table.enhancedTableData.cells[row] && table.enhancedTableData.cells[row][col]) {
              console.log('🔥 [updateTableCell] OLD cell value:', table.enhancedTableData.cells[row][col]);
              
              // Clone the cell object to avoid mutating in-place
              const newCell = {
                content: value,
                text: value,
                backgroundColor: row === 0 || col === 0 ? '#F8FAFC' : 'white',
                textColor: '#1F2937',
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                textAlign: col === 0 ? 'left' : 'left',
                verticalAlign: 'middle'
              } as TableCell;

              console.log('🔥 [updateTableCell] NEW cell value:', newCell);

              // Replace the cell to ensure new reference
              const newRow = [...table.enhancedTableData.cells[row]];
              newRow[col] = newCell;

              const newCells = [...table.enhancedTableData.cells];
              newCells[row] = newRow;

              // Replace enhancedTableData with new reference
              const newEnhancedData = {
                ...table.enhancedTableData,
                cells: newCells
              };

              // Replace table element with new reference
              const newTable = {
                ...table,
                enhancedTableData: newEnhancedData,
                updatedAt: Date.now()
              } as typeof table;

              // Replace in elements map with new map reference
              const newElements = new Map(state.elements);
              newElements.set(tableId, newTable);

              state.elements = newElements;

              console.log('🔥 [updateTableCell] Updated cell (immutable):', { tableId, row, col, value });
              console.log('🔥 [updateTableCell] New table data:', newTable.enhancedTableData.cells[row][col]);

              return;
            }

            // Update timestamp
            table.updatedAt = Date.now();

            console.log('🔥 [updateTableCell] Updated cell (mutable path):', { tableId, row, col, value });
          } else {
            console.error('🔥 [updateTableCell] Table not found or not a table element');
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
    },
  };
};