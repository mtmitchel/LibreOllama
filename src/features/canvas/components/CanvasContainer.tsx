// src/components/canvas/CanvasContainer.tsx
import React, { useRef, useCallback, useState } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import { CanvasEventHandler } from './CanvasEventHandler';
import { useViewportControls } from '../hooks/useViewportControls';
import { useSelectionManager } from '../hooks/useSelectionManager';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { useCanvasStore } from '../../../stores';
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
 * - Uses centralized CanvasEventHandler for all interactions
 */
export const CanvasContainer: React.FC<CanvasContainerProps> = ({
  width,
  height,
  onElementSelect,
  onStartTextEdit,
  className = ''
}) => {  // Stage reference
  const stageRef = useRef<Konva.Stage>(null);

  // Custom hooks
  const { zoom, pan } = useViewportControls();
  const { selectedElementIds } = useSelectionManager();
  const { addToHistory } = useCanvasHistory();

  // Store hooks - FIXED: Use the new modular store consistently
  const elementsMap = useCanvasStore((state) => state.elements);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const updateSection = useCanvasStore((state) => state.updateSection);
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);
  const selectedTool = useCanvasStore((state) => state.selectedTool) as any; // Temporary type assertion

  // Drawing state for CanvasEventHandler - use store state instead of local state
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [connectorStart, setConnectorStart] = useState<{ x: number; y: number; elementId?: ElementId | SectionId; anchor?: string } | null>(null);
  const [connectorEnd, setConnectorEnd] = useState<{ x: number; y: number; elementId?: ElementId | SectionId; anchor?: string } | null>(null);
  
  // Use store state for section drawing instead of local state
  const isDrawingSection = useCanvasStore((state) => state.isDrawingSection);
  const drawingStartPoint = useCanvasStore((state) => state.drawingStartPoint);
  const drawingCurrentPoint = useCanvasStore((state) => state.drawingCurrentPoint);
  
  // Calculate preview section from store state
  const previewSection = React.useMemo(() => {
    if (!isDrawingSection || !drawingStartPoint || !drawingCurrentPoint) return null;
    
    const x = Math.min(drawingStartPoint.x, drawingCurrentPoint.x);
    const y = Math.min(drawingStartPoint.y, drawingCurrentPoint.y);
    const width = Math.abs(drawingCurrentPoint.x - drawingStartPoint.x);
    const height = Math.abs(drawingCurrentPoint.y - drawingStartPoint.y);
    
    return { x, y, width, height };
  }, [isDrawingSection, drawingStartPoint, drawingCurrentPoint]);
  
  // New drawing states for text, table, and sticky note
  const [isDrawingText, setIsDrawingText] = useState(false);
  const [previewText, setPreviewText] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDrawingTable, setIsDrawingTable] = useState(false);
  const [previewTable, setPreviewTable] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDrawingStickyNote, setIsDrawingStickyNote] = useState(false);
  const [previewStickyNote, setPreviewStickyNote] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
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

  // Handle element selection (called by CanvasEventHandler)
  const handleElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => {
    e.cancelBubble = true;
    onElementSelect?.(element);
  }, [onElementSelect]);

  return (
    <div className={`canvas-container ${className}`}>      <CanvasEventHandler
        stageRef={stageRef as React.RefObject<Konva.Stage>}
        currentTool={selectedTool}
        isDrawingConnector={isDrawingConnector}
        setIsDrawingConnector={setIsDrawingConnector}
        connectorStart={connectorStart}
        setConnectorStart={setConnectorStart}
        connectorEnd={connectorEnd}
        setConnectorEnd={setConnectorEnd}
        isDrawingSection={isDrawingSection}
        previewSection={previewSection}
        isDrawingText={isDrawingText}
        setIsDrawingText={setIsDrawingText}
        previewText={previewText}
        setPreviewText={setPreviewText}
        isDrawingTable={isDrawingTable}
        setIsDrawingTable={setIsDrawingTable}
        previewTable={previewTable}
        setPreviewTable={setPreviewTable}
        isDrawingStickyNote={isDrawingStickyNote}
        setIsDrawingStickyNote={setIsDrawingStickyNote}
        previewStickyNote={previewStickyNote}
        setPreviewStickyNote={setPreviewStickyNote}
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          draggable={selectedTool === 'pan'}
          x={pan.x}
          y={pan.y}
          scaleX={zoom}
          scaleY={zoom}
          style={{
            display: 'block',
            backgroundColor: designSystem.canvasStyles.background,
            cursor: selectedTool === 'pan' ? 'grab' : 
                    selectedTool.startsWith('connector-') ? 'crosshair' :
                    selectedTool === 'section' ? 'crosshair' :
                    selectedTool === 'pen' ? 'crosshair' : 'default',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <CanvasLayerManager
            stageWidth={width}
            stageHeight={height}
            stageRef={stageRef}
            elements={elementsMap as Map<ElementId | SectionId, CanvasElement>}
            selectedElementIds={selectedElementIds}
            onElementUpdate={handleElementOrSectionUpdate}
            onElementDragEnd={handleElementDragEnd}
            onElementClick={handleElementClick}
            onStartTextEdit={handleStartTextEdit}
            isDrawingConnector={isDrawingConnector}
            connectorStart={connectorStart}
            connectorEnd={connectorEnd}
            isDrawingSection={isDrawingSection}
            previewSection={previewSection}
          />
        </Stage>
      </CanvasEventHandler>
    </div>
  );
};
