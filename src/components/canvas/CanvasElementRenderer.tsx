import React from 'react';
import { CanvasElement } from '../../stores/canvasStore';

// Import our new, native Pixi components
import StickyNote from './elements/StickyNote';
import Rectangle from './elements/Rectangle';
import Circle from './elements/Circle';
import TextElement from './elements/TextElement';
import DrawingElement from './elements/DrawingElement';

interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const CanvasElementRenderer: React.FC<CanvasElementRendererProps> = ({ 
  element, 
  isSelected = false,
  onMouseDown 
}) => {
  switch (element.type) {
    case 'sticky-note':
      return <StickyNote element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
    case 'rectangle':
      return <Rectangle element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
    case 'circle':
      return <Circle element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
    case 'text':
      return <TextElement element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
    case 'drawing':
    case 'line':
      return <DrawingElement element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
    default:
      // For unsupported types, render a placeholder rectangle
      return <Rectangle element={element} isSelected={isSelected} onMouseDown={onMouseDown} />;
  }
};

export default React.memo(CanvasElementRenderer);