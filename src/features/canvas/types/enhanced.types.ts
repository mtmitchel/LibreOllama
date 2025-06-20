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

export type ElementId = Brand<string, 'ElementId'>;
export type SectionId = Brand<string, 'SectionId'>;
export type LayerId = Brand<string, 'LayerId'>;
export type ConnectorId = Brand<string, 'ConnectorId'>;

// Helper functions to create branded types safely
export const ElementId = (id: string): ElementId => id as ElementId;
export const SectionId = (id: string): SectionId => id as SectionId;
export const LayerId = (id: string): LayerId => id as LayerId;
export const ConnectorId = (id: string): ConnectorId => id as ConnectorId;

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
}

export interface ConnectorElement extends BaseElement {
  type: 'connector';
  subType: 'straight' | 'bent' | 'curved';
  startElementId?: ElementId;
  endElementId?: ElementId;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  intermediatePoints: { x: number; y: number }[];
  stroke?: string;
  strokeWidth?: number;
  pathPoints?: number[];
}

export interface ImageElement extends BaseElement {
  type: 'image';
  imageUrl: string;
  width: number;
  height: number;
  opacity?: number;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  cols: number;
  width: number;
  height: number;
  tableData?: string[][];
  cellPadding?: number;
  borderWidth?: number;
  borderColor?: string;
}

export interface StickyNoteElement extends BaseElement {
  type: 'sticky-note';
  text: string;
  width: number;
  height: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

export interface PenElement extends BaseElement {
  type: 'pen';
  points: number[];
  stroke?: string;
  strokeWidth?: number;
  tension?: number;
}

export interface TriangleElement extends BaseElement {
  type: 'triangle';
  points: number[];
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
  | StarElement;

// Type Predicates provide safe type narrowing within the code.
// No more `(element as RectangleElement).width`.
export function isTextElement(el: CanvasElement): el is TextElement {
  return el.type === 'text';
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
  | 'pen'
  | 'star'
  | 'triangle'
  | 'sticky-note'
  | 'image'
  | 'table'
  | 'section'
  | 'connector';

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
