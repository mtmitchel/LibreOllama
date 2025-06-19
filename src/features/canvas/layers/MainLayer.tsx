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
  optimizeLayerProps,  throttleRAF
} from '../utils/events';
// Import enhanced store for consistent section access
import { useCanvasStore as useEnhancedStore } from '../stores/canvasStore.enhanced';

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
  elementsBySection?: Record<string, CanvasElement[]>;
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
  onLayerDraw,
  elementsBySection
}) => {
  // Get section store access for boundary calculations
  const { getSectionById, getSectionForElement, sections } = useEnhancedStore();

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
      !(element.sectionId && selectedElementIds.includes(element.sectionId));    // Calculate rendering position based on section membership
    const section = element.sectionId ? sections[element.sectionId] : null;
    const renderX = section ? section.x + element.x : element.x;
    const renderY = section ? section.y + element.y : element.y;
    
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
            key={element.id}            element={element}
            isSelected={isSelected}
            selectedTool={selectedTool}
            onElementClick={onElementClick}
            onElementDragEnd={onElementDragEnd}
            onElementUpdate={onElementUpdate}
            onStartTextEdit={onStartTextEdit}
          />
        </KonvaErrorBoundary>
      );
    }
    
    // For complex shapes, use existing individual shape components
    switch (element.type) {
      case 'text':
        console.log('🔧 [MAIN LAYER] Rendering TextShape for:', element.id);
        return (
          <KonvaErrorBoundary key={`${element.id}-text-boundary`}>            <TextShape
              key={element.id}
              element={element}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={onElementUpdate}
              stageRef={stageRef}
            />
          </KonvaErrorBoundary>
        );
      
      case 'sticky-note':
        console.log('🔧 [MAIN LAYER] Rendering StickyNoteShape for:', element.id);
        return (
          <KonvaErrorBoundary key={`${element.id}-sticky-boundary`}>            <StickyNoteShape
              key={element.id}
              element={element}
              isSelected={isSelected}
              konvaProps={konvaElementProps}
              onUpdate={onElementUpdate}
              stageRef={stageRef}
            />
          </KonvaErrorBoundary>
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
              draggable={isDraggable}              onClick={(e: Konva.KonvaEventObject<MouseEvent>) => onElementClick(e, element)}
              onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => onElementDragEnd(e, element.id)}
            />
          </KonvaErrorBoundary>
        );
      
      case 'section':
        const sectionChildren = elementsBySection?.[element.id] || [];
        return (
          <SectionShape
            key={element.id}
            element={element as any}
            isSelected={isSelected}
            konvaProps={konvaElementProps}            onUpdate={onElementUpdate}
            onStartTextEdit={onStartTextEdit}
            onSectionResize={onSectionResize || (() => {})}
          >
            {sectionChildren.map(childElement => {
              const childIsSelected = selectedElementIds.includes(childElement.id);
              
              // Create specialized event handlers for child elements
              const handleChildClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
                e.cancelBubble = true; // Prevent section selection
                onElementClick(e, childElement);
              };
              
              const handleChildDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
                e.cancelBubble = true; // Prevent section drag
                
                // Get the new position from Konva (already in section-relative coordinates)
                const newX = e.target.x();
                const newY = e.target.y();
                
                // Update element with relative coordinates
                onElementUpdate(childElement.id, {
                  x: newX,
                  y: newY
                });
                
                // Call the original handler for any additional processing
                onElementDragEnd(e, childElement.id);
              };
              
              const handleChildUpdate = (id: string, updates: Partial<CanvasElement>) => {
                // Ensure updates don't include absolute positioning that would break section containment
                const safeUpdates = { ...updates };
                
                // For resize operations, keep coordinates relative to section
                if ('x' in updates || 'y' in updates) {
                  // Coordinates are already relative, just pass them through
                }
                
                onElementUpdate(id, safeUpdates);
              };
              
              const childKonvaProps = {
                id: childElement.id,
                x: childElement.x, // Use relative coordinates stored in the element
                y: childElement.y, // Use relative coordinates stored in the element
                draggable: selectedTool === 'select' && !childElement.isLocked,
                onClick: handleChildClick,
                onDragEnd: handleChildDragEnd,
                opacity: 1,
                stroke: childIsSelected ? designSystem.colors.primary[500] : (childElement.stroke || undefined),
                strokeWidth: childIsSelected ? (childElement.strokeWidth || 1) + 1.5 : (childElement.strokeWidth || 1),
                shadowColor: childIsSelected ? designSystem.colors.primary[300] : undefined,
                shadowBlur: childIsSelected ? 10 : 0,
                shadowOpacity: childIsSelected ? 0.7 : 0,
                perfectDrawEnabled: false,
              };
                // Render child element with the same logic as main elements
              if (['rectangle', 'circle'].includes(childElement.type)) {
                return (
                  <KonvaErrorBoundary key={`${childElement.id}-child-editable-boundary`}>
                    <EditableNode
                      key={childElement.id}
                      element={childElement}
                      isSelected={childIsSelected}
                      selectedTool={selectedTool}
                      onElementClick={handleChildClick}
                      onElementDragEnd={handleChildDragEnd}
                      onElementUpdate={handleChildUpdate}
                      onStartTextEdit={onStartTextEdit}
                    />
                  </KonvaErrorBoundary>
                );
              }
              
              // Handle other child element types based on type
              switch (childElement.type) {                case 'text':
                  return (
                    <KonvaErrorBoundary key={`${childElement.id}-child-text-boundary`}>
                      <TextShape
                        key={childElement.id}
                        element={childElement}
                        isSelected={childIsSelected}
                        konvaProps={childKonvaProps}
                        onUpdate={onElementUpdate}
                      />
                    </KonvaErrorBoundary>
                  );                case 'sticky-note':
                  return (
                    <KonvaErrorBoundary key={`${childElement.id}-child-sticky-boundary`}>
                      <StickyNoteShape
                        key={childElement.id}
                        element={childElement}
                        isSelected={childIsSelected}
                        konvaProps={childKonvaProps}
                        onUpdate={onElementUpdate}
                      />
                    </KonvaErrorBoundary>
                  );
                case 'star':
                  return (
                    <StarShape
                      key={childElement.id}
                      element={childElement}
                      isSelected={childIsSelected}
                      konvaProps={childKonvaProps}
                      onUpdate={onElementUpdate}
                    />
                  );
                case 'triangle':
                  return (
                    <TriangleShape
                      key={childElement.id}
                      element={childElement}
                      isSelected={childIsSelected}
                      konvaProps={childKonvaProps}
                      onUpdate={onElementUpdate}
                    />
                  );
                default:
                  console.warn('Unhandled child element type:', childElement.type);
                  return null;
              }
            })}
          </SectionShape>
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
