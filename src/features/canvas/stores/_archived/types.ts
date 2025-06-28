// src/stores/types.ts
/**
 * Shared types for the store system
 * Re-exports from the original store for compatibility during transition
 */

import type { RichTextSegment } from '../types/richText';
import type { ConnectorEndpoint, ConnectorStyle } from '../types/connector';
import type { CanvasElement, ElementId, SectionId } from '../types/enhanced.types';

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
export type { ConnectorEndpoint, ConnectorStyle } from '../types/connector';

// Re-export section types
export type { SectionElement } from '../types/section';

// CanvasElement is now imported from enhanced.types.ts - no longer duplicated here

export interface HistoryState {
  elements: Record<ElementId, CanvasElement>;
  timestamp: number;
  action: string;
}

export interface Canvas {
  id: string;
  name: string;
  elements: Record<ElementId, CanvasElement>;
  sections: Record<SectionId, any>; // SectionElement
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

// Re-export rich text segment
export type { RichTextSegment };

// Re-export canvas element types from enhanced.types.ts
export type { CanvasElement, ElementId, SectionId };

// Export all store state types
export type { ViewportState } from './slices/viewportStore';
export type { SelectionState } from './slices/selectionStore';
export type { CanvasHistoryState, HistoryEntry } from './slices/canvasHistoryStore';
export type { CanvasUIState, ModalState, TooltipState } from './slices/canvasUIStore';
export type { CanvasElementsState } from './slices/canvasElementsStore';
export type { TextEditingState } from './slices/textEditingStore';
export type { LayerState } from './slices/layerStore';
export type { SnappingState } from './slices/snappingStore';

// Main CanvasStore type
import { ViewportState } from './slices/viewportStore';
import { SelectionState } from './slices/selectionStore';
import { CanvasHistoryState } from './slices/canvasHistoryStore';
import { CanvasUIState } from './slices/canvasUIStore';
import { CanvasElementsState } from './slices/canvasElementsStore';
import { TextEditingState } from './slices/textEditingStore';
import { LayerState } from './slices/layerStore';
import { SnappingState } from './slices/snappingStore';

export interface CanvasStore extends
  ViewportState,
  SelectionState,
  CanvasHistoryState,
  CanvasUIState,
  CanvasElementsState,
  TextEditingState,
  LayerState,
  SnappingState {}