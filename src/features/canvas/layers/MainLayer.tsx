/**
 * MainLayer - Pure Rendering Component
 * 
 * CRITICAL FIX: No event handlers - all events delegated to UnifiedEventHandler
 */

import React, { useMemo, useCallback } from 'react';
import { Group, Line } from 'react-konva';
import Konva from 'konva';
import {
  CanvasElement,
  ElementId,
  SectionId,
  ElementOrSectionId,
  SectionElement
} from '../types/enhanced.types';
import { designSystem } from '../../../design-system';
import { TextShape } from '../shapes/TextShape';
import { ImageShape } from '../shapes/ImageShape';
import { StickyNoteShape } from '../shapes/StickyNoteShape';
import { StarShape } from '../shapes/StarShape';
import { TriangleShape } from '../shapes/TriangleShape';
import { PenShape } from '../shapes/PenShape';
import { SectionShape } from '../shapes/SectionShape';
import { EditableNode } from '../shapes/EditableNode';
import { EnhancedTableElement } from '../components/EnhancedTableElement';
import { ConnectorRenderer } from '../components/ConnectorRenderer';
import KonvaErrorBoundary from '../components/KonvaErrorBoundary';
import { useUnifiedCanvasStore, canvasSelectors } from '../../../stores';

interface MainLayerProps {
  name?: string;
  elements: CanvasElement[];
  selectedElementIds: Set<ElementId>;
  selectedTool: string;
  isDrawing?: boolean;
  currentPath?: number[];
  onLayerDraw?: () => void;
  elementsBySection?: Map<SectionId, CanvasElement[]>;
}

export const MainLayer: React.FC<MainLayerProps> = ({
  name,
  elements,
  selectedElementIds,
  selectedTool,
  isDrawing = false,
  currentPath = [],
  onLayerDraw,
  elementsBySection
}) => {
  console.log('🎯 [MainLayer] Rendering with elements:', elements.length);

  const elementsMap = useUnifiedCanvasStore(canvasSelectors.elements);
  const draftSection = useUnifiedCanvasStore(canvasSelectors.draftSection);

  // Memoized element rendering
  const renderElement = useCallback((element: CanvasElement) => {
    console.log('🎭 [MainLayer] Rendering:', element.type, element.id);

    const isSelected = selectedElementIds.has(element.id);
    const isDraggable = !element.isLocked && element.type !== 'pen' && element.type !== 'pencil';

    // CRITICAL: NO EVENT HANDLERS - All events delegated to UnifiedEventHandler
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
      case 'circle':
        return (
          <KonvaErrorBoundary key={element.id} elementId={element.id}>
            <EditableNode
              element={element}
              isSelected={isSelected}
              selectedTool={selectedTool}
              onElementUpdate={() => {}} // NO-OP - handled by UnifiedEventHandler
              onStartTextEdit={() => {}} // NO-OP - handled by UnifiedEventHandler
            />
          </KonvaErrorBoundary>
        );

      case 'text':
        return (
          <KonvaErrorBoundary key={element.id} elementId={element.id}>
            <TextShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={() => {}} // NO-OP - handled by UnifiedEventHandler
              onStartTextEdit={() => {}} // NO-OP - handled by UnifiedEventHandler
            />
          </KonvaErrorBoundary>
        );

      case 'sticky-note':
        return (
          <KonvaErrorBoundary key={element.id} elementId={element.id}>
            <StickyNoteShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={() => {}} // NO-OP - handled by UnifiedEventHandler
              onStartTextEdit={() => {}} // NO-OP - handled by UnifiedEventHandler
            />
          </KonvaErrorBoundary>
        );

      case 'star':
        return (
          <KonvaErrorBoundary key={element.id} elementId={element.id}>
            <StarShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={() => {}} // NO-OP - handled by UnifiedEventHandler
              onStartTextEdit={() => {}} // NO-OP - handled by UnifiedEventHandler
            />
          </KonvaErrorBoundary>
        );

      case 'triangle':
        return (
          <KonvaErrorBoundary key={element.id} elementId={element.id}>
            <TriangleShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={() => {}} // NO-OP - handled by UnifiedEventHandler
              onStartTextEdit={() => {}} // NO-OP - handled by UnifiedEventHandler
            />
          </KonvaErrorBoundary>
        );

      case 'pen':
      case 'pencil':
        return (
          <KonvaErrorBoundary key={element.id} elementId={element.id}>
            <PenShape
              element={element as any}
              konvaProps={konvaElementProps}
            />
          </KonvaErrorBoundary>
        );

      case 'image':
        return (
          <KonvaErrorBoundary key={element.id} elementId={element.id}>
            <ImageShape
              element={element as any}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={() => {}} // NO-OP - handled by UnifiedEventHandler
              onStartTextEdit={() => {}} // NO-OP - handled by UnifiedEventHandler
            />
          </KonvaErrorBoundary>
        );

      case 'connector':
        return (
          <KonvaErrorBoundary key={element.id} elementId={element.id}>
            <ConnectorRenderer
              element={element as any}
              isSelected={isSelected}
              onSelect={() => {}} // NO-OP - handled by UnifiedEventHandler
              onUpdate={() => {}} // NO-OP - handled by UnifiedEventHandler
              elements={elementsMap}
              sections={new Map()}
            />
          </KonvaErrorBoundary>
        );

      case 'section':
        const sectionChildren = elementsBySection?.get(element.id) || [];
        return (
          <KonvaErrorBoundary key={element.id} elementId={element.id}>
            <SectionShape
              element={element as SectionElement}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
            >
              {sectionChildren.map(child => renderElement(child))}
            </SectionShape>
          </KonvaErrorBoundary>
        );

      case 'table':
        return (
          <KonvaErrorBoundary key={element.id} elementId={element.id}>
            <EnhancedTableElement
              element={element as any}
              isSelected={isSelected}
              onSelect={() => {}} // NO-OP - handled by UnifiedEventHandler
              onUpdate={() => {}} // NO-OP - handled by UnifiedEventHandler
              stageRef={{ current: null }}
            />
          </KonvaErrorBoundary>
        );

      default:
        console.warn('[MainLayer] Unhandled element type:', element.type);
        return null;
    }
  }, [selectedElementIds, elementsMap, elementsBySection]);

  // Memoized elements to prevent unnecessary re-renders
  const memoizedElements = useMemo(() => {
    const validElements = elements.filter(Boolean);
    console.log('🔧 [MainLayer] Valid elements:', validElements.length);
    
    return validElements.map(renderElement).filter(Boolean);
  }, [elements, renderElement]);

  // Draft section rendering for live preview
  const draftSectionElement = useMemo(() => {
    if (!draftSection || draftSection.width < 5 || draftSection.height < 5) {
      return null;
    }

    return (
      <SectionShape
        key="draft-section"
        element={{
          ...draftSection,
          type: 'section',
          title: 'New Section',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          borderColor: '#007bff',
          childElementIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        } as SectionElement}
        isSelected={false}
        konvaProps={{
          id: draftSection.id,
          x: draftSection.x,
          y: draftSection.y,
          draggable: false,
          opacity: 0.7,
          listening: false // No events for draft section
        }}
      />
    );
  }, [draftSection]);

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

  // Layer draw effect
  React.useEffect(() => {
    onLayerDraw?.();
  }, [elements.length, onLayerDraw]);

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
    <KonvaErrorBoundary elementId="main-layer">
      <Group
        name={name || "main-layer"}
        perfectDrawEnabled={false}
        listening={false}  // CRITICAL: Group doesn't listen - children do via event delegation
      >
        {allNodes}
      </Group>
    </KonvaErrorBoundary>
  );
};

export default MainLayer;
