import { BaseElement } from '.';
import type Konva from 'konva';

// Enhanced Konva types for exactOptionalPropertyTypes compliance
export interface KonvaNodeProps {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
  offsetX?: number;
  offsetY?: number;
  draggable?: boolean;
  listening?: boolean;
  visible?: boolean;
  opacity?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  shadowOpacity?: number;
  perfectDrawEnabled?: boolean;
}

// Konva event types with proper typing
export interface KonvaEventObject<T = Event> {
  type: string;
  target: Konva.Node;
  evt: T;
  currentTarget: Konva.Node;
  cancelBubble: boolean;
}

// Enhanced KonvaNode type
export type KonvaNode = BaseElement & KonvaNodeProps;

// Konva component prop types for strict typing
export interface KonvaRectProps extends KonvaNodeProps {
  cornerRadius?: number;
}

export interface KonvaCircleProps extends KonvaNodeProps {
  radius: number;
}

export interface KonvaTextProps extends KonvaNodeProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  textDecoration?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  padding?: number;
  lineHeight?: number;
  letterSpacing?: number;
  wrap?: 'word' | 'char' | 'none';
  ellipsis?: boolean;
}

export interface KonvaLineProps extends KonvaNodeProps {
  points: number[];
  tension?: number;
  closed?: boolean;
  bezier?: boolean;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  dash?: number[];
  dashOffset?: number;
}

export interface KonvaStarProps extends KonvaNodeProps {
  numPoints: number;
  innerRadius: number;
  outerRadius: number;
}

export interface KonvaArrowProps extends KonvaLineProps {
  pointerLength?: number;
  pointerWidth?: number;
  pointerAtBeginning?: boolean;
  pointerAtEnding?: boolean;
}
