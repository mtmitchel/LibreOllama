/**
 * Table constants and utilities for enhanced table functionality
 */

// Table sizing constants
export const MIN_CELL_WIDTH = 80;
export const MIN_CELL_HEIGHT = 40;
export const MAX_CELL_WIDTH = 500;
export const MAX_CELL_HEIGHT = 300;
export const MIN_TABLE_WIDTH = 160;
export const MIN_TABLE_HEIGHT = 80;

// Custom throttle function for resize operations
export const throttle = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
};

// Helper function to generate a stable key from table data
export const getTableDataKey = (tableData: any) => {
  if (!tableData) return 'empty';
  try {
    return JSON.stringify(tableData).slice(0, 100); // Truncate for performance
  } catch {
    return 'invalid';
  }
};

// Type guard for table cells
export const isFullTableCell = (cell: any): cell is import('../../types/enhanced.types').TableCell => {
  return cell && typeof cell === 'object' && 'id' in cell;
};
