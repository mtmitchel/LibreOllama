// Example: KonvaCanvas integration with fixed stores
import React, { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Stage, Layer, Group, Rect, Text } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useCanvasStore } from '../stores/canvasStore.enhanced';

/**
 * Example integration showing how to use the fixed stores with Konva
 */
export const KonvaCanvasIntegration: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  
  // Use the enhanced store
  const store = useCanvasStore();
  const { 
    elements, 
    sections, 
    stage,
    setStage,
    handleElementDrop,
    updateElement,
    handleSectionDragEnd 
  } = store;

  // Set stage reference when mounted
  useEffect(() => {
    if (stageRef.current && !stage) {
      setStage(stageRef.current);
    }
  }, [stage, setStage]);

  // Handle element drag end with proper coordinate handling
  const handleElementDragEnd = (e: KonvaEventObject<DragEvent>, elementId: string) => {
    const node = e.target;
    const position = node.position();
    
    // Let the store handle section detection and coordinate conversion
    handleElementDrop(elementId, position);
    
    // The visual position is already correct due to Konva's handling
    // We just need to update the stored position
    const element = store.getElementById(elementId);
    if (element) {
      // Position is already relative if in a section, absolute if not
      updateElement(elementId, {
        x: position.x,
        y: position.y
      });
    }
  };

  // Handle section drag end
  const handleSectionDragEndEvent = (e: KonvaEventObject<DragEvent>, sectionId: string) => {
    const node = e.target;
    const position = node.position();
    
    // Update section position
    const result = handleSectionDragEnd(sectionId, position.x, position.y);
    
    if (result) {
      // Elements inside use relative coordinates, so they move automatically
      // with the Group transform - no manual update needed
      console.log(`Section ${sectionId} moved. ${result.containedElementIds.length} elements moved with it.`);
    }
  };

  // Render sections with their contained elements
  const renderSection = (section: any) => {
    // Get elements contained in this section
    const containedElements = Object.values(elements).filter(
      el => el.sectionId === section.id
    );

    return (
      <Group
        key={section.id}
        id={section.id}
        x={section.x}
        y={section.y}
        draggable
        onDragEnd={(e) => handleSectionDragEndEvent(e, section.id)}
      >
        {/* Section background */}
        <Rect
          width={section.width}
          height={section.height}
          fill={section.backgroundColor}
          stroke={section.borderColor}
          strokeWidth={section.borderWidth}
          cornerRadius={section.cornerRadius}
        />
        
        {/* Section title bar */}
        <Rect
          width={section.width}
          height={section.titleBarHeight}
          fill={section.borderColor}
          opacity={0.1}
        />
        
        {/* Section title */}
        <Text
          x={10}
          y={8}
          text={section.title}
          fontSize={section.titleFontSize}
          fill={section.titleColor}
        />
        
        {/* Render contained elements with relative coordinates */}
        {containedElements.map(element => renderElement(element, true))}
      </Group>
    );
  };

  // Render individual elements
  const renderElement = (element: any, isInSection = false) => {
    // Common props for all draggable elements
    const commonProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      draggable: !isInSection, // Only draggable if not in a section
      onDragEnd: isInSection ? undefined : (e: KonvaEventObject<DragEvent>) => handleElementDragEnd(e, element.id),
    };

    switch (element.type) {
      case 'rectangle':
        return (
          <Rect
            key={element.id}
            {...commonProps}
            width={element.width}
            height={element.height}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
          />
        );
      
      case 'circle':
        return (
          <Rect
            key={element.id}
            {...commonProps}
            width={element.radius * 2}
            height={element.radius * 2}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            cornerRadius={element.radius}
          />
        );
      
      // Add other element types as needed
      default:
        return null;
    }
  };

  // Get free elements (not in any section)
  const freeElements = Object.values(elements).filter(el => !el.sectionId);

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={(e) => {
        // Handle stage clicks for element creation
        const stage = e.target.getStage();
        if (stage && e.target === stage) {
          const pointerPosition = stage.getPointerPosition();
          if (pointerPosition) {
            // You can trigger element creation here
            console.log('Stage clicked at:', pointerPosition);
          }
        }
      }}
    >
      <Layer>
        {/* Render all sections first (they contain their own elements) */}
        {Object.values(sections).map(section => renderSection(section))}
        
        {/* Render free elements (not in any section) */}
        {freeElements.map(element => renderElement(element, false))}
      </Layer>
    </Stage>
  );
};

/**
 * Example: Element creation with section detection
 */
export const createElement = (type: string, position: { x: number; y: number }) => {
  const store = useCanvasStore.getState();
  
  // Find if we're creating inside a section
  const sectionId = store.findSectionAtPoint(position);
  
  // Base element properties
  const newElement = {
    id: `${type}-${Date.now()}`,
    type,
    x: position.x,
    y: position.y,
    width: 100,
    height: 100,
    fill: '#3B82F6',
    stroke: '#1E40AF',
    strokeWidth: 2,
    sectionId: undefined as string | undefined
  };
  
  // If creating inside a section, adjust coordinates
  if (sectionId) {
    const section = store.getSectionById(sectionId);
    if (section) {
      // Convert to section-relative coordinates
      newElement.x -= section.x;
      newElement.y -= section.y;
      newElement.sectionId = sectionId;
    }
  }
  
  // Add element to store
  store.addElement(newElement);
  
  // Update section containment
  if (sectionId) {
    store.addElementToSection(newElement.id, sectionId);
  }
  
  return newElement.id;
};

/**
 * Example: Creating a section and capturing existing elements
 */
export const createSectionWithCapture = (x: number, y: number, width: number, height: number) => {
  const store = useCanvasStore.getState();
  
  // Create the section
  const sectionId = store.createSection(x, y, width, height, 'New Section');
  
  // Capture any existing free elements within the section bounds
  store.captureElementsAfterSectionCreation(sectionId);
  
  return sectionId;
};