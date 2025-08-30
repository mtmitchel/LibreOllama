import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';
import { canvasEventManager } from '../utils/CanvasEventManager';
import { selectToolHandler } from '../tools/selectToolHandler';
import { drawingToolHandler } from '../tools/drawingToolHandler';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
// import { ToolLayer } from '../layers/ToolLayer';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { CanvasElement, ElementId, SectionId } from '../types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { useCursorManager, CanvasTool } from '../utils/performance/cursorManager';
import { canvasLog } from '../utils/canvasLogger';
import { useCanvasSizing } from '../hooks/useCanvasSizing';
import { performanceTracker, measurePerformance } from '../utils/performance/performanceTracker';
import { markInit, measureInit, initMarkers } from '../utils/performance/initInstrumentation';
import { memoryManager, useElementCleanup } from '../utils/memoryManager';
import { CanvasEventProvider } from '../contexts/CanvasEventContext';
import { useSingleRAF } from '../hooks/useRafManager';
import { recordCanvasMetric, startCanvasTimer } from '../utils/performance/performanceTracker';
import { GlobalLoadingOverlay, LoadingStateBar } from './LoadingOverlay';
import { usePerformanceCircuitBreaker, isCanvasInEmergencyMode } from '../hooks/usePerformanceCircuitBreaker';
import { initializeDirectKonvaDrawing, cleanupDirectKonvaDrawing } from '../utils/DirectKonvaDrawing';
import { startEmergencyMonitoring, stopEmergencyMonitoring } from '../utils/performance/EmergencyPerformanceMonitor';
import { optimizeTauriCanvas, optimizeCanvasContext, startTauriMemoryMonitoring } from '../utils/TauriCanvasOptimizations';

interface CanvasStageProps {
  stageRef?: React.RefObject<Konva.Stage | null>;
  selectedTool?: string;
}

/**
 * CanvasStage - The primary component for the Konva canvas.
 *
 * This component is responsible for:
 * - Creating the main Konva Stage.
 * - Fetching all necessary state from the unified Zustand store.
 * - Centralizing event handling via CanvasEventManager.
 * - Delegating element and layer rendering to CanvasLayerManager.
 */
const CanvasStageComponent: React.FC<CanvasStageProps> = ({ stageRef: externalStageRef, selectedTool: selectedToolProp }) => {
  const internalStageRef = useRef<Konva.Stage | null>(null);
  const stageRef = externalStageRef || internalStageRef;
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Centralized RAF management
  const wheelRAF = useSingleRAF('CanvasStage-wheel');
  const latestWheelEvent = useRef<Konva.KonvaEventObject<WheelEvent> | null>(null);
  
  // EMERGENCY: Performance circuit breaker
  const { emergencyMode, violationCount } = usePerformanceCircuitBreaker();

  // OPTIMIZED: Consolidated store subscriptions using useShallow (except for elements which needs direct subscription)
  // PERFORMANCE: Only measure store hydration once during component mount, not on every render
  const [storeHydrationMeasured, setStoreHydrationMeasured] = React.useState(false);
  
  React.useMemo(() => {
    if (!storeHydrationMeasured) {
      markInit(initMarkers.STORE_HYDRATION_START);
      setStoreHydrationMeasured(true);
    }
  }, [storeHydrationMeasured]);
  
  // Direct subscription for elements to ensure Map changes are detected
  const elements = useUnifiedCanvasStore(state => state.elements);
  
  // PERFORMANCE CRITICAL: Use selectedTool prop instead of store subscription to prevent remounts
  const selectedTool = selectedToolProp || 'select';

  // EMERGENCY FIX: Atomic selectors prevent cascade re-renders
  const viewport = useUnifiedCanvasStore(state => state.viewport);
  const selectedElementIds = useUnifiedCanvasStore(state => state.selectedElementIds);
  const isGlobalLoading = useUnifiedCanvasStore(state => state.isGlobalLoading);
  const globalOperation = useUnifiedCanvasStore(state => state.globalOperation);
  const globalMessage = useUnifiedCanvasStore(state => state.globalMessage);
  const globalProgress = useUnifiedCanvasStore(state => state.globalProgress);
  const elementLoadingStates = useUnifiedCanvasStore(state => state.elementLoadingStates);
  const operationLoadingStates = useUnifiedCanvasStore(state => state.operationLoadingStates);
  
  // CRITICAL: Function selectors - these are stable by design
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const setViewport = useUnifiedCanvasStore(state => state.setViewport);
  
  React.useMemo(() => {
    if (storeHydrationMeasured) {
      markInit(initMarkers.STORE_HYDRATION_END);
      measureInit('store-hydration', initMarkers.STORE_HYDRATION_START, initMarkers.STORE_HYDRATION_END);
    }
  }, [storeHydrationMeasured]);

  const canvasSize = useCanvasSizing(containerRef as React.RefObject<HTMLElement>, {});

  useEffect(() => {
    setViewport({ width: canvasSize.width, height: canvasSize.height });
  }, [canvasSize, setViewport]);

  // Elements from store - memoized conversion with memory management tracking
  const allElements = useMemo(() => {
    const elementMap = elements as Map<ElementId | SectionId, CanvasElement>;
    
    // Track all elements with memory manager for automatic cleanup
    elementMap.forEach(element => {
      if (element && element.id) {
        memoryManager.trackElement(element);
      }
    });
    
    return elementMap;
  }, [elements]);

  // Static stage configuration with high-performance settings (Tauri + React 19 optimized)
  const stageConfig = useMemo(() => {
    return {
      width: viewport?.width || 1920,
      height: viewport?.height || 1080,
      draggable: false,
      listening: true,
      perfectDrawEnabled: false,
      pixelRatio: 1, // Force pixelRatio to 1 for better performance
      // High-performance canvas context settings
      imageSmoothingEnabled: false, // Disable anti-aliasing for performance
      imageSmoothingQuality: 'low', // Use low quality smoothing when needed
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

  // SIMPLIFIED: Initialize cursor manager with minimal blocking operations  
  useEffect(() => {
    if (stageRef.current && !stageRef.current.__canvas_initialized) {
      // Mark as initialized to prevent re-initialization
      (stageRef.current as any).__canvas_initialized = true;
      // Set up cursor manager (fast)
      cursorManager.setStage(stageRef.current);
      
      // Set drawing mode flags (fast)
      (window as any).CANVAS_DRAWING_MODE = 'DIRECT_KONVA';
      (window as any).__USE_COMPONENT_DRAWING__ = true;
      
      // DISABLED: DirectKonvaDrawing was competing with component-based tools causing delays
      // Only ONE drawing system should be active at a time
      // initializeDirectKonvaDrawing(stageRef.current);
      
      // DEFERRED: Move all heavy operations to next tick to avoid blocking pointer events
      setTimeout(() => {
        if (!stageRef.current) return;
        
        try {
          // Canvas context optimization (moved to deferred)
          const canvas = stageRef.current.toCanvas();
          const ctx = canvas?.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = false;
            ctx.globalCompositeOperation = 'source-over';
          }
          
          // Memory manager tracking (moved to deferred)
          const stageContainer = stageRef.current.container();
          if (stageContainer) {
            const stageElement = {
              id: 'canvas-stage' as ElementId,
              type: 'stage' as any,
              x: 0, y: 0
            } as CanvasElement;
            memoryManager.trackElement(stageElement);
            memoryManager.setDOMReference(stageElement, {
              konvaNode: stageRef.current as any,
              htmlElement: stageContainer,
              eventListeners: new Map()
            });
          }
          
          // DISABLED: Tauri optimizations were causing 1000-4000ms delays on every tool change
          // These optimizations can be re-enabled later if needed, but they should only run once
          // optimizeTauriCanvas().catch(err => console.warn('Tauri optimization failed:', err));
          // optimizeCanvasContext(stageRef.current.toCanvas());
          
          // Set canvas store reference
          (window as any).__CANVAS_STORE__ = { 
            __USE_COMPONENT_DRAWING__: true,
            elements: elements,
            selectedElementIds,
            viewport
          };
          
          // Mark canvas as ready
          (window as any).__CANVAS_STAGE_READY__ = true;
          const evt = new Event('canvas-stage-ready');
          window.dispatchEvent(evt);
          
        } catch (err) {
          console.warn('Deferred canvas initialization failed:', err);
        }
      }, 0);
      
      // DISABLED: Monitoring systems were causing performance delays
      // These can be re-enabled later if needed, but should not run on every re-initialization
      // setTimeout(() => {
      //   try {
      //     startEmergencyMonitoring();
      //     startTauriMemoryMonitoring();
      //   } catch (err) {
      //     console.warn('Monitoring system startup failed:', err);
      //   }
      // }, 100);
    }
  }, []); // FIXED: No dependencies to prevent re-initialization loops

  // RAF-optimized wheel zoom handler with centralized management and monitoring
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const zoomTimer = startCanvasTimer('zoom', { direction: e.evt.deltaY > 0 ? 'out' : 'in' });
    
    // Store the latest wheel event data
    latestWheelEvent.current = e;
    
    // Use centralized RAF management with throttling
    wheelRAF.scheduleRAF(() => {
      const startTime = performance.now();
      
      // Process the latest wheel event
      const latestEvent = latestWheelEvent.current;
      if (!latestEvent) {
        zoomTimer();
        return;
      }
      
      const stage = stageRef.current;
      if (!stage) {
        zoomTimer();
        return;
      }
      
      const pointer = stage.getPointerPosition();
      if (!pointer) {
        zoomTimer();
        return;
      }
      
      const oldScale = viewport.scale;
      
      // Clean zoom calculation
      const direction = latestEvent.evt.deltaY > 0 ? -1 : 1;
      const factor = 1.1;
      const newScale = Math.max(0.1, Math.min(10, 
        direction > 0 ? oldScale * factor : oldScale / factor
      ));
      
      // Use centralized zoom-pivot logic from store
      const { zoomViewport } = useUnifiedCanvasStore.getState();
      zoomViewport(newScale, pointer.x, pointer.y);
      
      // Record performance metrics
      const duration = performance.now() - startTime;
      recordCanvasMetric('zoom-operation', duration, 'interaction', {
        oldScale,
        newScale,
        elementCount: allElements.size
      });
      
      zoomTimer();
    }, 'wheel-zoom');
  }, [viewport.scale, stageRef, wheelRAF, allElements.size])

  // Sync stage with viewport store (store-first architecture)
  useEffect(() => {
    if (stageRef.current) {
      const stage = stageRef.current;
      stage.scale({ x: viewport.scale, y: viewport.scale });
      stage.position({ x: viewport.x, y: viewport.y });
      stage.batchDraw();
    }
  }, [viewport.scale, viewport.x, viewport.y, stageRef]);
  
  // Memory management cleanup
  const elementCleanup = useElementCleanup(Array.from(allElements.values()));

  // DISABLED: Memory monitoring was causing 300-400ms delays
  // Memory monitoring can be re-enabled later if needed, but should use requestIdleCallback
  // or be moved to a web worker to avoid blocking the main thread

  // Memory cleanup on unmount (RAF cleanup is automatic via useRAFManager)
  useEffect(() => {
    return () => {
      // Clean up tracked elements on unmount
      elementCleanup?.();
    };
  }, [elementCleanup]);

  // DISABLED: Canvas event manager was competing with component tools
  // Only the component-based tools should handle their own events
  useEffect(() => {
    return () => {
      // Minimal cleanup only
    };
  }, [stageRef]);

  // DISABLED: Canvas event manager completely disabled to prevent conflicts
  // useEffect(() => {
  //   // Only use CanvasEventManager for non-drawing tools when component drawing is enabled
  //   if (!(window as any).__USE_COMPONENT_DRAWING__ || !['pen','marker','highlighter'].includes(String(selectedTool))) {
  //     canvasEventManager.setActiveTool(selectedTool);
  //   } else {
  //     // For drawing tools with component drawing enabled, disable event manager to prevent double handling
  //     canvasEventManager.setActiveTool('none');
  //   }
  // }, [selectedTool]);

  // Dev-only layer count guard after consolidation (allow extra layers during drawing)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && stageRef.current) {
      const layerCount = stageRef.current.getLayers().length;
      // Allow up to 5 layers during drawing (background, main, ui, preview layers)
      const maxLayers = (selectedTool === 'pen' || selectedTool === 'marker' || selectedTool === 'highlighter') ? 5 : 3;
      if (layerCount > maxLayers) {
        console.warn(`Canvas has ${layerCount} layers; expected ≤ ${maxLayers} (${selectedTool} tool active)`);
      }
    }
  }, [stageRef, selectedTool, viewport.width, viewport.height]);

  // Emergency mode check AFTER all hooks
  const isEmergency = emergencyMode || isCanvasInEmergencyMode();
  
  if (isEmergency) {
    console.warn('Canvas in emergency mode, rendering minimal UI');
    return (
      <div className="relative size-full flex-1 overflow-hidden bg-red-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4 bg-red-200 rounded-lg border">
            <h3 className="text-lg font-bold text-red-800">Canvas Emergency Mode</h3>
            <p className="text-red-600">Performance issues detected. Canvas temporarily disabled.</p>
            <p className="text-sm text-red-500">Violations: {violationCount}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Canvas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CanvasEventProvider>
      <div ref={containerRef} className="relative size-full flex-1 overflow-hidden bg-canvas">
        <CanvasErrorBoundary
          onError={(error, errorInfo) => {
            canvasLog.error('🚨 [CanvasStage] Critical error in canvas rendering:', {
              error: error.message,
              componentStack: errorInfo.componentStack
            });
            
            // Report error to monitoring system
            performanceTracker.recordError(error, 'CanvasStage rendering error', {
              componentStack: errorInfo.componentStack,
              elementCount: allElements.size,
              viewport,
              selectedTool
            });
          }}
        >
          <Stage
            ref={stageRef}
            {...stageConfig}
            className="text-text-primary bg-canvas font-sans"
            onWheel={handleWheel}
          >
            
  

            
            <CanvasLayerManager 
                stageRef={stageRef}
                elements={allElements}
                selectedElementIds={selectedElementIds}
                onElementUpdate={updateElement}
                onElementDragEnd={onElementDragEnd}
                onElementClick={onElementClick}
                onStartTextEdit={setTextEditingElement}
              />
              
            {/* Tool Layer removed: tool previews now render within MainLayer as needed */}
          </Stage>

        </CanvasErrorBoundary>

        {/* Global Loading Overlay */}
        <GlobalLoadingOverlay
          isLoading={isGlobalLoading}
          message={globalMessage}
          progress={globalProgress}
          operation={globalOperation}
        />

        {/* Loading State Bar for Multiple Operations */}
        {((elementLoadingStates?.size || 0) > 0 || (operationLoadingStates?.size || 0) > 0) && (
          <LoadingStateBar
            loadingStates={[
              ...(elementLoadingStates ? Array.from(elementLoadingStates.entries()) : []).map(([id, state]) => ({
                id: `element-${id}`,
                operation: state.operation,
                message: state.message,
                progress: state.progress,
                isLoading: true
              })),
              ...(operationLoadingStates ? Array.from(operationLoadingStates.entries()) : []).map(([id, state]) => ({
                id: `operation-${id}`,
                operation: state.operation,
                message: state.message,
                progress: state.progress,
                isLoading: true
              }))
            ]}
            className="absolute bottom-0 left-0 right-0"
          />
        )}
      </div>
    </CanvasEventProvider>
  );
};

// EMERGENCY FIX: Comprehensive React.memo comparison to prevent remounts
const CanvasStage = React.memo(CanvasStageComponent, (prevProps, nextProps) => {
  // Compare ALL props that could cause remounts
  return (
    prevProps.selectedTool === nextProps.selectedTool &&
    // DON'T compare stageRef - it's always stable by design
    // Compare any other props that might be added in the future
    Object.keys(prevProps).length === Object.keys(nextProps).length &&
    Object.keys(prevProps).every(key => {
      if (key === 'stageRef') return true; // Always stable
      return prevProps[key as keyof typeof prevProps] === nextProps[key as keyof typeof nextProps];
    })
  );
});

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;
