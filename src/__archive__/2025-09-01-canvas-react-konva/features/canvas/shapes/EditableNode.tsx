// src/components/canvas/shapes/EditableNode.tsx
import React from 'react';
import Konva from 'konva';
import { CanvasElement } from '../types/enhanced.types';
import { RectangleShape } from './RectangleShape';
import { CircleShape } from './CircleShape';
import { ImageShape } from './ImageShape';
import { TableElement } from '../elements/TableElement';
import { Line, Star, Text, Rect } from 'react-konva';
import { canvasTheme } from '../utils/canvasTheme';
import { Html } from 'react-konva-utils';
import { ElementId } from '../types/enhanced.types';

interface EditableNodeProps {
  element: CanvasElement;
  isSelected: boolean;
  selectedTool: string;
  // REMOVED: event handlers - handled by CanvasEventManager at stage level
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: string) => void;
}

/**
 * EditableNode - Reusable wrapper for all interactive shapes
 * - Common drag, selection, and transform logic
 * - Performance-optimized with React.memo
 * - Delegates to specific shape components
 */
export const EditableNode: React.FC<EditableNodeProps> = React.memo(({
  element,
  isSelected,
  selectedTool,
  onElementUpdate,
  onStartTextEdit
}) => {
  const handleTransformEnd = (e: Konva.KonvaEventObject<any>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onElementUpdate(node.id(), {
      x: node.x(),
      y: node.y(),
      width: node.width() * scaleX,
      height: node.height() * scaleY,
    });
  };

  console.log('🎪 [EditableNode] Rendering element:', element.type, element.id, element);// Determine if element should be draggable
  const isDraggable = React.useMemo(() => {
    return (
      (selectedTool === 'select' || selectedTool === element.type) &&
      !(element as any).isLocked
      // Allow dragging of selected elements in sections - that's the whole point!
    );
  }, [selectedTool, element.type]);

  // ARCHITECTURAL FIX: Remove event handlers - CanvasEventManager handles all interactions
  const commonProps = React.useMemo(() => {
    const baseProps: any = {
      id: element.id,
      x: element.x,
      y: element.y,
      draggable: isDraggable,
      // REMOVED: onClick, onDragEnd, onDragStart, onDragMove - handled by CanvasEventManager
      opacity: 1,
      stroke: isSelected ? canvasTheme.colors.primary : (element as any).stroke,
      strokeWidth: isSelected ? ((element as any).strokeWidth || 1) + 1.5 : (element as any).strokeWidth,
      perfectDrawEnabled: false, // Performance optimization
    };

    // Add shadow properties only if selected to avoid undefined issues
    if (isSelected) {
      return {
        ...baseProps,
        shadowColor: canvasTheme.colors.primaryLight,
        shadowBlur: 10,
        shadowOpacity: 0.7,
      };
    }

    return baseProps;
  }, [element, isSelected, isDraggable]);

  // Render appropriate shape component based on element type
  switch (element.type) {
    case 'rectangle':
      return (        <RectangleShape
          element={element}
          isSelected={isSelected}
          konvaProps={commonProps}
          onUpdate={onElementUpdate}
        />
      );

    case 'circle':
      return (        <CircleShape
          element={element}
          isSelected={isSelected}
          konvaProps={commonProps}
          onUpdate={onElementUpdate}
        />
      );

    case 'text':
      // TEMP FIX: Use simple Text element directly until UnifiedTextElement is fixed
      return (
        <Text
          {...commonProps}
          text={(element as any).text || 'Text'}
          fontSize={(element as any).fontSize || 16}
          fontFamily={(element as any).fontFamily || 'Arial'}
          fill={(element as any).fill || '#000000'}
          width={(element as any).width || 200}
          height={(element as any).height || 50}
          onDblClick={(e: any) => {
            e.cancelBubble = true;
            onStartTextEdit(element.id);
          }}
        />
      );

    case 'sticky-note':
      // TEMP FIX: Use simple Rect + Text until StickyNoteElement is fixed
      return (
        <React.Fragment>
          <Rect
            {...commonProps}
            width={(element as any).width || 150}
            height={(element as any).height || 150}
            fill={(element as any).backgroundColor || '#FFF2CC'}
            stroke={(element as any).borderColor || '#fbc02d'}
            strokeWidth={1}
            cornerRadius={4}
          />
          <Text
            {...commonProps}
            text={(element as any).text || 'Sticky Note'}
            fontSize={12}
            fontFamily="Arial"
            fill="#333"
            width={(element as any).width || 150}
            height={(element as any).height || 150}
            padding={8}
            verticalAlign="top"
            listening={false}
          />
        </React.Fragment>
      );    case 'rich-text':
      // TEMP FIX: Use simple Text element until UnifiedTextElement is fixed
      return (
        <Text
          {...commonProps}
          text={(element as any).text || 'Rich Text'}
          fontSize={(element as any).fontSize || 16}
          fontFamily={(element as any).fontFamily || 'Arial'}
          fill={(element as any).fill || '#000000'}
          width={(element as any).width || 200}
          height={(element as any).height || 100}
          onDblClick={(e: any) => {
            e.cancelBubble = true;
            onStartTextEdit(element.id);
          }}
        />
      );

    case 'pen':
      return (
        <Line
          {...commonProps}
          points={element.points || [0, 0, 100, 0]}
          stroke={element.stroke || canvasTheme.colors.secondary[800]}
          strokeWidth={element.strokeWidth || 3}
          lineCap="round"
          lineJoin="round"
          tension={0.5}        />
      );

    case 'triangle':
      // Calculate triangle points based on current position and dimensions
      const triangleWidth = element.width || 100;
      const triangleHeight = element.height || 60;
      const trianglePoints = [
        triangleWidth / 2, 0,  // Top point
        triangleWidth, triangleHeight,  // Bottom right
        0, triangleHeight   // Bottom left
      ];

      return (
        <Line 
          {...commonProps}
          points={trianglePoints}
          closed
          fill={element.fill || '#FFFFFF'}
          stroke={element.stroke || '#D1D5DB'}
          strokeWidth={element.strokeWidth || 2}
        />
      );

    case 'image':
      return (
        <ImageShape
          element={element}
          isSelected={isSelected}
          konvaProps={commonProps}
          onUpdate={onElementUpdate}
          onStartTextEdit={onStartTextEdit}
          onTransformEnd={handleTransformEnd}
        />
      );

    case 'section':
      // TEMP FIX: Use simple Rect until SectionElement is fixed
      return (
        <Rect
          {...commonProps}
          width={(element as any).width || 300}
          height={(element as any).height || 200}
          fill="rgba(0, 123, 255, 0.1)"
          stroke="#007bff"
          strokeWidth={2}
          dash={[5, 5]}
        />
      );

    case 'table':
      return (
        <TableElement
          element={element}
          isSelected={isSelected}
          onSelect={() => {}} // Simplified handler
          onUpdate={(id, updates) => onElementUpdate(id, updates)}
          // ARCHITECTURAL FIX: Remove drag handler to centralize in CanvasEventHandler
          // onDragEnd={(e) => onElementDragEnd(e, element.id)} // DISABLED per Friday Review
          stageRef={{ current: null }} // Will be passed from parent
        />
      );

    case 'connector':
      // TEMP FIX: Use simple Line until ConnectorRenderer is fixed
      const startPoint = (element as any).startPoint || { x: 0, y: 0 };
      const endPoint = (element as any).endPoint || { x: 100, y: 100 };
      return (
        <Line
          {...commonProps}
          points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
          stroke={(element as any).stroke || '#333'}
          strokeWidth={(element as any).strokeWidth || 2}
          lineCap="round"
        />
      );

    default:
      console.warn('Unknown element type in EditableNode:', (element as any).type);
      return null;
  }
});

EditableNode.displayName = 'EditableNode';
// Archived (2025-09-01): Legacy react-konva editable node wrapper.
