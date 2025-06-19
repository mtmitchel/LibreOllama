import React from 'react';
import { Group, Rect, Circle } from 'react-konva';
import { CanvasElement, ResizeHandle } from '../../types/canvas';

interface ResizeHandlesProps {
  element: CanvasElement;
  onResize: (newBounds: { x: number; y: number; width: number; height: number }) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  element,
  onResize,
  onResizeStart,
  onResizeEnd
}) => {
  const handleSize = 8;
  const handles: ResizeHandle[] = [
    {
      id: 'nw',
      position: 'nw',
      x: element.x - handleSize / 2,
      y: element.y - handleSize / 2,
      cursor: 'nw-resize'
    },
    {
      id: 'n',
      position: 'n',
      x: element.x + element.width / 2 - handleSize / 2,
      y: element.y - handleSize / 2,
      cursor: 'n-resize'
    },
    {
      id: 'ne',
      position: 'ne',
      x: element.x + element.width - handleSize / 2,
      y: element.y - handleSize / 2,
      cursor: 'ne-resize'
    },
    {
      id: 'e',
      position: 'e',
      x: element.x + element.width - handleSize / 2,
      y: element.y + element.height / 2 - handleSize / 2,
      cursor: 'e-resize'
    },
    {
      id: 'se',
      position: 'se',
      x: element.x + element.width - handleSize / 2,
      y: element.y + element.height - handleSize / 2,
      cursor: 'se-resize'
    },
    {
      id: 's',
      position: 's',
      x: element.x + element.width / 2 - handleSize / 2,
      y: element.y + element.height - handleSize / 2,
      cursor: 's-resize'
    },
    {
      id: 'sw',
      position: 'sw',
      x: element.x - handleSize / 2,
      y: element.y + element.height - handleSize / 2,
      cursor: 'sw-resize'
    },
    {
      id: 'w',
      position: 'w',
      x: element.x - handleSize / 2,
      y: element.y + element.height / 2 - handleSize / 2,
      cursor: 'w-resize'
    }
  ];

  const handleMouseDown = (handle: ResizeHandle) => (e: any) => {
    e.cancelBubble = true;
    onResizeStart?.();

    const startX = e.evt.clientX;
    const startY = e.evt.clientY;
    const startBounds = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newBounds = calculateNewBounds(handle.position, startBounds, deltaX, deltaY);
      onResize(newBounds);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onResizeEnd?.();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const calculateNewBounds = (
    position: string,
    startBounds: { x: number; y: number; width: number; height: number },
    deltaX: number,
    deltaY: number
  ) => {
    let { x, y, width, height } = startBounds;
    const minSize = 10;

    switch (position) {
      case 'nw':
        x += deltaX;
        y += deltaY;
        width -= deltaX;
        height -= deltaY;
        break;
      case 'n':
        y += deltaY;
        height -= deltaY;
        break;
      case 'ne':
        y += deltaY;
        width += deltaX;
        height -= deltaY;
        break;
      case 'e':
        width += deltaX;
        break;
      case 'se':
        width += deltaX;
        height += deltaY;
        break;
      case 's':
        height += deltaY;
        break;
      case 'sw':
        x += deltaX;
        width -= deltaX;
        height += deltaY;
        break;
      case 'w':
        x += deltaX;
        width -= deltaX;
        break;
    }

    // Ensure minimum size
    if (width < minSize) {
      if (position.includes('w')) {
        x = startBounds.x + startBounds.width - minSize;
      }
      width = minSize;
    }

    if (height < minSize) {
      if (position.includes('n')) {
        y = startBounds.y + startBounds.height - minSize;
      }
      height = minSize;
    }

    return { x, y, width, height };
  };

  return (
    <Group>
      {handles.map((handle) => (
        <Group key={handle.id}>
          {/* Handle background */}
          <Rect
            x={handle.x}
            y={handle.y}
            width={handleSize}
            height={handleSize}
            fill="#ffffff"
            stroke="#0066ff"
            strokeWidth={1}
            onMouseDown={handleMouseDown(handle)}
            perfectDrawEnabled={false}
          />
          
          {/* Handle visual feedback */}
          <Circle
            x={handle.x + handleSize / 2}
            y={handle.y + handleSize / 2}
            radius={2}
            fill="#0066ff"
            listening={false}
            perfectDrawEnabled={false}
          />
        </Group>
      ))}
    </Group>
  );
};

// TableResizeHandles implementation moved to end of file to avoid duplication
// Table-specific resize handles with 8 handles + row/column resize
interface TableResizeHandlesProps {
  element: CanvasElement;
  onResize?: (newBounds: { x: number; y: number; width: number; height: number }) => void;
  onRowResize?: (rowIndex: number, newHeight: number) => void;
  onColumnResize?: (colIndex: number, newWidth: number) => void;
}

export const TableResizeHandles: React.FC<TableResizeHandlesProps> = ({
  element,
  onResize,
  onRowResize,
  onColumnResize
}) => {
  const handleSize = 8;
  const data = element.data as any;
  const rows = data?.rows || 2;
  const cols = data?.cols || 2;
  
  const cellWidth = element.width / cols;
  const cellHeight = element.height / rows;
  
  // Standard 8 resize handles
  const cornerHandles: ResizeHandle[] = [
    {
      id: 'nw',
      position: 'nw',
      x: element.x - handleSize / 2,
      y: element.y - handleSize / 2,
      cursor: 'nw-resize'
    },
    {
      id: 'n',
      position: 'n',
      x: element.x + element.width / 2 - handleSize / 2,
      y: element.y - handleSize / 2,
      cursor: 'n-resize'
    },
    {
      id: 'ne',
      position: 'ne',
      x: element.x + element.width - handleSize / 2,
      y: element.y - handleSize / 2,
      cursor: 'ne-resize'
    },
    {
      id: 'e',
      position: 'e',
      x: element.x + element.width - handleSize / 2,
      y: element.y + element.height / 2 - handleSize / 2,
      cursor: 'e-resize'
    },
    {
      id: 'se',
      position: 'se',
      x: element.x + element.width - handleSize / 2,
      y: element.y + element.height - handleSize / 2,
      cursor: 'se-resize'
    },
    {
      id: 's',
      position: 's',
      x: element.x + element.width / 2 - handleSize / 2,
      y: element.y + element.height - handleSize / 2,
      cursor: 's-resize'
    },
    {
      id: 'sw',
      position: 'sw',
      x: element.x - handleSize / 2,
      y: element.y + element.height - handleSize / 2,
      cursor: 'sw-resize'
    },
    {
      id: 'w',
      position: 'w',
      x: element.x - handleSize / 2,
      y: element.y + element.height / 2 - handleSize / 2,
      cursor: 'w-resize'
    }
  ];
  
  // Row divider handles
  const rowHandles = Array.from({ length: rows - 1 }, (_, i) => ({
    id: `row-${i}`,
    x: element.x + element.width + 5,
    y: element.y + (i + 1) * cellHeight - handleSize / 2,
    rowIndex: i + 1
  }));
  
  // Column divider handles
  const columnHandles = Array.from({ length: cols - 1 }, (_, i) => ({
    id: `col-${i}`,
    x: element.x + (i + 1) * cellWidth - handleSize / 2,
    y: element.y + element.height + 5,
    colIndex: i + 1
  }));
  
  const handleCornerResize = (handle: ResizeHandle, deltaX: number, deltaY: number) => {
    if (!onResize) return;
    
    let newX = element.x;
    let newY = element.y;
    let newWidth = element.width;
    let newHeight = element.height;
    
    switch (handle.position) {
      case 'nw':
        newX += deltaX;
        newY += deltaY;
        newWidth -= deltaX;
        newHeight -= deltaY;
        break;
      case 'n':
        newY += deltaY;
        newHeight -= deltaY;
        break;
      case 'ne':
        newY += deltaY;
        newWidth += deltaX;
        newHeight -= deltaY;
        break;
      case 'e':
        newWidth += deltaX;
        break;
      case 'se':
        newWidth += deltaX;
        newHeight += deltaY;
        break;
      case 's':
        newHeight += deltaY;
        break;
      case 'sw':
        newX += deltaX;
        newWidth -= deltaX;
        newHeight += deltaY;
        break;
      case 'w':
        newX += deltaX;
        newWidth -= deltaX;
        break;
    }
    
    // Ensure minimum size
    const minSize = 20;
    if (newWidth < minSize) {
      newWidth = minSize;
      if (handle.position.includes('w')) {
        newX = element.x + element.width - minSize;
      }
    }
    if (newHeight < minSize) {
      newHeight = minSize;
      if (handle.position.includes('n')) {
        newY = element.y + element.height - minSize;
      }
    }
    
    onResize({ x: newX, y: newY, width: newWidth, height: newHeight });
  };
  
  const handleRowResize = (rowIndex: number, deltaY: number) => {
    if (!onRowResize) return;
    const newHeight = cellHeight + deltaY;
    if (newHeight > 20) { // Minimum row height
      onRowResize(rowIndex, newHeight);
    }
  };
  
  const handleColumnResize = (colIndex: number, deltaX: number) => {
    if (!onColumnResize) return;
    const newWidth = cellWidth + deltaX;
    if (newWidth > 30) { // Minimum column width
      onColumnResize(colIndex, newWidth);
    }
  };
  
  return (
    <Group>
      {/* Corner resize handles */}
      {cornerHandles.map((handle) => (
        <Rect
          key={handle.id}
          x={handle.x}
          y={handle.y}
          width={handleSize}
          height={handleSize}
          fill="#ffffff"
          stroke="#0066ff"
          strokeWidth={1}
          draggable
          onDragMove={(e) => {
            const deltaX = e.target.x() - handle.x;
            const deltaY = e.target.y() - handle.y;
            handleCornerResize(handle, deltaX, deltaY);
            e.target.position({ x: handle.x, y: handle.y });
          }}
          perfectDrawEnabled={false}
        />
      ))}
      
      {/* Row resize handles */}
      {rowHandles.map((handle) => (
        <Rect
          key={handle.id}
          x={handle.x}
          y={handle.y}
          width={15}
          height={handleSize}
          fill="#ffffff"
          stroke="#10b981"
          strokeWidth={1}
          draggable
          dragBoundFunc={(pos) => ({
            x: handle.x,
            y: pos.y
          })}
          onDragMove={(e) => {
            const deltaY = e.target.y() - handle.y;
            handleRowResize(handle.rowIndex, deltaY);
            e.target.position({ x: handle.x, y: handle.y });
          }}
          perfectDrawEnabled={false}
        />
      ))}
      
      {/* Column resize handles */}
      {columnHandles.map((handle) => (
        <Rect
          key={handle.id}
          x={handle.x}
          y={handle.y}
          width={handleSize}
          height={15}
          fill="#ffffff"
          stroke="#10b981"
          strokeWidth={1}
          draggable
          dragBoundFunc={(pos) => ({
            x: pos.x,
            y: handle.y
          })}
          onDragMove={(e) => {
            const deltaX = e.target.x() - handle.x;
            handleColumnResize(handle.colIndex, deltaX);
            e.target.position({ x: handle.x, y: handle.y });
          }}
          perfectDrawEnabled={false}
        />
      ))}
      
      {/* Visual indicators for table structure */}
      {/* Row dividers */}
      {rowHandles.map((handle, i) => (
        <Rect
          key={`row-divider-${i}`}
          x={element.x}
          y={element.y + (i + 1) * cellHeight - 0.5}
          width={element.width}
          height={1}
          fill="#10b981"
          opacity={0.5}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
      
      {/* Column dividers */}
      {columnHandles.map((handle, i) => (
        <Rect
          key={`col-divider-${i}`}
          x={element.x + (i + 1) * cellWidth - 0.5}
          y={element.y}
          width={1}
          height={element.height}
          fill="#10b981"
          opacity={0.5}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
    </Group>
  );
};

export default ResizeHandles;
