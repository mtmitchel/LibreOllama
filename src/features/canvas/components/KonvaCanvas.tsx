import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../stores/canvasStore.enhanced';
import { useShallow } from 'zustand/react/shallow';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import { findNearestConnectionPoint } from '../utils/snappingUtils'; // Fixed import path
import type { CanvasElement, ElementId, SectionId, ConnectorElement } from '../types/enhanced.types';
import { ElementId as ElementIdFactory, isSectionElement } from '../types/enhanced.types';
import { LoadingOverlay } from './ui/LoadingOverlay';
import { useCursorManager } from '../utils/performance/cursorManager';

// Performance optimization: Memoize expensive operations (roadmap compliance)
const useMemoizedElements = (elements: Map<string, CanvasElement>) => 
  useMemo(() => convertElementsMapForLayerManager(elements), [elements]);

const useMemoizedElementsRecord = (elements: Map<string, CanvasElement>) =>
  useMemo(() => Object.fromEntries(elements), [elements]);

// Type-safe conversion helper for roadmap compliance
const convertElementsMapForLayerManager = (elements: Map<string, CanvasElement>): Map<ElementId | SectionId, CanvasElement> => {
  const convertedMap = new Map<ElementId | SectionId, CanvasElement>();
  elements.forEach((element) => {
    // Use the element's own ID (which should already be branded) rather than the map key
    convertedMap.set(element.id, element);
  });
  return convertedMap;
};

interface PanZoomState {
  scale: number;
  position: { x: number; y: number };
}

interface MultiDragState {
  pointerPos: { x: number; y: number };
  elementStates: Map<ElementId | SectionId, {
    initialPos: { x: number; y: number };
    parentSection?: SectionId | undefined;
    isInSection: boolean;
  }>;
  dragStartTime: number;
  totalElementCount: number;
}

interface KonvaCanvasProps {
  width: number;
  height: number;
  onElementSelect?: (element: CanvasElement) => void;
  panZoomState: PanZoomState;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onWheelHandler: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onTouchMoveHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchEndHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
}

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
  width,
  height,
  onElementSelect,
  panZoomState,
  stageRef: externalStageRef,
  onWheelHandler,
  onTouchMoveHandler,
  onTouchEndHandler
}) => {
  const internalStageRef = useRef<Konva.Stage | null>(null);
  const multiDragState = useRef<MultiDragState | null>(null);
  const dragAnimationFrame = useRef<number | null>(null);
  const [isLoading] = useState(false);
  const [loadingProgress] = useState(0);
  const [loadingMessage] = useState('');
  const cursorManager = useCursorManager();

  useEffect(() => {
    if (externalStageRef && internalStageRef.current) {
      externalStageRef.current = internalStageRef.current;
    }
  }, [externalStageRef]);

  const {
    elements,
    selectedElementIds,
    updateElement,
    addElement,
    updateMultipleElements,
    clearSelection,
    selectElement,
    setEditingTextId,
    selectedTool,
    isDrawing,
    startDrawing,
    updateDrawing,
    finishDrawing,
    handleElementDrop,
    createSection,
    updateSection,
    addHistoryEntry,
    // Note: findSectionAtPoint is available but temporarily unused in current implementation
  } = useCanvasStore(
    useShallow((state) => ({
      elements: state.elements,
      selectedElementIds: state.selectedElementIds,
      updateElement: state.updateElement,
      addElement: state.addElement,
      updateMultipleElements: state.updateMultipleElements,
      clearSelection: state.clearSelection,
      selectElement: state.selectElement,
      setEditingTextId: state.setEditingTextId,
      selectedTool: state.selectedTool,
      isDrawing: state.isDrawing,
      startDrawing: state.startDrawing,
      updateDrawing: state.updateDrawing,
      finishDrawing: state.finishDrawing,
      handleElementDrop: state.handleElementDrop,
      createSection: state.createSection,
      updateSection: state.updateSection,
      findSectionAtPoint: state.findSectionAtPoint,
      addHistoryEntry: state.addHistoryEntry,
    }))
  );

  useEffect(() => {
    if (selectedTool && cursorManager) {
      cursorManager.updateForTool(selectedTool as any); // TODO: Fix CanvasTool type
    }
  }, [selectedTool, cursorManager]);

  // TODO: Implement sections derived from elements for future section-aware operations
  // const sections = useMemo(() => {
  //   const sectionMap = new Map<SectionId, SectionElement>();
  //   for (const el of elements.values()) {
  //     if (isSectionElement(el)) {
  //       sectionMap.set(el.id, el);
  //     }
  //   }
  //   return sectionMap;
  // }, [elements]);

  const [isDrawingConnector, setIsDrawingConnector] = React.useState(false);
  const [connectorStart, setConnectorStart] = React.useState<{ x: number; y: number; elementId?: ElementId; anchor?: string } | null>(null);
  const [connectorEnd, setConnectorEnd] = React.useState<{ x: number; y: number; elementId?: ElementId; anchor?: string } | null>(null);
  const [isDrawingSection, setIsDrawingSection] = React.useState(false);
  const [sectionStart, setSectionStart] = React.useState<{ x: number; y: number } | null>(null);
  const [previewSection, setPreviewSection] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt?.detail > 1) return;
    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;
    if (clickedOnEmpty) {
      clearSelection();
    }
  }, [clearSelection]);

  const handleElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => {
    e.cancelBubble = true;
    if (!isSectionElement(element)) {
      selectElement(element.id as ElementId, e.evt.shiftKey);
    }
    onElementSelect?.(element);
  }, [onElementSelect, selectElement]);

  const handleElementDragStart = useCallback((_e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => {
    const stage = internalStageRef.current;
    if (!stage) return;

    if (dragAnimationFrame.current) {
      cancelAnimationFrame(dragAnimationFrame.current);
    }

    const element = elements.get(elementId);
    if (!element) return;

    // If the dragged element is not selected, clear existing selection and select it.
    if (!isSectionElement(element) && !selectedElementIds.has(element.id)) {
      clearSelection();
      selectElement(element.id, false);
    }
    
    // The selection might have changed, so we get the latest state.
    const currentSelection = useCanvasStore.getState().selectedElementIds;
    const finalSelection = currentSelection.has(elementId as ElementId) ? currentSelection : new Set([elementId as ElementId]);

    const elementStates = new Map<ElementId | SectionId, MultiDragState['elementStates'] extends Map<any, infer V> ? V : never>();
    const pointerPos = stage.getPointerPosition() || { x: 0, y: 0 };

    finalSelection.forEach(id => {
      const el = elements.get(id);
      if (el) {
        elementStates.set(id, {
          initialPos: { x: el.x, y: el.y },
          parentSection: el.sectionId || undefined,
          isInSection: !!el.sectionId,
        });
      }
    });

    multiDragState.current = {
      pointerPos,
      elementStates,
      dragStartTime: performance.now(),
      totalElementCount: finalSelection.size,
    };

    if (finalSelection.size > 1) {
      stage.container().style.cursor = 'grabbing';
    }
  }, [selectedElementIds, elements, clearSelection, selectElement]);

  const handleElementDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => {
    const stage = internalStageRef.current;
    if (!stage) return;

    const element = elements.get(elementId);
    if (!element) return;

    // Single element drag (no multi-drag state)
    if (!multiDragState.current || multiDragState.current.totalElementCount <= 1) {
      const node = e.target;
      let newPos = node.absolutePosition();

      if (!newPos || isNaN(newPos.x) || isNaN(newPos.y)) return;

      if (isSectionElement(element)) {
        updateSection(element.id, { x: newPos.x, y: newPos.y });
      } else {
        handleElementDrop(element.id as ElementId, newPos);
      }
      multiDragState.current = null; // Clear state
      return;
    }

    // Multi-element drag
    const { pointerPos: startPointerPos, elementStates } = multiDragState.current;
    const endPointerPos = stage.getPointerPosition() || { x: 0, y: 0 };
    const deltaX = endPointerPos.x - startPointerPos.x;
    const deltaY = endPointerPos.y - startPointerPos.y;

    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
      multiDragState.current = null;
      stage.container().style.cursor = 'default';
      return;
    }

    const updates = new Map<ElementId | SectionId, Partial<CanvasElement>>();
    elementStates.forEach((state, id) => {
      const el = elements.get(id);
      if (el) {
        updates.set(id, { x: state.initialPos.x + deltaX, y: state.initialPos.y + deltaY });
      }
    });

    // Convert Map to Record for updateMultipleElements (integration fix)
    const updatesRecord = Object.fromEntries(updates);
    updateMultipleElements(updatesRecord);
    
    // History integration (roadmap compliance) - temporarily disabled until proper patches available
    // addHistoryEntry('BATCH_MOVE', [], [], {
    //   elementIds: Array.from(updates.keys()).map(id => id.toString()),
    //   description: `Moved ${updates.size} elements`,
    //   timestamp: Date.now()
    // });

    multiDragState.current = null;
    stage.container().style.cursor = 'default';
    if (dragAnimationFrame.current) {
      cancelAnimationFrame(dragAnimationFrame.current);
      dragAnimationFrame.current = null;
    }
  }, [elements, updateSection, handleElementDrop, updateMultipleElements, addHistoryEntry]);

  const handleElementDragMove = useCallback((_e: Konva.KonvaEventObject<DragEvent>, _elementId: ElementId | SectionId) => {
    if (!multiDragState.current || multiDragState.current.totalElementCount <= 1) return;
    if (dragAnimationFrame.current) return;

    dragAnimationFrame.current = requestAnimationFrame(() => {
      // Placeholder for visual preview updates
      dragAnimationFrame.current = null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (dragAnimationFrame.current) {
        cancelAnimationFrame(dragAnimationFrame.current);
      }
    };
  }, []);

  const handleElementUpdate = useCallback((id: ElementId | SectionId, updates: Partial<CanvasElement>) => {
    updateElement(id, updates);
  }, [updateElement]);

  const handleStartTextEdit = useCallback((elementId: ElementId) => {
    setEditingTextId(elementId);
  }, [setEditingTextId]);

  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const tool = selectedTool;
    if (tool === 'pen' || tool === 'pencil') {
      console.log('🖍️ [DRAWING] Starting drawing with tool:', tool, 'at position:', pos);
      startDrawing(pos.x, pos.y, tool);
    } else if (tool === 'connector' && !isDrawingConnector) {
      const stage = e.target.getStage();
      if (!stage) return;
      const pointerPos = stage.getPointerPosition() || { x: 0, y: 0 };
      
      // Convert Map to Record for snapping utility
      const elementsRecord = Object.fromEntries(elements);
      const result = findNearestConnectionPoint(pointerPos.x, pointerPos.y, elementsRecord, undefined);
      
      if (result) {
        setConnectorStart({ 
          x: result.point.x, 
          y: result.point.y, 
          elementId: ElementIdFactory(result.point.elementId),
          anchor: result.point.anchor 
        });
        setIsDrawingConnector(true);
      }
    } else if (tool === 'section' && !isDrawingSection) {
      setSectionStart(pos);
      setIsDrawingSection(true);
    }
  }, [selectedTool, startDrawing, isDrawingConnector, elements, isDrawingSection]);

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    if (isDrawing) {
      console.log('🖍️ [DRAWING] Updating drawing position:', pos);
      updateDrawing(pos.x, pos.y);
    } else if (isDrawingConnector && connectorStart) {
      // Convert Map to Record for snapping utility
      const elementsRecord = Object.fromEntries(elements);
      const result = findNearestConnectionPoint(pos.x, pos.y, elementsRecord, undefined);
      if (result) {
        setConnectorEnd({ 
          x: result.point.x, 
          y: result.point.y, 
          elementId: ElementIdFactory(result.point.elementId),
          anchor: result.point.anchor 
        });
      }
    } else if (isDrawingSection && sectionStart) {
      const x = Math.min(pos.x, sectionStart.x);
      const y = Math.min(pos.y, sectionStart.y);
      const width = Math.abs(pos.x - sectionStart.x);
      const height = Math.abs(pos.y - sectionStart.y);
      setPreviewSection({ x, y, width, height });
    }
  }, [isDrawing, updateDrawing, isDrawingConnector, connectorStart, elements, isDrawingSection, sectionStart]);

  const handleStageMouseUp = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDrawing) {
      console.log('🖍️ [DRAWING] Finishing drawing');
      finishDrawing();
    } else if (isDrawingConnector && connectorStart && connectorEnd) {
      const newConnector: ConnectorElement = {
        id: ElementIdFactory(`conn_${Date.now()}`),
        type: 'connector',
        subType: 'straight',
        x: connectorStart.x, // Add x coordinate
        y: connectorStart.y, // Add y coordinate
        startElementId: connectorStart.elementId,
        endElementId: connectorEnd.elementId,
        startPoint: { x: connectorStart.x, y: connectorStart.y },
        endPoint: { x: connectorEnd.x, y: connectorEnd.y },
        intermediatePoints: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addElement(newConnector as ConnectorElement);
      setIsDrawingConnector(false);
      setConnectorStart(null);
      setConnectorEnd(null);
    } else if (isDrawingSection && sectionStart && previewSection) {
      createSection(previewSection.x, previewSection.y, previewSection.width, previewSection.height, 'New Section');
      setIsDrawingSection(false);
      setSectionStart(null);
      setPreviewSection(null);
    }
  }, [isDrawing, finishDrawing, isDrawingConnector, connectorStart, connectorEnd, isDrawingSection, sectionStart, previewSection, createSection, addElement]);

  const memoizedElements = useMemoizedElements(elements);
  const memoizedElementsRecord = useMemoizedElementsRecord(elements);

  return (
    <>
      <LoadingOverlay state={{ isLoading, progress: loadingProgress, message: loadingMessage }} />
      <Stage
        ref={internalStageRef}
        width={width}
        height={height}
        scaleX={panZoomState.scale}
        scaleY={panZoomState.scale}
        x={panZoomState.position.x}
        y={panZoomState.position.y}
        onWheel={onWheelHandler}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        {...(onTouchMoveHandler && { onTouchMove: onTouchMoveHandler })}
        {...(onTouchEndHandler && { onTouchEnd: onTouchEndHandler })}
        className={`konva-canvas`}
      >
        <CanvasLayerManager
          elements={memoizedElements}
          selectedElementIds={selectedElementIds}
          onElementClick={handleElementClick}
          onElementDragStart={handleElementDragStart}
          onElementDragMove={handleElementDragMove}
          onElementDragEnd={handleElementDragEnd}
          onElementUpdate={handleElementUpdate}
          onStartTextEdit={handleStartTextEdit}
          stageRef={internalStageRef}
          onTransformEnd={(id, props) => updateSection(id, props)}
          isDrawingConnector={isDrawingConnector}
          connectorStart={connectorStart}
          connectorEnd={connectorEnd}
          previewSection={previewSection}
        />
      </Stage>
    </>
  );
};

export default KonvaCanvas;
