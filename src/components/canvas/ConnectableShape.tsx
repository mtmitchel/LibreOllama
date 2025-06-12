// src/components/Canvas/ConnectableShape.tsx
import React, { useEffect, useRef } from 'react';
import { Rect, Circle, RegularPolygon, Text } from 'react-konva';
import { ConnectionManager, ConnectionPoint } from '../../lib/ConnectionManager';
import Konva from 'konva';

interface ConnectableShapeProps {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'star';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  connectionManager?: ConnectionManager;
  draggable?: boolean;
  onDragEnd?: (x: number, y: number) => void;
  onClick?: () => void;
}

export const ConnectableShape: React.FC<ConnectableShapeProps> = ({
  id,
  type,
  x,
  y,
  width = 100,
  height = 80,
  radius = 50,
  fill = '#3B82F6',
  stroke = '#1E40AF',
  strokeWidth = 2,
  text,
  connectionManager,
  draggable = true,
  onDragEnd,
  onClick
}) => {
  const shapeRef = useRef<Konva.Shape>(null);

  // Define connection points based on shape type
  const getConnectionPoints = (): ConnectionPoint[] => {
    switch (type) {
      case 'rectangle':
        return [
          { x: 0, y: height / 2, type: 'input', id: 'left' },
          { x: width, y: height / 2, type: 'output', id: 'right' },
          { x: width / 2, y: 0, type: 'bidirectional', id: 'top' },
          { x: width / 2, y: height, type: 'bidirectional', id: 'bottom' }
        ];
      case 'circle':
        return [
          { x: -radius, y: 0, type: 'input', id: 'left' },
          { x: radius, y: 0, type: 'output', id: 'right' },
          { x: 0, y: -radius, type: 'bidirectional', id: 'top' },
          { x: 0, y: radius, type: 'bidirectional', id: 'bottom' }
        ];
      case 'triangle':
        return [
          { x: 0, y: -radius, type: 'bidirectional', id: 'top' },
          { x: -radius * 0.866, y: radius * 0.5, type: 'input', id: 'bottom-left' },
          { x: radius * 0.866, y: radius * 0.5, type: 'output', id: 'bottom-right' }
        ];
      case 'star':
        return [
          { x: 0, y: -radius, type: 'bidirectional', id: 'top' },
          { x: radius * 0.707, y: -radius * 0.707, type: 'output', id: 'top-right' },
          { x: radius, y: 0, type: 'output', id: 'right' },
          { x: radius * 0.707, y: radius * 0.707, type: 'output', id: 'bottom-right' },
          { x: 0, y: radius, type: 'bidirectional', id: 'bottom' },
          { x: -radius * 0.707, y: radius * 0.707, type: 'input', id: 'bottom-left' },
          { x: -radius, y: 0, type: 'input', id: 'left' },
          { x: -radius * 0.707, y: -radius * 0.707, type: 'input', id: 'top-left' }
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    if (shapeRef.current && connectionManager) {
      const connectionPoints = getConnectionPoints();
      connectionManager.registerConnectableShape(shapeRef.current, connectionPoints);
    }
  }, [connectionManager, type, width, height, radius]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();
    onDragEnd?.(newX, newY);
  };

  const renderShape = () => {
    const commonProps = {
      ref: shapeRef,
      x,
      y,
      fill,
      stroke,
      strokeWidth,
      draggable,
      onDragEnd: handleDragEnd,
      onClick: onClick
    };

    switch (type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            width={width}
            height={height}
          />
        );
      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={radius}
          />
        );
      case 'triangle':
        return (
          <RegularPolygon
            {...commonProps}
            sides={3}
            radius={radius}
          />
        );
      case 'star':
        return (
          <RegularPolygon
            {...commonProps}
            sides={5}
            radius={radius}
            innerRadius={radius * 0.5}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderShape()}
      {text && (
        <Text
          x={type === 'circle' || type === 'triangle' || type === 'star' ? x - 50 : x + 5}
          y={type === 'circle' ? y - 8 : type === 'triangle' || type === 'star' ? y + radius + 10 : y + 5}
          text={text}
          fontSize={14}
          fontFamily="var(--font-sans)"
          fill="var(--text-primary)"
          width={type === 'rectangle' ? width - 10 : 100}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      )}
    </>
  );
};
