import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';
import UnifiedEventHandler from './UnifiedEventHandler';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import { ToolLayer } from '../layers/ToolLayer';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { CanvasElement, ElementId, SectionId, ElementOrSectionId } from '../types/enhanced.types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { useCursorManager } from '../utils/performance/cursorManager';
import { useCanvasSetup } from '../hooks/useCanvasSetup';
import { canvasLog } from '../utils/canvasLogger';

interface CanvasStageProps {
  stageRef?: React.RefObject<Konva.Stage | null>;
}

/**
 * CanvasStage - The primary component for the Konva canvas.
 *
 * This component is responsible for:
 * - Creating the main Konva Stage.
 * - Fetching all necessary state from the unified Zustand store.
 * - Delegating event handling to UnifiedEventHandler.
 * - Delegating element and layer rendering to CanvasLayerManager.
 */
const CanvasStage: React.FC<CanvasStageProps> = ({ stageRef: externalStageRef }) => {
  const internalStageRef = useRef<Konva.Stage | null>(null);
  const stageRef = externalStageRef || internalStageRef;

  // OPTIMIZED: Consolidated store subscriptions using useShallow
  const {
    viewport,
    selectedElementIds,
    selectedTool,
    elements,
    sections,
    updateElement,
    updateSection,
    selectElement,
    setTextEditingElement,
    handleElementDrop,
    zoomViewport,
    setViewport
  } = useUnifiedCanvasStore(useShallow((state) => ({
    viewport: state.viewport,
    selectedElementIds: state.selectedElementIds,
    selectedTool: state.selectedTool,
    elements: state.elements,
    sections: state.sections,
    updateElement: state.updateElement,
    updateSection: state.updateSection,
    selectElement: state.selectElement,
    setTextEditingElement: state.setTextEditingElement,
    handleElementDrop: state.handleElementDrop,
    zoomViewport: state.zoomViewport,
    setViewport: state.setViewport
  })));

  const { width, height } = viewport;
  const panZoomState = { scale: viewport.scale, position: { x: viewport.x, y: viewport.y } };

  // Elements from store - memoized conversion with size-based optimization
  const allElements = useMemo(() => {
    return elements as Map<ElementId | SectionId, CanvasElement>;
  }, [elements]);

  // Memoized elements array for performance-critical operations
  const elementsArray = useMemo(() => {
    return Array.from(allElements.values());
  }, [allElements]);

  // Memoized selected elements for performance
  const selectedElements = useMemo(() => {
    return elementsArray.filter(element => 
      selectedElementIds.has(element.id as ElementId)
    );
  }, [elementsArray, selectedElementIds]);

  // Static stage configuration (viewport handled separately)
  const stageConfig = useMemo(() => {
    return {
      width: viewport?.width || 1920,
      height: viewport?.height || 1080,
      draggable: false,
      listening: true,
      perfectDrawEnabled: false,
      pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
    };
  }, [viewport?.width, viewport?.height]);

  // Element event handlers
  const onElementDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => {
    const node = e.target;
    updateElement(elementId, { x: node.x(), y: node.y() });
  }, [updateElement]);

  const onElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => {
    selectElement(element.id as ElementId, e.evt.ctrlKey || e.evt.metaKey);
  }, [selectElement]);



  // Add centralized cursor management
  const cursorManager = useCursorManager();
  
  // Update cursor when tool changes (centralized cursor management)
  useEffect(() => {
    if (stageRef.current) {
      cursorManager.updateForTool(selectedTool as any);
    }
  }, [selectedTool, cursorManager]);

  // Initialize cursor manager with stage
  useEffect(() => {
    if (stageRef.current) {
      cursorManager.setStage(stageRef.current);
    }
  }, [cursorManager]);

  // Store-first wheel zoom (following React-Konva best practices)
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const oldScale = viewport.scale;
    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale
    };
    
    // Clean zoom calculation
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.1;
    const newScale = Math.max(0.1, Math.min(10, 
      direction > 0 ? oldScale * factor : oldScale / factor
    ));
    
    // Store-first update - let store handle stage sync
    setViewport({
      ...viewport,
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    });
  }, [viewport, setViewport])

  // Sync stage with viewport store (store-first architecture)
  useEffect(() => {
    if (stageRef.current) {
      const stage = stageRef.current;
      stage.scale({ x: viewport.scale, y: viewport.scale });
      stage.position({ x: viewport.x, y: viewport.y });
      stage.batchDraw();
    }
  }, [viewport.scale, viewport.x, viewport.y]);

  return (
    <CanvasErrorBoundary
      onError={(error, errorInfo) => {
        canvasLog.error('🚨 [CanvasStage] Critical error in canvas rendering:', {
          error: error.message,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      <Stage
        ref={stageRef}
        {...stageConfig}
        style={{ 
          backgroundColor: 'var(--canvas-bg, var(--bg-surface))',
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)'
        }}
        onWheel={handleWheel}
      >
        <UnifiedEventHandler stageRef={stageRef} />
        
        <CanvasLayerManager 
            stageRef={stageRef}
            elements={allElements}
            selectedElementIds={selectedElementIds}
            onElementUpdate={updateElement}
            onElementDragEnd={onElementDragEnd}
            onElementClick={onElementClick}
            onStartTextEdit={setTextEditingElement}
          />
          
        {/* Tool Layer - handles all drawing and selection tools */}
        <ToolLayer stageRef={stageRef} />
      </Stage>

    </CanvasErrorBoundary>
  );
};

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;
