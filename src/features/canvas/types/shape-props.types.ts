// src/features/canvas/types/shape-props.types.ts
/**
 * Shared TypeScript interfaces for shape component props
 * Replaces 'any' types with proper type safety
 */

import { ElementId, CanvasElement } from './enhanced.types';
import { 
  KonvaMouseEvent, 
  KonvaPointerEvent, 
  KonvaDragEvent, 
  KonvaKeyboardEvent,
  KonvaEvent
} from './event.types';
import Konva from 'konva';

// Type-safe Konva filter interface
export interface KonvaFilter {
  name: string;
  config?: Record<string, any>;
}

// Type-safe global composite operations
export type GlobalCompositeOperation = 
  | 'source-over'
  | 'source-in'
  | 'source-out'
  | 'source-atop'
  | 'destination-over'
  | 'destination-in'
  | 'destination-out'
  | 'destination-atop'
  | 'lighter'
  | 'copy'
  | 'xor'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

/**
 * Common Konva props passed to all shape components
 * Provides type safety for canvas interactions
 */
export interface KonvaShapeProps {
  // Position and transformation
  x?: number;
  y?: number;
  rotation?: number | undefined;
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
  
  // Interaction properties
  draggable?: boolean;
  listening?: boolean;
  visible?: boolean;
  
  // Element identification
  id?: string;
  name?: string;
  
  // Event handlers with proper Konva types
  onClick?: (event: KonvaMouseEvent) => void;
  onMouseDown?: (event: KonvaMouseEvent) => void;
  onMouseUp?: (event: KonvaMouseEvent) => void;
  onMouseMove?: (event: KonvaMouseEvent) => void;
  onMouseEnter?: (event: KonvaMouseEvent) => void;
  onMouseLeave?: (event: KonvaMouseEvent) => void;
  onDragStart?: (event: KonvaDragEvent) => void;
  onDragMove?: (event: KonvaDragEvent) => void;
  onDragEnd?: (event: KonvaDragEvent) => void;
  onTransform?: (event: KonvaEvent) => void;
  onTransformEnd?: (event: KonvaEvent) => void;
  
  // Performance optimizations
  perfectDrawEnabled?: boolean;
  shadowForStrokeEnabled?: boolean;
  hitStrokeWidth?: number;
  globalCompositeOperation?: GlobalCompositeOperation;
  opacity?: number;
  
  // Visual effects with type safety
  filters?: KonvaFilter[];
  cache?: boolean;
  clearBeforeDraw?: boolean;
}

/**
 * Base interface for all shape component props
 */
export interface BaseShapeProps<T extends CanvasElement> {
  element: T;
  isSelected: boolean;
  isDragging?: boolean;
  konvaProps: KonvaShapeProps;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
  onSelect?: (elementId: ElementId) => void;
  onDragStart?: (elementId: ElementId) => void;
  onDragEnd?: (elementId: ElementId) => void;
  onElementDoubleClick?: (elementId: ElementId) => void;
  stageScale?: number;
  nodeRef?: React.MutableRefObject<Konva.Node | null>;
}

/**
 * Enhanced interaction handlers for shape components
 */
export interface ShapeInteractionHandlers {
  onHover?: (elementId: ElementId, isHovering: boolean) => void;
  onFocus?: (elementId: ElementId) => void;
  onBlur?: (elementId: ElementId) => void;
  onContextMenu?: (elementId: ElementId, event: KonvaMouseEvent) => void;
  onKeyDown?: (elementId: ElementId, event: KonvaKeyboardEvent) => void;
  onKeyUp?: (elementId: ElementId, event: KonvaKeyboardEvent) => void;
}

/**
 * Performance-related props for shape optimization
 */
export interface ShapePerformanceProps {
  enableCaching?: boolean;
  cacheThreshold?: number;
  optimizeForSpeed?: boolean;
  disablePixelRatio?: boolean;
}

/**
 * Complete shape props interface combining all aspects
 */
export interface CompleteShapeProps<T extends CanvasElement> 
  extends BaseShapeProps<T>, 
          Partial<ShapeInteractionHandlers>, 
          Partial<ShapePerformanceProps> {
  // Additional shape-specific customization (use specific types when possible)
  customProps?: Record<string, unknown>;
}