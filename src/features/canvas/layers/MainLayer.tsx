// src/features/canvas/layers/MainLayer.tsx
import React, { useMemo, useCallback } from 'react';
import { Layer, Group, Line } from 'react-konva';
import Konva from 'konva';
import { CanvasElement } from '../stores/types';
import { designSystem } from '../../../styles/designSystem';
import { TextShape } from '../shapes/TextShape';
import { ImageShape } from '../shapes/ImageShape';
import { StickyNoteShape } from '../shapes/StickyNoteShape';
import { StarShape } from '../shapes/StarShape';
import { TriangleShape } from '../shapes/TriangleShape';
import { PenShape } from '../shapes/PenShape';
import { SectionShape } from '../shapes/SectionShape';
import { EditableNode } from '../shapes/EditableNode';
import { EnhancedTableElement } from '../components/EnhancedTableElement';
import KonvaErrorBoundary from '../components/KonvaErrorBoundary';
import {
  createEventDelegation,
  optimizeLayerProps,
  throttleRAF
} from '../utils/events';
// Import section utilities
import { useSections } from '../stores/canvasStore';

interface MainLayerProps {
  elements: CanvasElement[];
  selectedElementIds: string[];
  selectedTool: string;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: string) => void;
  onSectionResize?: (sectionId: string, newWidth: number, newHeight: number) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null>;
  isDrawing?: boolean;
  currentPath?: number[];
  onLayerDraw?: () => void;
}

/**
 * MainLayer - Renders primary interactive canvas elements
 * - Shapes, text, images, sections
 * - Interactive elements with drag/selection support
 * - Performance optimized rendering with event delegation
 */
export const MainLayer: React.FC<MainLayerProps> = ({
  elements,
  selectedElementIds,
  selectedTool,
  onElementClick,
  onElementDragEnd,
  onElementUpdate,
  onStartTextEdit,
  onSectionResize,
  stageRef,
  isDrawing = false,
  currentPath = [],
  onLayerDraw
}) => {  // Get section store access for boundary calculations
  const { getSectionById, getSectionForElement, sections } = useSections();

  // Throttled update functions for performance
  const throttledUpdate = useCallback(
    throttleRAF((id: string, updates: Partial<CanvasElement>) => {
      onElementUpdate(id, updates);
    }),
    [onElementUpdate]
  );
  // Create drag boundary function for elements inside sections
  const createDragBoundFunc = useCallback((element: CanvasElement) => {
    return (pos: { x: number; y: number }) => {
      const sectionId = getSectionForElement(element.id);
      if (!sectionId) {
        // No section constraint - allow free movement
        return pos;
      }

      const section = getSectionById(sectionId);
      if (!section) {
        return pos;
      }

      // Calculate element bounds
      const elementWidth = element.width || 0;
      const elementHeight = element.height || 0;
      
      // For elements in sections, the pos comes as absolute coordinates
      // but we need to constrain relative to the section
      const relativeX = pos.x - section.x;
      const relativeY = pos.y - section.y - (section.titleBarHeight || 32);
      
      // Constrain to section boundaries with some padding
      const padding = 5;
      const minX = padding;
      const maxX = section.width - elementWidth - padding;
      const minY = padding;
      const maxY = section.height - (section.titleBarHeight || 32) - elementHeight - padding;

      const constrainedRelativeX = Math.max(minX, Math.min(maxX, relativeX));
      const constrainedRelativeY = Math.max(minY, Math.min(maxY, relativeY));

      // Convert back to absolute coordinates for Konva
      return {
        x: section.x + constrainedRelativeX,
        y: section.y + (section.titleBarHeight || 32) + constrainedRelativeY
      };
    };
  }, [getSectionById, getSectionForElement]);

  // Create throttled event handlers for performance
  const throttledDragEnd = useMemo(() => 
    throttleRAF((e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
      onElementDragEnd(e, elementId);
    }), [onElementDragEnd]
  );

  // Create event delegation for the layer
  const layerEventHandlers = useMemo(() => {
    return createEventDelegation(
      {
        enableClick: true,
        enableDrag: true,
        enableHover: false // Disabled for performance
      },
      {
        onElementClick: (elementId: string, event: any) => {
          const element = elements.find(el => el.id === elementId);
          if (element) {
            onElementClick(event, element);
          }
        },
        onElementDragEnd: (elementId: string, event: any) => {
          throttledDragEnd(event, elementId);
        }
      }
    );
  }, [elements, onElementClick, throttledDragEnd]);

  // Optimize layer props for performance
  const layerProps = useMemo(() => 
    optimizeLayerProps({
      listening: true,
      name: "main-layer"
    }, true), []
  );

  // Render individual elements with comprehensive type handling
  const renderElement = useCallback((element: CanvasElement) => {
    const isSelected = selectedElementIds.includes(element.id);
    const isEditing = false; // This will be handled by text editing overlay
      // Elements inside sections should remain draggable for repositioning
    const isDraggable = !isEditing &&
      (selectedTool === 'select' || selectedTool === element.type) &&
      !(element as any).isLocked &&
      !(element.sectionId && selectedElementIds.includes(element.sectionId));
      // Calculate rendering position based on section membership
    const section = element.sectionId ? sections[element.sectionId] : null;
    const renderX = section ? section.x + element.x : element.x;
    const renderY = section ? section.y + (section.titleBarHeight || 32) + element.y : element.y;
    
    // Common props for Konva shapes
    const konvaElementProps = {
      id: element.id,
      x: renderX,
      y: renderY,
      draggable: isDraggable,
      dragBoundFunc: isDraggable ? createDragBoundFunc(element) : undefined,
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => onElementClick(e, element),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onElementDragEnd(e, element.id),
      opacity: 1,
      stroke: isSelected ? designSystem.colors.primary[500] : (element.stroke || undefined),
      strokeWidth: isSelected ? (element.strokeWidth || 1) + 1.5 : (element.strokeWidth || 1),
      shadowColor: isSelected ? designSystem.colors.primary[300] : undefined,
      shadowBlur: isSelected ? 10 : 0,
      shadowOpacity: isSelected ? 0.7 : 0,
      perfectDrawEnabled: false,
    };
    
    // For basic shapes (rectangle, circle), use EditableNode wrapper pattern
    if (['rectangle', 'circle'].includes(element.type)) {
      console.log('🔧 [MAIN LAYER] Rendering EditableNode for:', element.type, element.id);
      return (
        <KonvaErrorBoundary key={`${element.id}-editable-boundary`}>
          <EditableNode
            key={element.id}
            element={element}
            isSelected={isSelected}
            selectedTool={selectedTool}
            onElementClick={onElementClick}
            onElementDragEnd={onElementDragEnd}
            onElementUpdate={onElementUpdate}
            onStartTextEdit={onStartTextEdit}
          />        </KonvaErrorBoundary>
      );
    }
    
    // For complex shapes, use existing individual shape components
    switch (element.type) {
      case 'text':
        console.log('🔧 [MAIN LAYER] Rendering TextShape for:', element.id);
        return (
          <KonvaErrorBoundary key={`${element.id}-text-boundary`}>
            <TextShape
              key={element.id}
              element={element}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={onElementUpdate}
              stageRef={stageRef}
            />          </KonvaErrorBoundary>
        );
      
      case 'sticky-note':
        console.log('🔧 [MAIN LAYER] Rendering StickyNoteShape for:', element.id);
        return (
          <KonvaErrorBoundary key={`${element.id}-sticky-boundary`}>
            <StickyNoteShape
              key={element.id}
              element={element}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={onElementUpdate}
              stageRef={stageRef}
            />          </KonvaErrorBoundary>
        );
      
      case 'rich-text':
        return (
          <TextShape
            key={element.id}
            element={element}
            isSelected={isSelected}
            konvaProps={konvaElementProps}
            onUpdate={onElementUpdate}
            stageRef={stageRef}
          />
        );
      
      case 'pen':
        console.log('🖊️ [MAIN LAYER] Rendering pen element:', element.id, 'points:', element.points);
        return (
          <PenShape
            key={element.id}
            element={element}
            isSelected={isSelected}
            konvaProps={konvaElementProps}
            onUpdate={onElementUpdate}
          />
        );
      
      case 'star':
        return (
          <StarShape
            key={element.id}
            element={element}
            isSelected={isSelected}
            konvaProps={konvaElementProps}
            onUpdate={onElementUpdate}
          />
        );
      
      case 'triangle':
        return (
          <TriangleShape
            key={element.id}
            element={element}
            isSelected={isSelected}
            konvaProps={konvaElementProps}
            onUpdate={onElementUpdate}
          />
        );
      case 'image':
        return (
          <ImageShape
            key={element.id}
            element={element}
            isSelected={isSelected}
            konvaProps={konvaElementProps}
            onUpdate={onElementUpdate}          />
        );
      
      case 'connector':
        console.log('🔧 [MAIN LAYER] Rendering connector element:', element.id);
        return (
          <KonvaErrorBoundary key={`${element.id}-connector-boundary`}>
            <Line
              key={element.id}
              id={element.id}
              x={element.x}
              y={element.y}
              points={element.points || [0, 0, 100, 100]}
              stroke={element.stroke || '#000000'}
              strokeWidth={element.strokeWidth || 2}
              lineCap="round"
              lineJoin="round"
              draggable={isDraggable}
              onClick={(e: Konva.KonvaEventObject<MouseEvent>) => onElementClick(e, element)}
              onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => onElementDragEnd(e, element.id)}
            />          </KonvaErrorBoundary>
        );
      
      case 'section':
        return (
          <SectionShape
            key={element.id}
            element={element as any}
            isSelected={isSelected}
            konvaProps={konvaElementProps}
            onUpdate={onElementUpdate}
            onStartTextEdit={onStartTextEdit}
            onSectionResize={onSectionResize || (() => {})}
          />
        );
      
      case 'table':
        console.log('🔧 [MAIN LAYER] Rendering table element:', element.id, element);
        return (
          <KonvaErrorBoundary key={`${element.id}-error-boundary`}>
            <EnhancedTableElement
              key={element.id}
              element={element}
              isSelected={isSelected}              onSelect={(element) => {
                const fakeEvent = {} as Konva.KonvaEventObject<MouseEvent>;
                onElementClick(fakeEvent, element);
              }}
              onUpdate={(updates) => {
                onElementUpdate(element.id, updates);
              }}
              onDragEnd={(e) => onElementDragEnd(e, element.id)}
              stageRef={stageRef || { current: null }}
            />
          </KonvaErrorBoundary>
        );
      default:
        console.warn('Unhandled element type in MainLayer:', element.type);
        return null;
    }
  }, [selectedElementIds, selectedTool, onElementClick, onElementDragEnd, onElementUpdate, onStartTextEdit]);

  // Effect to trigger layer redraw when needed
  React.useEffect(() => {
    if (onLayerDraw) {
      onLayerDraw();
    }
  }, [elements.length, onLayerDraw]);
  
  return (
    <Layer listening={true} name="main-layer">
      <Group 
        {...layerProps}
        {...layerEventHandlers}
      >
        {/* Render all main elements */}
        {elements.map(renderElement)}
        
        {/* Preview line during pen drawing */}
        {isDrawing && currentPath.length > 0 && selectedTool === 'pen' && (
          <Line
            points={currentPath}
            stroke={designSystem.colors.secondary[800]}
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
            opacity={0.7}
            listening={false}
          />
        )}
      </Group>
    </Layer>
  );
};
