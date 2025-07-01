import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Group, Rect, Text, Line, Circle } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, isTableElement, ElementId } from '../types/enhanced.types';
import { designSystem } from '../../../core/design-system';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';

// Import extracted table functionality
import { getTableDataKey } from '../utils/tableUtils';
import { useTableCellEditing } from '../hooks/useTableCellEditing';
import { useTableInteractions } from '../hooks/useTableInteractions';

interface TableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (element: CanvasElement) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

interface ContextMenu {
  show: boolean;
  x: number;
  y: number;
  type: 'row' | 'column';
  index: number;
}

export const TableElement = React.forwardRef<Konva.Group, TableElementProps>(
  ({ element, isSelected, onSelect, onUpdate, stageRef }, ref) => {
  const dragUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Type safety: Ensure we're working with a table element
  if (!isTableElement(element)) {
    console.error('🔧 [TABLE] Invalid element type passed to TableElement:', element.type);
    return null;
  }
  
  // Type assertion for branded ID
  const tableId = element.id as ElementId;

  // Local state for enhanced functionality
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu>({ show: false, x: 0, y: 0, type: 'row', index: 0 });
  const [resizing, setResizing] = useState<{ type: 'row' | 'column'; index: number; startPos: number } | null>(null);

  // Store methods
  const updateTableCell = useUnifiedCanvasStore(state => state.updateTableCell);
  const addTableRow = useUnifiedCanvasStore(state => state.addTableRow);
  const removeTableRow = useUnifiedCanvasStore(state => state.removeTableRow);
  const addTableColumn = useUnifiedCanvasStore(state => state.addTableColumn);
  const removeTableColumn = useUnifiedCanvasStore(state => state.removeTableColumn);
  const resizeTableCell = useUnifiedCanvasStore(state => state.resizeTableCell);
  const selectedTool = useUnifiedCanvasStore(canvasSelectors.selectedTool);

  // Get enhanced table data from element with safety checks
  const enhancedTableData = element.enhancedTableData;

  // Early return if no table data
  if (!enhancedTableData || !enhancedTableData.rows || !enhancedTableData.columns) {
    console.warn('🔧 [TABLE] No valid enhancedTableData found for table:', element.id);
    return null;
  }

  const tableRows = enhancedTableData.rows;
  const tableColumns = enhancedTableData.columns;
  const tableCells = enhancedTableData.cells || [];

  // Calculate total dimensions
  const totalWidth = tableColumns.reduce((sum, col) => sum + (col?.width || 120), 0);
  const totalHeight = tableRows.reduce((sum, row) => sum + (row?.height || 40), 0);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragUpdateTimeoutRef.current) {
        clearTimeout(dragUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Close context menu on clicks outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ show: false, x: 0, y: 0, type: 'row', index: 0 });
    };

    if (contextMenu.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.show]);

  // Enhanced cell editing with DOM textarea
  useEffect(() => {
    console.log('🔧 [Table] Cell editing useEffect triggered:', { editingCell, stageRef: !!stageRef?.current });
    
    if (!editingCell || !stageRef?.current) {
      console.log('🔧 [Table] Cell editing early return:', { editingCell, stageRef: !!stageRef?.current });
      return;
    }

    console.log('🔧 [Table] Creating cell editor for:', editingCell);

    const stage = stageRef.current;
    const container = stage.container();
    if (!container) {
      console.log('🔧 [Table] No container found');
      return;
    }

    // Calculate cell position and size
    const cellX = tableColumns.slice(0, editingCell.col).reduce((sum, c) => sum + (c?.width || 120), 0);
    const cellY = tableRows.slice(0, editingCell.row).reduce((sum, r) => sum + (r?.height || 40), 0);
    const cellWidth = tableColumns[editingCell.col]?.width || 120;
    const cellHeight = tableRows[editingCell.row]?.height || 40;

    console.log('🔧 [Table] Cell dimensions:', { cellX, cellY, cellWidth, cellHeight });

    // Get stage transform
    const containerRect = container.getBoundingClientRect();
    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();

    // Calculate absolute position on screen
    const absoluteX = (element.x + cellX) * scale + stageX + containerRect.left;
    const absoluteY = (element.y + cellY) * scale + stageY + containerRect.top;
    const scaledWidth = cellWidth * scale;
    const scaledHeight = cellHeight * scale;

    console.log('🔧 [Table] Textarea position:', { absoluteX, absoluteY, scaledWidth, scaledHeight });

    // Create textarea element
    const textarea = document.createElement('textarea');
    textarea.value = tableCells[editingCell.row]?.[editingCell.col]?.text || '';
    textarea.placeholder = 'Enter text...';

    console.log('🔧 [Table] Created textarea with value:', textarea.value);

    // Style textarea
    Object.assign(textarea.style, {
      position: 'fixed',
      left: `${absoluteX + 4}px`,
      top: `${absoluteY + 4}px`,
      width: `${scaledWidth - 8}px`,
      height: `${scaledHeight - 8}px`,
      padding: '8px',
      border: '2px solid #3B82F6',
      borderRadius: '4px',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      resize: 'none',
      outline: 'none',
      backgroundColor: 'white',
      zIndex: '2147483647',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    });

    // Event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('🔧 [Table] Textarea key:', e.key);
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        updateTableCell(tableId, editingCell.row, editingCell.col, textarea.value);
        setEditingCell(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Save current cell
        updateTableCell(tableId, editingCell.row, editingCell.col, textarea.value);
        
        // Navigate to next cell
        const { row, col } = editingCell;
        let nextRow = row;
        let nextCol = col;
        
        if (e.shiftKey) {
          nextCol = col > 0 ? col - 1 : (row > 0 ? tableColumns.length - 1 : col);
          nextRow = col > 0 ? row : (row > 0 ? row - 1 : row);
        } else {
          nextCol = col < tableColumns.length - 1 ? col + 1 : 0;
          nextRow = col < tableColumns.length - 1 ? row : Math.min(row + 1, tableRows.length - 1);
        }
        
        if (nextRow < tableRows.length && nextCol < tableColumns.length) {
          setEditingCell({ row: nextRow, col: nextCol });
        } else {
          setEditingCell(null);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditingCell(null);
      }
    };

    const handleBlur = () => {
      console.log('🔧 [Table] Textarea blur');
      setTimeout(() => {
        if (document.activeElement !== textarea) {
          updateTableCell(tableId, editingCell.row, editingCell.col, textarea.value);
          setEditingCell(null);
        }
      }, 100);
    };

    // Add event listeners
    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('blur', handleBlur);

    // Add to DOM
    document.body.appendChild(textarea);
    console.log('🔧 [Table] Textarea added to DOM');

    // Focus and select
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.select();
      console.log('🔧 [Table] Textarea focused and selected');
    });

    // Cleanup
    return () => {
      console.log('🔧 [Table] Cleaning up textarea');
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('blur', handleBlur);
      if (document.body.contains(textarea)) {
        document.body.removeChild(textarea);
      }
    };
  }, [editingCell, element.x, element.y, tableColumns, tableRows, tableCells, stageRef, updateTableCell, tableId]);

  // Context menu management
  useEffect(() => {
    if (!contextMenu.show) return;

    console.log('🔧 [Table] Creating context menu:', contextMenu);

    const menuDiv = document.createElement('div');
    Object.assign(menuDiv.style, {
      position: 'fixed',
      left: `${contextMenu.x}px`,
      top: `${contextMenu.y}px`,
      backgroundColor: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: '4px',
      minWidth: '160px',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      zIndex: '2147483646'
    });

    const createMenuItem = (text: string, action: () => void, dangerous = false) => {
      const item = document.createElement('button');
      item.textContent = text;
      Object.assign(item.style, {
        width: '100%',
        padding: '8px 12px',
        textAlign: 'left',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        borderRadius: '4px',
        color: dangerous ? '#DC2626' : '#374151'
      });

      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = dangerous ? '#FEF2F2' : '#F3F4F6';
      });
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'transparent';
      });
      item.addEventListener('click', () => {
        action();
        setContextMenu({ show: false, x: 0, y: 0, type: 'row', index: 0 });
      });

      return item;
    };

    // Add menu items based on type
    if (contextMenu.type === 'row') {
      menuDiv.appendChild(createMenuItem('Add row above', () => addTableRow(tableId, contextMenu.index)));
      menuDiv.appendChild(createMenuItem('Add row below', () => addTableRow(tableId, contextMenu.index + 1)));
      if (tableRows.length > 2) {
        menuDiv.appendChild(createMenuItem('Delete row', () => removeTableRow(tableId, contextMenu.index), true));
      }
    } else {
      menuDiv.appendChild(createMenuItem('Add column left', () => addTableColumn(tableId, contextMenu.index)));
      menuDiv.appendChild(createMenuItem('Add column right', () => addTableColumn(tableId, contextMenu.index + 1)));
      if (tableColumns.length > 2) {
        menuDiv.appendChild(createMenuItem('Delete column', () => removeTableColumn(tableId, contextMenu.index), true));
      }
    }

    document.body.appendChild(menuDiv);

    const handleClickOutside = (e: MouseEvent) => {
      if (!menuDiv.contains(e.target as Node)) {
        setContextMenu({ show: false, x: 0, y: 0, type: 'row', index: 0 });
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (document.body.contains(menuDiv)) {
        document.body.removeChild(menuDiv);
      }
    };
  }, [contextMenu, addTableRow, removeTableRow, addTableColumn, removeTableColumn, tableId, tableRows.length, tableColumns.length]);

  // Cell editing handlers
  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    console.log('🔧 [Table] Cell double-clicked:', { row, col });
    console.log('🔧 [Table] Setting editingCell state to:', { row, col });
    setEditingCell({ row, col });
    console.log('🔧 [Table] editingCell state updated');
  }, []);

  // Context menu handlers
  const handleRowRightClick = useCallback((rowIndex: number, e: Konva.KonvaEventObject<MouseEvent>) => {
    console.log('🔧 [Table] Row right-clicked:', rowIndex);
    e.cancelBubble = true;
    e.evt.preventDefault();
    
    setContextMenu({
      show: true,
      x: e.evt.clientX,
      y: e.evt.clientY,
      type: 'row',
      index: rowIndex
    });
  }, []);

  const handleColumnRightClick = useCallback((colIndex: number, e: Konva.KonvaEventObject<MouseEvent>) => {
    console.log('🔧 [Table] Column right-clicked:', colIndex);
    e.cancelBubble = true;
    e.evt.preventDefault();
    
    setContextMenu({
      show: true,
      x: e.evt.clientX,
      y: e.evt.clientY,
      type: 'column',
      index: colIndex
    });
  }, []);

  // Render table cells
  const renderCells = () => {
    const allCells = [];
    
    for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
      const row = tableRows[rowIndex];
      
      for (let colIndex = 0; colIndex < tableColumns.length; colIndex++) {
        const col = tableColumns[colIndex];
        const cellData = tableCells[rowIndex]?.[colIndex] || { content: '', text: '' };
        const cellText = cellData?.text || cellData?.content || '';

        // Calculate cell position
        const cellX = tableColumns.slice(0, colIndex).reduce((sum, c) => sum + (c?.width || 120), 0);
        const cellY = tableRows.slice(0, rowIndex).reduce((sum, r) => sum + (r?.height || 40), 0);

        const isHeader = rowIndex === 0 || colIndex === 0;
        const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
        const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;

        allCells.push(
          <Group
            key={`cell-group-${rowIndex}-${colIndex}`}
            x={cellX}
            y={cellY}
          >
            <Rect
              x={0}
              y={0}
              width={col?.width || 120}
              height={row?.height || 40}
              fill={isEditing ? '#EFF6FF' : isHovered ? '#F8FAFC' : (isHeader ? '#F1F5F9' : 'white')}
              stroke={isSelected ? designSystem.colors.primary[400] : '#E2E8F0'}
              strokeWidth={isSelected ? 1.5 : 0.5}
              onMouseEnter={() => {
                console.log('🔧 [Table] Cell hover enter:', { row: rowIndex, col: colIndex });
                setHoveredCell({ row: rowIndex, col: colIndex });
              }}
              onMouseLeave={() => {
                console.log('🔧 [Table] Cell hover leave:', { row: rowIndex, col: colIndex });
                setHoveredCell(null);
              }}
              onClick={(e) => {
                console.log('🔧 [Table] Cell clicked:', { row: rowIndex, col: colIndex });
                e.cancelBubble = true;
                onSelect(element);
              }}
              onDblClick={(e) => {
                console.log('🔧 [Table] Cell double-clicked:', { row: rowIndex, col: colIndex });
                e.cancelBubble = true;
                handleCellDoubleClick(rowIndex, colIndex);
              }}
              onContextMenu={(e) => {
                console.log('🔧 [Table] Cell right-clicked:', { row: rowIndex, col: colIndex, isHeader });
                e.cancelBubble = true;
                e.evt.preventDefault();
                
                // Only show context menu for header cells
                if (rowIndex === 0 && colIndex > 0) {
                  // Column header
                  handleColumnRightClick(colIndex, e);
                } else if (colIndex === 0 && rowIndex > 0) {
                  // Row header
                  handleRowRightClick(rowIndex, e);
                }
              }}
            />
            
            <Text
              x={8}
              y={8}
              text={cellText}
              fontSize={cellData?.fontSize || 14}
              fontFamily={cellData?.fontFamily || 'Inter, sans-serif'}
              fontWeight={isHeader ? 'bold' : 'normal'}
              fill={cellData?.textColor || '#1F2937'}
              width={(col?.width || 120) - 16}
              height={(row?.height || 40) - 16}
              verticalAlign="middle"
              ellipsis={true}
              listening={false}
            />
          </Group>
        );
      }
    }
    
    return allCells;
  };

  // Render resize handles for selected table
  const renderResizeHandles = () => {
    if (!isSelected) return [];
    
    const handles = [];
    
    // Column resize handles - positioned at column boundaries
    let accumulatedWidth = 0;
    for (let i = 0; i < tableColumns.length - 1; i++) {
      accumulatedWidth += tableColumns[i]?.width || 120;
      handles.push(
        <Circle
          key={`col-handle-${i}`}
          x={accumulatedWidth}
          y={totalHeight / 2}
          radius={6}
          fill="#3B82F6"
          stroke="white"
          strokeWidth={2}
          draggable
          dragBoundFunc={(pos) => {
            // Constrain to horizontal movement only
            return {
              x: Math.max(60, Math.min(pos.x, totalWidth - 60)), // Min/max column widths
              y: totalHeight / 2
            };
          }}
          onDragStart={() => {
            console.log('🔧 [Table] Started dragging column handle:', i);
          }}
          onDragMove={(e) => {
            const node = e.target;
            const newX = node.x();
            
            // Calculate new width based on handle position
            const columnStartX = tableColumns.slice(0, i).reduce((sum, c) => sum + (c?.width || 120), 0);
            const newWidth = Math.max(60, newX - columnStartX);
            
            console.log('🔧 [Table] Resizing column:', { column: i, newWidth, handleX: newX });
            
            // Update the column width in real-time
            resizeTableCell(tableId, 0, i, newWidth, undefined);
          }}
          onDragEnd={() => {
            console.log('🔧 [Table] Finished dragging column handle:', i);
          }}
        />
      );
    }
    
    // Row resize handles - positioned at row boundaries
    let accumulatedHeight = 0;
    for (let i = 0; i < tableRows.length - 1; i++) {
      accumulatedHeight += tableRows[i]?.height || 40;
      handles.push(
        <Circle
          key={`row-handle-${i}`}
          x={totalWidth / 2}
          y={accumulatedHeight}
          radius={6}
          fill="#3B82F6"
          stroke="white"
          strokeWidth={2}
          draggable
          dragBoundFunc={(pos) => {
            // Constrain to vertical movement only
            return {
              x: totalWidth / 2,
              y: Math.max(30, Math.min(pos.y, totalHeight - 30)) // Min/max row heights
            };
          }}
          onDragStart={() => {
            console.log('🔧 [Table] Started dragging row handle:', i);
          }}
          onDragMove={(e) => {
            const node = e.target;
            const newY = node.y();
            
            // Calculate new height based on handle position
            const rowStartY = tableRows.slice(0, i).reduce((sum, r) => sum + (r?.height || 40), 0);
            const newHeight = Math.max(30, newY - rowStartY);
            
            console.log('🔧 [Table] Resizing row:', { row: i, newHeight, handleY: newY });
            
            // Update the row height in real-time
            resizeTableCell(tableId, i, 0, undefined, newHeight);
          }}
          onDragEnd={() => {
            console.log('🔧 [Table] Finished dragging row handle:', i);
          }}
        />
      );
    }
    
    return handles;
  };

  return (
    <Group
      ref={ref}
      id={element.id}
      x={element.x}
      y={element.y}
      draggable
      onDragStart={(e) => {
        console.log('🔧 [Table] Drag start:', { x: element.x, y: element.y });
        // Prevent event bubbling
        e.cancelBubble = true;
      }}
      onDragMove={(e) => {
        // Update position in real-time
        const node = e.target;
        const newX = node.x();
        const newY = node.y();
        
        console.log('🔧 [Table] Dragging to:', { x: newX, y: newY });
        
        // Throttle updates for performance
        if (dragUpdateTimeoutRef.current) {
          clearTimeout(dragUpdateTimeoutRef.current);
        }
        
        dragUpdateTimeoutRef.current = setTimeout(() => {
          onUpdate({ x: newX, y: newY });
        }, 16); // ~60fps
      }}
      onDragEnd={(e) => {
        const node = e.target;
        const newX = node.x();
        const newY = node.y();
        
        console.log('🔧 [Table] Drag end:', { x: newX, y: newY });
        
        // Clear any pending updates
        if (dragUpdateTimeoutRef.current) {
          clearTimeout(dragUpdateTimeoutRef.current);
          dragUpdateTimeoutRef.current = null;
        }
        
        // Final position update
        onUpdate({ x: newX, y: newY });
        e.cancelBubble = true;
      }}
      onClick={(e) => {
        console.log('🔧 [Table] Table clicked for selection');
        e.cancelBubble = true;
        onSelect(element);
      }}
      onMouseLeave={() => setHoveredCell(null)}
      opacity={editingCell ? 0.95 : 1.0}
    >
      {/* Table Background */}
      <Rect
        x={0}
        y={0}
        width={totalWidth}
        height={totalHeight}
        fill="white"
        stroke={isSelected ? designSystem.colors.primary[400] : '#D1D5DB'}
        strokeWidth={isSelected ? 2 : 1}
        shadowColor="rgba(0, 0, 0, 0.1)"
        shadowBlur={8}
        shadowOffset={{ x: 0, y: 2 }}
        listening={false}
      />

      {/* Render all cells */}
      {renderCells()}

      {/* Render resize handles if selected */}
      {renderResizeHandles()}
    </Group>
  );
});

TableElement.displayName = 'TableElement';

export default TableElement;