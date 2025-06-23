import { useState, useCallback, useEffect } from 'react';
import { ElementId } from '../../types/enhanced.types';
import { designSystem } from '../../../../design-system/designSystem';

export interface CellEditingState {
  editingCell: { row: number; col: number } | null;
  cellEditorPosition: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
}

export interface TableCellEditingHookProps {
  tableId: ElementId;
  tableRows: any[];
  tableColumns: any[];
  updateTableCell: (tableId: ElementId, row: number, col: number, data: any) => void;
  removeTableRow?: (tableId: ElementId, rowIndex: number) => void;
  removeTableColumn?: (tableId: ElementId, colIndex: number) => void;
}

/**
 * Hook for managing table cell editing functionality
 */
export const useTableCellEditing = ({
  tableId,
  tableRows,
  tableColumns,
  updateTableCell,
  removeTableRow,
  removeTableColumn
}: TableCellEditingHookProps) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [cellEditorPosition, setCellEditorPosition] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Handle cell double click to start editing
  const handleCellDoubleClick = useCallback((rowIndex: number, colIndex: number) => {
    try {
      console.log('🔧 [TABLE] Starting cell edit:', { rowIndex, colIndex });
      setEditingCell({ row: rowIndex, col: colIndex });
    } catch (error) {
      console.error("ERROR in handleCellDoubleClick:", error);
    }
  }, []);

  // Tab navigation helper functions
  const getNextCell = useCallback((currentRow: number, currentCol: number, reverse = false) => {
    const totalRows = tableRows.length;
    const totalCols = tableColumns.length;

    if (reverse) {
      // Tab backwards (Shift+Tab)
      if (currentCol > 0) {
        return { row: currentRow, col: currentCol - 1 };
      } else if (currentRow > 0) {
        return { row: currentRow - 1, col: totalCols - 1 };
      } else {
        // Wrap to last cell
        return { row: totalRows - 1, col: totalCols - 1 };
      }
    } else {
      // Tab forwards
      if (currentCol < totalCols - 1) {
        return { row: currentRow, col: currentCol + 1 };
      } else if (currentRow < totalRows - 1) {
        return { row: currentRow + 1, col: 0 };
      } else {
        // Wrap to first cell
        return { row: 0, col: 0 };
      }
    }
  }, [tableRows.length, tableColumns.length]);

  const navigateToCell = useCallback((targetRow: number, targetCol: number) => {
    // Start editing the target cell
    setEditingCell({ row: targetRow, col: targetCol });
  }, []);

  // Enhanced cell save handler with tab navigation support
  const handleCellSave = useCallback((text: string, shouldNavigateNext = false, navigateReverse = false) => {
    if (!editingCell) return;

    try {
      // Prepare the update data
      const updateData = {
        text,
        segments: [{
          text,
          fontSize: 14,
          fontFamily: designSystem.typography.fontFamily.sans,
          fill: designSystem.colors.secondary[800]
        }]
      };

      // Use the store's updateTableCell method
      updateTableCell(tableId, editingCell.row, editingCell.col, updateData);

      // Handle tab navigation
      if (shouldNavigateNext) {
        const nextCell = getNextCell(editingCell.row, editingCell.col, navigateReverse);
        // Small delay to ensure save completes before navigating
        setTimeout(() => {
          navigateToCell(nextCell.row, nextCell.col);
        }, 50);
      } else {
        // Clear editing state immediately for non-tab saves
        setEditingCell(null);
      }

    } catch (error) {
      console.error('ERROR in handleCellSave:', error);
      setEditingCell(null);
    }
  }, [editingCell, tableId, updateTableCell, getNextCell, navigateToCell]);

  // Handle cell edit cancel
  const handleCellCancel = useCallback(() => {
    console.log('❌ [TABLE] Cancelling cell edit');
    setEditingCell(null);
  }, []);
  // Keyboard handling for cell editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && editingCell) {
        if (e.shiftKey) {
          // Shift+Delete: Delete column
          removeTableColumn?.(tableId, editingCell.col);
          setEditingCell(null);
        } else if (e.ctrlKey || e.metaKey) {
          // Ctrl+Delete: Delete row
          removeTableRow?.(tableId, editingCell.row);
          setEditingCell(null);
        }
      }
    };

    if (editingCell) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    
    return undefined;
  }, [editingCell, tableId, removeTableRow, removeTableColumn]);

  return {
    // State
    editingCell,
    cellEditorPosition,
    
    // Handlers
    handleCellDoubleClick,
    handleCellSave,
    handleCellCancel,
    navigateToCell,
    
    // Setters
    setEditingCell,
    setCellEditorPosition
  };
};
