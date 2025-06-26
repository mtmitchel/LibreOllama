import type { CanvasElement, EnhancedTableData, TableCell, TableRow, TableColumn } from '../features/canvas/stores/types';
import type { ConnectorEndpoint, ConnectorStyle } from '../features/canvas/types/connector';
import type { RichTextSegment } from '../features/canvas/types/richText';

export interface PanZoom {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Base element interface with section support
export interface BaseElement {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation?: number;
  isLocked?: boolean;
  isHidden?: boolean;
  // NEW: Section membership - tracks which section contains this element
  sectionId?: string | null;
}

// Coordinate system types for the refactoring
export interface Coordinates {
  x: number;
  y: number;
}

export interface ElementPosition {
  // Stored coordinates (relative to parent section or canvas)
  local: Coordinates;
  // Computed absolute coordinates (for hit testing, connectors)
  absolute?: Coordinates;
}

// Helper type for coordinate context
export type CoordinateSpace = 'local' | 'absolute' | 'screen';

// Bounding box for element bounds calculations
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Re-export all types from stores/types.ts for backwards compatibility
export type {
  TableCell,
  TableRow,
  TableColumn,
  TableSelection,
  EnhancedTableData,
  HistoryState,
  Canvas,
  RichTextSegment,
  ViewportState,
  SelectionState,
  CanvasHistoryState,
  HistoryEntry,
  CanvasUIState,
  ModalState,
  TooltipState,
  CanvasElementsState,
  TextEditingState,
  ConnectorEndpoint,
  ConnectorStyle
} from '../features/canvas/stores/types';

// Canvas element types are now re-exported from enhanced.types.ts
// Removing duplicate definitions and using enhanced types as single source of truth

// Re-export all canvas element types from enhanced.types.ts
export type {
  TextElement,
  RectangleElement,
  CircleElement,
  ImageElement,
  ConnectorElement,
  TableElement,
  StickyNoteElement,
  PenElement,
  TriangleElement,
  StarElement,
  RichTextElement,
  GroupElement,
  SectionElement as CanvasSectionElement,
  CanvasElement
} from '../features/canvas/types/enhanced.types';

// Data model types
export interface TableDataModel {
  cells: TableCell[][];
  rows: TableRow[];
  columns: TableColumn[];
  width: number;
  height: number;
}
