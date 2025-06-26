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

// Helper functions to create branded types safely
export const ElementId = (id: string): ElementId => id as ElementId;
export const SectionId = (id: string): SectionId => id as SectionId;
export const LayerId = (id: string): LayerId => id as LayerId;
export const ConnectorId = (id: string): ConnectorId => id as ConnectorId;
export const GroupId = (id: string): GroupId => id as GroupId;

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
  groupId?: ElementId | null;
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
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  radius: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
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

export interface EnhancedTableData {
  rows: Array<{ height?: number; id?: string }>;
  columns: Array<{ width?: number; id?: string }>;
  cells: TableCell[][];
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
  richTextSegments?: RichTextSegment[];
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
  points: number[];
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface StarElement extends BaseElement {
  type: 'star';
  innerRadius: number;
  outerRadius: number;
  numPoints: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
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
  | StarElement
  | RichTextElement
  | GroupElement;

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

export function isStarElement(el: CanvasElement): el is StarElement {
  return el.type === 'star';
}

export function isRichTextElement(el: CanvasElement): el is RichTextElement {
  return el.type === 'rich-text';
}

export function isGroupElement(el: CanvasElement): el is GroupElement {
  return el.type === 'group';
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

export interface CacheEntry<T = any> {
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
  | 'star'
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

// History types for undo/redo
export interface HistoryEntry {
  id: string;
  timestamp: number;
  operation: string;
  beforeState: any;
  afterState: any;
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
