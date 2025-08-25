import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';
// TODO: Re-implement these for vanilla Konva
// import UnifiedEventHandler from './UnifiedEventHandler';
// import { CanvasLayerManager } from '../layers/CanvasLayerManager';
// import { ToolLayer } from '../layers/ToolLayer';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { CanvasElement, ElementId, SectionId } from '../types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { useCursorManager, CanvasTool } from '../utils/performance/cursorManager';
import { canvasLog } from '../utils/canvasLogger';

interface CanvasStageProps {
  stageRef?: React.RefObject<Konva.Stage | null>;
}

/**
 * CanvasStage - The primary component for the vanilla Konva canvas.
 *
 * This component is responsible for:
 * - Creating the main Konva Stage directly (not using react-konva).
 * - Fetching all necessary state from the unified Zustand store.
 * - Managing DOM container and Konva Stage lifecycle.
 * - Delegating element and layer rendering to CanvasLayerManager.
 */
const CanvasStage: React.FC<CanvasStageProps> = ({ stageRef: externalStageRef }) => {
  const internalStageRef = useRef<Konva.Stage | null>(null);
  const stageRef = externalStageRef || internalStageRef;
  const containerRef = useRef<HTMLDivElement | null>(null);

  // OPTIMIZED: Consolidated store subscriptions using useShallow
  const {
    viewport,
    selectedElementIds,
    selectedTool,
    elements,
    updateElement,
    selectElement,
    setTextEditingElement,
    setViewport
  } = useUnifiedCanvasStore(useShallow((state) => ({
    viewport: state.viewport,
    selectedElementIds: state.selectedElementIds,
    selectedTool: state.selectedTool,
    elements: state.elements,
    updateElement: state.updateElement,
    selectElement: state.selectElement,
    setTextEditingElement: state.setTextEditingElement,
    setViewport: state.setViewport
  })));

  // Elements from store - memoized conversion with size-based optimization
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
      cursorManager.updateForTool(selectedTool as CanvasTool);
    }
  }, [selectedTool, cursorManager, stageRef]);

  // Initialize cursor manager with stage
  useEffect(() => {
    if (stageRef.current) {
      cursorManager.setStage(stageRef.current);
    }
  }, [cursorManager, stageRef]);

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
  }, [viewport, setViewport, stageRef])

  // Refs for Konva layers
  const backgroundLayerRef = useRef<Konva.Layer | null>(null);
  const mainLayerRef = useRef<Konva.Layer | null>(null);
  const connectorLayerRef = useRef<Konva.Layer | null>(null);
  const uiLayerRef = useRef<Konva.Layer | null>(null);
  const toolLayerRef = useRef<Konva.Layer | null>(null);

  // Initialize Konva Stage on mount
  useEffect(() => {
    if (containerRef.current && !stageRef.current) {
      const stage = new Konva.Stage({
        container: containerRef.current,
        width: stageConfig.width,
        height: stageConfig.height,
        draggable: stageConfig.draggable,
        listening: stageConfig.listening,
        perfectDrawEnabled: stageConfig.perfectDrawEnabled,
        pixelRatio: stageConfig.pixelRatio,
      });

      // Create layers in proper order
      const backgroundLayer = new Konva.Layer({ name: 'background-layer' });
      const mainLayer = new Konva.Layer({ name: 'main-layer' });
      const connectorLayer = new Konva.Layer({ name: 'connector-layer' });
      const uiLayer = new Konva.Layer({ name: 'ui-layer' });
      const toolLayer = new Konva.Layer({ name: 'tool-layer' });

      // Add layers to stage in order
      stage.add(backgroundLayer);
      stage.add(mainLayer);
      stage.add(connectorLayer);
      stage.add(uiLayer);
      stage.add(toolLayer);

      // Store references
      stageRef.current = stage;
      backgroundLayerRef.current = backgroundLayer;
      mainLayerRef.current = mainLayer;
      connectorLayerRef.current = connectorLayer;
      uiLayerRef.current = uiLayer;
      toolLayerRef.current = toolLayer;

      // Add wheel event listener
      stage.on('wheel', handleWheel);

      // Add basic background grid (test)
      const grid = new Konva.Group();
      const gridSize = 50;
      const gridColor = '#e0e0e0';
      
      // Create grid lines
      for (let i = 0; i < stageConfig.width; i += gridSize) {
        const line = new Konva.Line({
          points: [i, 0, i, stageConfig.height],
          stroke: gridColor,
          strokeWidth: 1,
          opacity: 0.3,
        });
        grid.add(line);
      }
      
      for (let i = 0; i < stageConfig.height; i += gridSize) {
        const line = new Konva.Line({
          points: [0, i, stageConfig.width, i],
          stroke: gridColor,
          strokeWidth: 1,
          opacity: 0.3,
        });
        grid.add(line);
      }
      
      backgroundLayer.add(grid);
      
      // Add a test rectangle to verify things are working
      const testRect = new Konva.Rect({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fill: 'red',
        draggable: true,
      });
      
      mainLayer.add(testRect);
      
      // Draw all layers
      backgroundLayer.draw();
      mainLayer.draw();
      connectorLayer.draw();
      uiLayer.draw();
      toolLayer.draw();

      // Cleanup function
      return () => {
        stage.destroy();
        stageRef.current = null;
        backgroundLayerRef.current = null;
        mainLayerRef.current = null;
        connectorLayerRef.current = null;
        uiLayerRef.current = null;
        toolLayerRef.current = null;
      };
    }
  }, [stageConfig, handleWheel, stageRef]);

  // Sync stage with viewport store (store-first architecture)
  useEffect(() => {
    if (stageRef.current) {
      const stage = stageRef.current;
      stage.scale({ x: viewport.scale, y: viewport.scale });
      stage.position({ x: viewport.x, y: viewport.y });
      stage.batchDraw();
    }
  }, [viewport.scale, viewport.x, viewport.y, stageRef]);

  return (
    <CanvasErrorBoundary
      onError={(error, errorInfo) => {
        canvasLog.error('🚨 [CanvasStage] Critical error in canvas rendering:', {
          error: error.message,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      <div 
        ref={containerRef}
        className="text-text-primary bg-canvas font-sans w-full h-full"
        style={{ 
          width: stageConfig.width, 
          height: stageConfig.height 
        }}
      />
      
      {/* TODO: Implement vanilla Konva rendering logic */}
      {stageRef.current && (
        <div style={{ display: 'none' }}>
          {/* Temporarily disabled while refactoring to vanilla Konva */}
          {/* <UnifiedEventHandler stageRef={stageRef} /> */}
          {/* <CanvasLayerManager ... /> */}
          {/* <ToolLayer stageRef={stageRef} /> */}
        </div>
      )}

    </CanvasErrorBoundary>
  );
};

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;
