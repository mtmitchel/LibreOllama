// src/features/canvas/components/tools/base/index.ts
/**
 * Base shape tool components and utilities
 */

export { BaseShapeTool } from './BaseShapeTool';
export { BaseCreationTool } from './BaseCreationTool';
export { CirclePreview, RectanglePreview, TrianglePreview } from './ShapePreviews';
export { 
  createCircleElement, 
  createRectangleElement, 
  createTriangleElement 
} from './shapeCreators';
export type { 
  BaseShapeToolProps, 
  BaseCreationToolProps,
  ShapeToolState, 
  CreationToolState,
  ShapeCreationOptions, 
  Vector2d 
} from './types';
// Archived (2025-09-01)
