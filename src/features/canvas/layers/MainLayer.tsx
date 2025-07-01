/**
 * MainLayer - Pure Rendering Component
 * 
 * CRITICAL FIX: Pass actual store functions to TextShape for proper updates
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
import { StarShape } from '../shapes/StarShape';
import { TriangleShape } from '../shapes/TriangleShape';
import { RectangleShape } from '../shapes/RectangleShape';
import { CircleShape } from '../shapes/CircleShape';
import { PenShape } from '../shapes/PenShape';
import { SectionShape } from '../shapes/SectionShape';
import { EditableNode } from '../shapes/EditableNode';
import { TableElement } from '../elements/TableElement';
import { CanvasErrorBoundary } from '../utils/CanvasErrorBoundary';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';
import { StrokeRenderer } from '../components/renderers/StrokeRenderer';
// import { ElementRenderer } from '../renderers/ElementRenderer';

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
  console.log('🎯 [MainLayer] Rendering with elements:', elements.size);

  // Get actual store actions for element updates
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);

  // Memoized element rendering
  const renderElement = useCallback((element: CanvasElement) => {
    // Safety check for valid elements
    if (!element || !element.id || !element.type) {
      console.warn('[MainLayer] Invalid element:', element);
      return null;
    }

    console.log('🎭 [MainLayer] Rendering:', element.type, element.id);

    const isSelected = selectedElementIds.has(element.id);
    const isDraggable = !element.isLocked && element.type !== 'pen' && element.type !== 'pencil';

    // CRITICAL: Enable event handlers for proper interaction
    const konvaElementProps: any = {
      id: element.id,
      x: element.x,
      y: element.y,
      draggable: isDraggable,
      opacity: 1,
      perfectDrawEnabled: false,
      listening: true, // Enable listening for event delegation
      
      // Selection styling
      stroke: isSelected ? designSystem.colors.primary[500] : ('stroke' in element ? element.stroke : undefined),
      strokeWidth: isSelected 
        ? ((('strokeWidth' in element ? element.strokeWidth : undefined) || 1) + 1.5) 
        : (('strokeWidth' in element ? element.strokeWidth : undefined) || 1),
      shadowColor: isSelected ? designSystem.colors.primary[300] : undefined,
      shadowBlur: isSelected ? 10 : 0,
      shadowOpacity: isSelected ? 0.7 : 0,
    };

    console.log('🎨 [MainLayer] Props for:', element.id, konvaElementProps);

    // Render by element type
    switch (element.type) {
      case 'rectangle':
        return (
          <CanvasErrorBoundary key={element.id}>
            <RectangleShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement} // Pass actual update function
              stageRef={stageRef} // ADDED: Pass stageRef for text editing
            />
          </CanvasErrorBoundary>
        );

      case 'circle':
        return (
          <CanvasErrorBoundary key={element.id}>
            <CircleShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement} // Pass actual update function
              stageRef={stageRef} // ADDED: Pass stageRef for text editing
            />
          </CanvasErrorBoundary>
        );

      case 'marker':
      case 'highlighter':
      case 'washi-tape':
        return (
          <CanvasErrorBoundary key={element.id}>
            <StrokeRenderer
              element={element as any}
              isSelected={isSelected}
              onSelect={(id) => selectElement(id as ElementId)} // Pass actual select function
              isEditing={false}
            />
          </CanvasErrorBoundary>
        );

      case 'text':
        console.log('🎭 [MainLayer] Rendering text element:', element.id, 'with props:', konvaElementProps);
        return (
          <CanvasErrorBoundary key={element.id}>
            <TextShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement} // Pass actual update function
              onStartTextEdit={setTextEditingElement} // Pass actual function
              stageRef={stageRef}
            />
          </CanvasErrorBoundary>
        );

      case 'sticky-note':
        return (
          <CanvasErrorBoundary key={element.id}>
            <StickyNoteShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement} // Pass actual update function
              onStartTextEdit={setTextEditingElement} // Pass actual function
              stageRef={stageRef}
            />
          </CanvasErrorBoundary>
        );

      case 'star':
        return (
          <CanvasErrorBoundary key={element.id}>
            <StarShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement} // Pass actual update function
              onStartTextEdit={setTextEditingElement} // Pass actual function
            />
          </CanvasErrorBoundary>
        );

      case 'triangle':
        return (
          <CanvasErrorBoundary key={element.id}>
            <TriangleShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement} // Pass actual update function
              stageRef={stageRef} // ADDED: Pass stageRef for text editing
            />
          </CanvasErrorBoundary>
        );

      case 'pen':
      case 'pencil':
        return (
          <CanvasErrorBoundary key={element.id}>
            <PenShape
              element={element as any}
              konvaProps={konvaElementProps}
            />
          </CanvasErrorBoundary>
        );

      case 'image':
        return (
          <CanvasErrorBoundary key={element.id}>
            <ImageShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={updateElement} // Pass actual update function
              onStartTextEdit={setTextEditingElement} // Pass actual function
            />
          </CanvasErrorBoundary>
        );

      case 'section':
        const sectionChildren = elementsBySection?.get(element.id) || [];
        return (
          <CanvasErrorBoundary key={element.id}>
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
          </CanvasErrorBoundary>
        );

      case 'table':
        return (
          <CanvasErrorBoundary key={element.id}>
            <TableElement
              element={element as any}
              isSelected={isSelected}
              onSelect={() => selectElement(element.id as ElementId)} // Pass actual select function
              onUpdate={updateElement} // Pass actual update function
              stageRef={stageRef || { current: null }} // Pass the actual stageRef
            />
          </CanvasErrorBoundary>
        );

      default:
        console.warn('[MainLayer] Unhandled element type:', element.type, 'Element:', element);
        return (
          <CanvasErrorBoundary key={element.id}>
            <Text
              x={element.x}
              y={element.y}
              text={`Unsupported: ${element.type}`}
              fontSize={12}
              fill="#ff6b6b"
              listening={false}
            />
          </CanvasErrorBoundary>
        );
    }
  }, [selectedElementIds, selectedTool, elementsBySection, updateElement, setTextEditingElement, selectElement]);

  // Memoized elements to prevent unnecessary re-renders
  const memoizedElements = useMemo(() => {
    const validElements = Array.from(elements.values()).filter(el => {
      // Skip rendering elements that are children of sticky note containers
      if (el && ((el as any).parentId || (el as any).stickyNoteId)) {
        console.log('🔧 [MainLayer] Skipping sticky note child element:', el.id, el.type);
        return false;
      }
      return el && el.type !== 'connector';
    });
    
    const textElements = validElements.filter(el => el.type === 'text');
    console.log('🔧 [MainLayer] Valid elements for direct rendering:', validElements.length);
    console.log('🔧 [MainLayer] Text elements found:', textElements.length, 
      textElements.map(el => ({ id: el.id, type: el.type, text: (el as any).text })));
    
    const renderedElements = validElements.map(renderElement).filter(Boolean);
    console.log('🔧 [MainLayer] Elements after rendering and filtering:', renderedElements.length);
    
    return renderedElements;
  }, [elements, renderElement]);

  // Draft section rendering for live preview - DISABLED to prevent infinite loops
  const draftSectionElement = null; // useMemo(() => null, []);

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
        listening={false} // No events for drawing line
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
    
    console.log('🔧 [MainLayer] Total nodes to render:', nodes.length);
    return nodes;
  }, [memoizedElements, draftSectionElement, drawingLine]);

  return (
    <CanvasErrorBoundary>
      <Group
        name={name || "main-layer"}
        perfectDrawEnabled={false}
        listening={true}  // CRITICAL FIX: Must listen to allow child event propagation
      >
        {allNodes}
      </Group>
    </CanvasErrorBoundary>
  );
};

export default MainLayer;
