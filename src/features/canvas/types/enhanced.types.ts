/**
 * Enhanced Type Definitions with Branded Types
 * Part of LibreOllama Canvas Refactoring - Phase 2
 * 
 * This file introduces strict typing improvements including:
 * - Branded types to prevent ID mixing
 * - Discriminated unions for canvas elements
 * - Type predicates for safe type narrowing
 * - Strict event typing
 */

// Branded types prevent mixing different kinds of IDs at compile time.
// A function cannot accidentally accept a SectionId where an ElementId is required.
type Brand<K, T> = K & { __brand: T };

// Rich text support
export interface RichTextSegment {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fontWeight?: string;
  textDecoration?: string;
  fill?: string;
  url?: string;
  textAlign?: 'left' | 'center' | 'right';
  listType?: 'none' | 'bullet' | 'numbered';
}

export type ElementId = Brand<string, 'ElementId'>;
export type SectionId = Brand<string, 'SectionId'>;
export type LayerId = Brand<string, 'LayerId'>;
export type ConnectorId = Brand<string, 'ConnectorId'>;
export type GroupId = Brand<string, 'GroupId'>;

// Union type for places that accept both element and section IDs
export type ElementOrSectionId = ElementId | SectionId;

// Helper functions to create branded types safely
export const createElementId = (id: string): ElementId => id as ElementId;
export const createSectionId = (id: string): SectionId => id as SectionId;
export const createLayerId = (id: string): LayerId => id as LayerId;
export const createConnectorId = (id: string): ConnectorId => id as ConnectorId;
export const createGroupId = (id: string): GroupId => id as GroupId;

// Base element interface with enhanced typing
export interface BaseElement {
  id: ElementId;
  type: string;
  x: number;
  y: number;
  rotation?: number;
  isLocked?: boolean;
  isHidden?: boolean;
  sectionId?: SectionId | null;
  layerId?: LayerId;
  groupId?: GroupId | null; // Changed from ElementId | null to GroupId | null
  zIndex?: number;
  createdAt: number;
  updatedAt: number;
}

// Discriminated Union for Canvas Elements
// The `type` property acts as the discriminant for type-safe operations
export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  textDecoration?: string;
  fill?: string;
  width?: number;
  height?: number;
  // FigJam-style text sizing mode
  mode?: 'autoWidth' | 'autoHeight' | 'fixed';
  // Styling and layout
  padding?: number; // default 12 (used for overlay and measurement)
  lineHeight?: number; // default 1.4
  align?: 'left' | 'center' | 'right'; // default 'left'
  maxHeight?: number; // optional clamp height
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  onActivate?: () => void;
  onClick?: () => void | boolean;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  radius: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface SectionElement extends Omit<BaseElement, 'id'> {
  id: SectionId;
  type: 'section';
  width: number;
  height: number;
  title?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  cornerRadius?: number;
  collapsed?: boolean;
  childElementIds: ElementId[];
  containedElementIds?: ElementId[]; // Legacy compatibility
}

export interface ConnectorStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeDashArray?: number[];
  startArrow?: 'none' | 'solid' | 'line' | 'triangle' | 'diamond';
  endArrow?: 'none' | 'solid' | 'line' | 'triangle' | 'diamond';
  arrowSize?: number;
  text?: string;
}

export interface ConnectorElement extends BaseElement {
  type: 'connector';
  subType: 'line' | 'arrow' | 'straight' | 'bent' | 'curved';
  startElementId?: ElementId | SectionId | undefined;
  endElementId?: ElementId | SectionId | undefined;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  intermediatePoints?: { x: number; y: number }[];
  stroke?: string;
  strokeWidth?: number;
  pathPoints?: number[];
  connectorStyle?: ConnectorStyle;
  points?: number[];
}

export interface ImageElement extends BaseElement {
  type: 'image';
  imageUrl: string;
  width: number;
  height: number;
  opacity?: number;
}

export interface TableRow {
  height?: number;
  id?: string;
}

export interface TableColumn {
  width?: number;
  id?: string;
}

export interface TableStyling {
  headerBackgroundColor?: string;
  headerTextColor?: string;
  borderColor?: string;
  alternateRowColor?: string;
  hoverColor?: string;
  fontSize?: number;
  fontFamily?: string;
  padding?: number;
  borderRadius?: number;
  shadow?: string;
}

export interface EnhancedTableData {
  rows: TableRow[];
  columns: TableColumn[];
  cells: TableCell[][];
  styling?: TableStyling;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  cols: number;
  width: number;
  height: number;
  cellWidth?: number;
  cellHeight?: number;
  tableData?: TableCell[][];
  enhancedTableData?: EnhancedTableData;
  cellPadding?: number;
  borderWidth?: number;
  borderColor?: string;
}

export interface TableCell {
  content: string;
  text?: string; // Legacy compatibility
  segments?: RichTextSegment[]; // Rich text support
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fontWeight?: string;
  textDecoration?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export interface StickyNoteElement extends BaseElement {
  // Inline-editing flags used by the imperative renderer
  isEditing?: boolean;
  newlyCreated?: boolean;
  type: 'sticky-note';
  text?: string;
  width: number;
  height: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: 'left' | 'center' | 'right';
  // FigJam-style text sizing mode for sticky notes too (optional)
  mode?: 'autoWidth' | 'autoHeight' | 'fixed';
  // Styling and layout
  padding?: number; // default 12
  lineHeight?: number; // default 1.4
  align?: 'left' | 'center' | 'right'; // default 'left'
  maxHeight?: number; // optional clamp height
  richTextSegments?: RichTextSegment[];
  childElementIds?: ElementId[];
  isContainer?: boolean;
  allowedChildTypes?: string[];
  clipChildren?: boolean;
  maxChildElements?: number;
}

export interface PenElement extends BaseElement {
  type: 'pen';
  points: number[];
  stroke?: string;
  strokeWidth?: number;
  tension?: number;
  fill?: string;
}

export interface TriangleElement extends BaseElement {
  type: 'triangle';
  width: number;
  height: number;
  points: number[];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface RichTextElement extends BaseElement {
  type: 'rich-text';
  text: string;
  segments: RichTextSegment[];
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface GroupElement extends BaseElement {
  type: 'group';
  childElementIds: ElementId[];
  width: number;
  height: number;
  groupName?: string;
  isExpanded?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
}

// Raw drawing point data structure
export interface RawDrawingPoint {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

// Advanced drawing elements (inline to avoid circular imports)
export interface MarkerElement extends BaseElement {
  type: 'marker';
  points: number[];
  rawPoints?: RawDrawingPoint[];
  style: {
    color: string;
    width: number;
    opacity: number;
    smoothness: number;
    lineCap: string;
    lineJoin: string;
    blendMode?: string;
    widthVariation: boolean;
    minWidth: number;
    maxWidth: number;
    pressureSensitive: boolean;
  };
}

export interface HighlighterElement extends BaseElement {
  type: 'highlighter';
  points: number[];
  rawPoints?: RawDrawingPoint[];
  style: {
    color: string;
    width: number;
    opacity: number;
    smoothness: number;
    lineCap: string;
    lineJoin: string;
    blendMode: string;
    baseOpacity: number;
    highlightColor: string;
  };
}

// Note: Drawing types will be imported where needed to avoid circular dependencies

// Main discriminated union for all canvas elements
export type CanvasElement = 
  | TextElement
  | RectangleElement
  | CircleElement
  | SectionElement
  | ConnectorElement
  | ImageElement
  | TableElement
  | StickyNoteElement
  | PenElement
  | TriangleElement
  | RichTextElement
  | GroupElement
  | MarkerElement
  | HighlighterElement
;

// Type Predicates provide safe type narrowing within the code.
// No more `(element as RectangleElement).width`.
export function isTextElement(element: CanvasElement): element is TextElement {
  return element.type === 'text';
}

export function isRectangularElement(element: CanvasElement): element is CanvasElement & { width: number; height: number } {
    return 'width' in element && 'height' in element;
}

export function isRectangleElement(el: CanvasElement): el is RectangleElement {
  return el.type === 'rectangle';
}

export function isCircleElement(el: CanvasElement): el is CircleElement {
  return el.type === 'circle';
}

export function isSectionElement(el: CanvasElement): el is SectionElement {
  return el.type === 'section';
}

export function isConnectorElement(el: CanvasElement): el is ConnectorElement {
  return el.type === 'connector';
}

export function isImageElement(el: CanvasElement): el is ImageElement {
  return el.type === 'image';
}

export function isTableElement(el: CanvasElement): el is TableElement {
  return el.type === 'table';
}

export function isStickyNoteElement(el: CanvasElement): el is StickyNoteElement {
  return el.type === 'sticky-note';
}

export function isPenElement(el: CanvasElement): el is PenElement {
  return el.type === 'pen';
}

export function isTriangleElement(el: CanvasElement): el is TriangleElement {
  return el.type === 'triangle';
}

export function isRichTextElement(el: CanvasElement): el is RichTextElement {
  return el.type === 'rich-text';
}

export function isGroupElement(el: CanvasElement): el is GroupElement {
  return el.type === 'group';
}

export function isMarkerElement(el: CanvasElement): el is MarkerElement {
  return el.type === 'marker';
}

export function isHighlighterElement(el: CanvasElement): el is HighlighterElement {
  return el.type === 'highlighter';
}

// Container-related utility functions
export function isContainerElement(el: CanvasElement): el is (SectionElement | StickyNoteElement) & { childElementIds: ElementId[] } {
  return (el.type === 'section' || el.type === 'sticky-note') && 'childElementIds' in el;
}

export function isStickyNoteContainer(el: CanvasElement): el is StickyNoteElement & { childElementIds: ElementId[] } {
  return el.type === 'sticky-note' && 'childElementIds' in el && Array.isArray((el as StickyNoteElement).childElementIds);
}

// Strict event map ensures all event payloads are correctly typed
export interface CanvasEventMap {
  'element:add': { element: CanvasElement };
  'element:update': { id: ElementId; changes: Partial<CanvasElement> };
  'element:delete': { id: ElementId };
  'element:select': { ids: ElementId[] };
  'element:deselect': { ids: ElementId[] };
  'selection:change': { ids: ElementId[] };
  'section:add': { section: SectionElement };
  'section:update': { id: SectionId; changes: Partial<SectionElement> };
  'section:delete': { id: SectionId };
  'group:create': { groupId: GroupId; elementIds: ElementId[] };
  'group:ungroup': { groupId: GroupId; elementIds: ElementId[] };
  'group:add-element': { groupId: GroupId; elementId: ElementId };
  'group:remove-element': { groupId: GroupId; elementId: ElementId };
  'viewport:change': { scale: number; position: { x: number; y: number } };
  'tool:change': { tool: string };
  'history:undo': { operation: string };
  'history:redo': { operation: string };
}

// Event handler type with proper typing
export type CanvasEventHandler<T extends keyof CanvasEventMap> = (
  event: CanvasEventMap[T]
) => void;

// Coordinate system types
export interface Coordinates {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Performance-related types
export interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  elementCount: number;
  visibleElementCount: number;
  cacheHitRate: number;
}

// Cache configuration types
export interface CacheConfig {
  enabled: boolean;
  pixelRatio: number;
  scaleX?: number;
  scaleY?: number;
  offset?: Coordinates;
  width?: number;
  height?: number;
}

export interface CacheEntry<T = CanvasElement | ViewportState | CanvasElementsState> {
  data: T;
  timestamp: number;
  expiresAt: number;
  memorySize: number;
  accessCount: number;
  lastAccessed: number;
}

// Tool types
export type CanvasTool = 
  | 'select'
  | 'pan'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'connector'
  | 'connector-line'
  | 'connector-arrow'
  | 'pen'
  | 'triangle'
  | 'sticky-note'
  | 'image'
  | 'table'
  | 'section';

// Selection types
export interface SelectionState {
  selectedIds: Set<ElementId>;
  hoveredId: ElementId | null;
  selectionBounds: BoundingBox | null;
  isMultiSelecting: boolean;
}

// State snapshot for history operations
export interface StateSnapshot {
  elements: Map<ElementId | SectionId, CanvasElement>;
  viewport: ViewportState;
  selection: Set<ElementId>;
  metadata?: Record<string, unknown>;
}

// History types for undo/redo
export interface HistoryEntry {
  id: string;
  timestamp: number;
  operation: string;
  beforeState: StateSnapshot;
  afterState: StateSnapshot;
  elementIds: ElementId[];
}

// Spatial index types for performance
export interface SpatialIndexNode {
  bounds: BoundingBox;
  elementIds: ElementId[];
  children?: SpatialIndexNode[];
}

export interface QuadtreeConfig {
  maxDepth: number;
  maxElementsPerNode: number;
  minNodeSize: number;
}

// Snapping system types
export interface SnapLine {
  points: number[];
  stroke: string;
}

// Missing type definitions that are imported elsewhere
export interface TableSelection {
  tableId: ElementId;
  cellRow: number;
  cellCol: number;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export interface CanvasHistoryState {
  history: HistoryEntry[];
  currentIndex: number;
  maxSize: number;
}

export interface CanvasUIState {
  selectedTool: string;
  showGrid: boolean;
  snapToGrid: boolean;
  isDrawing: boolean;
}

// Modal data types
export interface TableModalData {
  rows: number;
  columns: number;
  position: { x: number; y: number };
}

export interface ImageModalData {
  file: File;
  position: { x: number; y: number };
}

export interface TextModalData {
  content: string;
  position: { x: number; y: number };
}

export type ModalData = TableModalData | ImageModalData | TextModalData | Record<string, unknown>;

export interface ModalState {
  isOpen: boolean;
  type: 'table' | 'image' | 'text' | 'settings' | 'export' | string;
  data?: ModalData;
}

export interface TooltipState {
  isVisible: boolean;
  content: string;
  position: { x: number; y: number };
}

export interface CanvasElementsState {
  elements: Map<string, CanvasElement>;
  elementOrder: string[];
}

export interface TextEditingState {
  elementId: ElementId | null;
  isEditing: boolean;
  cursorPosition: number;
}

export interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

// Canvas metadata types
export interface CanvasMetadata {
  version: string;
  creator: string;
  description?: string;
  tags?: string[];
  customProperties?: Record<string, string | number | boolean>;
  lastModified?: number;
  createdAt?: number;
}

export interface Canvas {
  id: string;
  name: string;
  elements: CanvasElement[];
  sections: SectionElement[];
  viewport: ViewportState;
  metadata?: CanvasMetadata;
}
