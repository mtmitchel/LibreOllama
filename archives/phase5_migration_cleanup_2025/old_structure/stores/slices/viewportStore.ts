// src/stores/slices/viewportStore.ts
/**
 * Viewport Store - Handles zoom, pan, and viewport management
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 */

import { StateCreator } from 'zustand';
import { Draft } from 'immer';
import { PerformanceMonitor, recordMetric } from '../utils/performance';
import { ViewportCuller } from '../../utils/viewport';
import { Rectangle } from '../../utils/viewport/types';
import { KonvaNode } from '../../types/konva.types';

export interface ViewportState {
  // Viewport properties
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
  updateVisibleElements: (allElements: KonvaNode[]) => void;
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
  zoom: 1,
  pan: { x: 0, y: 0 },
  viewportSize: { width: 800, height: 600 },
  
  // Viewport limits
  minZoom: 0.1,
  maxZoom: 10,
  maxPanDistance: 5000,
  
  // View culling state
  viewportBounds: { left: 0, top: 0, right: 800, bottom: 600 },
  visibleElementIds: new Set(),
  cullingEnabled: true,
  
  // Performance metrics
  viewportMetrics: {
    zoomOperations: 0,
    panOperations: 0,
    lastViewportUpdate: 0,
    averageUpdateTime: 0
  },

  // Viewport operations
  setZoom: (zoom: number, centerPoint?: { x: number; y: number }) => {
    const endTiming = PerformanceMonitor.startTiming('setZoom');
    
    try {
      console.log('🔍 [VIEWPORT STORE] Setting zoom:', zoom, centerPoint);
      
      set((state: Draft<ViewportState>) => {
        const clampedZoom = Math.max(state.minZoom, Math.min(state.maxZoom, zoom));
        
        if (centerPoint) {
          // Zoom around a specific point
          const factor = clampedZoom / state.zoom;
          const newPanX = centerPoint.x - (centerPoint.x - state.pan.x) * factor;
          const newPanY = centerPoint.y - (centerPoint.y - state.pan.y) * factor;
          
          state.pan.x = Math.max(-state.maxPanDistance, Math.min(state.maxPanDistance, newPanX));
          state.pan.y = Math.max(-state.maxPanDistance, Math.min(state.maxPanDistance, newPanY));
        }
        
        state.zoom = clampedZoom;
        state.viewportMetrics.zoomOperations++;
        state.viewportMetrics.lastViewportUpdate = performance.now();
        
        console.log('✅ [VIEWPORT STORE] Zoom updated successfully:', clampedZoom);
      });
      
      // Update viewport bounds after zoom change
      get().updateViewportBounds();
      
      recordMetric('viewportZoom', zoom, 'canvas', {
        centerPoint: centerPoint ? 'true' : 'false',
        finalZoom: Math.max(get().minZoom, Math.min(get().maxZoom, zoom))
      });
    } finally {
      endTiming();
    }
  },

  setPan: (pan: { x: number; y: number }) => {
    const endTiming = PerformanceMonitor.startTiming('setPan');
    
    try {
      console.log('📐 [VIEWPORT STORE] Setting pan:', pan);
      
      set((state: Draft<ViewportState>) => {
        state.pan.x = Math.max(-state.maxPanDistance, Math.min(state.maxPanDistance, pan.x));
        state.pan.y = Math.max(-state.maxPanDistance, Math.min(state.maxPanDistance, pan.y));
        state.viewportMetrics.panOperations++;
        state.viewportMetrics.lastViewportUpdate = performance.now();
        
        console.log('✅ [VIEWPORT STORE] Pan updated successfully:', state.pan);
      });
      
      // Update viewport bounds after pan change
      get().updateViewportBounds();
      
      recordMetric('viewportPan', 1, 'canvas', {
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
      console.log('📏 [VIEWPORT STORE] Setting viewport size:', size);
      
      set((state: Draft<ViewportState>) => {
        state.viewportSize = { ...size };
        state.viewportMetrics.lastViewportUpdate = performance.now();
      });
      
      // Update viewport bounds after size change
      get().updateViewportBounds();
      
      recordMetric('viewportResize', 1, 'canvas', size);
      
      console.log('✅ [VIEWPORT STORE] Viewport size updated successfully');
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
      console.log('🎯 [VIEWPORT STORE] Zooming to fit elements:', elementIds);
      
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
      
      recordMetric('zoomToFit', elementIds.length, 'canvas', { padding });
      
      console.log('✅ [VIEWPORT STORE] Zoom to fit completed');
    } finally {
      endTiming();
    }
  },

  resetViewport: () => {
    const endTiming = PerformanceMonitor.startTiming('resetViewport');
    
    try {
      console.log('🔄 [VIEWPORT STORE] Resetting viewport');
      
      set((state: Draft<ViewportState>) => {
        state.zoom = 1;
        state.pan = { x: 0, y: 0 };
        state.viewportMetrics.lastViewportUpdate = performance.now();
      });
      
      get().updateViewportBounds();
      
      recordMetric('viewportReset', 1, 'canvas');
      
      console.log('✅ [VIEWPORT STORE] Viewport reset completed');
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
  },
  updateVisibleElements: (allElements: KonvaNode[]) => {
    if (!get().cullingEnabled) {
      const allElementIds = allElements.map((el: KonvaNode) => el.id);
      set((state: Draft<ViewportState>) => {
        state.visibleElementIds = new Set(allElementIds);
      });
      return;
    }

    const { viewportBounds, viewportSize } = get();
    const viewportRect = new Rectangle(
      viewportBounds.left,
      viewportBounds.top,
      viewportBounds.right - viewportBounds.left,
      viewportBounds.bottom - viewportBounds.top
    );

    const culler = new ViewportCuller(new Rectangle(0, 0, viewportSize.width, viewportSize.height));
    culler.build(allElements);
    const visibleNodes = culler.getVisibleNodes(viewportRect);
    const visibleElementIds = new Set(visibleNodes.map((node: KonvaNode) => node.id));

    set((state: Draft<ViewportState>) => {
      state.visibleElementIds = visibleElementIds;
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
    
    console.log('🔍 [VIEWPORT STORE] Viewport metrics reset');
  }
});
