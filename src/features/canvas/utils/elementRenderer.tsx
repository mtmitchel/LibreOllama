// src/features/canvas/utils/elementRenderer.tsx
import React from 'react';
import { Rect, Circle, Line } from 'react-konva';
import { CanvasElement } from '../stores/types';
import { TextShape } from '../shapes/TextShape';
import { ImageShape } from '../shapes/ImageShape';
import { StickyNoteShape } from '../shapes/StickyNoteShape';
import { StarShape } from '../shapes/StarShape';
import { TriangleShape } from '../shapes/TriangleShape';
import { PenShape } from '../shapes/PenShape';
import { EditableNode } from '../shapes/EditableNode';
import Konva from 'konva';

interface RenderElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: string) => void;
  dragBoundFunc?: (pos: { x: number; y: number }) => { x: number; y: number };
  draggable?: boolean;
  sectionContext?: {
    sectionId: string;
    isInSection: boolean;
  };
}

/**
 * Universal element renderer that handles all canvas element types
 * Used by both legacy and grouped rendering systems
 */
export const renderElement = ({
  element,
  isSelected,
  onElementClick,
  onElementDragEnd,
  onElementUpdate,
  onStartTextEdit,
  dragBoundFunc,
  draggable = true,
  sectionContext
}: RenderElementProps): React.ReactElement => {
  const commonProps = {
    key: element.id,
    element,
    isSelected,
    konvaProps: {
      x: element.x || 0,
      y: element.y || 0,
      draggable: draggable && !element.isLocked,
      dragBoundFunc: dragBoundFunc,
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => onElementClick(e, element),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onElementDragEnd(e, element.id)
    },
    onUpdate: onElementUpdate,
    onStartTextEdit,
    sectionContext
  };

  switch (element.type) {
    case 'text':
      return <TextShape {...commonProps} />;
    
    case 'rich-text':
      // For now, use basic text until we fix EditableNode props
      return <TextShape {...commonProps} />;
    
    case 'image':
      return <ImageShape {...commonProps} />;
    
    case 'sticky-note':
      return <StickyNoteShape {...commonProps} />;
    
    case 'star':
      return <StarShape {...commonProps} />;
    
    case 'triangle':
      return <TriangleShape {...commonProps} />;
    
    case 'pen':
      return <PenShape {...commonProps} />;
    
    case 'rectangle':
      return (
        <Rect
          key={element.id}
          id={element.id}
          {...commonProps.konvaProps}
          width={element.width || 100}
          height={element.height || 100}
          fill={element.fill || '#3B82F6'}
          stroke={element.stroke || '#1E40AF'}
          strokeWidth={element.strokeWidth || 2}
        />
      );
    
    case 'circle':
      return (
        <Circle
          key={element.id}
          id={element.id}
          {...commonProps.konvaProps}
          radius={element.radius || 50}
          fill={element.fill || '#3B82F6'}
          stroke={element.stroke || '#1E40AF'}
          strokeWidth={element.strokeWidth || 2}
        />
      );
    
    case 'line':
    case 'arrow':
      return (
        <Line
          key={element.id}
          id={element.id}
          {...commonProps.konvaProps}
          points={element.points || [0, 0, 100, 100]}
          stroke={element.stroke || '#1E40AF'}
          strokeWidth={element.strokeWidth || 2}
        />
      );
    
    default:
      // Fallback for unknown types
      return (
        <Rect
          key={element.id}
          id={element.id}
          {...commonProps.konvaProps}
          width={element.width || 100}
          height={element.height || 100}
          fill="rgba(255, 0, 0, 0.3)"
          stroke="#FF0000"
          strokeWidth={1}
        />
      );
  }
};
