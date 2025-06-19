import React from 'react';
import { Group, Line, Rect, Circle, Text } from 'react-konva';
import { SnapGuide } from '../../utils/collision';

interface GuideLayerProps {
  guides?: SnapGuide[];
  snapIndicators?: SnapIndicator[];
  measurementGuides?: MeasurementGuide[];
  alignmentGuides?: AlignmentGuide[];
}

export interface SnapIndicator {
  id: string;
  x: number;
  y: number;
  type: 'grid' | 'element' | 'guide';
  size: number;
}

export interface MeasurementGuide {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  value: number;
  unit: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface AlignmentGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  elements: string[];
}

export const GuideLayer: React.FC<GuideLayerProps> = ({
  guides = [],
  snapIndicators = [],
  measurementGuides = [],
  alignmentGuides = []
}) => {
  return (
    <Group>
      {/* Snap guides */}
      {guides.map((guide, index) => (
        <SnapGuideRenderer key={`guide-${index}`} guide={guide} />
      ))}
      
      {/* Snap indicators */}
      {snapIndicators.map((indicator) => (
        <SnapIndicatorRenderer key={indicator.id} indicator={indicator} />
      ))}
      
      {/* Measurement guides */}
      {measurementGuides.map((guide) => (
        <MeasurementGuideRenderer key={guide.id} guide={guide} />
      ))}
      
      {/* Alignment guides */}
      {alignmentGuides.map((guide) => (
        <AlignmentGuideRenderer key={guide.id} guide={guide} />
      ))}
    </Group>
  );
};

const SnapGuideRenderer: React.FC<{ guide: SnapGuide }> = ({ guide }) => {
  const getLinePoints = () => {
    if (guide.type.includes('horizontal')) {
      return [guide.x1 || 0, guide.y || 0, guide.x2 || 0, guide.y || 0];
    } else {
      return [guide.x || 0, guide.y1 || 0, guide.x || 0, guide.y2 || 0];
    }
  };

  const isCenter = guide.type.includes('center');
  const strokeColor = isCenter ? '#ff6b6b' : '#4ecdc4';
  const strokeWidth = isCenter ? 2 : 1;

  return (
    <Line
      points={getLinePoints()}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      dash={[3, 3]}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
};

const SnapIndicatorRenderer: React.FC<{ indicator: SnapIndicator }> = ({ indicator }) => {
  const getColor = () => {
    switch (indicator.type) {
      case 'grid': return '#00ff00';
      case 'element': return '#ff6600';
      case 'guide': return '#0066ff';
      default: return '#666666';
    }
  };

  return (
    <Circle
      x={indicator.x}
      y={indicator.y}
      radius={indicator.size}
      fill={getColor()}
      opacity={0.8}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
};

const MeasurementGuideRenderer: React.FC<{ guide: MeasurementGuide }> = ({ guide }) => {
  const isHorizontal = guide.position === 'top' || guide.position === 'bottom';
  const textOffset = 5;
  
  const textX = isHorizontal ? 
    (guide.startX + guide.endX) / 2 : 
    guide.startX + (guide.position === 'left' ? -textOffset : textOffset);
    
  const textY = isHorizontal ? 
    guide.startY + (guide.position === 'top' ? -textOffset : textOffset) : 
    (guide.startY + guide.endY) / 2;

  return (
    <Group>
      {/* Main measurement line */}
      <Line
        points={[guide.startX, guide.startY, guide.endX, guide.endY]}
        stroke="#666666"
        strokeWidth={1}
        listening={false}
        perfectDrawEnabled={false}
      />
      
      {/* End caps */}
      <Line
        points={isHorizontal ? 
          [guide.startX, guide.startY - 3, guide.startX, guide.startY + 3] :
          [guide.startX - 3, guide.startY, guide.startX + 3, guide.startY]
        }
        stroke="#666666"
        strokeWidth={1}
        listening={false}
        perfectDrawEnabled={false}
      />
      <Line
        points={isHorizontal ? 
          [guide.endX, guide.endY - 3, guide.endX, guide.endY + 3] :
          [guide.endX - 3, guide.endY, guide.endX + 3, guide.endY]
        }
        stroke="#666666"
        strokeWidth={1}
        listening={false}
        perfectDrawEnabled={false}
      />
      
      {/* Measurement text background */}
      <Rect
        x={textX - 15}
        y={textY - 8}
        width={30}
        height={16}
        fill="rgba(255, 255, 255, 0.9)"
        stroke="#666666"
        strokeWidth={1}
        cornerRadius={2}
        listening={false}
        perfectDrawEnabled={false}
      />
      
      {/* Measurement text */}
      <Text
        x={textX}
        y={textY}
        text={`${Math.round(guide.value)}${guide.unit}`}
        fontSize={10}
        fontFamily="Inter"
        fill="#333333"
        align="center"
        verticalAlign="middle"
        offsetX={15}
        offsetY={8}
        listening={false}
        perfectDrawEnabled={false}
      />
    </Group>
  );
};

const AlignmentGuideRenderer: React.FC<{ guide: AlignmentGuide }> = ({ guide }) => {
  return (
    <Group>
      {/* Main alignment line */}
      <Line
        points={[guide.startX, guide.startY, guide.endX, guide.endY]}
        stroke="#ff6b6b"
        strokeWidth={2}
        dash={[8, 4]}
        listening={false}
        perfectDrawEnabled={false}
      />
      
      {/* Alignment markers at intersections */}
      <Circle
        x={guide.startX}
        y={guide.startY}
        radius={3}
        fill="#ff6b6b"
        listening={false}
        perfectDrawEnabled={false}
      />
      <Circle
        x={guide.endX}
        y={guide.endY}
        radius={3}
        fill="#ff6b6b"
        listening={false}
        perfectDrawEnabled={false}
      />
    </Group>
  );
};

// Smart guides that appear during element manipulation
export const SmartGuides: React.FC<{
  draggedElement?: { x: number; y: number; width: number; height: number };
  allElements: Array<{ id: string; x: number; y: number; width: number; height: number }>;
  snapDistance?: number;
}> = ({
  draggedElement,
  allElements,
  snapDistance = 5
}) => {
  if (!draggedElement) return null;

  const guides: SnapGuide[] = [];
  
  allElements.forEach(element => {
    const draggedCenter = {
      x: draggedElement.x + draggedElement.width / 2,
      y: draggedElement.y + draggedElement.height / 2
    };
    
    const elementCenter = {
      x: element.x + element.width / 2,
      y: element.y + element.height / 2
    };
    
    // Horizontal center alignment
    if (Math.abs(draggedCenter.y - elementCenter.y) <= snapDistance) {
      guides.push({
        type: 'center-horizontal',
        y: elementCenter.y,
        x1: Math.min(draggedElement.x, element.x),
        x2: Math.max(draggedElement.x + draggedElement.width, element.x + element.width)
      });
    }
    
    // Vertical center alignment
    if (Math.abs(draggedCenter.x - elementCenter.x) <= snapDistance) {
      guides.push({
        type: 'center-vertical',
        x: elementCenter.x,
        y1: Math.min(draggedElement.y, element.y),
        y2: Math.max(draggedElement.y + draggedElement.height, element.y + element.height)
      });
    }
    
    // Edge alignments
    if (Math.abs(draggedElement.x - element.x) <= snapDistance) {
      guides.push({
        type: 'edge-vertical',
        x: element.x,
        y1: Math.min(draggedElement.y, element.y),
        y2: Math.max(draggedElement.y + draggedElement.height, element.y + element.height)
      });
    }
    
    if (Math.abs(draggedElement.y - element.y) <= snapDistance) {
      guides.push({
        type: 'edge-horizontal',
        y: element.y,
        x1: Math.min(draggedElement.x, element.x),
        x2: Math.max(draggedElement.x + draggedElement.width, element.x + element.width)
      });
    }
  });

  return (
    <Group>
      {guides.map((guide, index) => (
        <SnapGuideRenderer key={`smart-guide-${index}`} guide={guide} />
      ))}
    </Group>
  );
};

// Distance indicators between elements
export const DistanceIndicators: React.FC<{
  selectedElement: { x: number; y: number; width: number; height: number };
  nearbyElements: Array<{ id: string; x: number; y: number; width: number; height: number }>;
  showDistances: boolean;
}> = ({
  selectedElement,
  nearbyElements,
  showDistances
}) => {
  if (!showDistances) return null;

  const measurements: MeasurementGuide[] = [];
  
  nearbyElements.forEach((element, index) => {
    // Horizontal distance
    if (selectedElement.x + selectedElement.width < element.x) {
      // Selected element is to the left
      measurements.push({
        id: `h-${index}`,
        startX: selectedElement.x + selectedElement.width,
        startY: selectedElement.y + selectedElement.height / 2,
        endX: element.x,
        endY: element.y + element.height / 2,
        value: element.x - (selectedElement.x + selectedElement.width),
        unit: 'px',
        position: 'top'
      });
    } else if (element.x + element.width < selectedElement.x) {
      // Selected element is to the right
      measurements.push({
        id: `h-${index}`,
        startX: element.x + element.width,
        startY: element.y + element.height / 2,
        endX: selectedElement.x,
        endY: selectedElement.y + selectedElement.height / 2,
        value: selectedElement.x - (element.x + element.width),
        unit: 'px',
        position: 'top'
      });
    }
    
    // Vertical distance
    if (selectedElement.y + selectedElement.height < element.y) {
      // Selected element is above
      measurements.push({
        id: `v-${index}`,
        startX: selectedElement.x + selectedElement.width / 2,
        startY: selectedElement.y + selectedElement.height,
        endX: element.x + element.width / 2,
        endY: element.y,
        value: element.y - (selectedElement.y + selectedElement.height),
        unit: 'px',
        position: 'left'
      });
    } else if (element.y + element.height < selectedElement.y) {
      // Selected element is below
      measurements.push({
        id: `v-${index}`,
        startX: element.x + element.width / 2,
        startY: element.y + element.height,
        endX: selectedElement.x + selectedElement.width / 2,
        endY: selectedElement.y,
        value: selectedElement.y - (element.y + element.height),
        unit: 'px',
        position: 'left'
      });
    }
  });

  return (
    <Group>
      {measurements.map((guide) => (
        <MeasurementGuideRenderer key={guide.id} guide={guide} />
      ))}
    </Group>
  );
};

export default GuideLayer;
