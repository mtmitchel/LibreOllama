export interface PanZoom {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Base element interface with section support
export interface BaseElement {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation?: number;
  isLocked?: boolean;
  isHidden?: boolean;
  // NEW: Section membership - tracks which section contains this element
  sectionId?: string | null;
}

// Coordinate system types for the refactoring
export interface Coordinates {
  x: number;
  y: number;
}

export interface ElementPosition {
  // Stored coordinates (relative to parent section or canvas)
  local: Coordinates;
  // Computed absolute coordinates (for hit testing, connectors)
  absolute?: Coordinates;
}

// Helper type for coordinate context
export type CoordinateSpace = 'local' | 'absolute' | 'screen';

// Bounding box for element bounds calculations
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
