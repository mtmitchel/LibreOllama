import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, useKonvaCanvasStore, RichTextSegment } from '../../stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';

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

// Helper function to generate a stable key from table data
const getTableDataKey = (tableData: any) => {
  if (!tableData?.cells) return 'empty';
  return tableData.cells.map((row: any[]) => 
    row.map((cell: any) => cell?.text || '').join('|')
  ).join('||');
};

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
  const resizeHandleRef = useRef<'se' | 'e' | 's' | 'nw' | 'n' | 'ne' | 'w' | 'sw' | 'col' | 'row' | null>(null);
  const resizeStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartSizeRef = useRef<{ width: number; height: number } | null>(null);
  const resizeStartElementPosRef = useRef<{ x: number; y: number } | null>(null);
  const [liveSize, setLiveSize] = useState<{ width: number, height: number } | null>(null);
  const liveSizeRef = useRef<{ width: number; height: number } | null>(null);
  
  // Wrapper function to update both state and ref
  const updateLiveSize = useCallback((size: { width: number; height: number } | null) => {
    liveSizeRef.current = size;
    setLiveSize(size);
  }, []);
  
  // Individual column/row resize state using refs
  const resizingColumnIndexRef = useRef<number | null>(null);
  const resizingRowIndexRef = useRef<number | null>(null);
  const columnStartWidthRef = useRef<number | null>(null);
  const rowStartHeightRef = useRef<number | null>(null);
  
  // Event handlers refs for cleanup
  const mouseMoveHandlerRef = useRef<((e: Konva.KonvaEventObject<MouseEvent>) => void) | null>(null);
  const mouseUpHandlerRef = useRef<(() => void) | null>(null);

  // Hover timeout refs to prevent flicker
  const cellHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const boundaryHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store methods - using specific selectors to prevent unnecessary re-renders
  const updateTableCell = useKonvaCanvasStore(state => state.updateTableCell);
  const addTableRow = useKonvaCanvasStore(state => state.addTableRow);
  const addTableColumn = useKonvaCanvasStore(state => state.addTableColumn);
  const removeTableRow = useKonvaCanvasStore(state => state.removeTableRow);
  const removeTableColumn = useKonvaCanvasStore(state => state.removeTableColumn);
  const resizeTableColumn = useKonvaCanvasStore(state => state.resizeTableColumn);
  const resizeTableRow = useKonvaCanvasStore(state => state.resizeTableRow);
  const selectedTool = useKonvaCanvasStore(state => state.selectedTool);

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

  // Debug log the display dimensions
  if (liveSize) {
    console.log('🔧 [RESIZE DEBUG] Using live size for display:', { displayWidth, displayHeight, liveSize, totalWidth, totalHeight });
  }

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
        console.error("ERROR: stageRef is missing");
        return;
      }
      
      const stage = stageRef.current;
      const stageContainer = stage.container();
      if (!stageContainer) {
        console.error("ERROR: stageContainer is missing");
        return;
      }
      
      // Validate indices against tableRows and tableColumns
      if (rowIndex < 0 || rowIndex >= tableRows.length) {
        console.error("ERROR: Invalid row index:", rowIndex, "length:", tableRows.length);
        return;
      }
      if (colIndex < 0 || colIndex >= tableColumns.length) {
        console.error("ERROR: Invalid column index:", colIndex, "length:", tableColumns.length);
        return;
      }
      
      // Use simplified approach with findOne for reliable cell lookup
      const cellId = `${element.id}-cell-${rowIndex}-${colIndex}`;
      const cellNode = stage.findOne(`#${cellId}`);
      if (!cellNode) {
        console.error("ERROR: Cell node not found for ID:", cellId);
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
      const editingPosition = {
        x: stageRect.left + screenX,
        y: stageRect.top + screenY,
        width: (tableColumns[colIndex]?.width || 100) * stageScale,
        height: (tableRows[rowIndex]?.height || 40) * stageScale
      };
      
      setEditingCell({ row: rowIndex, col: colIndex });
      setEditingCellPosition(editingPosition);
    } catch (error) {
      console.error("ERROR in handleCellDoubleClick:", error);
    }
  };

  // Handle text change during editing
  const handleTextChange = useCallback((newText: string) => {
    if (editingCell) {
      updateTableCell(element.id, editingCell.row, editingCell.col, { text: newText });
    }
  }, [editingCell, element.id, updateTableCell]);

  // Handle rich text change during editing
  const handleRichTextChange = useCallback((segments: RichTextSegment[]) => {
    if (editingCell) {
      updateTableCell(element.id, editingCell.row, editingCell.col, { 
        richTextSegments: segments,
        text: segments.map(s => s.text).join('') // Keep plain text in sync
      });
    }
  }, [editingCell, element.id, updateTableCell]);

  // Handle finish editing
  const handleFinishEditing = useCallback(() => {
    setEditingCell(null);
    setEditingCellPosition(null);
  }, []);

  // Handle cancel editing
  const handleCancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditingCellPosition(null);
  }, []);

  // Handle resize start
  const handleResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, handle: 'se' | 'e' | 's' | 'nw' | 'n' | 'ne' | 'w' | 'sw') => {
    try {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      e.cancelBubble = true;
      setIsResizing(true); // For reactivity in draggable
      
      // Use stage coordinates consistently
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          startResizeOperation(handle, { x: pointerPos.x, y: pointerPos.y }, { width: totalWidth, height: totalHeight });
        }
      }
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
    }
  };

  // Handle column resize start
  const handleColumnResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, colIndex: number) => {
    try {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      e.cancelBubble = true;
      setIsResizing(true); // For reactivity in draggable
      
      const currentColumn = tableColumns[colIndex];
      const stage = e.target.getStage();
      if (stage && currentColumn) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          startResizeOperation('col', { x: pointerPos.x, y: pointerPos.y }, { width: totalWidth, height: totalHeight }, colIndex);
        }
      }
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
    }
  };

  // Handle row resize start
  const handleRowResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, rowIndex: number) => {
    try {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      e.cancelBubble = true;
      setIsResizing(true); // For reactivity in draggable
      
      const currentRow = tableRows[rowIndex];
      const stage = e.target.getStage();
      if (stage && currentRow) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          startResizeOperation('row', { x: pointerPos.x, y: pointerPos.y }, { width: totalWidth, height: totalHeight }, undefined, rowIndex);
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
  }, [enhancedTableData, totalWidth, totalHeight, onUpdate, resizeTableColumn, resizeTableRow]);

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
  const startResizeOperation = useCallback((handle: 'se' | 'e' | 's' | 'nw' | 'n' | 'ne' | 'w' | 'sw' | 'col' | 'row', startPos: { x: number; y: number }, startSize: { width: number; height: number }, columnIndex?: number, rowIndex?: number) => {
    console.log('🔧 [RESIZE DEBUG] startResizeOperation called with handle:', handle);
    
    if (!stageRef?.current) {
      console.log('❌ [RESIZE DEBUG] No stage reference found!');
      return;
    }
    
    const stage = stageRef.current;
    console.log('✅ [RESIZE DEBUG] Stage reference found, attaching event handlers');
    
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
    resizeStartElementPosRef.current = { x: element.x, y: element.y };
    
    if (handle === 'col' && columnIndex !== undefined) {
      resizingColumnIndexRef.current = columnIndex;
      columnStartWidthRef.current = tableColumns[columnIndex]?.width || 100;
      console.log('🔧 [RESIZE DEBUG] Column resize setup:', { columnIndex, startWidth: columnStartWidthRef.current });
    } else if (handle === 'row' && rowIndex !== undefined) {
      resizingRowIndexRef.current = rowIndex;
      rowStartHeightRef.current = tableRows[rowIndex]?.height || 40;
      console.log('🔧 [RESIZE DEBUG] Row resize setup:', { rowIndex, startHeight: rowStartHeightRef.current });
    }
    
    // Create new event handlers
    const handleMouseMove = () => {
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos || !resizeStartPosRef.current || !resizeStartSizeRef.current) return;

      const deltaX = pointerPos.x - resizeStartPosRef.current.x;
      const deltaY = pointerPos.y - resizeStartPosRef.current.y;

      if (resizeHandleRef.current === 'col' && resizingColumnIndexRef.current !== null && columnStartWidthRef.current !== null) {
        // Individual column resize using throttled store function
        const newWidth = Math.max(MIN_CELL_WIDTH, Math.min(MAX_CELL_WIDTH, columnStartWidthRef.current + deltaX));
        console.log('🔧 [RESIZE DEBUG] Column resize:', { columnIndex: resizingColumnIndexRef.current, newWidth, deltaX });
        throttledColumnResize(element.id, resizingColumnIndexRef.current, newWidth);
      } else if (resizeHandleRef.current === 'row' && resizingRowIndexRef.current !== null && rowStartHeightRef.current !== null) {
        // Individual row resize using throttled store function
        const newHeight = Math.max(MIN_CELL_HEIGHT, Math.min(MAX_CELL_HEIGHT, rowStartHeightRef.current + deltaY));
        console.log('🔧 [RESIZE DEBUG] Row resize:', { rowIndex: resizingRowIndexRef.current, newHeight, deltaY, startHeight: rowStartHeightRef.current });
        throttledRowResize(element.id, resizingRowIndexRef.current, newHeight);
        throttledRowResize(element.id, resizingRowIndexRef.current, newHeight);
      } else {
        // Table-wide resize with live feedback
        let newWidth = resizeStartSizeRef.current.width;
        let newHeight = resizeStartSizeRef.current.height;
        let newX = resizeStartElementPosRef.current?.x || element.x;
        let newY = resizeStartElementPosRef.current?.y || element.y;

        if (resizeHandleRef.current?.includes('e')) {
          newWidth = Math.max(MIN_TABLE_WIDTH, resizeStartSizeRef.current.width + deltaX);
        }
        if (resizeHandleRef.current?.includes('w')) {
          newWidth = Math.max(MIN_TABLE_WIDTH, resizeStartSizeRef.current.width - deltaX);
          newX = resizeStartElementPosRef.current!.x + deltaX;
        }
        if (resizeHandleRef.current?.includes('s')) {
          newHeight = Math.max(MIN_TABLE_HEIGHT, resizeStartSizeRef.current.height + deltaY);
        }
        if (resizeHandleRef.current?.includes('n')) {
          newHeight = Math.max(MIN_TABLE_HEIGHT, resizeStartSizeRef.current.height - deltaY);
          newY = resizeStartElementPosRef.current!.y + deltaY;
        }

        updateLiveSize({ width: newWidth, height: newHeight });
        
        // Update position for north/west resizing
        if (resizeHandleRef.current?.includes('w') || resizeHandleRef.current?.includes('n')) {
          const { updateElement } = useKonvaCanvasStore.getState();
          updateElement(element.id, { x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      console.log('🔧 [RESIZE DEBUG] Mouse up during resize');
      console.log('🔧 [RESIZE DEBUG] Current handle:', resizeHandleRef.current);
      console.log('🔧 [RESIZE DEBUG] Live size from ref:', liveSizeRef.current);
      console.log('🔧 [RESIZE DEBUG] Live size from state:', liveSize);
      
      if (resizeHandleRef.current === 'col' || resizeHandleRef.current === 'row') {
        // Individual column/row resize cleanup
        resizingColumnIndexRef.current = null;
        resizingRowIndexRef.current = null;
        columnStartWidthRef.current = null;
        rowStartHeightRef.current = null;
      } else if (liveSizeRef.current && resizeHandleRef.current) {
        console.log('🔧 [RESIZE DEBUG] Applying final table resize with live size:', liveSizeRef.current);
        // Table-wide resize final update
        const { updateElement } = useKonvaCanvasStore.getState();
        const currentElement = useKonvaCanvasStore.getState().elements[element.id];
        
        if (currentElement?.enhancedTableData) {
          const currentTableData = currentElement.enhancedTableData;
          const currentColumns = currentTableData.columns || [];
          const currentRows = currentTableData.rows || [];
          
          // Calculate current total dimensions
          const currentTotalWidth = currentColumns.reduce((sum, col) => sum + (col?.width || 100), 0);
          const currentTotalHeight = currentRows.reduce((sum, row) => sum + (row?.height || 40), 0);
          
          if (resizeHandleRef.current?.includes('e') && !resizeHandleRef.current?.includes('s') && !resizeHandleRef.current?.includes('n')) {
            // Only horizontal resize (e, w)
            const widthRatio = liveSizeRef.current.width / currentTotalWidth;
            const updatedColumns = currentColumns.map(col => ({
              ...col,
              width: Math.max(MIN_CELL_WIDTH, Math.round(col.width * widthRatio)),
            }));
            
            updateElement(element.id, {
              width: liveSizeRef.current.width,
              enhancedTableData: {
                ...currentTableData,
                columns: updatedColumns,
              },
            });
          } else if (resizeHandleRef.current?.includes('w') && !resizeHandleRef.current?.includes('s') && !resizeHandleRef.current?.includes('n')) {
            // Only horizontal resize (w)
            const widthRatio = liveSizeRef.current.width / currentTotalWidth;
            const updatedColumns = currentColumns.map(col => ({
              ...col,
              width: Math.max(MIN_CELL_WIDTH, Math.round(col.width * widthRatio)),
            }));
            
            updateElement(element.id, {
              width: liveSizeRef.current.width,
              enhancedTableData: {
                ...currentTableData,
                columns: updatedColumns,
              },
            });
          } else if ((resizeHandleRef.current?.includes('s') || resizeHandleRef.current?.includes('n')) && !resizeHandleRef.current?.includes('e') && !resizeHandleRef.current?.includes('w')) {
            // Only vertical resize (s, n)
            const heightRatio = liveSizeRef.current.height / currentTotalHeight;
            const updatedRows = currentRows.map(row => ({
              ...row,
              height: Math.max(MIN_CELL_HEIGHT, Math.round(row.height * heightRatio)),
            }));
            
            updateElement(element.id, {
              height: liveSizeRef.current.height,
              enhancedTableData: {
                ...currentTableData,
                rows: updatedRows,
              },
            });
          } else {
            // Both dimensions (corner handles: se, sw, ne, nw)
            const widthRatio = liveSizeRef.current.width / currentTotalWidth;
            const heightRatio = liveSizeRef.current.height / currentTotalHeight;

            const updatedColumns = currentColumns.map(col => ({
              ...col,
              width: Math.max(MIN_CELL_WIDTH, Math.round(col.width * widthRatio)),
            }));

            const updatedRows = currentRows.map(row => ({
              ...row,
              height: Math.max(MIN_CELL_HEIGHT, Math.round(row.height * heightRatio)),
            }));
            
            updateElement(element.id, {
              width: liveSizeRef.current.width,
              height: liveSizeRef.current.height,
              enhancedTableData: {
                ...currentTableData,
                columns: updatedColumns,
                rows: updatedRows,
              },
            });
          }
        }
      }

      // Clean up event handlers
      if (mouseMoveHandlerRef.current) {
        stage.off('mousemove', mouseMoveHandlerRef.current);
      }
      if (mouseUpHandlerRef.current) {
        stage.off('mouseup', mouseUpHandlerRef.current);
      }
      
      // Reset state - CRITICAL: Reset both ref and state versions
      isResizingRef.current = false;
      setIsResizing(false); // For reactivity in draggable
      resizeHandleRef.current = null;
      resizeStartPosRef.current = null;
      resizeStartSizeRef.current = null;
      resizeStartElementPosRef.current = null;
      mouseMoveHandlerRef.current = null;
      mouseUpHandlerRef.current = null;
      updateLiveSize(null);
    };
    
    // Store handlers in refs for cleanup
    mouseMoveHandlerRef.current = handleMouseMove;
    mouseUpHandlerRef.current = handleMouseUp;
    
    // Attach event handlers
    stage.on('mousemove', handleMouseMove);
    stage.on('mouseup', handleMouseUp);
  }, [element.id, tableColumns, tableRows, throttledColumnResize, throttledRowResize, enhancedTableDataRef, totalWidthRef, totalHeightRef, onUpdateRef, updateLiveSize]);

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

  // Render table cells - DO NOT MEMOIZE to ensure updates are reflected
  const renderCells = () => {
    try {
      return tableRows.map((row, rowIndex) =>
        tableColumns.map((col, colIndex) => {
          const cellData = enhancedTableData?.cells?.[rowIndex]?.[colIndex] || { text: '' };
          // Ensure we have the latest cell data from the store
          const cellText = cellData?.text || '';
          
          const cellX = tableColumns.slice(0, colIndex).reduce((sum, c) => sum + (c?.width || 100), 0) + 6;
          const cellY = tableRows.slice(0, rowIndex).reduce((sum, r) => sum + (r?.height || 40), 0) + 6;

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
                  x={-34}
                  y={-5}
                  width={40}
                  height={(row?.height || 40) + 10}
                  fill="transparent"
                  onMouseEnter={() => handleHeaderMouseEnter('row', rowIndex, { 
                    x: -30, 
                    y: tableRows.slice(0, rowIndex).reduce((sum, row) => sum + (row?.height || 40), 0) + (tableRows[rowIndex]?.height || 40) / 2 + 6
                  })}
                  onMouseLeave={handleHeaderMouseLeave}
                />
              )}

              {/* Column header hover area for delete button - larger area */}
              {rowIndex === 0 && (
                <Rect
                  key={`col-header-${colIndex}`}
                  x={-5}
                  y={-34}
                  width={(col?.width || 100) + 10}
                  height={40}
                  fill="transparent"
                  onMouseEnter={() => handleHeaderMouseEnter('column', colIndex, { 
                    x: tableColumns.slice(0, colIndex).reduce((sum, col) => sum + (col?.width || 100), 0) + (tableColumns[colIndex]?.width || 100) / 2 + 6,
                    y: -30
                  })}
                  onMouseLeave={handleHeaderMouseLeave}
                />
              )}

              {/* Cell text - render rich text segments if available, otherwise plain text */}
              {cellData?.richTextSegments && cellData.richTextSegments.length > 0 ? (
                // Render rich text segments with proper positioning
                (() => {
                  let currentX = 0;
                  const segmentsToRender = [];
                  const cellWidth = col?.width || 100;
                  
                  if (cellData.richTextSegments) {
                    for (let segmentIndex = 0; segmentIndex < cellData.richTextSegments.length; segmentIndex++) {
                      const segment = cellData.richTextSegments[segmentIndex];
                      
                      let konvaFontStyle = segment.fontStyle || 'normal';
                      if (segment.fontWeight === 'bold') {
                        konvaFontStyle = konvaFontStyle === 'italic' ? 'bold italic' : 'bold';
                      }

                      // @ts-ignore - listType may not be on the base segment type yet
                      if (segment.listType === 'bullet' && segmentIndex === 0) {
                        segmentsToRender.push(
                          <Text
                            key={`bullet-${rowIndex}-${colIndex}-${segmentIndex}`}
                            x={0}
                            y={8}
                            text={"• "}
                            fontSize={segment.fontSize || cellData.fontSize || 14}
                            fontFamily={segment.fontFamily || cellData.fontFamily || designSystem.typography.fontFamily.sans}
                            fill={segment.fill || cellData.textColor || designSystem.colors.secondary[800]}
                            listening={false}
                            verticalAlign="top"
                          />
                        );
                        currentX += 15;
                      }
                      
                      const textNode = new Konva.Text({
                        text: segment.text,
                        fontSize: segment.fontSize || cellData.fontSize || 14,
                        fontFamily: segment.fontFamily || cellData.fontFamily || designSystem.typography.fontFamily.sans,
                        fontStyle: konvaFontStyle,
                      });
                      
                      segmentsToRender.push(
                        <Text
                          key={`text-${rowIndex}-${colIndex}-${segmentIndex}`}
                          x={currentX}
                          y={8}
                          text={segment.text}
                          fontSize={segment.fontSize || cellData.fontSize || 14}
                          fontFamily={segment.fontFamily || cellData.fontFamily || designSystem.typography.fontFamily.sans}
                          fill={segment.fill || cellData.textColor || designSystem.colors.secondary[800]}
                          fontStyle={konvaFontStyle}
                          textDecoration={segment.textDecoration || ''}
                          verticalAlign="top"
                          listening={false}
                        />
                      );

                      currentX += textNode.width();
                    }
                  }

                  const totalTextWidth = currentX;
                  let groupX = 8; // Default left alignment with padding
                  if (cellData.textAlign === 'center') {
                    groupX = (cellWidth - totalTextWidth) / 2;
                  } else if (cellData.textAlign === 'right') {
                    groupX = cellWidth - totalTextWidth - 8;
                  }

                  return (
                    <Group x={groupX} y={0} width={cellWidth} clipFunc={(ctx) => { ctx.rect(0, 0, cellWidth, row?.height || 40); }}>
                        {segmentsToRender}
                    </Group>
                  );
                })()
              ) : (
                // Render plain text
                <Text
                  key={`text-${rowIndex}-${colIndex}`}
                  x={8}
                  y={8}
                  width={(col?.width || 100) - 16}
                  height={(row?.height || 40) - 16}
                  text={cellText}
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
  };

  const isDraggable = (selectedTool === 'select' || selectedTool === 'table') && !isResizing && !editingCell;

  const tableContent = (
    <Group
        key={`${element.id}-${getTableDataKey(enhancedTableData)}`}
        id={element.id}
        x={element.x}
        y={element.y}
        draggable={isDraggable}
        onDragEnd={handleDragEnd}
        onMouseLeave={handleTableMouseLeave}
        opacity={editingCell ? 0.95 : 1.0}
      >
        {/* Table background */}
        <Rect
          x={6}
          y={6}
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
        {renderCells()}

        {/* Resize handles - only show when selected with consistent spacing from table edges */}
        {isSelected && (
          <>
            {/* Top-left resize handle */}
            <Circle
              x={-8}
              y={-8}
              radius={6}
              fill={designSystem.colors.primary[500]}
              stroke="white"
              strokeWidth={2}
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'nw-resize';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
            
            {/* Top-center resize handle */}
            <Circle
              x={displayWidth / 2}
              y={-8}
              radius={6}
              fill={designSystem.colors.primary[500]}
              stroke="white"
              strokeWidth={2}
              onMouseDown={(e) => handleResizeStart(e, 'n')}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'n-resize';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
            
            {/* Top-right resize handle */}
            <Circle
              x={displayWidth + 8}
              y={-8}
              radius={6}
              fill={designSystem.colors.primary[500]}
              stroke="white"
              strokeWidth={2}
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'ne-resize';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
            
            {/* Middle-left resize handle */}
            <Circle
              x={-8}
              y={displayHeight / 2}
              radius={6}
              fill={designSystem.colors.primary[500]}
              stroke="white"
              strokeWidth={2}
              onMouseDown={(e) => handleResizeStart(e, 'w')}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'w-resize';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
            
            {/* Middle-right resize handle */}
            <Circle
              x={displayWidth + 8}
              y={displayHeight / 2}
              radius={6}
              fill={designSystem.colors.primary[500]}
              stroke="white"
              strokeWidth={2}
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
            
            {/* Bottom-left resize handle */}
            <Circle
              x={-8}
              y={displayHeight + 8}
              radius={6}
              fill={designSystem.colors.primary[500]}
              stroke="white"
              strokeWidth={2}
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'sw-resize';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
            
            {/* Bottom-center resize handle */}
            <Circle
              x={displayWidth / 2}
              y={displayHeight + 8}
              radius={6}
              fill={designSystem.colors.primary[500]}
              stroke="white"
              strokeWidth={2}
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
            
            {/* Bottom-right resize handle (corner) */}
            <Circle
              x={displayWidth + 8}
              y={displayHeight + 8}
              radius={6}
              fill={designSystem.colors.primary[500]}
              stroke="white"
              strokeWidth={2}
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

            {/* Column resize handles - positioned between columns */}
            {tableColumns.slice(0, -1).map((_, colIndex) => {
              const handleX = tableColumns.slice(0, colIndex + 1).reduce((sum, c) => sum + (c?.width || 100), 0) + 6;
              return (
                <Rect
                  key={`col-handle-${colIndex}`}
                  x={handleX}
                  y={6}
                  width={12}
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
              const handleY = tableRows.slice(0, rowIndex + 1).reduce((sum, r) => sum + (r?.height || 40), 0) + 6;
              return (
                <Rect
                  key={`row-handle-${rowIndex}`}
                  x={6}
                  y={handleY}
                  width={displayWidth}
                  height={12}
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
              let yPos = 6;
              for (let i = 0; i <= index; i++) {
                yPos += tableRows[i]?.height || 40;
              }
              return (
                <Rect
                  key={`row-hover-${index}`}
                  x={0}
                  y={yPos - 6}
                  width={displayWidth + 12}
                  height={12}
                  fill="transparent"
                  onMouseEnter={() => handleBoundaryMouseEnter('row', index, {
                    x: displayWidth / 2 + 6,
                    y: yPos
                  })}
                  onMouseLeave={handleBoundaryMouseLeave}
                  listening={true}
                />
              );
            })}

            {/* Column Add Handles - Improved with larger hit areas and debounced hover */}
            {tableColumns.map((_, index) => {
              let xPos = 6;
              for (let i = 0; i <= index; i++) {
                xPos += tableColumns[i]?.width || 100;
              }
              return (
                <Rect
                  key={`col-hover-${index}`}
                  x={xPos - 6}
                  y={0}
                  width={12}
                  height={displayHeight + 12}
                  fill="transparent"
                  onMouseEnter={() => handleBoundaryMouseEnter('column', index, {
                    x: xPos,
                    y: displayHeight / 2 + 6
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
  }, [editingCell, editingCellPosition, enhancedTableData, onEditingStateChange, handleTextChange, handleRichTextChange, handleFinishEditing, handleCancelEditing]);

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