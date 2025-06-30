import { useState, useCallback } from 'react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { ElementId } from '../types/enhanced.types';

export const useTableCellEditing = (
  tableId: ElementId,
  onStartEditing: (text: string) => void,
  onStopEditing: (rowIndex: number, colIndex: number, newContent: string) => void
) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const setEditingTextInput = useUnifiedCanvasStore((state) => state.setTextEditingElement);

  const startEditing = useCallback((row: number, col: number, initialContent: string) => {
    setEditingCell({ row, col });
    onStartEditing(initialContent);
    // Notify the global store that text editing is active
    setEditingTextInput(tableId);
  }, [onStartEditing, setEditingTextInput, tableId]);

  const stopEditing = useCallback((newContent: string) => {
    if (editingCell) {
      onStopEditing(editingCell.row, editingCell.col, newContent);
      setEditingCell(null);
      // Notify the global store that text editing has stopped
      setEditingTextInput(null);
    }
  }, [editingCell, onStopEditing, setEditingTextInput]);

  return {
    editingCell,
    startEditing,
    stopEditing,
  };
}; 