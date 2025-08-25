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
import { ElementRendererFactory, ElementCallbacks, RendererContext } from '../renderers/ElementRendererFactory';
import { VanillaElementRenderer } from '../renderers/VanillaElementRenderer';
import { VanillaLayerManager } from '../layers/VanillaLayerManager';
import { VanillaEventHandler } from '../events/VanillaEventHandler';
import { VanillaToolManager } from '../tools/VanillaToolManager';

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

  // Element renderers management now handled by VanillaLayerManager
  const layerManagerRef = useRef<VanillaLayerManager | null>(null);
  const eventHandlerRef = useRef<VanillaEventHandler | null>(null);
  const toolManagerRef = useRef<VanillaToolManager | null>(null);

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

      // Store reference
      stageRef.current = stage;

      // Add wheel event listener
      stage.on('wheel', handleWheel);

      // Create layer manager
      const callbacks: ElementCallbacks = {
        onElementUpdate: updateElement,
        onElementClick: onElementClick,
        onElementDragEnd: onElementDragEnd,
        onStartTextEdit: setTextEditingElement,
      };
      const manager = new VanillaLayerManager(stage, callbacks);
      layerManagerRef.current = manager;

      // Draw background grid
      manager.drawBackgroundGrid(stageConfig.width, stageConfig.height);

      // Reconcile initial elements
      const elementMap = new Map<ElementId, CanvasElement>();
      (elements as Map<ElementId | SectionId, CanvasElement | any>).forEach((el: any, id: any) => {
        if (el && el.type !== 'section') {
          elementMap.set(id as ElementId, el as CanvasElement);
        }
      });
      manager.setElements(elementMap);

      // Create event handler
      eventHandlerRef.current = new VanillaEventHandler(stage, useUnifiedCanvasStore.getState, undefined, manager);

      // Create tool manager
      toolManagerRef.current = new VanillaToolManager(stage, useUnifiedCanvasStore.getState, manager);

      // Cleanup function
      return () => {
        eventHandlerRef.current?.destroy();
        manager.destroy();
        stage.destroy();
        stageRef.current = null;
        layerManagerRef.current = null;
        eventHandlerRef.current = null;
        toolManagerRef.current = null;
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

  // Reconcile elements when state changes
  useEffect(() => {
    if (!layerManagerRef.current) return;
    const elementMap = new Map<ElementId, CanvasElement>();
    (elements as Map<ElementId | SectionId, CanvasElement | any>).forEach((el: any, id: any) => {
      if (el && el.type !== 'section') {
        elementMap.set(id as ElementId, el as CanvasElement);
      }
    });
    layerManagerRef.current.setElements(elementMap);
  }, [elements]);

  // Switch active tool when selection changes
  useEffect(() => {
    if (!toolManagerRef.current) return;
    toolManagerRef.current.setTool(selectedTool);
  }, [selectedTool]);

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
    </CanvasErrorBoundary>
  );
};

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;
