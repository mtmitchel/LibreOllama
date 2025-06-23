/**
 * Quadtree Spatial Indexing for Efficient Viewport Culling
 * Part of LibreOllama Canvas Performance Optimization - Phase 5B
 * 
 * This implementation provides O(log n) spatial queries for elements,
 * dramatically improving performance when dealing with large canvases.
 */

import type { CanvasElement, ElementId, SectionId, BoundingBox, ViewportBounds, QuadtreeConfig } from '../../types/enhanced.types';
import { isCircleElement, isRectangularElement } from '../../types/enhanced.types';

/**
 * Get bounding box for any canvas element
 */
function getElementBounds(element: CanvasElement): BoundingBox {
  if (isCircleElement(element)) {
    return {
      x: element.x - element.radius,
      y: element.y - element.radius,
      width: element.radius * 2,
      height: element.radius * 2
    };
  } else if (isRectangularElement(element)) {
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    };
  } else if (element.type === 'star') {
    // For star elements, use outerRadius
    const radius = element.outerRadius || 50;
    return {
      x: element.x - radius,
      y: element.y - radius,
      width: radius * 2,
      height: radius * 2
    };
  } else if (element.type === 'pen' || element.type === 'connector') {
    // For pen/connector elements, calculate bounds from points
    if (element.points && element.points.length >= 2) {
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      for (let i = 0; i < element.points.length; i += 2) {
        const x = element.x + (element.points[i] || 0);
        const y = element.y + (element.points[i + 1] || 0);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
  } else if (element.type === 'triangle' && element.points) {
    // For triangle elements, calculate bounds from points
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (let i = 0; i < element.points.length; i += 2) {
      const x = element.x + (element.points[i] || 0);
      const y = element.y + (element.points[i + 1] || 0);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  
  // Default bounds for unknown element types
  return {
    x: element.x,
    y: element.y,
    width: 100,
    height: 100
  };
}

/**
 * Check if two bounding boxes intersect
 */
function boundsIntersect(a: BoundingBox, b: BoundingBox | ViewportBounds): boolean {
  // Convert ViewportBounds to BoundingBox format if needed
  const bBox: BoundingBox = 'left' in b ? {
    x: b.left,
    y: b.top,
    width: b.right - b.left,
    height: b.bottom - b.top
  } : b;
  
  return !(
    a.x > bBox.x + bBox.width ||
    a.x + a.width < bBox.x ||
    a.y > bBox.y + bBox.height ||
    a.y + a.height < bBox.y
  );
}

/**
 * Check if bounds completely contains another bounds
 */
function boundsContains(container: BoundingBox, contained: BoundingBox): boolean {
  return (
    contained.x >= container.x &&
    contained.y >= container.y &&
    contained.x + contained.width <= container.x + container.width &&
    contained.y + contained.height <= container.y + container.height
  );
}

/**
 * Quadtree node class
 */
class QuadtreeNode {
  bounds: BoundingBox;
  elementIds: (ElementId | SectionId)[] = [];
  children?: QuadtreeNode[];
  
  constructor(bounds: BoundingBox) {
    this.bounds = bounds;
  }
  
  /**
   * Check if this node is a leaf (has no children)
   */
  isLeaf(): boolean {
    return !this.children;
  }
  
  /**
   * Subdivide this node into 4 quadrants
   */
  subdivide(): void {
    const { x, y, width, height } = this.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    this.children = [
      // Top-left
      new QuadtreeNode({ x, y, width: halfWidth, height: halfHeight }),
      // Top-right
      new QuadtreeNode({ x: x + halfWidth, y, width: halfWidth, height: halfHeight }),
      // Bottom-left
      new QuadtreeNode({ x, y: y + halfHeight, width: halfWidth, height: halfHeight }),
      // Bottom-right
      new QuadtreeNode({ x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight })
    ];
  }
}

/**
 * Quadtree spatial index for efficient element queries
 */
export class Quadtree {
  private root: QuadtreeNode;
  private config: QuadtreeConfig;
  private elementBounds: Map<ElementId | SectionId, BoundingBox> = new Map();
  
  constructor(bounds: BoundingBox, config?: Partial<QuadtreeConfig>) {
    this.root = new QuadtreeNode(bounds);
    this.config = {
      maxDepth: config?.maxDepth ?? 8,
      maxElementsPerNode: config?.maxElementsPerNode ?? 10,
      minNodeSize: config?.minNodeSize ?? 50
    };
  }
  
  /**
   * Clear all elements from the quadtree
   */
  clear(): void {
    this.root = new QuadtreeNode(this.root.bounds);
    this.elementBounds.clear();
  }
  
  /**
   * Insert an element into the quadtree
   */
  insert(element: CanvasElement): void {
    const bounds = getElementBounds(element);
    this.elementBounds.set(element.id, bounds);
    this.insertIntoNode(this.root, element.id, bounds, 0);
  }
  
  /**
   * Remove an element from the quadtree
   */
  remove(elementId: ElementId): void {
    const bounds = this.elementBounds.get(elementId);
    if (!bounds) return;
    
    this.removeFromNode(this.root, elementId, bounds);
    this.elementBounds.delete(elementId);
  }
  
  /**
   * Update an element's position in the quadtree
   */
  update(element: CanvasElement): void {
    this.remove(element.id as ElementId);
    this.insert(element);
  }
  
  /**
   * Query elements within a viewport bounds
   */
  query(viewport: ViewportBounds): (ElementId | SectionId)[] {
    const viewportBox: BoundingBox = {
      x: viewport.left,
      y: viewport.top,
      width: viewport.right - viewport.left,
      height: viewport.bottom - viewport.top
    };
    
    const results: ElementId[] = [];
    this.queryNode(this.root, viewportBox, results);
    
    // Remove duplicates (element might be in multiple nodes)
    return [...new Set(results)];
  }
  
  /**
   * Get statistics about the quadtree
   */
  getStats(): { nodes: number; depth: number; elements: number } {
    let nodes = 0;
    let maxDepth = 0;
    
    const traverse = (node: QuadtreeNode, depth: number) => {
      nodes++;
      maxDepth = Math.max(maxDepth, depth);
      
      if (node.children) {
        node.children.forEach(child => traverse(child, depth + 1));
      }
    };
    
    traverse(this.root, 0);
    
    return {
      nodes,
      depth: maxDepth,
      elements: this.elementBounds.size
    };
  }
  
  /**
   * Insert element into a specific node
   */
  private insertIntoNode(node: QuadtreeNode, elementId: ElementId | SectionId, bounds: BoundingBox, depth: number): void {
    // If node doesn't intersect with element bounds, skip
    if (!boundsIntersect(node.bounds, bounds)) {
      return;
    }
    
    // If this is a leaf node
    if (node.isLeaf()) {
      node.elementIds.push(elementId);
      
      // Check if we should subdivide
      if (
        node.elementIds.length > this.config.maxElementsPerNode &&
        depth < this.config.maxDepth &&
        node.bounds.width > this.config.minNodeSize &&
        node.bounds.height > this.config.minNodeSize
      ) {
        node.subdivide();
        
        // Redistribute existing elements
        const existingIds = [...node.elementIds];
        node.elementIds = [];
        
        existingIds.forEach(id => {
          const elemBounds = this.elementBounds.get(id);
          if (elemBounds) {
            this.insertIntoNode(node, id, elemBounds, depth);
          }
        });
      }
    } else {
      // If element spans multiple children or is too large, store in parent
      let fitsInChild = false;
      
      node.children!.forEach(child => {
        if (boundsContains(child.bounds, bounds)) {
          this.insertIntoNode(child, elementId, bounds, depth + 1);
          fitsInChild = true;
        }
      });
      
      // If element doesn't fit entirely in any child, store in parent
      if (!fitsInChild) {
        node.elementIds.push(elementId);
      }
    }
  }
  
  /**
   * Remove element from a specific node
   */
  private removeFromNode(node: QuadtreeNode, elementId: ElementId, bounds: BoundingBox): void {
    // Remove from current node
    const index = node.elementIds.indexOf(elementId);
    if (index !== -1) {
      node.elementIds.splice(index, 1);
    }
    
    // Remove from children if they exist
    if (node.children) {
      node.children.forEach(child => {
        if (boundsIntersect(child.bounds, bounds)) {
          this.removeFromNode(child, elementId, bounds);
        }
      });
    }
  }
  
  /**
   * Query elements from a specific node
   */
  private queryNode(node: QuadtreeNode, viewport: BoundingBox, results: (ElementId | SectionId)[]): void {
    // If node doesn't intersect viewport, skip
    if (!boundsIntersect(node.bounds, viewport)) {
      return;
    }
    
    // Add all elements in this node that intersect the viewport
    node.elementIds.forEach(id => {
      const bounds = this.elementBounds.get(id);
      if (bounds && boundsIntersect(bounds, viewport)) {
        results.push(id);
      }
    });
    
    // Query children
    if (node.children) {
      node.children.forEach(child => {
        this.queryNode(child, viewport, results);
      });
    }
  }
}

/**
 * Create a quadtree for the entire canvas
 */
export function createCanvasQuadtree(canvasBounds: BoundingBox, config?: Partial<QuadtreeConfig>): Quadtree {
  return new Quadtree(canvasBounds, config);
}

/**
 * Batch insert elements into quadtree
 */
export function batchInsertElements(quadtree: Quadtree, elements: CanvasElement[]): void {
  elements.forEach(element => {
    quadtree.insert(element);
  });
}

/**
 * Get visible elements using quadtree
 */
export function getVisibleElements(
  quadtree: Quadtree,
  viewport: ViewportBounds,
  allElements: Map<ElementId, CanvasElement>
): CanvasElement[] {
  const visibleIds = quadtree.query(viewport);
  const visibleElements: CanvasElement[] = [];
  
  visibleIds.forEach(id => {
    const element = allElements.get(id as ElementId);
    if (element && !element.isHidden) {
      visibleElements.push(element);
    }
  });
  
  return visibleElements;
}
