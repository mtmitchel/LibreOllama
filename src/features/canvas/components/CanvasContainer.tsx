// src/components/canvas/CanvasContainer.tsx
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
// import { useCanvasPerformance } from '../hooks/canvas/useCanvasPerformance';
import { useViewportControls } from '../hooks/useViewportControls';
import { useSelectionManager } from '../hooks/useSelectionManager';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
// FIXED: Use the new modular store consistently
import { useCanvasStore } from '../stores';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';
import type { CanvasElement, ElementId, SectionId } from '../types/enhanced.types';
import { toElementId } from '../types/compatibility';
import { designSystem } from '../../../design-system';

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

  // Custom hook for drawing
  useCanvasDrawing(stageRef.current);

  // Canvas state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);  const [connectorStart, setConnectorStart] = useState<{ x: number; y: number; elementId?: ElementId; anchor?: string } | null>(null);
  const [connectorEnd, setConnectorEnd] = useState<{ x: number; y: number; elementId?: ElementId; anchor?: string } | null>(null);
  const [isDrawingSection, setIsDrawingSection] = useState(false);
  const [previewSection, setPreviewSection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);  // Custom hooks
  const { zoom, pan, zoomIn, zoomOut } = useViewportControls();
  const { selectSingle, clear: clearSelection, selectedElementIds } = useSelectionManager();
  const { addToHistory } = useCanvasHistory();
  // Store hooks - FIXED: Use the new modular store consistently
  const elementsMap = useCanvasStore((state) => state.elements);
  // const elements = useCanvasStore((state) => Object.values(state.elements));
  const updateElement = useCanvasStore((state) => state.updateElement);
  const updateSection = useCanvasStore((state) => state.updateSection);
  const addElement = useCanvasStore((state) => state.addElement);
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);
  const selectedTool = useCanvasStore((state) => state.selectedTool);
  const createSection = useCanvasStore((state) => state.createSection);
  
  // Combined update function for elements and sections
  const handleElementOrSectionUpdate = useCallback((id: ElementId | SectionId, updates: Partial<CanvasElement>) => {
    // Check if this is a section ID (sections have their own update function)
    if (typeof id === 'string' && id.includes('section')) {
      // This is a simplified check - you might need a more robust type check
      updateSection(id as SectionId, updates as any);
    } else {
      updateElement(id as ElementId, updates);
    }
  }, [updateElement, updateSection]);
  // Performance monitoring
  // const performance = useCanvasPerformance(elements.length);

  // Handle element selection
  const handleElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => {
    e.cancelBubble = true;
    selectSingle(element.id);
    onElementSelect?.(element);
  }, [selectSingle, onElementSelect]);
  // Handle element drag end
  const handleElementDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    const node = e.target;
    updateElement(toElementId(elementId), {
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
    // Only deselect if clicking on empty space (stage itself or background layer)
    const targetName = e.target.name?.() || '';
    const targetId = e.target.id?.() || '';
    
    // Deselect if clicking on:
    // 1. The stage itself
    // 2. Background layer
    // 3. Any layer that's not an interactive element
    if (e.target === stageRef.current || 
        targetName === 'background-layer' ||
        targetName === 'background-rect' ||
        (!targetId || targetId === '') ||
        e.target.getType() === 'Stage') {
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

  // Handle mouse down for drawing tools (delegated to useCanvasDrawing for pen)
  const handleMouseDown = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getRelativePointerPosition();
    if (!pos) return;

    if (selectedTool === 'section') {
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
    }  }, [selectedTool]);

  // Handle mouse move for drawing (delegated to useCanvasDrawing for pen)
  const handleMouseMove = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const point = stage.getRelativePointerPosition();
    if (!point) return;

    if (isDrawingSection && selectedTool === 'section' && previewSection) {
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
  }, [isDrawingSection, selectedTool, previewSection]);

  // Handle mouse up for drawing completion (delegated to useCanvasDrawing for pen)
  const handleMouseUp = useCallback(() => {
    if (selectedTool === 'section' && isDrawingSection && previewSection && 
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
          id: toElementId(`connector_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
          type: 'connector',
          subType: 'line',
          x: connectorStart.x,
          y: connectorStart.y,
          startPoint: { x: connectorStart.x, y: connectorStart.y },
          endPoint: { x: connectorEnd.x, y: connectorEnd.y },
          intermediatePoints: [],
          stroke: designSystem.colors.secondary[600],
          strokeWidth: 2,
          pathPoints: [0, 0, connectorEnd.x - connectorStart.x, connectorEnd.y - connectorStart.y],
          connectorStyle: {
            strokeColor: designSystem.colors.secondary[600],
            strokeWidth: 2,
            startArrow: 'none',
            endArrow: 'triangle',
            arrowSize: 10
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
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
    setConnectorStart(null);    setConnectorEnd(null);
  }, [
    selectedTool, 
    isDrawing, 
    isDrawingSection, 
    isDrawingConnector, 
    currentPath, 
    previewSection, 
    connectorStart, 
    connectorEnd, 
    addElement, 
    addToHistory
  ]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle delete key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.size > 0) {        selectedElementIds.forEach((id: string) => {
          updateElement(toElementId(id), { deleted: true } as any); // Mark as deleted
        });
          addToHistory(`Delete ${selectedElementIds.size} elements`, [], [], {
          elementIds: Array.from(selectedElementIds),
          operationType: 'delete',
          affectedCount: selectedElementIds.size
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
        scaleY={zoom}        style={{
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
          elements={elementsMap as Map<ElementId | SectionId, CanvasElement>}
          selectedElementIds={selectedElementIds}
          onElementUpdate={handleElementOrSectionUpdate}
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
