import React from 'react';
import { Graphics, Text } from '../../lib/pixi-setup';
import { CanvasElement, useCanvasStore } from '../../stores/canvasStore';
import { validateCanvasElement } from '../../lib/theme-utils';

// Import our new, native Pixi components
import StickyNote from './elements/StickyNote';
import Rectangle from './elements/Rectangle';
import Circle from './elements/Circle';
import TextElement from './elements/TextElement';
import DrawingElement from './elements/DrawingElement';
import Triangle from './elements/Triangle';
import Star from './elements/Star';
import Hexagon from './elements/Hexagon';
import Arrow from './elements/Arrow';
import Line from './elements/Line';
import Image from './elements/Image';

interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
  onDoubleClick?: (e?: any) => void; // Made parameter optional to handle both cases
}

const CanvasElementRenderer: React.FC<CanvasElementRendererProps> = ({
  element,
  isSelected = false,
  onMouseDown,
  onDoubleClick
}) => {

  // Early return for null/undefined elements
  if (!element) {
    console.warn('CanvasElementRenderer: Received null/undefined element');
    return <Graphics />;
  }

  // Validate element using utility function
  if (!validateCanvasElement(element)) {
    console.warn('CanvasElementRenderer: Element failed validation:', element);
    // Fallback for elements missing critical data or failing validation
    // We know element is not null here, but it might be partially formed.
    const xPos = typeof (element as Partial<CanvasElement>).x === 'number' ? (element as Partial<CanvasElement>).x : 0;
    const yPos = typeof (element as Partial<CanvasElement>).y === 'number' ? (element as Partial<CanvasElement>).y : 0;
    return <Graphics x={xPos} y={yPos} draw={g => {g.beginFill(0xff0000, 0.3); g.drawRect(0,0,10,10); g.endFill();}} />;
  }

  // Check for editing state - critical for text elements
  const isEditingText = useCanvasStore((state) => state.isEditingText);
  
  // Hide element during editing for text-based elements
  if (isEditingText === element.id && (element.type === 'text' || element.type === 'sticky-note')) {
    return null;
  }

  // Debug log for troubleshooting
  if (import.meta.env.DEV) {
    console.log(`Rendering element "${element.id}" of type "${element.type}" at (${element.x}, ${element.y})`);
    console.log(`CanvasElementRenderer: onDoubleClick prop exists: ${!!onDoubleClick}, type: ${typeof onDoubleClick}`);
    if (onDoubleClick) {
      console.log(`CanvasElementRenderer: onDoubleClick function:`, onDoubleClick.toString());
    }
  }

  try {
    switch (element.type) {
      case 'sticky-note':
        return <StickyNote element={element} isSelected={isSelected} onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} />;
      case 'rectangle':
      case 'square':
        return <Rectangle element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
      case 'circle':
        return <Circle element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
      case 'text':
        return <TextElement element={element} onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} />;
      case 'drawing':
        return <DrawingElement element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
      case 'triangle':
        return <Triangle element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
      case 'star':
        return <Star element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
      case 'hexagon':
        return <Hexagon element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
      case 'arrow':
        return <Arrow element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
      case 'line':
        return <Line element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
      case 'image':
        return <Image element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
      default:
        // Critical: Always return a valid PIXI component for unknown types
        console.warn(`CanvasElementRenderer: Unknown element type "${element.type}" for element ID "${element.id}". Rendering placeholder.`);
        return <Graphics />;
    }
  } catch (error) {
    console.error(`CanvasElementRenderer: Error rendering element "${element.id}" of type "${element.type}":`, error);
    // Return a fallback graphics element to prevent the entire canvas from breaking
    return <Graphics x={element.x} y={element.y} />;
  }
};

export default React.memo(CanvasElementRenderer);