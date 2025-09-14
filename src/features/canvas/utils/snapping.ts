// src/features/canvas/utils/snapping.ts
import { SimpleQuadTree, Rectangle } from './spatial-index';
import { ElementId, PortKind } from '../types/canvas-elements';
import type { CanvasElement } from '../types/enhanced.types';
import { findClosestPort, generateElementPorts, SnapPortResult, Port } from './ports';
import { isConnectorElement } from '../types/enhanced.types';

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
  updateSpatialIndex(canvasElements: CanvasElement[]): void {
    // Filter out connector elements - only index non-connector CanvasElements for snapping
    const nodes = canvasElements.filter(el => !isConnectorElement(el));
    // The SimpleQuadTree.build method expects CanvasElement[], and its getElementBounds
    // handles dimension extraction for various element types.
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

      // The quadtree returns full CanvasElement objects now.
      // However, `findClosestPort` expects `Map<ElementId, CanvasElement>`. We need to ensure
      // that `element.id` is indeed `ElementId` (not `SectionId`) for this map.
      // `generateElementPorts` already filters out `SectionElement`s, so if an element
      // reaches here and is a `SectionElement`, `generateElementPorts` will return empty.
      // We should only pass elements that can actually have ports to `findClosestPort`.
      if (isConnectorElement(element)) continue; // Connectors do not have ports for snapping

      // Create a map with only the current element for findClosestPort
      const elementsMap = new Map<ElementId, CanvasElement>();
      // Cast element.id to ElementId. This is safe because SectionElements and ConnectorElements
      // (which have SectionId as id type) are filtered out prior to this point or cannot have ports.
      elementsMap.set(element.id as ElementId, element);

      // Find closest port on this element
      const portResult = findClosestPort(worldPointer, elementsMap, null, this.snapConfig.threshold);
      if (!portResult) continue;

      // Check if it's within snap threshold and closer than current best
      if (portResult.distance < bestDistance) {
        bestSnap = {
          elementId: portResult.port.elementId,
          portKind: portResult.port.kind,
          worldPosition: { x: portResult.port.x, y: portResult.port.y },
          distance: portResult.distance,
        };
        bestDistance = portResult.distance;
      }
    }

    return bestSnap;
  }

  /**
   * Get all port positions for an element (for rendering port indicators)
   */
  getElementPortPositions(element: CanvasElement): Array<{
    portKind: PortKind;
    worldPosition: { x: number; y: number };
  }> {
    const portPositions = generateElementPorts(element);
    return portPositions.map((p: Port) => ({
      portKind: p.kind,
      worldPosition: { x: p.x, y: p.y },
    }));
  }

  /**
   * Check if a point is within snapping distance of any port on an element
   */
  isNearElementPorts(
    element: CanvasElement,
    worldPointer: { x: number; y: number }
  ): boolean {
    // Ensure that element.id is ElementId for the Map key
    const elementsMap = new Map<ElementId, CanvasElement>();
    if (element.id && !isConnectorElement(element)) {
      elementsMap.set(element.id as ElementId, element);
    }
    const portResult = findClosestPort(worldPointer, elementsMap, null, this.snapConfig.threshold);
    return !!portResult;
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
