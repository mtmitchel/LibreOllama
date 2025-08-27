import { CanvasElement } from '../types/enhanced.types';

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QuadTreeNode {
  bounds: Rectangle;
  elements: CanvasElement[];
  children: QuadTreeNode[] | null;
  divided: boolean;
  maxElements: number;
  maxDepth: number;
  depth: number;
}

/**
 * Simple QuadTree spatial index for fast element culling
 * Optimized for canvas elements with rectangular bounds
 */
export class SimpleQuadTree {
  private root: QuadTreeNode;
  private maxElements: number;
  private maxDepth: number;

  constructor(
    bounds: Rectangle, 
    maxElements = 50, 
    maxDepth = 8
  ) {
    this.maxElements = maxElements;
    this.maxDepth = maxDepth;
    this.root = {
      bounds,
      elements: [],
      children: null,
      divided: false,
      maxElements,
      maxDepth,
      depth: 0
    };
  }

  /**
   * Get element bounds for spatial indexing
   */
  private getElementBounds(element: CanvasElement): Rectangle {
    let width = 100;
    let height = 100;

    // Handle different element types
    if (element.type === 'circle') {
      const radius = (element as any).radius || 50;
      width = radius * 2;
      height = radius * 2;
    } else if ('width' in element && 'height' in element) {
      width = element.width || 100;
      height = element.height || 100;
    }

    return {
      x: element.x,
      y: element.y,
      width,
      height
    };
  }

  /**
   * Check if two rectangles intersect
   */
  private intersects(rect1: Rectangle, rect2: Rectangle): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  /**
   * Check if rectangle is completely contained within bounds
   */
  private contains(bounds: Rectangle, rect: Rectangle): boolean {
    return (
      rect.x >= bounds.x &&
      rect.y >= bounds.y &&
      rect.x + rect.width <= bounds.x + bounds.width &&
      rect.y + rect.height <= bounds.y + bounds.height
    );
  }

  /**
   * Subdivide a node into four children
   */
  private subdivide(node: QuadTreeNode): void {
    if (node.divided || node.depth >= node.maxDepth) return;

    const { bounds, depth, maxElements, maxDepth } = node;
    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;
    const childDepth = depth + 1;

    node.children = [
      // Top-left
      {
        bounds: { x: bounds.x, y: bounds.y, width: halfWidth, height: halfHeight },
        elements: [],
        children: null,
        divided: false,
        maxElements,
        maxDepth,
        depth: childDepth
      },
      // Top-right
      {
        bounds: { x: bounds.x + halfWidth, y: bounds.y, width: halfWidth, height: halfHeight },
        elements: [],
        children: null,
        divided: false,
        maxElements,
        maxDepth,
        depth: childDepth
      },
      // Bottom-left
      {
        bounds: { x: bounds.x, y: bounds.y + halfHeight, width: halfWidth, height: halfHeight },
        elements: [],
        children: null,
        divided: false,
        maxElements,
        maxDepth,
        depth: childDepth
      },
      // Bottom-right
      {
        bounds: { x: bounds.x + halfWidth, y: bounds.y + halfHeight, width: halfWidth, height: halfHeight },
        elements: [],
        children: null,
        divided: false,
        maxElements,
        maxDepth,
        depth: childDepth
      }
    ];

    node.divided = true;
  }

  /**
   * Insert an element into the quadtree
   */
  private insertElement(node: QuadTreeNode, element: CanvasElement): boolean {
    const elementBounds = this.getElementBounds(element);
    
    if (!this.intersects(node.bounds, elementBounds)) {
      return false;
    }

    if (node.elements.length < node.maxElements && !node.divided) {
      node.elements.push(element);
      return true;
    }

    if (!node.divided) {
      this.subdivide(node);
    }

    if (node.children) {
      for (const child of node.children) {
        if (this.insertElement(child, element)) {
          return true;
        }
      }
    }

    // If it doesn't fit in any child, keep it in this node
    node.elements.push(element);
    return true;
  }

  /**
   * Query elements that intersect with the given bounds
   */
  private queryRange(node: QuadTreeNode, range: Rectangle, found: CanvasElement[]): void {
    if (!this.intersects(node.bounds, range)) {
      return;
    }

    // Check elements in this node
    for (const element of node.elements) {
      const elementBounds = this.getElementBounds(element);
      if (this.intersects(range, elementBounds)) {
        found.push(element);
      }
    }

    // Recursively check children
    if (node.children) {
      for (const child of node.children) {
        this.queryRange(child, range, found);
      }
    }
  }

  /**
   * Build the quadtree from elements
   */
  build(elements: CanvasElement[]): void {
    // Reset the tree
    this.root.elements = [];
    this.root.children = null;
    this.root.divided = false;

    // Insert all elements
    for (const element of elements) {
      this.insertElement(this.root, element);
    }
  }

  /**
   * Query visible elements within viewport bounds
   */
  query(viewportBounds: Rectangle): CanvasElement[] {
    const found: CanvasElement[] = [];
    this.queryRange(this.root, viewportBounds, found);
    return found;
  }

  /**
   * Get tree statistics for debugging
   */
  getStats(): { 
    totalNodes: number; 
    maxDepth: number; 
    totalElements: number; 
    leafNodes: number;
  } {
    let totalNodes = 0;
    let maxDepthFound = 0;
    let totalElements = 0;
    let leafNodes = 0;

    const traverse = (node: QuadTreeNode, depth: number) => {
      totalNodes++;
      maxDepthFound = Math.max(maxDepthFound, depth);
      totalElements += node.elements.length;

      if (!node.children) {
        leafNodes++;
      } else {
        for (const child of node.children) {
          traverse(child, depth + 1);
        }
      }
    };

    traverse(this.root, 0);

    return {
      totalNodes,
      maxDepth: maxDepthFound,
      totalElements,
      leafNodes
    };
  }
}