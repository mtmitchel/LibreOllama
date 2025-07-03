/**
 * Enhanced Connector Shape - Optimized with Performance & Validation
 * 
 * CRITICAL FIXES:
 * - Fixed position reset issues causing connectors to disappear
 * - Added proper validation and constraints for connector operations
 * - Implemented performance optimizations with memoization
 * - Enhanced error handling and state management
 */
import React, { useCallback, useMemo, useRef } from 'react';
import { Line, Path, Arrow, Circle, Group } from 'react-konva';
import Konva from 'konva';
import type { ConnectorElement } from '../../types/enhanced.types';

interface ConnectorShapeProps {
  connector: ConnectorElement;
  isSelected?: boolean;
  onSelect?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onUpdate?: (updates: Partial<ConnectorElement>) => void;
}

// Performance constants
const MIN_CONNECTOR_LENGTH = 20;
const MAX_CONNECTOR_LENGTH = 2000;
const HANDLE_RADIUS = 6;
const HIT_STROKE_WIDTH = 20;

export const ConnectorShape: React.FC<ConnectorShapeProps> = ({ 
  connector, 
  isSelected = false,
  onSelect,
  onUpdate
}) => {
  // Refs for performance optimization
  const lastUpdateRef = useRef<number>(0);
  const throttleDelayRef = useRef<number>(16); // 60fps throttling

  // Memoized path calculation for performance
  const pathData = useMemo(() => {
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
    
    return {
      points,
      length: calculateConnectorLength(points),
      isValid: points.length >= 4,
    };
  }, [connector.startPoint, connector.endPoint, connector.intermediatePoints]);

  // Memoized SVG path for curved connectors
  const svgPath = useMemo(() => {
    if (connector.subType !== 'curved' || !connector.intermediatePoints || connector.intermediatePoints.length < 2) {
      return '';
    }
    
    const start = connector.startPoint;
    const end = connector.endPoint;
    const control1 = connector.intermediatePoints[0];
    const control2 = connector.intermediatePoints[1];
    
    if (!control1 || !control2) return '';
    
    return `M ${start.x} ${start.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`;
  }, [connector.subType, connector.startPoint, connector.endPoint, connector.intermediatePoints]);

  // Memoized arrow configuration
  const arrowConfig = useMemo(() => {
    const hasEndArrow = connector.subType === 'arrow' || 
                        connector.connectorStyle?.endArrow !== 'none' ||
                        (connector.connectorStyle as any)?.hasEndArrow === true;
    
    const hasStartArrow = connector.connectorStyle?.startArrow !== 'none' ||
                          (connector.connectorStyle as any)?.hasStartArrow === true;

    const arrowSize = connector.connectorStyle?.arrowSize || 10;

    return { hasEndArrow, hasStartArrow, arrowSize };
  }, [connector.subType, connector.connectorStyle]);

  // Optimized validation function
  const validateConnectorUpdate = useCallback((updates: Partial<ConnectorElement>): boolean => {
    if (!updates.startPoint && !updates.endPoint) return true;
    
    const start = updates.startPoint || connector.startPoint;
    const end = updates.endPoint || connector.endPoint;
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + 
      Math.pow(end.y - start.y, 2)
    );
    
    return distance >= MIN_CONNECTOR_LENGTH && distance <= MAX_CONNECTOR_LENGTH;
  }, [connector.startPoint, connector.endPoint]);

  // Throttled update function for performance
  const throttledUpdate = useCallback((updates: Partial<ConnectorElement>) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < throttleDelayRef.current) {
      return;
    }
    
    if (!validateConnectorUpdate(updates)) {
      console.warn('[ConnectorShape] Invalid connector update rejected:', updates);
      return;
    }
    
    lastUpdateRef.current = now;
    onUpdate?.(updates);
  }, [onUpdate, validateConnectorUpdate]);

  // CRITICAL FIX: Optimized connector drag without position reset
  const handleConnectorDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (!onUpdate) return;
    
    const dx = e.target.x();
    const dy = e.target.y();
    
    // Only update if actually moved to prevent unnecessary renders
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    
    // Batch update for performance - update all points at once
    const updates: Partial<ConnectorElement> = {
      startPoint: {
        ...connector.startPoint,
        x: connector.startPoint.x + dx,
        y: connector.startPoint.y + dy
      },
      endPoint: {
        ...connector.endPoint,
        x: connector.endPoint.x + dx,
        y: connector.endPoint.y + dy
      }
    };
    
    // Update intermediate points if they exist
    if (connector.intermediatePoints && connector.intermediatePoints.length > 0) {
      updates.intermediatePoints = connector.intermediatePoints.map(point => ({
        x: point.x + dx,
        y: point.y + dy
      }));
    }
    
    // Update path points if they exist
    if (connector.pathPoints && connector.pathPoints.length > 0) {
      updates.pathPoints = [];
      for (let i = 0; i < connector.pathPoints.length; i += 2) {
        updates.pathPoints.push(connector.pathPoints[i] + dx);
        updates.pathPoints.push(connector.pathPoints[i + 1] + dy);
      }
    }
    
    throttledUpdate(updates);
    
    // CRITICAL FIX: Reset position smoothly without causing visual glitches
    requestAnimationFrame(() => {
      e.target.position({ x: 0, y: 0 });
    });
  }, [connector, throttledUpdate]);

  // Enhanced endpoint drag with constraints
  const handleEndpointDrag = useCallback((
    e: Konva.KonvaEventObject<DragEvent>,
    isStartPoint: boolean
  ) => {
    if (!onUpdate) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    // Get absolute position with proper stage coordinate conversion
    const pos = e.target.getAbsolutePosition();
    
    // Calculate distance to other point for validation
    const otherPoint = isStartPoint ? connector.endPoint : connector.startPoint;
    const dx = pos.x - otherPoint.x;
    const dy = pos.y - otherPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Constrain to minimum length
    if (distance < MIN_CONNECTOR_LENGTH) {
      const scale = MIN_CONNECTOR_LENGTH / distance;
      pos.x = otherPoint.x + dx * scale;
      pos.y = otherPoint.y + dy * scale;
      e.target.setAbsolutePosition(pos);
    }
    
    // Constrain to maximum length
    if (distance > MAX_CONNECTOR_LENGTH) {
      const scale = MAX_CONNECTOR_LENGTH / distance;
      pos.x = otherPoint.x + dx * scale;
      pos.y = otherPoint.y + dy * scale;
      e.target.setAbsolutePosition(pos);
    }
    
    // Prepare optimized update
    const updates: Partial<ConnectorElement> = isStartPoint ? {
      startPoint: { ...connector.startPoint, x: pos.x, y: pos.y }
    } : {
      endPoint: { ...connector.endPoint, x: pos.x, y: pos.y }
    };
    
    // Recalculate path if needed
    if (connector.pathPoints && connector.pathPoints.length > 4) {
      const newPath = [...connector.pathPoints];
      if (isStartPoint) {
        newPath[0] = pos.x;
        newPath[1] = pos.y;
      } else {
        newPath[newPath.length - 2] = pos.x;
        newPath[newPath.length - 1] = pos.y;
      }
      updates.pathPoints = newPath;
    }
    
    throttledUpdate(updates);
  }, [connector, throttledUpdate]);

  // Optimized click handler
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect?.(e);
  }, [onSelect]);

  // Memoized common properties for performance
  const commonProps = useMemo(() => ({
    id: connector.id,
    name: connector.id,
    listening: true,
    stroke: connector.stroke || connector.connectorStyle?.strokeColor || '#333',
    strokeWidth: connector.strokeWidth || connector.connectorStyle?.strokeWidth || 2,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    onClick: handleClick,
    onTap: handleClick,
    // Enhanced visual feedback for selection
    shadowEnabled: isSelected,
    shadowColor: "#3B82F6",
    shadowBlur: isSelected ? 8 : 0,
    shadowOpacity: isSelected ? 0.6 : 0,
    // Improved hit area for easier selection
    hitStrokeWidth: Math.max(HIT_STROKE_WIDTH, (connector.strokeWidth || 2) + 8),
  }), [connector, isSelected, handleClick]);

  // Render the main connector shape with optimization
  const renderConnectorShape = useCallback(() => {
    if (!pathData.isValid) {
      console.warn('[ConnectorShape] Invalid path data:', pathData);
      return null;
    }

    // For curved connectors, use Path component
    if (connector.subType === 'curved' && svgPath) {
      return (
        <Path
          data={svgPath}
          fill=""
          {...commonProps}
        />
      );
    }

    // For connectors with arrows
    if (arrowConfig.hasEndArrow || arrowConfig.hasStartArrow) {
      // Simple two-point connector with end arrow - use Arrow component
      if (pathData.points.length === 4 && arrowConfig.hasEndArrow && !arrowConfig.hasStartArrow) {
        return (
          <Arrow
            points={pathData.points}
            fill={commonProps.stroke}
            pointerLength={arrowConfig.arrowSize}
            pointerWidth={arrowConfig.arrowSize}
            {...commonProps}
          />
        );
      }
      
      // Complex cases fall back to line
      return (
        <Line
          points={pathData.points}
          {...commonProps}
        />
      );
    }

    // Standard line connector
    return (
      <Line
        points={pathData.points}
        {...commonProps}
      />
    );
  }, [pathData, connector.subType, svgPath, arrowConfig, commonProps]);

  // Render endpoint handles with enhanced styling
  const renderEndpointHandles = useCallback(() => {
    if (!isSelected || !onUpdate) return null;

    const handleProps = {
      radius: HANDLE_RADIUS,
      fill: "#3B82F6",
      stroke: "#ffffff",
      strokeWidth: 2,
      draggable: true,
      shadowEnabled: true,
      shadowColor: "#000000",
      shadowBlur: 4,
      shadowOpacity: 0.3,
    };

    return (
      <>
        {/* Start point handle */}
        <Circle
          x={connector.startPoint.x}
          y={connector.startPoint.y}
          {...handleProps}
          onDragMove={(e) => handleEndpointDrag(e, true)}
          onDragEnd={(e) => handleEndpointDrag(e, true)}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'grab';
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'default';
          }}
        />
        
        {/* End point handle */}
        <Circle
          x={connector.endPoint.x}
          y={connector.endPoint.y}
          {...handleProps}
          onDragMove={(e) => handleEndpointDrag(e, false)}
          onDragEnd={(e) => handleEndpointDrag(e, false)}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'grab';
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'default';
          }}
        />
        
        {/* Selection outline */}
        <Line
          points={pathData.points}
          stroke="#3B82F6"
          strokeWidth={1}
          dash={[4, 4]}
          opacity={0.8}
          listening={false}
        />
      </>
    );
  }, [isSelected, onUpdate, connector.startPoint, connector.endPoint, pathData.points, handleEndpointDrag]);

  return (
    <Group
      id={connector.id}
      name={connector.id}
      listening={true}
      draggable={isSelected && !!onUpdate}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleConnectorDrag}
      onMouseEnter={(e) => {
        if (isSelected && onUpdate) {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'move';
        }
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'default';
      }}
    >
      {/* Main connector shape */}
      {renderConnectorShape()}
      
      {/* Endpoint handles (only when selected) */}
      {renderEndpointHandles()}
    </Group>
  );
};

// Utility function for connector length calculation
function calculateConnectorLength(points: number[]): number {
  let length = 0;
  for (let i = 2; i < points.length; i += 2) {
    const dx = points[i] - points[i - 2];
    const dy = points[i + 1] - points[i - 1];
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

export default ConnectorShape;
