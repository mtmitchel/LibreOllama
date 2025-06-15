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
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  stageRef?: React.RefObject<Konva.Stage>;
}

const EnhancedTableElement: React.FC<EnhancedTableElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
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
  } = useKonvaCanvasStore();

  // Get enhanced table data from element
  const enhancedTableData = element.enhancedTableData;
  const tableRows = enhancedTableData?.rows || [];
  const tableColumns = enhancedTableData?.columns || [];

  // Calculate total dimensions
  const totalWidth = tableColumns.reduce((sum, col) => sum + col.width, 0);
  const totalHeight = tableRows.reduce((sum, row) => sum + row.height, 0);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (boundaryHoverTimeoutRef.current) clearTimeout(boundaryHoverTimeoutRef.current);
      if (headerHoverTimeoutRef.current) clearTimeout(headerHoverTimeoutRef.current);
      if (cellHoverTimeoutRef.current) clearTimeout(cellHoverTimeoutRef.current);
    };
  }, []);

  // Handle drag end
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onUpdate({
      x: node.x(),
      y: node.y()
    });
  };

  // Handle cell click
  const handleCellClick = (_rowIndex: number, _colIndex: number, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect(element);
  };

  // Handle cell double-click for editing
  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    if (!stageRef?.current) {
      // Fallback to old behavior if no stageRef
      const cellX = tableColumns.slice(0, colIndex).reduce((sum, c) => sum + c.width, 0);
      const cellY = tableRows.slice(0, rowIndex).reduce((sum, r) => sum + r.height, 0);
      
      setEditingCell({ row: rowIndex, col: colIndex });
      setEditingCellPosition({
        x: (element.x || 0) + cellX,
        y: (element.y || 0) + cellY,
        width: tableColumns[colIndex].width,
        height: tableRows[rowIndex].height
      });
      return;
    }

    // Calculate cell position with stage transformations
    const stage = stageRef.current;
    const container = stage.container();
    const containerRect = container.getBoundingClientRect();
    
    const cellX = tableColumns.slice(0, colIndex).reduce((sum, c) => sum + c.width, 0);
    const cellY = tableRows.slice(0, rowIndex).reduce((sum, r) => sum + r.height, 0);
    
    // Get stage transformation
    const stageTransform = stage.getAbsoluteTransform();
    const stageScale = stage.scaleX();
    
    // Convert cell position to screen coordinates
    const cellCanvasPoint = {
      x: (element.x || 0) + cellX,
      y: (element.y || 0) + cellY
    };
    const cellScreenPoint = stageTransform.point(cellCanvasPoint);
    
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

  // Handle resize with throttling
  const resizeUpdateRef = useRef<{ width: number; height: number } | null>(null);
  const resizeThrottleRef = useRef<NodeJS.Timeout | null>(null);

  const handleResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, handle: 'se' | 'e' | 's') => {
    e.evt.preventDefault();
    setIsResizing(true);
    setResizeHandle(handle);
    
    const stage = e.target.getStage();
    if (stage) {
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        setResizeStartPos({ x: pointerPos.x, y: pointerPos.y });
        setResizeStartSize({ width: totalWidth, height: totalHeight });
      }
    }
  };

  const handleResizeEnd = () => {
    // Apply final resize update if any pending
    if (resizeUpdateRef.current && enhancedTableData) {
      const { width: newWidth, height: newHeight } = resizeUpdateRef.current;
      
      // Update column widths proportionally if width changed
      if (newWidth !== resizeStartSize?.width) {
        const widthRatio = newWidth / (resizeStartSize?.width || totalWidth);
        const updatedColumns = enhancedTableData.columns.map(col => ({
          ...col,
          width: Math.max(60, col.width * widthRatio)
        }));
        
        updateElement(element.id, {
          enhancedTableData: {
            ...enhancedTableData,
            columns: updatedColumns
          }
        });
      }

      // Update row heights proportionally if height changed
      if (newHeight !== resizeStartSize?.height) {
        const heightRatio = newHeight / (resizeStartSize?.height || totalHeight);
        const updatedRows = enhancedTableData.rows.map(row => ({
          ...row,
          height: Math.max(30, row.height * heightRatio)
        }));
        
        updateElement(element.id, {
          enhancedTableData: {
            ...enhancedTableData,
            rows: updatedRows
          }
        });
      }
    }

    setIsResizing(false);
    setResizeHandle(null);
    setResizeStartPos(null);
    setResizeStartSize(null);
    resizeUpdateRef.current = null;
    if (resizeThrottleRef.current) {
      clearTimeout(resizeThrottleRef.current);
      resizeThrottleRef.current = null;
    }
  };

  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => {
        if (!resizeHandle || !resizeStartPos || !resizeStartSize) return;

        const deltaX = e.clientX - resizeStartPos.x;
        const deltaY = e.clientY - resizeStartPos.y;

        let newWidth = resizeStartSize.width;
        let newHeight = resizeStartSize.height;

        if (resizeHandle === 'se' || resizeHandle === 'e') {
          newWidth = Math.max(200, resizeStartSize.width + deltaX);
        }
        if (resizeHandle === 'se' || resizeHandle === 's') {
          newHeight = Math.max(120, resizeStartSize.height + deltaY);
        }

        // Store the resize update
        resizeUpdateRef.current = { width: newWidth, height: newHeight };

        // Update dimensions immediately for visual feedback
        updateElement(element.id, {
          width: newWidth,
          height: newHeight
        });

        // Throttle the column/row updates
        if (resizeThrottleRef.current) {
          clearTimeout(resizeThrottleRef.current);
        }
        resizeThrottleRef.current = setTimeout(() => {
          if (resizeUpdateRef.current && enhancedTableData) {
            const { width: finalWidth, height: finalHeight } = resizeUpdateRef.current;
            
            const updates: any = {};
            
            // Update column widths proportionally if width changed
            if (finalWidth !== resizeStartSize.width) {
              const widthRatio = finalWidth / resizeStartSize.width;
              updates.columns = enhancedTableData.columns.map(col => ({
                ...col,
                width: Math.max(60, col.width * widthRatio)
              }));
            }

            // Update row heights proportionally if height changed
            if (finalHeight !== resizeStartSize.height) {
              const heightRatio = finalHeight / resizeStartSize.height;
              updates.rows = enhancedTableData.rows.map(row => ({
                ...row,
                height: Math.max(30, row.height * heightRatio)
              }));
            }

            if (updates.columns || updates.rows) {
              updateElement(element.id, {
                enhancedTableData: {
                  ...enhancedTableData,
                  ...updates
                }
              });
            }
          }
        }, 100); // Throttle updates to every 100ms
      };

      const handleMouseUp = () => {
        handleResizeEnd();
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeHandle, resizeStartPos, resizeStartSize, enhancedTableData, element.id, updateElement]);

  // Enhanced boundary detection with debouncing
  const handleTableMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isResizing) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const tableX = element.x || 0;
    const tableY = element.y || 0;
    const relativeX = pointerPos.x - tableX;
    const relativeY = pointerPos.y - tableY;

    // Check for row boundaries (horizontal grid lines)
    let foundRowBoundary = false;
    let currentY = 0;
    
    for (let i = 0; i <= tableRows.length; i++) {
      const boundaryY = currentY;
      const threshold = 15; // Larger threshold for easier interaction
      
      if (Math.abs(relativeY - boundaryY) <= threshold && 
          relativeX >= -20 && relativeX <= totalWidth + 20) { // Extended hover area
        foundRowBoundary = true;
        
        // Clear any pending timeout
        if (boundaryHoverTimeoutRef.current) {
          clearTimeout(boundaryHoverTimeoutRef.current);
          boundaryHoverTimeoutRef.current = null;
        }
        
        setBoundaryHover({
          type: 'row',
          index: i,
          position: { x: tableX + totalWidth / 2, y: tableY + boundaryY }
        });
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
        const threshold = 15; // Larger threshold for easier interaction
        
        if (Math.abs(relativeX - boundaryX) <= threshold && 
            relativeY >= -20 && relativeY <= totalHeight + 20) { // Extended hover area
          foundColumnBoundary = true;
          
          // Clear any pending timeout
          if (boundaryHoverTimeoutRef.current) {
            clearTimeout(boundaryHoverTimeoutRef.current);
            boundaryHoverTimeoutRef.current = null;
          }
          
          setBoundaryHover({
            type: 'column',
            index: i,
            position: { x: tableX + boundaryX, y: tableY + totalHeight / 2 }
          });
          break;
        }
        
        if (i < tableColumns.length) {
          currentX += tableColumns[i].width;
        }
      }
    }

    // Clear boundary hover after timeout if no boundary found
    if (!foundRowBoundary && !foundColumnBoundary && boundaryHover.type !== null) {
      if (boundaryHoverTimeoutRef.current) {
        clearTimeout(boundaryHoverTimeoutRef.current);
      }
      boundaryHoverTimeoutRef.current = setTimeout(() => {
        setBoundaryHover({ type: null, index: -1, position: { x: 0, y: 0 } });
      }, 100); // 100ms delay before clearing
    }
  };

  // Handle table mouse leave with timeout
  const handleTableMouseLeave = () => {
    // Use timeout to prevent flicker when moving between elements
    if (boundaryHoverTimeoutRef.current) {
      clearTimeout(boundaryHoverTimeoutRef.current);
    }
    boundaryHoverTimeoutRef.current = setTimeout(() => {
      setBoundaryHover({ type: null, index: -1, position: { x: 0, y: 0 } });
    }, 100);
  };

  // Handle table click
  const handleTableClick = () => {
    // Select the table when clicked
    if (!isSelected) {
      onSelect(element);
    }
  };

  // Enhanced cell hover handling with debouncing
  const handleCellMouseEnter = (row: number, col: number) => {
    if (cellHoverTimeoutRef.current) {
      clearTimeout(cellHoverTimeoutRef.current);
      cellHoverTimeoutRef.current = null;
    }
    setHoveredCell({ row, col });
  };

  const handleCellMouseLeave = () => {
    if (cellHoverTimeoutRef.current) {
      clearTimeout(cellHoverTimeoutRef.current);
    }
    cellHoverTimeoutRef.current = setTimeout(() => {
      setHoveredCell(null);
    }, 50); // Small delay to prevent flicker
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
    }, 100); // 100ms delay before clearing
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
              onDragOver={(e: Konva.KonvaEventObject<DragEvent>) => e.evt.preventDefault()}
              onDragLeave={() => {}}
              onDrop={(_e: Konva.KonvaEventObject<DragEvent>) => {}}
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

            {/* Row header hover area for delete button - larger area */}
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

            {/* Column header hover area for delete button - larger area */}
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
        onMouseMove={handleTableMouseMove}
        onMouseLeave={handleTableMouseLeave}
        onClick={handleTableClick}
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
          onClick={handleTableClick}
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

      {/* Boundary add controls - rendered outside main group for better positioning */}
      {boundaryHover.type === 'row' && (
        <Group
          onMouseEnter={() => {
            // Clear timeout when hovering on the button itself
            if (boundaryHoverTimeoutRef.current) {
              clearTimeout(boundaryHoverTimeoutRef.current);
              boundaryHoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            // Set timeout when leaving the button
            if (boundaryHoverTimeoutRef.current) {
              clearTimeout(boundaryHoverTimeoutRef.current);
            }
            boundaryHoverTimeoutRef.current = setTimeout(() => {
              setBoundaryHover({ type: null, index: -1, position: { x: 0, y: 0 } });
            }, 100);
          }}
        >
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
            onMouseEnter={() => {
              const container = document.querySelector('.konva-stage') as HTMLElement;
              if (container) container.style.cursor = 'pointer';
            }}
            onMouseLeave={() => {
              const container = document.querySelector('.konva-stage') as HTMLElement;
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
        <Group
          onMouseEnter={() => {
            // Clear timeout when hovering on the button itself
            if (boundaryHoverTimeoutRef.current) {
              clearTimeout(boundaryHoverTimeoutRef.current);
              boundaryHoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            // Set timeout when leaving the button
            if (boundaryHoverTimeoutRef.current) {
              clearTimeout(boundaryHoverTimeoutRef.current);
            }
            boundaryHoverTimeoutRef.current = setTimeout(() => {
              setBoundaryHover({ type: null, index: -1, position: { x: 0, y: 0 } });
            }, 100);
          }}
        >
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
            onMouseEnter={() => {
              const container = document.querySelector('.konva-stage') as HTMLElement;
              if (container) container.style.cursor = 'pointer';
            }}
            onMouseLeave={() => {
              const container = document.querySelector('.konva-stage') as HTMLElement;
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
            }, 100);
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
            onMouseEnter={() => {
              const container = document.querySelector('.konva-stage') as HTMLElement;
              if (container) container.style.cursor = 'pointer';
            }}
            onMouseLeave={() => {
              const container = document.querySelector('.konva-stage') as HTMLElement;
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
            }, 100);
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
            onMouseEnter={() => {
              const container = document.querySelector('.konva-stage') as HTMLElement;
              if (container) container.style.cursor = 'pointer';
            }}
            onMouseLeave={() => {
              const container = document.querySelector('.konva-stage') as HTMLElement;
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
