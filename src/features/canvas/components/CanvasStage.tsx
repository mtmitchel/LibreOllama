import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';
import UnifiedEventHandler from './UnifiedEventHandler';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import { ToolLayer } from '../layers/ToolLayer';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { CanvasElement, ElementId, SectionId } from '../types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { useCursorManager, CanvasTool } from '../utils/performance/cursorManager';
import { canvasLog } from '../utils/canvasLogger';
import { useCanvasSizing } from '../hooks/useCanvasSizing';
import { canvasPerformanceMonitor, markCanvasReady } from '../utils/performance/performanceMonitor';
import { markInit, measureInit, initMarkers } from '../utils/performance/initInstrumentation';
import { memoryManager, useElementCleanup } from '../utils/memoryManager';
import { CanvasEventProvider } from '../contexts/CanvasEventContext';
import { useSingleRAF } from '../hooks/useRAFManager';
import { canvasMonitor, recordCanvasMetric, startCanvasTimer } from '../monitoring/canvasMonitor';
import { GlobalLoadingOverlay, LoadingStateBar } from './LoadingOverlay';

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
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Centralized RAF management
  const wheelRAF = useSingleRAF('CanvasStage-wheel');
  const latestWheelEvent = useRef<Konva.KonvaEventObject<WheelEvent> | null>(null);

  // OPTIMIZED: Consolidated store subscriptions using useShallow
  markInit(initMarkers.STORE_HYDRATION_START);
  const {
    viewport,
    selectedElementIds,
    selectedTool,
    elements,
    updateElement,
    selectElement,
    setTextEditingElement,
    setViewport,
    isGlobalLoading,
    globalOperation,
    globalMessage,
    globalProgress,
    elementLoadingStates,
    operationLoadingStates
  } = useUnifiedCanvasStore(useShallow((state) => ({
    viewport: state.viewport,
    selectedElementIds: state.selectedElementIds,
    selectedTool: state.selectedTool,
    elements: state.elements,
    updateElement: state.updateElement,
    selectElement: state.selectElement,
    setTextEditingElement: state.setTextEditingElement,
    setViewport: state.setViewport,
    isGlobalLoading: state.isGlobalLoading,
    globalOperation: state.globalOperation,
    globalMessage: state.globalMessage,
    globalProgress: state.globalProgress,
    elementLoadingStates: state.elementLoadingStates,
    operationLoadingStates: state.operationLoadingStates
  })));
  markInit(initMarkers.STORE_HYDRATION_END);
  measureInit('store-hydration', initMarkers.STORE_HYDRATION_START, initMarkers.STORE_HYDRATION_END);

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

  // Initialize cursor manager with stage and optimize canvas context
  useEffect(() => {
    if (stageRef.current) {
      cursorManager.setStage(stageRef.current);
      
      // Apply high-performance canvas context settings (Tauri WebView optimization)
      const canvas = stageRef.current.toCanvas();
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false; // Disable anti-aliasing for performance
        ctx.globalCompositeOperation = 'source-over'; // Fastest composite operation
        // Request high-performance context
        Object.assign(ctx, {
          desynchronized: true,
          powerPreference: 'high-performance'
        });
      }
      
      // Store stage DOM reference in memory manager for cleanup tracking
      const stageContainer = stageRef.current.container();
      if (stageContainer) {
        // Create a dummy element to track stage resources
        const stageElement = {
          id: 'canvas-stage' as ElementId,
          type: 'stage' as any,
          x: 0,
          y: 0
        } as CanvasElement;
        
        memoryManager.trackElement(stageElement);
        memoryManager.setDOMReference(stageElement, {
          konvaNode: stageRef.current as any,
          htmlElement: stageContainer,
          eventListeners: new Map()
        });
      }
      
      // Expose canvas store to monitoring system
      const canvasStore = useUnifiedCanvasStore.getState();
      (window as any).__CANVAS_STORE__ = {
        elements: elements,
        selectedElementIds,
        selectedTool,
        viewport
      };
      
      // Performance: Detailed initialization instrumentation
            markInit('canvas-init-start');

      // Mark canvas as ready for performance monitoring (high-level)
      markCanvasReady();

      // Mark key milestones we know at this point
      markInit('canvas-store-exposed');

      // Defer to next frame to capture layer creation
      requestAnimationFrame(() => {
        markInit('canvas-layers-created');

        // Attempt to ensure fonts are loaded before first render
        // This is async but we mark regardless for timing visibility
        markInit('canvas-fonts-load-start');
        (async () => {
          try {
            // Optionally import ensureFontsLoaded if needed
            // const { ensureFontsLoaded } = await import('../utils/fontLoader');
            // await ensureFontsLoaded();
          } catch {}
          markInit('canvas-fonts-loaded');
          measureInit('fonts-load', 'canvas-fonts-load-start', 'canvas-fonts-loaded');

          markInit('canvas-stage-ready');
          measureInit('canvas-init-total', 'canvas-init-start', 'canvas-stage-ready');

          // Broadcast a DOM event and a global flag so other subsystems can defer work
          (window as any).__CANVAS_STAGE_READY__ = true;
          const evt = new Event('canvas-stage-ready');
          window.dispatchEvent(evt);

        })();
      });
    }
  }, [cursorManager, stageRef, elements, selectedElementIds, selectedTool, viewport]);

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

  // Memory monitoring and statistics (dev-only with smart gating)
  useEffect(() => {
    let memoryMonitoringInterval: number | null = null;
    const lastWarnRef = { current: 0 } as { current: number };

    if (process.env.NODE_ENV === 'development') {
      // Monitor memory usage every 10 seconds in development
      memoryMonitoringInterval = window.setInterval(() => {
        const stats = memoryManager.getMemoryStats();
        const elementCount = allElements.size;

        // Basic memory numbers (from performance.memory)
        const perf: any = performance as any;
        const mem = perf && perf.memory ? perf.memory : null;
        const usedMB = mem ? mem.usedJSHeapSize / (1024 * 1024) : stats.metadataSize / (1024 * 1024);
        const limitMB = mem && mem.jsHeapSizeLimit ? mem.jsHeapSizeLimit / (1024 * 1024) : 0;
        const percentOfLimit = limitMB > 0 ? (usedMB / limitMB) * 100 : 0;

        // Log memory stats when element count is significant
        if (elementCount > 50) {
          canvasLog.debug('🧠 [CanvasStage] Memory Stats:', {
            elementCount,
            memoryUsage: `${usedMB.toFixed(2)}MB`,
            percentOfLimit: limitMB > 0 ? `${percentOfLimit.toFixed(2)}%` : 'n/a',
          });
        }

        // Warn if memory usage is high relative to limit and canvas is active
        const globalStats = (window as any).__RAF_MANAGER_STATS__;
        const isActive = elementCount > 0 || (globalStats && globalStats.activeCount > 0);
        const now = performance.now();
        const exceedsThreshold = percentOfLimit > 70 || usedMB > 1024; // 1GB safeguard

        if (isActive && exceedsThreshold && now - lastWarnRef.current > 60000) { // 60s cooldown
          lastWarnRef.current = now;
          canvasLog.warn('⚠️ [CanvasStage] High memory usage detected:', {
            memoryUsageMB: usedMB.toFixed(2),
            percentOfLimit: limitMB > 0 ? `${percentOfLimit.toFixed(2)}%` : 'n/a',
            elementCount,
          });
        }
      }, 10000);
    }

    return () => {
      if (memoryMonitoringInterval) {
        clearInterval(memoryMonitoringInterval);
      }
    };
  }, [allElements.size]);

  // Memory cleanup on unmount (RAF cleanup is automatic via useRAFManager)
  useEffect(() => {
    return () => {
      // Clean up tracked elements on unmount
      elementCleanup?.();
    };
  }, [elementCleanup]);

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
            canvasMonitor.recordError(error, 'CanvasStage rendering error', {
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
            <UnifiedEventHandler stageRef={stageRef} visibleElements={Array.from(allElements.values())} />
            
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

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;
