// Konva-specific type definitions and interfaces
import Konva from 'konva';
import type { CanvasElement } from '../types';

// Base KonvaNode type for compatibility
export type KonvaNode = Konva.Node;

// Konva Node References
export interface KonvaNodeRef {
  current: Konva.Node | null;
}

export interface KonvaStageRef {
  current: Konva.Stage | null;
}

export interface KonvaLayerRef {
  current: Konva.Layer | null;
}

// Konva Event Types
export type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;
export type KonvaTouchEvent = Konva.KonvaEventObject<TouchEvent>;
export type KonvaPointerEvent = Konva.KonvaEventObject<PointerEvent>;
export type KonvaWheelEvent = Konva.KonvaEventObject<WheelEvent>;

// Konva Shape Configuration Interfaces
export interface KonvaShapeConfig {
  id: string;
  x: number;
  y: number;
  draggable?: boolean;
  listening?: boolean;
}

export interface KonvaRectConfig extends Konva.RectConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  draggable?: boolean;
  listening?: boolean;
}

export interface KonvaCircleConfig extends Konva.CircleConfig {
  id: string;
  x: number;
  y: number;
  radius: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  draggable?: boolean;
  listening?: boolean;
}

export interface KonvaTextConfig extends Konva.TextConfig {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fill?: string;
  align?: string;
  verticalAlign?: string;
  draggable?: boolean;
  listening?: boolean;
}

export interface KonvaLineConfig extends Konva.LineConfig {
  id: string;
  x: number;
  y: number;
  points: number[];
  stroke?: string;
  strokeWidth?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  tension?: number;
  draggable?: boolean;
  listening?: boolean;
}

// Transformer and Selection Types
export interface TransformerConfig {
  enabledAnchors: string[];
  rotateEnabled?: boolean;
  borderStroke?: string;
  borderStrokeWidth?: number;
  anchorFill?: string;
  anchorStroke?: string;
  anchorSize?: number;
}

// Canvas Performance Types
export interface CanvasPerformanceConfig {
  enableViewportCulling: boolean;
  enableShapeCaching: boolean;
  enableEventDelegation: boolean;
  maxCacheSize: number;
  cullingMargin: number;
}

// Stage and Layer Configuration
export interface StageConfig extends Konva.StageConfig {
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
  x?: number;
  y?: number;
}

export interface LayerConfig extends Konva.LayerConfig {
  listening?: boolean;
  visible?: boolean;
  opacity?: number;
}

// Canvas Element to Konva Shape Mapping
export interface ElementToShapeMapper {
  createElement: (element: CanvasElement) => Konva.Shape;
  updateShape: (shape: Konva.Shape, element: CanvasElement) => void;
  destroyShape: (shape: Konva.Shape) => void;
}

// Canvas Interaction Types
export interface CanvasInteractionState {
  isDragging: boolean;
  isDrawing: boolean;
  isSelecting: boolean;
  isPanning: boolean;
  isZooming: boolean;
  currentTool: string;
}

// Viewport and Camera Types
export interface ViewportTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

// Animation and Transition Types
export interface AnimationConfig {
  duration: number;
  easing: (t: number) => number;
  onUpdate?: (frame: number) => void;
  onFinish?: () => void;
}

export interface TransitionConfig extends AnimationConfig {
  from: Partial<Konva.NodeConfig>;
  to: Partial<Konva.NodeConfig>;
}
