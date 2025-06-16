import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, useKonvaCanvasStore } from '../../stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';
import { TableCellEditor } from './TableCellEditor';

// Constants for improved UX
const HANDLE_SIZE = 16; // Increased from 12px
const RESIZE_HANDLE_SIZE = 10; // Increased from 6px
const MIN_CELL_WIDTH = 80; // Increased from 60px
const MIN_CELL_HEIGHT = 40; // Increased from 30px
const MAX_CELL_WIDTH = 500; // New maximum constraint
const MAX_CELL_HEIGHT = 300; // New maximum constraint
const MIN_TABLE_WIDTH = 160; // Increased from 200px (2 * MIN_CELL_WIDTH)
const MIN_TABLE_HEIGHT = 80; // Increased from 120px (2 * MIN_CELL_HEIGHT)

// Custom throttle function for resize operations
const throttle = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
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

interface EnhancedTableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (element: CanvasElement) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const EnhancedTableElement: React.FC<EnhancedTableElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDragEnd,
  stageRef
}) => {
  // State for hover interactions and controls
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCellPosition, setEditingCellPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'e' | 's' | 'col' | 'row' | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState<{ x: number; y: number } | null>(null);
  const [resizeStartSize, setResizeStartSize] = useState<{ width: number; height: number } | null>(null);
  const [liveSize, setLiveSize] = useState<{ width: number, height: number } | null>(null);
  
  // Individual column/row resize state
  const [resizingColumnIndex, setResizingColumnIndex] = useState<number | null>(null);
  const [resizingRowIndex, setResizingRowIndex] = useState<number | null>(null);
  const [columnStartWidth, setColumnStartWidth] = useState<number | null>(null);
  const [rowStartHeight, setRowStartHeight] = useState<number | null>(null);

  // Hover timeout refs to prevent flicker
  const cellHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store methods
  const {
    sections,
    updateElement,
    updateTableCell,
    addTableRow,
    addTableColumn,
    resizeTableColumn,
    resizeTableRow
  } = useKonvaCanvasStore();

  // Get enhanced table data from element with null safety
  const enhancedTableData = element.enhancedTableData;
  
  // Early return if no table data
  if (!enhancedTableData) {
    return null;
  }

  const tableRows = enhancedTableData.rows || [];
  const tableColumns = enhancedTableData.columns || [];

  // Early return if no rows or columns
  if (tableRows.length === 0 || tableColumns.length === 0) {
    return null;
  }

  // Calculate total dimensions
  const totalWidth = tableColumns.reduce((sum, col) => sum + (col?.width || 100), 0);
  const totalHeight = tableRows.reduce((sum, row) => sum + (row?.height || 40), 0);

  // Display variables for resize optimization
  const displayWidth = liveSize?.width ?? totalWidth;
  const displayHeight = liveSize?.height ?? totalHeight;

  // Handle drag end - memoized to prevent render loops
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    try {
      const node = e.target;
      onUpdate({
        x: node.x(),
        y: node.y()
      });
      if (onDragEnd) {
        onDragEnd(e);
      }
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
    }
  }, [onUpdate, onDragEnd]);

  // Handle cell click - memoized to prevent render loops
  const handleCellClick = useCallback((_rowIndex: number, _colIndex: number, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect(element);
  }, [onSelect, element]);

  // Handle cell double-click for editing
  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    try {
      // Validate stageRef and container existence
      if (!stageRef?.current) {
        console.error("An error occurred in EnhancedTableElement:", "stageRef is missing");
        return;
      }
      
      const stage = stageRef.current;
      const stageContainer = stage.container();
      if (!stageContainer) {
        console.error("An error occurred in EnhancedTableElement:", "stageContainer is missing");
        return;
      }
      
      // Validate indices against tableRows and tableColumns
      if (rowIndex < 0 || rowIndex >= tableRows.length) {
        console.error("An error occurred in EnhancedTableElement:", `Invalid row index: ${rowIndex}, tableRows length: ${tableRows.length}`);
        return;
      }
      if (colIndex < 0 || colIndex >= tableColumns.length) {
        console.error("An error occurred in EnhancedTableElement:", `Invalid column index: ${colIndex}, tableColumns length: ${tableColumns.length}`);
        return;
      }
      
      // Use simplified approach with findOne for reliable cell lookup
      const cellId = `${element.id}-cell-${rowIndex}-${colIndex}`;
      const cellNode = stage.findOne(`#${cellId}`);
      if (!cellNode) {
        console.error("An error occurred in EnhancedTableElement:", `Cell node not found for ID: ${cellId}`);
        return;
      }
      
      // Get cell's absolute position using Konva's built-in methods
      const cellPosition = cellNode.getAbsolutePosition();
      const stageScale = stage.scaleX();
      const stageRect = stageContainer.getBoundingClientRect();
      
      // Calculate screen position accounting for stage scaling and container positioning
      setEditingCell({ row: rowIndex, col: colIndex });
      setEditingCellPosition({
        x: stageRect.left + (cellPosition.x * stageScale),
        y: stageRect.top + (cellPosition.y * stageScale),
        width: (tableColumns[colIndex]?.width || 100) * stageScale,
        height: (tableRows[rowIndex]?.height || 40) * stageScale
      });
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
    }
  };

  // Handle text change during editing
  const handleTextChange = (newText: string) => {
    if (editingCell) {
      updateTableCell(element.id, editingCell.row, editingCell.col, { text: newText });
    }
  };

  // Handle finish editing
  const handleFinishEditing = () => {
    setEditingCell(null);
    setEditingCellPosition(null);
  };

  // Handle cancel editing
  const handleCancelEditing = () => {
    setEditingCell(null);
    setEditingCellPosition(null);
  };

  // Handle resize start
  const handleResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, handle: 'se' | 'e' | 's') => {
    try {
      console.log('🔧 [RESIZE DEBUG] Custom resize start:', handle);
      e.evt.preventDefault();
      e.evt.stopPropagation();
      e.cancelBubble = true;
      setIsResizing(true);
      setResizeHandle(handle);
      
      // Use stage coordinates consistently
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          setResizeStartPos({ x: pointerPos.x, y: pointerPos.y });
          setResizeStartSize({ width: totalWidth, height: totalHeight });
        }
      }
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
    }
  };

  // Handle column resize start
  const handleColumnResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, colIndex: number) => {
    try {
      console.log('🔧 [RESIZE DEBUG] Column resize start:', colIndex);
      e.evt.preventDefault();
      e.evt.stopPropagation();
      e.cancelBubble = true;
      setIsResizing(true);
      setResizeHandle('col');
      setResizingColumnIndex(colIndex);
      
      const currentColumn = tableColumns[colIndex];
      if (currentColumn) {
        setColumnStartWidth(currentColumn.width);
      }
      
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          setResizeStartPos({ x: pointerPos.x, y: pointerPos.y });
        }
      }
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
    }
  };

  // Handle row resize start
  const handleRowResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, rowIndex: number) => {
    try {
      console.log('🔧 [RESIZE DEBUG] Row resize start:', rowIndex);
      e.evt.preventDefault();
      e.evt.stopPropagation();
      e.cancelBubble = true;
      setIsResizing(true);
      setResizeHandle('row');
      setResizingRowIndex(rowIndex);
      
      const currentRow = tableRows[rowIndex];
      if (currentRow) {
        setRowStartHeight(currentRow.height);
      }
      
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          setResizeStartPos({ x: pointerPos.x, y: pointerPos.y });
        }
      }
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
    }
  };

  // Handle resize with global mouse tracking and throttling
  useEffect(() => {
    if (isResizing && resizeHandle && resizeStartPos && stageRef?.current) {
      const stage = stageRef.current;
      
      const handleMouseMove = throttle((e: MouseEvent) => {
        // Convert mouse position to stage coordinates
        const container = stage.container();
        const rect = container.getBoundingClientRect();
        const stagePointerPos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        
        const deltaX = stagePointerPos.x - resizeStartPos.x;
        const deltaY = stagePointerPos.y - resizeStartPos.y;

        if (resizeHandle === 'col' && resizingColumnIndex !== null && columnStartWidth !== null) {
          // Individual column resize using store function
          const newWidth = Math.max(MIN_CELL_WIDTH, Math.min(MAX_CELL_WIDTH, columnStartWidth + deltaX));
          resizeTableColumn(element.id, resizingColumnIndex, newWidth);
        } else if (resizeHandle === 'row' && resizingRowIndex !== null && rowStartHeight !== null) {
          // Individual row resize using store function
          const newHeight = Math.max(MIN_CELL_HEIGHT, Math.min(MAX_CELL_HEIGHT, rowStartHeight + deltaY));
          resizeTableRow(element.id, resizingRowIndex, newHeight);
        } else if (resizeStartSize) {
          // Table-wide resize (existing behavior)
          let newWidth = resizeStartSize.width;
          let newHeight = resizeStartSize.height;

          if (resizeHandle === 'se' || resizeHandle === 'e') {
            newWidth = Math.max(MIN_TABLE_WIDTH, Math.min(1200, resizeStartSize.width + deltaX));
          }
          if (resizeHandle === 'se' || resizeHandle === 's') {
            newHeight = Math.max(MIN_TABLE_HEIGHT, Math.min(800, resizeStartSize.height + deltaY));
          }

          // Only update liveSize during drag (no expensive calculations)
          setLiveSize({ width: newWidth, height: newHeight });
        }
      }, 16); // 60fps throttling (16ms)

      const handleMouseUp = () => {
        if (resizeHandle === 'col' || resizeHandle === 'row') {
          // Individual column/row resize cleanup
          setResizingColumnIndex(null);
          setResizingRowIndex(null);
          setColumnStartWidth(null);
          setRowStartHeight(null);
        } else {
          // Table-wide resize cleanup (existing behavior)
          if (liveSize && resizeStartSize && enhancedTableData) {
            const widthRatio = liveSize.width / resizeStartSize.width;
            const heightRatio = liveSize.height / resizeStartSize.height;

            // Update columns and rows with the ratios applied to their dimensions
            const updatedColumns = enhancedTableData.columns.map(col => ({
              ...col,
              width: Math.max(MIN_CELL_WIDTH, Math.min(MAX_CELL_WIDTH, col.width * widthRatio))
            }));
            
            const updatedRows = enhancedTableData.rows.map(row => ({
              ...row,
              height: Math.max(MIN_CELL_HEIGHT, Math.min(MAX_CELL_HEIGHT, row.height * heightRatio))
            }));
            
            // Call onUpdate with the final calculated values
            onUpdate({
              enhancedTableData: {
                ...enhancedTableData,
                columns: updatedColumns,
                rows: updatedRows
              }
            });
          }
          setLiveSize(null);
          setResizeStartSize(null);
        }

        // Reset all resize-related state
        setIsResizing(false);
        setResizeHandle(null);
        setResizeStartPos(null);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeHandle, resizeStartPos, resizeStartSize, liveSize, enhancedTableData, element.id, onUpdate, stageRef, resizingColumnIndex, resizingRowIndex, columnStartWidth, rowStartHeight, tableColumns, tableRows, resizeTableColumn, resizeTableRow]);

  // Handle table mouse leave with delay
  const handleTableMouseLeave = () => {
    try {
      if (cellHoverTimeoutRef.current) {
        clearTimeout(cellHoverTimeoutRef.current);
      }
      cellHoverTimeoutRef.current = setTimeout(() => {
        setHoveredCell(null);
      }, 100);
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
    }
  };

  // Handle cell hover with debounce - memoized callbacks
  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (cellHoverTimeoutRef.current) {
      clearTimeout(cellHoverTimeoutRef.current);
      cellHoverTimeoutRef.current = null;
    }
    setHoveredCell({ row, col });
  }, []);

  const handleCellMouseLeave = useCallback(() => {
    cellHoverTimeoutRef.current = setTimeout(() => {
      setHoveredCell(null);
    }, 100);
  }, []);

  // Render table cells - memoized to prevent infinite render loops
  const renderCells = useMemo(() => {
    try {
      return tableRows.map((row, rowIndex) =>
        tableColumns.map((col, colIndex) => {
          const cellData = enhancedTableData?.cells?.[rowIndex]?.[colIndex] || { text: '' };
          const cellX = tableColumns.slice(0, colIndex).reduce((sum, c) => sum + (c?.width || 100), 0);
          const cellY = tableRows.slice(0, rowIndex).reduce((sum, r) => sum + (r?.height || 40), 0);

          return (
            <Group key={`${rowIndex}-${colIndex}`} id={`${element.id}-cell-${rowIndex}-${colIndex}`} x={cellX} y={cellY}>
              {/* Cell rectangle */}
              <Rect
                key={`cell-${rowIndex}-${colIndex}`}
                x={0}
                y={0}
                width={col?.width || 100}
                height={row?.height || 40}
                fill={
                  editingCell?.row === rowIndex && editingCell?.col === colIndex
                    ? designSystem.colors.primary[50]
                    : hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex
                    ? designSystem.colors.secondary[50]
                    : 'white'
                }
                stroke={
                  editingCell?.row === rowIndex && editingCell?.col === colIndex
                    ? designSystem.colors.primary[500]
                    : designSystem.colors.secondary[200]
                }
                strokeWidth={
                  editingCell?.row === rowIndex && editingCell?.col === colIndex ? 2 : 1
                }
                onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                onMouseLeave={handleCellMouseLeave}
                onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                onDblClick={() => handleCellDoubleClick(rowIndex, colIndex)}
              />

              {/* Cell text */}
              <Text
                key={`text-${rowIndex}-${colIndex}`}
                x={8}
                y={8}
                width={(col?.width || 100) - 16}
                height={(row?.height || 40) - 16}
                text={cellData?.text || ''}
                fontSize={14}
                fontFamily={designSystem.typography.fontFamily.sans}
                fill={designSystem.colors.secondary[800]}
                align="left"
                verticalAlign="top"
                wrap="word"
                listening={false}
              />
            </Group>
          );
        })
      ).flat();
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
      return [];
    }
  }, [tableRows, tableColumns, enhancedTableData, element.id, editingCell, hoveredCell, designSystem]);

  const tableJSX = (
    <>
      <Group
        id={element.id}
        x={element.x}
        y={element.y}
        draggable={!isResizing}
        onDragEnd={handleDragEnd}
        onMouseLeave={handleTableMouseLeave}
      >
        {/* Table background */}
        <Rect
          x={0}
          y={0}
          width={displayWidth}
          height={displayHeight}
          fill="white"
          stroke={isSelected ? designSystem.colors.primary[500] : designSystem.colors.secondary[200]}
          strokeWidth={isSelected ? 2 : 1}
          shadowColor="rgba(0, 0, 0, 0.1)"
          shadowBlur={4}
          shadowOffset={{ x: 0, y: 2 }}
        />

        {/* Table cells */}
        {renderCells}

        {/* Resize handles - only show when selected with larger size and hitbox */}
        {isSelected && (
          <>
            {/* Bottom-right resize handle */}
            <Circle
              x={displayWidth}
              y={displayHeight}
              radius={RESIZE_HANDLE_SIZE}
              fill={designSystem.colors.primary[500]}
              stroke="white"
              strokeWidth={2}
              shadowColor="rgba(0, 0, 0, 0.2)"
              shadowBlur={4}
              shadowOffset={{ x: 0, y: 2 }}
              onMouseDown={(e) => handleResizeStart(e, 'se')}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'se-resize';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />

            {/* Right resize handle */}
            <Circle
              x={displayWidth}
              y={displayHeight / 2}
              radius={RESIZE_HANDLE_SIZE}
              fill={designSystem.colors.primary[500]}
              stroke="white"
              strokeWidth={2}
              shadowColor="rgba(0, 0, 0, 0.2)"
              shadowBlur={4}
              shadowOffset={{ x: 0, y: 2 }}
              onMouseDown={(e) => handleResizeStart(e, 'e')}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'e-resize';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />

            {/* Bottom resize handle */}
            <Circle
              x={displayWidth / 2}
              y={displayHeight}
              radius={RESIZE_HANDLE_SIZE}
              fill={designSystem.colors.primary[500]}
              stroke="white"
              strokeWidth={2}
              shadowColor="rgba(0, 0, 0, 0.2)"
              shadowBlur={4}
              shadowOffset={{ x: 0, y: 2 }}
              onMouseDown={(e) => handleResizeStart(e, 's')}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 's-resize';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />

            {/* Column resize handles - positioned between columns */}
            {tableColumns.slice(0, -1).map((_, colIndex) => {
              const handleX = tableColumns.slice(0, colIndex + 1).reduce((sum, c) => sum + (c?.width || 100), 0);
              return (
                <Rect
                  key={`col-handle-${colIndex}`}
                  x={handleX - 5}
                  y={0}
                  width={10}
                  height={displayHeight}
                  fill="transparent"
                  onMouseDown={(e) => handleColumnResizeStart(e, colIndex)}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'ew-resize';
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                  }}
                />
              );
            })}

            {/* Row resize handles - positioned between rows */}
            {tableRows.slice(0, -1).map((_, rowIndex) => {
              const handleY = tableRows.slice(0, rowIndex + 1).reduce((sum, r) => sum + (r?.height || 40), 0);
              return (
                <Rect
                  key={`row-handle-${rowIndex}`}
                  x={0}
                  y={handleY - 5}
                  width={displayWidth}
                  height={10}
                  fill="transparent"
                  onMouseDown={(e) => handleRowResizeStart(e, rowIndex)}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'ns-resize';
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                  }}
                />
              );
            })}
          </>
        )}

        {/* Simple add row button at bottom */}
        {isSelected && (
          <Circle
            x={displayWidth / 2}
            y={displayHeight + 20}
            radius={HANDLE_SIZE}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
            onClick={() => addTableRow(element.id, tableRows.length)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'pointer';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />
        )}

        {/* Simple add column button at right */}
        {isSelected && (
          <Circle
            x={displayWidth + 20}
            y={displayHeight / 2}
            radius={HANDLE_SIZE}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
            onClick={() => addTableColumn(element.id, tableColumns.length)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'pointer';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />
        )}

        {/* Add "+" text to buttons */}
        {isSelected && (
          <>
            <Text
              x={displayWidth / 2}
              y={displayHeight + 20}
              text="+"
              fontSize={18}
              fontFamily={designSystem.typography.fontFamily.sans}
              fill="white"
              align="center"
              verticalAlign="middle"
              offsetX={5}
              offsetY={9}
              listening={false}
            />
            <Text
              x={displayWidth + 20}
              y={displayHeight / 2}
              text="+"
              fontSize={18}
              fontFamily={designSystem.typography.fontFamily.sans}
              fill="white"
              align="center"
              verticalAlign="middle"
              offsetX={5}
              offsetY={9}
              listening={false}
            />
          </>
        )}
      </Group>

      {/* Inline text editor overlay */}
      {editingCell && editingCellPosition && (
        <TableCellEditor
          isEditing={true}
          cellPosition={editingCellPosition}
          cellText={enhancedTableData?.cells?.[editingCell.row]?.[editingCell.col]?.text || ''}
          onTextChange={handleTextChange}
          onFinishEditing={handleFinishEditing}
          onCancelEditing={handleCancelEditing}
        />
      )}
    </>
  );
  
  return tableJSX;
};