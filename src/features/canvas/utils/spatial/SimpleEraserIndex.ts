/**
 * SimpleEraserIndex - MVP version of spatial indexing for eraser
 * Uses simple bounding box intersection without complex quadtree for maintainability
 */

import { CanvasElement, ElementId, SectionId } from '../../types/enhanced.types';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class SimpleEraserIndex {
  private elements: Map<ElementId | SectionId, BoundingBox> = new Map();

  /**
   * Add element to spatial index
   */
  insert(element: CanvasElement): void {
    const bounds = this.getElementBounds(element);
    this.elements.set(element.id, bounds);
  }

  /**
   * Remove element from spatial index
   */
  remove(elementId: ElementId | SectionId): void {
    this.elements.delete(elementId);
  }

  /**
   * Find elements that intersect with the given bounds
   */
  findIntersections(bounds: BoundingBox): (ElementId | SectionId)[] {
    const intersections: (ElementId | SectionId)[] = [];

    for (const [elementId, elementBounds] of this.elements) {
      if (this.boundsIntersect(elementBounds, bounds)) {
        intersections.push(elementId);
      }
    }

    return intersections;
  }

  /**
   * Find elements that intersect with an eraser path
   */
  findPathIntersections(eraserPath: number[], eraserSize: number): (ElementId | SectionId)[] {
    if (eraserPath.length < 2) return [];
    
    const pathBounds = this.getPathBounds(eraserPath, eraserSize);
    return this.findIntersections(pathBounds);
  }

  /**
   * Clear all elements from index
   */
  clear(): void {
    this.elements.clear();
  }

  /**
   * Get current size of index
   */
  size(): number {
    return this.elements.size;
  }

  /**
   * Update element bounds in index
   */
  update(element: CanvasElement): void {
    this.insert(element); // Simply overwrite existing entry
  }

  /**
   * Rebuild entire index from elements array
   */
  rebuild(elements: CanvasElement[]): void {
    this.clear();
    elements.forEach(element => this.insert(element));
  }

  // Private helper methods

  private getElementBounds(element: CanvasElement): BoundingBox {
    const x = element.x || 0;
    const y = element.y || 0;
    
    // Handle stroke elements (pen, marker, highlighter) with points array
    if (element.type === 'pen' || element.type === 'marker' || element.type === 'highlighter') {
      const points = (element as any).points;
      if (points && Array.isArray(points) && points.length >= 4) {
        let minX = points[0];
        let minY = points[1];
        let maxX = points[0];
        let maxY = points[1];
        
        for (let i = 2; i < points.length; i += 2) {
          minX = Math.min(minX, points[i]);
          maxX = Math.max(maxX, points[i]);
          minY = Math.min(minY, points[i + 1]);
          maxY = Math.max(maxY, points[i + 1]);
        }
        
        // Add small padding for stroke width
        const padding = 5;
        return {
          x: minX - padding,
          y: minY - padding,
          width: (maxX - minX) + (padding * 2),
          height: (maxY - minY) + (padding * 2)
        };
      }
    }
    
    // Handle different element types
    if (element.type === 'circle') {
      const radius = (element as any).radius || 0;
      return {
        x: x - radius,
        y: y - radius,
        width: radius * 2,
        height: radius * 2
      };
    }
    
    // Default to width/height properties
    return {
      x,
      y,
      width: (element as any).width || 0,
      height: (element as any).height || 0
    };
  }

  private getPathBounds(path: number[], eraserSize: number): BoundingBox {
    if (path.length < 2) return { x: 0, y: 0, width: 0, height: 0 };
    
    let minX = path[0];
    let minY = path[1];
    let maxX = path[0];
    let maxY = path[1];
    
    for (let i = 2; i < path.length; i += 2) {
      minX = Math.min(minX, path[i]);
      maxX = Math.max(maxX, path[i]);
      minY = Math.min(minY, path[i + 1]);
      maxY = Math.max(maxY, path[i + 1]);
    }
    
    // Expand bounds by eraser size
    const halfSize = eraserSize / 2;
    return {
      x: minX - halfSize,
      y: minY - halfSize,
      width: (maxX - minX) + eraserSize,
      height: (maxY - minY) + eraserSize
    };
  }

  private boundsIntersect(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.x > b.x + b.width ||
      a.x + a.width < b.x ||
      a.y > b.y + b.height ||
      a.y + a.height < b.y
    );
  }
}
