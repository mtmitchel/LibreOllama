// src/components/canvas/CanvasContainer.tsx
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import { useCanvasPerformance } from '../hooks/canvas/useCanvasPerformance';
import { useViewportControls } from '../hooks/canvas/useViewportControls';
import { useSelectionManager } from '../hooks/canvas/useSelectionManager';
import { useCanvasHistory } from '../hooks/canvas/useCanvasHistory';
// FIXED: Use the new modular store consistently
import { useCanvasStore } from '../stores/canvasStore';
import type { CanvasElement } from '../stores/types';
import { designSystem } from '../../../styles/designSystem';

interface CanvasContainerProps {
  width: number;
  height: number;
  onElementSelect?: (element: CanvasElement) => void;
  onStartTextEdit?: (elementId: string) => void;
  className?: string;
}

/**
 * CanvasContainer - Main canvas container component
 * - App state coordination and layout shell
 * - Integration point for all stores and hooks
 * - Maintains backward compatibility with existing components
 * - Performance monitoring integration
 */
export const CanvasContainer: React.FC<CanvasContainerProps> = ({
  width,
  height,
  onElementSelect,
  onStartTextEdit,
  className = ''
}) => {
  // Stage reference
  const stageRef = useRef<Konva.Stage | null>(null);


  // Canvas state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [connectorStart, setConnectorStart] = useState<{ x: number; y: number; elementId?: string; anchor?: string } | null>(null);
  const [connectorEnd, setConnectorEnd] = useState<{ x: number; y: number; elementId?: string; anchor?: string } | null>(null);
  const [isDrawingSection, setIsDrawingSection] = useState(false);
  const [previewSection, setPreviewSection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Custom hooks
  const { recordRenderTime, startRenderTiming } = useCanvasPerformance({ enableLogging: true });
  const { zoom, pan, zoomIn, zoomOut } = useViewportControls();
  const { selectSingle, clear: clearSelection, selectedElementIds } = useSelectionManager();
  const { addToHistory } = useCanvasHistory();  // Store hooks - FIXED: Use the new modular store consistently
  const elements = useCanvasStore((state) => Object.values(state.elements));
  const updateElement = useCanvasStore((state) => state.updateElement);
  const addElement = useCanvasStore((state) => state.addElement);
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);
  const selectedTool = useCanvasStore((state) => state.selectedTool);
  const createSection = useCanvasStore((state) => state.createSection);

  // Performance tracking
  useEffect(() => {
    const elementCount = Object.keys(elements).length;
    const endTiming = startRenderTiming();
    
    // Simulate a render cycle
    requestAnimationFrame(() => {
      endTiming(); // This returns void, so we need to track time differently
      recordRenderTime(16, elementCount); // Use a default 16ms for now
    });
  }, [elements, startRenderTiming, recordRenderTime]);

  // Handle element selection
  const handleElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => {
    e.cancelBubble = true;
    selectSingle(element.id);
    onElementSelect?.(element);
  }, [selectSingle, onElementSelect]);

  // Handle element drag end
  const handleElementDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    const node = e.target;
    updateElement(elementId, {
      x: node.x(),
      y: node.y()
    });
    
    addToHistory(`Move ${elementId}`, [], [], {
      elementIds: [elementId],
      operationType: 'move',
      affectedCount: 1
    });
  }, [updateElement, addToHistory]);

  // Handle text editing start
  const handleStartTextEdit = useCallback((elementId: string) => {
    setEditingTextId(elementId);
    onStartTextEdit?.(elementId);
  }, [setEditingTextId, onStartTextEdit]);

  // Handle stage click (deselection)
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only deselect if clicking on empty space
    if (e.target === stageRef.current) {
      clearSelection();
    }
  }, [clearSelection]);

  // Handle wheel events for zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.1;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    if (e.evt.deltaY < 0) {
      zoomIn(scaleBy);
    } else {
      zoomOut(scaleBy);
    }
  }, [zoomIn, zoomOut]);  // Handle mouse down for drawing tools
  const handleMouseDown = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getRelativePointerPosition();
    if (!pos) return;    if (selectedTool === 'pen') {
      setIsDrawing(true);
      setCurrentPath([pos.x, pos.y]);
    } else if (selectedTool === 'section') {
      setIsDrawingSection(true);
      setPreviewSection({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0
      });
    } else if (selectedTool === 'connector-line' || selectedTool === 'connector-arrow') {
      setIsDrawingConnector(true);
      setConnectorStart({ x: pos.x, y: pos.y });
      setConnectorEnd({ x: pos.x, y: pos.y });
    }
  }, [selectedTool]);  // Handle mouse move for drawing
  const handleMouseMove = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const point = stage.getRelativePointerPosition();
    if (!point) return;    if (isDrawing && selectedTool === 'pen') {
      setCurrentPath(prev => [...prev, point.x, point.y]);
    } else if (isDrawingSection && selectedTool === 'section' && previewSection) {
      const width = point.x - previewSection.x;
      const height = point.y - previewSection.y;
      
      setPreviewSection(prev => prev ? {
        ...prev,
        width,
        height
      } : null);
    } else if (isDrawingConnector && (selectedTool === 'connector-line' || selectedTool === 'connector-arrow')) {
      setConnectorEnd({ x: point.x, y: point.y });
    }
  }, [isDrawing, isDrawingSection, selectedTool, previewSection]);
  // Handle mouse up for drawing completion
  const handleMouseUp = useCallback(() => {
    const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (selectedTool === 'pen' && isDrawing && currentPath.length >= 4) {
      const newElement: CanvasElement = {
        id: generateId(),
        type: selectedTool,
        x: 0,
        y: 0,
        points: currentPath,
        stroke: designSystem.colors.secondary[800],
        strokeWidth: 3,
        fill: 'transparent',
      };
      
      addElement(newElement);
      addToHistory(`Draw ${selectedTool}`, [], [], {
        elementIds: [newElement.id],
        operationType: 'create',
        affectedCount: 1
      });    } else if (selectedTool === 'section' && isDrawingSection && previewSection && 
               Math.abs(previewSection.width) > 10 && Math.abs(previewSection.height) > 10) {
      
      const sectionId = createSection(
        previewSection.width < 0 ? previewSection.x + previewSection.width : previewSection.x,
        previewSection.height < 0 ? previewSection.y + previewSection.height : previewSection.y,
        Math.abs(previewSection.width),
        Math.abs(previewSection.height),
        'New Section'
      );
      
      addToHistory(`Create section`, [], [], {
        elementIds: [sectionId],
        operationType: 'create',
        affectedCount: 1
      });
    } else if ((selectedTool === 'connector-line' || selectedTool === 'connector-arrow') && 
               isDrawingConnector && connectorStart && connectorEnd) {
      const distance = Math.sqrt(
        Math.pow(connectorEnd.x - connectorStart.x, 2) + 
        Math.pow(connectorEnd.y - connectorStart.y, 2)
      );
      
      if (distance > 10) { // Minimum distance to create connector
        const newElement: CanvasElement = {
          id: generateId(),
          type: 'connector',
          x: connectorStart.x,
          y: connectorStart.y,
          points: [0, 0, connectorEnd.x - connectorStart.x, connectorEnd.y - connectorStart.y],
          stroke: designSystem.colors.secondary[600],
          strokeWidth: 2
        };
        
        addElement(newElement);
        addToHistory(`Create ${selectedTool}`, [], [], {
          elementIds: [newElement.id],
          operationType: 'create',
          affectedCount: 1
        });
      }
    }
    
    // Reset drawing state
    setCurrentPath([]);
    setIsDrawing(false);
    setIsDrawingSection(false);
    setPreviewSection(null);
    setIsDrawingConnector(false);
    setConnectorStart(null);
    setConnectorEnd(null);
  }, [selectedTool, isDrawing, isDrawingSection, isDrawingConnector, currentPath, previewSection, connectorStart, connectorEnd, addElement, addToHistory]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle delete key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        selectedElementIds.forEach((id: string) => {
          updateElement(id, { deleted: true } as any); // Mark as deleted
        });
        
        addToHistory(`Delete ${selectedElementIds.length} elements`, [], [], {
          elementIds: selectedElementIds,
          operationType: 'delete',
          affectedCount: selectedElementIds.length
        });
        
        clearSelection();
      }
      
      // Handle escape key
      if (e.key === 'Escape') {
        clearSelection();
        setIsDrawing(false);
        setIsDrawingConnector(false);
        setIsDrawingSection(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, updateElement, addToHistory, clearSelection]);

  return (
    <div className={`canvas-container ${className}`}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onClick={handleStageClick}
        onWheel={handleWheel}
        draggable={selectedTool === 'pan'}
        x={pan.x}
        y={pan.y}
        scaleX={zoom}
        scaleY={zoom}
        style={{
          display: 'block',
          backgroundColor: designSystem.canvasStyles.background,
          cursor: selectedTool === 'pan' ? 'grab' : 
                  selectedTool.startsWith('connector-') ? 'crosshair' : 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >        <CanvasLayerManager
          stageWidth={width}
          stageHeight={height}
          stageRef={stageRef}
          onElementUpdate={updateElement}
          onElementDragEnd={handleElementDragEnd}
          onElementClick={handleElementClick}
          onStartTextEdit={handleStartTextEdit}
          isDrawing={isDrawing}
          currentPath={currentPath}
          isDrawingConnector={isDrawingConnector}
          connectorStart={connectorStart}
          connectorEnd={connectorEnd}
          isDrawingSection={isDrawingSection}
          previewSection={previewSection}
        />
      </Stage>
    </div>
  );
};