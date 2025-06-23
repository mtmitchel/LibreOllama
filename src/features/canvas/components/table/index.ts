/**
 * Table Components - Export Module
 * Modular table functionality extracted from EnhancedTableElement
 */

// Table utilities and constants
export * from './tableUtils';

// Table functionality hooks
export * from './useTableResize';
export * from './useTableCellEditing';
export * from './useTableInteractions';

// Re-export types for convenience
export type { TableResizeHookProps, TableResizeState } from './useTableResize';
export type { CellEditingState, TableCellEditingHookProps } from './useTableCellEditing';
export type { TableInteractionState } from './useTableInteractions';
