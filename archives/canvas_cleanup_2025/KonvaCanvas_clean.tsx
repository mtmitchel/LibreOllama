// src/components/Canvas/KonvaCanvas.tsx
import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Stage, Layer, Text, Rect, Circle, Line, Transformer, Star, Group } from 'react-konva';
import Konva from 'konva';
import { useKonvaCanvasStore } from '../../stores/konvaCanvasStore';
import { designSystem, getStickyNoteColors } from '../../styles/designSystem';

interface CanvasElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'pen' | 'triangle' | 'star' | 'sticky-note';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  sides?: number; // for star
  innerRadius?: number; // for star
  backgroundColor?: string; // for sticky notes
  textColor?: string; // for sticky notes
}

interface KonvaCanvasProps {
  width: number;
  height: number;
  onElementSelect?: (element: CanvasElement) => void;
}

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
  width,
  height,
  onElementSelect
}) => {
  // Get elements from store
  const { elements, addElement, updateElement, setSelectedElement, selectedElementId, selectedTool } = useKonvaCanvasStore();
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
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
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

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentPath.length > 0) {
      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newElement: CanvasElement = {
        id: generateId(),
        type: 'pen',
        x: 0,
        y: 0,
        points: currentPath,
        stroke: '#000000',
        strokeWidth: 2,
        fill: 'transparent'
      };
      
      addElement(newElement);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  }, [isDrawing, currentPath, addElement]);

  // Canvas click handler - ONLY handles selection/deselection
  const handleStageClick = useCallback((e: any) => {
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
    e.cancelBubble = true;
    setSelectedElement(element.id);
    onElementSelect?.(element);
  }, [onElementSelect, setSelectedElement]);

  const handleTextDoubleClick = useCallback((element: CanvasElement) => {
    if (element.type !== 'text' && element.type !== 'sticky-note') return;
    
    setEditingTextId(element.id);
    setSelectedElement(null); // Hide transformer during editing
    
    // Create HTML input overlay for text editing
    const stage = stageRef.current;
    if (!stage) return;
    
    const stageBox = stage.container().getBoundingClientRect();
    const textElement = stage.findOne(`#${element.id}`);
    
    if (!textElement) return;
    
    // Calculate absolute position
    const absolutePosition = textElement.getAbsolutePosition();
    
    // Create textarea for multi-line text editing
    const textarea = document.createElement('textarea');
    textarea.value = element.text || '';
    textarea.style.position = 'absolute';
    textarea.style.left = `${stageBox.left + absolutePosition.x + (element.type === 'sticky-note' ? 10 : 0)}px`;
    textarea.style.top = `${stageBox.top + absolutePosition.y + (element.type === 'sticky-note' ? 10 : 0)}px`;
    textarea.style.width = `${Math.max((element.width || 120) - (element.type === 'sticky-note' ? 20 : 0), 120)}px`;
    textarea.style.height = `${Math.max((element.height || 30) - (element.type === 'sticky-note' ? 20 : 0), 30)}px`;
    textarea.style.fontSize = element.type === 'sticky-note' ? '14px' : '16px';
    textarea.style.fontFamily = 'Arial, sans-serif';
    textarea.style.border = '2px solid #3B82F6';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '4px 6px';
    textarea.style.backgroundColor = element.type === 'sticky-note' ? 'transparent' : 'white';
    textarea.style.zIndex = '1000';
    textarea.style.resize = 'none';
    textarea.style.outline = 'none';
    textarea.style.color = element.textColor || '#333333';
    
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    const finishEditing = () => {
      const newText = textarea.value || (element.type === 'sticky-note' ? 'Double-click to edit' : 'Text');
      
      if (element.type === 'text') {
        // Calculate text width/height based on content for regular text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          context.font = '16px Arial';
          const metrics = context.measureText(newText);
          const textWidth = Math.max(metrics.width + 20, 120);
          const textHeight = Math.max((newText.split('\n').length * 20) + 10, 30);
          
          updateElement(element.id, { 
            text: newText,
            width: textWidth,
            height: textHeight
          });
        } else {
          updateElement(element.id, { text: newText });
        }
      } else {
        // For sticky notes, just update the text
        updateElement(element.id, { text: newText });
      }
      
      document.body.removeChild(textarea);
      setEditingTextId(null);
      setSelectedElement(element.id); // Restore selection
    };
    
    textarea.addEventListener('blur', finishEditing);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        finishEditing();
      } else if (e.key === 'Escape') {
        document.body.removeChild(textarea);
        setEditingTextId(null);
        setSelectedElement(element.id);
      }
    });
  }, [updateElement, setSelectedElement]);

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
        updates.width = Math.max(20, (element.width || 120) * scaleX);
        updates.height = Math.max(15, (element.height || 30) * scaleY);
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

  const renderElement = (element: CanvasElement) => {
    const isSelected = element.id === selectedElementId;
    const isEditing = element.id === editingTextId;
    
    const commonProps = {
      key: element.id,
      id: element.id,
      x: element.x,
      y: element.y,
      fill: element.fill,
      stroke: isSelected ? '#EF4444' : element.stroke,
      strokeWidth: isSelected ? 3 : element.strokeWidth,
      draggable: !isEditing,
      onClick: (e: any) => handleElementClick(e, element),
      onDragEnd: (e: any) => handleDragEnd(e, element.id),
      onTransformEnd: (e: any) => handleTransformEnd(e, element.id),
      // Add opacity when editing text
      opacity: isEditing ? 0.5 : 1,
    };

    switch (element.type) {
      case 'text':
        return (
          <Text
            {...commonProps}
            text={element.text || 'Text'}
            fontSize={16}
            fontFamily="Arial"
            width={element.width}
            height={element.height}
            align="left"
            verticalAlign="top"
            wrap="word"
            onDblClick={() => handleTextDoubleClick(element)}
          />
        );
      case 'sticky-note':
        return (
          <Group
            {...commonProps}
            onDblClick={() => handleTextDoubleClick(element)}
          >
            <Rect
              width={element.width || 150}
              height={element.height || 100}
              fill={element.backgroundColor || designSystem.colors.stickyNote.yellow}
              stroke={element.stroke || designSystem.colors.stickyNote.yellowBorder}
              strokeWidth={isSelected ? 3 : 2}
              cornerRadius={8}
              shadowColor="rgba(0, 0, 0, 0.15)"
              shadowBlur={6}
              shadowOffset={{ x: 2, y: 2 }}
              shadowOpacity={0.8}
            />
            <Text
              x={10}
              y={10}
              text={element.text || 'Double-click to edit'}
              fontSize={14}
              fontFamily="Arial"
              fill={element.textColor || '#333333'}
              width={(element.width || 150) - 20}
              height={(element.height || 100) - 20}
              align="left"
              verticalAlign="top"
              wrap="word"
              lineHeight={1.2}
            />
          </Group>
        );
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            width={element.width}
            height={element.height}
          />
        );
      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={element.radius}
          />
        );
      case 'line':
        return (
          <Line
            {...commonProps}
            points={element.points || [0, 0, 100, 0]}
            lineCap="round"
            lineJoin="round"
          />
        );
      case 'triangle':
        return (
          <Line
            {...commonProps}
            points={element.points || [0, -50, -50, 50, 50, 50, 0, -50]}
            closed={true}
            lineCap="round"
            lineJoin="round"
          />
        );
      case 'star':
        return (
          <Star
            {...commonProps}
            numPoints={element.sides || 5}
            innerRadius={element.innerRadius || 25}
            outerRadius={element.radius || 50}
          />
        );
      case 'pen':
        return (
          <Line
            {...commonProps}
            points={element.points || []}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
            // Pen strokes should not be transformable
            draggable={false}
          />
        );
      default:
        return null;
    }
  };

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
          setEditingTextId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, editingTextId, setSelectedElement]);

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
        style={{ 
          display: 'block',
          backgroundColor: designSystem.canvasStyles.background
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
