/**
 * Connector Shape - Renders a single connector element
 * 
 * Part of LibreOllama Canvas Coordinate System Fixes - Priority 2
 */
import React from 'react';
import { Line, Path } from 'react-konva';
import type { ConnectorElement } from '../../types/enhanced.types';

interface ConnectorShapeProps {
  connector: ConnectorElement;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const ConnectorShape: React.FC<ConnectorShapeProps> = ({ 
  connector, 
  isSelected = false,
  onSelect 
}) => {  // Build path points for Konva Line component
  const buildPathPoints = (): number[] => {
    const points: number[] = [];
    
    // Start point
    points.push(connector.startPoint.x, connector.startPoint.y);
    
    // Intermediate points
    if (connector.intermediatePoints) {
      connector.intermediatePoints.forEach(point => {
        points.push(point.x, point.y);
      });
    }
    
    // End point
    points.push(connector.endPoint.x, connector.endPoint.y);
    
    return points;
  };
  // Build SVG path for curved connectors
  const buildSVGPath = (): string => {
    if (connector.subType !== 'curved' || !connector.intermediatePoints || connector.intermediatePoints.length < 2) {
      return '';
    }
    
    const start = connector.startPoint;
    const end = connector.endPoint;
    const control1 = connector.intermediatePoints[0];
    const control2 = connector.intermediatePoints[1];
    
    if (!control1 || !control2) {
      return '';
    }
    
    return `M ${start.x} ${start.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`;
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    }
  };
  // Render based on connector subType
  if (connector.subType === 'curved' && connector.intermediatePoints && connector.intermediatePoints.length >= 2) {
    return (
      <Path
        data={buildSVGPath()}
        stroke={connector.stroke || '#333'}
        strokeWidth={connector.strokeWidth || 2}
        fill=""
        lineCap="round"
        lineJoin="round"
        onClick={handleClick}
        onTap={handleClick}
        // Visual feedback for selection
        shadowEnabled={isSelected}
        shadowColor="blue"
        shadowBlur={isSelected ? 5 : 0}
        shadowOpacity={isSelected ? 0.5 : 0}
        // Increase hit area for easier selection
        hitStrokeWidth={Math.max(10, (connector.strokeWidth || 2) + 6)}
      />
    );
  }

  // For straight and bent connectors, use Line component
  return (
    <Line
      points={buildPathPoints()}
      stroke={connector.stroke || '#333'}
      strokeWidth={connector.strokeWidth || 2}
      lineCap="round"
      lineJoin="round"
      onClick={handleClick}
      onTap={handleClick}
      // Visual feedback for selection
      shadowEnabled={isSelected}
      shadowColor="blue"
      shadowBlur={isSelected ? 5 : 0}
      shadowOpacity={isSelected ? 0.5 : 0}
      // Increase hit area for easier selection
      hitStrokeWidth={Math.max(10, (connector.strokeWidth || 2) + 6)}
    />
  );
};

export default ConnectorShape;
