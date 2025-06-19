import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Group, Rect, Text, Line } from 'react-konva';
import { Html } from 'react-konva-utils';
import { CanvasElement, TableElementData, TableCell } from '../../types/canvas';
import { RichTextEditor } from './RichTextEditor';
import { useCanvasStore } from '../../store/canvasStore';
import { useTableTool } from '../../store/toolStore';
import { cn } from '../../lib/utils';

interface TableEditorProps {
  element: CanvasElement;
  isSelected: boolean;
  onCellEdit?: (row: number, col: number, content: any) => void;
  onResize?: (newBounds: { x: number; y: number; width: number; height: number }) => void;
  onRowResize?: (rowIndex: number, newHeight: number) => void;
  onColumnResize?: (colIndex: number, newWidth: number) => void;
}

export const TableEditor: React.FC<TableEditorProps> = ({
  element,
  isSelected,
  onCellEdit,
  onResize,
  onRowResize,
  onColumnResize
}) => {
  const data = element.data as TableElementData;
  const { updateElement } = useCanvasStore();
  const { 
    tableEditingState, 
    selectTableCell, 
    selectTableCells, 
    startTableResize,
    endTableEditing 
  } = useTableTool();

  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [cellContent, setCellContent] = useState<any>(null);
  
  const tableRef = useRef<any>(null);
  const editorPortalRef = useRef<HTMLDivElement | null>(null);

  // Calculate cell dimensions
  const cellWidth = element.width / data.cols;
  const cellHeight = element.height / data.rows;

  // Initialize cell data if not exists
  const initializeCellData = useCallback(() => {
    if (!data.cellData || data.cellData.length !== data.rows) {
      const newCellData: TableCell[][] = [];
      for (let row = 0; row < data.rows; row++) {
        newCellData[row] = [];
        for (let col = 0; col < data.cols; col++) {
          newCellData[row][col] = {
            content: [{ type: 'paragraph', children: [{ text: `Cell ${row + 1},${col + 1}` }] }],
            style: {},
            rowSpan: 1,
            colSpan: 1
          };
        }
      }
      
      updateElement(element.id, {
        data: { ...data, cellData: newCellData },
        modifiedAt: Date.now()
      });
    }
  }, [data, element.id, updateElement]);

  useEffect(() => {
    initializeCellData();
  }, [initializeCellData]);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number, event: any) => {
    event.cancelBubble = true;
    
    if (event.detail === 2) {
      // Double click - start editing
      setEditingCell({ row, col });
      const cellData = data.cellData?.[row]?.[col];
      setCellContent(cellData?.content || [{ type: 'paragraph', children: [{ text: '' }] }]);
    } else {
      // Single click - select cell
      selectTableCell(row, col);
    }
  }, [data.cellData, selectTableCell]);

  // Handle cell content change
  const handleCellContentChange = useCallback((content: any) => {
    setCellContent(content);
  }, []);

  // Save cell content
  const saveCellContent = useCallback(() => {
    if (!editingCell || !data.cellData) return;
    
    const newCellData = [...data.cellData];
    if (!newCellData[editingCell.row]) {
      newCellData[editingCell.row] = [];
    }
    
    newCellData[editingCell.row][editingCell.col] = {
      ...newCellData[editingCell.row][editingCell.col],
      content: cellContent
    };
    
    updateElement(element.id, {
      data: { ...data, cellData: newCellData },
      modifiedAt: Date.now()
    });
    
    onCellEdit?.(editingCell.row, editingCell.col, cellContent);
    setEditingCell(null);
    setCellContent(null);
  }, [editingCell, cellContent, data, element.id, updateElement, onCellEdit]);

  // Cancel cell editing
  const cancelCellEdit = useCallback(() => {
    setEditingCell(null);
    setCellContent(null);
  }, []);

  // Handle key down in table
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isSelected) return;
    
    const selectedCell = tableEditingState.selectedCell;
    if (!selectedCell) return;
    
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        const nextCol = selectedCell.col + (e.shiftKey ? -1 : 1);
        if (nextCol >= 0 && nextCol < data.cols) {
          selectTableCell(selectedCell.row, nextCol);
        } else if (!e.shiftKey && selectedCell.row + 1 < data.rows) {
          selectTableCell(selectedCell.row + 1, 0);
        } else if (e.shiftKey && selectedCell.row > 0) {
          selectTableCell(selectedCell.row - 1, data.cols - 1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedCell.row + 1 < data.rows) {
          selectTableCell(selectedCell.row + 1, selectedCell.col);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (selectedCell.row > 0) {
          selectTableCell(selectedCell.row - 1, selectedCell.col);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (selectedCell.row + 1 < data.rows) {
          selectTableCell(selectedCell.row + 1, selectedCell.col);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (selectedCell.col > 0) {
          selectTableCell(selectedCell.row, selectedCell.col - 1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (selectedCell.col + 1 < data.cols) {
          selectTableCell(selectedCell.row, selectedCell.col + 1);
        }
        break;
      case 'F2':
      case ' ':
        e.preventDefault();
        setEditingCell(selectedCell);
        const cellData = data.cellData?.[selectedCell.row]?.[selectedCell.col];
        setCellContent(cellData?.content || [{ type: 'paragraph', children: [{ text: '' }] }]);
        break;
      case 'Escape':
        if (editingCell) {
          cancelCellEdit();
        } else {
          endTableEditing();
        }
        break;
    }
  }, [isSelected, tableEditingState.selectedCell, data, selectTableCell, editingCell, cancelCellEdit, endTableEditing]);

  useEffect(() => {
    if (isSelected) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSelected, handleKeyDown]);

  // Render table cells
  const renderCells = () => {
    const cells = [];
    
    for (let row = 0; row < data.rows; row++) {
      for (let col = 0; col < data.cols; col++) {
        const x = col * cellWidth;
        const y = row * cellHeight;
        const cellData = data.cellData?.[row]?.[col];
        const isSelectedCell = tableEditingState.selectedCell?.row === row && 
                              tableEditingState.selectedCell?.col === col;
        const isEditingThisCell = editingCell?.row === row && editingCell?.col === col;
        
        // Cell background
        cells.push(
          <Rect
            key={`cell-bg-${row}-${col}`}
            x={x}
            y={y}
            width={cellWidth}
            height={cellHeight}
            fill={isSelectedCell ? '#e3f2fd' : (data.backgroundColor || '#ffffff')}
            stroke={data.borderColor || '#cccccc'}
            strokeWidth={data.borderWidth || 1}
            onClick={(e) => handleCellClick(row, col, e)}
            onDblClick={(e) => handleCellClick(row, col, e)}
            perfectDrawEnabled={false}
          />
        );
        
        // Cell content (only if not editing)
        if (!isEditingThisCell && cellData) {
          const textContent = extractTextFromSlateContent(cellData.content);
          cells.push(
            <Text
              key={`cell-text-${row}-${col}`}
              x={x + 5}
              y={y + 5}
              width={cellWidth - 10}
              height={cellHeight - 10}
              text={textContent}
              fontSize={12}
              fontFamily="Inter"
              fill="#333"
              align="left"
              verticalAlign="top"
              wrap="word"
              ellipsis={true}
              onClick={(e) => handleCellClick(row, col, e)}
              onDblClick={(e) => handleCellClick(row, col, e)}
              perfectDrawEnabled={false}
            />
          );
        }
        
        // Selection highlight
        if (isSelectedCell && !isEditingThisCell) {
          cells.push(
            <Rect
              key={`cell-selection-${row}-${col}`}
              x={x}
              y={y}
              width={cellWidth}
              height={cellHeight}
              stroke="#1976d2"
              strokeWidth={2}
              fill="transparent"
              listening={false}
              perfectDrawEnabled={false}
            />
          );
        }
      }
    }
    
    return cells;
  };

  // Render resize handles
  const renderResizeHandles = () => {
    if (!isSelected) return [];
    
    const handles = [];
    
    // Column resize handles
    for (let col = 1; col < data.cols; col++) {
      const x = col * cellWidth;
      handles.push(
        <Line
          key={`col-resize-${col}`}
          points={[x, 0, x, element.height]}
          stroke="#1976d2"
          strokeWidth={2}
          opacity={0.7}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'col-resize';
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'default';
          }}
          onMouseDown={(e) => {
            e.cancelBubble = true;
            startTableResize('col', col);
            // Handle column resize logic
          }}
          perfectDrawEnabled={false}
        />
      );
    }
    
    // Row resize handles
    for (let row = 1; row < data.rows; row++) {
      const y = row * cellHeight;
      handles.push(
        <Line
          key={`row-resize-${row}`}
          points={[0, y, element.width, y]}
          stroke="#1976d2"
          strokeWidth={2}
          opacity={0.7}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'row-resize';
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'default';
          }}
          onMouseDown={(e) => {
            e.cancelBubble = true;
            startTableResize('row', row);
            // Handle row resize logic
          }}
          perfectDrawEnabled={false}
        />
      );
    }
    
    return handles;
  };

  return (
    <>
      <Group
        ref={tableRef}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        opacity={element.opacity}
        visible={element.visible}
      >
        {renderCells()}
        {renderResizeHandles()}
      </Group>
      
      {/* Rich text editor overlay for cell editing */}
      {editingCell && (
        <Html
          divProps={{
            style: {
              position: 'absolute',
              left: element.x + editingCell.col * cellWidth,
              top: element.y + editingCell.row * cellHeight,
              width: cellWidth,
              height: cellHeight,
              zIndex: 1000,
              pointerEvents: 'auto'
            }
          }}
        >
          <div
            className="absolute inset-0 bg-white border-2 border-blue-500 rounded"
            style={{
              width: cellWidth,
              height: cellHeight
            }}
          >
            <RichTextEditor
              value={cellContent || [{ type: 'paragraph', children: [{ text: '' }] }]}
              onChange={handleCellContentChange}
              onBlur={saveCellContent}
              autoFocus
              className="w-full h-full p-1"
              style={{
                fontSize: '12px',
                fontFamily: 'Inter'
              }}
            />
          </div>
        </Html>
      )}
    </>
  );
};

// Table manipulation functions
export const addTableRow = (element: CanvasElement, index: number): CanvasElement => {
  const data = element.data as TableElementData;
  const newCellData = [...(data.cellData || [])];
  
  // Insert new row
  const newRow: TableCell[] = [];
  for (let col = 0; col < data.cols; col++) {
    newRow.push({
      content: [{ type: 'paragraph', children: [{ text: '' }] }],
      style: {},
      rowSpan: 1,
      colSpan: 1
    });
  }
  
  newCellData.splice(index, 0, newRow);
  
  return {
    ...element,
    height: element.height + (element.height / data.rows),
    data: {
      ...data,
      rows: data.rows + 1,
      cellData: newCellData,
      rowHeights: [...(data.rowHeights || []), element.height / data.rows]
    },
    modifiedAt: Date.now()
  };
};

export const removeTableRow = (element: CanvasElement, index: number): CanvasElement => {
  const data = element.data as TableElementData;
  if (data.rows <= 1) return element;
  
  const newCellData = [...(data.cellData || [])];
  newCellData.splice(index, 1);
  
  return {
    ...element,
    height: element.height * ((data.rows - 1) / data.rows),
    data: {
      ...data,
      rows: data.rows - 1,
      cellData: newCellData,
      rowHeights: (data.rowHeights || []).filter((_, i) => i !== index)
    },
    modifiedAt: Date.now()
  };
};

export const addTableColumn = (element: CanvasElement, index: number): CanvasElement => {
  const data = element.data as TableElementData;
  const newCellData = (data.cellData || []).map(row => {
    const newRow = [...row];
    newRow.splice(index, 0, {
      content: [{ type: 'paragraph', children: [{ text: '' }] }],
      style: {},
      rowSpan: 1,
      colSpan: 1
    });
    return newRow;
  });
  
  return {
    ...element,
    width: element.width + (element.width / data.cols),
    data: {
      ...data,
      cols: data.cols + 1,
      cellData: newCellData,
      columnWidths: [...(data.columnWidths || []), element.width / data.cols]
    },
    modifiedAt: Date.now()
  };
};

export const removeTableColumn = (element: CanvasElement, index: number): CanvasElement => {
  const data = element.data as TableElementData;
  if (data.cols <= 1) return element;
  
  const newCellData = (data.cellData || []).map(row => 
    row.filter((_, colIndex) => colIndex !== index)
  );
  
  return {
    ...element,
    width: element.width * ((data.cols - 1) / data.cols),
    data: {
      ...data,
      cols: data.cols - 1,
      cellData: newCellData,
      columnWidths: (data.columnWidths || []).filter((_, i) => i !== index)
    },
    modifiedAt: Date.now()
  };
};

// Helper function to extract text from Slate content
const extractTextFromSlateContent = (content: any): string => {
  if (!content || !Array.isArray(content)) return '';
  
  return content.map(node => {
    if (node.children) {
      return node.children.map((child: any) => child.text || '').join('');
    }
    return node.text || '';
  }).join('\n');
};

export default TableEditor;