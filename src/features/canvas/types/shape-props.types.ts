// src/features/canvas/types/shape-props.types.ts
/**
 * Shared TypeScript interfaces for shape component props
 * Replaces 'any' types with proper type safety
 */

import { ElementId, CanvasElement } from './enhanced.types';

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
  
  // Event handlers
  onClick?: (event: any) => void;
  onMouseDown?: (event: any) => void;
  onMouseUp?: (event: any) => void;
  onMouseMove?: (event: any) => void;
  onMouseEnter?: (event: any) => void;
  onMouseLeave?: (event: any) => void;
  onDragStart?: (event: any) => void;
  onDragMove?: (event: any) => void;
  onDragEnd?: (event: any) => void;
  onTransform?: (event: any) => void;
  onTransformEnd?: (event: any) => void;
  
  // Performance optimizations
  perfectDrawEnabled?: boolean;
  shadowForStrokeEnabled?: boolean;
  hitStrokeWidth?: number;
  globalCompositeOperation?: string;
  opacity?: number;
  
  // Visual effects
  filters?: any[];
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
  nodeRef?: React.MutableRefObject<any>;
}

/**
 * Enhanced interaction handlers for shape components
 */
export interface ShapeInteractionHandlers {
  onHover?: (elementId: ElementId, isHovering: boolean) => void;
  onFocus?: (elementId: ElementId) => void;
  onBlur?: (elementId: ElementId) => void;
  onContextMenu?: (elementId: ElementId, event: any) => void;
  onKeyDown?: (elementId: ElementId, event: any) => void;
  onKeyUp?: (elementId: ElementId, event: any) => void;
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
  // Additional shape-specific customization
  customProps?: Record<string, any>;
}