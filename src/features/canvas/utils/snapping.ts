// src/features/canvas/utils/snapping.ts
import { SimpleQuadTree, Rectangle } from './spatialIndex';
import { NodeElement, ElementId, PortKind } from '../types/canvas-elements';
import { findClosestPortTo, getAllPortWorldPositions } from './ports';

/**
 * Snapping configuration
 */
export interface SnapConfig {
  enabled: boolean;
  threshold: number; // Max distance for snapping in pixels
  searchRadius: number; // QuadTree query radius in pixels
}

/**
 * Result of a snapping query
 */
export interface SnapResult {
  elementId: ElementId;
  portKind: PortKind;
  worldPosition: { x: number; y: number };
  distance: number;
}

/**
 * Snapping utility that uses QuadTree for fast proximity queries
 * Follows the blueprint: QuadTree for performance, port-based snapping
 */
export class CanvasSnapper {
  private quadTree: SimpleQuadTree;
  private snapConfig: SnapConfig;

  constructor(
    canvasBounds: Rectangle,
    config: SnapConfig = {
      enabled: true,
      threshold: 20,
      searchRadius: 50,
    }
  ) {
    this.quadTree = new SimpleQuadTree(canvasBounds, 10, 6);
    this.snapConfig = config;
  }

  /**
   * Update the spatial index with current node elements
   * Should be called when elements move/resize or periodically
   */
  updateSpatialIndex(nodeElements: NodeElement[]): void {
    // Filter out edge elements - only index NodeElements for snapping
    const nodes = nodeElements.filter(el => el.type !== 'edge') as NodeElement[];
    this.quadTree.build(nodes);
  }

  /**
   * Find the nearest port to snap to within the threshold
   * Returns null if no suitable snap target is found
   */
  findNearestSnapPort(
    worldPointer: { x: number; y: number },
    excludeElementId?: ElementId
  ): SnapResult | null {
    if (!this.snapConfig.enabled) return null;

    // Create search area around pointer
    const searchBounds: Rectangle = {
      x: worldPointer.x - this.snapConfig.searchRadius,
      y: worldPointer.y - this.snapConfig.searchRadius,
      width: this.snapConfig.searchRadius * 2,
      height: this.snapConfig.searchRadius * 2,
    };

    // Query nearby elements using QuadTree
    const candidateElements = this.quadTree.query(searchBounds);

    let bestSnap: SnapResult | null = null;
    let bestDistance = this.snapConfig.threshold;

    for (const element of candidateElements) {
      // Skip excluded element (e.g., the element we're dragging from)
      if (excludeElementId && element.id === excludeElementId) continue;
      
      // Only snap to node elements, not edges
      if (element.type === 'edge') continue;

      const nodeElement = element as NodeElement;

      // Find closest port on this element
      const portResult = findClosestPortTo(nodeElement, worldPointer);
      if (!portResult) continue;

      // Check if it's within snap threshold and closer than current best
      if (portResult.distance < bestDistance) {
        bestSnap = {
          elementId: nodeElement.id,
          portKind: portResult.port.kind,
          worldPosition: { x: worldPointer.x, y: worldPointer.y }, // Will be updated with exact port position
          distance: portResult.distance,
        };
        bestDistance = portResult.distance;
      }
    }

    // If we found a snap target, get its exact world position
    if (bestSnap) {
      const targetElement = candidateElements.find(el => el.id === bestSnap!.elementId) as NodeElement;
      if (targetElement) {
        const portPositions = getAllPortWorldPositions(targetElement);
        const targetPortPosition = portPositions.find(p => p.port.kind === bestSnap!.portKind);
        if (targetPortPosition) {
          bestSnap.worldPosition = targetPortPosition.world;
        }
      }
    }

    return bestSnap;
  }

  /**
   * Get all port positions for an element (for rendering port indicators)
   */
  getElementPortPositions(element: NodeElement): Array<{
    portKind: PortKind;
    worldPosition: { x: number; y: number };
  }> {
    const portPositions = getAllPortWorldPositions(element);
    return portPositions.map(p => ({
      portKind: p.port.kind,
      worldPosition: p.world,
    }));
  }

  /**
   * Check if a point is within snapping distance of any port on an element
   */
  isNearElementPorts(
    element: NodeElement,
    worldPointer: { x: number; y: number }
  ): boolean {
    const portResult = findClosestPortTo(element, worldPointer);
    return portResult ? portResult.distance <= this.snapConfig.threshold : false;
  }

  /**
   * Update snapping configuration
   */
  updateConfig(config: Partial<SnapConfig>): void {
    this.snapConfig = { ...this.snapConfig, ...config };
  }

  /**
   * Get current snapping configuration
   */
  getConfig(): SnapConfig {
    return { ...this.snapConfig };
  }

  /**
   * Get QuadTree statistics for debugging
   */
  getStats(): ReturnType<SimpleQuadTree['getStats']> {
    return this.quadTree.getStats();
  }

  /**
   * Update canvas bounds (e.g., when canvas resizes)
   */
  updateCanvasBounds(bounds: Rectangle): void {
    this.quadTree = new SimpleQuadTree(bounds, 10, 6);
  }
}