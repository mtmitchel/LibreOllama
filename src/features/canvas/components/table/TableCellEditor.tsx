/**
 * Table Cell Editor - Provides a reliable text editing overlay for table cells.
 * 
 * Part of LibreOllama Canvas Coordinate System Fixes - Priority 3
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Html } from 'react-konva-utils';
import { Text } from 'react-konva';
import { useUnifiedCanvasStore } from '../../../../stores';
import type { TableElement, TableCell } from '../../types/enhanced.types';

interface TableCellEditorProps {
  tableElement: TableElement;
  rowIndex: number;
  colIndex: number;
  cell: TableCell;
  cellX: number;
  cellY: number;
  cellWidth: number;
  cellHeight: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
}

export const TableCellEditor: React.FC<TableCellEditorProps> = ({
  tableElement,
  rowIndex,
  colIndex,
  cell,
  cellX,
  cellY,
  cellWidth,
  cellHeight,
  isEditing,
  onStartEdit,
  onEndEdit
}) => {
  const [editText, setEditText] = useState(cell.content || '');
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Save cell content to the table
  const saveCell = useCallback(() => {
    if (!tableElement.tableData) return;
    
    const newTableData = [...tableElement.tableData];
    if (!newTableData[rowIndex]) {
      newTableData[rowIndex] = [];
    }
    
    // Create or update the cell object
    const updatedCell: TableCell = {
      ...cell,
      content: editText
    };
    
    newTableData[rowIndex][colIndex] = updatedCell;
    
    updateElement(tableElement.id, { tableData: newTableData });
    onEndEdit();
  }, [tableElement, rowIndex, colIndex, editText, cell, updateElement, onEndEdit]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditText(cell.content || '');
    onEndEdit();
  }, [cell.content, onEndEdit]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent canvas shortcuts
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveCell();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveCell();
      // Could add logic here to move to next cell
    }
  }, [saveCell, cancelEdit]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.select();
    }
  }, [isEditing]);

  // Handle double-click to start editing
  const handleDoubleClick = useCallback(() => {
    if (!isEditing) {
      setEditText(cell.content || '');
      onStartEdit();
    }
  }, [isEditing, cell.content, onStartEdit]);

  // When editing, render an HTML textarea overlay
  if (isEditing) {
    return (
      <Html
        divProps={{
          style: {
            position: 'absolute',
            left: cellX,
            top: cellY,
            width: cellWidth,
            height: cellHeight,
            zIndex: 1000,
          }
        }}
      >
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={saveCell}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid #4A90E2',
            borderRadius: '4px',
            padding: '4px',
            fontSize: cell.fontSize || 12,
            fontFamily: 'Arial, sans-serif',
            color: cell.textColor || '#333',
            backgroundColor: cell.backgroundColor || '#fff',
            textAlign: cell.textAlign || 'left',
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          placeholder="Enter text..."
        />
      </Html>
    );
  }

  // Otherwise, render the Konva Text
  return (
    <Text
      x={cellX + 4} // Small padding
      y={cellY + 4}
      width={cellWidth - 8}
      height={cellHeight - 8}
      text={cell.content || ''}
      fontSize={cell.fontSize || 12}
      fontFamily="Arial"
      fill={cell.textColor || '#333'}
      align={cell.textAlign || 'left'}
      verticalAlign={cell.verticalAlign || 'top'}
      wrap="word"
      ellipsis={true}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      // Visual feedback
      listening={true}
    />
  );
};

export default TableCellEditor;
