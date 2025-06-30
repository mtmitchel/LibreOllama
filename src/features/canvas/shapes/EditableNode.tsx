// src/components/canvas/shapes/EditableNode.tsx
import React from 'react';
import Konva from 'konva';
import { CanvasElement } from '../types/enhanced.types';
import { RectangleShape } from './RectangleShape';
import { CircleShape } from './CircleShape';
// TEMP FIX: Comment out broken imports and implement simple fallbacks
// import UnifiedTextElement from '../components/UnifiedTextElement';
// import StickyNoteElement from '../components/StickyNoteElement';
import { TableElement } from '../elements/TableElement';
// import SectionElement from '../components/SectionElement';
// import ImageElement from '../components/ImageElement';
import { ConnectorRenderer } from '../components/ConnectorRenderer';
import { Line, Star, Text, Rect } from 'react-konva';
import { designSystem } from '../../../core/design-system';
import { Html } from 'react-konva-utils';
import { ElementId } from '../types/enhanced.types';

interface EditableNodeProps {
  element: CanvasElement;
  isSelected: boolean;
  selectedTool: string;
  // REMOVED: event handlers - handled by UnifiedEventHandler at stage level
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
  console.log('🎪 [EditableNode] Rendering element:', element.type, element.id, element);// Determine if element should be draggable
  const isDraggable = React.useMemo(() => {
    return (
      (selectedTool === 'select' || selectedTool === element.type) &&
      !(element as any).isLocked
      // Allow dragging of selected elements in sections - that's the whole point!
    );
  }, [selectedTool, element.type]);

  // ARCHITECTURAL FIX: Remove event handlers - UnifiedEventHandler handles all interactions
  const commonProps = React.useMemo(() => {
    const baseProps: any = {
      id: element.id,
      x: element.x,
      y: element.y,
      draggable: isDraggable,
      // REMOVED: onClick, onDragEnd, onDragStart, onDragMove - handled by UnifiedEventHandler
      opacity: 1,
      stroke: isSelected ? designSystem.colors.primary[500] : (element as any).stroke,
      strokeWidth: isSelected ? ((element as any).strokeWidth || 1) + 1.5 : (element as any).strokeWidth,
      perfectDrawEnabled: false, // Performance optimization
    };

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
  }, [element, isSelected, isDraggable]);

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
            fill={(element as any).backgroundColor || '#ffeb3b'}
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
      // TEMP FIX: Use simple Rect placeholder until ImageElement is fixed
      return (
        <Rect
          {...commonProps}
          width={(element as any).width || 200}
          height={(element as any).height || 150}
          fill="#f0f0f0"
          stroke="#ccc"
          strokeWidth={1}
        />
      );    case 'section':
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
          onSelect={(element) => onElementClick({} as any, element)}
          onUpdate={(updates) => onElementUpdate(element.id, updates)}
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

