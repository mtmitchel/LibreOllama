import { TableElement, TableCell } from '../types/enhanced.types';

/**
 * Generates a unique key for a cell within a table for React rendering.
 * @param tableId The ID of the table element.
 * @param rowIndex The row index of the cell.
 * @param colIndex The column index of the cell.
 * @returns A stable, unique key for the cell.
 */
export const getTableDataKey = (tableId: string, rowIndex: number, colIndex: number): string => {
  return `${tableId}-cell-${rowIndex}-${colIndex}`;
};

/**
 * Retrieves a specific cell from a table element's data.
 * @param table The table element.
 * @param rowIndex The row index.
 * @param colIndex The column index.
 * @returns The cell object or null if out of bounds.
 */
export const getCell = (table: TableElement, rowIndex: number, colIndex: number): TableCell | null => {
    const row = table.enhancedTableData?.cells?.[rowIndex];
    if (!row) return null;
    const cell = row[colIndex];
    return cell ?? null;
}; 