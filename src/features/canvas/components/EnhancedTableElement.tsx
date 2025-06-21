import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, isTableElement, TableCell, ElementId } from '../types/enhanced.types';
import { designSystem } from '../../../styles/designSystem';
import { 
  useCanvasStore
} from '../stores/canvasStore.enhanced';

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


interface EnhancedTableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (element: CanvasElement) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

// Helper function to generate a stable key from table data
const getTableDataKey = (tableData: any) => {
  if (!tableData?.cells) return 'empty';
  return tableData.cells.map((row: any[]) => 
    row.map((cell: any) => cell?.text || '').join('|')
  ).join('||');
};

// Type guard to check if a cell is a full TableCell or just a simple text cell
const isFullTableCell = (cell: any): cell is TableCell => {
  return cell && typeof cell === 'object' && 'id' in cell;
};

export const EnhancedTableElement = React.forwardRef<Konva.Group, EnhancedTableElementProps>(
  ({ element, isSelected, onSelect, onUpdate, onDragEnd, stageRef }, ref) => {
  
  // Type safety: Ensure we're working with a table element
  if (!isTableElement(element)) {
    console.error('🔧 [TABLE] Invalid element type passed to EnhancedTableElement:', element.type);
    return null;
  }
  
  // Type assertion for branded ID - table elements should always have ElementId
  const tableId = element.id as ElementId;

  // State for hover interactions and controls
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [boundaryHover, setBoundaryHover] = useState<{ type: 'row' | 'column'; index: number; position: { x: number; y: number } } | null>(null);
  const [headerHover, setHeaderHover] = useState<{ type: 'row' | 'column' | null; index: number; position: { x: number; y: number } }>({ type: null, index: -1, position: { x: 0, y: 0 } });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'row' | 'column'; index: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  // Cell editor position state for dynamic updates
  const [cellEditorPosition, setCellEditorPosition] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  // Debug: Log when component re-renders due to prop changes (minimal logging)
  useEffect(() => {
    // Reduce logging frequency for performance
    if (Math.random() < 0.1) { // Only log 10% of renders
      console.log('🔄 [TABLE] Component rendered:', element.id);
    }
  }, [element]);

  // Missing resize state variables
  // Using refs instead of state to prevent re-renders during resize operations

  // Resize state using refs to prevent re-renders
  const isResizingRef = useRef(false);
  const resizeHandleRef = useRef<'se' | 'e' | 's' | 'nw' | 'n' | 'ne' | 'w' | 'sw' | 'col' | 'row' | null>(null);
  const resizeStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartSizeRef = useRef<{ width: number; height: number } | null>(null);
  const resizeStartElementPosRef = useRef<{ x: number; y: number } | null>(null);
  const [liveSize, setLiveSize] = useState<{ width: number, height: number } | null>(null);
  const liveSizeRef = useRef<{ width: number, height: number } | null>(null);

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

  // Store methods - FIXED: Use main combined store for consistency (Task 1.11)
  const { 
    updateTableCell, 
    addTableRow, 
    addTableColumn, 
    removeTableRow, 
    removeTableColumn, 
    resizeTableRow, 
    resizeTableColumn, 
    updateElement,
    selectedTool 
  } = useCanvasStore();

  console.log('🔧 [TABLE ELEMENT] Rendered with:', {
    isSelected,
    editingCell: !!editingCell,
    boundaryHover: !!boundaryHover,
    headerHover: headerHover.type,
    storeMethodsAvailable: typeof addTableRow === 'function'
  });
  // Get enhanced table data from element with null safety and type guard
  const enhancedTableData = isTableElement(element) ? element.enhancedTableData : undefined;

  console.log('🔧 [ENHANCED TABLE] Rendering table:', element.id, { 
    hasEnhancedTableData: !!enhancedTableData,
    enhancedTableData 
  });

  // Early return if no table data
  if (!enhancedTableData) {
    console.warn('🔧 [ENHANCED TABLE] No enhancedTableData found for table:', element.id);
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
    // console.log('🔧 [RESIZE DEBUG] Using live size for display:', { displayWidth, displayHeight, liveSize, totalWidth, totalHeight });
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
  // Handle remove row/column
  const handleRemoveRowColumn = useCallback((type: 'row' | 'column', index: number) => {
    if (type === 'row') {
      removeTableRow?.(tableId, index);
    } else {
      removeTableColumn?.(tableId, index);
    }
    setContextMenu(null);
  }, [tableId, removeTableRow, removeTableColumn]);

  // Handle delete key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {      if (e.key === 'Delete' && editingCell) {
        // If a cell is selected but not being edited, allow row/column deletion
        if (e.shiftKey) {
          // Shift+Delete removes column
          removeTableColumn?.(tableId, editingCell.col);
          setEditingCell(null);
        } else if (e.ctrlKey || e.metaKey) {
          // Ctrl+Delete removes row
          removeTableRow?.(tableId, editingCell.row);
          setEditingCell(null);
        }
      }
    };

    if (editingCell) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }

    // Return undefined when not adding event listeners
    return undefined;
  }, [editingCell, element.id, removeTableRow, removeTableColumn]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }

    // Return undefined when not adding event listeners
    return undefined;
  }, [contextMenu]);

  // Handle cell double-click for editing
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
    setHoveredCell({ row: targetRow, col: targetCol });
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
      };      // Use the store's updateTableCell method
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
        setHoveredCell(null);
      }

    } catch (error) {
      console.error('ERROR in handleCellSave:', error);
      setEditingCell(null);
    }
  }, [editingCell, tableId, updateTableCell, getNextCell, navigateToCell]);

  // Handle cell edit cancel
  const handleCellCancel = () => {
    console.log('❌ [TABLE] Cancelling cell edit');
    setEditingCell(null);
  };

  // Handle resize start
  const handleResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, handle: 'se' | 'e' | 's' | 'nw' | 'n' | 'ne' | 'w' | 'sw') => {
    try {
      console.log('🔧 [RESIZE DEBUG] handleResizeStart called with handle:', handle);

      e.evt.preventDefault();
      e.evt.stopPropagation();
      e.cancelBubble = true;
      setIsResizing(true); // For reactivity in draggable

      // Use stage coordinates consistently
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          console.log('🔧 [RESIZE DEBUG] Starting resize operation, pointerPos:', pointerPos);
          startResizeOperation(handle, { x: pointerPos.x, y: pointerPos.y }, { width: totalWidth, height: totalHeight });
        } else {
          console.warn('🔧 [RESIZE DEBUG] No pointer position available');
        }
      } else {
        console.warn('🔧 [RESIZE DEBUG] No stage available');
      }
    } catch (error) {
      console.error("Error in handleResizeStart:", error);
    }
  };

  // Handle column resize start
  const handleColumnResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, colIndex: number) => {
    try {
      console.log('🔧 [RESIZE DEBUG] handleColumnResizeStart called with colIndex:', colIndex);

      e.evt.preventDefault();
      e.evt.stopPropagation();
      e.cancelBubble = true;
      setIsResizing(true); // For reactivity in draggable

      const currentColumn = tableColumns[colIndex];
      const stage = e.target.getStage();
      if (stage && currentColumn) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          console.log('🔧 [RESIZE DEBUG] Starting column resize operation, colIndex:', colIndex, 'pointerPos:', pointerPos);
          startResizeOperation('col', { x: pointerPos.x, y: pointerPos.y }, { width: totalWidth, height: totalHeight }, colIndex);
        } else {
          console.warn('🔧 [RESIZE DEBUG] No pointer position for column resize');
        }
      } else {
        console.warn('🔧 [RESIZE DEBUG] No stage or column for column resize');
      }
    } catch (error) {
      console.error("Error in handleColumnResizeStart:", error);
    }
  };

  // Handle row resize start
  const handleRowResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, rowIndex: number) => {
    try {
      console.log('🔧 [RESIZE DEBUG] handleRowResizeStart called with rowIndex:', rowIndex);

      e.evt.preventDefault();
      e.evt.stopPropagation();
      e.cancelBubble = true;
      setIsResizing(true); // For reactivity in draggable

      const currentRow = tableRows[rowIndex];
      const stage = e.target.getStage();
      if (stage && currentRow) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          console.log('🔧 [RESIZE DEBUG] Starting row resize operation, rowIndex:', rowIndex, 'pointerPos:', pointerPos);
          startResizeOperation('row', { x: pointerPos.x, y: pointerPos.y }, { width: totalWidth, height: totalHeight }, undefined, rowIndex);
        } else {
          console.warn('🔧 [RESIZE DEBUG] No pointer position for row resize');
        }
      } else {
        console.warn('🔧 [RESIZE DEBUG] No stage or row for row resize');
      }
    } catch (error) {
      console.error("Error in handleRowResizeStart:", error);
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
    throttle((elementId: ElementId, columnIndex: number, newWidth: number) => {
      resizeTableColumnRef.current?.(elementId, columnIndex, newWidth);
    }, 16) // ~60fps
  ).current;

  const throttledRowResize = useRef(
    throttle((elementId: ElementId, rowIndex: number, newHeight: number) => {
      resizeTableRowRef.current?.(elementId, rowIndex, newHeight);
    }, 16) // ~60fps
  ).current;

  // Direct resize event handling without useEffect to prevent duplication
  const startResizeOperation = useCallback((handle: 'se' | 'e' | 's' | 'nw' | 'n' | 'ne' | 'w' | 'sw' | 'col' | 'row', startPos: { x: number; y: number }, startSize: { width: number; height: number }, columnIndex?: number, rowIndex?: number) => {
    console.log('🔧 [RESIZE DEBUG] startResizeOperation called with handle:', handle, 'stageRef available:', !!stageRef?.current);

    if (!stageRef?.current) {
      console.error('❌ [RESIZE DEBUG] No stage reference found!');
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
      // console.log('🔧 [RESIZE DEBUG] Column resize setup:', { columnIndex, startWidth: columnStartWidthRef.current });
    } else if (handle === 'row' && rowIndex !== undefined) {
      resizingRowIndexRef.current = rowIndex;
      rowStartHeightRef.current = tableRows[rowIndex]?.height || 40;
      // console.log('🔧 [RESIZE DEBUG] Row resize setup:', { rowIndex, startHeight: rowStartHeightRef.current });
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
        // console.log('🔧 [RESIZE DEBUG] Column resize:', { columnIndex: resizingColumnIndexRef.current, newWidth, deltaX });
        throttledColumnResize(element.id, resizingColumnIndexRef.current, newWidth);
      } else if (resizeHandleRef.current === 'row' && resizingRowIndexRef.current !== null && rowStartHeightRef.current !== null) {
        // Individual row resize using throttled store function
        const newHeight = Math.max(MIN_CELL_HEIGHT, Math.min(MAX_CELL_HEIGHT, rowStartHeightRef.current + deltaY));
        // console.log('🔧 [RESIZE DEBUG] Row resize:', { rowIndex: resizingRowIndexRef.current, newHeight, deltaY, startHeight: rowStartHeightRef.current });
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
          console.log('🔧 [TABLE DEBUG] About to call updateElement for position:', { 
            elementId: element.id, 
            newX, 
            newY,
            currentElementsInStore: Object.keys(useCanvasStore.getState().elements)
          });
          // Use the updateElement function from the hook instead of getting it from store
          updateElement(tableId, { x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      // console.log('🔧 [RESIZE DEBUG] Mouse up during resize');
      // console.log('🔧 [RESIZE DEBUG] Current handle:', resizeHandleRef.current);
      // console.log('🔧 [RESIZE DEBUG] Live size from ref:', liveSizeRef.current);
      // console.log('🔧 [RESIZE DEBUG] Live size from state:', liveSize);

      if (resizeHandleRef.current === 'col' || resizeHandleRef.current === 'row') {
        // Individual column/row resize cleanup
        resizingColumnIndexRef.current = null;
        resizingRowIndexRef.current = null;
        columnStartWidthRef.current = null;
        rowStartHeightRef.current = null;
      } else if (liveSizeRef.current && resizeHandleRef.current) {
        // console.log('🔧 [RESIZE DEBUG] Applying final table resize with live size:', liveSizeRef.current);
        // Table-wide resize final update
        // Use the updateElement function from the hook instead of getting it from store
        const currentElement = useCanvasStore.getState().elements.get(element.id);        if (currentElement && isTableElement(currentElement) && currentElement.enhancedTableData) {
          const currentTableData = currentElement.enhancedTableData;
          const currentColumns = currentTableData.columns || [];
          const currentRows = currentTableData.rows || [];

          // Calculate current total dimensions
          const currentTotalWidth = currentColumns.reduce((sum, col) => sum + (col?.width || 100), 0);
          const currentTotalHeight = currentRows.reduce((sum, row) => sum + (row?.height || 40), 0);

          if (resizeHandleRef.current?.includes('e') && !resizeHandleRef.current?.includes('s') && !resizeHandleRef.current?.includes('n')) {            // Only horizontal resize (e, w)
            const widthRatio = liveSizeRef.current.width / currentTotalWidth;
            const updatedColumns = currentColumns.map(col => ({
              ...col,
              width: Math.max(MIN_CELL_WIDTH, Math.round((col.width || MIN_CELL_WIDTH) * widthRatio)),
            }));

            updateElement(element.id, {
              width: liveSizeRef.current.width,
              enhancedTableData: {
                ...currentTableData,
                columns: updatedColumns,
              },
            });          } else if (resizeHandleRef.current?.includes('w') && !resizeHandleRef.current?.includes('s') && !resizeHandleRef.current?.includes('n')) {
            // Only horizontal resize (w)
            const widthRatio = liveSizeRef.current.width / currentTotalWidth;
            const updatedColumns = currentColumns.map(col => ({
              ...col,
              width: Math.max(MIN_CELL_WIDTH, Math.round((col.width || MIN_CELL_WIDTH) * widthRatio)),
            }));

            updateElement(element.id, {
              width: liveSizeRef.current.width,
              enhancedTableData: {
                ...currentTableData,
                columns: updatedColumns,
              },
            });          } else if ((resizeHandleRef.current?.includes('s') || resizeHandleRef.current?.includes('n')) && !resizeHandleRef.current?.includes('e') && !resizeHandleRef.current?.includes('w')) {
            // Only vertical resize (s, n)
            const heightRatio = liveSizeRef.current.height / currentTotalHeight;
            const updatedRows = currentRows.map(row => ({
              ...row,
              height: Math.max(MIN_CELL_HEIGHT, Math.round((row.height ?? MIN_CELL_HEIGHT) * heightRatio)),
            }));

            updateElement(element.id, {
              height: liveSizeRef.current.height,
              enhancedTableData: {
                ...currentTableData,
                rows: updatedRows,
              },
            });
          } else {            // Both dimensions (corner handles: se, sw, ne, nw)
            const widthRatio = liveSizeRef.current.width / currentTotalWidth;
            const heightRatio = liveSizeRef.current.height / currentTotalHeight;

            const updatedColumns = currentColumns.map(col => ({
              ...col,
              width: Math.max(MIN_CELL_WIDTH, Math.round((col.width ?? MIN_CELL_WIDTH) * widthRatio)),
            }));

            const updatedRows = currentRows.map(row => ({
              ...row,
              height: Math.max(MIN_CELL_HEIGHT, Math.round((row.height ?? MIN_CELL_HEIGHT) * heightRatio)),
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
    console.log('🔧 [BOUNDARY HOVER] Mouse enter:', type, 'index:', index, 'position:', position);
    if (boundaryHoverTimeoutRef.current) {
      clearTimeout(boundaryHoverTimeoutRef.current);
      boundaryHoverTimeoutRef.current = null;
    }
    setBoundaryHover({ type, index, position });
  };

  const handleBoundaryMouseLeave = () => {
    console.log('🔧 [BOUNDARY HOVER] Mouse leave');
    if (boundaryHoverTimeoutRef.current) {
      clearTimeout(boundaryHoverTimeoutRef.current);
    }
    boundaryHoverTimeoutRef.current = setTimeout(() => {
      console.log('🔧 [BOUNDARY HOVER] Clearing boundary hover after timeout');
      setBoundaryHover(null);
    }, 150); // 150ms delay before clearing
  };

  // Enhanced header hover handling with debouncing
  const handleHeaderMouseEnter = (type: 'row' | 'column', index: number, position: { x: number; y: number }) => {
    console.log('🔧 [HEADER HOVER] Mouse enter:', type, 'index:', index, 'position:', position);
    if (headerHoverTimeoutRef.current) {
      clearTimeout(headerHoverTimeoutRef.current);
      headerHoverTimeoutRef.current = null;
    }
    setHeaderHover({ type, index, position });
  };

  const handleHeaderMouseLeave = () => {
    console.log('🔧 [HEADER HOVER] Mouse leave');
    if (headerHoverTimeoutRef.current) {
      clearTimeout(headerHoverTimeoutRef.current);
    }
    headerHoverTimeoutRef.current = setTimeout(() => {
      console.log('🔧 [HEADER HOVER] Clearing header hover after timeout');
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
  // Render table cells - Use robust pattern to eliminate whitespace issues
  const renderCells = () => {
    try {
      // Use map-to-variable pattern to avoid whitespace issues
      const allCells = [];
      
      for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
        const row = tableRows[rowIndex];
        
        for (let colIndex = 0; colIndex < tableColumns.length; colIndex++) {
          const col = tableColumns[colIndex];
          const cellData = enhancedTableData?.cells?.[rowIndex]?.[colIndex] || { text: '' };

          // Minimal debug logging for performance
          if (rowIndex === 0 && colIndex === 0 && Math.random() < 0.05) {
            console.log('🔍 [TABLE] First cell:', cellData?.text || 'empty');
          }

          // Ensure we have the latest cell data from the store
          const cellText = cellData?.text || '';

          const cellX = tableColumns.slice(0, colIndex).reduce((sum, c) => sum + (c?.width || 100), 0) + 6;
          const cellY = tableRows.slice(0, rowIndex).reduce((sum, r) => sum + (r?.height || 40), 0) + 6;          // Build cell components array to avoid whitespace issues
          const cellComponents = [];
          
          cellComponents.push(
            <Rect
              key={`cell-${rowIndex}-${colIndex}`}
              x={0}
              y={0}
              width={col?.width || 100}
              height={row?.height || 40}
              fill={
                editingCell?.row === rowIndex && editingCell?.col === colIndex
                  ? '#F0F8FF'
                  : hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex
                  ? '#F8FAFC'
                  : rowIndex === 0 || colIndex === 0
                  ? '#FAFBFC'
                  : 'white'
              }
              stroke={designSystem.colors.secondary[200]}
              strokeWidth={0.5}
              onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
              onMouseLeave={handleCellMouseLeave}
              onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
              onDblClick={() => handleCellDoubleClick(rowIndex, colIndex)}
              onContextMenu={(e) => handleCellRightClick(rowIndex, colIndex, e)}
            />
          );

          if (rowIndex === 0) {
            cellComponents.push(
              <Rect
                key={`header-bottom-${colIndex}`}
                x={0}
                y={(row?.height || 40) - 1}
                width={col?.width || 100}
                height={1}
                fill={designSystem.colors.secondary[300]}
                listening={false}
              />
            );
          }

          if (colIndex === 0) {
            cellComponents.push(
              <Rect
                key={`header-right-${rowIndex}`}
                x={(col?.width || 100) - 1}
                y={0}
                width={1}
                height={row?.height || 40}
                fill={designSystem.colors.secondary[300]}
                listening={false}
              />
            );
          }

          if (colIndex === 0) {
            cellComponents.push(
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
            );
          }

          if (rowIndex === 0) {
            cellComponents.push(
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
            );
          }

          // Add text content
          if (isFullTableCell(cellData) && cellData?.segments && cellData.segments.length > 0) {
            const segmentsToRender = [];
            let currentX = 0;
            const cellWidth = col?.width || 100;

            if (cellData.segments) {
              for (let segmentIndex = 0; segmentIndex < cellData.segments.length; segmentIndex++) {
                const segment = cellData.segments[segmentIndex];

                if (!segment) continue;

                let konvaFontStyle = segment.fontStyle || 'normal';
                if (segment.fontWeight === 'bold') {
                  konvaFontStyle = konvaFontStyle === 'italic' ? 'bold italic' : 'bold';
                }

                const isHeaderCell = rowIndex === 0 || colIndex === 0;
                const effectiveFontSize = isHeaderCell 
                  ? (segment.fontSize || cellData.fontSize || 15)
                  : (segment.fontSize || cellData.fontSize || 14);

                const effectiveFontStyle = isHeaderCell && konvaFontStyle === 'normal' 
                  ? 'bold' 
                  : konvaFontStyle;

                const effectiveTextColor = isHeaderCell 
                  ? designSystem.colors.secondary[900]
                  : (segment.fill || cellData.textColor || designSystem.colors.secondary[800]);

                // @ts-ignore - listType may not be on the base segment type yet
                if (segment.listType === 'bullet' && segmentIndex === 0) {
                  segmentsToRender.push(
                    <Text
                      key={`bullet-${rowIndex}-${colIndex}-${segmentIndex}`}
                      x={0}
                      y={8}
                      text={"• "}
                      fontSize={effectiveFontSize}
                      fontFamily={segment.fontFamily || cellData.fontFamily || designSystem.typography.fontFamily.sans}
                      fill={effectiveTextColor}
                      fontStyle={effectiveFontStyle}
                      listening={false}
                      verticalAlign="top"
                    />
                  );
                  currentX += 15;
                }

                const textNode = new Konva.Text({
                  text: segment.text,
                  fontSize: effectiveFontSize,
                  fontFamily: segment.fontFamily || cellData.fontFamily || designSystem.typography.fontFamily.sans,
                  fontStyle: effectiveFontStyle,
                });

                segmentsToRender.push(
                  <Text
                    key={`text-${rowIndex}-${colIndex}-${segmentIndex}`}
                    x={currentX}
                    y={8}
                    text={segment.text}
                    fontSize={effectiveFontSize}
                    fontFamily={segment.fontFamily || cellData.fontFamily || designSystem.typography.fontFamily.sans}
                    fill={effectiveTextColor}
                    fontStyle={effectiveFontStyle}
                    textDecoration={segment.textDecoration || ''}
                    verticalAlign="top"
                    listening={false}
                  />
                );

                currentX += textNode.width();
              }
            }

            const totalTextWidth = currentX;
            let groupX = 8;
            if (cellData.textAlign === 'center') {
              groupX = (cellWidth - totalTextWidth) / 2;
            } else if (cellData.textAlign === 'right') {
              groupX = cellWidth - totalTextWidth - 8;
            }

            cellComponents.push(
              <Group key={`text-group-${rowIndex}-${colIndex}`} x={groupX} y={0} width={cellWidth} clipFunc={(ctx) => { ctx.rect(0, 0, cellWidth, row?.height || 40); }}>
                {segmentsToRender}
              </Group>
            );
          } else {
            cellComponents.push(
              <Text
                key={`text-${rowIndex}-${colIndex}`}
                x={8}
                y={8}
                width={(col?.width || 100) - 16}
                height={(row?.height || 40) - 16}
                text={cellText}
                fontSize={
                  (rowIndex === 0 || colIndex === 0) 
                    ? (isFullTableCell(cellData) ? cellData?.fontSize || 15 : 15)
                    : (isFullTableCell(cellData) ? cellData?.fontSize || 14 : 14)
                }
                fontFamily={isFullTableCell(cellData) ? cellData?.fontFamily || designSystem.typography.fontFamily.sans : designSystem.typography.fontFamily.sans}
                fontStyle={
                  (rowIndex === 0 || colIndex === 0) 
                    ? 'bold'
                    : (isFullTableCell(cellData) ? cellData?.fontStyle || 'normal' : 'normal')
                }
                fill={
                  (rowIndex === 0 || colIndex === 0)
                    ? designSystem.colors.secondary[900]
                    : (isFullTableCell(cellData) ? cellData?.textColor || designSystem.colors.secondary[800] : designSystem.colors.secondary[800])
                }
                align={isFullTableCell(cellData) ? cellData?.textAlign || 'left' : 'left'}
                verticalAlign="top"
                wrap="word"
                listening={false}
              />
            );
          }

          allCells.push(
            <Group key={`${rowIndex}-${colIndex}`} id={`${element.id}-cell-${rowIndex}-${colIndex}`} x={cellX} y={cellY}>
              {cellComponents}
            </Group>
          );
        }
      }
      
      return allCells;
    } catch (error) {
      console.error("An error occurred in EnhancedTableElement:", error);
      return [];
    }
  };
  const isDraggable = (selectedTool === 'select' || selectedTool === 'table') && !isResizing && !editingCell && !boundaryHover && !headerHover.type;

  // Build table content using array pattern to avoid whitespace issues
  const tableContentElements = [];
  
  // Add background rect
  tableContentElements.push(
    <Rect
      key="background"
      x={6}
      y={6}
      width={displayWidth}
      height={displayHeight}
      fill="white"
      stroke={isSelected ? designSystem.colors.primary[400] : designSystem.colors.secondary[300]}
      strokeWidth={isSelected ? 2 : 1}
      cornerRadius={8}
      shadowColor="rgba(0, 0, 0, 0.08)"
      shadowBlur={12}
      shadowOffset={{ x: 0, y: 4 }}
    />  );
  
  // Add cells
  tableContentElements.push(...renderCells());
  
  // Add resize handles if selected and not editing
  if (isSelected && !editingCell) {
    // Corner and edge resize handles
    tableContentElements.push(
      <Circle
        key="resize-nw"
        x={6 - 8}
        y={6 - 8}
        radius={7}
        fill={designSystem.colors.primary[500]}
        stroke="white"
        strokeWidth={3}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
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
    );
    
    tableContentElements.push(
      <Circle
        key="resize-n"
        x={6 + displayWidth / 2}
        y={6 - 8}
        radius={7}
        fill={designSystem.colors.primary[500]}
        stroke="white"
        strokeWidth={3}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
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
    );
    
    tableContentElements.push(
      <Circle
        key="resize-ne"
        x={6 + displayWidth + 8}
        y={6 - 8}
        radius={7}
        fill={designSystem.colors.primary[500]}
        stroke="white"
        strokeWidth={3}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
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
    );
    
    tableContentElements.push(
      <Circle
        key="resize-w"
        x={6 - 8}
        y={6 + displayHeight / 2}
        radius={7}
        fill={designSystem.colors.primary[500]}
        stroke="white"
        strokeWidth={3}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
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
    );
    
    tableContentElements.push(
      <Circle
        key="resize-e"
        x={6 + displayWidth + 8}
        y={6 + displayHeight / 2}
        radius={7}
        fill={designSystem.colors.primary[500]}
        stroke="white"
        strokeWidth={3}
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
    );
    
    tableContentElements.push(
      <Circle
        key="resize-sw"
        x={6 - 8}
        y={6 + displayHeight + 8}
        radius={7}
        fill={designSystem.colors.primary[500]}
        stroke="white"
        strokeWidth={3}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
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
    );
    
    tableContentElements.push(
      <Circle
        key="resize-s"
        x={6 + displayWidth / 2}
        y={6 + displayHeight + 8}
        radius={7}
        fill={designSystem.colors.primary[500]}
        stroke="white"
        strokeWidth={3}
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
    );
    
    tableContentElements.push(
      <Circle
        key="resize-se"
        x={6 + displayWidth + 8}
        y={6 + displayHeight + 8}
        radius={7}
        fill={designSystem.colors.primary[500]}
        stroke="white"
        strokeWidth={3}
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
    );
    
    // Column resize handles
    for (let colIndex = 0; colIndex < tableColumns.length - 1; colIndex++) {
      const handleX = tableColumns.slice(0, colIndex + 1).reduce((sum, c) => sum + (c?.width || 100), 0) + 6;
      tableContentElements.push(
        <Rect
          key={`col-handle-${colIndex}`}
          x={handleX - 8}
          y={6}
          width={16}
          height={displayHeight}
          fill="rgba(59, 130, 246, 0.15)"
          stroke={designSystem.colors.primary[400]}
          strokeWidth={1}
          cornerRadius={2}
          onMouseDown={(e) => {
            console.log('🔧 [RESIZE DEBUG] Column resize handle mousedown for column:', colIndex);
            handleColumnResizeStart(e, colIndex);
          }}
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
    }
    
    // Row resize handles
    for (let rowIndex = 0; rowIndex < tableRows.length - 1; rowIndex++) {
      const handleY = tableRows.slice(0, rowIndex + 1).reduce((sum, r) => sum + (r?.height || 40), 0) + 6;
      tableContentElements.push(
        <Rect
          key={`row-handle-${rowIndex}`}
          x={6}
          y={handleY - 8}
          width={displayWidth}
          height={16}
          fill="rgba(59, 130, 246, 0.15)"
          stroke={designSystem.colors.primary[400]}
          strokeWidth={1}
          cornerRadius={2}
          onMouseDown={(e) => {
            console.log('🔧 [RESIZE DEBUG] Row resize handle mousedown for row:', rowIndex);
            handleRowResizeStart(e, rowIndex);
          }}
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
    }
  }
  
  // Add hover boundary elements if selected and not editing
  if (isSelected && !editingCell) {
    // Row hover boundaries
    for (let index = 0; index < tableRows.length; index++) {
      let yPos = 6;
      for (let i = 0; i <= index; i++) {
        yPos += tableRows[i]?.height || 40;
      }
      tableContentElements.push(
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
    }
    
    // Column hover boundaries
    for (let index = 0; index < tableColumns.length; index++) {
      let xPos = 6;
      for (let i = 0; i <= index; i++) {
        xPos += tableColumns[i]?.width || 100;
      }
      tableContentElements.push(
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
    }
    
    // Boundary hover feedback
    if (boundaryHover) {
      const boundaryElements = [];
      
      boundaryElements.push(
        <Rect
          key="boundary-line"
          x={boundaryHover.type === 'column' ? boundaryHover.position.x - 1 : 0}
          y={boundaryHover.type === 'row' ? boundaryHover.position.y - 1 : 0}
          width={boundaryHover.type === 'column' ? 2 : displayWidth}
          height={boundaryHover.type === 'row' ? 2 : displayHeight}
          fill={designSystem.colors.primary[400]}
          opacity={0.7}
          listening={false}
        />
      );
      
      boundaryElements.push(
        <Circle
          key="boundary-add-btn"
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
            console.log('🔧 [ADD BUTTON] Add button clicked for:', boundaryHover.type, 'at index:', boundaryHover.index);
            e.evt.preventDefault();
            e.evt.stopPropagation();
            e.cancelBubble = true;
            try {
              if (boundaryHover.type === 'row') {
                console.log('🔧 [ADD BUTTON] Adding table row to element:', element.id);
                addTableRow?.(element.id);
              } else {
                console.log('🔧 [ADD BUTTON] Adding table column to element:', element.id);
                addTableColumn?.(element.id);
              }
              setBoundaryHover(null);
            } catch (error) {
              console.error('Error adding row/column:', error);
            }
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
      );
      
      boundaryElements.push(
        <Text
          key="boundary-add-text"
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
      );
      
      tableContentElements.push(
        <Group
          key="boundary-hover-group"
          onMouseEnter={() => {
            if (boundaryHoverTimeoutRef.current) {
              clearTimeout(boundaryHoverTimeoutRef.current);
              boundaryHoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={handleBoundaryMouseLeave}
        >
          {boundaryElements}
        </Group>
      );
    }
  }
  
  // Add header hover delete buttons if selected and not editing
  if (isSelected && !editingCell && headerHover.type === 'row' && tableRows.length > 1) {
    const headerRowElements = [];
    
    headerRowElements.push(
      <Circle
        key="header-row-delete-btn"
        x={headerHover.position.x}
        y={headerHover.position.y}
        radius={12}
        fill={designSystem.colors.error[500]}
        stroke="white"
        strokeWidth={2}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
        onClick={() => {
          console.log('🔧 [DELETE BUTTON] Delete row button clicked for row:', headerHover.index);
          try {
            removeTableRow?.(element.id, headerHover.index);
          } catch (error) {
            console.error('Error removing row:', error);
          }
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
    );
    
    headerRowElements.push(
      <Text
        key="header-row-delete-text"
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
    );
    
    tableContentElements.push(
      <Group
        key="header-row-hover-group"
        onMouseEnter={() => {
          if (headerHoverTimeoutRef.current) {
            clearTimeout(headerHoverTimeoutRef.current);
            headerHoverTimeoutRef.current = null;
          }
        }}
        onMouseLeave={() => {
          if (headerHoverTimeoutRef.current) {
            clearTimeout(headerHoverTimeoutRef.current);
          }
          headerHoverTimeoutRef.current = setTimeout(() => {
            setHeaderHover({ type: null, index: -1, position: { x: 0, y: 0 } });
          }, 150);
        }}
      >
        {headerRowElements}
      </Group>
    );
  }
  
  if (isSelected && !editingCell && headerHover.type === 'column' && tableColumns.length > 1) {
    const headerColElements = [];
    
    headerColElements.push(
      <Circle
        key="header-col-delete-btn"
        x={headerHover.position.x}
        y={headerHover.position.y}
        radius={12}
        fill={designSystem.colors.error[500]}
        stroke="white"
        strokeWidth={2}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
        onClick={() => {
          console.log('🔧 [DELETE BUTTON] Delete column button clicked for column:', headerHover.index);
          try {
            removeTableColumn?.(element.id, headerHover.index);
          } catch (error) {
            console.error('Error removing column:', error);
          }
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
    );
    
    headerColElements.push(
      <Text
        key="header-col-delete-text"
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
    );
    
    tableContentElements.push(
      <Group
        key="header-col-hover-group"
        onMouseEnter={() => {
          if (headerHoverTimeoutRef.current) {
            clearTimeout(headerHoverTimeoutRef.current);
            headerHoverTimeoutRef.current = null;
          }
        }}
        onMouseLeave={() => {
          if (headerHoverTimeoutRef.current) {
            clearTimeout(headerHoverTimeoutRef.current);
          }
          headerHoverTimeoutRef.current = setTimeout(() => {
            setHeaderHover({ type: null, index: -1, position: { x: 0, y: 0 } });
          }, 150);
        }}
      >
        {headerColElements}
      </Group>
    );
  }
  
  // Add context menu if present
  if (contextMenu) {
    const contextMenuElements = [];
    
    contextMenuElements.push(
      <Rect
        key="context-menu-bg"
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
    );
    
    contextMenuElements.push(
      <Text
        key="context-menu-text"
        x={contextMenu.x + 10}
        y={contextMenu.y + 12}
        text={`Remove ${contextMenu.type}`}
        fontSize={12}
        fontFamily={designSystem.typography.fontFamily.sans}
        fill={designSystem.colors.error[600]}
        onClick={() => handleRemoveRowColumn(contextMenu.type, contextMenu.index)}
      />
    );
    
    tableContentElements.push(
      <Group key="context-menu-group">
        {contextMenuElements}
      </Group>
    );
  }

  const tableContent = (
    <Group
      ref={ref}
      key={`${element.id}-${getTableDataKey(enhancedTableData)}`}
      id={element.id}
      x={element.x}
      y={element.y}
      draggable={isDraggable}
      onDragEnd={handleDragEnd}
      onMouseLeave={handleTableMouseLeave}
      opacity={editingCell ? 0.95 : 1.0}
    >
      {tableContentElements}
    </Group>
  );

  // Cell editing positioning is now handled by portal with real-time updates
  useEffect(() => {
    if (!editingCell || !stageRef?.current) {
      setCellEditorPosition(null);
      return;
    }

    // Calculate cell position and size
    const colWidth = enhancedTableData.columns?.[editingCell.col]?.width || 120;
    const rowHeight = enhancedTableData.rows?.[editingCell.row]?.height || 40;

    // Calculate cumulative position relative to table
    let cellX = 6; // Table padding offset
    for (let i = 0; i < editingCell.col; i++) {
      cellX += enhancedTableData.columns?.[i]?.width || 120;
    }

    let cellY = 6; // Table padding offset
    for (let i = 0; i < editingCell.row; i++) {
      cellY += enhancedTableData.rows?.[i]?.height || 40;
    }

    const updatePosition = () => {
      const stage = stageRef.current;
      if (!stage) return;

      // Get the table group by ID to get its absolute position
      const tableGroup = stage.findOne(`#${element.id}`);
      if (!tableGroup) return;

      const tablePos = tableGroup.getAbsolutePosition();
      const stageContainer = stage.container();
      if (!stageContainer) return;

      const containerRect = stageContainer.getBoundingClientRect();
      const scale = stage.scaleX(); // Assuming uniform scaling

      // Calculate absolute cell position on canvas
      const absoluteCellX = tablePos.x + cellX;
      const absoluteCellY = tablePos.y + cellY;

      // Convert to screen coordinates
      const screenX = containerRect.left + (absoluteCellX * scale) + stage.x();
      const screenY = containerRect.top + (absoluteCellY * scale) + stage.y();
      const screenWidth = Math.max(colWidth * scale, 80);
      const screenHeight = Math.max(rowHeight * scale, 30);

      setCellEditorPosition({
        left: Math.round(screenX),
        top: Math.round(screenY),
        width: Math.round(screenWidth),
        height: Math.round(screenHeight),
      });
    };

    // Initial position calculation
    updatePosition();

    // Listen for canvas transformations
    const stage = stageRef.current;
    const handleTransform = () => updatePosition();

    // Add event listeners for all transform events
    stage.on('transform', handleTransform);
    stage.on('dragmove', handleTransform);
    stage.on('wheel', handleTransform);
    stage.on('scalechange', handleTransform);

    // Also listen for window resize/scroll
    const handleWindowChange = () => updatePosition();
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange);

    // Cleanup function
    return () => {
      stage.off('transform', handleTransform);
      stage.off('dragmove', handleTransform);
      stage.off('wheel', handleTransform);
      stage.off('scalechange', handleTransform);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange);
    };
  }, [editingCell, element.id, enhancedTableData.columns, enhancedTableData.rows, stageRef]);

  // Separate effect to handle DOM portal rendering (must be outside of Konva tree)
  useEffect(() => {
    if (!editingCell || !cellEditorPosition) {
      return;
    }

    // Create the textarea element
    const textarea = document.createElement('textarea');
    textarea.autofocus = true;
    textarea.value = enhancedTableData.cells?.[editingCell.row]?.[editingCell.col]?.text || '';
    textarea.placeholder = 'Enter cell text...';

    // Apply styles
    Object.assign(textarea.style, {
      position: 'fixed',
      left: `${cellEditorPosition.left}px`,
      top: `${cellEditorPosition.top}px`,
      width: `${cellEditorPosition.width - 4}px`,
      height: `${cellEditorPosition.height - 4}px`,
      zIndex: '10000',
      border: '2px solid #3B82F6',
      borderRadius: '4px',
      padding: '6px',
      fontSize: `${Math.max(12, Math.min(16, cellEditorPosition.height * 0.35))}px`,
      fontFamily: designSystem.typography.fontFamily.sans,
      backgroundColor: 'white',
      resize: 'none',
      outline: 'none',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
      boxSizing: 'border-box',
      lineHeight: '1.4',
    });

    // Add event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleCellSave(textarea.value);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Tab navigates to next cell, Shift+Tab to previous
        handleCellSave(textarea.value, true, e.shiftKey);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCellCancel();
      }
    };

    const handleBlur = () => {
      // Small delay to allow for other interactions
      setTimeout(() => {
        if (document.activeElement !== textarea) {
          handleCellSave(textarea.value);
        }
      }, 100);
    };

    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('blur', handleBlur);

    // Append to document body
    document.body.appendChild(textarea);

    // Focus and select
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.select();
    });

    // Cleanup function
    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('blur', handleBlur);
      if (document.body.contains(textarea)) {
        document.body.removeChild(textarea);
      }
    };
  }, [editingCell, cellEditorPosition, enhancedTableData.cells, handleCellSave, handleCellCancel]);

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

  // Return only the Konva table content (no DOM portals in return)
  return tableContent;
});

EnhancedTableElement.displayName = 'EnhancedTableElement';

export default EnhancedTableElement;
