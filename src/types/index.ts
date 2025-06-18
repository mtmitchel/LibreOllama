import type { CanvasElement, EnhancedTableData, TableCell, TableRow, TableColumn } from '../features/canvas/stores/types';
import type { RichTextSegment } from './richText';

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
  CanvasElement,
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
  ConnectorStyle,
  SectionElement
} from '../features/canvas/stores/types';

// Specific canvas element types for convenience
export interface TextElement extends CanvasElement {
  type: 'text';
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  textDecoration?: string;
}

export interface RectangleElement extends CanvasElement {
  type: 'rectangle';
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface CircleElement extends CanvasElement {
  type: 'circle';
  radius: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface ImageElement extends CanvasElement {
  type: 'image';
  imageUrl: string;
  width: number;
  height: number;
}

export interface ConnectorElement extends CanvasElement {
  type: 'connector';
  startPoint: any; // ConnectorEndpoint
  endPoint: any; // ConnectorEndpoint
  connectorStyle?: any; // ConnectorStyle
  pathPoints?: number[];
}

export interface TableElement extends CanvasElement {
  type: 'table';
  rows: number;
  cols: number;
  tableData?: string[][];
  enhancedTableData?: EnhancedTableData;
}

export interface StickyNoteElement extends CanvasElement {
  type: 'sticky-note';
  text: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

export interface PenElement extends CanvasElement {
  type: 'pen';
  points: number[];
  stroke?: string;
  strokeWidth?: number;
}

export interface TriangleElement extends CanvasElement {
  type: 'triangle';
  points: number[];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface StarElement extends CanvasElement {
  type: 'star';
  innerRadius: number;
  outerRadius: number;
  numPoints: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface RichTextElement extends CanvasElement {
  type: 'rich-text';
  segments: RichTextSegment[];
  richTextSegments?: RichTextSegment[];
}

// Data model types
export interface TableDataModel {
  cells: TableCell[][];
  rows: TableRow[];
  columns: TableColumn[];
  width: number;
  height: number;
}
