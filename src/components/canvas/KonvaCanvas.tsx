// src/components/Canvas/KonvaCanvas.tsx
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Stage, Layer, Transformer, Rect, Circle, Text, Line, Star, Group, Image } from 'react-konva';
import { Html } from 'react-konva-utils';
import Konva from 'konva';
import { useKonvaCanvasStore, CanvasElement, RichTextSegment } from '../../stores/konvaCanvasStore';
import RichTextRenderer, { RichTextElementType } from './RichTextRenderer';
import SelectableText from './SelectableText';
import ImageElement from './ImageElement';
import { designSystem } from '../../styles/designSystem';
import { useImage } from 'react-konva';

// CanvasElement and RichTextSegment are now imported from the store.
// Local PanZoomState can remain if specific, or be imported if common.
interface PanZoomState {
  scale: number;
  position: { x: number; y: number };
}

interface KonvaCanvasProps {
  width: number;
  height: number;
  onElementSelect?: (element: CanvasElement) => void;
  panZoomState: PanZoomState;
  stageRef: React.RefObject<Konva.Stage | null>;
  onWheelHandler: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onTouchMoveHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchEndHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
}

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
  width,
  height,
  onElementSelect,
  panZoomState,
  stageRef, // Use this passed-in ref
  onWheelHandler,
  onTouchMoveHandler,
  onTouchEndHandler
}) => {
  const { elements, selectedTool, selectedElementId, editingTextId, setSelectedElement, addElement, updateElement, applyTextFormat, setEditingTextId, updateElementText } = useKonvaCanvasStore();

  // Get elements from store
  const elementArray = Object.values(elements);

  // Debug logging
  console.log('🔍 KonvaCanvas Debug:', {
    elementsCount: elementArray.length,
    selectedTool,
    selectedElementId,
    elements: elementArray
  });

  // Canvas initialization check
  useEffect(() => {
    console.log('🎨 KonvaCanvas initialized:', {
      width,
      height,
      selectedTool,
      storeElementsCount: Object.keys(elements).length
    });
  }, [width, height, selectedTool, elements]);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  // stageRef is now passed as a prop
  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  
  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current) return;
    
    if (selectedElementId) {
      const selectedNode = stageRef.current?.findOne(`#${selectedElementId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedElementId]);
  
  // Add virtualization for large numbers of elements
  const MAX_VISIBLE_ELEMENTS = 1000;

  // Handlers for inline text editing
  const handleTextDoubleClick = useCallback((elementId: string) => {
    setEditingTextId(elementId);
  }, [setEditingTextId]);

  const handleTextUpdate = useCallback((elementId: string, newText: string) => {
    updateElementText(elementId, newText);
    // setEditingTextId(null); // SelectableText's onBlur/onKeyDown already calls onEditingCancel which does this
  }, [updateElementText]);

  const handleEditingCancel = useCallback(() => {
    setEditingTextId(null);
  }, [setEditingTextId]);

  const handleFormatChange = useCallback((elementId: string, format: Partial<RichTextSegment>, selection: { start: number; end: number }) => {
    applyTextFormat(elementId, format, selection);
  }, [applyTextFormat]);

  const visibleElements = useMemo(() => {
    if (elementArray.length <= MAX_VISIBLE_ELEMENTS) {
      return elementArray;
    }
    
    // Implement viewport culling here
    return elementArray.slice(0, MAX_VISIBLE_ELEMENTS);
  }, [elementArray]);

  const handleMouseDown = useCallback((e: any) => {
    console.log('🎯 Mouse down - tool:', selectedTool, 'target:', e.target.getClassName());
    
    if (selectedTool === 'pen') {
      setIsDrawing(true);
      const pos = e.target.getStage().getPointerPosition();
      setCurrentPath([pos.x, pos.y]);
    }
  }, [selectedTool]);

  const handleMouseMove = useCallback((e: any) => {
    if (!isDrawing || selectedTool !== 'pen') return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setCurrentPath(prev => [...prev, point.x, point.y]);
  }, [isDrawing, selectedTool]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Pen tool is special, it draws on mouse move and finalizes on mouse up.
    if (selectedTool === 'pen') {
      if (isDrawing && currentPath.length > 2) { // Ensure there's something to draw
        const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newElement: CanvasElement = {
          id: generateId(),
          type: 'pen',
          x: 0, // Pen drawings are positioned by their points array, not a single x/y
          y: 0,
          points: currentPath,
          stroke: designSystem.colors.secondary[800],
          strokeWidth: 3,
          fill: 'transparent',
        };
        addElement(newElement);
      }
      setCurrentPath([]);
      setIsDrawing(false);
      return;
    }

    // For other tools, we create the element on mouse up (a "click" action).
    // We check isDrawing to ensure this only happens after a mouseDown on the canvas.
    // DISABLED: Elements are now created immediately from toolbar, not on canvas clicks
    /*
    if (isDrawing) {
      const stage = e.target.getStage();
      if (!stage) {
        setIsDrawing(false);
        return;
      }

      const pointer = stage.getPointerPosition();
      if (!pointer) {
        setIsDrawing(false);
        return;
      }

      // This is the crucial part: get pointer position relative to the stage's transform
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const pos = transform.point(pointer);

      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const elementId = generateId();
      let newElement: CanvasElement | null = null;

      switch (selectedTool) {
        case 'rectangle':
          newElement = { id: elementId, type: 'rectangle', x: pos.x - 75, y: pos.y - 50, width: 150, height: 100, fill: designSystem.colors.primary[200] };
          break;
        case 'circle':
          newElement = { id: elementId, type: 'circle', x: pos.x, y: pos.y, radius: 60, fill: designSystem.colors.success[500] };
          break;
        case 'star':
          newElement = { id: elementId, type: 'star', x: pos.x, y: pos.y, numPoints: 5, innerRadius: 30, outerRadius: 70, fill: designSystem.colors.warning[500] };
          break;
        case 'line':
          // A simple horizontal line
          newElement = { id: elementId, type: 'line', x: pos.x - 75, y: pos.y, points: [0, 0, 150, 0], stroke: designSystem.colors.secondary[800], strokeWidth: 4 };
          break;
        case 'text':
          newElement = { id: elementId, type: 'text', x: pos.x, y: pos.y, text: 'Double-click to edit', fontSize: 24, fontFamily: designSystem.typography.fontFamily.sans, fill: designSystem.colors.secondary[900], width: 250 };
          break;
        case 'rich-text':
          newElement = { id: elementId, type: 'rich-text', x: pos.x, y: pos.y, segments: [{ text: 'Formatted text', fill: designSystem.colors.primary[500], fontSize: 24, fontFamily: designSystem.typography.fontFamily.sans }], width: 200 };
          break;
      }

      if (newElement) {
        addElement(newElement);
        setSelectedElement(elementId); // Select the new element for immediate interaction
      }
    }
    */
    
    setIsDrawing(false);
  }, [isDrawing, selectedTool, currentPath, addElement, setSelectedElement]);

  // Canvas click handler - ONLY handles selection/deselection
  const handleStageClick = useCallback((e: any) => {
    // Ignore if this is part of a double-click sequence
    if (e.evt?.detail > 1) {
      console.log('🎯 Ignoring stage click - part of double-click sequence');
      return;
    }

    const stage = e.target.getStage();
    
    console.log('🎯 Stage click - target:', e.target.getClassName(), 'targetId:', e.target.id());

    // Check if clicked on empty space
    const clickedOnEmpty = e.target === stage;
    
    console.log('🎯 Clicked on empty space?', clickedOnEmpty);

    if (clickedOnEmpty) {
      // ONLY deselect on empty clicks - NEVER create elements here
      console.log('🎯 Empty space clicked - deselecting all');
      setSelectedElement(null);
      
      // Clear transformer
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
      return;
    }

    // If we get here, user clicked on an existing element - let element handler deal with it
    console.log('🎯 Clicked on existing element');
  }, [setSelectedElement]);

  const handleElementClick = useCallback((e: any, element: CanvasElement) => {
    // Ignore if this is part of a double-click sequence
    if (e.evt?.detail > 1) {
      return;
    }

    e.cancelBubble = true;
    e.evt?.stopPropagation();
    setSelectedElement(element.id);
    onElementSelect?.(element);
  }, [onElementSelect, setSelectedElement]);



  const handleDragEnd = useCallback((e: any, elementId: string) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    updateElement(elementId, { x: newX, y: newY });
  }, [updateElement]);

  const handleTransformEnd = useCallback((e: any, elementId: string) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale and apply to dimensions
    node.scaleX(1);
    node.scaleY(1);
    
    const element = elements[elementId];
    if (!element) return;
    
    const updates: Partial<CanvasElement> = {
      x: node.x(),
      y: node.y(),
    };
    
    // Apply scale to dimensions based on element type
    switch (element.type) {
      case 'rectangle':
        updates.width = Math.max(5, (element.width || 100) * scaleX);
        updates.height = Math.max(5, (element.height || 80) * scaleY);
        break;
      case 'circle':
        updates.radius = Math.max(5, (element.radius || 50) * Math.max(scaleX, scaleY));
        break;
      case 'text':
      case 'rich-text':
        updates.width = Math.max(50, (element.width || 200) * scaleX);
        updates.fontSize = Math.max(10, (element.fontSize || 16) * Math.max(scaleX, scaleY));
        break;
      case 'sticky-note':
        updates.width = Math.max(100, (element.width || 150) * scaleX);
        updates.height = Math.max(80, (element.height || 100) * scaleY);
        break;
      case 'line':
        if (element.points) {
          const scaledPoints = element.points.map((point, index) => 
            index % 2 === 0 ? point * scaleX : point * scaleY
          );
          updates.points = scaledPoints;
        }
        break;
      case 'triangle':
        if (element.points) {
          const scaledPoints = element.points.map((point, index) => 
            index % 2 === 0 ? point * scaleX : point * scaleY
          );
          updates.points = scaledPoints;
        }
        break;
      case 'star':
        updates.radius = Math.max(5, (element.radius || 50) * Math.max(scaleX, scaleY));
        updates.innerRadius = Math.max(2, (element.innerRadius || 25) * Math.max(scaleX, scaleY));
        break;
    }
    
    updateElement(elementId, updates);
  }, [updateElement, elements]);


  
  // Render individual canvas elements based on their type
  const renderElement = useCallback((element: CanvasElement): React.ReactNode => {
    const isSelected = element.id === selectedElementId;
    const isEditing = editingTextId === element.id;

    // Common props for Konva shapes, passed to SelectableText or RichTextRenderer as well
    const konvaElementProps = {
      key: element.id,
      id: element.id,
      x: element.x,
      y: element.y,
      draggable: !isEditing && (selectedTool === 'select' || selectedTool === 'pan'), // Draggable with select/pan tool and not editing
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleElementClick(e, element),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, element.id),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(e, element.id),
      opacity: 1, // Keep elements fully visible even when editing
      stroke: isSelected ? designSystem.colors.primary[500] : element.stroke,
      strokeWidth: isSelected ? (element.strokeWidth || 1) + 1.5 : element.strokeWidth,
      shadowColor: isSelected ? designSystem.colors.primary[300] : undefined,
      shadowBlur: isSelected ? 10 : 0,
      shadowOpacity: isSelected ? 0.7 : 0,
      perfectDrawEnabled: false, // Improves performance for many shapes
    };

    switch (element.type) {
      case 'rectangle':
        return (
          <Rect
            {...konvaElementProps}
            width={element.width}
            height={element.height}
            fill={element.fill || designSystem.colors.primary[100]}
            cornerRadius={designSystem.borderRadius.md}
          />
        );
      case 'circle':
        return (
          <Circle
            {...konvaElementProps}
            radius={element.radius}
            fill={element.fill || designSystem.colors.secondary[100]}
          />
        );
      case 'text':
        return (
          <SelectableText
            element={element as CanvasElement & { type: 'text', text?: string, fontSize?: number, x: number, y: number, id: string }}
            onFormatChange={handleFormatChange}
            {...konvaElementProps}
            onDblClick={(e) => {
              e.cancelBubble = true;
              handleTextDoubleClick(element.id);
            }}
            isEditing={editingTextId === element.id}
            onTextUpdate={handleTextUpdate}
            onEditingCancel={handleEditingCancel}
          />
        );
      case 'rich-text':
        return (
          <RichTextRenderer
            element={element as RichTextElementType}
            {...konvaElementProps}
            onFormatChange={handleFormatChange}
            onDblClick={(e) => {
              e.cancelBubble = true;
              e.evt?.stopPropagation();
              handleTextDoubleClick(element.id);
            }}
            isEditing={editingTextId === element.id}
            onTextUpdate={handleTextUpdate}
            onEditingCancel={handleEditingCancel}
          />
        );
      case 'line':
      case 'arrow':
      case 'pen':
        return (
          <Line
            {...konvaElementProps}
            points={element.points}
            stroke={element.stroke || (element.type === 'pen' ? designSystem.colors.secondary[800] : designSystem.canvasStyles.border)}
            strokeWidth={element.strokeWidth || (element.type === 'pen' ? 3 : 2)}
            lineCap="round"
            lineJoin="round"
            tension={element.type === 'pen' ? 0.5 : 0}
            // Add arrow heads for arrow type
            {...(element.type === 'arrow' || element.arrowEnd ? {
              pointerLength: 20,
              pointerWidth: 20,
              pointerAtBeginning: element.arrowStart,
              pointerAtEnding: element.arrowEnd !== false
            } : {})}
          />
        );
      case 'star':
        return (
          <Star
            {...konvaElementProps}
            numPoints={element.sides || 5}
            innerRadius={element.innerRadius || (element.width || 100) / 4}
            outerRadius={element.radius || (element.width || 100) / 2}
            fill={element.fill || designSystem.colors.warning[500]}
            stroke={element.stroke || designSystem.colors.warning[600]}
            strokeWidth={element.strokeWidth || 2}
          />
        );
      case 'triangle':
        return (
          <Line 
            {...konvaElementProps}
            points={[
              0, -(element.height || 60) / 2, 
              (element.width || 100) / 2, (element.height || 60) / 2, 
              -(element.width || 100) / 2, (element.height || 60) / 2, 
            ]}
            closed
            fill={element.fill || designSystem.colors.success[500]}
            stroke={element.stroke || designSystem.colors.success[500]} // Assuming success[500] for both fill and stroke if not specified
            strokeWidth={element.strokeWidth || 2}
          />
        );
      case 'sticky-note':
        return (
          <Group {...konvaElementProps}>
            <Rect
              width={element.width || 150}
              height={element.height || 100}
              fill={element.backgroundColor || designSystem.colors.stickyNote.yellow}
              shadowColor={designSystem.colors.secondary[500]} // Using a mid-gray for shadow color
              shadowBlur={5}
              shadowOffsetX={2}
              shadowOffsetY={2}
              cornerRadius={designSystem.borderRadius.sm}
            />
            {isEditing && editingTextId === element.id ? (
              <Html>
                <textarea
                  style={{
                    position: 'absolute',
                    left: designSystem.spacing.sm,
                    top: designSystem.spacing.sm,
                    width: `${(element.width || 150) - designSystem.spacing.md}px`,
                    height: `${(element.height || 100) - designSystem.spacing.md}px`,
                    fontSize: `${element.fontSize || designSystem.typography.fontSize.sm}px`,
                    fontFamily: element.fontFamily || designSystem.typography.fontFamily.sans,
                    color: element.textColor || designSystem.colors.secondary[700],
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    padding: '4px'
                  }}
                  defaultValue={element.text}
                  autoFocus
                  onBlur={(e) => {
                    updateElement(element.id, { text: e.target.value });
                    setEditingTextId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingTextId(null);
                    }
                  }}
                />
              </Html>
            ) : (
              <Text
                text={element.text || 'Double-click to edit'} // Simple text for sticky note content
                fontSize={element.fontSize || designSystem.typography.fontSize.sm}
                fontFamily={element.fontFamily || designSystem.typography.fontFamily.sans}
                fill={element.textColor || designSystem.colors.secondary[700]} // Default text color
                width={element.width ? element.width - designSystem.spacing.md : 150 - designSystem.spacing.md}
                height={element.height ? element.height - designSystem.spacing.md : 100 - designSystem.spacing.md}
                padding={designSystem.spacing.sm}
                align="left"
                verticalAlign="top"
                onDblClick={(e) => {
                  e.cancelBubble = true;
                  setEditingTextId(element.id);
                }}
              />
            )}
          </Group>
        );
      case 'image':
        return (
          <ImageElement
            key={element.id}
            element={element}
            konvaProps={konvaElementProps}
          />
        );
      default:
        console.warn('Unhandled element type in renderElement:', element.type);
        return null;
    }
  }, [selectedElementId, editingTextId, selectedTool, applyTextFormat, designSystem, setSelectedElement, updateElement, onElementSelect, handleFormatChange, handleTextDoubleClick, handleTextUpdate, handleEditingCancel]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && !editingTextId) {
          const { deleteElement } = useKonvaCanvasStore.getState();
          deleteElement(selectedElementId);
          setSelectedElement(null);
        }
      } else if (e.key === 'Escape') {
        setSelectedElement(null);
        if (editingTextId) {
          // Call the store action to cancel editing
          setEditingTextId(null); 
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, editingTextId, setSelectedElement, setEditingTextId]);

  return (
    <div 
      className="konva-canvas-container"
      style={{
        border: `2px solid ${designSystem.colors.secondary[200]}`,
        borderRadius: `${designSystem.borderRadius.lg}px`,
        boxShadow: designSystem.shadows.lg,
        background: designSystem.canvasStyles.background,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Canvas ready indicator */}
      {elementArray.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#3B82F6',
          fontFamily: designSystem.typography.fontFamily.sans,
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          🎨 Canvas ready! Select a tool from the toolbar to create elements
        </div>
      )}
        <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onClick={handleStageClick}
        onWheel={onWheelHandler}
        onTouchMove={onTouchMoveHandler}
        onTouchEnd={onTouchEndHandler}
        draggable={selectedTool === 'pan'}
        x={panZoomState.position.x}
        y={panZoomState.position.y}
        scaleX={panZoomState.scale}
        scaleY={panZoomState.scale}
        style={{ 
          display: 'block',
          backgroundColor: designSystem.canvasStyles.background,
          cursor: selectedTool === 'pan' ? 'grab' : 'default'
        }}
      >
        <Layer ref={layerRef}>
          {visibleElements.map(element => renderElement(element))}
          {isDrawing && currentPath.length > 0 && (
            <Line
              points={currentPath}
              stroke="#000000"
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
              tension={0.5}
            />
          )}
          {/* Transformer for resizing selected elements */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize to minimum size
              if (newBox.width < 20 || newBox.height < 20) {
                return oldBox;
              }
              return newBox;
            }}
            rotateEnabled={true}
            enabledAnchors={[
              'top-left', 'top-center', 'top-right',
              'middle-left', 'middle-right',
              'bottom-left', 'bottom-center', 'bottom-right'
            ]}
            borderStroke={designSystem.canvasStyles.selectionColor}
            borderStrokeWidth={2}
            borderDash={[5, 5]}
            anchorFill="#FFFFFF"
            anchorStroke={designSystem.canvasStyles.selectionBorder}
            anchorStrokeWidth={2}
            anchorSize={10}
            anchorCornerRadius={2}
            rotationAnchorOffset={25}
            rotationSnapTolerance={5}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default KonvaCanvas;
