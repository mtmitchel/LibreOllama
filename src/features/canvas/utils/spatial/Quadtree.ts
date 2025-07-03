/**
 * Optimized QuadTree implementation for fast spatial element lookup
 * Used for hit testing and spatial queries in the canvas
 */

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface QuadTreeElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

class QuadNode {
  private bounds: Bounds;
  public elements: QuadTreeElement[] = [];
  public children: QuadNode[] | null = null;
  private maxElements: number;
  private maxDepth: number;
  private depth: number;

  constructor(bounds: Bounds, maxElements = 10, maxDepth = 5, depth = 0) {
    this.bounds = bounds;
    this.maxElements = maxElements;
    this.maxDepth = maxDepth;
    this.depth = depth;
  }

  insert(element: QuadTreeElement): boolean {
    if (!this.intersects(element, this.bounds)) {
      return false;
    }

    if (this.children === null) {
      this.elements.push(element);

      // Split if we exceed capacity and haven't reached max depth
      if (this.elements.length > this.maxElements && this.depth < this.maxDepth) {
        this.split();
        
        // Redistribute elements to children
        const elementsToRedistribute = [...this.elements];
        this.elements = [];
        
        for (const elem of elementsToRedistribute) {
          let inserted = false;
          for (const child of this.children!) {
            if (child.insert(elem)) {
              inserted = true;
              break;
            }
          }
          // If element doesn't fit in any child, keep it in parent
          if (!inserted) {
            this.elements.push(elem);
          }
        }
      }
      return true;
    } else {
      // Try to insert in children
      for (const child of this.children) {
        if (child.insert(element)) {
          return true;
        }
      }
      // If doesn't fit in any child, store in this node
      this.elements.push(element);
      return true;
    }
  }

  query(range: Bounds): string[] {
    const result: string[] = [];
    this.queryInternal(range, result);
    return result;
  }

  private queryInternal(range: Bounds, result: string[]): void {
    if (!this.intersectsBounds(range, this.bounds)) {
      return;
    }

    // Check elements in this node
    for (const element of this.elements) {
      if (this.intersects(element, range)) {
        result.push(element.id);
      }
    }

    // Check children
    if (this.children !== null) {
      for (const child of this.children) {
        child.queryInternal(range, result);
      }
    }
  }

  private split(): void {
    const halfWidth = this.bounds.width / 2;
    const halfHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    this.children = [
      // Top-left
      new QuadNode(
        { x, y, width: halfWidth, height: halfHeight },
        this.maxElements,
        this.maxDepth,
        this.depth + 1
      ),
      // Top-right
      new QuadNode(
        { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
        this.maxElements,
        this.maxDepth,
        this.depth + 1
      ),
      // Bottom-left
      new QuadNode(
        { x, y: y + halfHeight, width: halfWidth, height: halfHeight },
        this.maxElements,
        this.maxDepth,
        this.depth + 1
      ),
      // Bottom-right
      new QuadNode(
        { x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight },
        this.maxElements,
        this.maxDepth,
        this.depth + 1
      ),
    ];
  }

  private intersects(element: QuadTreeElement, bounds: Bounds): boolean {
    return !(
      element.x > bounds.x + bounds.width ||
      element.x + element.width < bounds.x ||
      element.y > bounds.y + bounds.height ||
      element.y + element.height < bounds.y
    );
  }

  private intersectsBounds(bounds1: Bounds, bounds2: Bounds): boolean {
    return !(
      bounds1.x > bounds2.x + bounds2.width ||
      bounds1.x + bounds1.width < bounds2.x ||
      bounds1.y > bounds2.y + bounds2.height ||
      bounds1.y + bounds1.height < bounds2.y
    );
  }

  clear(): void {
    this.elements = [];
    this.children = null;
  }

  getElementCount(): number {
    let count = this.elements.length;
    if (this.children !== null) {
      for (const child of this.children) {
        count += child.getElementCount();
      }
    }
    return count;
  }
}

export class QuadTree {
  private root: QuadNode;
  private bounds: Bounds;

  constructor(bounds: Bounds, maxElements = 10, maxDepth = 5) {
    this.bounds = bounds;
    this.root = new QuadNode(bounds, maxElements, maxDepth);
  }

  insert(element: QuadTreeElement): void {
    this.root.insert(element);
  }

  query(range: Bounds): string[] {
    return this.root.query(range);
  }

  queryPoint(x: number, y: number, radius = 1): string[] {
    return this.query({
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2
    });
  }

  clear(): void {
    this.root.clear();
  }

  rebuild(elements: QuadTreeElement[]): void {
    this.clear();
    for (const element of elements) {
      this.insert(element);
    }
  }

  getElementCount(): number {
    return this.root.getElementCount();
  }

  getBounds(): Bounds {
    return { ...this.bounds };
  }

  resize(newBounds: Bounds): void {
    const elements: QuadTreeElement[] = [];
    this.collectAllElements(this.root, elements);
    
    this.bounds = newBounds;
    this.root = new QuadNode(newBounds);
    
    for (const element of elements) {
      this.insert(element);
    }
  }

  private collectAllElements(node: QuadNode, elements: QuadTreeElement[]): void {
    elements.push(...node.elements);
    
    if (node.children !== null) {
      for (const child of node.children) {
        this.collectAllElements(child, elements);
      }
    }
  }
}

// Utility functions for common spatial operations
export const spatialUtils = {
  /**
   * Check if a point is within a bounds
   */
  pointInBounds(x: number, y: number, bounds: Bounds): boolean {
    return x >= bounds.x && 
           x <= bounds.x + bounds.width && 
           y >= bounds.y && 
           y <= bounds.y + bounds.height;
  },

  /**
   * Calculate distance between two points
   */
  distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Get bounds that encompass multiple elements
   */
  getBoundingBounds(elements: QuadTreeElement[]): Bounds | null {
    if (elements.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const element of elements) {
      minX = Math.min(minX, element.x);
      minY = Math.min(minY, element.y);
      maxX = Math.max(maxX, element.x + element.width);
      maxY = Math.max(maxY, element.y + element.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },

  /**
   * Expand bounds by a margin
   */
  expandBounds(bounds: Bounds, margin: number): Bounds {
    return {
      x: bounds.x - margin,
      y: bounds.y - margin,
      width: bounds.width + margin * 2,
      height: bounds.height + margin * 2
    };
  },

  /**
   * Create a quadtree for the entire canvas (compatibility function)
   */
  createCanvasQuadtree(canvasBounds: Bounds, config?: any): QuadTree {
    return new QuadTree(canvasBounds, config?.maxElementsPerNode || 10, config?.maxDepth || 5);
  },

  /**
   * Batch insert elements into quadtree (compatibility function)
   */
  batchInsertElements(quadtree: QuadTree, elements: any[]): void {
    elements.forEach(element => {
      // Convert canvas element to QuadTreeElement format
      const quadElement: QuadTreeElement = {
        id: element.id,
        x: element.x || 0,
        y: element.y || 0,
        width: element.width || 100,
        height: element.height || 100
      };
      quadtree.insert(quadElement);
    });
  }
};
