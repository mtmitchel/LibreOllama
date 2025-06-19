// src/stores/types.ts
/**
 * Shared types for the store system
 * Re-exports from the original store for compatibility during transition
 */

import type { RichTextSegment } from '../../../types/richText';
import type { ConnectorEndpoint, ConnectorStyle } from '../../../types/connector';

export interface TableCell {
  id: string;
  text?: string;
  segments: RichTextSegment[]; // Required for exactOptionalPropertyTypes compliance
  richTextSegments?: RichTextSegment[]; // Backward compatibility alias
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  textDecoration?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  isHeader?: boolean;
  isSelected?: boolean;
  containedElementIds: string[];
  rowSpan?: number;
  colSpan?: number;
}

export interface TableRow {
  id: string;
  height: number;
  minHeight?: number;
  maxHeight?: number;
  isResizable: boolean; // Required for exactOptionalPropertyTypes compliance
  isHeader: boolean;
}

export interface TableColumn {
  id: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  isResizable: boolean; // Required for exactOptionalPropertyTypes compliance
  textAlign?: 'left' | 'center' | 'right';
}

export interface TableSelection {
  type: 'cell' | 'row' | 'column' | 'table';
  cellIds?: string[];
  rowIds?: string[];
  columnIds?: string[];
  startCell?: { row: number; col: number };
  endCell?: { row: number; col: number };
}

export interface EnhancedTableData {
  rows: TableRow[];
  columns: TableColumn[];
  cells: TableCell[][];
  selection?: TableSelection;
  showGridLines?: boolean;
  cornerRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  defaultCellPadding?: number;
  autoResizeRows?: boolean;
  allowDragAndDrop?: boolean;
  keyboardNavigationEnabled?: boolean;
}

// Re-export connector types
export type { ConnectorEndpoint, ConnectorStyle } from '../../../types/connector';

// Re-export section types
export type { SectionElement } from '../../../types/section';

export interface CanvasElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'pen' | 'triangle' | 'star' | 'sticky-note' | 'rich-text' | 'image' | 'connector' | 'section' | 'table';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  innerRadius?: number;
  numPoints?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  sides?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  textDecoration?: string;
  listType?: string;
  isHyperlink?: boolean;
  hyperlinkUrl?: string;
  segments?: RichTextSegment[];
  richTextSegments?: RichTextSegment[];
  imageUrl?: string;
  arrowStart?: boolean;
  arrowEnd?: boolean;
  color?: string;
  rotation?: number;    // Connector properties
  subType?: 'line' | 'arrow' | 'straight' | 'bent' | 'curved';
  startPoint?: ConnectorEndpoint;
  endPoint?: ConnectorEndpoint;
  intermediatePoints?: { x: number; y: number }[];
  connectorStyle?: ConnectorStyle;
  pathPoints?: number[];
  
  // Section properties
  sectionId?: string | null;
  
  // State properties
  isLocked?: boolean;
  isHidden?: boolean;
  
  // Table properties
  rows?: number;
  cols?: number;
  cellWidth?: number;
  cellHeight?: number;
  tableData?: string[][];
  borderColor?: string;
  headerBackgroundColor?: string;
  cellBackgroundColor?: string;
  enhancedTableData?: EnhancedTableData;
}

export interface HistoryState {
  elements: Record<string, CanvasElement>;
  timestamp: number;
  action: string;
}

export interface Canvas {
  id: string;
  name: string;
  elements: Record<string, CanvasElement>;
  sections: Record<string, any>; // SectionElement
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

// Re-export rich text segment
export type { RichTextSegment };

// Export all store state types
export type { ViewportState } from './slices/viewportStore';
export type { SelectionState } from './slices/selectionStore';
export type { CanvasHistoryState, HistoryEntry } from './slices/canvasHistoryStore';
export type { CanvasUIState, ModalState, TooltipState } from './slices/canvasUIStore';
export type { CanvasElementsState } from './slices/canvasElementsStore';
export type { TextEditingState } from './slices/textEditingStore';