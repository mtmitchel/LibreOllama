// src/features/canvas/components/tools/base/index.ts
/**
 * Base shape tool components and utilities
 */

export { BaseShapeTool } from './BaseShapeTool';
export { CirclePreview, RectanglePreview, TrianglePreview } from './ShapePreviews';
export { 
  createCircleElement, 
  createRectangleElement, 
  createTriangleElement 
} from './shapeCreators';
export type { 
  BaseShapeToolProps, 
  ShapeToolState, 
  ShapeCreationOptions, 
  Vector2d 
} from './types';
