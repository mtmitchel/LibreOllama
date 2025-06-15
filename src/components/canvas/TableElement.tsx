import React, { useRef, useEffect } from 'react';
import { Group, Rect, Text, Line } from 'react-konva';
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
    </Group>
  );
};

export default TableElement;
