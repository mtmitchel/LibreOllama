// Canvas feature types - re-exports from main types directory
import type { BoundingBox } from './types/enhanced.types';

// Re-export all canvas element types from enhanced.types.ts
export type {
  CanvasElement,
  TextElement,
  RectangleElement,
  CircleElement,
  ImageElement,
  ConnectorElement,
  SectionElement,
  TableElement,
  StickyNoteElement,
  PenElement,
  TriangleElement,
  RichTextElement,
  GroupElement,
  ElementId,
  SectionId,
  LayerId,
  ConnectorId,
  GroupId,
  BaseElement,
  BoundingBox,
  ViewportBounds,
  Coordinates
} from './types/enhanced.types';

// Re-export store types
export type {
  EnhancedTableData,
  TableCell,
  TableRow,
  TableColumn,
  TableSelection,
  ViewportState,
  SelectionState,
  CanvasHistoryState,
  HistoryEntry,
  CanvasUIState,
  ModalState,
  TooltipState,
  CanvasElementsState,
  TextEditingState,
  HistoryState,
  Canvas
} from './types/enhanced.types';

// Re-export TableDataModel from root types
export type { TableDataModel } from '../../types';

// Re-export other utility types
export type {
  PanZoom,
  Size,
  ElementPosition,
  CoordinateSpace
} from '../../types';

export type {
  RichTextSegment,
  StandardTextFormat,
  TextSelection,
} from './types/richText';

export type {
  ConnectorEndpoint,
  ConnectorStyle,
} from './types/connectorTypes';

export type {
  SectionElement as SectionType,
} from './types/section';

export type {
  KonvaNode,
} from './types/konva.types';

// Additional canvas-specific types
export interface CanvasLayer {
  id: string;
  name: string;
  elementIds: string[];
  isVisible: boolean;
  isLocked: boolean;
  order: number;
}

export interface CanvasTool {
  id: string;
  name: string;
  icon: any;
  description?: string;
  category?: string;
}

export interface ElementGroup {
  id: string;
  elementIds: string[];
  bounds: BoundingBox;
}

// Performance-related types
export interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  elementCount: number;
  visibleElementCount: number;
}

// Caching types
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  clear(key?: string): void;
  size(): number;
}
