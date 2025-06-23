// Canvas feature types - re-exports from main types directory
import type { BoundingBox } from './types/enhanced.types';

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
  StarElement,
  RichTextElement,
  EnhancedTableData,
  TableCell,
  TableRow,
  TableColumn,
  TableDataModel,
  TableSelection,
  PanZoom,  Size,
  ViewportBounds,
  Coordinates,
  BaseElement,
  ElementPosition,
  CoordinateSpace,  ViewportState,
  SelectionState,
  CanvasHistoryState,
  HistoryEntry,
  CanvasUIState,
  ModalState,
  TooltipState,
  CanvasElementsState,
  TextEditingState,
  HistoryState,
  Canvas,
  BoundingBox
} from '../../types';

export type {
  RichTextSegment,
  StandardTextFormat,
  TextSelection,
} from './types/richText';

export type {
  ConnectorEndpoint,
  ConnectorStyle,
} from './types/connector';

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
