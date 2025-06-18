import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useKonvaCanvasStore } from '../../features/canvas/stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';
import '../../styles/enhanced-table.css';

// Constants for improved interaction
const HANDLE_SIZE = 12; // Larger handles for easier clicking
const MIN_CELL_WIDTH = 60;
const MIN_CELL_HEIGHT = 35;
const HOVER_DETECTION_SIZE = 20; // Size of invisible hover detection areas
const RESIZE_THROTTLE_MS = 16; // ~60fps for smooth resizing

interface ImprovedTableElementProps {
  id: string;
  x: number;
  y: number;
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  tableData: string[][];
  isSelected: boolean;
  onSelect: (id: string) => void;
  stageRef?: React.RefObject<Konva.Stage | null>;
}

const ImprovedTableElement = React.forwardRef<Konva.Group, ImprovedTableElementProps>(
  ({ id, x, y, rows, cols, cellWidth, cellHeight, tableData, isSelected, onSelect, stageRef }, ref) => {
  // State management
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  
  const [hoveredBoundary, setHoveredBoundary] = useState<{
    type: 'row' | 'col' | null;
    index: number;
    position: { x: number; y: number };
  }>({ type: null, index: -1, position: { x: 0, y: 0 } });

  const [hoveredHeader, setHoveredHeader] = useState<{
    type: 'row' | 'col' | null;
    index: number;
    position: { x: number; y: number };
  }>({ type: null, index: -1, position: { x: 0, y: 0 } });

  // Refs for managing hover timeouts and editor
  const boundaryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);  const lastResizeTimeRef = useRef<number>(0);

  // Store integration - Fixed: Use specific selector to prevent infinite re-renders
  const updateElement = useKonvaCanvasStore(state => state.updateElement);

  // Calculate table dimensions
  const tableWidth = cols * cellWidth;
  const tableHeight = rows * cellHeight;

  // Throttled resize function for smooth performance
  const throttledResize = useCallback((newWidth: number, newHeight: number) => {
    const now = Date.now();
    if (now - lastResizeTimeRef.current < RESIZE_THROTTLE_MS) return;
    
    lastResizeTimeRef.current = now;
    
    const constrainedWidth = Math.max(MIN_CELL_WIDTH, newWidth);
    const constrainedHeight = Math.max(MIN_CELL_HEIGHT, newHeight);
    
    updateElement(id, {
      cellWidth: constrainedWidth,
      cellHeight: constrainedHeight,
    });
  }, [id, updateElement]);

  // Handle add row/column
  const handleAddRow = (afterIndex: number) => {
    const newRow = Array(cols).fill('');
    const newTableData = [
      ...tableData.slice(0, afterIndex + 1),
      newRow,
      ...tableData.slice(afterIndex + 1),
    ];
    
    updateElement(id, {
      rows: rows + 1,
      tableData: newTableData,
    });
  };

  const handleAddCol = (afterIndex: number) => {
    const newTableData = tableData.map(row => [
      ...row.slice(0, afterIndex + 1),
      '',
      ...row.slice(afterIndex + 1),
    ]);
    
    updateElement(id, {
      cols: cols + 1,
      tableData: newTableData,
    });
  };

  // Handle remove row/column with minimum constraints
  const handleRemoveRow = (index: number) => {
    if (rows <= 1) return;
    
    const newTableData = tableData.filter((_, i) => i !== index);
    updateElement(id, {
      rows: rows - 1,
      tableData: newTableData,
    });
  };

  const handleRemoveCol = (index: number) => {
    if (cols <= 1) return;
    
    const newTableData = tableData.map(row => row.filter((_, i) => i !== index));
    updateElement(id, {
      cols: cols - 1,
      tableData: newTableData,
    });
  };

  // Cell editing functionality with improved positioning
  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    if (!stageRef?.current) return;
    
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(tableData[rowIndex]?.[colIndex] || '');
    
    // Calculate accurate cell position relative to stage container
    const stage = stageRef.current;
    const container = stage.container();
    const containerRect = container.getBoundingClientRect();
    
    // Get stage transformation
    const stageScale = stage.scaleX();
    const stageTransform = stage.getAbsoluteTransform();
    
    // Calculate cell position in canvas coordinates
    const cellCanvasX = x + (colIndex * cellWidth);
    const cellCanvasY = y + (rowIndex * cellHeight);
    
    // Convert to screen coordinates
    const cellScreenPoint = stageTransform.point({ x: cellCanvasX, y: cellCanvasY });
    
    // Calculate absolute position for editor
    const editorX = containerRect.left + cellScreenPoint.x;
    const editorY = containerRect.top + cellScreenPoint.y;
    const editorWidth = cellWidth * stageScale;
    const editorHeight = cellHeight * stageScale;
    
    // Store position for editor positioning
    const editorPosition = { 
      x: editorX, 
      y: editorY, 
      width: editorWidth, 
      height: editorHeight 
    };
    
    // Position editor over the cell with slight delay for DOM updates
    setTimeout(() => {
      if (editorRef.current) {
        // Position the editor
        const editor = editorRef.current;
        editor.style.position = 'absolute';
        editor.style.left = `${editorPosition.x}px`;
        editor.style.top = `${editorPosition.y}px`;
        editor.style.width = `${editorPosition.width}px`;
        editor.style.height = `${editorPosition.height}px`;
        editor.style.zIndex = '1000';
        editor.style.border = '2px solid #0066cc';
        editor.style.background = 'white';
        editor.style.padding = '4px';
        editor.style.fontSize = '14px';
        editor.style.fontFamily = 'Inter, sans-serif';
        
        editor.focus();
        editor.select();
      }
    }, 10);
  };

  const handleEditSave = () => {
    if (!editingCell) return;
    
    const newTableData = [...tableData];
    if (!newTableData[editingCell.row]) {
      newTableData[editingCell.row] = [];
    }
    // Ensure the row array exists before accessing the column
    const rowArray = newTableData[editingCell.row];
    if (rowArray) {
      rowArray[editingCell.col] = editValue;
    }
    
    updateElement(id, { tableData: newTableData });
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Enhanced hover management with debouncing
  const handleBoundaryHover = (type: 'row' | 'col', index: number, position: { x: number; y: number }) => {
    if (boundaryTimeoutRef.current) {
      clearTimeout(boundaryTimeoutRef.current);
    }
    
    setHoveredBoundary({ type, index, position });
  };

  const handleBoundaryLeave = () => {
    boundaryTimeoutRef.current = setTimeout(() => {
      setHoveredBoundary({ type: null, index: -1, position: { x: 0, y: 0 } });
    }, 100); // Small delay to prevent flicker
  };

  const handleHeaderHover = (type: 'row' | 'col', index: number, position: { x: number; y: number }) => {
    if (headerTimeoutRef.current) {
      clearTimeout(headerTimeoutRef.current);
    }
    
    setHoveredHeader({ type, index, position });
  };

  const handleHeaderLeave = () => {
    headerTimeoutRef.current = setTimeout(() => {
      setHoveredHeader({ type: null, index: -1, position: { x: 0, y: 0 } });
    }, 100);
  };

  // Dedicated resize handles with improved UX
  const ResizeHandle: React.FC<{
    x: number;
    y: number;
    type: 'corner' | 'horizontal' | 'vertical';
    onDragStart: () => void;
    onDragMove: (e: KonvaEventObject<DragEvent>) => void;
    onDragEnd: () => void;
  }> = ({ x, y, type, onDragStart, onDragMove, onDragEnd }) => {
    const cursor = type === 'corner' ? 'nw-resize' : type === 'horizontal' ? 'ew-resize' : 'ns-resize';
    
    return (
      <Circle
        x={x}
        y={y}
        radius={HANDLE_SIZE / 2}
        fill={designSystem.colors.primary[500]}
        stroke="white"
        strokeWidth={2}
        draggable
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = cursor;
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
        visible={isSelected}
      />
    );
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (boundaryTimeoutRef.current) clearTimeout(boundaryTimeoutRef.current);
      if (headerTimeoutRef.current) clearTimeout(headerTimeoutRef.current);
    };
  }, []);

  // Get editor position for current editing cell
  const getEditorPosition = () => {
    if (!editingCell || !stageRef?.current) return null;
    
    const stage = stageRef.current;
    const container = stage.container();
    const containerRect = container.getBoundingClientRect();
    const stagePos = stage.getAbsolutePosition();
    const scale = stage.scaleX();
    
    const cellX = x + (editingCell.col * cellWidth);
    const cellY = y + (editingCell.row * cellHeight);
    
    return {
      x: containerRect.left + (cellX + stagePos.x) * scale,
      y: containerRect.top + (cellY + stagePos.y) * scale,
      width: cellWidth * scale,
      height: cellHeight * scale,
    };
  };

  const editorPosition = getEditorPosition();

  return (
    <>
      <Group
        ref={ref}
        x={x}
        y={y}
        draggable={!isResizing}
        onClick={() => onSelect(id)}
        onDragEnd={(e) => {
          updateElement(id, {
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
      >
        {/* Table cells */}
        {Array.from({ length: rows }, (_, rowIndex) =>
          Array.from({ length: cols }, (_, colIndex) => {
            const cellX = colIndex * cellWidth;
            const cellY = rowIndex * cellHeight;
            const cellText = tableData[rowIndex]?.[colIndex] || '';
            
            return (
              <Group key={`cell-${rowIndex}-${colIndex}`}>
                <Rect
                  x={cellX}
                  y={cellY}
                  width={cellWidth}
                  height={cellHeight}
                  stroke={designSystem.colors.secondary[300]}
                  strokeWidth={1}
                  fill={designSystem.colors.secondary[50]}
                  onDblClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                />
                <Text
                  x={cellX + 8}
                  y={cellY + 8}
                  text={cellText}
                  width={cellWidth - 16}
                  height={cellHeight - 16}
                  fontSize={14}
                  fontFamily="Inter, system-ui, sans-serif"
                  fill={designSystem.colors.secondary[900]}
                  verticalAlign="top"
                  wrap="char"
                  ellipsis
                />
              </Group>
            );
          })
        )}

        {/* Enhanced boundary hover areas for adding rows/columns */}
        {Array.from({ length: rows + 1 }, (_, index) => (
          <Rect
            key={`row-boundary-${index}`}
            x={-HOVER_DETECTION_SIZE / 2}
            y={index * cellHeight - HOVER_DETECTION_SIZE / 2}
            width={tableWidth + HOVER_DETECTION_SIZE}
            height={HOVER_DETECTION_SIZE}
            fill="transparent"
            onMouseEnter={() => handleBoundaryHover('row', index, { x: tableWidth / 2, y: index * cellHeight })}
            onMouseLeave={handleBoundaryLeave}
          />
        ))}

        {Array.from({ length: cols + 1 }, (_, index) => (
          <Rect
            key={`col-boundary-${index}`}
            x={index * cellWidth - HOVER_DETECTION_SIZE / 2}
            y={-HOVER_DETECTION_SIZE / 2}
            width={HOVER_DETECTION_SIZE}
            height={tableHeight + HOVER_DETECTION_SIZE}
            fill="transparent"
            onMouseEnter={() => handleBoundaryHover('col', index, { x: index * cellWidth, y: tableHeight / 2 })}
            onMouseLeave={handleBoundaryLeave}
          />
        ))}

        {/* Header hover areas for removing rows/columns */}
        {Array.from({ length: rows }, (_, index) => (
          <Rect
            key={`row-header-${index}`}
            x={-HOVER_DETECTION_SIZE}
            y={index * cellHeight}
            width={HOVER_DETECTION_SIZE}
            height={cellHeight}
            fill="transparent"
            onMouseEnter={() => handleHeaderHover('row', index, { x: -HANDLE_SIZE, y: index * cellHeight + cellHeight / 2 })}
            onMouseLeave={handleHeaderLeave}
          />
        ))}

        {Array.from({ length: cols }, (_, index) => (
          <Rect
            key={`col-header-${index}`}
            x={index * cellWidth}
            y={-HOVER_DETECTION_SIZE}
            width={cellWidth}
            height={HOVER_DETECTION_SIZE}
            fill="transparent"
            onMouseEnter={() => handleHeaderHover('col', index, { x: index * cellWidth + cellWidth / 2, y: -HANDLE_SIZE })}
            onMouseLeave={handleHeaderLeave}
          />
        ))}

        {/* Add handles */}
        {hoveredBoundary.type === 'row' && (
          <Circle
            x={hoveredBoundary.position.x}
            y={hoveredBoundary.position.y}
            radius={HANDLE_SIZE / 2}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            onClick={() => handleAddRow(hoveredBoundary.index - 1)}
          />
        )}

        {hoveredBoundary.type === 'col' && (
          <Circle
            x={hoveredBoundary.position.x}
            y={hoveredBoundary.position.y}
            radius={HANDLE_SIZE / 2}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            onClick={() => handleAddCol(hoveredBoundary.index - 1)}
          />
        )}

        {/* Remove handles */}
        {hoveredHeader.type === 'row' && rows > 1 && (
          <Circle
            x={hoveredHeader.position.x}
            y={hoveredHeader.position.y}
            radius={HANDLE_SIZE / 2}
            fill="#ef4444"
            stroke="white"
            strokeWidth={2}
            onClick={() => handleRemoveRow(hoveredHeader.index)}
          />
        )}

        {hoveredHeader.type === 'col' && cols > 1 && (
          <Circle
            x={hoveredHeader.position.x}
            y={hoveredHeader.position.y}
            radius={HANDLE_SIZE / 2}
            fill="#ef4444"
            stroke="white"
            strokeWidth={2}
            onClick={() => handleRemoveCol(hoveredHeader.index)}
          />
        )}

        {/* Dedicated resize handles */}
        <ResizeHandle
          x={tableWidth}
          y={tableHeight / 2}
          type="horizontal"
          onDragStart={() => {
            setIsResizing(true);
          }}
          onDragMove={(e) => {
            const newWidth = cellWidth + (e.target.x() - tableWidth) / cols;
            throttledResize(newWidth, cellHeight);
          }}
          onDragEnd={() => {
            setIsResizing(false);
          }}
        />

        <ResizeHandle
          x={tableWidth / 2}
          y={tableHeight}
          type="vertical"
          onDragStart={() => {
            setIsResizing(true);
          }}
          onDragMove={(e) => {
            const newHeight = cellHeight + (e.target.y() - tableHeight) / rows;
            throttledResize(cellWidth, newHeight);
          }}
          onDragEnd={() => {
            setIsResizing(false);
          }}
        />

        <ResizeHandle
          x={tableWidth}
          y={tableHeight}
          type="corner"
          onDragStart={() => {
            setIsResizing(true);
          }}
          onDragMove={(e) => {
            const newWidth = cellWidth + (e.target.x() - tableWidth) / cols;
            const newHeight = cellHeight + (e.target.y() - tableHeight) / rows;
            throttledResize(newWidth, newHeight);
          }}
          onDragEnd={() => {
            setIsResizing(false);
          }}
        />

        {/* Selection indicator */}
        {isSelected && (
          <Rect
            x={-2}
            y={-2}
            width={tableWidth + 4}
            height={tableHeight + 4}
            stroke={designSystem.colors.primary[500]}
            strokeWidth={2}
            fill="transparent"
            dash={[8, 4]}
          />
        )}
      </Group>

      {/* Cell editor overlay */}
      {editingCell && editorPosition && (
        <div
          style={{
            position: 'fixed',
            left: editorPosition.x,
            top: editorPosition.y,
            width: editorPosition.width,
            height: editorPosition.height,
            zIndex: 1000,
            pointerEvents: 'all',
          }}
        >
          <textarea
            ref={editorRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleEditSave();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleEditCancel();
              }
            }}
            className="table-cell-editor"
            style={{
              width: '100%',
              height: '100%',
              border: `2px solid ${designSystem.colors.primary[500]}`,
              borderRadius: '6px',
              background: designSystem.colors.secondary[50],
              color: designSystem.colors.secondary[900],
              fontSize: '14px',
              fontFamily: 'Inter, system-ui, sans-serif',
              padding: '8px',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </>
  );
});

ImprovedTableElement.displayName = 'ImprovedTableElement';

export default ImprovedTableElement;
