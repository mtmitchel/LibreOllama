/**
 * Strongly typed event definitions for canvas interactions
 * Replaces problematic 'any' usage in event handlers
 */

import Konva from 'konva';

// Konva event type definitions
export type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;
export type KonvaPointerEvent = Konva.KonvaEventObject<PointerEvent>;
export type KonvaDragEvent = Konva.KonvaEventObject<DragEvent>;
export type KonvaWheelEvent = Konva.KonvaEventObject<WheelEvent>;
export type KonvaTouchEvent = Konva.KonvaEventObject<TouchEvent>;
export type KonvaKeyboardEvent = Konva.KonvaEventObject<KeyboardEvent>;

// Generic Konva event
export type KonvaEvent<T = Event> = Konva.KonvaEventObject<T>;

// Position type for consistent coordinate handling
export interface Position {
  x: number;
  y: number;
}

// Canvas-specific event handlers
export interface CanvasEventHandlers {
  onMouseDown?: (e: KonvaMouseEvent, pos: Position | null) => void;
  onMouseMove?: (e: KonvaMouseEvent, pos: Position | null) => void;
  onMouseUp?: (e: KonvaMouseEvent, pos: Position | null) => void;
  onMouseLeave?: (e: KonvaMouseEvent) => void;
  onMouseEnter?: (e: KonvaMouseEvent) => void;
  
  onPointerDown?: (e: KonvaPointerEvent, pos: Position | null) => void;
  onPointerMove?: (e: KonvaPointerEvent, pos: Position | null) => void;
  onPointerUp?: (e: KonvaPointerEvent, pos: Position | null) => void;
  
  onDragStart?: (e: KonvaDragEvent) => void;
  onDragMove?: (e: KonvaDragEvent) => void;
  onDragEnd?: (e: KonvaDragEvent) => void;
  
  onWheel?: (e: KonvaWheelEvent) => void;
  onContextMenu?: (e: KonvaMouseEvent) => void;
  
  onTouchStart?: (e: KonvaTouchEvent) => void;
  onTouchMove?: (e: KonvaTouchEvent) => void;
  onTouchEnd?: (e: KonvaTouchEvent) => void;
  
  onKeyDown?: (e: KonvaKeyboardEvent) => void;
  onKeyUp?: (e: KonvaKeyboardEvent) => void;
}

// Tool-specific event handler props
export interface ToolEventHandlerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  selectedTool: string;
  isDrawing?: boolean;
  onStartDrawing?: (pos: Position) => void;
  onUpdateDrawing?: (pos: Position) => void;
  onFinishDrawing?: () => void;
}

// Shape event handler props
export interface ShapeEventHandlerProps {
  elementId: string;
  onSelect?: (multiSelect: boolean) => void;
  onDragStart?: (e: KonvaDragEvent) => void;
  onDragEnd?: (e: KonvaDragEvent, newPosition: Position) => void;
  onTransformStart?: () => void;
  onTransformEnd?: (newAttrs: ShapeTransformAttrs) => void;
  onDoubleClick?: () => void;
  onContextMenu?: (e: KonvaMouseEvent) => void;
}

// Transform attributes
export interface ShapeTransformAttrs {
  x: number;
  y: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  radius?: number; // For circles
}

// Event payload types for custom events
export interface CanvasCustomEventPayloads {
  'element:created': { elementId: string; type: string; position: Position };
  'element:updated': { elementId: string; changes: Partial<ShapeTransformAttrs> };
  'element:deleted': { elementId: string };
  'selection:changed': { selectedIds: string[] };
  'tool:changed': { previousTool: string; newTool: string };
  'viewport:changed': { viewport: ViewportState };
  'canvas:saved': { timestamp: number };
  'canvas:loaded': { elementCount: number };
}

// Viewport state for events
export interface ViewportState {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

// Type guard helpers
export function isKonvaMouseEvent(e: unknown): e is KonvaMouseEvent {
  return typeof e === 'object' && e !== null && 'evt' in e && (e as any).evt instanceof MouseEvent;
}

export function isKonvaPointerEvent(e: unknown): e is KonvaPointerEvent {
  return typeof e === 'object' && e !== null && 'evt' in e && (e as any).evt instanceof PointerEvent;
}

export function isPosition(value: unknown): value is Position {
  return (
    typeof value === 'object' &&
    value !== null &&
    'x' in value &&
    'y' in value &&
    typeof (value as any).x === 'number' &&
    typeof (value as any).y === 'number'
  );
}

// Event handler type helpers
export type EventHandler<T extends Event = Event> = (e: KonvaEvent<T>) => void;
export type PositionEventHandler<T extends Event = Event> = (e: KonvaEvent<T>, pos: Position | null) => void;

// Debounced/Throttled event handler types
export type DebouncedEventHandler<T extends Event = Event> = EventHandler<T> & {
  cancel?: () => void;
  flush?: () => void;
};

export type ThrottledEventHandler<T extends Event = Event> = EventHandler<T> & {
  cancel?: () => void;
  flush?: () => void;
};