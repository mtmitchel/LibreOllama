// src/components/canvas/shapes/EditableNode.tsx
import React from 'react';
import Konva from 'konva';
import { CanvasElement } from '../types/enhanced.types';
import { RectangleShape } from './RectangleShape';
import { CircleShape } from './CircleShape';
import UnifiedTextElement from '../components/UnifiedTextElement';
import StickyNoteElement from '../components/StickyNoteElement';
import { EnhancedTableElement } from '../components/EnhancedTableElement';
import SectionElement from '../components/SectionElement';
import ImageElement from '../components/ImageElement';
import ConnectorRenderer from '../components/ConnectorRenderer';
import { Line, Star } from 'react-konva';
import { designSystem } from '../../../design-system';

interface EditableNodeProps {
  element: CanvasElement;
  isSelected: boolean;
  selectedTool: string;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementDragStart?: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onElementDragMove?: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
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
  onElementClick,
  onElementDragStart,
  onElementDragEnd,
  onElementDragMove,
  onElementUpdate,
  onStartTextEdit
}) => {// Determine if element should be draggable
  const isDraggable = React.useMemo(() => {
    return (
      (selectedTool === 'select' || selectedTool === element.type) &&
      !(element as any).isLocked
      // Allow dragging of selected elements in sections - that's the whole point!
    );
  }, [selectedTool, element.type]);  // Common props for all shape types
  const commonProps = React.useMemo(() => {
    const baseProps: any = {
      id: element.id,
      x: element.x,
      y: element.y,
      draggable: isDraggable,
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => onElementClick(e, element),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onElementDragEnd(e, element.id),
      opacity: 1,      stroke: isSelected ? designSystem.colors.primary[500] : (element as any).stroke,
      strokeWidth: isSelected ? ((element as any).strokeWidth || 1) + 1.5 : (element as any).strokeWidth,
      perfectDrawEnabled: false, // Performance optimization
    };

    // Add optional drag handlers only if they exist
    if (onElementDragStart) {
      baseProps.onDragStart = (e: Konva.KonvaEventObject<DragEvent>) => onElementDragStart(e, element.id);
    }
    if (onElementDragMove) {
      baseProps.onDragMove = (e: Konva.KonvaEventObject<DragEvent>) => onElementDragMove(e, element.id);
    }

    // Add shadow properties only if selected to avoid undefined issues
    if (isSelected) {
      return {
        ...baseProps,
        shadowColor: designSystem.colors.primary[300],
        shadowBlur: 10,
        shadowOpacity: 0.7,
      };
    }

    return baseProps;
  }, [element, isSelected, isDraggable, onElementClick, onElementDragStart, onElementDragEnd, onElementDragMove]);

  // Render appropriate shape component based on element type
  switch (element.type) {
    case 'rectangle':
      return (        <RectangleShape
          element={element}
          isSelected={isSelected}
          konvaProps={commonProps}
          onUpdate={onElementUpdate}
          onStartTextEdit={onStartTextEdit}
        />
      );

    case 'circle':
      return (        <CircleShape
          element={element}
          isSelected={isSelected}
          konvaProps={commonProps}
          onUpdate={onElementUpdate}
          onStartTextEdit={onStartTextEdit}
        />
      );

    case 'text':
      return (
        <UnifiedTextElement
          element={{
            ...element,
            type: 'text',
            text: element.text || ''
          }}
          isSelected={isSelected}
          isEditing={false} // Will be managed by parent
          onUpdate={onElementUpdate}
          onSelect={() => {}} // Handled by parent
          onStartEdit={onStartTextEdit}
          konvaProps={commonProps}
        />
      );

    case 'sticky-note':
      return (
        <StickyNoteElement
          element={element}
          isSelected={isSelected}
          isEditing={false} // Will be managed by parent
          isDraggable={isDraggable}
          onSelect={(_, e) => onElementClick(e, element)}
          onDragEnd={(e) => onElementDragEnd(e, element.id)}
          onDoubleClick={(e) => {
            e.cancelBubble = true;
            onStartTextEdit(element.id);
          }}
        />
      );    case 'rich-text':
      return (
        <UnifiedTextElement
          element={element as any}
          {...commonProps}
          onDblClick={(e: any) => {
            e.cancelBubble = true;
            e.evt?.stopPropagation();
            onStartTextEdit(element.id);
          }}
          isEditing={false} // Will be managed by parent
          onTextUpdate={() => {}} // Will be handled by parent
          onEditingCancel={() => {}} // Will be handled by parent
        />
      );

    case 'pen':
      return (
        <Line
          {...commonProps}
          points={element.points || [0, 0, 100, 0]}
          stroke={element.stroke || designSystem.colors.secondary[800]}
          strokeWidth={element.strokeWidth || 3}
          lineCap="round"
          lineJoin="round"
          tension={0.5}        />
      );

    case 'star':
      const starRadius = (element as any).radius || ((element as any).width || 100) / 2;
      // Normalize star positioning to top-left corner like rectangles
      // Store coordinates represent top-left corner, but Star needs center coordinates
      const starCenterX = (commonProps.x || 0) + starRadius;
      const starCenterY = (commonProps.y || 0) + starRadius;

      return (
        <Star
          {...commonProps}
          x={starCenterX}
          y={starCenterY}          numPoints={(element as any).sides || 5}
          innerRadius={(element as any).innerRadius || ((element as any).width || 100) / 4}
          outerRadius={starRadius}
          fill={element.fill || designSystem.colors.warning[500]}
          stroke={element.stroke || designSystem.colors.warning[600]}
          strokeWidth={element.strokeWidth || 2}        />
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
          fill={element.fill || designSystem.colors.success[500]}
          stroke={element.stroke || designSystem.colors.success[500]}
          strokeWidth={element.strokeWidth || 2}
        />
      );

    case 'image':
      return (
        <ImageElement
          element={element}
          konvaProps={commonProps}        />
      );    case 'section':
      return (        <SectionElement
          section={element as any}
          isSelected={isSelected}
          onUpdate={(id: string, updates: any) => onElementUpdate(id, updates as Partial<CanvasElement>)}
          onSelect={() => {}} // Handled by parent
          onDragEnd={onElementDragEnd}
          onSectionChange={() => {}} // No-op for now
          isDraggable={isDraggable}
          elements={{}} // Will be passed from parent
          renderElement={() => null} // Will be handled by layer manager
        >
          {null}
        </SectionElement>
      );

    case 'table':
      return (
        <EnhancedTableElement
          element={element}
          isSelected={isSelected}
          onSelect={(element) => onElementClick({} as any, element)}
          onUpdate={(updates) => onElementUpdate(element.id, updates)}
          onDragEnd={(e) => onElementDragEnd(e, element.id)}
          stageRef={{ current: null }} // Will be passed from parent
        />
      );

    case 'connector':
      return (
        <ConnectorRenderer
          element={element}
          isSelected={isSelected}
          onSelect={() => onElementClick({} as any, element)}          elements={new Map()} // Will be passed from parent
          sections={new Map()} // Will be passed from parent
        />
      );

    default:
      console.warn('Unknown element type in EditableNode:', (element as any).type);
      return null;
  }
});

EditableNode.displayName = 'EditableNode';

