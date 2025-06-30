/**
 * StrokeRenderer - Advanced renderer for all drawing types
 * Handles marker, highlighter, and washi tape elements with LOD support
 */

import React from 'react';
import { Line, Shape, Group, Circle, Path } from 'react-konva';
import Konva from 'konva';
import { 
  MarkerElement, 
  HighlighterElement, 
  WashiTapeElement,
  isMarkerElement,
  isHighlighterElement,
  isWashiTapeElement
} from '../../types/enhanced.types';
import { StrokeLOD } from '../../types/drawing.types';

interface StrokeRendererProps {
  element: MarkerElement | HighlighterElement | WashiTapeElement;
  isSelected: boolean;
  onSelect: () => void;
  isEditing: boolean;
  lodLevel?: StrokeLOD;
  zoomLevel?: number;
}

export const StrokeRenderer: React.FC<StrokeRendererProps> = React.memo(({
  element,
  isSelected,
  onSelect,
  isEditing,
  lodLevel,
  zoomLevel = 1
}) => {
  // Determine actual LOD level based on zoom and settings
  const actualLOD = React.useMemo(() => {
    if (lodLevel) return lodLevel;
    
    // Auto-determine LOD based on zoom level
    if (zoomLevel >= 1.5) return { level: 'high', pointReduction: 1, styleSimplification: false, useCache: false };
    if (zoomLevel >= 0.5) return { level: 'medium', pointReduction: 2, styleSimplification: false, useCache: true };
    if (zoomLevel >= 0.1) return { level: 'low', pointReduction: 4, styleSimplification: true, useCache: true };
    return { level: 'hidden', pointReduction: 8, styleSimplification: true, useCache: true };
  }, [lodLevel, zoomLevel]);
  
  // Skip rendering if hidden LOD and not selected
  if (actualLOD.level === 'hidden' && !isSelected) {
    return null;
  }
  
  // Render based on element type
  if (isMarkerElement(element)) {
    return renderMarker(element, isSelected, onSelect, isEditing, actualLOD);
  } else if (isHighlighterElement(element)) {
    return renderHighlighter(element, isSelected, onSelect, isEditing, actualLOD);
  } else if (isWashiTapeElement(element)) {
    return renderWashiTape(element, isSelected, onSelect, isEditing, actualLOD);
  }
  
  return null;
});

StrokeRenderer.displayName = 'StrokeRenderer';

// Marker rendering
function renderMarker(
  marker: MarkerElement, 
  isSelected: boolean, 
  onSelect: () => void, 
  isEditing: boolean,
  lod: StrokeLOD
) {
  // Apply LOD point reduction
  const points = applyPointReduction(marker.points, lod.pointReduction);
  
  // Variable width rendering
  if (marker.style.widthVariation && marker.rawPoints && lod.level === 'high') {
    return (
      <Group>
        <VariableWidthStroke
          points={marker.rawPoints}
          style={marker.style}
          isSelected={isSelected}
          onSelect={onSelect}
          simplification={lod.styleSimplification}
        />
        {isSelected && <SelectionIndicator element={marker} />}
      </Group>
    );
  }
  
  // Standard uniform width stroke
  const strokeWidth = lod.styleSimplification ? 
    Math.max(1, marker.style.width * 0.7) : 
    marker.style.width;
  
  return (
    <Group>
      <Line
        points={points}
        stroke={marker.style.color}
        strokeWidth={strokeWidth}
        opacity={marker.style.opacity}
        lineCap={marker.style.lineCap}
        lineJoin={marker.style.lineJoin}
        tension={lod.styleSimplification ? 0.2 : marker.style.smoothness * 0.5}
        onClick={onSelect}
        onTap={onSelect}
        hitStrokeWidth={Math.max(strokeWidth + 10, 15)}
        shadowBlur={isSelected ? 10 : 0}
        shadowColor={isSelected ? '#3B82F6' : undefined}
        shadowOpacity={isSelected ? 0.6 : 0}
        perfectDrawEnabled={lod.level === 'high'}
        shadowEnabled={isSelected && lod.level !== 'low'}
      />
      {isSelected && <SelectionIndicator element={marker} />}
    </Group>
  );
}

// Highlighter rendering
function renderHighlighter(
  highlighter: HighlighterElement, 
  isSelected: boolean, 
  onSelect: () => void, 
  isEditing: boolean,
  lod: StrokeLOD
) {
  const points = applyPointReduction(highlighter.points, lod.pointReduction);
  
  const strokeWidth = lod.styleSimplification ? 
    Math.max(3, highlighter.style.width * 0.8) : 
    highlighter.style.width;
  
  return (
    <Group>
      <Line
        points={points}
        stroke={highlighter.style.color}
        strokeWidth={strokeWidth}
        opacity={highlighter.style.baseOpacity}
        lineCap="round"
        lineJoin="round"
        tension={lod.styleSimplification ? 0.1 : 0.3}
        globalCompositeOperation={lod.styleSimplification ? 'source-over' : highlighter.style.blendMode}
        onClick={onSelect}
        onTap={onSelect}
        hitStrokeWidth={Math.max(strokeWidth + 10, 20)}
        shadowBlur={isSelected ? 8 : 0}
        shadowColor={isSelected ? highlighter.style.color : undefined}
        shadowOpacity={isSelected ? 0.4 : 0}
        perfectDrawEnabled={lod.level === 'high'}
        shadowEnabled={isSelected && lod.level !== 'low'}
      />
      {isSelected && <SelectionIndicator element={highlighter} />}
    </Group>
  );
}

// Washi tape rendering
function renderWashiTape(
  washi: WashiTapeElement, 
  isSelected: boolean, 
  onSelect: () => void, 
  isEditing: boolean,
  lod: StrokeLOD
) {
  const points = applyPointReduction(washi.points, lod.pointReduction);
  
  if (lod.level === 'low' || lod.styleSimplification) {
    // Simplified rendering - just the base line
    return (
      <Group>
        <Line
          points={points}
          stroke={washi.style.primaryColor}
          strokeWidth={washi.style.width}
          opacity={washi.style.opacity}
          dash={[10, 5]}
          onClick={onSelect}
          onTap={onSelect}
          hitStrokeWidth={washi.style.width + 15}
          shadowBlur={isSelected ? 6 : 0}
          shadowColor={isSelected ? washi.style.primaryColor : undefined}
          perfectDrawEnabled={false}
        />
        {isSelected && <SelectionIndicator element={washi} />}
      </Group>
    );
  }
  
  // Full pattern rendering for high LOD
  return (
    <Group onClick={onSelect} onTap={onSelect}>
      {/* Base tape */}
      <Line
        points={points}
        stroke={washi.style.primaryColor}
        strokeWidth={washi.style.width}
        opacity={washi.style.opacity}
        lineCap="round"
        lineJoin="round"
        tension={0.3}
        listening={false}
      />
      
      {/* Pattern overlay */}
      <WashiPatternOverlay
        points={points}
        pattern={washi.pattern}
        style={washi.style}
        listening={false}
      />
      
      {isSelected && <SelectionIndicator element={washi} />}
    </Group>
  );
}

// Variable width stroke component
const VariableWidthStroke: React.FC<{
  points: any[];
  style: MarkerElement['style'];
  isSelected: boolean;
  onSelect: () => void;
  simplification: boolean;
}> = ({ points, style, isSelected, onSelect, simplification }) => {
  const pathData = React.useMemo(() => {
    if (simplification || points.length < 3) {
      // Fallback to simple line
      return null;
    }
    
    // Generate SVG path data for variable width
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const width = style.minWidth + (style.maxWidth - style.minWidth) * (point.pressure || 0.5);
      
      // This is a simplified approach - real implementation would use
      // more sophisticated variable width path generation
      path += ` L ${point.x} ${point.y}`;
    }
    
    return path;
  }, [points, style, simplification]);
  
  // Fallback to simple line if path generation fails
  if (!pathData) {
    const flatPoints = points.flatMap(p => [p.x, p.y]);
    return (
      <Line
        points={flatPoints}
        stroke={style.color}
        strokeWidth={(style.minWidth + style.maxWidth) / 2}
        opacity={style.opacity}
        lineCap={style.lineCap}
        lineJoin={style.lineJoin}
        onClick={onSelect}
        onTap={onSelect}
        shadowBlur={isSelected ? 10 : 0}
        shadowColor={isSelected ? '#3B82F6' : undefined}
      />
    );
  }
  
  return (
    <Path
      data={pathData}
      stroke={style.color}
      strokeWidth={2}
      opacity={style.opacity}
      lineCap={style.lineCap}
      lineJoin={style.lineJoin}
      onClick={onSelect}
      onTap={onSelect}
      shadowBlur={isSelected ? 10 : 0}
      shadowColor={isSelected ? '#3B82F6' : undefined}
    />
  );
};

// Washi tape pattern overlay
const WashiPatternOverlay: React.FC<{
  points: number[];
  pattern: WashiTapeElement['pattern'];
  style: WashiTapeElement['style'];
  listening: boolean;
}> = ({ points, pattern, style, listening }) => {
  const patternElements = React.useMemo(() => {
    const elements: JSX.Element[] = [];
    const pathLength = calculatePathLength(points);
    const spacing = 20; // Pattern spacing
    const numPatterns = Math.floor(pathLength / spacing);
    
    for (let i = 0; i < numPatterns; i++) {
      const t = i / Math.max(1, numPatterns - 1);
      const position = interpolateAlongPath(points, t);
      if (!position) continue;
      
      const element = createPatternElement(pattern, position, style, `pattern-${i}`);
      if (element) {
        elements.push(element);
      }
    }
    
    return elements;
  }, [points, pattern, style]);
  
  return (
    <Group listening={listening}>
      {patternElements}
    </Group>
  );
};

// Selection indicator
const SelectionIndicator: React.FC<{
  element: MarkerElement | HighlighterElement | WashiTapeElement;
}> = ({ element }) => {
  const bounds = React.useMemo(() => {
    if (!element.points || element.points.length < 2) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (let i = 0; i < element.points.length; i += 2) {
      minX = Math.min(minX, element.points[i]);
      maxX = Math.max(maxX, element.points[i]);
      minY = Math.min(minY, element.points[i + 1]);
      maxY = Math.max(maxY, element.points[i + 1]);
    }
    
    return {
      x: minX - 5,
      y: minY - 5,
      width: maxX - minX + 10,
      height: maxY - minY + 10
    };
  }, [element.points]);
  
  return (
    <Line
      points={[
        bounds.x, bounds.y,
        bounds.x + bounds.width, bounds.y,
        bounds.x + bounds.width, bounds.y + bounds.height,
        bounds.x, bounds.y + bounds.height,
        bounds.x, bounds.y
      ]}
      stroke="#3B82F6"
      strokeWidth={1}
      dash={[4, 4]}
      opacity={0.8}
      listening={false}
    />
  );
};

// Helper functions
function applyPointReduction(points: number[], reduction: number): number[] {
  if (reduction <= 1 || points.length <= 4) return points;
  
  const reduced: number[] = [points[0], points[1]]; // Always keep first point
  
  for (let i = 2; i < points.length - 2; i += reduction * 2) {
    if (i + 1 < points.length) {
      reduced.push(points[i], points[i + 1]);
    }
  }
  
  // Always keep last point
  if (points.length >= 2) {
    reduced.push(points[points.length - 2], points[points.length - 1]);
  }
  
  return reduced;
}

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
      const segmentT = (targetLength - currentLength) / segmentLength;
      return {
        x: x1 + (x2 - x1) * segmentT,
        y: y1 + (y2 - y1) * segmentT
      };
    }
    
    currentLength += segmentLength;
  }
  
  return {
    x: points[points.length - 2],
    y: points[points.length - 1]
  };
}

function createPatternElement(
  pattern: WashiTapeElement['pattern'],
  position: { x: number; y: number },
  style: WashiTapeElement['style'],
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
      return (
        <Line
          key={key}
          points={[x - 5, y, x + 5, y]}
          stroke={style.secondaryColor}
          strokeWidth={pattern.width}
          opacity={style.opacity * 0.6}
          listening={false}
        />
      );
      
    default:
      return null;
  }
}

export default StrokeRenderer; 