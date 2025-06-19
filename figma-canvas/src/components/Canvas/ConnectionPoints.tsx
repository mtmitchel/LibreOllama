import React from 'react';
import { Group, Circle } from 'react-konva';
import { CanvasElement } from '../../types/canvas';
import { ConnectionPoint } from '../../utils/collision';

interface ConnectionPointsProps {
  element: CanvasElement;
  visible: boolean;
  hoveredPointId?: string;
  onPointHover?: (pointId: string | undefined) => void;
  onPointClick?: (point: ConnectionPoint) => void;
}

export const ConnectionPoints: React.FC<ConnectionPointsProps> = ({
  element,
  visible,
  hoveredPointId,
  onPointHover,
  onPointClick
}) => {
  if (!visible) return null;

  const getConnectionPoints = (): ConnectionPoint[] => {
    const bounds = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    };

    return [
      {
        id: `${element.id}-top`,
        x: bounds.x + bounds.width / 2,
        y: bounds.y,
        direction: 'top',
        elementId: element.id
      },
      {
        id: `${element.id}-right`,
        x: bounds.x + bounds.width,
        y: bounds.y + bounds.height / 2,
        direction: 'right',
        elementId: element.id
      },
      {
        id: `${element.id}-bottom`,
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height,
        direction: 'bottom',
        elementId: element.id
      },
      {
        id: `${element.id}-left`,
        x: bounds.x,
        y: bounds.y + bounds.height / 2,
        direction: 'left',
        elementId: element.id
      },
      {
        id: `${element.id}-center`,
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
        direction: 'center',
        elementId: element.id
      }
    ];
  };

  const connectionPoints = getConnectionPoints();

  return (
    <Group>
      {connectionPoints.map((point) => {
        const isHovered = hoveredPointId === point.id;
        const radius = isHovered ? 6 : 4;
        
        return (
          <Circle
            key={point.id}
            x={point.x}
            y={point.y}
            radius={radius}
            fill={isHovered ? '#0066ff' : '#ffffff'}
            stroke="#0066ff"
            strokeWidth={2}
            onMouseEnter={() => onPointHover?.(point.id)}
            onMouseLeave={() => onPointHover?.(undefined)}
            onClick={() => onPointClick?.(point)}
            perfectDrawEnabled={false}
          />
        );
      })}
    </Group>
  );
};

// Connection point layer for the entire canvas
interface ConnectionPointLayerProps {
  elements: CanvasElement[];
  hoveredConnectionPoint?: string;
  onConnectionPointHover?: (pointId: string | undefined) => void;
  onConnectionPointClick?: (point: ConnectionPoint) => void;
}

export const ConnectionPointLayer: React.FC<ConnectionPointLayerProps> = ({
  elements,
  hoveredConnectionPoint,
  onConnectionPointHover,
  onConnectionPointClick
}) => {
  return (
    <Group>
      {elements.map((element) => (
        <ConnectionPoints
          key={element.id}
          element={element}
          visible={true}
          hoveredPointId={hoveredConnectionPoint}
          onPointHover={onConnectionPointHover}
          onPointClick={onConnectionPointClick}
        />
      ))}
    </Group>
  );
};

// Smart connection indicators that show when dragging connectors
export const SmartConnectionIndicators: React.FC<{
  targetElement: CanvasElement;
  currentPoint: { x: number; y: number };
  snapDistance: number;
}> = ({
  targetElement,
  currentPoint,
  snapDistance = 20
}) => {
  const connectionPoints = [
    {
      x: targetElement.x + targetElement.width / 2,
      y: targetElement.y,
      direction: 'top'
    },
    {
      x: targetElement.x + targetElement.width,
      y: targetElement.y + targetElement.height / 2,
      direction: 'right'
    },
    {
      x: targetElement.x + targetElement.width / 2,
      y: targetElement.y + targetElement.height,
      direction: 'bottom'
    },
    {
      x: targetElement.x,
      y: targetElement.y + targetElement.height / 2,
      direction: 'left'
    }
  ];

  // Find closest connection point
  let closestPoint = connectionPoints[0];
  let minDistance = Math.sqrt(
    Math.pow(currentPoint.x - closestPoint.x, 2) + 
    Math.pow(currentPoint.y - closestPoint.y, 2)
  );

  connectionPoints.forEach(point => {
    const distance = Math.sqrt(
      Math.pow(currentPoint.x - point.x, 2) + 
      Math.pow(currentPoint.y - point.y, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  });

  const isInSnapRange = minDistance <= snapDistance;

  return (
    <Group>
      {/* Highlight target element */}
      <Circle
        x={targetElement.x + targetElement.width / 2}
        y={targetElement.y + targetElement.height / 2}
        radius={Math.max(targetElement.width, targetElement.height) / 2 + 10}
        stroke={isInSnapRange ? '#00ff00' : '#0066ff'}
        strokeWidth={2}
        dash={[5, 5]}
        listening={false}
        perfectDrawEnabled={false}
      />
      
      {/* Show connection points */}
      {connectionPoints.map((point, index) => (
        <Circle
          key={index}
          x={point.x}
          y={point.y}
          radius={point === closestPoint && isInSnapRange ? 8 : 4}
          fill={point === closestPoint && isInSnapRange ? '#00ff00' : '#ffffff'}
          stroke={point === closestPoint && isInSnapRange ? '#00ff00' : '#0066ff'}
          strokeWidth={2}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
      
      {/* Snap line */}
      {isInSnapRange && (
        <Group>
          <Circle
            x={currentPoint.x}
            y={currentPoint.y}
            radius={3}
            fill="#00ff00"
            listening={false}
            perfectDrawEnabled={false}
          />
          <Circle
            x={closestPoint.x}
            y={closestPoint.y}
            radius={3}
            fill="#00ff00"
            listening={false}
            perfectDrawEnabled={false}
          />
        </Group>
      )}
    </Group>
  );
};

// Auto-routing for connectors
export const ConnectorPath: React.FC<{
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  startElement?: CanvasElement;
  endElement?: CanvasElement;
  pathType: 'straight' | 'curved' | 'stepped';
  avoidElements?: CanvasElement[];
}> = ({
  startPoint,
  endPoint,
  startElement,
  endElement,
  pathType = 'straight',
  avoidElements = []
}) => {
  const calculatePath = () => {
    switch (pathType) {
      case 'straight':
        return [startPoint.x, startPoint.y, endPoint.x, endPoint.y];
        
      case 'curved':
        // Simple bezier curve
        const midX = (startPoint.x + endPoint.x) / 2;
        const midY = (startPoint.y + endPoint.y) / 2;
        const controlOffset = 50;
        
        return [
          startPoint.x, startPoint.y,
          startPoint.x + controlOffset, startPoint.y,
          endPoint.x - controlOffset, endPoint.y,
          endPoint.x, endPoint.y
        ];
        
      case 'stepped':
        // Right-angle path
        const stepX = startPoint.x + (endPoint.x - startPoint.x) / 2;
        return [
          startPoint.x, startPoint.y,
          stepX, startPoint.y,
          stepX, endPoint.y,
          endPoint.x, endPoint.y
        ];
        
      default:
        return [startPoint.x, startPoint.y, endPoint.x, endPoint.y];
    }
  };

  const points = calculatePath();

  return (
    <Group>
      {/* Main connector line */}
      {pathType === 'curved' ? (
        // Bezier curve would need custom implementation
        <path
          d={`M ${points[0]} ${points[1]} C ${points[2]} ${points[3]} ${points[4]} ${points[5]} ${points[6]} ${points[7]}`}
        />
      ) : (
        <line
          x1={points[0]}
          y1={points[1]}
          x2={points[2]}
          y2={points[3]}
          stroke="#0066ff"
          strokeWidth={2}
        />
      )}
      
      {/* Connection indicators */}
      <Circle
        x={startPoint.x}
        y={startPoint.y}
        radius={4}
        fill="#00ff00"
        listening={false}
        perfectDrawEnabled={false}
      />
      <Circle
        x={endPoint.x}
        y={endPoint.y}
        radius={4}
        fill="#ff0000"
        listening={false}
        perfectDrawEnabled={false}
      />
    </Group>
  );
};

export default ConnectionPoints;
