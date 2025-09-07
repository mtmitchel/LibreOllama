/**
 * Type definitions for the renderer modules
 * Uses branded types and discriminated unions for type safety
 */

import type Konva from 'konva';

// Branded ID types for type safety
export type ElementId = string & { __brand: 'ElementId' };
export type LayerId = string & { __brand: 'LayerId' };
export type NodeId = string & { __brand: 'NodeId' };
export type GroupId = string & { __brand: 'GroupId' };

// Helper functions to create branded IDs
export const ElementId = (id: string): ElementId => id as ElementId;
export const LayerId = (id: string): LayerId => id as LayerId;
export const NodeId = (id: string): NodeId => id as NodeId;
export const GroupId = (id: string): GroupId => id as GroupId;

// Layer names
export type LayerName = 'background' | 'main' | 'preview' | 'overlay';

// Base element properties
interface BaseElement {
  id: ElementId;
  x: number;
  y: number;
  visible?: boolean;
  opacity?: number;
  rotation?: number;
  locked?: boolean;
  selected?: boolean;
}

// Circle element
export interface CircleElement extends BaseElement {
  type: 'circle';
  radius: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  padding?: number;
}

// Rectangle element
export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

// Text element
export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fill?: string;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

// Triangle element
export interface TriangleElement extends BaseElement {
  type: 'triangle';
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

// Image element
export interface ImageElement extends BaseElement {
  type: 'image';
  width: number;
  height: number;
  src: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

// Sticky note element
export interface StickyNoteElement extends BaseElement {
  type: 'sticky-note';
  width: number;
  height: number;
  text?: string;
  fill?: string;
  fontSize?: number;
  fontFamily?: string;
}

// Table element
export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  cells?: Record<string, string>; // "row,col" -> text
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

// Connector element
export interface ConnectorElement extends BaseElement {
  type: 'connector';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startElement?: ElementId;
  endElement?: ElementId;
  startPort?: string;
  endPort?: string;
  stroke?: string;
  strokeWidth?: number;
  arrowEnd?: boolean;
  arrowStart?: boolean;
  points?: number[];
}

// Discriminated union of all element types
export type CanvasElement = 
  | CircleElement
  | RectangleElement
  | TextElement
  | TriangleElement
  | ImageElement
  | StickyNoteElement
  | TableElement
  | ConnectorElement;

// Element type guard functions
export const isCircleElement = (el: CanvasElement): el is CircleElement => 
  el.type === 'circle';

export const isRectangleElement = (el: CanvasElement): el is RectangleElement => 
  el.type === 'rectangle';

export const isTextElement = (el: CanvasElement): el is TextElement => 
  el.type === 'text';

export const isTriangleElement = (el: CanvasElement): el is TriangleElement => 
  el.type === 'triangle';

export const isImageElement = (el: CanvasElement): el is ImageElement => 
  el.type === 'image';

export const isStickyNoteElement = (el: CanvasElement): el is StickyNoteElement => 
  el.type === 'sticky-note';

export const isTableElement = (el: CanvasElement): el is TableElement => 
  el.type === 'table';

export const isConnectorElement = (el: CanvasElement): el is ConnectorElement => 
  el.type === 'connector';

// Renderer configuration
export interface RendererConfig {
  autoFitDuringTyping?: boolean;
  editorClipEnabled?: boolean;
  enableAccessibility?: boolean;
  enablePerformanceMonitoring?: boolean;
  maxFps?: number;
  minHitAreaSize?: number;
}

// Renderer layers interface
export interface RendererLayers {
  background: Konva.Layer;
  main: Konva.Layer;
  preview: Konva.Layer;
  overlay: Konva.Layer;
}

// Store adapter interface
export interface StoreAdapter {
  get(id: ElementId): CanvasElement | undefined;
  getAll(): CanvasElement[];
  update(id: ElementId, updates: Partial<CanvasElement>): void;
  batchUpdate(updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }>): void;
  subscribe(selector: (state: any) => any, callback: (value: any) => void): () => void;
  getSelectedIds(): ElementId[];
  setSelectedIds(ids: ElementId[]): void;
}

// Transform event data
export interface TransformEvent {
  elementId: ElementId;
  oldAttrs: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  };
  newAttrs: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  };
}

// Editor state
export interface EditorState {
  elementId: ElementId | null;
  isActive: boolean;
  text: string;
  cursorPosition?: number;
  selectionStart?: number;
  selectionEnd?: number;
}

// Animation/tween configuration
export interface TweenConfig {
  duration?: number;
  easing?: (t: number) => number;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
}

// Performance metrics
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  nodeCount: number;
  visibleNodeCount: number;
  drawCalls: number;
}