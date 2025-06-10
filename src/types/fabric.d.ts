/**
 * Enhanced Fabric.js Type Definitions
 * Provides better type safety for the canvas implementation
 */

import { Canvas, Object as FabricObject, IText, Rect, Circle, Line, Path, Triangle, Polygon, Image as FabricImage } from 'fabric';

declare module 'fabric' {
  interface Object {
    customId?: string;
  }
  
  interface Canvas {
    isDisposed?: boolean;
  }
  
  interface IObjectOptions {
    customId?: string;
  }

  interface ITextOptions {
    customId?: string;
  }
}

// Re-export types for consistency
export type FabricCanvas = Canvas;
export type FabricObjectType = FabricObject;
export type FabricIText = IText;
export type FabricRect = Rect;
export type FabricCircle = Circle;
export type FabricLine = Line;
export type FabricPath = Path;
export type FabricTriangle = Triangle;
export type FabricPolygon = Polygon;
export type FabricImageType = FabricImage;
