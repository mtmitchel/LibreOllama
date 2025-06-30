/**
 * WashiTapeTool - Decorative pattern drawing tool
 * Provides FigJam-style washi tape functionality with various patterns
 */

import React, { useRef, useCallback, useState } from 'react';
import { Line, Group, Circle, Rect, Path } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { StrokeManager } from '../../../systems/StrokeManager';
import { WashiTapeElement } from '../../../types/enhanced.types';
import { StrokePoint, WashiTapeConfig, WashiPattern } from '../../../types/drawing.types';
import { nanoid } from 'nanoid';

interface WashiTapeToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  strokeStyle: WashiTapeConfig;
}

export const WashiTapeTool: React.FC<WashiTapeToolProps> = ({
  stageRef,
  isActive,
  strokeStyle
}) => {
  const strokeManager = useRef(new StrokeManager({
    smoothingLevel: 0.4, // Moderate smoothing for decorative effect
    simplificationTolerance: 3.0 // More simplification for patterns
  }));
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [patternElements, setPatternElements] = useState<JSX.Element[]>([]);
  
  // Store actions
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  
  // Generate pattern elements along the path
  const generatePatternElements = useCallback((points: number[], pattern: WashiPattern) => {
    if (points.length < 4) return [];
    
    const elements: JSX.Element[] = [];
    const pathLength = calculatePathLength(points);
    const numPatterns = Math.max(1, Math.floor(pathLength / 20)); // Pattern every 20 units
    
    for (let i = 0; i < numPatterns; i++) {
      const t = i / Math.max(1, numPatterns - 1);
      const position = interpolateAlongPath(points, t);
      const angle = calculateAngleAtPosition(points, t);
      
      if (!position) continue;
      
      const patternElement = createPatternElement(
        pattern,
        position,
        angle,
        strokeStyle,
        `pattern-${i}`
      );
      
      if (patternElement) {
        elements.push(patternElement);
      }
    }
    
    return elements;
  }, [strokeStyle]);
  
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || e.target !== stageRef.current) return;
    
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition()!;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    const point: StrokePoint = {
      x: pos.x,
      y: pos.y,
      pressure: e.evt.pressure || 0.5,
      timestamp: Date.now()
    };
    
    strokeManager.current.startRecording(point);
    setIsDrawing(true);
    setCurrentPoints([pos.x, pos.y]);
    setPatternElements([]);
    
    // Change cursor
    stage.container().style.cursor = 'crosshair';
    
    console.log('🎨 [WashiTapeTool] Started washi tape at:', pos);
  }, [isActive, stageRef]);
  
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isDrawing || !isActive) return;
    
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition()!;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    const point: StrokePoint = {
      x: pos.x,
      y: pos.y,
      pressure: e.evt.pressure || 0.5,
      timestamp: Date.now()
    };
    
    strokeManager.current.addPoint(point);
    
    // Get current preview points
    const previewPoints = strokeManager.current.getCurrentPoints();
    setCurrentPoints(previewPoints);
    
    // Generate pattern preview
    const patterns = generatePatternElements(previewPoints, strokeStyle.pattern);
    setPatternElements(patterns);
  }, [isDrawing, isActive, stageRef, strokeStyle.pattern, generatePatternElements]);
  
  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    
    const smoothedPoints = strokeManager.current.finishRecording();
    const rawPoints = strokeManager.current.getRawPoints();
    
    if (smoothedPoints.length >= 4) { // At least 2 points
      const washiTapeElement: WashiTapeElement = {
        id: nanoid(),
        type: 'washi-tape',
        points: smoothedPoints,
        x: 0, // Washi tape uses absolute coordinates in points
        y: 0,
        pattern: strokeStyle.pattern,
        style: {
          primaryColor: strokeStyle.primaryColor,
          secondaryColor: strokeStyle.secondaryColor,
          width: strokeStyle.width,
          opacity: strokeStyle.opacity,
          patternScale: 1.0
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };
      
      addElement(washiTapeElement);
      
      console.log('🎨 [WashiTapeTool] Created washi tape:', {
        id: washiTapeElement.id,
        pointCount: smoothedPoints.length / 2,
        pattern: washiTapeElement.pattern.type
      });
    }
    
    setIsDrawing(false);
    setCurrentPoints([]);
    setPatternElements([]);
    
    // Auto-switch to select after drawing
    setSelectedTool('select');
    
    // Reset cursor
    if (stageRef.current) {
      stageRef.current.container().style.cursor = 'default';
    }
  }, [isDrawing, strokeStyle, addElement, setSelectedTool, stageRef]);
  
  // Handle pointer cancel
  const handlePointerCancel = useCallback(() => {
    if (isDrawing) {
      strokeManager.current.cancelRecording();
      setIsDrawing(false);
      setCurrentPoints([]);
      setPatternElements([]);
      
      if (stageRef.current) {
        stageRef.current.container().style.cursor = 'default';
      }
    }
  }, [isDrawing, stageRef]);
  
  // Event listeners
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    
    stage.on('pointerdown', handlePointerDown);
    stage.on('pointermove', handlePointerMove);
    stage.on('pointerup', handlePointerUp);
    stage.on('pointercancel', handlePointerCancel);
    
    return () => {
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerup', handlePointerUp);
      stage.off('pointercancel', handlePointerCancel);
    };
  }, [isActive, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel]);
  
  if (!isActive) return null;
  
  return (
    <Group listening={false}>
      {/* Base tape line */}
      {isDrawing && currentPoints.length >= 4 && (
        <Line
          points={currentPoints}
          stroke={strokeStyle.primaryColor}
          strokeWidth={strokeStyle.width}
          opacity={strokeStyle.opacity * 0.8}
          lineCap="round"
          lineJoin="round"
          tension={0.3}
          listening={false}
          perfectDrawEnabled={false}
          shadowEnabled={false}
        />
      )}
      
      {/* Pattern elements */}
      {isDrawing && patternElements}
    </Group>
  );
};

// Helper functions for pattern generation
function calculatePathLength(points: number[]): number {
  let length = 0;
  for (let i = 2; i < points.length; i += 2) {
    const dx = points[i] - points[i - 2];
    const dy = points[i + 1] - points[i - 1];
    length += Math.hypot(dx, dy);
  }
  return length;
}

function interpolateAlongPath(points: number[], t: number): { x: number; y: number } | null {
  if (points.length < 4) return null;
  
  const targetLength = t * calculatePathLength(points);
  let currentLength = 0;
  
  for (let i = 2; i < points.length; i += 2) {
    const x1 = points[i - 2];
    const y1 = points[i - 1];
    const x2 = points[i];
    const y2 = points[i + 1];
    
    const segmentLength = Math.hypot(x2 - x1, y2 - y1);
    
    if (currentLength + segmentLength >= targetLength) {
      // Interpolate within this segment
      const segmentT = (targetLength - currentLength) / segmentLength;
      return {
        x: x1 + (x2 - x1) * segmentT,
        y: y1 + (y2 - y1) * segmentT
      };
    }
    
    currentLength += segmentLength;
  }
  
  // Return last point if we've gone past the end
  return {
    x: points[points.length - 2],
    y: points[points.length - 1]
  };
}

function calculateAngleAtPosition(points: number[], t: number): number {
  if (points.length < 4) return 0;
  
  // Find the segment and calculate direction
  const position = interpolateAlongPath(points, t);
  if (!position) return 0;
  
  // Look ahead and behind for direction
  const ahead = interpolateAlongPath(points, Math.min(1, t + 0.01));
  const behind = interpolateAlongPath(points, Math.max(0, t - 0.01));
  
  if (!ahead || !behind) return 0;
  
  return Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
}

function createPatternElement(
  pattern: WashiPattern,
  position: { x: number; y: number },
  angle: number,
  style: WashiTapeConfig,
  key: string
): JSX.Element | null {
  const { x, y } = position;
  
  switch (pattern.type) {
    case 'dots':
      return (
        <Circle
          key={key}
          x={x}
          y={y}
          radius={pattern.radius}
          fill={style.secondaryColor}
          opacity={style.opacity * 0.8}
          listening={false}
        />
      );
      
    case 'stripes':
      const stripeAngle = angle + (pattern.angle * Math.PI / 180);
      const stripeLength = style.width * 0.8;
      const cos = Math.cos(stripeAngle);
      const sin = Math.sin(stripeAngle);
      
      return (
        <Line
          key={key}
          points={[
            x - cos * stripeLength / 2,
            y - sin * stripeLength / 2,
            x + cos * stripeLength / 2,
            y + sin * stripeLength / 2
          ]}
          stroke={style.secondaryColor}
          strokeWidth={pattern.width}
          opacity={style.opacity * 0.6}
          listening={false}
        />
      );
      
    case 'zigzag':
      const zigzagPoints = [];
      const segments = 4;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const offsetY = Math.sin(t * Math.PI * pattern.frequency) * pattern.amplitude;
        const offsetX = (t - 0.5) * style.width * 0.6;
        
        const cos2 = Math.cos(angle);
        const sin2 = Math.sin(angle);
        
        zigzagPoints.push(
          x + offsetX * cos2 - offsetY * sin2,
          y + offsetX * sin2 + offsetY * cos2
        );
      }
      
      return (
        <Line
          key={key}
          points={zigzagPoints}
          stroke={style.secondaryColor}
          strokeWidth={2}
          opacity={style.opacity * 0.7}
          listening={false}
        />
      );
      
    case 'geometric':
      if (pattern.shape === 'triangles') {
        const size = pattern.size;
        const cos3 = Math.cos(angle);
        const sin3 = Math.sin(angle);
        
        const points = [
          x - size * cos3, y - size * sin3,
          x + size * cos3, y + size * sin3,
          x - size * sin3, y + size * cos3,
          x - size * cos3, y - size * sin3
        ];
        
        return (
          <Line
            key={key}
            points={points}
            stroke={style.secondaryColor}
            strokeWidth={1.5}
            fill={style.secondaryColor}
            opacity={style.opacity * 0.5}
            listening={false}
            closed={true}
          />
        );
      }
      break;
      
    case 'floral':
      // Simple flower shape
      const petalCount = 5;
      const petalSize = pattern.scale * 3;
      const flowerPoints = [];
      
      for (let i = 0; i <= petalCount * 2; i++) {
        const petalAngle = (i / petalCount) * Math.PI;
        const radius = (i % 2 === 0) ? petalSize : petalSize * 0.5;
        flowerPoints.push(
          x + Math.cos(petalAngle + angle) * radius,
          y + Math.sin(petalAngle + angle) * radius
        );
      }
      
      return (
        <Line
          key={key}
          points={flowerPoints}
          stroke={style.secondaryColor}
          strokeWidth={1}
          fill={style.secondaryColor}
          opacity={style.opacity * 0.6}
          listening={false}
          closed={true}
        />
      );
  }
  
  return null;
}

export default WashiTapeTool; 