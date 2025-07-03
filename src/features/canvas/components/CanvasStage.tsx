import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import UnifiedEventHandler from '../utils/UnifiedEventHandler';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import { ToolLayer } from '../layers/ToolLayer';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';
import { CanvasElement, ElementId, SectionId, ElementOrSectionId } from '../types/enhanced.types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { useCursorManager } from '../utils/performance/cursorManager';

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

  // SELECTIVE: Only essential subscriptions to prevent infinite loops
  const viewport = useUnifiedCanvasStore(canvasSelectors.viewport);
  const selectedElementIds = useUnifiedCanvasStore(canvasSelectors.selectedElementIds);
  const currentTool = useUnifiedCanvasStore(canvasSelectors.selectedTool); // RESTORED: Essential for toolbar
  
  // Fixed: Use selectors to prevent infinite loops  
  const elements = useUnifiedCanvasStore(canvasSelectors.elements);
  const sections = useUnifiedCanvasStore(canvasSelectors.sections);
  
  // Fixed: Use actual store actions
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const updateSection = useUnifiedCanvasStore(state => state.updateSection);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const handleElementDrop = useUnifiedCanvasStore(state => state.handleElementDrop);
  const zoomViewport = useUnifiedCanvasStore(state => state.zoomViewport);
  const setViewport = useUnifiedCanvasStore(state => state.setViewport);

  const { width, height } = viewport;
  const panZoomState = { scale: viewport.scale, position: { x: viewport.x, y: viewport.y } };

  // Elements from store - cast for type compatibility 
  const allElements = useMemo(() => {
    return elements as Map<ElementId | SectionId, CanvasElement>;
  }, [elements]);

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
      cursorManager.updateForTool(currentTool as any);
    }
  }, [currentTool, cursorManager]);

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
        console.error('🚨 [CanvasStage] Critical error in canvas rendering:', {
          error: error.message,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      <Stage
        ref={stageRef}
        {...stageConfig}
        style={{ backgroundColor: 'var(--canvas-bg)' }}
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
