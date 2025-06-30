/**
 * Drawing Types for FigJam-Style Canvas Tools
 * Comprehensive type definitions for advanced drawing functionality
 */

import { ElementId, GroupId, BaseElement, BoundingBox } from './enhanced.types';

// Core stroke types
export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number; // 0-1, for pressure-sensitive input
  timestamp: number;
  velocity?: number; // Calculated velocity for dynamic width
}

export interface StrokeStyle {
  color: string;
  width: number;
  opacity: number;
  blendMode?: GlobalCompositeOperation;
  smoothness: number; // 0-1, affects curve tension
  lineCap: 'round' | 'square' | 'butt';
  lineJoin: 'round' | 'bevel' | 'miter';
}

// Re-export the enhanced types from enhanced.types.ts
export type { MarkerElement, HighlighterElement, WashiTapeElement } from './enhanced.types';
// Re-export type guards too
export { isMarkerElement, isHighlighterElement, isWashiTapeElement } from './enhanced.types';

// Washi tape patterns
export type WashiPattern = 
  | { type: 'dots'; spacing: number; radius: number }
  | { type: 'stripes'; angle: number; width: number; spacing: number }
  | { type: 'zigzag'; amplitude: number; frequency: number }
  | { type: 'floral'; scale: number; density: number; variant: 'cherry' | 'sakura' | 'leaves' }
  | { type: 'geometric'; shape: 'triangles' | 'hexagons' | 'diamonds'; size: number }
  | { type: 'texture'; name: 'paper' | 'fabric' | 'glitter'; intensity: number };

// Stroke grouping
export interface StrokeGroup {
  id: GroupId;
  strokeIds: ElementId[];
  bounds: BoundingBox;
  transform?: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  };
  style?: {
    locked: boolean;
    hidden: boolean;
    opacity: number;
  };
  metadata?: {
    name?: string;
    tags?: string[];
    createdAt: number;
    updatedAt: number;
  };
}

// Drawing state management
export interface DrawingState {
  isRecording: boolean;
  currentTool: 'marker' | 'highlighter' | 'washi-tape' | 'eraser' | null;
  currentStroke: StrokePoint[];
  previewPoints: number[];
  startTime: number;
  totalDistance: number;
}

// Tool configurations
export interface MarkerConfig {
  color: string;
  minWidth: number;
  maxWidth: number;
  smoothness: number;
  widthVariation: boolean;
  pressureSensitive: boolean;
  opacity: number;
}

export interface HighlighterConfig {
  color: string;
  width: number;
  opacity: number;
  blendMode: 'multiply' | 'overlay' | 'soft-light';
  lockToElements: boolean; // Whether to constrain to element bounds
}

export interface WashiTapeConfig {
  primaryColor: string;
  secondaryColor: string;
  width: number;
  opacity: number;
  pattern: WashiPattern;
  followCursor: boolean; // Whether to orient along drawing direction
}

export interface EraserConfig {
  size: number;
  mode: 'stroke' | 'pixel'; // Per-stroke or pixel-level erasing
  strength: number; // For partial erasing
}

// Stroke editing
export interface StrokeEditingState {
  selectedStrokeIds: Set<ElementId>;
  editingStrokeId: ElementId | null;
  editMode: 'move' | 'reshape' | 'style' | null;
  transformHandles: StrokeHandle[];
  originalPoints?: number[];
}

export interface StrokeHandle {
  id: string;
  x: number;
  y: number;
  type: 'move' | 'reshape' | 'color' | 'width';
  strokeId: ElementId;
  pointIndex?: number; // For reshape handles
}

// Advanced stroke operations
export interface StrokeOperation {
  type: 'smooth' | 'simplify' | 'split' | 'join' | 'reverse';
  targetIds: ElementId[];
  parameters?: {
    smoothingFactor?: number;
    simplificationTolerance?: number;
    splitPoint?: { x: number; y: number };
    joinTolerance?: number;
  };
}

// Stroke analysis
export interface StrokeAnalysis {
  length: number;
  averageWidth: number;
  variance: number;
  complexity: number; // 0-1, based on point density and direction changes
  bounds: BoundingBox;
  dominantDirection: number; // Angle in radians
  speed: {
    average: number;
    maximum: number;
    minimum: number;
    distribution: number[]; // Speed at each point
  };
}

// Performance optimization types
export interface StrokeLOD {
  level: 'high' | 'medium' | 'low' | 'hidden';
  pointReduction: number; // Factor to reduce points by
  styleSimplification: boolean; // Whether to use simplified styling
  useCache: boolean;
}

export interface StrokeCache {
  id: ElementId;
  renderedPath: Path2D;
  bounds: BoundingBox;
  lastUpdate: number;
  lodLevel: string;
  isValid: boolean;
}

// Export/import types
export interface StrokeExportData {
  version: string;
  strokes: (MarkerElement | HighlighterElement | WashiTapeElement)[];
  groups: StrokeGroup[];
  metadata: {
    canvasSize: { width: number; height: number };
    exportDate: number;
    exportBounds: BoundingBox;
  };
}

// Import the specific types and type guards we need
import type { MarkerElement, HighlighterElement, WashiTapeElement } from './enhanced.types';
import { isMarkerElement, isHighlighterElement, isWashiTapeElement } from './enhanced.types';

// Utility type guard that combines the imported ones
export function isStrokeElement(element: any): element is MarkerElement | HighlighterElement | WashiTapeElement {
  return isMarkerElement(element) || isHighlighterElement(element) || isWashiTapeElement(element);
}

// Constants
export const DRAWING_CONSTANTS = {
  MIN_POINT_DISTANCE: 2, // Minimum distance between recorded points
  MAX_SMOOTHING: 0.9,
  MIN_SMOOTHING: 0.1,
  DEFAULT_SMOOTHING: 0.5,
  PRESSURE_CURVE: 2.0, // Exponential curve for pressure mapping
  MAX_STROKE_POINTS: 10000, // Maximum points per stroke
  SIMPLIFICATION_TOLERANCE: 1.5,
  CACHE_TIMEOUT: 30000, // 30 seconds
  PERFORMANCE_POINT_THRESHOLD: 1000, // When to start performance optimizations
} as const;

export const WASHI_PATTERNS = {
  DOTS: { type: 'dots' as const, spacing: 8, radius: 2 },
  THIN_STRIPES: { type: 'stripes' as const, angle: 0, width: 2, spacing: 4 },
  THICK_STRIPES: { type: 'stripes' as const, angle: 45, width: 4, spacing: 8 },
  ZIGZAG: { type: 'zigzag' as const, amplitude: 5, frequency: 0.2 },
  CHERRY_BLOSSOMS: { type: 'floral' as const, scale: 1, density: 0.3, variant: 'cherry' as const },
  TRIANGLES: { type: 'geometric' as const, shape: 'triangles' as const, size: 6 },
  PAPER_TEXTURE: { type: 'texture' as const, name: 'paper' as const, intensity: 0.5 },
} as const; 