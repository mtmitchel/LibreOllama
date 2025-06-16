import React, { useState } from 'react';
import { Group, Rect, Text } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useKonvaCanvasStore } from '../../stores/konvaCanvasStore';

const CELL_PADDING = 8;
const CONTROL_SIZE = 16;
const CONTROL_COLOR = '#3b82f6';

interface TableElementProps {
  id: string;
  x: number;
  y: number;
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  tableData: string[][];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDoubleClick: (e: KonvaEventObject<MouseEvent>, id: string, rowIndex: number, colIndex: number) => void;
}

const TableElement: React.FC<TableElementProps> = ({
  id,
  x,
  y,
  rows,
  cols,
  cellWidth,
  cellHeight,
  tableData,
  isSelected,
  onSelect,
  onDoubleClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { updateElement } = useKonvaCanvasStore();

  const tableWidth = cols * cellWidth;
  const tableHeight = rows * cellHeight;

  const handleAddRow = () => {
    const newTableData = [...tableData, Array(cols).fill('')];
    updateElement(id, {
      rows: rows + 1,
      tableData: newTableData,
    });
  };

  const handleRemoveRow = (rowIndex: number) => {
    if (rows <= 1) return; // Don't remove the last row
    const newTableData = tableData.filter((_, index) => index !== rowIndex);
    updateElement(id, {
      rows: rows - 1,
      tableData: newTableData,
    });
  };

  const handleAddCol = () => {
    const newTableData = tableData.map(row => [...row, '']);
    updateElement(id, {
      cols: cols + 1,
      tableData: newTableData,
    });
  };

  const handleRemoveCol = (colIndex: number) => {
    if (cols <= 1) return; // Don't remove the last column
    const newTableData = tableData.map(row => row.filter((_, index) => index !== colIndex));
    updateElement(id, {
      cols: cols - 1,
      tableData: newTableData,
    });
  };

  const handleCellDoubleClick = (e: KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      const localX = pos.x - x;
      const localY = pos.y - y;
      const colIndex = Math.floor(localX / cellWidth);
      const rowIndex = Math.floor(localY / cellHeight);
      
      if (rowIndex >= 0 && rowIndex < rows && colIndex >= 0 && colIndex < cols) {
        onDoubleClick(e, id, rowIndex, colIndex);
      }
    }
  };

  const showControls = isSelected || isHovered;

  return (
    <Group
      id={id}
      x={x}
      y={y}
      draggable
      onClick={() => onSelect(id)}
      onDblClick={handleCellDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Table cells */}
      {Array.from({ length: rows }).map((_, rowIndex) =>
        Array.from({ length: cols }).map((_, colIndex) => (
          <Group key={`${rowIndex}-${colIndex}`}>
            {/* Cell background */}
            <Rect
              x={colIndex * cellWidth}
              y={rowIndex * cellHeight}
              width={cellWidth}
              height={cellHeight}
              fill="white"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            {/* Cell text */}
            <Text
              x={colIndex * cellWidth + CELL_PADDING}
              y={rowIndex * cellHeight + CELL_PADDING}
              text={tableData[rowIndex]?.[colIndex] || ''}
              fontSize={14}
              fontFamily="Inter, sans-serif"
              fill="#374151"
              width={cellWidth - CELL_PADDING * 2}
              height={cellHeight - CELL_PADDING * 2}
              verticalAlign="middle"
              ellipsis={true}
            />
          </Group>
        ))
      )}

      {/* Selection border */}
      {isSelected && (
        <Rect
          x={-2}
          y={-2}
          width={tableWidth + 4}
          height={tableHeight + 4}
          stroke={CONTROL_COLOR}
          strokeWidth={2}
          fill="transparent"
        />
      )}

      {/* Add/Remove controls */}
      {showControls && (
        <Group>
          {/* Add row button (bottom) */}
          <Group
            x={tableWidth / 2 - CONTROL_SIZE / 2}
            y={tableHeight + 8}
            onClick={handleAddRow}
          >
            <Rect
              width={CONTROL_SIZE}
              height={CONTROL_SIZE}
              fill={CONTROL_COLOR}
              cornerRadius={3}
            />
            <Text
              x={CONTROL_SIZE / 2}
              y={CONTROL_SIZE / 2}
              text="+"
              fontSize={12}
              fill="white"
              align="center"
              verticalAlign="middle"
            />
          </Group>

          {/* Add column button (right) */}
          <Group
            x={tableWidth + 8}
            y={tableHeight / 2 - CONTROL_SIZE / 2}
            onClick={handleAddCol}
          >
            <Rect
              width={CONTROL_SIZE}
              height={CONTROL_SIZE}
              fill={CONTROL_COLOR}
              cornerRadius={3}
            />
            <Text
              x={CONTROL_SIZE / 2}
              y={CONTROL_SIZE / 2}
              text="+"
              fontSize={12}
              fill="white"
              align="center"
              verticalAlign="middle"
            />
          </Group>

          {/* Remove row buttons (if more than 1 row) */}
          {rows > 1 && Array.from({ length: rows }).map((_, rowIndex) => (
            <Group
              key={`remove-row-${rowIndex}`}
              x={-24}
              y={rowIndex * cellHeight + cellHeight / 2 - CONTROL_SIZE / 2}
              onClick={() => handleRemoveRow(rowIndex)}
            >
              <Rect
                width={CONTROL_SIZE}
                height={CONTROL_SIZE}
                fill="#ef4444"
                cornerRadius={3}
              />
              <Text
                x={CONTROL_SIZE / 2}
                y={CONTROL_SIZE / 2}
                text="−"
                fontSize={12}
                fill="white"
                align="center"
                verticalAlign="middle"
              />
            </Group>
          ))}

          {/* Remove column buttons (if more than 1 column) */}
          {cols > 1 && Array.from({ length: cols }).map((_, colIndex) => (
            <Group
              key={`remove-col-${colIndex}`}
              x={colIndex * cellWidth + cellWidth / 2 - CONTROL_SIZE / 2}
              y={-24}
              onClick={() => handleRemoveCol(colIndex)}
            >
              <Rect
                width={CONTROL_SIZE}
                height={CONTROL_SIZE}
                fill="#ef4444"
                cornerRadius={3}
              />
              <Text
                x={CONTROL_SIZE / 2}
                y={CONTROL_SIZE / 2}
                text="−"
                fontSize={12}
                fill="white"
                align="center"
                verticalAlign="middle"
              />
            </Group>
          ))}
        </Group>
      )}
    </Group>
  );
};

export default TableElement;
