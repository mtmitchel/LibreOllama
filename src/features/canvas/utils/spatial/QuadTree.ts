/**
 * QuadTree implementation for efficient spatial indexing of canvas elements
 * Provides O(log n) spatial queries instead of O(n) linear search
 * Critical for handling 10,000+ elements efficiently
 */

import { CanvasElement, ElementId } from '../../types/enhanced.types';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface QuadTreeNode {
  bounds: BoundingBox;
  elements: Map<ElementId, CanvasElement>;
  children: QuadTreeNode[] | null;
  depth: number;
}

export class QuadTree {
  private root: QuadTreeNode;
  private readonly maxElements: number;
  private readonly maxDepth: number;
  private elementCount: number;

  constructor(bounds: BoundingBox, maxElements = 10, maxDepth = 5) {
    this.root = this.createNode(bounds, 0);
    this.maxElements = maxElements;
    this.maxDepth = maxDepth;
    this.elementCount = 0;
  }

  private createNode(bounds: BoundingBox, depth: number): QuadTreeNode {
    return {
      bounds,
      elements: new Map(),
      children: null,
      depth
    };
  }

  /**
   * Insert an element into the QuadTree
   */
  insert(element: CanvasElement): void {
    const bounds = this.getElementBounds(element);
    this.insertNode(this.root, element, bounds);
    this.elementCount++;
  }

  private insertNode(node: QuadTreeNode, element: CanvasElement, bounds: BoundingBox): void {
    // If node doesn't intersect element bounds, skip
    if (!this.intersects(node.bounds, bounds)) {
      return;
    }

    // If this is a leaf node
    if (node.children === null) {
      // Only insert elements with ElementId (not SectionId)
      if (typeof element.id === 'string' && !element.id.includes('section-')) {
        node.elements.set(element.id as ElementId, element);

        // Split if we exceed capacity and haven't reached max depth
        if (node.elements.size > this.maxElements && node.depth < this.maxDepth) {
          this.split(node);
        }
      }
    } else {
      // Insert into children
      for (const child of node.children) {
        this.insertNode(child, element, bounds);
      }
    }
  }

  /**
   * Split a node into 4 quadrants
   */
  private split(node: QuadTreeNode): void {
    const { x, y, width, height } = node.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const depth = node.depth + 1;

    node.children = [
      // Top-left
      this.createNode({ x, y, width: halfWidth, height: halfHeight }, depth),
      // Top-right
      this.createNode({ x: x + halfWidth, y, width: halfWidth, height: halfHeight }, depth),
      // Bottom-left
      this.createNode({ x, y: y + halfHeight, width: halfWidth, height: halfHeight }, depth),
      // Bottom-right
      this.createNode({ x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight }, depth)
    ];

    // Redistribute elements to children
    const elements = Array.from(node.elements.values());
    node.elements.clear();
    
    for (const element of elements) {
      const elementBounds = this.getElementBounds(element);
      for (const child of node.children) {
        if (this.intersects(child.bounds, elementBounds)) {
          // Only insert elements with ElementId (not SectionId)
          if (typeof element.id === 'string' && !element.id.includes('section-')) {
            child.elements.set(element.id as ElementId, element);
          }
        }
      }
    }
  }

  /**
   * Query elements within a viewport
   * Returns all elements that intersect with the given bounds
   */
  query(viewport: BoundingBox): CanvasElement[] {
    const results: Map<ElementId, CanvasElement> = new Map();
    this.queryNode(this.root, viewport, results);
    return Array.from(results.values());
  }

  private queryNode(node: QuadTreeNode, viewport: BoundingBox, results: Map<ElementId, CanvasElement>): void {
    // Skip if node doesn't intersect viewport
    if (!this.intersects(node.bounds, viewport)) {
      return;
    }

    // If this is a leaf node, check elements
    if (node.children === null) {
      for (const [id, element] of node.elements) {
        const elementBounds = this.getElementBounds(element);
        if (this.intersects(elementBounds, viewport) && !results.has(id)) {
          results.set(id, element);
        }
      }
    } else {
      // Query children
      for (const child of node.children) {
        this.queryNode(child, viewport, results);
      }
    }
  }

  /**
   * Remove an element from the QuadTree
   */
  remove(elementId: ElementId): boolean {
    const removed = this.removeNode(this.root, elementId);
    if (removed) {
      this.elementCount--;
    }
    return removed;
  }

  private removeNode(node: QuadTreeNode, elementId: ElementId): boolean {
    if (node.children === null) {
      return node.elements.delete(elementId);
    }

    let removed = false;
    for (const child of node.children) {
      if (this.removeNode(child, elementId)) {
        removed = true;
        break;
      }
    }

    // Consider merging children if they're sparse
    if (removed) {
      this.tryMerge(node);
    }

    return removed;
  }

  /**
   * Try to merge children back into parent if total elements are below threshold
   */
  private tryMerge(node: QuadTreeNode): void {
    if (node.children === null) return;

    let totalElements = 0;
    for (const child of node.children) {
      if (child.children !== null) return; // Don't merge if children have been split
      totalElements += child.elements.size;
    }

    if (totalElements <= this.maxElements) {
      // Merge all child elements back into this node
      node.elements = new Map();
      for (const child of node.children) {
        for (const [id, element] of child.elements) {
          node.elements.set(id, element);
        }
      }
      node.children = null;
    }
  }

  /**
   * Update an element's position in the QuadTree
   */
  update(element: CanvasElement): void {
    // Remove and re-insert (simple but effective for moderate update rates)
    // Only update elements with ElementId (not SectionId)
    if (typeof element.id === 'string' && !element.id.includes('section-')) {
      this.remove(element.id as ElementId);
      this.insert(element);
    }
  }

  /**
   * Clear all elements from the QuadTree
   */
  clear(): void {
    this.root = this.createNode(this.root.bounds, 0);
    this.elementCount = 0;
  }

  /**
   * Get statistics about the QuadTree
   */
  getStats(): {
    elementCount: number;
    nodeCount: number;
    maxDepth: number;
    averageElementsPerNode: number;
  } {
    const stats = {
      nodeCount: 0,
      maxDepth: 0,
      totalElements: 0
    };

    this.getNodeStats(this.root, stats);

    return {
      elementCount: this.elementCount,
      nodeCount: stats.nodeCount,
      maxDepth: stats.maxDepth,
      averageElementsPerNode: stats.nodeCount > 0 ? stats.totalElements / stats.nodeCount : 0
    };
  }

  private getNodeStats(node: QuadTreeNode, stats: { nodeCount: number; maxDepth: number; totalElements: number }): void {
    stats.nodeCount++;
    stats.maxDepth = Math.max(stats.maxDepth, node.depth);
    stats.totalElements += node.elements.size;

    if (node.children !== null) {
      for (const child of node.children) {
        this.getNodeStats(child, stats);
      }
    }
  }

  /**
   * Get bounding box for an element
   */
  private getElementBounds(element: CanvasElement): BoundingBox {
    // Handle different element types
    switch (element.type) {
      case 'circle':
        const radius = (element as any).radius || 50;
        return {
          x: element.x - radius,
          y: element.y - radius,
          width: radius * 2,
          height: radius * 2
        };
      
      case 'connector':
        const connector = element as any;
        return {
          x: Math.min(connector.startX || element.x, connector.endX || element.x),
          y: Math.min(connector.startY || element.y, connector.endY || element.y),
          width: Math.abs((connector.endX || element.x) - (connector.startX || element.x)),
          height: Math.abs((connector.endY || element.y) - (connector.startY || element.y))
        };
      
      default:
        // Rectangle, text, sticky note, etc.
        return {
          x: element.x,
          y: element.y,
          width: (element as any).width || 100,
          height: (element as any).height || 100
        };
    }
  }

  /**
   * Check if two bounding boxes intersect
   */
  private intersects(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  /**
   * Rebuild the entire tree (useful after many operations)
   */
  rebuild(elements: CanvasElement[]): void {
    this.clear();
    for (const element of elements) {
      this.insert(element);
    }
  }
}