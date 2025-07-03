/**
 * MainLayer - Pure Rendering Component
 * 
 * PERFORMANCE OPTIMIZATION: Reduced logging and optimized rendering
 */

import React, { useMemo, useCallback } from 'react';
import { Group, Line, Text } from 'react-konva';
import Konva from 'konva';
import {
  CanvasElement,
  ElementId,
  SectionId,
  ElementOrSectionId,
  SectionElement
} from '../types/enhanced.types';
import { designSystem } from '../../../core/design-system';
import { TextShape } from '../shapes/TextShape';
import { ImageShape } from '../shapes/ImageShape';
import { StickyNoteShape } from '../shapes/StickyNoteShape';
import { TriangleShape } from '../shapes/TriangleShape';
import { RectangleShape } from '../shapes/RectangleShape';
import { CircleShape } from '../shapes/CircleShape';
import { PenShape } from '../shapes/PenShape';
import { SectionShape } from '../shapes/SectionShape';
import { EditableNode } from '../shapes/EditableNode';
import { TableElement } from '../elements/TableElement';
import { KonvaElementBoundary } from '../utils/KonvaElementBoundary';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';
import { StrokeRenderer } from '../components/renderers/StrokeRenderer';

interface MainLayerProps {
  name?: string;
  elements: Map<ElementId, CanvasElement | SectionElement>;
  selectedElementIds: Set<ElementId>;
  selectedTool: string;
  isDrawing?: boolean;
  currentPath?: number[];
  onLayerDraw?: () => void;
  elementsBySection?: Map<SectionId, CanvasElement[]>;
  stageRef?: React.RefObject<Konva.Stage | null>;
}

export const MainLayer: React.FC<MainLayerProps> = ({
  name,
  elements,
  selectedElementIds,
  selectedTool,
  isDrawing = false,
  currentPath = [],
  onLayerDraw,
  elementsBySection,
  stageRef
}) => {
  // Get actual store actions for element updates
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);

  // Memoized element rendering
  const renderElement = useCallback((element: CanvasElement) => {
    // Safety check for valid elements
    if (!element || !element.id || !element.type) {
      return null;
    }

    const isSelected = selectedElementIds.has(element.id);
    const isDraggable = !element.isLocked && element.type !== 'pen' && element.type !== 'pencil';

    // Enable event handlers for proper interaction
    const konvaElementProps: any = {
      id: element.id,
      x: element.x,
      y: element.y,
      draggable: isDraggable,
      opacity: 1,
      perfectDrawEnabled: false,
      listening: true,
    };

    // Apply selection styling to non-table elements (tables handle their own transformer)
    if (element.type !== 'table') {
      konvaElementProps.stroke = isSelected ? designSystem.colors.primary[500] : ('stroke' in element ? element.stroke : undefined);
      konvaElementProps.strokeWidth = isSelected 
        ? ((('strokeWidth' in element ? element.strokeWidth : undefined) || 1) + 1.5) 
        : (('strokeWidth' in element ? element.strokeWidth : undefined) || 1);
      konvaElementProps.shadowColor = isSelected ? designSystem.colors.primary[300] : undefined;
      konvaElementProps.shadowBlur = isSelected ? 10 : 0;
      konvaElementProps.shadowOpacity = isSelected ? 0.7 : 0;
    }

    // Render by element type
    switch (element.type) {
      case 'rectangle':
        return (
          <KonvaElementBoundary key={element.id}>
            <RectangleShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement}
              stageRef={stageRef}
            />
          </KonvaElementBoundary>
        );

      case 'circle':
        return (
          <KonvaElementBoundary key={element.id}>
            <CircleShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement}
              stageRef={stageRef}
            />
          </KonvaElementBoundary>
        );

      case 'marker':
      case 'highlighter':
        return (
          <KonvaElementBoundary key={element.id}>
            <StrokeRenderer
              element={element as any}
              isSelected={isSelected}
              onSelect={(id) => selectElement(id as ElementId)}
              isEditing={false}
            />
          </KonvaElementBoundary>
        );

      case 'text':
        return (
          <KonvaElementBoundary key={element.id}>
            <TextShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement}
              onStartTextEdit={setTextEditingElement}
              stageRef={stageRef}
            />
          </KonvaElementBoundary>
        );

      case 'sticky-note':
        return (
          <KonvaElementBoundary key={element.id}>
            <StickyNoteShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement}
              onStartTextEdit={setTextEditingElement}
              stageRef={stageRef}
            />
          </KonvaElementBoundary>
        );

      case 'triangle':
        return (
          <KonvaElementBoundary key={element.id}>
            <TriangleShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement}
              stageRef={stageRef}
            />
          </KonvaElementBoundary>
        );

      case 'pen':
      case 'pencil':
        return (
          <KonvaElementBoundary key={element.id}>
            <PenShape
              element={element as any}
              konvaProps={konvaElementProps}
            />
          </KonvaElementBoundary>
        );

      case 'image':
        return (
          <KonvaElementBoundary key={element.id}>
            <ImageShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement}
              onStartTextEdit={setTextEditingElement}
            />
          </KonvaElementBoundary>
        );

      case 'section':
        const sectionChildren = elementsBySection?.get(element.id) || [];
        return (
          <KonvaElementBoundary key={element.id}>
            <SectionShape
              section={element as SectionElement}
              isSelected={isSelected}
              onSelect={(id, e) => selectElement(id as ElementId)}
              onElementDragEnd={(e, id) => {
                const node = e.target;
                updateElement(id, { x: node.x(), y: node.y() });
              }}
            >
              {sectionChildren.map(child => renderElement(child))}
            </SectionShape>
          </KonvaElementBoundary>
        );

      case 'table':
        return (
          <KonvaElementBoundary key={element.id}>
            <TableElement
              element={element as any}
              isSelected={isSelected}
              onSelect={() => selectElement(element.id as ElementId)}
              onUpdate={updateElement}
              stageRef={stageRef || { current: null }}
            />
          </KonvaElementBoundary>
        );

      default:
        return (
          <KonvaElementBoundary key={element.id}>
            <Text
              x={element.x}
              y={element.y}
              text={`Unsupported: ${element.type}`}
              fontSize={12}
              fill="#ff6b6b"
              listening={false}
            />
          </KonvaElementBoundary>
        );
    }
  }, [selectedElementIds, selectedTool, elementsBySection, updateElement, setTextEditingElement, selectElement]);

  // Memoized elements to prevent unnecessary re-renders
  const memoizedElements = useMemo(() => {
    const validElements = Array.from(elements.values()).filter(el => {
      // Skip rendering elements that are children of sticky note containers
      if (el && ((el as any).parentId || (el as any).stickyNoteId)) {
        return false;
      }
      return el && el.type !== 'connector';
    });
    
    const renderedElements = validElements.map(renderElement).filter(Boolean);
    
    return renderedElements;
  }, [elements, renderElement]);

  // Draft section rendering for live preview - DISABLED to prevent infinite loops
  const draftSectionElement = null;

  // Active drawing line
  const drawingLine = useMemo(() => {
    if (!isDrawing || currentPath.length < 4) return null;

    return (
      <Line
        key="drawing-line"
        points={currentPath}
        stroke="#000000"
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
        opacity={0.8}
        perfectDrawEnabled={false}
        listening={false}
      />
    );
  }, [isDrawing, currentPath]);

  // Combine all renderable nodes
  const allNodes = useMemo(() => {
    const nodes = [...memoizedElements];
    
    if (draftSectionElement) {
      nodes.push(draftSectionElement);
    }
    
    if (drawingLine) {
      nodes.push(drawingLine);
    }
    
    return nodes;
  }, [memoizedElements, draftSectionElement, drawingLine]);

  return (
    <KonvaElementBoundary>
      <Group
        name={name || "main-layer"}
        perfectDrawEnabled={false}
        listening={true}
      >
        {allNodes}
      </Group>
    </KonvaElementBoundary>
  );
};

export default MainLayer;
