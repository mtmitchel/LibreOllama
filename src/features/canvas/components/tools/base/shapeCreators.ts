// src/features/canvas/components/tools/base/shapeCreators.ts
/**
 * Shape creation utilities for BaseShapeTool
 * Provides standardized shape creation functions
 */

import { nanoid } from 'nanoid';
import { 
  CircleElement, 
  RectangleElement, 
  TriangleElement, 
  ElementId 
} from '../../../types/enhanced.types';
import { Vector2d } from './types';

// Default sizes for shapes
const DEFAULT_SIZES = {
  circle: { radius: 50 },
  rectangle: { width: 120, height: 80 },
  triangle: { width: 115, height: 115 } // Increased by 15% for better text visibility
};

// Default styling - grey/black colors
const DEFAULT_STYLES = {
  fill: '#FFFFFF',
  stroke: '#374151', // Dark grey
  strokeWidth: 2,
  opacity: 1
};

export const createCircleElement = (position: Vector2d): CircleElement => ({
  id: nanoid() as ElementId,
  type: 'circle',
  x: position.x,
  y: position.y,
  radius: DEFAULT_SIZES.circle.radius,
  ...DEFAULT_STYLES,
  isLocked: false,
  isHidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now()
});

export const createRectangleElement = (position: Vector2d): RectangleElement => ({
  id: nanoid() as ElementId,
  type: 'rectangle',
  x: position.x,
  y: position.y,
  width: DEFAULT_SIZES.rectangle.width,
  height: DEFAULT_SIZES.rectangle.height,
  cornerRadius: 8,
  ...DEFAULT_STYLES,
  isLocked: false,
  isHidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now()
});

export const createTriangleElement = (position: Vector2d): TriangleElement => {
  const { width, height } = DEFAULT_SIZES.triangle;
  const halfWidth = width / 2;
  
  return {
    id: nanoid() as ElementId,
    type: 'triangle',
    x: position.x,
    y: position.y,
    width,
    height,
    points: [
      halfWidth, 0,           // Top point
      0, height,              // Bottom left
      width, height           // Bottom right
    ],
    ...DEFAULT_STYLES,
    isLocked: false,
    isHidden: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
};
