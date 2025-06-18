// src/components/canvas/CanvasContainer.tsx
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { CanvasLayerManager } from './layers/CanvasLayerManager';
import { useCanvasPerformance } from '../../features/canvas/hooks/canvas/useCanvasPerformance';
import { useViewportControls } from '../../features/canvas/hooks/canvas/useViewportControls';
import { useSelectionManager } from '../../features/canvas/hooks/canvas/useSelectionManager';
import { useCanvasHistory } from '../../features/canvas/hooks/canvas/useCanvasHistory';
import { useKonvaCanvasStore } from '../../features/canvas/stores/konvaCanvasStore';
import type { CanvasElement } from '../../features/canvas/stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';

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
  const layerRef = useRef<Konva.Layer | null>(null);

  // Canvas state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [connectorStart] = useState<{ x: number; y: number; elementId?: string; anchor?: string } | null>(null);
  const [connectorEnd] = useState<{ x: number; y: number; elementId?: string; anchor?: string } | null>(null);
  const [isDrawingSection, setIsDrawingSection] = useState(false);
  const [previewSection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Custom hooks
  const { recordRenderTime, startRenderTiming } = useCanvasPerformance({ enableLogging: true });
  const { zoom, pan, zoomIn, zoomOut } = useViewportControls();
  const { selectSingle, clear: clearSelection, selectedElementIds } = useSelectionManager();
  const { addToHistory } = useCanvasHistory();

  // Store hooks
  const elements = useKonvaCanvasStore((state) => state.elements);
  const updateElement = useKonvaCanvasStore((state) => state.updateElement);
  const addElement = useKonvaCanvasStore((state) => state.addElement);
  const setEditingTextId = useKonvaCanvasStore((state) => state.setEditingTextId);
  const selectedTool = useKonvaCanvasStore((state) => state.selectedTool);

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
  }, [zoomIn, zoomOut]);

  // Handle mouse down for drawing tools
  const handleMouseDown = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (selectedTool === 'pen') {
      setIsDrawing(true);
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getRelativePointerPosition();
        if (pos) {
          setCurrentPath([pos.x, pos.y]);
        }
      }
    }
  }, [selectedTool]);

  // Handle mouse move for drawing
  const handleMouseMove = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || selectedTool !== 'pen') return;
    
    const stage = stageRef.current;
    if (stage) {
      const point = stage.getRelativePointerPosition();
      if (point) {
        setCurrentPath(prev => [...prev, point.x, point.y]);
      }
    }
  }, [isDrawing, selectedTool]);

  // Handle mouse up for drawing completion
  const handleMouseUp = useCallback(() => {
    if (selectedTool === 'pen' && isDrawing && currentPath.length >= 4) {
      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      });
    }
    
    setCurrentPath([]);
    setIsDrawing(false);
  }, [selectedTool, isDrawing, currentPath, addElement, addToHistory]);

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
      >
        <CanvasLayerManager
          ref={layerRef}
          stageWidth={width}
          stageHeight={height}
          stageRef={stageRef}
          onElementSelect={onElementSelect || (() => {})}
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
