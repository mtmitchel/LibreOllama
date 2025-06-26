// src/stores/slices/viewportStore.ts
/**
 * Viewport Store - Handles zoom, pan, and viewport management
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 */

import { StateCreator } from 'zustand';
import { Draft } from 'immer';
import { logger } from '../../../../lib/logger';
import { PerformanceMonitor } from '../../utils/performance/PerformanceMonitor';
import { ViewportCuller } from '../../utils/viewport/viewportCuller';
import { CanvasElement } from '../types';
import Konva from 'konva';

export interface ViewportState {
  // Viewport properties
  stage: Konva.Stage | null;
  zoom: number;
  pan: { x: number; y: number };
  viewportSize: { width: number; height: number };
  
  // Viewport boundaries and limits
  minZoom: number;
  maxZoom: number;
  maxPanDistance: number;
  
  // View culling optimization
  viewportBounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  visibleElementIds: Set<string>;
  cullingEnabled: boolean;
  
  // Performance tracking
  viewportMetrics: {
    zoomOperations: number;
    panOperations: number;
    lastViewportUpdate: number;
    averageUpdateTime: number;
  };
  
  // Viewport operations
  setStage: (stage: Konva.Stage) => void;
  setZoom: (zoom: number, centerPoint?: { x: number; y: number }) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setViewportSize: (size: { width: number; height: number }) => void;
  
  // Viewport transformations
  zoomIn: (factor?: number, centerPoint?: { x: number; y: number }) => void;
  zoomOut: (factor?: number, centerPoint?: { x: number; y: number }) => void;
  zoomToFit: (elementIds: string[], padding?: number) => void;
  resetViewport: () => void;

  // View culling operations
  updateViewportBounds: () => void;
  updateVisibleElements: (allElements: CanvasElement[]) => void;
  isElementVisible: (elementId: string) => boolean;
  setCullingEnabled: (enabled: boolean) => void;

  // Coordinate transformations
  screenToCanvas: (screenPoint: { x: number; y: number }) => { x: number; y: number };
  canvasToScreen: (canvasPoint: { x: number; y: number }) => { x: number; y: number };
  
  // Performance utilities
  getViewportPerformance: () => { avgZoomTime: number; avgPanTime: number; updateCount: number };
  resetViewportMetrics: () => void;
}

export const createViewportStore: StateCreator<
  ViewportState,
  [['zustand/immer', never]],
  [],
  ViewportState
> = (set, get) => ({
  // Initial state
  stage: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  viewportSize: { width: 800, height: 600 },
  minZoom: 0.1,
  maxZoom: 10,
  maxPanDistance: 10000,
  viewportBounds: { left: 0, top: 0, right: 800, bottom: 600 },
  visibleElementIds: new Set(),
  cullingEnabled: true,
  viewportMetrics: {
    zoomOperations: 0,
    panOperations: 0,
    lastViewportUpdate: 0,
    averageUpdateTime: 0,
  },

  setStage: (stage) => {
    set({ stage });
  },

  setZoom: (zoom, centerPoint) => {
    const endTiming = PerformanceMonitor.startTiming('setZoom');
    
    try {
      const { pan, zoom: currentZoom, minZoom, maxZoom } = get();
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom));

      logger.log(`🔎 [VIEWPORT STORE] Setting zoom: ${newZoom}`, { centerPoint });

      if (centerPoint) {
        const mousePointTo = {
          x: (centerPoint.x - pan.x) / currentZoom,
          y: (centerPoint.y - pan.y) / currentZoom,
        };
        
        const newPan = {
          x: -(mousePointTo.x - centerPoint.x / newZoom) * newZoom,
          y: -(mousePointTo.y - centerPoint.y / newZoom) * newZoom,
        };

        set((state: Draft<ViewportState>) => {
          state.zoom = newZoom;
          state.pan = newPan;
          state.viewportMetrics.zoomOperations++;
          state.viewportMetrics.lastViewportUpdate = performance.now();
        });

      } else {
        set((state: Draft<ViewportState>) => {
          state.zoom = newZoom;
          state.viewportMetrics.zoomOperations++;
          state.viewportMetrics.lastViewportUpdate = performance.now();
        });
      }
      
      // Update viewport bounds after zoom change
      get().updateViewportBounds();
      
      PerformanceMonitor.recordMetric('viewportZoom', 1, 'canvas', { newZoom });
      
      logger.log('✅ [VIEWPORT STORE] Zoom updated successfully:', get().zoom);
    } finally {
      endTiming();
    }
  },

  setPan: (pan: { x: number; y: number }) => {
    const endTiming = PerformanceMonitor.startTiming('setPan');
    
    try {
      logger.log('📐 [VIEWPORT STORE] Setting pan:', pan);
      
      set((state: Draft<ViewportState>) => {
        state.pan.x = Math.max(-state.maxPanDistance, Math.min(state.maxPanDistance, pan.x));
        state.pan.y = Math.max(-state.maxPanDistance, Math.min(state.maxPanDistance, pan.y));
        state.viewportMetrics.panOperations++;
        state.viewportMetrics.lastViewportUpdate = performance.now();
        
        logger.log('✅ [VIEWPORT STORE] Pan updated successfully:', state.pan);
      });
      
      // Update viewport bounds after pan change
      get().updateViewportBounds();
      
      PerformanceMonitor.recordMetric('viewportPan', 1, 'canvas', {
        deltaX: pan.x - get().pan.x,
        deltaY: pan.y - get().pan.y
      });
    } finally {
      endTiming();
    }
  },

  setViewportSize: (size: { width: number; height: number }) => {
    const endTiming = PerformanceMonitor.startTiming('setViewportSize');
    
    try {
      logger.log('📏 [VIEWPORT STORE] Setting viewport size:', size);
      
      set((state: Draft<ViewportState>) => {
        state.viewportSize = { ...size };
        state.viewportMetrics.lastViewportUpdate = performance.now();
      });
      
      // Update viewport bounds after size change
      get().updateViewportBounds();
      
      PerformanceMonitor.recordMetric('viewportResize', 1, 'canvas', size);
      
      logger.log('✅ [VIEWPORT STORE] Viewport size updated successfully');
    } finally {
      endTiming();
    }
  },

  // Viewport transformations
  zoomIn: (factor: number = 1.2, centerPoint?: { x: number; y: number }) => {
    const currentZoom = get().zoom;
    get().setZoom(currentZoom * factor, centerPoint);
  },

  zoomOut: (factor: number = 1.2, centerPoint?: { x: number; y: number }) => {
    const currentZoom = get().zoom;
    get().setZoom(currentZoom / factor, centerPoint);
  },

  zoomToFit: (elementIds: string[], padding: number = 50) => {
    const endTiming = PerformanceMonitor.startTiming('zoomToFit');
    
    try {
      logger.log('🎯 [VIEWPORT STORE] Zooming to fit elements:', elementIds);
      
      if (elementIds.length === 0) return;
      
      // This would calculate bounds from actual elements
      // For now, implement a basic version
      const { viewportSize } = get();
      const targetZoom = Math.min(
        viewportSize.width / (800 + padding * 2),
        viewportSize.height / (600 + padding * 2)
      );
      
      set((state: Draft<ViewportState>) => {
        state.zoom = Math.max(state.minZoom, Math.min(state.maxZoom, targetZoom));
        state.pan = { x: 0, y: 0 }; // Center the view
        state.viewportMetrics.lastViewportUpdate = performance.now();
      });
      
      get().updateViewportBounds();
      
      PerformanceMonitor.recordMetric('zoomToFit', elementIds.length, 'canvas', { padding });
      
      logger.log('✅ [VIEWPORT STORE] Zoom to fit completed');
    } finally {
      endTiming();
    }
  },

  resetViewport: () => {
    const endTiming = PerformanceMonitor.startTiming('resetViewport');
    
    try {
      logger.log('🔄 [VIEWPORT STORE] Resetting viewport');
      
      set((state: Draft<ViewportState>) => {
        state.zoom = 1;
        state.pan = { x: 0, y: 0 };
        state.viewportMetrics.lastViewportUpdate = performance.now();
      });
      
      get().updateViewportBounds();
      
      PerformanceMonitor.recordMetric('viewportReset', 1, 'canvas');
      
      logger.log('✅ [VIEWPORT STORE] Viewport reset completed');
    } finally {
      endTiming();
    }
  },

  // View culling operations
  updateViewportBounds: () => {
    const { pan, zoom, viewportSize } = get();
    const left = -pan.x / zoom;
    const top = -pan.y / zoom;
    const right = (-pan.x + viewportSize.width) / zoom;
    const bottom = (-pan.y + viewportSize.height) / zoom;
    set({ viewportBounds: { left, top, right, bottom } });
  },  updateVisibleElements: (allElements: CanvasElement[]) => {
    if (!get().cullingEnabled) {
      const allElementIds = allElements.map((el: CanvasElement) => el.id);
      set((state: Draft<ViewportState>) => {
        state.visibleElementIds = new Set(allElementIds);
      });
      return;
    }

    const { viewportBounds, viewportSize } = get();
    const viewportRect = {
      x: viewportBounds.left,
      y: viewportBounds.top,
      width: viewportBounds.right - viewportBounds.left,
      height: viewportBounds.bottom - viewportBounds.top
    };

    const culler = new ViewportCuller({ x: 0, y: 0, width: viewportSize.width, height: viewportSize.height });
    culler.build(allElements);
    const visibleElementIds = culler.getVisibleElements(viewportRect);

    set((state: Draft<ViewportState>) => {
      state.visibleElementIds = new Set(visibleElementIds);
    });
  },
  isElementVisible: (elementId: string) => {
    return get().visibleElementIds.has(elementId);
  },
  setCullingEnabled: (enabled: boolean) => {
    set({ cullingEnabled: enabled });
  },

  // Coordinate transformations
  screenToCanvas: (screenPoint: { x: number; y: number }): { x: number; y: number } => {
    const { zoom, pan, viewportSize } = get();
    
    return {
      x: (screenPoint.x - viewportSize.width / 2 - pan.x) / zoom,
      y: (screenPoint.y - viewportSize.height / 2 - pan.y) / zoom
    };
  },

  canvasToScreen: (canvasPoint: { x: number; y: number }): { x: number; y: number } => {
    const { zoom, pan, viewportSize } = get();
    
    return {
      x: canvasPoint.x * zoom + pan.x + viewportSize.width / 2,
      y: canvasPoint.y * zoom + pan.y + viewportSize.height / 2
    };
  },

  // Performance utilities
  getViewportPerformance: () => {
    const { viewportMetrics } = get();
    
    return {
      avgZoomTime: 0, // Would calculate from timing data
      avgPanTime: 0,  // Would calculate from timing data
      updateCount: viewportMetrics.zoomOperations + viewportMetrics.panOperations
    };
  },

  resetViewportMetrics: () => {
    set((state: Draft<ViewportState>) => {
      state.viewportMetrics = {
        zoomOperations: 0,
        panOperations: 0,
        lastViewportUpdate: 0,
        averageUpdateTime: 0
      };
    });
    
    logger.log('🔍 [VIEWPORT STORE] Viewport metrics reset');
  }
});
