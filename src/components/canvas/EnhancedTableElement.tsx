import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, useKonvaCanvasStore, RichTextSegment } from '../../stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';

// RichTextCellEditor is used in JSX rendering later in the file
// RichTextCellEditor is used in JSX rendering later in the file, so we keep the import
// RichTextCellEditor is used in JSX rendering later in the file
// RichTextCellEditor type is used implicitly through the component

// Constants for improved UX
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

interface TableEditingData {
  isEditing: boolean;
  cellPosition: { x: number; y: number; width: number; height: number };
  cellText: string;
  richTextSegments: RichTextSegment[];
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  onTextChange: (text: string) => void;
  onRichTextChange?: (segments: RichTextSegment[]) => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
}

interface EnhancedTableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (element: CanvasElement) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  onEditingStateChange?: (editingData: TableEditingData | null) => void;
}

export const EnhancedTableElement: React.FC<EnhancedTableElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDragEnd,
  stageRef,
  onEditingStateChange
}) => {
  // State for hover interactions and controls
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCellPosition, setEditingCellPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [boundaryHover, setBoundaryHover] = useState<{ type: 'row' | 'column'; index: number; position: { x: number; y: number } } | null>(null);
  const [headerHover, setHeaderHover] = useState<{ type: 'row' | 'column' | null; index: number; position: { x: number; y: number } }>({ type: null, index: -1, position: { x: 0, y: 0 } });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'row' | 'column'; index: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Missing resize state variables
  // Using refs instead of state to prevent re-renders during resize operations

  // Resize state using refs to prevent re-renders
  const isResizingRef = useRef(false);
  const resizeHandleRef = useRef<'se' | 'e' | 's' | 'col' | 'row' | null>(null);
  const resizeStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartSizeRef = useRef<{ width: number; height: number } | null>(null);
  const [liveSize, setLiveSize] = useState<{ width: number, height: number } | null>(null);
  
  // Individual column/row resize state using refs
  const resizingColumnIndexRef = useRef<number | null>(null);
  const resizingRowIndexRef = useRef<number | null>(null);
  const columnStartWidthRef = useRef<number | null>(null);
  const rowStartHeightRef = useRef<number | null>(null);
  
  // Event handlers refs for cleanup
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const mouseUpHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

  // Hover timeout refs to prevent flicker
  const cellHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const boundaryHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store methods
  const {
    updateTableCell,
    addTableRow,
    addTableColumn,
    removeTableRow,
    removeTableColumn,
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

  const handleCellRightClick = useCallback((rowIndex: number, colIndex: number, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (stage) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        // Show context menu for row or column
        setContextMenu({
          x: pointerPosition.x,
          y: pointerPosition.y,
          type: rowIndex === 0 ? 'column' : 'row',
          index: rowIndex === 0 ? colIndex : rowIndex
        });
      }
    }
  }, []);

  const handleRemoveRowColumn = useCallback((type: 'row' | 'column', index: number) => {
    if (type === 'row') {
      removeTableRow(element.id, index);
    } else {
      removeTableColumn(element.id, index);
    }
    setContextMenu(null);
  }, [element.id, removeTableRow, removeTableColumn]);

  // Handle delete key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && editingCell) {
        // If a cell is selected but not being edited, allow row/column deletion
        if (e.shiftKey) {
          // Shift+Delete removes column
          removeTableColumn(element.id, editingCell.col);
          setEditingCell(null);
        } else if (e.ctrlKey || e.metaKey) {
          // Ctrl+Delete removes row
          removeTableRow(element.id, editingCell.row);
          setEditingCell(null);
        }
      }
    };

    if (editingCell) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [editingCell, element.id, removeTableRow, removeTableColumn]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

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
      const stagePosition = stage.position();
      const stageRect = stageContainer.getBoundingClientRect();
      
      // Calculate position accounting for stage transform (pan + zoom)
      // Convert from Konva world coordinates to DOM viewport coordinates
      const worldX = cellPosition.x;
      const worldY = cellPosition.y;
      
      // Apply stage transform: scale first, then translate
      const screenX = (worldX * stageScale) + stagePosition.x;
      const screenY = (worldY * stageScale) + stagePosition.y;
      
      // Convert to viewport coordinates for portal positioning
      // Since RichTextCellEditor uses a portal to document.body with position: 'absolute',
      // we need coordinates relative to the viewport
      setEditingCell({ row: rowIndex, col: colIndex });
      setEditingCellPosition({
        x: stageRect.left + screenX,
        y: stageRect.top + screenY,
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

  // Handle rich text change during editing
  const handleRichTextChange = (segments: RichTextSegment[]) => {
    if (editingCell) {
      updateTableCell(element.id, editingCell.row, editingCell.col, { 
        richTextSegments: segments,
        text: segments.map(s => s.text).join('') // Keep plain text in sync
      });
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
      resizeHandleRef.current = handle;
      
      // Use stage coordinates consistently
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          resizeStartPosRef.current = { x: pointerPos.x, y: pointerPos.y };
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
      resizeHandleRef.current = 'col';
      setResizingColumnIndex(colIndex);
      
      const currentColumn = tableColumns[colIndex];
      if (currentColumn) {
        setColumnStartWidth(currentColumn.width);
      }
      
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          resizeStartPosRef.current = { x: pointerPos.x, y: pointerPos.y };
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
      resizeHandleRef.current = 'row';
      setResizingRowIndex(rowIndex);
      
      const currentRow = tableRows[rowIndex];
      if (currentRow) {
        setRowStartHeight(currentRow.height);
      }
      
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          resizeStartPosRef.current = { x: pointerPos.x, y: pointerPos.y };
        }
      }
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
    }
  };

  // Stable references to prevent useEffect re-runs during resize
  const enhancedTableDataRef = useRef(enhancedTableData);
  const totalWidthRef = useRef(totalWidth);
  const totalHeightRef = useRef(totalHeight);
  const onUpdateRef = useRef(onUpdate);
  const resizeTableColumnRef = useRef(resizeTableColumn);
  const resizeTableRowRef = useRef(resizeTableRow);
  
  // Update refs when values change
  useEffect(() => {
    enhancedTableDataRef.current = enhancedTableData;
    totalWidthRef.current = totalWidth;
    totalHeightRef.current = totalHeight;
    onUpdateRef.current = onUpdate;
    resizeTableColumnRef.current = resizeTableColumn;
    resizeTableRowRef.current = resizeTableRow;
  });

  // Throttled resize functions to prevent excessive updates
  const throttledColumnResize = useRef(
    throttle((elementId: string, columnIndex: number, newWidth: number) => {
      resizeTableColumnRef.current(elementId, columnIndex, newWidth);
    }, 16) // ~60fps
  ).current;

  const throttledRowResize = useRef(
    throttle((elementId: string, rowIndex: number, newHeight: number) => {
      resizeTableRowRef.current(elementId, rowIndex, newHeight);
    }, 16) // ~60fps
  ).current;

  // Direct resize event handling without useEffect to prevent duplication
  const startResizeOperation = useCallback((handle: 'se' | 'e' | 's' | 'col' | 'row', startPos: { x: number; y: number }, startSize: { width: number; height: number }, columnIndex?: number, rowIndex?: number) => {
    console.log('🔄 [RESIZE DEBUG] Starting resize operation:', { handle, startPos, startSize, columnIndex, rowIndex });
    
    if (!stageRef?.current) return;
    
    const stage = stageRef.current;
    
    // Clean up any existing handlers
    if (mouseMoveHandlerRef.current) {
      stage.off('mousemove', mouseMoveHandlerRef.current);
    }
    if (mouseUpHandlerRef.current) {
      stage.off('mouseup', mouseUpHandlerRef.current);
    }
    
    // Set resize state in refs
    isResizingRef.current = true;
    resizeHandleRef.current = handle;
    resizeStartPosRef.current = startPos;
    resizeStartSizeRef.current = startSize;
    
    if (handle === 'col' && columnIndex !== undefined) {
      resizingColumnIndexRef.current = columnIndex;
      columnStartWidthRef.current = tableColumns[columnIndex]?.width || 100;
    } else if (handle === 'row' && rowIndex !== undefined) {
      resizingRowIndexRef.current = rowIndex;
      rowStartHeightRef.current = tableRows[rowIndex]?.height || 40;
    }
    
    // Create new event handlers
    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos || !resizeStartPosRef.current || !resizeStartSizeRef.current) return;

      const deltaX = pointerPos.x - resizeStartPosRef.current.x;
      const deltaY = pointerPos.y - resizeStartPosRef.current.y;

      if (resizeHandleRef.current === 'col' && resizingColumnIndexRef.current !== null && columnStartWidthRef.current !== null) {
        // Individual column resize using throttled store function
        const newWidth = Math.max(MIN_CELL_WIDTH, Math.min(MAX_CELL_WIDTH, columnStartWidthRef.current + deltaX));
throttledColumnResize(element.id, resizingColumnIndexRef.current, newWidth);
      } else if (resizeHandleRef.current === 'row' && resizingRowIndexRef.current !== null && rowStartHeightRef.current !== null) {
        // Individual row resize using throttled store function
        const newHeight = Math.max(MIN_CELL_HEIGHT, Math.min(MAX_CELL_HEIGHT, rowStartHeightRef.current + deltaY));
        throttledRowResize(element.id, resizingRowIndexRef.current, newHeight);
      } else {
        // Table-wide resize with live feedback
        let newWidth = resizeStartSizeRef.current.width;
        let newHeight = resizeStartSizeRef.current.height;

        if (resizeHandleRef.current?.includes('e')) {
          newWidth = Math.max(MIN_TABLE_WIDTH, resizeStartSizeRef.current.width + deltaX);
        }
        if (resizeHandleRef.current?.includes('s')) {
          newHeight = Math.max(MIN_TABLE_HEIGHT, resizeStartSizeRef.current.height + deltaY);
        }

        setLiveSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      console.log('🔄 [RESIZE DEBUG] Ending resize operation:', resizeHandleRef.current);
      
      if (resizeHandleRef.current === 'col' || resizeHandleRef.current === 'row') {
        // Individual column/row resize cleanup
        resizingColumnIndexRef.current = null;
        resizingRowIndexRef.current = null;
        columnStartWidthRef.current = null;
        rowStartHeightRef.current = null;
      } else if (liveSize && enhancedTableDataRef.current) {
        // Table-wide resize final update using stable references
        const currentTableData = enhancedTableDataRef.current;
        const currentTotalWidth = totalWidthRef.current;
        const currentTotalHeight = totalHeightRef.current;
        
        const widthRatio = liveSize.width / currentTotalWidth;
        const heightRatio = liveSize.height / currentTotalHeight;

        const updatedColumns = currentTableData.columns.map(col => ({
          ...col,
          width: Math.max(MIN_CELL_WIDTH, col.width * widthRatio),
        }));

        const updatedRows = currentTableData.rows.map(row => ({
          ...row,
          height: Math.max(MIN_CELL_HEIGHT, row.height * heightRatio),
        }));
        
        onUpdateRef.current({
          enhancedTableData: {
            ...currentTableData,
            columns: updatedColumns,
            rows: updatedRows,
          },
        });
      }

      // Clean up event handlers
      if (mouseMoveHandlerRef.current) {
        stage.off('mousemove', mouseMoveHandlerRef.current);
      }
      if (mouseUpHandlerRef.current) {
        stage.off('mouseup', mouseUpHandlerRef.current);
      }
      
      // Reset state
      isResizingRef.current = false;
      resizeHandleRef.current = null;
      resizeStartPosRef.current = null;
      resizeStartSizeRef.current = null;
      mouseMoveHandlerRef.current = null;
      mouseUpHandlerRef.current = null;
      setLiveSize(null);
    };
    
    // Store handlers in refs for cleanup
    mouseMoveHandlerRef.current = (e: MouseEvent) => {
      // Convert MouseEvent to KonvaEventObject<MouseEvent>
      const konvaEvent = {
        evt: e,
        target: stage,
        currentTarget: stage,
        type: 'mousemove',
        cancelBubble: false,
        pointerId: 1
      } as Konva.KonvaEventObject<MouseEvent>;
      
      handleMouseMove(konvaEvent);
    };
    mouseUpHandlerRef.current = handleMouseUp;
    
    // Attach event handlers
    stage.on('mousemove', handleMouseMove);
    stage.on('mouseup', handleMouseUp);
  }, [element.id, tableColumns, tableRows, throttledColumnResize, throttledRowResize, enhancedTableDataRef, totalWidthRef, totalHeightRef, onUpdateRef, liveSize]);

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

  // Enhanced boundary hover handling with debouncing
  const handleBoundaryMouseEnter = (type: 'row' | 'column', index: number, position: { x: number; y: number }) => {
    if (boundaryHoverTimeoutRef.current) {
      clearTimeout(boundaryHoverTimeoutRef.current);
      boundaryHoverTimeoutRef.current = null;
    }
    setBoundaryHover({ type, index, position });
  };

  const handleBoundaryMouseLeave = () => {
    if (boundaryHoverTimeoutRef.current) {
      clearTimeout(boundaryHoverTimeoutRef.current);
    }
    boundaryHoverTimeoutRef.current = setTimeout(() => {
      setBoundaryHover(null);
    }, 150); // 150ms delay before clearing
  };

  // Enhanced header hover handling with debouncing
  const handleHeaderMouseEnter = (type: 'row' | 'column', index: number, position: { x: number; y: number }) => {
    if (headerHoverTimeoutRef.current) {
      clearTimeout(headerHoverTimeoutRef.current);
      headerHoverTimeoutRef.current = null;
    }
    setHeaderHover({ type, index, position });
  };

  const handleHeaderMouseLeave = () => {
    if (headerHoverTimeoutRef.current) {
      clearTimeout(headerHoverTimeoutRef.current);
    }
    headerHoverTimeoutRef.current = setTimeout(() => {
      setHeaderHover({ type: null, index: -1, position: { x: 0, y: 0 } });
    }, 150); // 150ms delay before clearing
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
                onContextMenu={(e) => handleCellRightClick(rowIndex, colIndex, e)}
              />

              {/* Row header hover area for delete button - larger area */}
              {colIndex === 0 && (
                <Rect
                  key={`row-header-${rowIndex}`}
                  x={-40}
                  y={-5}
                  width={40}
                  height={(row?.height || 40) + 10}
                  fill="transparent"
                  onMouseEnter={() => handleHeaderMouseEnter('row', rowIndex, { 
                    x: (element.x || 0) - 30, 
                    y: (element.y || 0) + tableRows.slice(0, rowIndex).reduce((sum, row) => sum + (row?.height || 40), 0) + (tableRows[rowIndex]?.height || 40) / 2
                  })}
                  onMouseLeave={handleHeaderMouseLeave}
                />
              )}

              {/* Column header hover area for delete button - larger area */}
              {rowIndex === 0 && (
                <Rect
                  key={`col-header-${colIndex}`}
                  x={-5}
                  y={-40}
                  width={(col?.width || 100) + 10}
                  height={40}
                  fill="transparent"
                  onMouseEnter={() => handleHeaderMouseEnter('column', colIndex, { 
                    x: (element.x || 0) + tableColumns.slice(0, colIndex).reduce((sum, col) => sum + (col?.width || 100), 0) + (tableColumns[colIndex]?.width || 100) / 2,
                    y: (element.y || 0) - 30
                  })}
                  onMouseLeave={handleHeaderMouseLeave}
                />
              )}

              {/* Cell text - render rich text segments if available, otherwise plain text */}
              {cellData?.richTextSegments && cellData.richTextSegments.length > 0 ? (
                // Render rich text segments
                cellData.richTextSegments.map((segment, segmentIndex) => {
                  // For now, render each segment as a separate Text component
                  // This is a simplified approach - a more advanced implementation would handle line wrapping
                  return (
                    <Text
                      key={`text-${rowIndex}-${colIndex}-${segmentIndex}`}
                      x={8}
                      y={8}
                      width={(col?.width || 100) - 16}
                      height={(row?.height || 40) - 16}
                      text={segment.text}
                      fontSize={segment.fontSize || cellData.fontSize || 14}
                      fontFamily={segment.fontFamily || cellData.fontFamily || designSystem.typography.fontFamily.sans}
                      fill={segment.fill || cellData.textColor || designSystem.colors.secondary[800]}
                      fontStyle={segment.fontStyle || 'normal'}
                      fontWeight={segment.fontWeight || 'normal'}
                      textDecoration={segment.textDecoration || ''}
                      align={cellData.textAlign || 'left'}
                      verticalAlign="top"
                      wrap="word"
                      listening={false}
                    />
                  );
                })
              ) : (
                // Render plain text
                <Text
                  key={`text-${rowIndex}-${colIndex}`}
                  x={8}
                  y={8}
                  width={(col?.width || 100) - 16}
                  height={(row?.height || 40) - 16}
                  text={cellData?.text || ''}
                  fontSize={cellData?.fontSize || 14}
                  fontFamily={cellData?.fontFamily || designSystem.typography.fontFamily.sans}
                  fill={cellData?.textColor || designSystem.colors.secondary[800]}
                  align={cellData?.textAlign || 'left'}
                  verticalAlign="top"
                  wrap="word"
                  listening={false}
                />
              )}
            </Group>
          );
        })
      ).flat();
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
      return [];
    }
  }, [tableRows, tableColumns, enhancedTableData, element.id, editingCell, hoveredCell, designSystem]);

  const tableContent = (
    <Group
        id={element.id}
        x={element.x}
        y={element.y}
        draggable={!isResizing && !editingCell}
        onDragEnd={handleDragEnd}
        onMouseLeave={handleTableMouseLeave}
        opacity={editingCell ? 0.95 : 1.0}
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
            {/* Corner Resize Handle */}
            <Rect
              x={displayWidth - 8}
              y={displayHeight - 8}
              width={16}
              height={16}
              fill={designSystem.colors.primary[500]}
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

            {/* Right Resize Handle */}
            <Rect
              x={displayWidth - 4}
              y={0}
              width={8}
              height={displayHeight}
              fill={designSystem.colors.primary[500]}
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
            
            {/* Bottom Resize Handle */}
            <Rect
              x={0}
              y={displayHeight - 4}
              width={displayWidth}
              height={8}
              fill={designSystem.colors.primary[500]}
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

        {/* Hover-based Add/Remove Controls */}
        {isSelected && (
          <>
            {/* Row Add Handles - Improved with larger hit areas and debounced hover */}
            {tableRows.map((_, index) => {
              let yPos = 0;
              for (let i = 0; i <= index; i++) {
                yPos += tableRows[i]?.height || 40;
              }
              return (
                <Rect
                  key={`row-hover-${index}`}
                  x={-15}
                  y={yPos - 15}
                  width={displayWidth + 30}
                  height={30}
                  fill="transparent"
                  onMouseEnter={() => handleBoundaryMouseEnter('row', index, {
                    x: displayWidth / 2,
                    y: yPos
                  })}
                  onMouseLeave={handleBoundaryMouseLeave}
                  listening={true}
                />
              );
            })}

            {/* Column Add Handles - Improved with larger hit areas and debounced hover */}
            {tableColumns.map((_, index) => {
              let xPos = 0;
              for (let i = 0; i <= index; i++) {
                xPos += tableColumns[i]?.width || 100;
              }
              return (
                <Rect
                  key={`col-hover-${index}`}
                  x={xPos - 15}
                  y={-15}
                  width={30}
                  height={displayHeight + 30}
                  fill="transparent"
                  onMouseEnter={() => handleBoundaryMouseEnter('column', index, {
                    x: xPos,
                    y: displayHeight / 2
                  })}
                  onMouseLeave={handleBoundaryMouseLeave}
                  listening={true}
                />
              );
            })}

            {/* Display the actual "Add" button when hovered */}
            {boundaryHover && (
              <Group
                onMouseEnter={() => {
                  // Clear timeout when hovering on the button itself
                  if (boundaryHoverTimeoutRef.current) {
                    clearTimeout(boundaryHoverTimeoutRef.current);
                    boundaryHoverTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={handleBoundaryMouseLeave}
              >
                {/* Background highlight line */}
                <Rect
                  x={boundaryHover.type === 'column' ? boundaryHover.position.x - 1 : 0}
                  y={boundaryHover.type === 'row' ? boundaryHover.position.y - 1 : 0}
                  width={boundaryHover.type === 'column' ? 2 : displayWidth}
                  height={boundaryHover.type === 'row' ? 2 : displayHeight}
                  fill={designSystem.colors.primary[400]}
                  opacity={0.7}
                  listening={false}
                />
                
                <Circle
                  x={boundaryHover.position.x}
                  y={boundaryHover.position.y}
                  radius={14}
                  fill={designSystem.colors.primary[500]}
                  stroke="white"
                  strokeWidth={2}
                  shadowColor="rgba(0, 0, 0, 0.3)"
                  shadowBlur={6}
                  shadowOffset={{ x: 0, y: 2 }}
                  onClick={(e) => {
                    e.evt.preventDefault();
                    e.evt.stopPropagation();
                    e.cancelBubble = true;
                    if (boundaryHover.type === 'row') {
                      addTableRow(element.id, boundaryHover.index + 1);
                    } else {
                      addTableColumn(element.id, boundaryHover.index + 1);
                    }
                    setBoundaryHover(null);
                  }}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                  }}
                />
                <Text
                  x={boundaryHover.position.x}
                  y={boundaryHover.position.y}
                  text="+"
                  fontSize={18}
                  fontFamily={designSystem.typography.fontFamily?.sans || 'Inter, sans-serif'}
                  fill="white"
                  align="center"
                  verticalAlign="middle"
                  offsetX={6}
                  offsetY={9}
                  listening={false}
                />
              </Group>
            )}
          </>
        )}

        {/* Header delete controls */}
        {headerHover.type === 'row' && tableRows.length > 1 && (
          <Group
            onMouseEnter={() => {
              // Clear timeout when hovering on the button itself
              if (headerHoverTimeoutRef.current) {
                clearTimeout(headerHoverTimeoutRef.current);
                headerHoverTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              // Set timeout when leaving the button
              if (headerHoverTimeoutRef.current) {
                clearTimeout(headerHoverTimeoutRef.current);
              }
              headerHoverTimeoutRef.current = setTimeout(() => {
                setHeaderHover({ type: null, index: -1, position: { x: 0, y: 0 } });
              }, 150);
            }}
          >
            <Circle
              x={headerHover.position.x}
              y={headerHover.position.y}
              radius={12}
              fill={designSystem.colors.error[500]}
              stroke="white"
              strokeWidth={2}
              shadowColor="rgba(0, 0, 0, 0.2)"
              shadowBlur={4}
              shadowOffset={{ x: 0, y: 2 }}
              onClick={() => removeTableRow(element.id, headerHover.index)}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'pointer';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
            <Text
              x={headerHover.position.x}
              y={headerHover.position.y}
              text="−"
              fontSize={16}
              fontFamily={designSystem.typography.fontFamily?.sans || 'Inter, sans-serif'}
              fill="white"
              align="center"
              verticalAlign="middle"
              offsetX={4}
              offsetY={8}
              listening={false}
            />
          </Group>
        )}

        {headerHover.type === 'column' && tableColumns.length > 1 && (
          <Group
            onMouseEnter={() => {
              // Clear timeout when hovering on the button itself
              if (headerHoverTimeoutRef.current) {
                clearTimeout(headerHoverTimeoutRef.current);
                headerHoverTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              // Set timeout when leaving the button
              if (headerHoverTimeoutRef.current) {
                clearTimeout(headerHoverTimeoutRef.current);
              }
              headerHoverTimeoutRef.current = setTimeout(() => {
                setHeaderHover({ type: null, index: -1, position: { x: 0, y: 0 } });
              }, 150);
            }}
          >
            <Circle
              x={headerHover.position.x}
              y={headerHover.position.y}
              radius={12}
              fill={designSystem.colors.error[500]}
              stroke="white"
              strokeWidth={2}
              shadowColor="rgba(0, 0, 0, 0.2)"
              shadowBlur={4}
              shadowOffset={{ x: 0, y: 2 }}
              onClick={() => removeTableColumn(element.id, headerHover.index)}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'pointer';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
            <Text
              x={headerHover.position.x}
              y={headerHover.position.y}
              text="−"
              fontSize={16}
              fontFamily={designSystem.typography.fontFamily?.sans || 'Inter, sans-serif'}
              fill="white"
              align="center"
              verticalAlign="middle"
              offsetX={4}
              offsetY={8}
              listening={false}
            />
          </Group>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <Group>
            <Rect
              x={contextMenu.x}
              y={contextMenu.y}
              width={120}
              height={40}
              fill="white"
              stroke={designSystem.colors.primary[300]}
              strokeWidth={1}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={4}
              shadowOffset={{ x: 0, y: 2 }}
            />
            <Text
              x={contextMenu.x + 10}
              y={contextMenu.y + 12}
              text={`Remove ${contextMenu.type}`}
              fontSize={12}
              fontFamily={designSystem.typography.fontFamily.sans}
              fill={designSystem.colors.error[600]}
              onClick={() => handleRemoveRowColumn(contextMenu.type, contextMenu.index)}
            />
          </Group>
        )}
      </Group>
  );

  // Notify parent about editing state changes
  useEffect(() => {
    if (onEditingStateChange) {
      const editingData = editingCell && editingCellPosition ? {
        isEditing: true,
        cellPosition: editingCellPosition,
        cellText: enhancedTableData?.cells?.[editingCell.row]?.[editingCell.col]?.text || '',
        richTextSegments: enhancedTableData?.cells?.[editingCell.row]?.[editingCell.col]?.richTextSegments || [],
        fontSize: enhancedTableData?.cells?.[editingCell.row]?.[editingCell.col]?.fontSize,
        fontFamily: enhancedTableData?.cells?.[editingCell.row]?.[editingCell.col]?.fontFamily,
        textColor: enhancedTableData?.cells?.[editingCell.row]?.[editingCell.col]?.textColor,
        textAlign: enhancedTableData?.cells?.[editingCell.row]?.[editingCell.col]?.textAlign,
        onTextChange: handleTextChange,
        onRichTextChange: handleRichTextChange,
        onFinishEditing: handleFinishEditing,
        onCancelEditing: handleCancelEditing
      } : null;
      onEditingStateChange(editingData);
    }
  }, [editingCell, editingCellPosition, enhancedTableData, onEditingStateChange]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (cellHoverTimeoutRef.current) {
        clearTimeout(cellHoverTimeoutRef.current);
      }
      if (boundaryHoverTimeoutRef.current) {
        clearTimeout(boundaryHoverTimeoutRef.current);
      }
      if (headerHoverTimeoutRef.current) {
        clearTimeout(headerHoverTimeoutRef.current);
      }
    };
  }, []);

  return tableContent;
};

export default EnhancedTableElement;