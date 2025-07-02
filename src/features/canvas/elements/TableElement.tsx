import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Group, Rect, Text, Transformer, Circle, Line, Path } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';
import { CanvasElement, ElementId, TableElement as TableElementType } from '../types/enhanced.types';
import { isTableElement } from '../types/enhanced.types';

interface TableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (element: CanvasElement) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

interface HoveredItem {
  type: 'row' | 'column' | 'cell';
  rowIndex?: number;
  colIndex?: number;
}

export const TableElement = React.forwardRef<Konva.Group, TableElementProps>(
  ({ element, isSelected, onSelect, onUpdate, stageRef }, ref) => {

  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  
  if (!isTableElement(element)) {
    return null;
  }
  
  const tableId = element.id as ElementId;

  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);
  const [hoveredRow, setHoveredRow] = useState(-1);
  const [hoveredCol, setHoveredCol] = useState(-1);

  const updateTableCell = useUnifiedCanvasStore(state => state.updateTableCell);
  const addTableRow = useUnifiedCanvasStore(state => state.addTableRow);
  const removeTableRow = useUnifiedCanvasStore(state => state.removeTableRow);
  const addTableColumn = useUnifiedCanvasStore(state => state.addTableColumn);
  const removeTableColumn = useUnifiedCanvasStore(state => state.removeTableColumn);
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);

  const storeElement = useUnifiedCanvasStore(state => state.elements.get(tableId));
  const latestTableData = (storeElement && isTableElement(storeElement)) 
    ? storeElement.enhancedTableData 
    : element.enhancedTableData;

  const tableRows = latestTableData?.rows || [];
  const tableColumns = latestTableData?.columns || [];
  const tableCells = latestTableData?.cells || [];
  
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  useEffect(() => {
    setForceUpdateCounter(prev => prev + 1);
  }, [latestTableData]);

  const ensureCell = (rowIndex: number, colIndex: number) => {
    if (!tableCells[rowIndex]) tableCells[rowIndex] = [];
    if (!tableCells[rowIndex][colIndex]) {
      const isHeader = rowIndex === 0;
      tableCells[rowIndex][colIndex] = {
        content: '', text: '',
        backgroundColor: isHeader ? '#F8FAFC' : '#FFFFFF',
        textColor: isHeader ? '#374151' : '#1F2937',
        fontSize: 14, fontFamily: 'Inter, sans-serif',
        textAlign: 'left', verticalAlign: 'middle'
      };
    }
  };

  for (let i = 0; i < tableRows.length; i++) {
    for (let j = 0; j < tableColumns.length; j++) {
      ensureCell(i, j);
    }
  }

  // Table dimensions with proper spacing for single add buttons
  const ROW_HEIGHT = 44;
  const COLUMN_WIDTH = 200;
  const DELETE_COLUMN_WIDTH = 40;
  const ADD_PADDING = 30;

  // Calculate dimensions based on element size if it was resized
  const actualTableWidth = element.width || (tableColumns.length * COLUMN_WIDTH + DELETE_COLUMN_WIDTH + ADD_PADDING);
  const actualTableHeight = element.height || (tableRows.length * ROW_HEIGHT + ADD_PADDING);
  
  // Derive actual cell dimensions from table size
  const actualContentWidth = actualTableWidth - DELETE_COLUMN_WIDTH - ADD_PADDING;
  const actualContentHeight = actualTableHeight - ADD_PADDING;
  const actualColumnWidth = tableColumns.length > 0 ? actualContentWidth / tableColumns.length : COLUMN_WIDTH;
  const actualRowHeight = tableRows.length > 0 ? actualContentHeight / tableRows.length : ROW_HEIGHT;

  // Use actual dimensions for layout
  const totalContentWidth = actualContentWidth;
  const totalWidth = actualTableWidth;
  const totalContentHeight = actualContentHeight;
  const totalHeight = actualTableHeight;

  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    setEditingCell({ row, col });
  }, []);

  // Standard drag handler pattern from working shapes
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<any>) => {
    updateElement(element.id as ElementId, {
      x: e.target.x(),
      y: e.target.y(),
    });
  }, [element.id, updateElement]);

  // Enhanced cell editing with improved UX
  useEffect(() => {
    if (!editingCell || !stageRef?.current) return;

    const stage = stageRef.current;
    const container = stage.container();
    if (!container) return;

    // 1. Compute cell local coordinates inside the group
    const cellX = DELETE_COLUMN_WIDTH + editingCell.col * actualColumnWidth;
    const cellY = editingCell.row * actualRowHeight;

    // 2. Get the table group
    const group = groupRef.current;
    if (!group) return;

    // 3. Use a more direct approach: convert cell coordinates to stage coordinates
    // then apply stage transform to get screen coordinates
    const localToStage = group.getAbsoluteTransform();
    const stageTopLeft = localToStage.point({ x: cellX, y: cellY });
    const stageBottomRight = localToStage.point({ 
      x: cellX + actualColumnWidth, 
      y: cellY + actualRowHeight 
    });

    // 4. Apply stage's viewport transform (handles zoom/pan)
    const stageTransform = stage.getAbsoluteTransform();
    const screenTopLeft = stageTransform.point(stageTopLeft);
    const screenBottomRight = stageTransform.point(stageBottomRight);

    // 5. Add container's position in the page
    const containerRect = container.getBoundingClientRect();
    const finalX = screenTopLeft.x + containerRect.left;
    const finalY = screenTopLeft.y + containerRect.top;
    const finalWidth = screenBottomRight.x - screenTopLeft.x;
    const finalHeight = screenBottomRight.y - screenTopLeft.y;

    // Debug logging to understand positioning issues
    console.log('🔍 [TableElement] Direct transform approach:', {
      cellCoords: { x: cellX, y: cellY, width: actualColumnWidth, height: actualRowHeight },
      stageCoords: { topLeft: stageTopLeft, bottomRight: stageBottomRight },
      screenCoords: { topLeft: screenTopLeft, bottomRight: screenBottomRight },
      containerRect: { left: containerRect.left, top: containerRect.top },
      finalPosition: { x: finalX, y: finalY, width: finalWidth, height: finalHeight },
      stageScale: stage.scaleX(),
      stagePosition: { x: stage.x(), y: stage.y() }
    });

    const existingContainer = document.getElementById(`table-cell-editor-container-${tableId}`);
    if (existingContainer) existingContainer.remove();

    // Create container for precise positioning
    const editorContainer = document.createElement('div');
    editorContainer.id = `table-cell-editor-container-${tableId}`;
    Object.assign(editorContainer.style, {
      position: 'fixed',
      left: `${finalX}px`,
      top: `${finalY}px`,
      width: `${finalWidth}px`,
      height: `${finalHeight}px`,
      zIndex: '2147483647',
      pointerEvents: 'auto',
    });

    const input = document.createElement('textarea');
    input.id = `table-cell-editor-${tableId}`;
    input.rows = 1;
    
    const cellData = tableCells[editingCell.row]?.[editingCell.col];
    const currentText = cellData?.text || cellData?.content || '';
    const isHeader = editingCell.row === 0;
    input.value = currentText;
    
    // Set placeholder text
    if (!currentText) {
      input.placeholder = isHeader ? 'Column header' : 'Enter text';
    }

    // Apply styles so the textarea fills the container exactly while still
    // keeping internal padding for nicer UX.
    Object.assign(input.style, {
      width: '100%',
      height: '100%',
      padding: '16px',
      margin: '0',
      border: '2px solid #3B82F6',
      borderRadius: '4px',
      fontSize: isHeader ? '15px' : '14px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: isHeader ? '600' : '400',
      backgroundColor: isHeader ? '#F9FAFB' : '#FFFFFF',
      color: isHeader ? '#1F2937' : '#374151',
      outline: 'none',
      resize: 'none',
      overflow: 'hidden',
      lineHeight: '1.4',
      boxSizing: 'border-box'
    });

    // Auto-resize textarea height
    const autoResize = () => {
      input.style.height = 'auto';
      const scrollHeight = input.scrollHeight;
      const maxHeight = parseFloat(editorContainer.style.height) - 4; // Account for border
      input.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveAndExit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        moveToNextCell(e.shiftKey);
      }
    };

    const handleInput = (e: Event) => {
      autoResize();
    };

    const saveAndExit = () => {
      updateTableCell(tableId, editingCell.row, editingCell.col, input.value.trim());
      setEditingCell(null);
    };

    const cancelEdit = () => {
      setEditingCell(null);
    };

    const moveToNextCell = (backward: boolean = false) => {
      const currentRow = editingCell.row;
      const currentCol = editingCell.col;
      
      // Save current cell
      updateTableCell(tableId, currentRow, currentCol, input.value.trim());
      
      // Calculate next cell position
      let nextRow = currentRow;
      let nextCol = currentCol;
      
      if (backward) {
        if (nextCol > 0) {
          nextCol--;
        } else if (nextRow > 0) {
          nextRow--;
          nextCol = tableColumns.length - 1;
        }
      } else {
        if (nextCol < tableColumns.length - 1) {
          nextCol++;
        } else if (nextRow < tableRows.length - 1) {
          nextRow++;
          nextCol = 0;
        }
      }
      
      // Move to next cell if different
      if (nextRow !== currentRow || nextCol !== currentCol) {
        setEditingCell({ row: nextRow, col: nextCol });
      } else {
        setEditingCell(null);
      }
    };

    const handleBlur = (e: FocusEvent) => {
      // Small delay to allow for tab navigation
      setTimeout(() => {
        if (document.activeElement?.id !== `table-cell-editor-${tableId}`) {
          saveAndExit();
        }
      }, 50);
    };

    // Live position update function for when table moves or zoom changes
    const updateEditorPosition = () => {
      if (!groupRef.current || !stageRef.current) return;

      const currentStage = stageRef.current;
      const currentContainer = currentStage.container();
      if (!currentContainer) return;

      // Recalculate using the same direct transform approach
      const currentLocalToStage = groupRef.current.getAbsoluteTransform();
      const currentStageTopLeft = currentLocalToStage.point({ x: cellX, y: cellY });
      const currentStageBottomRight = currentLocalToStage.point({ 
        x: cellX + actualColumnWidth, 
        y: cellY + actualRowHeight 
      });

      const currentStageTransform = currentStage.getAbsoluteTransform();
      const currentScreenTopLeft = currentStageTransform.point(currentStageTopLeft);
      const currentScreenBottomRight = currentStageTransform.point(currentStageBottomRight);

      const currentContainerRect = currentContainer.getBoundingClientRect();
      const newFinalX = currentScreenTopLeft.x + currentContainerRect.left;
      const newFinalY = currentScreenTopLeft.y + currentContainerRect.top;
      const newFinalWidth = currentScreenBottomRight.x - currentScreenTopLeft.x;
      const newFinalHeight = currentScreenBottomRight.y - currentScreenTopLeft.y;

      // Apply changes only if values differ to avoid style thrash
      if (Math.abs(newFinalX - parseFloat(editorContainer.style.left)) > 0.5) {
        editorContainer.style.left = `${newFinalX}px`;
      }
      if (Math.abs(newFinalY - parseFloat(editorContainer.style.top)) > 0.5) {
        editorContainer.style.top = `${newFinalY}px`;
      }
      if (Math.abs(newFinalWidth - parseFloat(editorContainer.style.width)) > 0.5) {
        editorContainer.style.width = `${newFinalWidth}px`;
      }
      if (Math.abs(newFinalHeight - parseFloat(editorContainer.style.height)) > 0.5) {
        editorContainer.style.height = `${newFinalHeight}px`;
      }
    };

    // Monitor table position changes more frequently since viewport changes can be fast
    const positionMonitor = setInterval(updateEditorPosition, 16); // ~60fps monitoring

    // Add event listeners
    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('input', handleInput);
    input.addEventListener('blur', handleBlur);
    
    // Add input to container and container to body
    editorContainer.appendChild(input);
    document.body.appendChild(editorContainer);
    
    // Focus and setup
    setTimeout(() => {
      input.focus();
      if (currentText) {
        input.select();
      }
      autoResize();
    }, 50);

    return () => {
      clearInterval(positionMonitor);
      input.removeEventListener('keydown', handleKeyDown);
      input.removeEventListener('input', handleInput);
      input.removeEventListener('blur', handleBlur);
      if (document.body.contains(editorContainer)) {
        document.body.removeChild(editorContainer);
      }
    };
  }, [editingCell, element.x, element.y, element.width, element.height, stageRef, updateTableCell, tableId, tableColumns.length, tableRows.length, forceUpdateCounter, actualColumnWidth, actualRowHeight]);

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      // we need to attach transformer manually
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Modern icon components with improved styling
  const PlusIcon = ({ x, y, size = 16, color = '#4B5563' }: { x: number; y: number; size?: number; color?: string }) => (
    <Group x={x} y={y}>
      <Line points={[0, -size/2, 0, size/2]} stroke={color} strokeWidth={2.5} lineCap="round" />
      <Line points={[-size/2, 0, size/2, 0]} stroke={color} strokeWidth={2.5} lineCap="round" />
    </Group>
  );

  const XIcon = ({ x, y, size = 12, color = '#FFFFFF' }: { x: number; y: number; size?: number; color?: string }) => (
    <Group x={x} y={y}>
      <Line points={[-size/2, -size/2, size/2, size/2]} stroke={color} strokeWidth={2.5} lineCap="round" />
      <Line points={[-size/2, size/2, size/2, -size/2]} stroke={color} strokeWidth={2.5} lineCap="round" />
    </Group>
  );

  const DeleteButton = ({ x, y, onClick, visible, onMouseEnter, tooltip }: { 
    x: number; 
    y: number; 
    onClick: () => void; 
    visible: boolean;
    onMouseEnter?: () => void;
    tooltip?: string;
  }) => (
    <Group 
      x={x} 
      y={y} 
      onClick={onClick} 
      onTap={onClick}
      onMouseEnter={onMouseEnter}
      opacity={visible ? 1 : 0}
      listening={true}
    >
      <Circle
        radius={7}
        fill="#EF4444"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        shadowColor="rgba(239, 68, 68, 0.2)"
        shadowBlur={2}
        shadowOffset={{ x: 0, y: 1 }}
      />
      <XIcon x={0} y={0} size={6} color="#FFFFFF" />
    </Group>
  );

  const renderTable = () => {
    const elements = [];

    // Main table container with cleaner styling
    elements.push(
      <Rect
        key="table-container"
        width={totalWidth}
        height={totalHeight}
        fill="#FFFFFF"
        stroke="#D1D5DB"
        strokeWidth={1}
        cornerRadius={6}
        shadowColor="rgba(0, 0, 0, 0.04)"
        shadowBlur={3}
        shadowOffset={{ x: 0, y: 1 }}
        onTransformEnd={(e) => {
          // Standard Konva transform pattern - handle scaling
          const node = groupRef.current;
          if (!node) return;
          
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          // Reset scale to 1 and adjust dimensions
          node.scaleX(1);
          node.scaleY(1);
          
          updateElement(element.id as ElementId, {
            x: node.x(),
            y: node.y(),
            width: Math.max(240, totalWidth * scaleX),
            height: Math.max(120, totalHeight * scaleY),
          });
        }}
      />
    );

    // Enhanced header section background
    elements.push(
      <Rect
        key="header-section"
        x={DELETE_COLUMN_WIDTH}
        y={0}
        width={totalContentWidth}
        height={actualRowHeight}
        fill="#F9FAFB"
        stroke="transparent"
        strokeWidth={0}
      />
    );

    // Render cells with improved styling and consistent borders
    for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
      for (let colIndex = 0; colIndex < tableColumns.length; colIndex++) {
        ensureCell(rowIndex, colIndex);
        const cellData = tableCells[rowIndex][colIndex];
        const cellText = cellData?.text || cellData?.content || '';
        
        const cellX = DELETE_COLUMN_WIDTH + colIndex * actualColumnWidth;
        const cellY = rowIndex * actualRowHeight;
        const isHeader = rowIndex === 0;
        const isHovered = hoveredItem?.type === 'cell' && 
                         hoveredItem?.rowIndex === rowIndex && 
                         hoveredItem?.colIndex === colIndex;

        // Cell background with improved hover detection
        elements.push(
          <Rect
            key={`cell-bg-${rowIndex}-${colIndex}`}
            x={cellX}
            y={cellY}
            width={actualColumnWidth}
            height={actualRowHeight}
            fill={isHovered ? '#F8F9FA' : (isHeader ? '#F8FAFC' : '#FFFFFF')}
            stroke="transparent"
            strokeWidth={0}
            onMouseEnter={() => {
              setHoveredItem({ type: 'cell', rowIndex, colIndex });
              setHoveredRow(rowIndex);
              setHoveredCol(colIndex);
            }}
            onClick={() => onSelect(element)}
            onDblClick={() => handleCellDoubleClick(rowIndex, colIndex)}
          />
        );

        // Enhanced cell text with better typography
        elements.push(
          <Text
            key={`cell-text-${rowIndex}-${colIndex}`}
            text={cellText || (isHeader ? `Column ${colIndex + 1}` : '')}
            x={cellX + 12}
            y={cellY + 12}
            width={actualColumnWidth - 24}
            height={actualRowHeight - 24}
            fontSize={isHeader ? 14 : 13}
            fontFamily="Inter, sans-serif"
            fontWeight={isHeader ? '500' : '400'}
            fill={isHeader ? '#374151' : '#4B5563'}
            verticalAlign="middle"
            align="left"
            listening={false}
          />
        );
      }
    }

    // Add delete buttons for columns (in header area) on hover
    for (let colIndex = 0; colIndex < tableColumns.length; colIndex++) {
      const isColHovered = hoveredCol === colIndex;
      if (tableColumns.length > 2) {
        elements.push(
          <DeleteButton
            key={`delete-col-${colIndex}`}
            x={DELETE_COLUMN_WIDTH + colIndex * actualColumnWidth + actualColumnWidth - 25}
            y={actualRowHeight / 2}
            onClick={() => removeTableColumn(tableId, colIndex)}
            visible={isColHovered}
            onMouseEnter={() => setHoveredCol(colIndex)}
          />
        );
      }
    }

    // Add delete buttons for rows with better separation and hover reveals
    for (let rowIndex = 1; rowIndex < tableRows.length; rowIndex++) {
      const isRowHovered = hoveredRow === rowIndex;
      if (tableRows.length > 2) {
        elements.push(
          <DeleteButton
            key={`delete-row-${rowIndex}`}
            x={12}
            y={rowIndex * actualRowHeight + actualRowHeight / 2}
            onClick={() => removeTableRow(tableId, rowIndex)}
            visible={isRowHovered}
            onMouseEnter={() => setHoveredRow(rowIndex)}
            tooltip="Delete row"
          />
        );
      }
    }

    // Single add column button at the end of header row
    elements.push(
      <Group
        key="add-column"
        x={DELETE_COLUMN_WIDTH + totalContentWidth + 15}
        y={actualRowHeight / 2}
        onClick={() => addTableColumn(tableId, tableColumns.length)}
        onTap={() => addTableColumn(tableId, tableColumns.length)}
        onMouseEnter={() => setHoveredCol(-2)} // Special hover state for add column
        onMouseLeave={() => setHoveredCol(-1)}
      >
        <Circle
          radius={10}
          fill="#F9FAFB"
          stroke="#E5E7EB"
          strokeWidth={1}
          opacity={0.9}
        />
        <PlusIcon x={0} y={0} color="#6B7280" size={12} />
      </Group>
    );

    // Single add row button at the bottom
    elements.push(
      <Group
        key="add-row"
        x={DELETE_COLUMN_WIDTH / 2}
        y={totalContentHeight + 15}
        onClick={() => addTableRow(tableId, tableRows.length)}
        onTap={() => addTableRow(tableId, tableRows.length)}
        onMouseEnter={() => setHoveredRow(-2)} // Special hover state for add row
        onMouseLeave={() => setHoveredRow(-1)}
      >
        <Circle
          radius={10}
          fill="#F9FAFB"
          stroke="#E5E7EB"
          strokeWidth={1}
          opacity={0.9}
        />
        <PlusIcon x={0} y={0} color="#6B7280" size={12} />
      </Group>
    );

    // Add insertion preview for column (when hovering add column button)
    if (hoveredCol === -2) {
      elements.push(
        <Line
          key="column-insertion-preview"
          points={[
            DELETE_COLUMN_WIDTH + totalContentWidth + 5,
            0,
            DELETE_COLUMN_WIDTH + totalContentWidth + 5,
            totalContentHeight
          ]}
          stroke="#3B82F6"
          strokeWidth={2}
          opacity={0.6}
          listening={false}
        />
      );
    }

    // Add insertion preview for row (when hovering add row button)
    if (hoveredRow === -2) {
      elements.push(
        <Line
          key="row-insertion-preview"
          points={[
            DELETE_COLUMN_WIDTH,
            totalContentHeight + 5,
            DELETE_COLUMN_WIDTH + totalContentWidth,
            totalContentHeight + 5
          ]}
          stroke="#3B82F6"
          strokeWidth={2}
          opacity={0.6}
          listening={false}
        />
      );
    }

    // Clean, subtle grid lines
    // Vertical grid lines
    for (let i = 1; i < tableColumns.length; i++) {
      const lineX = DELETE_COLUMN_WIDTH + i * actualColumnWidth;
      elements.push(
        <Line
          key={`v-grid-${i}`}
          points={[lineX, 0, lineX, totalContentHeight]}
          stroke="#E5E7EB"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    // Horizontal grid lines
    for (let i = 1; i < tableRows.length; i++) {
      const lineY = i * actualRowHeight;
      elements.push(
        <Line
          key={`h-grid-${i}`}
          points={[DELETE_COLUMN_WIDTH, lineY, DELETE_COLUMN_WIDTH + totalContentWidth, lineY]}
          stroke="#E5E7EB"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    // Add header separator line (only within table content area)
    elements.push(
      <Line
        key="header-separator"
        points={[DELETE_COLUMN_WIDTH, actualRowHeight, DELETE_COLUMN_WIDTH + totalContentWidth, actualRowHeight]}
        stroke="#D1D5DB"
        strokeWidth={1.5}
        listening={false}
      />
    );

    // Add bottom border for table content area
    elements.push(
      <Line
        key="bottom-separator"
        points={[DELETE_COLUMN_WIDTH, totalContentHeight, DELETE_COLUMN_WIDTH + totalContentWidth, totalContentHeight]}
        stroke="#D1D5DB"
        strokeWidth={1}
        listening={false}
      />
    );

    return elements;
  };

  return (
    <>
      <Group
        ref={groupRef}
        id={element.id}
        x={element.x}
        y={element.y}
        width={totalWidth}
        height={totalHeight}
        draggable
        onDragEnd={handleDragEnd}
        onClick={() => onSelect(element)}
        onTap={() => onSelect(element)}
        onMouseLeave={() => {
          setHoveredItem(null);
          setHoveredRow(-1);
          setHoveredCol(-1);
        }}
      >
        {renderTable()}
      </Group>
      
      {/* Standard transformer matching other elements */}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 240 || newBox.height < 120) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={false}
          borderStroke="#3B82F6"
          borderStrokeWidth={2}
          borderDash={[5, 5]}
          anchorStroke="#3B82F6"
          anchorFill="#ffffff"
          anchorSize={8}
          anchorStrokeWidth={2}
          ignoreStroke={true}
        />
      )}
    </>
  );
});

TableElement.displayName = 'TableElement';

export default TableElement;