import React, { useState, useEffect, useRef } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, useKonvaCanvasStore } from '../../stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';
import TableCellEditor from './TableCellEditor';

interface EnhancedTableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (element: CanvasElement) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  isDragging?: boolean;
  stageRef?: React.RefObject<Konva.Stage | null>;
}

const EnhancedTableElement: React.FC<EnhancedTableElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDragStart,
  onDragEnd,
  stageRef,
}) => {
  // State for hover interactions and controls
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [boundaryHover, setBoundaryHover] = useState<{
    type: 'row' | 'column' | null;
    index: number;
    position: { x: number; y: number };
  }>({ type: null, index: -1, position: { x: 0, y: 0 } });
  const [headerHover, setHeaderHover] = useState<{
    type: 'row' | 'column' | null;
    index: number;
    position: { x: number; y: number };
  }>({ type: null, index: -1, position: { x: 0, y: 0 } });

  // Editing state
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCellPosition, setEditingCellPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'e' | 's' | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState<{ x: number; y: number } | null>(null);
  const [resizeStartSize, setResizeStartSize] = useState<{ width: number; height: number } | null>(null);

  // Hover timeout refs to prevent flicker
  const boundaryHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cellHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store methods
  const {
    addTableRow,
    addTableColumn,
    removeTableRow,
    removeTableColumn,
    updateTableCell,
    updateElement,
    sections,
  } = useKonvaCanvasStore();

  // Get enhanced table data from element
  const enhancedTableData = element.enhancedTableData;
  const tableRows = enhancedTableData?.rows || [];
  const tableColumns = enhancedTableData?.columns || [];

  // Calculate total dimensions
  const totalWidth = tableColumns.reduce((sum, col) => sum + col.width, 0);
  const totalHeight = tableRows.reduce((sum, row) => sum + row.height, 0);

  // Handle drag end
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onUpdate({
      x: node.x(),
      y: node.y()
    });
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  // Handle cell click
  const handleCellClick = (_rowIndex: number, _colIndex: number, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect(element);
  };

  // Handle cell double-click for editing
  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    if (!stageRef?.current) return;
    
    const stage = stageRef.current;
    const container = stage.container();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate cell position in canvas coordinates
    const cellX = tableColumns.slice(0, colIndex).reduce((sum, c) => sum + c.width, 0);
    const cellY = tableRows.slice(0, rowIndex).reduce((sum, r) => sum + r.height, 0);
    
    // Get absolute table position (accounting for sections)
    let tableCanvasPoint = { x: element.x || 0, y: element.y || 0 };
    
    if (element.sectionId && sections[element.sectionId]) {
      const section = sections[element.sectionId];
      tableCanvasPoint = {
        x: section.x + (element.x || 0),
        y: section.y + (element.y || 0)
      };
    }
    
    // Transform canvas coordinates to screen coordinates
    const stageTransform = stage.getAbsoluteTransform();
    const tableScreenPoint = stageTransform.point(tableCanvasPoint);
    const cellCanvasPoint = {
      x: tableCanvasPoint.x + cellX,
      y: tableCanvasPoint.y + cellY
    };
    const cellScreenPoint = stageTransform.point(cellCanvasPoint);
    
    // Calculate final position for the editor
    const stageScale = stage.scaleX();
    
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditingCellPosition({
      x: containerRect.left + cellScreenPoint.x,
      y: containerRect.top + cellScreenPoint.y,
      width: tableColumns[colIndex].width * stageScale,
      height: tableRows[rowIndex].height * stageScale
    });
  };

  // Handle text change from editor
  const handleTextChange = (newText: string) => {
    if (!editingCell) return;
    
    updateTableCell(element.id, editingCell.row, editingCell.col, {
      text: newText
    });
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
    e.evt.preventDefault();
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
  };

  // Handle resize with global mouse tracking
  useEffect(() => {
    if (isResizing && resizeHandle && resizeStartPos && resizeStartSize && stageRef?.current) {
      const stage = stageRef.current;
      
      const handleMouseMove = (e: MouseEvent) => {
        // Convert mouse position to stage coordinates
        const container = stage.container();
        const rect = container.getBoundingClientRect();
        const stagePointerPos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        
        const deltaX = stagePointerPos.x - resizeStartPos.x;
        const deltaY = stagePointerPos.y - resizeStartPos.y;

        let newWidth = resizeStartSize.width;
        let newHeight = resizeStartSize.height;

        if (resizeHandle === 'se' || resizeHandle === 'e') {
          newWidth = Math.max(200, resizeStartSize.width + deltaX);
        }
        if (resizeHandle === 'se' || resizeHandle === 's') {
          newHeight = Math.max(120, resizeStartSize.height + deltaY);
        }

        // Calculate scale ratios
        const widthRatio = newWidth / resizeStartSize.width;
        const heightRatio = newHeight / resizeStartSize.height;

        // Update table dimensions and column/row sizes proportionally
        if (enhancedTableData) {
          const updatedColumns = enhancedTableData.columns.map(col => ({
            ...col,
            width: Math.max(60, col.width * widthRatio)
          }));
          
          const updatedRows = enhancedTableData.rows.map(row => ({
            ...row,
            height: Math.max(30, row.height * heightRatio)
          }));
          
          // Update everything in one go to avoid partial updates
          updateElement(element.id, {
            enhancedTableData: {
              ...enhancedTableData,
              columns: updatedColumns,
              rows: updatedRows
            }
          });
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        setResizeHandle(null);
        setResizeStartPos(null);
        setResizeStartSize(null);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeHandle, resizeStartPos, resizeStartSize, enhancedTableData, element.id, updateElement, stageRef]);

  // Boundary detection with debounced clearing
  const handleTableMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isResizing) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const tableX = element.x || 0;
    const tableY = element.y || 0;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const stagePos = transform.point(pointerPos);
    const relativeX = stagePos.x - tableX;
    const relativeY = stagePos.y - tableY;

    // Clear previous timeout if exists
    if (boundaryHoverTimeoutRef.current) {
      clearTimeout(boundaryHoverTimeoutRef.current);
      boundaryHoverTimeoutRef.current = null;
    }

    // Check for row boundaries (horizontal grid lines)
    let foundRowBoundary = false;
    let currentY = 0;
    
    for (let i = 0; i <= tableRows.length; i++) {
      const boundaryY = currentY;
      const threshold = 15;
      
      if (Math.abs(relativeY - boundaryY) <= threshold && 
          relativeX >= -20 && relativeX <= totalWidth + 20) {
        setBoundaryHover({
          type: 'row',
          index: i,
          position: { x: tableX + totalWidth / 2, y: tableY + boundaryY }
        });
        foundRowBoundary = true;
        break;
      }
      
      if (i < tableRows.length) {
        currentY += tableRows[i].height;
      }
    }

    // Check for column boundaries (vertical grid lines)
    let foundColumnBoundary = false;
    let currentX = 0;
    
    if (!foundRowBoundary) {
      for (let i = 0; i <= tableColumns.length; i++) {
        const boundaryX = currentX;
        const threshold = 15;
        
        if (Math.abs(relativeX - boundaryX) <= threshold && 
            relativeY >= -20 && relativeY <= totalHeight + 20) {
          setBoundaryHover({
            type: 'column',
            index: i,
            position: { x: tableX + boundaryX, y: tableY + totalHeight / 2 }
          });
          foundColumnBoundary = true;
          break;
        }
        
        if (i < tableColumns.length) {
          currentX += tableColumns[i].width;
        }
      }
    }

    // Clear boundary hover with delay if no boundary found
    if (!foundRowBoundary && !foundColumnBoundary) {
      boundaryHoverTimeoutRef.current = setTimeout(() => {
        setBoundaryHover({ type: null, index: -1, position: { x: 0, y: 0 } });
      }, 100);
    }
  };

  // Handle table mouse leave with delay
  const handleTableMouseLeave = () => {
    // Clear all hovers with delay to prevent flicker
    boundaryHoverTimeoutRef.current = setTimeout(() => {
      setBoundaryHover({ type: null, index: -1, position: { x: 0, y: 0 } });
    }, 100);
    
    headerHoverTimeoutRef.current = setTimeout(() => {
      setHeaderHover({ type: null, index: -1, position: { x: 0, y: 0 } });
    }, 100);
    
    cellHoverTimeoutRef.current = setTimeout(() => {
      setHoveredCell(null);
    }, 100);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (boundaryHoverTimeoutRef.current) clearTimeout(boundaryHoverTimeoutRef.current);
      if (headerHoverTimeoutRef.current) clearTimeout(headerHoverTimeoutRef.current);
      if (cellHoverTimeoutRef.current) clearTimeout(cellHoverTimeoutRef.current);
    };
  }, []);

  // Handle header hover with debounce
  const handleHeaderMouseEnter = (type: 'row' | 'column', index: number, position: { x: number; y: number }) => {
    if (headerHoverTimeoutRef.current) {
      clearTimeout(headerHoverTimeoutRef.current);
      headerHoverTimeoutRef.current = null;
    }
    setHeaderHover({ type, index, position });
  };

  const handleHeaderMouseLeave = () => {
    headerHoverTimeoutRef.current = setTimeout(() => {
      setHeaderHover({ type: null, index: -1, position: { x: 0, y: 0 } });
    }, 100);
  };

  // Handle cell hover with debounce
  const handleCellMouseEnter = (row: number, col: number) => {
    if (cellHoverTimeoutRef.current) {
      clearTimeout(cellHoverTimeoutRef.current);
      cellHoverTimeoutRef.current = null;
    }
    setHoveredCell({ row, col });
  };

  const handleCellMouseLeave = () => {
    cellHoverTimeoutRef.current = setTimeout(() => {
      setHoveredCell(null);
    }, 100);
  };

  // Render table cells
  const renderTableCells = () => {
    return tableRows.map((row, rowIndex) =>
      tableColumns.map((col, colIndex) => {
        const cellData = enhancedTableData?.cells?.[rowIndex]?.[colIndex] || { text: '' };
        const cellX = tableColumns.slice(0, colIndex).reduce((sum, c) => sum + c.width, 0);
        const cellY = tableRows.slice(0, rowIndex).reduce((sum, r) => sum + r.height, 0);

        return (
          <Group key={`${rowIndex}-${colIndex}`} x={cellX} y={cellY}>
            {/* Cell rectangle */}
            <Rect
              key={`cell-${rowIndex}-${colIndex}`}
              x={0}
              y={0}
              width={col.width}
              height={row.height}
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
              width={col.width - 16}
              height={row.height - 16}
              text={cellData?.text || ''}
              fontSize={14}
              fontFamily={designSystem.typography.fontFamily.sans}
              fill={designSystem.colors.secondary[800]}
              align="left"
              verticalAlign="top"
              wrap="word"
              listening={false}
            />

            {/* Row header hover area for delete button */}
            {colIndex === 0 && (
              <Rect
                key={`row-header-${rowIndex}`}
                x={-40}
                y={-5}
                width={40}
                height={row.height + 10}
                fill="transparent"
                onMouseEnter={() => handleHeaderMouseEnter('row', rowIndex, { 
                  x: (element.x || 0) - 30, 
                  y: (element.y || 0) + tableRows.slice(0, rowIndex).reduce((sum, row) => sum + row.height, 0) + tableRows[rowIndex].height / 2
                })}
                onMouseLeave={handleHeaderMouseLeave}
              />
            )}

            {/* Column header hover area for delete button */}
            {rowIndex === 0 && (
              <Rect
                key={`col-header-${colIndex}`}
                x={-5}
                y={-40}
                width={col.width + 10}
                height={40}
                fill="transparent"
                onMouseEnter={() => handleHeaderMouseEnter('column', colIndex, { 
                  x: (element.x || 0) + tableColumns.slice(0, colIndex).reduce((sum, col) => sum + col.width, 0) + tableColumns[colIndex].width / 2,
                  y: (element.y || 0) - 30
                })}
                onMouseLeave={handleHeaderMouseLeave}
              />
            )}
          </Group>
        );
      })
    );
  };

  return (
    <>
      <Group
        x={element.x}
        y={element.y}
        draggable={!isResizing && !editingCell}
        onDragEnd={handleDragEnd}
        onDragStart={onDragStart}
        onMouseMove={handleTableMouseMove}
        onMouseLeave={handleTableMouseLeave}
      >
        {/* Table background */}
        <Rect
          x={0}
          y={0}
          width={totalWidth}
          height={totalHeight}
          fill="white"
          stroke={isSelected ? designSystem.colors.primary[500] : designSystem.colors.secondary[200]}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={8}
          shadowColor="rgba(0, 0, 0, 0.1)"
          shadowBlur={4}
          shadowOffset={{ x: 0, y: 2 }}
          shadowOpacity={0.1}
        />

        {/* Table cells */}
        {renderTableCells()}

        {/* Resize handles - only show when selected */}
        {isSelected && (
          <>
            {/* Bottom-right resize handle */}
            <Circle
              x={totalWidth}
              y={totalHeight}
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

            {/* Right resize handle */}
            <Circle
              x={totalWidth}
              y={totalHeight / 2}
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

            {/* Bottom resize handle */}
            <Circle
              x={totalWidth / 2}
              y={totalHeight}
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
          </>
        )}
      </Group>

      {/* Boundary add controls - rendered outside main group */}
      {boundaryHover.type === 'row' && (
        <Group>
          <Circle
            x={boundaryHover.position.x}
            y={boundaryHover.position.y}
            radius={12}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
            onClick={() => addTableRow(element.id, boundaryHover.index)}
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
            fontSize={16}
            fontFamily={designSystem.typography.fontFamily.sans}
            fill="white"
            align="center"
            verticalAlign="middle"
            offsetX={4}
            offsetY={8}
            listening={false}
          />
        </Group>
      )}

      {boundaryHover.type === 'column' && (
        <Group>
          <Circle
            x={boundaryHover.position.x}
            y={boundaryHover.position.y}
            radius={12}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
            onClick={() => addTableColumn(element.id, boundaryHover.index)}
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
            fontSize={16}
            fontFamily={designSystem.typography.fontFamily.sans}
            fill="white"
            align="center"
            verticalAlign="middle"
            offsetX={4}
            offsetY={8}
            listening={false}
          />
        </Group>
      )}

      {/* Header delete controls */}
      {headerHover.type === 'row' && tableRows.length > 1 && (
        <Group>
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
            fontFamily={designSystem.typography.fontFamily.sans}
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
        <Group>
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
            fontFamily={designSystem.typography.fontFamily.sans}
            fill="white"
            align="center"
            verticalAlign="middle"
            offsetX={4}
            offsetY={8}
            listening={false}
          />
        </Group>
      )}

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
};

export default EnhancedTableElement;