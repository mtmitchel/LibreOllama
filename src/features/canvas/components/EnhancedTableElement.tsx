import React, { useCallback, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, isTableElement, ElementId } from '../types/enhanced.types';
import { designSystem } from '../../../design-system/designSystem';
import { useUnifiedCanvasStore, canvasSelectors } from '../../../stores';

// Import extracted table functionality
import { getTableDataKey } from './table/tableUtils';
import { useTableCellEditing } from './table/useTableCellEditing';
import { useTableInteractions } from './table/useTableInteractions';

interface EnhancedTableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (element: CanvasElement) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  // ARCHITECTURAL FIX: Remove drag handler prop to centralize in CanvasEventHandler
  // onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void; // DISABLED per Friday Review
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const EnhancedTableElement = React.forwardRef<Konva.Group, EnhancedTableElementProps>(
  ({ element, isSelected, onSelect, onUpdate, /* onDragEnd, */ stageRef }, ref) => {
  
  // Type safety: Ensure we're working with a table element
  if (!isTableElement(element)) {
    console.error('🔧 [TABLE] Invalid element type passed to EnhancedTableElement:', element.type);
    return null;
  }
  
  // Type assertion for branded ID - table elements should always have ElementId
  const tableId = element.id as ElementId;

  // Get enhanced table data from element with null safety and type guard
  const enhancedTableData = isTableElement(element) ? element.enhancedTableData : undefined;

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
  }  // Store methods - using unified store
  const updateTableCell = useUnifiedCanvasStore(state => state.updateTableCell);
  const removeTableRow = () => {}; // TODO: Implement in unified store
  const removeTableColumn = () => {}; // TODO: Implement in unified store
  const selectedTool = useUnifiedCanvasStore(canvasSelectors.selectedTool);

  // Use extracted table functionality hooks
  const cellEditing = useTableCellEditing({
    tableId,
    tableRows,
    tableColumns,
    updateTableCell,
    removeTableRow,
    removeTableColumn
  });

  const interactions = useTableInteractions();

  // Calculate total dimensions
  const totalWidth = tableColumns.reduce((sum, col) => sum + (col?.width || 100), 0);
  const totalHeight = tableRows.reduce((sum, row) => sum + (row?.height || 40), 0);

  // ARCHITECTURAL FIX: Remove internal drag handling - now handled by UnifiedEventHandler
  // The centralized event system in UnifiedEventHandler will handle all drag operations

  // Render table cells using the interaction handlers
  const renderCells = () => {
    const allCells = [];
    
    for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
      const row = tableRows[rowIndex];
      
      for (let colIndex = 0; colIndex < tableColumns.length; colIndex++) {
        const col = tableColumns[colIndex];
        const cellData = enhancedTableData?.cells?.[rowIndex]?.[colIndex] || { text: '' };
        const cellText = cellData?.text || '';

        allCells.push(
          <Group
            key={`cell-group-${rowIndex}-${colIndex}`}
            x={tableColumns.slice(0, colIndex).reduce((sum, c) => sum + (c?.width || 100), 0) + 6}
            y={tableRows.slice(0, rowIndex).reduce((sum, r) => sum + (r?.height || 40), 0) + 6}
          >
            <Rect
              x={0}
              y={0}
              width={col?.width || 100}
              height={row?.height || 40}
              fill={
                cellEditing.editingCell?.row === rowIndex && cellEditing.editingCell?.col === colIndex
                  ? '#F0F8FF'
                  : interactions.hoveredCell?.row === rowIndex && interactions.hoveredCell?.col === colIndex
                  ? '#F8FAFC'
                  : rowIndex === 0 || colIndex === 0
                  ? '#FAFBFC'
                  : 'white'
              }
              stroke={designSystem.colors.secondary[200]}
              strokeWidth={0.5}
              onMouseEnter={() => interactions.handleCellMouseEnter(rowIndex, colIndex)}
              onMouseLeave={interactions.handleCellMouseLeave}
              onClick={(e) => {
                e.cancelBubble = true;
                onSelect(element);
              }}
              onDblClick={() => cellEditing.handleCellDoubleClick(rowIndex, colIndex)}
              onContextMenu={(e) => interactions.handleCellRightClick(rowIndex, colIndex, e)}
            />
            
            <Text
              x={8}
              y={8}
              text={cellText}
              fontSize={14}
              fontFamily={designSystem.typography.fontFamily.sans}
              fill={designSystem.colors.secondary[800]}
              width={(col?.width || 100) - 16}
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

  // Determine if table should be draggable
  const isDraggable = (selectedTool === 'select' || selectedTool === 'table') && 
                     !cellEditing.editingCell && 
                     !interactions.boundaryHover && 
                     !interactions.headerHover.type;

  // Build table content
  const tableContentElements = [];
  
  // Add background rect
  tableContentElements.push(
    <Rect
      key="background"
      x={6}
      y={6}
      width={totalWidth}
      height={totalHeight}
      fill="white"
      stroke={isSelected ? designSystem.colors.primary[400] : designSystem.colors.secondary[300]}
      strokeWidth={isSelected ? 2 : 1}
      cornerRadius={8}
      shadowColor="rgba(0, 0, 0, 0.08)"
      shadowBlur={12}
      shadowOffset={{ x: 0, y: 4 }}
    />
  );
  
  // Add cells
  tableContentElements.push(...renderCells());

  // Handle cell editing positioning with DOM portal
  useEffect(() => {
    if (!cellEditing.editingCell || !stageRef?.current) {
      return;
    }

    // Calculate cell position and size
    const colWidth = enhancedTableData.columns?.[cellEditing.editingCell.col]?.width || 120;
    const rowHeight = enhancedTableData.rows?.[cellEditing.editingCell.row]?.height || 40;

    // Calculate cumulative position relative to table
    let cellX = 6; // Table padding offset
    for (let i = 0; i < cellEditing.editingCell.col; i++) {
      cellX += enhancedTableData.columns?.[i]?.width || 120;
    }

    let cellY = 6; // Table padding offset
    for (let i = 0; i < cellEditing.editingCell.row; i++) {
      cellY += enhancedTableData.rows?.[i]?.height || 40;
    }

    const stage = stageRef.current;
    const tableGroup = stage.findOne(`#${element.id}`);
    if (!tableGroup) return;

    const tablePos = tableGroup.getAbsolutePosition();
    const stageContainer = stage.container();
    if (!stageContainer) return;

    const containerRect = stageContainer.getBoundingClientRect();
    const scale = stage.scaleX();

    // Calculate absolute cell position on canvas
    const absoluteCellX = tablePos.x + cellX;
    const absoluteCellY = tablePos.y + cellY;

    // Convert to screen coordinates
    const screenX = containerRect.left + (absoluteCellX * scale) + stage.x();
    const screenY = containerRect.top + (absoluteCellY * scale) + stage.y();
    const screenWidth = Math.max(colWidth * scale, 80);
    const screenHeight = Math.max(rowHeight * scale, 30);

    // Create and manage textarea for cell editing
    const textarea = document.createElement('textarea');
    textarea.autofocus = true;
    textarea.value = enhancedTableData.cells?.[cellEditing.editingCell.row]?.[cellEditing.editingCell.col]?.text || '';
    textarea.placeholder = 'Enter cell text...';

    // Apply styles
    Object.assign(textarea.style, {
      position: 'fixed',
      left: `${screenX}px`,
      top: `${screenY}px`,
      width: `${screenWidth - 4}px`,
      height: `${screenHeight - 4}px`,
      zIndex: '10000',
      border: '2px solid #3B82F6',
      borderRadius: '4px',
      padding: '6px',
      fontSize: `${Math.max(12, Math.min(16, screenHeight * 0.35))}px`,
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
        cellEditing.handleCellSave(textarea.value);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        cellEditing.handleCellSave(textarea.value, true, e.shiftKey);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cellEditing.handleCellCancel();
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (document.activeElement !== textarea) {
          cellEditing.handleCellSave(textarea.value);
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
  }, [cellEditing.editingCell, element.id, enhancedTableData, stageRef, cellEditing.handleCellSave, cellEditing.handleCellCancel]);

  return (
    <Group
      ref={ref}
      key={`${element.id}-${getTableDataKey(enhancedTableData)}`}
      id={element.id}
      x={element.x}
      y={element.y}
      draggable={isDraggable}
      onMouseLeave={interactions.clearAllHoverStates}
      opacity={cellEditing.editingCell ? 0.95 : 1.0}
    >
      {tableContentElements}
    </Group>
  );
});

EnhancedTableElement.displayName = 'EnhancedTableElement';

export default EnhancedTableElement;
