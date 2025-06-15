import React, { useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { CanvasElement } from '../../stores/konvaCanvasStore';

interface TableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (element: CanvasElement) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  isDragging?: boolean;
}

const TableElement: React.FC<TableElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDragStart,
  onDragEnd,
  isDragging
}) => {
  const groupRef = useRef<Konva.Group>(null);

  const {
    x = 0,
    y = 0,
    rows = 3,
    cols = 3,
    cellWidth = 100,
    cellHeight = 50,
    tableData = [],
    borderColor = '#E5E7EB',
    headerBackgroundColor = '#F3F4F6',
    cellBackgroundColor = '#FFFFFF',
    fill = '#1E293B',
    fontSize = 14,
    fontFamily = "'Inter', 'Segoe UI', 'Roboto', sans-serif",
    rotation = 0
  } = element;

  // Calculate total table dimensions
  const totalWidth = cols * cellWidth;
  const totalHeight = rows * cellHeight;

  // Ensure tableData has the correct dimensions
  const normalizedTableData = Array(rows).fill(null).map((_, rowIndex) => 
    Array(cols).fill(null).map((_, colIndex) => 
      tableData[rowIndex]?.[colIndex] || ''
    )
  );

  const handleClick = () => {
    onSelect(element);
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onUpdate({
      x: node.x(),
      y: node.y()
    });
  };

  const handleDoubleClick = (rowIndex: number, colIndex: number) => {
    // In a real implementation, this would open an inline editor
    const newValue = prompt(
      `Edit cell [${rowIndex + 1}, ${colIndex + 1}]:`, 
      normalizedTableData[rowIndex][colIndex]
    );
    
    if (newValue !== null) {
      const newTableData = [...normalizedTableData];
      newTableData[rowIndex][colIndex] = newValue;
      onUpdate({ tableData: newTableData });
    }
  };

  const addRow = () => {
    const newRow = Array(cols).fill('');
    const newTableData = [...normalizedTableData, newRow];
    onUpdate({ 
      rows: rows + 1,
      tableData: newTableData 
    });
  };

  const removeRow = () => {
    if (rows <= 1) return;
    const newTableData = normalizedTableData.slice(0, -1);
    onUpdate({ 
      rows: rows - 1,
      tableData: newTableData 
    });
  };

  const addColumn = () => {
    const newTableData = normalizedTableData.map(row => [...row, '']);
    onUpdate({ 
      cols: cols + 1,
      tableData: newTableData 
    });
  };

  const removeColumn = () => {
    if (cols <= 1) return;
    const newTableData = normalizedTableData.map(row => row.slice(0, -1));
    onUpdate({ 
      cols: cols - 1,
      tableData: newTableData 
    });
  };

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      rotation={rotation}
      draggable={!element.isLocked}
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragMove={handleDragMove}
      opacity={isDragging ? 0.7 : 1}
    >
      {/* Table background */}
      <Rect
        width={totalWidth}
        height={totalHeight}
        fill={cellBackgroundColor}
        stroke={borderColor}
        strokeWidth={isSelected ? 2 : 1}
      />

      {/* Render cells */}
      {normalizedTableData.map((row, rowIndex) =>
        row.map((cellValue, colIndex) => {
          const cellX = colIndex * cellWidth;
          const cellY = rowIndex * cellHeight;
          const isHeader = rowIndex === 0;

          return (
            <React.Fragment key={`${rowIndex}-${colIndex}`}>
              {/* Cell background */}
              <Rect
                x={cellX}
                y={cellY}
                width={cellWidth}
                height={cellHeight}
                fill={isHeader ? headerBackgroundColor : cellBackgroundColor}
                stroke={borderColor}
                strokeWidth={1}
                onDblClick={() => handleDoubleClick(rowIndex, colIndex)}
                onDblTap={() => handleDoubleClick(rowIndex, colIndex)}
              />

              {/* Cell text */}
              <Text
                x={cellX + 8}
                y={cellY + cellHeight / 2}
                text={cellValue}
                fontSize={fontSize}
                fontFamily={fontFamily}
                fill={fill}
                fontStyle={isHeader ? 'bold' : 'normal'}
                verticalAlign="middle"
                width={cellWidth - 16}
                height={cellHeight}
                ellipsis={true}
                wrap="none"
                listening={false}
              />
            </React.Fragment>
          );
        })
      )}

      {/* Selection indicator */}
      {isSelected && (
        <Rect
          width={totalWidth}
          height={totalHeight}
          stroke="#3B82F6"
          strokeWidth={2}
          fill="transparent"
          dash={[5, 5]}
          listening={false}
        />
      )}

      {/* Add/Remove controls when selected */}
      {isSelected && (
        <>
          {/* Add Row Button */}
          <Group
            x={totalWidth + 10}
            y={totalHeight / 2 - 10}
            onClick={(e) => {
              e.cancelBubble = true;
              addRow();
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              addRow();
            }}
          >
            <Rect
              width={20}
              height={20}
              fill="#EBF4FF"
              stroke="#3B82F6"
              strokeWidth={1}
              cornerRadius={2}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={2}
              shadowOffsetY={1}
            />
            <Text
              x={10}
              y={10}
              text="+"
              fontSize={14}
              fontFamily={fontFamily}
              fill="#3B82F6"
              align="center"
              verticalAlign="middle"
              width={20}
              height={20}
              listening={false}
            />
          </Group>

          {/* Remove Row Button */}
          <Group
            x={totalWidth + 35}
            y={totalHeight / 2 - 10}
            onClick={(e) => {
              e.cancelBubble = true;
              removeRow();
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              removeRow();
            }}
          >
            <Rect
              width={20}
              height={20}
              fill="#F8FAFC"
              stroke="#64748B"
              strokeWidth={1}
              cornerRadius={2}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={2}
              shadowOffsetY={1}
            />
            <Text
              x={10}
              y={10}
              text="−"
              fontSize={14}
              fontFamily={fontFamily}
              fill="#64748B"
              align="center"
              verticalAlign="middle"
              width={20}
              height={20}
              listening={false}
            />
          </Group>

          {/* Add Column Button */}
          <Group
            x={totalWidth / 2 - 10}
            y={totalHeight + 10}
            onClick={(e) => {
              e.cancelBubble = true;
              addColumn();
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              addColumn();
            }}
          >
            <Rect
              width={20}
              height={20}
              fill="#EBF4FF"
              stroke="#3B82F6"
              strokeWidth={1}
              cornerRadius={2}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={2}
              shadowOffsetY={1}
            />
            <Text
              x={10}
              y={10}
              text="+"
              fontSize={14}
              fontFamily={fontFamily}
              fill="#3B82F6"
              align="center"
              verticalAlign="middle"
              width={20}
              height={20}
              listening={false}
            />
          </Group>

          {/* Remove Column Button */}
          <Group
            x={totalWidth / 2 + 15}
            y={totalHeight + 10}
            onClick={(e) => {
              e.cancelBubble = true;
              removeColumn();
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              removeColumn();
            }}
          >
            <Rect
              width={20}
              height={20}
              fill="#F8FAFC"
              stroke="#64748B"
              strokeWidth={1}
              cornerRadius={2}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={2}
              shadowOffsetY={1}
            />
            <Text
              x={10}
              y={10}
              text="−"
              fontSize={14}
              fontFamily={fontFamily}
              fill="#64748B"
              align="center"
              verticalAlign="middle"
              width={20}
              height={20}
              listening={false}
            />
          </Group>

          {/* Resize Handle */}
          <Group
            x={totalWidth - 5}
            y={totalHeight - 5}
            draggable
            onDragMove={(e) => {
              e.cancelBubble = true;
              const newCellWidth = Math.max(50, (e.target.x() + 5) / cols);
              const newCellHeight = Math.max(30, (e.target.y() + 5) / rows);
              onUpdate({ 
                cellWidth: newCellWidth,
                cellHeight: newCellHeight 
              });
            }}
          >
            <Rect
              width={10}
              height={10}
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth={1}
              cornerRadius={1}
              shadowColor="rgba(0, 0, 0, 0.2)"
              shadowBlur={3}
              shadowOffsetY={1}
            />
          </Group>
        </>
      )}
    </Group>
  );
};

export default TableElement;
