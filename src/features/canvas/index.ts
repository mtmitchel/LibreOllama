// Enhanced Canvas Feature Index - Centralized Exports
// This file provides a single entry point for all canvas feature imports

// Core Types
export type {
  CanvasElement,
  TableCell,
  TableRow,
  TableColumn,
  TableSelection,
  EnhancedTableData,
  RichTextSegment
} from './types';

export type {
  KonvaMouseEvent,
  KonvaTouchEvent,
  KonvaPointerEvent,
  KonvaShapeConfig,
  KonvaRectConfig,
  KonvaCircleConfig,
  KonvaTextConfig,
  KonvaLineConfig,
  TransformerConfig
} from './types/konva.types';

export type {
  LayerProps,
  BackgroundLayerProps,
  MainLayerProps,
  ConnectorLayerProps,
  UILayerProps,
  ShapeComponentProps
} from './layers/types';

// Canvas Stores
export { useCanvasStore as useKonvaCanvasStore } from './stores/canvasStore.enhanced';
export type { CanvasState } from './hooks/useGranularSelectors';

// Granular Selectors (Phase 2 Optimization)
export {
  useElementProperty,
  useElementPosition,
  useElementDimensions,
  useElementStyle,
  useIsElementSelected,
  useSelectedElements,
  useViewportElements,
  useElementCount,
  useSelectedElementCount,
  useElementsByType,
  useCanUndoRedo,
  useCurrentTool,
  useIsDrawing,
  useViewportTransform,
  useElementsInRegion
} from './hooks/useGranularSelectors';

// Performance Optimization Hooks (Phase 4)
export {
  useThrottledUpdate,
  useDebounced,
  createMemoizedSelector,
  usePerformanceMonitor,
  withMemoization,
  useBatchUpdate,
  useViewportCulling
} from './hooks/usePerformanceOptimization';

// Memory Monitoring (Phase 5)
export {
  CanvasMemoryProfiler,
  useMemoryMonitor
} from './utils/memoryProfiler';

// Production Logging
export {
  canvasLogger,
  performanceLogger,
  memoryLogger,
  debugLogger,
  logPerformance,
  logMemoryUsage,
  logCanvasOperation,
  logCanvasError,
  assert,
  devLog,
  Logger
} from './utils/logger';

// Core Components
export { EditableNode } from './shapes/EditableNode';
export { ConnectorRenderer } from './components/ConnectorRenderer';

// Layer Components
export { UILayer } from './layers/UILayer';
export { BackgroundLayer } from './layers/BackgroundLayer';
export { MainLayer } from './layers/MainLayer';
export { ConnectorLayer } from './layers/ConnectorLayer';
export { CanvasLayerManager } from './layers/CanvasLayerManager';

// Utility Functions
export { CoordinateService } from './utils/coordinateService';

// Canvas Optimization Utilities
export {
  RenderOptimizer
} from './utils/canvas/RenderOptimizer';

export {
  EventOptimizer  
} from './utils/canvas/EventOptimizer';

export {
  CacheManager
} from './utils/canvas/CacheManager';

// Viewport and Spatial Utilities
export {
  ViewportCuller
} from './utils/viewport/viewportCuller';

export {
  Quadtree
} from './utils/viewport/quadtree';

// Version information for debugging
export const CANVAS_VERSION = '2.0.0-optimized';
