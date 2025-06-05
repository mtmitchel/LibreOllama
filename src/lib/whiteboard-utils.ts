import {
  WhiteboardPoint,
  WhiteboardBounds,
  WhiteboardViewport,
  AnyWhiteboardElement,
  WhiteboardElement,
  WhiteboardStickyNote,
  WhiteboardTextBox,
  WhiteboardShape,
  WhiteboardLine,
  WhiteboardArrow,
  WhiteboardDrawing,
  WhiteboardFrame,
  WhiteboardImage,
  WhiteboardConnector,
  WhiteboardColor,
  WhiteboardFont,
  WhiteboardStroke,
  WhiteboardTransform,
  QuadTreeNode,
  QuadTreeStats,
  PerformanceMetrics,
  FrameRateMetrics,
  MemoryMetrics,
  ViewportCullingStats,
  ElementLOD,
  LODSettings,
  PoolableObject,
  ObjectPoolStats,
  WhiteboardState,
  OptimizedFileFormat,
  SerializedQuadTree,
  SerializedQuadTreeNode,
  CompressedElementData,
  CanvasMetadata,
  FileFormatManager,
  RenderingBackend,
  RenderingCapabilities,
  HybridRenderer,
  AdvancedExportOptions,
  ExportResult,
  AdvancedExportEngine,
  PerformanceBenchmark,
  WhiteboardMemoryPools
} from './whiteboard-types';

// Coordinate transformation utilities
export class WhiteboardCoordinates {
  static screenToCanvas(
    screenPoint: WhiteboardPoint, 
    viewport: WhiteboardViewport
  ): WhiteboardPoint {
    return {
      x: (screenPoint.x - viewport.x) / viewport.zoom,
      y: (screenPoint.y - viewport.y) / viewport.zoom
    };
  }

  static canvasToScreen(
    canvasPoint: WhiteboardPoint, 
    viewport: WhiteboardViewport
  ): WhiteboardPoint {
    return {
      x: canvasPoint.x * viewport.zoom + viewport.x,
      y: canvasPoint.y * viewport.zoom + viewport.y
    };
  }

  static getElementBounds(element: AnyWhiteboardElement): WhiteboardBounds {
    const { position, size, transform } = element;
    const { rotation, scaleX, scaleY } = transform;

    if (rotation === 0 && scaleX === 1 && scaleY === 1) {
      return {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height
      };
    }

    // Calculate bounds accounting for rotation and scale
    const w = size.width * scaleX;
    const h = size.height * scaleY;
    const cos = Math.cos(rotation * Math.PI / 180);
    const sin = Math.sin(rotation * Math.PI / 180);

    const corners = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h }
    ].map(corner => ({
      x: position.x + corner.x * cos - corner.y * sin,
      y: position.y + corner.x * sin + corner.y * cos
    }));

    const minX = Math.min(...corners.map(c => c.x));
    const maxX = Math.max(...corners.map(c => c.x));
    const minY = Math.min(...corners.map(c => c.y));
    const maxY = Math.max(...corners.map(c => c.y));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  static getSelectionBounds(elements: AnyWhiteboardElement[]): WhiteboardBounds | null {
    if (elements.length === 0) return null;

    const bounds = elements.map(element => this.getElementBounds(element));
    const minX = Math.min(...bounds.map(b => b.x));
    const maxX = Math.max(...bounds.map(b => b.x + b.width));
    const minY = Math.min(...bounds.map(b => b.y));
    const maxY = Math.max(...bounds.map(b => b.y + b.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  static boundsIntersect(bounds1: WhiteboardBounds, bounds2: WhiteboardBounds): boolean {
    return !(bounds1.x + bounds1.width < bounds2.x ||
             bounds2.x + bounds2.width < bounds1.x ||
             bounds1.y + bounds1.height < bounds2.y ||
             bounds2.y + bounds2.height < bounds1.y);
  }

  static pointInBounds(point: WhiteboardPoint, bounds: WhiteboardBounds): boolean {
    return point.x >= bounds.x && 
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && 
           point.y <= bounds.y + bounds.height;
  }
}

// Element factory functions
export class WhiteboardElementFactory {
  static createStickyNote(
    position: WhiteboardPoint, 
    content: string = 'New sticky note',
    color: string = '#fef3c7'
  ): WhiteboardStickyNote {
    const id = `sticky-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    return {
      id,
      type: 'sticky-note',
      position,
      size: { width: 200, height: 150 },
      transform: { rotation: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      style: {
        color: { fill: color, stroke: '#000000', opacity: 1 },
        stroke: { width: 1, style: 'solid' },
        autoResize: true,
        maxWidth: 400,
        minWidth: 150
      },
      content,
      metadata: {
        layer: 1,
        locked: false,
        visible: true,
        createdBy: 'user',
        tags: []
      },
      createdAt: now,
      updatedAt: now
    };
  }

  static createTextBox(
    position: WhiteboardPoint,
    content: string = 'Enter text...',
    font?: Partial<WhiteboardFont>
  ): WhiteboardTextBox {
    const id = `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    return {
      id,
      type: 'text',
      position,
      size: { width: 300, height: 100 },
      transform: { rotation: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      style: {
        color: { fill: '#000000', stroke: 'transparent', opacity: 1 },
        stroke: { width: 0, style: 'solid' },
        font: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: 'normal',
          style: 'normal',
          decoration: 'none',
          align: 'left',
          ...font
        },
        lineHeight: 1.4,
        letterSpacing: 0,
        wordWrap: true
      },
      content,
      metadata: {
        layer: 1,
        locked: false,
        visible: true,
        createdBy: 'user',
        tags: []
      },
      createdAt: now,
      updatedAt: now
    };
  }

  static createShape(
    position: WhiteboardPoint,
    shapeType: WhiteboardShape['shapeType'],
    size: { width: number; height: number } = { width: 100, height: 100 }
  ): WhiteboardShape {
    const id = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    return {
      id,
      type: 'shape',
      shapeType,
      position,
      size,
      transform: { rotation: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      style: {
        color: { fill: '#3b82f6', stroke: '#1e40af', opacity: 1 },
        stroke: { width: 2, style: 'solid' },
        borderRadius: shapeType === 'rectangle' ? 8 : 0
      },
      metadata: {
        layer: 1,
        locked: false,
        visible: true,
        createdBy: 'user',
        tags: []
      },
      createdAt: now,
      updatedAt: now
    };
  }

  static createArrow(
    startPoint: WhiteboardPoint,
    endPoint: WhiteboardPoint
  ): WhiteboardArrow {
    const id = `arrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    return {
      id,
      type: 'arrow',
      position: startPoint,
      size: { 
        width: Math.abs(endPoint.x - startPoint.x), 
        height: Math.abs(endPoint.y - startPoint.y) 
      },
      transform: { rotation: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      startPoint,
      endPoint,
      style: {
        color: { fill: 'transparent', stroke: '#374151', opacity: 1 },
        stroke: { width: 2, style: 'solid' },
        startArrow: 'none',
        endArrow: 'arrow',
        curved: false
      },
      metadata: {
        layer: 1,
        locked: false,
        visible: true,
        createdBy: 'user',
        tags: []
      },
      createdAt: now,
      updatedAt: now
    };
  }

  static createFrame(
    position: WhiteboardPoint,
    size: { width: number; height: number },
    title: string = 'Frame'
  ): WhiteboardFrame {
    const id = `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    return {
      id,
      type: 'frame',
      title,
      position,
      size,
      transform: { rotation: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      childElements: [],
      style: {
        color: { fill: 'transparent', stroke: '#6b7280', opacity: 1 },
        stroke: { width: 2, style: 'dashed' },
        titleFont: {
          family: 'Inter, sans-serif',
          size: 14,
          weight: 'bold',
          style: 'normal',
          decoration: 'none',
          align: 'left'
        },
        titlePosition: 'top',
        padding: 20,
        borderRadius: 8
      },
      metadata: {
        layer: 0,
        locked: false,
        visible: true,
        createdBy: 'user',
        tags: []
      },
      createdAt: now,
      updatedAt: now
    };
  }
}

// Grid and snapping utilities
export class WhiteboardGrid {
  static snapToGrid(point: WhiteboardPoint, gridSize: number): WhiteboardPoint {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  }

  static getGridLines(
    viewport: WhiteboardViewport,
    gridSize: number,
    containerSize: { width: number; height: number }
  ): { vertical: number[]; horizontal: number[] } {
    const scaledGridSize = gridSize * viewport.zoom;
    const offsetX = viewport.x % scaledGridSize;
    const offsetY = viewport.y % scaledGridSize;

    const vertical: number[] = [];
    const horizontal: number[] = [];

    // Vertical lines
    for (let x = offsetX; x < containerSize.width; x += scaledGridSize) {
      vertical.push(x);
    }

    // Horizontal lines
    for (let y = offsetY; y < containerSize.height; y += scaledGridSize) {
      horizontal.push(y);
    }

    return { vertical, horizontal };
  }
}

// Selection utilities
export class WhiteboardSelection {
  static isElementInSelection(
    element: AnyWhiteboardElement,
    selectionBounds: WhiteboardBounds
  ): boolean {
    const elementBounds = WhiteboardCoordinates.getElementBounds(element);
    return WhiteboardCoordinates.boundsIntersect(elementBounds, selectionBounds);
  }

  static getElementsInBounds(
    elements: AnyWhiteboardElement[],
    bounds: WhiteboardBounds
  ): AnyWhiteboardElement[] {
    return elements.filter(element => this.isElementInSelection(element, bounds));
  }

  static getElementAtPoint(
    elements: AnyWhiteboardElement[],
    point: WhiteboardPoint
  ): AnyWhiteboardElement | null {
    // Check elements in reverse order (top to bottom)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      const bounds = WhiteboardCoordinates.getElementBounds(element);
      
      if (WhiteboardCoordinates.pointInBounds(point, bounds)) {
        return element;
      }
    }
    return null;
  }
}

// Color utilities
export class WhiteboardColors {
  static readonly STICKY_NOTE_COLORS = [
    '#fef3c7', // yellow
    '#fed7aa', // orange
    '#fecaca', // red
    '#f3e8ff', // purple
    '#dbeafe', // blue
    '#bbf7d0', // green
    '#f0f9ff', // sky
    '#fdf2f8', // pink
  ];

  static readonly SHAPE_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
  ];

  static readonly TEXT_COLORS = [
    '#000000', // black
    '#374151', // gray
    '#dc2626', // red
    '#ea580c', // orange
    '#16a34a', // green
    '#2563eb', // blue
    '#7c3aed', // purple
    '#be185d', // pink
  ];

  static hexToRgba(hex: string, opacity: number = 1): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  static getContrastColor(backgroundColor: string): string {
    // Simple contrast calculation
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }
}

// Distance and geometry utilities
export class WhiteboardGeometry {
  static distance(point1: WhiteboardPoint, point2: WhiteboardPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static angle(from: WhiteboardPoint, to: WhiteboardPoint): number {
    return Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
  }

  static midpoint(point1: WhiteboardPoint, point2: WhiteboardPoint): WhiteboardPoint {
    return {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2
    };
  }

  static rotatePoint(point: WhiteboardPoint, center: WhiteboardPoint, angle: number): WhiteboardPoint {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  }

  static getQuadraticCurvePoint(
    start: WhiteboardPoint,
    control: WhiteboardPoint,
    end: WhiteboardPoint,
    t: number
  ): WhiteboardPoint {
    const oneMinusT = 1 - t;
    return {
      x: oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x,
      y: oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y
    };
  }
}

// Performance utilities
export class WhiteboardPerformance {
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;

    return (...args: Parameters<T>) => {
      lastArgs = args;
      
      if (timeoutId === null) {
        timeoutId = setTimeout(() => {
          func.apply(null, lastArgs!);
          timeoutId = null;
        }, delay);
      }
    };
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func.apply(null, args);
      }, delay);
    };
  }

  static getVisibleElements(
    elements: AnyWhiteboardElement[],
    viewport: WhiteboardViewport,
    containerSize: { width: number; height: number }
  ): AnyWhiteboardElement[] {
    const viewportBounds: WhiteboardBounds = {
      x: -viewport.x / viewport.zoom,
      y: -viewport.y / viewport.zoom,
      width: containerSize.width / viewport.zoom,
      height: containerSize.height / viewport.zoom
    };

    return elements.filter(element => {
      if (!element.metadata.visible) return false;
      
      const elementBounds = WhiteboardCoordinates.getElementBounds(element);
      return WhiteboardCoordinates.boundsIntersect(elementBounds, viewportBounds);
    });
  }
}

// Keyboard shortcuts
export class WhiteboardKeyboard {
  static readonly SHORTCUTS = {
    // Tools
    SELECT: 'v',
    STICKY_NOTE: 's',
    TEXT: 't',
    PEN: 'p',
    SHAPE: 'r',
    LINE: 'l',
    ARROW: 'a',
    FRAME: 'f',
    
    // Actions
    UNDO: 'z',
    REDO: 'y',
    COPY: 'c',
    PASTE: 'v',
    DELETE: 'Delete',
    DUPLICATE: 'd',
    
    // View
    ZOOM_IN: '=',
    ZOOM_OUT: '-',
    ZOOM_TO_FIT: '0',
    ZOOM_TO_SELECTION: '9',
    
    // Selection
    SELECT_ALL: 'a',
    DESELECT_ALL: 'Escape',
    
    // Grid
    TOGGLE_GRID: 'g',
    TOGGLE_SNAP: 'Shift+g'
  };

  static isShortcut(event: KeyboardEvent, shortcut: string, requireMod = true): boolean {
    const key = event.key;
    const hasCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    if (shortcut.includes('Shift+')) {
      return event.shiftKey && hasCtrlOrCmd && key.toLowerCase() === shortcut.replace('Shift+', '');
    }
    
    if (requireMod && shortcut !== 'Delete' && shortcut !== 'Escape') {
      return hasCtrlOrCmd && key.toLowerCase() === shortcut.toLowerCase();
    }
    
    return key === shortcut || key.toLowerCase() === shortcut.toLowerCase();
  }
}

// Export utilities
export class WhiteboardExport {
  static async exportToPNG(
    canvas: HTMLCanvasElement,
    elements: AnyWhiteboardElement[],
    viewport: WhiteboardViewport,
    options: { scale?: number; quality?: number } = {}
  ): Promise<Blob> {
    const { scale = 1, quality = 1 } = options;
    
    // Create a temporary canvas for export
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d')!;
    
    // Calculate bounds of all elements
    const bounds = WhiteboardCoordinates.getSelectionBounds(elements);
    if (!bounds) throw new Error('No elements to export');
    
    // Set canvas size
    exportCanvas.width = bounds.width * scale;
    exportCanvas.height = bounds.height * scale;
    
    // Scale context
    ctx.scale(scale, scale);
    ctx.translate(-bounds.x, -bounds.y);
    
    // Render elements (simplified - would need full rendering logic)
    // This is a placeholder for the actual rendering implementation
    
    return new Promise((resolve) => {
      exportCanvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', quality);
    });
  }

  static exportToSVG(
    elements: AnyWhiteboardElement[],
    viewport: WhiteboardViewport
  ): string {
    const bounds = WhiteboardCoordinates.getSelectionBounds(elements);
    if (!bounds) return '';
    
    let svg = `<svg width="${bounds.width}" height="${bounds.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Render each element as SVG (simplified - would need full SVG generation)
    elements.forEach(element => {
      // SVG generation logic would go here
    });
    
    svg += '</svg>';
    return svg;
  }

  static exportToJSON(
    elements: AnyWhiteboardElement[],
    viewport: WhiteboardViewport
  ): string {
    return JSON.stringify({
      elements,
      viewport,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2);
  }
}

// QuadTree Spatial Indexing System
export class QuadTreeSpatialIndex {
  private root: QuadTreeNode;
  private maxElements: number;
  private maxDepth: number;
  private elementMap: Map<string, QuadTreeNode>;

  constructor(
    bounds: WhiteboardBounds,
    maxElements: number = 10,
    maxDepth: number = 8
  ) {
    this.maxElements = maxElements;
    this.maxDepth = maxDepth;
    this.elementMap = new Map();
    this.root = this.createNode(bounds, 0);
  }

  private createNode(bounds: WhiteboardBounds, depth: number): QuadTreeNode {
    return {
      bounds,
      elements: [],
      children: null,
      maxElements: this.maxElements,
      maxDepth: this.maxDepth,
      depth
    };
  }

  private subdivide(node: QuadTreeNode): void {
    if (node.children !== null || node.depth >= this.maxDepth) return;

    const { bounds } = node;
    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;

    // Create four child nodes
    node.children = [
      // Top-left
      this.createNode({
        x: bounds.x,
        y: bounds.y,
        width: halfWidth,
        height: halfHeight
      }, node.depth + 1),
      // Top-right
      this.createNode({
        x: bounds.x + halfWidth,
        y: bounds.y,
        width: halfWidth,
        height: halfHeight
      }, node.depth + 1),
      // Bottom-left
      this.createNode({
        x: bounds.x,
        y: bounds.y + halfHeight,
        width: halfWidth,
        height: halfHeight
      }, node.depth + 1),
      // Bottom-right
      this.createNode({
        x: bounds.x + halfWidth,
        y: bounds.y + halfHeight,
        width: halfWidth,
        height: halfHeight
      }, node.depth + 1)
    ];

    // Redistribute elements to children
    const elementsToRedistribute = [...node.elements];
    node.elements = [];

    for (const element of elementsToRedistribute) {
      this.insertIntoNode(element, node);
    }
  }

  private insertIntoNode(element: AnyWhiteboardElement, node: QuadTreeNode): boolean {
    const elementBounds = WhiteboardCoordinates.getElementBounds(element);
    
    if (!WhiteboardCoordinates.boundsIntersect(elementBounds, node.bounds)) {
      return false;
    }

    // If this is a leaf node and has space, add the element
    if (node.children === null) {
      if (node.elements.length < this.maxElements || node.depth >= this.maxDepth) {
        node.elements.push(element);
        this.elementMap.set(element.id, node);
        return true;
      } else {
        // Subdivide and try to insert into children
        this.subdivide(node);
      }
    }

    // If we have children, try to insert into them
    if (node.children !== null) {
      let inserted = false;
      for (const child of node.children) {
        if (this.insertIntoNode(element, child)) {
          inserted = true;
          break;
        }
      }
      
      // If it doesn't fit in any child (spans multiple quadrants), keep it in parent
      if (!inserted) {
        node.elements.push(element);
        this.elementMap.set(element.id, node);
        return true;
      }
    }

    return false;
  }

  private removeFromNode(elementId: string, node: QuadTreeNode): boolean {
    const elementIndex = node.elements.findIndex(el => el.id === elementId);
    if (elementIndex !== -1) {
      node.elements.splice(elementIndex, 1);
      this.elementMap.delete(elementId);
      return true;
    }

    if (node.children !== null) {
      for (const child of node.children) {
        if (this.removeFromNode(elementId, child)) {
          return true;
        }
      }
    }

    return false;
  }

  private queryNode(bounds: WhiteboardBounds, node: QuadTreeNode, results: AnyWhiteboardElement[]): void {
    if (!WhiteboardCoordinates.boundsIntersect(bounds, node.bounds)) {
      return;
    }

    // Check elements in this node
    for (const element of node.elements) {
      const elementBounds = WhiteboardCoordinates.getElementBounds(element);
      if (WhiteboardCoordinates.boundsIntersect(bounds, elementBounds)) {
        results.push(element);
      }
    }

    // Check children if they exist
    if (node.children !== null) {
      for (const child of node.children) {
        this.queryNode(bounds, child, results);
      }
    }
  }

  private getNodeStats(node: QuadTreeNode, stats: QuadTreeStats): void {
    stats.totalNodes++;
    stats.totalElements += node.elements.length;

    if (node.children === null) {
      stats.leafNodes++;
    } else {
      for (const child of node.children) {
        this.getNodeStats(child, stats);
      }
    }

    stats.maxDepth = Math.max(stats.maxDepth, node.depth);
  }

  insert(element: AnyWhiteboardElement): boolean {
    // Remove existing element if it exists
    this.remove(element.id);
    return this.insertIntoNode(element, this.root);
  }

  remove(elementId: string): boolean {
    return this.removeFromNode(elementId, this.root);
  }

  update(element: AnyWhiteboardElement): boolean {
    this.remove(element.id);
    return this.insert(element);
  }

  query(bounds: WhiteboardBounds): AnyWhiteboardElement[] {
    const results: AnyWhiteboardElement[] = [];
    this.queryNode(bounds, this.root, results);
    return results;
  }

  queryPoint(point: WhiteboardPoint): AnyWhiteboardElement[] {
    const pointBounds: WhiteboardBounds = {
      x: point.x,
      y: point.y,
      width: 0.1,
      height: 0.1
    };
    return this.query(pointBounds);
  }

  clear(): void {
    this.root = this.createNode(this.root.bounds, 0);
    this.elementMap.clear();
  }

  getStats(): QuadTreeStats {
    const stats: QuadTreeStats = {
      totalNodes: 0,
      leafNodes: 0,
      maxDepth: 0,
      totalElements: 0,
      averageElementsPerNode: 0,
      memoryUsage: 0
    };

    this.getNodeStats(this.root, stats);
    
    stats.averageElementsPerNode = stats.totalElements / Math.max(stats.leafNodes, 1);
    stats.memoryUsage = stats.totalNodes * 64 + stats.totalElements * 8; // Rough estimate

    return stats;
  }

  rebuild(elements: AnyWhiteboardElement[]): void {
    this.clear();
    for (const element of elements) {
      this.insert(element);
    }
  }
}

// Performance Manager
export class PerformanceManager {
  private metrics: PerformanceMetrics;
  private frameRateMonitor: FrameRateMonitor;
  private memoryTracker: MemoryTracker;
  private lastFrameTime: number = 0;
  private frameStartTime: number = 0;

  constructor() {
    this.metrics = {
      renderTime: 0,
      interactionLatency: 0,
      memoryUsage: 0,
      elementCount: 0,
      quadTreeDepth: 0,
      viewportCulledElements: 0,
      spatialQueryTime: 0,
      lastFrameTime: 0,
      frameRate: 60
    };
    
    this.frameRateMonitor = new FrameRateMonitor();
    this.memoryTracker = new MemoryTracker();
  }

  startFrame(): void {
    this.frameStartTime = performance.now();
  }

  endFrame(): void {
    const endTime = performance.now();
    const frameTime = endTime - this.frameStartTime;
    
    this.metrics.renderTime = frameTime;
    this.metrics.lastFrameTime = frameTime;
    this.metrics.frameRate = this.frameRateMonitor.update(frameTime);
    this.metrics.memoryUsage = this.memoryTracker.getCurrentUsage();
  }

  recordInteraction(type: string, duration: number): void {
    this.metrics.interactionLatency = duration;
  }

  recordSpatialQuery(duration: number): void {
    this.metrics.spatialQueryTime = duration;
  }

  updateElementCount(count: number): void {
    this.metrics.elementCount = count;
  }

  updateQuadTreeDepth(depth: number): void {
    this.metrics.quadTreeDepth = depth;
  }

  updateViewportCulling(culledCount: number): void {
    this.metrics.viewportCulledElements = culledCount;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  optimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.frameRate < 30) {
      recommendations.push('Frame rate is low - consider reducing element detail or enabling viewport culling');
    }
    
    if (this.metrics.renderTime > 16.67) {
      recommendations.push('Render time is high - consider implementing level-of-detail rendering');
    }
    
    if (this.metrics.spatialQueryTime > 5) {
      recommendations.push('Spatial queries are slow - consider rebuilding quad tree or reducing query frequency');
    }
    
    if (this.metrics.elementCount > 1000 && this.metrics.viewportCulledElements < this.metrics.elementCount * 0.5) {
      recommendations.push('Many elements visible - increase viewport culling aggressiveness');
    }
    
    if (this.metrics.memoryUsage > 500 * 1024 * 1024) { // 500MB
      recommendations.push('High memory usage - consider implementing object pooling');
    }

    return recommendations;
  }
}

// Frame Rate Monitor
export class FrameRateMonitor {
  private samples: number[] = [];
  private maxSamples = 60;

  update(frameTime: number): number {
    const fps = 1000 / frameTime;
    this.samples.push(fps);
    
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    
    return this.getAverageFPS();
  }

  getMetrics(): FrameRateMetrics {
    if (this.samples.length === 0) {
      return { current: 0, average: 0, min: 0, max: 0, samples: [] };
    }

    const current = this.samples[this.samples.length - 1];
    const average = this.getAverageFPS();
    const min = Math.min(...this.samples);
    const max = Math.max(...this.samples);

    return {
      current,
      average,
      min,
      max,
      samples: [...this.samples]
    };
  }

  private getAverageFPS(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((sum, fps) => sum + fps, 0) / this.samples.length;
  }
}

// Memory Tracker
export class MemoryTracker {
  private peakUsage = 0;
  private pooledObjectCount = 0;

  getCurrentUsage(): number {
    // Estimate memory usage based on performance.memory if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize || 0;
      this.peakUsage = Math.max(this.peakUsage, usage);
      return usage;
    }
    return 0;
  }

  updatePooledObjects(count: number): void {
    this.pooledObjectCount = count;
  }

  getMetrics(): MemoryMetrics {
    const current = this.getCurrentUsage();
    return {
      used: current,
      allocated: 'memory' in performance ? (performance as any).memory?.totalJSHeapSize || 0 : 0,
      peak: this.peakUsage,
      pooledObjects: this.pooledObjectCount
    };
  }
}

// Enhanced Viewport Manager
export class ViewportManager {
  private viewport: WhiteboardViewport;
  private lodSettings: LODSettings;

  constructor(viewport: WhiteboardViewport) {
    this.viewport = viewport;
    this.lodSettings = {
      fullDetailZoom: 0.75,
      mediumDetailZoom: 0.5,
      lowDetailZoom: 0.25,
      hideZoom: 0.1
    };
  }

  updateViewport(viewport: WhiteboardViewport): void {
    this.viewport = viewport;
  }

  getVisibleElements(spatialIndex: QuadTreeSpatialIndex, containerSize: { width: number; height: number }): AnyWhiteboardElement[] {
    const viewportBounds: WhiteboardBounds = {
      x: -this.viewport.x / this.viewport.zoom,
      y: -this.viewport.y / this.viewport.zoom,
      width: containerSize.width / this.viewport.zoom,
      height: containerSize.height / this.viewport.zoom
    };

    const startTime = performance.now();
    const visibleElements = spatialIndex.query(viewportBounds);
    const queryTime = performance.now() - startTime;

    return visibleElements.filter(element => 
      element.metadata.visible && this.shouldRenderElement(element)
    );
  }

  getElementLOD(element: AnyWhiteboardElement, zoom: number = this.viewport.zoom): ElementLOD {
    if (zoom >= this.lodSettings.fullDetailZoom) {
      return ElementLOD.FULL_DETAIL;
    } else if (zoom >= this.lodSettings.mediumDetailZoom) {
      return ElementLOD.MEDIUM_DETAIL;
    } else if (zoom >= this.lodSettings.lowDetailZoom) {
      return ElementLOD.LOW_DETAIL;
    } else if (zoom >= this.lodSettings.hideZoom) {
      return ElementLOD.LOW_DETAIL;
    } else {
      return ElementLOD.HIDDEN;
    }
  }

  shouldRenderElement(element: AnyWhiteboardElement): boolean {
    const lod = this.getElementLOD(element);
    return lod !== ElementLOD.HIDDEN;
  }

  cullingStats(totalElements: number, visibleElements: AnyWhiteboardElement[]): ViewportCullingStats {
    const visibleCount = visibleElements.length;
    const culledCount = totalElements - visibleCount;
    
    let lodReductions = 0;
    let renderTimeSaved = 0;

    for (const element of visibleElements) {
      const lod = this.getElementLOD(element);
      if (lod !== ElementLOD.FULL_DETAIL) {
        lodReductions++;
        // Estimate render time saved based on LOD
        switch (lod) {
          case ElementLOD.MEDIUM_DETAIL:
            renderTimeSaved += 0.3; // 30% less render time
            break;
          case ElementLOD.LOW_DETAIL:
            renderTimeSaved += 0.6; // 60% less render time
            break;
        }
      }
    }

    return {
      totalElements,
      visibleElements: visibleCount,
      culledElements: culledCount,
      lodReductions,
      renderTimeSaved
    };
  }

  updateLODSettings(settings: Partial<LODSettings>): void {
    this.lodSettings = { ...this.lodSettings, ...settings };
  }
}

// Object Pool Implementation
export class ObjectPool<T extends PoolableObject> {
  private available: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private stats: ObjectPoolStats;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10
  ) {
    this.factory = factory;
    this.reset = reset;
    this.stats = {
      totalCreated: 0,
      currentlyPooled: 0,
      currentlyInUse: 0,
      peakUsage: 0,
      hitRate: 0
    };

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      this.available.push(obj);
      this.stats.totalCreated++;
    }
    this.stats.currentlyPooled = initialSize;
  }

  acquire(): T {
    let obj: T;
    
    if (this.available.length > 0) {
      obj = this.available.pop()!;
      this.stats.currentlyPooled--;
      this.stats.hitRate = (this.stats.hitRate * 0.9) + (0.1 * 1); // Exponential moving average
    } else {
      obj = this.factory();
      this.stats.totalCreated++;
      this.stats.hitRate = (this.stats.hitRate * 0.9) + (0.1 * 0); // Cache miss
    }

    this.stats.currentlyInUse++;
    this.stats.peakUsage = Math.max(this.stats.peakUsage, this.stats.currentlyInUse);

    return obj;
  }

  release(obj: T): void {
    this.reset(obj);
    obj.reset();
    this.available.push(obj);
    this.stats.currentlyPooled++;
    this.stats.currentlyInUse--;
  }

  size(): number {
    return this.stats.totalCreated;
  }

  availableCount(): number {
    return this.available.length;
  }

  getStats(): ObjectPoolStats {
    return { ...this.stats };
  }

  clear(): void {
    this.available = [];
    this.stats.currentlyPooled = 0;
    this.stats.currentlyInUse = 0;
  }
}

// Memory Pool Manager for common whiteboard objects
export class MemoryPools {
  public elements: ObjectPool<any>;
  public points: ObjectPool<WhiteboardPoint & PoolableObject>;
  public bounds: ObjectPool<WhiteboardBounds & PoolableObject>;
  public events: ObjectPool<any>;

  constructor() {
    this.points = new ObjectPool<WhiteboardPoint & PoolableObject>(
      () => ({ x: 0, y: 0, reset() { this.x = 0; this.y = 0; } }),
      (obj) => { obj.x = 0; obj.y = 0; },
      50
    );

    this.bounds = new ObjectPool<WhiteboardBounds & PoolableObject>(
      () => ({ x: 0, y: 0, width: 0, height: 0, reset() { this.x = 0; this.y = 0; this.width = 0; this.height = 0; } }),
      (obj) => { obj.x = 0; obj.y = 0; obj.width = 0; obj.height = 0; },
      50
    );

    // Additional pools can be added for elements and events as needed
    this.elements = new ObjectPool<any>(
      () => ({ reset() {} }),
      () => {},
      20
    );

    this.events = new ObjectPool<any>(
      () => ({ reset() {} }),
      () => {},
      30
    );
  }

  getOverallStats(): { [key: string]: ObjectPoolStats } {
    return {
      points: this.points.getStats(),
      bounds: this.bounds.getStats(),
      elements: this.elements.getStats(),
      events: this.events.getStats()
    };
  }

  clearAll(): void {
    this.points.clear();
    this.bounds.clear();
    this.elements.clear();
    this.events.clear();
  }
}

// Advanced Drawing Tools - Phase 1b Implementation
export class BezierCurveFitter {
  private tolerance: number = 2.0;

  fitCurve(points: WhiteboardPoint[], tolerance: number = this.tolerance): import('./whiteboard-types').BezierCurve[] {
    if (points.length < 4) return [];
    
    const curves: import('./whiteboard-types').BezierCurve[] = [];
    let currentIndex = 0;
    
    while (currentIndex < points.length - 3) {
      const segment = points.slice(currentIndex, currentIndex + 4);
      const curve = this.fitCubicBezier(segment, tolerance);
      curves.push(curve);
      currentIndex += 3; // Overlap by 1 point for smooth curves
    }
    
    return curves;
  }

  optimizePath(points: WhiteboardPoint[]): WhiteboardPoint[] {
    if (points.length <= 2) return points;
    
    const optimized: WhiteboardPoint[] = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];
      
      // Remove points that don't add significant curvature
      const angle = this.calculateAngle(prev, current, next);
      if (Math.abs(angle) > 0.1) { // Threshold for significant direction change
        optimized.push(current);
      }
    }
    
    optimized.push(points[points.length - 1]);
    return optimized;
  }

  simplifyPath(points: WhiteboardPoint[], tolerance: number = 2.0): WhiteboardPoint[] {
    if (points.length <= 2) return points;
    return this.douglasPeucker(points, tolerance);
  }

  private fitCubicBezier(points: WhiteboardPoint[], tolerance: number): import('./whiteboard-types').BezierCurve {
    const start = points[0];
    const end = points[points.length - 1];
    
    // Calculate control points using chord parameterization
    const totalLength = this.getTotalLength(points);
    const t1 = this.getChordParameterization(points, 1) / totalLength;
    const t2 = this.getChordParameterization(points, points.length - 2) / totalLength;
    
    const tangent1 = this.getTangent(points, 0);
    const tangent2 = this.getTangent(points, points.length - 1);
    
    const control1 = {
      x: start.x + tangent1.x * t1 * WhiteboardGeometry.distance(start, end) / 3,
      y: start.y + tangent1.y * t1 * WhiteboardGeometry.distance(start, end) / 3
    };
    
    const control2 = {
      x: end.x - tangent2.x * t2 * WhiteboardGeometry.distance(start, end) / 3,
      y: end.y - tangent2.y * t2 * WhiteboardGeometry.distance(start, end) / 3
    };

    return {
      startPoint: start,
      controlPoint1: control1,
      controlPoint2: control2,
      endPoint: end,
      length: totalLength
    };
  }

  private douglasPeucker(points: WhiteboardPoint[], tolerance: number): WhiteboardPoint[] {
    if (points.length <= 2) return points;
    
    let maxDistance = 0;
    let maxIndex = 0;
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.distanceToLine(points[i], points[0], points[points.length - 1]);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    if (maxDistance > tolerance) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
      return [...left.slice(0, -1), ...right];
    } else {
      return [points[0], points[points.length - 1]];
    }
  }

  private distanceToLine(point: WhiteboardPoint, lineStart: WhiteboardPoint, lineEnd: WhiteboardPoint): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return WhiteboardGeometry.distance(point, lineStart);
    
    const param = dot / lenSq;
    let closestPoint: WhiteboardPoint;
    
    if (param < 0) {
      closestPoint = lineStart;
    } else if (param > 1) {
      closestPoint = lineEnd;
    } else {
      closestPoint = {
        x: lineStart.x + param * C,
        y: lineStart.y + param * D
      };
    }
    
    return WhiteboardGeometry.distance(point, closestPoint);
  }

  private calculateAngle(p1: WhiteboardPoint, p2: WhiteboardPoint, p3: WhiteboardPoint): number {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const det = v1.x * v2.y - v1.y * v2.x;
    
    return Math.atan2(det, dot);
  }

  private getTotalLength(points: WhiteboardPoint[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += WhiteboardGeometry.distance(points[i - 1], points[i]);
    }
    return length;
  }

  private getChordParameterization(points: WhiteboardPoint[], index: number): number {
    let length = 0;
    for (let i = 1; i <= index; i++) {
      length += WhiteboardGeometry.distance(points[i - 1], points[i]);
    }
    return length;
  }

  private getTangent(points: WhiteboardPoint[], index: number): WhiteboardPoint {
    if (index === 0) {
      const dx = points[1].x - points[0].x;
      const dy = points[1].y - points[0].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      return { x: dx / length, y: dy / length };
    } else if (index === points.length - 1) {
      const dx = points[index].x - points[index - 1].x;
      const dy = points[index].y - points[index - 1].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      return { x: dx / length, y: dy / length };
    } else {
      const dx = points[index + 1].x - points[index - 1].x;
      const dy = points[index + 1].y - points[index - 1].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      return { x: dx / length, y: dy / length };
    }
  }
}

export class PressureSensitivityHandler {
  private baselineForce: number = 0.5;
  private maxForce: number = 1.0;
  private minForce: number = 0.1;

  processPressure(event: PointerEvent): number {
    // Handle different pointer types
    if (event.pointerType === 'pen' && 'pressure' in event) {
      return Math.max(this.minForce, Math.min(this.maxForce, event.pressure));
    } else if (event.pointerType === 'touch' && 'force' in event) {
      // @ts-ignore - force property may not be in all browsers
      const force = event.force || this.baselineForce;
      return Math.max(this.minForce, Math.min(this.maxForce, force));
    }
    
    // Fallback to simulated pressure based on velocity
    return this.simulatePressureFromVelocity(event);
  }

  adaptStrokeWidth(pressure: number, baseWidth: number): number {
    // Non-linear scaling for more natural feel
    const normalizedPressure = Math.pow(pressure, 0.7);
    return baseWidth * (0.3 + normalizedPressure * 0.7);
  }

  adaptOpacity(pressure: number, baseOpacity: number): number {
    // Subtle opacity variation
    const normalizedPressure = Math.pow(pressure, 0.5);
    return baseOpacity * (0.7 + normalizedPressure * 0.3);
  }

  private simulatePressureFromVelocity(event: PointerEvent): number {
    // Calculate velocity-based pressure simulation
    if ('movementX' in event && 'movementY' in event) {
      const velocity = Math.sqrt(event.movementX ** 2 + event.movementY ** 2);
      const normalizedVelocity = Math.min(velocity / 20, 1); // Normalize to 0-1
      return this.baselineForce + (1 - normalizedVelocity) * 0.3;
    }
    return this.baselineForce;
  }
}

export class ShapeRecognizer {
  public confidence: number = 0;
  public supportedShapes: import('./whiteboard-types').RecognizedShapeType[] = [
    'line', 'rectangle', 'circle', 'triangle', 'arrow', 'star'
  ];

  recognizeShape(points: WhiteboardPoint[]): import('./whiteboard-types').RecognizedShape | null {
    if (points.length < 3) return null;

    const simplified = this.simplifyPoints(points);
    const bounds = this.getBounds(simplified);
    
    // Try different shape recognition algorithms
    const recognizers = [
      () => this.recognizeLine(simplified, bounds),
      () => this.recognizeRectangle(simplified, bounds),
      () => this.recognizeCircle(simplified, bounds),
      () => this.recognizeTriangle(simplified, bounds),
      () => this.recognizeArrow(simplified, bounds),
      () => this.recognizeStar(simplified, bounds)
    ];

    let bestMatch: import('./whiteboard-types').RecognizedShape | null = null;
    let bestConfidence = 0;

    for (const recognizer of recognizers) {
      const result = recognizer();
      if (result && result.confidence > bestConfidence) {
        bestMatch = result;
        bestConfidence = result.confidence;
      }
    }

    this.confidence = bestConfidence;
    return bestMatch;
  }

  private simplifyPoints(points: WhiteboardPoint[]): WhiteboardPoint[] {
    const fitter = new BezierCurveFitter();
    return fitter.simplifyPath(points, 5.0);
  }

  private getBounds(points: WhiteboardPoint[]): WhiteboardBounds {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  }

  private recognizeLine(points: WhiteboardPoint[], bounds: WhiteboardBounds): import('./whiteboard-types').RecognizedShape | null {
    if (points.length < 2) return null;

    const start = points[0];
    const end = points[points.length - 1];
    
    // Check if points roughly follow a straight line
    let totalDeviation = 0;
    for (const point of points) {
      const deviation = this.distanceToLine(point, start, end);
      totalDeviation += deviation;
    }
    
    const avgDeviation = totalDeviation / points.length;
    const lineLength = WhiteboardGeometry.distance(start, end);
    const confidence = Math.max(0, 1 - (avgDeviation / (lineLength * 0.1)));

    if (confidence > 0.7) {
      return {
        type: 'line',
        bounds,
        points: [start, end],
        confidence,
        suggestedElement: {
          type: 'line',
          position: start,
          size: { width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) }
        }
      };
    }

    return null;
  }

  private recognizeRectangle(points: WhiteboardPoint[], bounds: WhiteboardBounds): import('./whiteboard-types').RecognizedShape | null {
    if (points.length < 4) return null;

    // Check for 4 corners and rectangular shape
    const corners = this.findCorners(points);
    if (corners.length !== 4) return null;

    const confidence = this.calculateRectangleConfidence(corners, bounds);
    
    if (confidence > 0.7) {
      return {
        type: 'rectangle',
        bounds,
        points: corners,
        confidence,
        suggestedElement: {
          type: 'shape',
          position: { x: bounds.x, y: bounds.y },
          size: { width: bounds.width, height: bounds.height }
        }
      };
    }

    return null;
  }

  private recognizeCircle(points: WhiteboardPoint[], bounds: WhiteboardBounds): import('./whiteboard-types').RecognizedShape | null {
    if (points.length < 6) return null;

    const center = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    };
    
    const avgRadius = Math.min(bounds.width, bounds.height) / 2;
    
    // Check how well points fit a circle
    let totalDeviation = 0;
    for (const point of points) {
      const distance = WhiteboardGeometry.distance(point, center);
      totalDeviation += Math.abs(distance - avgRadius);
    }
    
    const avgDeviation = totalDeviation / points.length;
    const confidence = Math.max(0, 1 - (avgDeviation / avgRadius));

    if (confidence > 0.7) {
      return {
        type: 'circle',
        bounds,
        points: [center],
        confidence,
        suggestedElement: {
          type: 'shape',
          position: { x: bounds.x, y: bounds.y },
          size: { width: bounds.width, height: bounds.height }
        }
      };
    }

    return null;
  }

  private recognizeTriangle(points: WhiteboardPoint[], bounds: WhiteboardBounds): import('./whiteboard-types').RecognizedShape | null {
    if (points.length < 3) return null;

    const corners = this.findCorners(points, 3);
    if (corners.length !== 3) return null;

    const confidence = this.calculateTriangleConfidence(corners, points);
    
    if (confidence > 0.7) {
      return {
        type: 'triangle',
        bounds,
        points: corners,
        confidence,
        suggestedElement: {
          type: 'shape',
          position: { x: bounds.x, y: bounds.y },
          size: { width: bounds.width, height: bounds.height }
        }
      };
    }

    return null;
  }

  private recognizeArrow(points: WhiteboardPoint[], bounds: WhiteboardBounds): import('./whiteboard-types').RecognizedShape | null {
    if (points.length < 4) return null;

    // Look for arrow pattern: shaft + arrowhead
    const start = points[0];
    const end = points[points.length - 1];
    
    // Check for arrowhead pattern at the end
    const confidence = this.calculateArrowConfidence(points);
    
    if (confidence > 0.6) {
      return {
        type: 'arrow',
        bounds,
        points: [start, end],
        confidence,
        suggestedElement: {
          type: 'arrow',
          position: start,
          size: { width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) }
        }
      };
    }

    return null;
  }

  private recognizeStar(points: WhiteboardPoint[], bounds: WhiteboardBounds): import('./whiteboard-types').RecognizedShape | null {
    if (points.length < 10) return null;

    const center = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    };

    // Look for star pattern with alternating distances from center
    const confidence = this.calculateStarConfidence(points, center);
    
    if (confidence > 0.7) {
      return {
        type: 'star',
        bounds,
        points: [center],
        confidence,
        suggestedElement: {
          type: 'shape',
          position: { x: bounds.x, y: bounds.y },
          size: { width: bounds.width, height: bounds.height }
        }
      };
    }

    return null;
  }

  private distanceToLine(point: WhiteboardPoint, lineStart: WhiteboardPoint, lineEnd: WhiteboardPoint): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return WhiteboardGeometry.distance(point, lineStart);
    
    const param = dot / lenSq;
    let closestPoint: WhiteboardPoint;
    
    if (param < 0) {
      closestPoint = lineStart;
    } else if (param > 1) {
      closestPoint = lineEnd;
    } else {
      closestPoint = {
        x: lineStart.x + param * C,
        y: lineStart.y + param * D
      };
    }
    
    return WhiteboardGeometry.distance(point, closestPoint);
  }

  private findCorners(points: WhiteboardPoint[], expectedCount: number = 4): WhiteboardPoint[] {
    // Simplified corner detection based on angle changes
    const corners: WhiteboardPoint[] = [];
    const threshold = Math.PI / 4; // 45 degrees
    
    for (let i = 1; i < points.length - 1; i++) {
      const angle = Math.abs(this.calculateAngle(points[i - 1], points[i], points[i + 1]));
      if (angle > threshold) {
        corners.push(points[i]);
      }
    }
    
    // Add start and end points
    corners.unshift(points[0]);
    corners.push(points[points.length - 1]);
    
    return corners.slice(0, expectedCount);
  }

  private calculateAngle(p1: WhiteboardPoint, p2: WhiteboardPoint, p3: WhiteboardPoint): number {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const det = v1.x * v2.y - v1.y * v2.x;
    
    return Math.atan2(det, dot);
  }

  private calculateRectangleConfidence(corners: WhiteboardPoint[], bounds: WhiteboardBounds): number {
    if (corners.length !== 4) return 0;
    
    // Check if corners form a rectangle
    const expectedCorners = [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height }
    ];
    
    let totalDeviation = 0;
    for (let i = 0; i < 4; i++) {
      const minDistance = Math.min(
        ...expectedCorners.map(expected => WhiteboardGeometry.distance(corners[i], expected))
      );
      totalDeviation += minDistance;
    }
    
    const avgDeviation = totalDeviation / 4;
    const diagonalLength = Math.sqrt(bounds.width ** 2 + bounds.height ** 2);
    
    return Math.max(0, 1 - (avgDeviation / (diagonalLength * 0.1)));
  }

  private calculateTriangleConfidence(corners: WhiteboardPoint[], points: WhiteboardPoint[]): number {
    // Check how well the points follow the triangle edges
    let totalDeviation = 0;
    
    for (const point of points) {
      const distances = [
        this.distanceToLine(point, corners[0], corners[1]),
        this.distanceToLine(point, corners[1], corners[2]),
        this.distanceToLine(point, corners[2], corners[0])
      ];
      totalDeviation += Math.min(...distances);
    }
    
    const avgDeviation = totalDeviation / points.length;
    const maxEdgeLength = Math.max(
      WhiteboardGeometry.distance(corners[0], corners[1]),
      WhiteboardGeometry.distance(corners[1], corners[2]),
      WhiteboardGeometry.distance(corners[2], corners[0])
    );
    
    return Math.max(0, 1 - (avgDeviation / (maxEdgeLength * 0.1)));
  }

  private calculateArrowConfidence(points: WhiteboardPoint[]): number {
    // Simplified arrow detection - look for general arrow shape
    const start = points[0];
    const end = points[points.length - 1];
    const mainDirection = WhiteboardGeometry.angle(start, end);
    
    // Check if the stroke roughly follows an arrow pattern
    let confidence = 0.5; // Base confidence for having start and end points
    
    // Check for direction consistency in the main shaft
    const midPoint = Math.floor(points.length / 2);
    for (let i = 1; i < midPoint; i++) {
      const segmentDirection = WhiteboardGeometry.angle(points[i - 1], points[i]);
      const angleDiff = Math.abs(segmentDirection - mainDirection);
      if (angleDiff < Math.PI / 6) { // Within 30 degrees
        confidence += 0.1;
      }
    }
    
    return Math.min(confidence, 1.0);
  }

  private calculateStarConfidence(points: WhiteboardPoint[], center: WhiteboardPoint): number {
    // Check for alternating pattern of distances from center
    const distances = points.map(p => WhiteboardGeometry.distance(p, center));
    
    // Look for alternating high/low pattern
    let alternations = 0;
    for (let i = 1; i < distances.length - 1; i++) {
      const prev = distances[i - 1];
      const curr = distances[i];
      const next = distances[i + 1];
      
      if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
        alternations++;
      }
    }
    
    const expectedAlternations = Math.floor(distances.length / 2);
    return Math.min(alternations / expectedAlternations, 1.0);
  }
}
// File Format & Compression - Phase 1c Implementation
export class FileFormatManagerImpl implements FileFormatManager {
  private readonly VERSION = '2.0.0';
  
  async compress(data: WhiteboardState): Promise<ArrayBuffer> {
    const optimizedFormat = this.createOptimizedFormat(data);
    const jsonString = JSON.stringify(optimizedFormat);
    
    // Use browser's built-in compression APIs
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(jsonString);
    
    // Try compression stream if available (modern browsers)
    if ('CompressionStream' in window) {
      try {
        const compressionStream = new CompressionStream('gzip');
        const writer = compressionStream.writable.getWriter();
        const reader = compressionStream.readable.getReader();
        
        writer.write(uint8Array);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        return this.concatenateArrays(chunks).buffer;
      } catch (error) {
        console.warn('Compression failed, using uncompressed data:', error);
      }
    }
    
    return uint8Array.buffer;
  }

  async decompress(data: ArrayBuffer): Promise<WhiteboardState> {
    let jsonString: string;
    
    // Try decompression if the data appears to be compressed
    if ('DecompressionStream' in window) {
      try {
        const decompressionStream = new DecompressionStream('gzip');
        const writer = decompressionStream.writable.getWriter();
        const reader = decompressionStream.readable.getReader();
        
        writer.write(new Uint8Array(data));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const decompressed = this.concatenateArrays(chunks);
        const decoder = new TextDecoder();
        jsonString = decoder.decode(decompressed);
      } catch (error) {
        // Fallback to treating as uncompressed data
        const decoder = new TextDecoder();
        jsonString = decoder.decode(data);
      }
    } else {
      const decoder = new TextDecoder();
      jsonString = decoder.decode(data);
    }
    
    const optimizedFormat = JSON.parse(jsonString) as OptimizedFileFormat;
    return this.restoreWhiteboardState(optimizedFormat);
  }

  async validate(data: ArrayBuffer): Promise<boolean> {
    try {
      const state = await this.decompress(data);
      return this.isValidWhiteboardState(state);
    } catch (error) {
      return false;
    }
  }

  async migrate(data: ArrayBuffer, fromVersion: string): Promise<ArrayBuffer> {
    const state = await this.decompress(data);
    const migratedState = this.performMigration(state, fromVersion, this.VERSION);
    return this.compress(migratedState);
  }

  createChecksum(data: ArrayBuffer): string {
    // Simple checksum using crypto API if available
    if ('crypto' in window && 'subtle' in window.crypto) {
      return window.crypto.subtle.digest('SHA-256', data)
        .then(hash => Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''));
    }
    
    // Fallback to simple hash
    const uint8Array = new Uint8Array(data);
    let hash = 0;
    for (let i = 0; i < uint8Array.length; i++) {
      hash = ((hash << 5) - hash + uint8Array[i]) & 0xffffffff;
    }
    return hash.toString(16);
  }

  private createOptimizedFormat(data: WhiteboardState): OptimizedFileFormat {
    const now = Date.now();
    
    return {
      header: {
        version: this.VERSION,
        compression: 'gzip',
        elementCount: data.elements.length,
        canvasBounds: { x: 0, y: 0, width: 0, height: 0 }, // Will be calculated
        created: new Date(data.createdAt).getTime(),
        modified: now,
        checksum: '' // Will be calculated after serialization
      },
      spatialIndex: this.serializeQuadTree(data),
      elements: this.compressElements(data.elements),
      metadata: {
        title: data.name,
        description: data.description || '',
        author: data.metadata.author,
        tags: data.metadata.tags,
        lastModified: now,
        version: data.metadata.version
      }
    };
  }

  private serializeQuadTree(data: WhiteboardState): SerializedQuadTree {
    // Create a simplified serialization of the spatial structure
    return {
      bounds: { x: -10000, y: -10000, width: 20000, height: 20000 },
      maxElements: 10,
      maxDepth: 8,
      nodes: [] // Simplified - can be rebuilt on load
    };
  }

  private compressElements(elements: AnyWhiteboardElement[]): CompressedElementData {
    const jsonString = JSON.stringify(elements);
    const originalSize = new TextEncoder().encode(jsonString).length;
    
    // For now, use JSON format - could be optimized with binary format
    return {
      format: 'json',
      size: originalSize,
      originalSize,
      compressionRatio: 1.0,
      data: jsonString
    };
  }

  private restoreWhiteboardState(format: OptimizedFileFormat): WhiteboardState {
    const elements = this.decompressElements(format.elements);
    const now = new Date().toISOString();
    
    return {
      id: `whiteboard-${Date.now()}`,
      name: format.metadata.title,
      description: format.metadata.description,
      elements,
      groups: [],
      layers: [{
        id: 'default',
        name: 'Default Layer',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        elementIds: elements.map(el => el.id),
        order: 0
      }],
      viewport: { x: 0, y: 0, zoom: 1, bounds: format.header.canvasBounds },
      settings: {
        grid: {
          enabled: true,
          size: 20,
          snapEnabled: false,
          snapThreshold: 10,
          color: '#e5e7eb',
          opacity: 0.5,
          type: 'dots'
        },
        backgroundColor: '#ffffff',
        rulers: { enabled: false, units: 'px' },
        guides: { enabled: true, snapDistance: 5, color: '#3b82f6' },
        performance: {
          virtualizeElements: true,
          maxVisibleElements: 1000,
          renderQuality: 'high'
        }
      },
      selection: { elementIds: [], handles: { visible: true, resize: true, rotate: true } },
      history: { undoStack: [], redoStack: [], maxEntries: 50 },
      metadata: {
        author: format.metadata.author,
        collaborators: [],
        version: format.metadata.version,
        tags: format.metadata.tags,
        isPublic: false,
        lastAutoSave: now
      },
      createdAt: new Date(format.header.created).toISOString(),
      updatedAt: now
    };
  }

  private decompressElements(compressed: CompressedElementData): AnyWhiteboardElement[] {
    if (compressed.format === 'json') {
      return JSON.parse(compressed.data as string);
    }
    return [];
  }

  private concatenateArrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    
    return result;
  }

  private isValidWhiteboardState(state: any): boolean {
    return state && 
           typeof state.id === 'string' &&
           Array.isArray(state.elements) &&
           typeof state.viewport === 'object' &&
           typeof state.settings === 'object';
  }

  private performMigration(state: WhiteboardState, fromVersion: string, toVersion: string): WhiteboardState {
    // Implement version-specific migrations here
    return state; // For now, no migration needed
  }
}

// GPU Rendering Preparation - Phase 1d Implementation
export class RenderingBackendImpl implements RenderingBackend {
  public type: 'dom' | 'canvas2d' | 'webgl' | 'webgpu';
  public capabilities: RenderingCapabilities;

  constructor(type: 'dom' | 'canvas2d' | 'webgl' | 'webgpu') {
    this.type = type;
    this.capabilities = this.detectCapabilities();
  }

  async initialize(): Promise<boolean> {
    switch (this.type) {
      case 'webgpu':
        return this.initializeWebGPU();
      case 'webgl':
        return this.initializeWebGL();
      case 'canvas2d':
        return this.initializeCanvas2D();
      case 'dom':
        return this.initializeDOM();
      default:
        return false;
    }
  }

  render(elements: WhiteboardElement[], viewport: WhiteboardBounds): void {
    // Implementation would depend on the specific rendering backend
    switch (this.type) {
      case 'webgpu':
        this.renderWebGPU(elements, viewport);
        break;
      case 'webgl':
        this.renderWebGL(elements, viewport);
        break;
      case 'canvas2d':
        this.renderCanvas2D(elements, viewport);
        break;
      case 'dom':
        this.renderDOM(elements, viewport);
        break;
    }
  }

  dispose(): void {
    // Cleanup resources based on backend type
  }

  private detectCapabilities(): RenderingCapabilities {
    const canvas = document.createElement('canvas');
    
    // Check WebGL capabilities
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (gl) {
      return {
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        supportsInstancedRendering: !!gl.getExtension('ANGLE_instanced_arrays'),
        supportsComputeShaders: false, // WebGL doesn't support compute shaders
        maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        memoryLimits: {
          vertices: 65536,
          textures: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          uniforms: gl.getParameter(gl.MAX_UNIFORM_VECTORS)
        }
      };
    }

    // Fallback capabilities for 2D context
    return {
      maxTextureSize: 4096,
      supportsInstancedRendering: false,
      supportsComputeShaders: false,
      maxVertexAttributes: 16,
      memoryLimits: {
        vertices: 10000,
        textures: 4096,
        uniforms: 256
      }
    };
  }

  private async initializeWebGPU(): Promise<boolean> {
    if (!('gpu' in navigator)) return false;
    
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return false;
      
      const device = await adapter.requestDevice();
      return !!device;
    } catch (error) {
      return false;
    }
  }

  private initializeWebGL(): Promise<boolean> {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return Promise.resolve(!!gl);
  }

  private initializeCanvas2D(): Promise<boolean> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return Promise.resolve(!!ctx);
  }

  private initializeDOM(): Promise<boolean> {
    return Promise.resolve(true); // DOM is always available
  }

  private renderWebGPU(elements: WhiteboardElement[], viewport: WhiteboardBounds): void {
    // WebGPU rendering implementation would go here
    console.log('Rendering with WebGPU:', elements.length, 'elements');
  }

  private renderWebGL(elements: WhiteboardElement[], viewport: WhiteboardBounds): void {
    // WebGL rendering implementation would go here
    console.log('Rendering with WebGL:', elements.length, 'elements');
  }

  private renderCanvas2D(elements: WhiteboardElement[], viewport: WhiteboardBounds): void {
    // Canvas 2D rendering implementation would go here
    console.log('Rendering with Canvas 2D:', elements.length, 'elements');
  }

  private renderDOM(elements: WhiteboardElement[], viewport: WhiteboardBounds): void {
    // DOM rendering implementation would go here
    console.log('Rendering with DOM:', elements.length, 'elements');
  }
}

export class HybridRendererImpl implements HybridRenderer {
  private backends: Map<string, RenderingBackend> = new Map();
  private currentBackend: RenderingBackend | null = null;

  constructor() {
    this.initializeBackends();
  }

  selectOptimalBackend(elements: WhiteboardElement[]): RenderingBackend {
    const elementCount = elements.length;
    
    // Choose backend based on element count and complexity
    if (elementCount > 1000 && this.backends.has('webgpu')) {
      return this.backends.get('webgpu')!;
    } else if (elementCount > 500 && this.backends.has('webgl')) {
      return this.backends.get('webgl')!;
    } else if (elementCount > 100 && this.backends.has('canvas2d')) {
      return this.backends.get('canvas2d')!;
    } else {
      return this.backends.get('dom')!;
    }
  }

  fallbackToCompatibleBackend(): RenderingBackend {
    // Try backends in order of preference
    const fallbackOrder = ['canvas2d', 'dom'];
    
    for (const type of fallbackOrder) {
      const backend = this.backends.get(type);
      if (backend) return backend;
    }
    
    return this.backends.get('dom')!; // DOM is always available
  }

  renderWithBackend(backend: RenderingBackend, elements: WhiteboardElement[]): void {
    if (this.currentBackend !== backend) {
      this.currentBackend?.dispose();
      this.currentBackend = backend;
    }
    
    const viewport = { x: 0, y: 0, width: 0, height: 0 }; // Would be provided by caller
    backend.render(elements, viewport);
  }

  private async initializeBackends(): Promise<void> {
    const backendTypes: Array<'dom' | 'canvas2d' | 'webgl' | 'webgpu'> = 
      ['dom', 'canvas2d', 'webgl', 'webgpu'];
    
    for (const type of backendTypes) {
      const backend = new RenderingBackendImpl(type);
      if (await backend.initialize()) {
        this.backends.set(type, backend);
      }
    }
  }
}

// Advanced Export System - Phase 1e Implementation
export class AdvancedExportEngineImpl implements AdvancedExportEngine {
  async exportToSVG(elements: WhiteboardElement[], options: AdvancedExportOptions): Promise<string> {
    const startTime = performance.now();
    const bounds = this.calculateBounds(elements, options.bounds);
    
    let svg = `<svg width="${bounds.width}" height="${bounds.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    if (!options.backgroundTransparent) {
      svg += `<rect width="100%" height="100%" fill="white"/>`;
    }
    
    // Sort elements by layer for proper rendering order
    const sortedElements = this.sortElementsByLayer(elements);
    
    for (const element of sortedElements) {
      if (!options.includeHiddenElements && !element.metadata.visible) continue;
      svg += this.elementToSVG(element, bounds);
    }
    
    svg += '</svg>';
    
    const processingTime = performance.now() - startTime;
    console.log(`SVG export completed in ${processingTime.toFixed(2)}ms`);
    
    return svg;
  }

  async exportToPNG(elements: WhiteboardElement[], options: AdvancedExportOptions): Promise<Blob> {
    const startTime = performance.now();
    const bounds = this.calculateBounds(elements, options.bounds);
    
    // Create a canvas for rendering
    const canvas = document.createElement('canvas');
    const scale = options.quality;
    canvas.width = bounds.width * scale;
    canvas.height = bounds.height * scale;
    
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.translate(-bounds.x, -bounds.y);
    
    if (!options.backgroundTransparent) {
      ctx.fillStyle = 'white';
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
    
    // Render elements to canvas
    const sortedElements = this.sortElementsByLayer(elements);
    for (const element of sortedElements) {
      if (!options.includeHiddenElements && !element.metadata.visible) continue;
      this.renderElementToCanvas(ctx, element);
    }
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const processingTime = performance.now() - startTime;
        console.log(`PNG export completed in ${processingTime.toFixed(2)}ms`);
        resolve(blob!);
      }, 'image/png', options.quality);
    });
  }

  async exportToPDF(elements: WhiteboardElement[], options: AdvancedExportOptions): Promise<ArrayBuffer> {
    // PDF export would require a PDF library like pdf-lib
    // For now, return a placeholder
    const startTime = performance.now();
    const bounds = this.calculateBounds(elements, options.bounds);
    
    // Placeholder PDF structure
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${bounds.width} ${bounds.height}]
>>
endobj

xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
200
%%EOF`;

    const processingTime = performance.now() - startTime;
    console.log(`PDF export completed in ${processingTime.toFixed(2)}ms`);
    
    return new TextEncoder().encode(pdfContent).buffer;
  }

  async exportToJSON(state: WhiteboardState, options: AdvancedExportOptions): Promise<string> {
    const startTime = performance.now();
    
    let elementsToExport = state.elements;
    
    if (options.bounds) {
      elementsToExport = elementsToExport.filter(element => {
        const elementBounds = WhiteboardCoordinates.getElementBounds(element);
        return WhiteboardCoordinates.boundsIntersect(elementBounds, options.bounds!);
      });
    }
    
    if (!options.includeHiddenElements) {
      elementsToExport = elementsToExport.filter(element => element.metadata.visible);
    }
    
    const exportData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      elements: elementsToExport,
      viewport: state.viewport,
      settings: state.settings,
      metadata: state.metadata
    };
    
    const result = JSON.stringify(exportData, null, options.quality > 0.8 ? 2 : 0);
    
    const processingTime = performance.now() - startTime;
    console.log(`JSON export completed in ${processingTime.toFixed(2)}ms`);
    
    return result;
  }

  async exportMultipleFormats(
    elements: WhiteboardElement[], 
    formats: AdvancedExportOptions[]
  ): Promise<Map<string, ExportResult>> {
    const results = new Map<string, ExportResult>();
    
    if (formats.some(f => f.parallelProcessing)) {
      // Parallel processing
      const promises = formats.map(async (options) => {
        const startTime = performance.now();
        let data: Blob | string | ArrayBuffer;
        
        switch (options.format) {
          case 'svg':
            data = await this.exportToSVG(elements, options);
            break;
          case 'png':
            data = await this.exportToPNG(elements, options);
            break;
          case 'pdf':
            data = await this.exportToPDF(elements, options);
            break;
          case 'json':
            // Need a WhiteboardState for JSON export
            data = '{}'; // Placeholder
            break;
          default:
            throw new Error(`Unsupported format: ${options.format}`);
        }
        
        const processingTime = performance.now() - startTime;
        const size = typeof data === 'string' ? 
          new TextEncoder().encode(data).length : 
          data instanceof Blob ? data.size : data.byteLength;
        
        return {
          format: options.format,
          result: {
            format: options.format,
            data,
            size,
            processingTime,
            quality: options.quality
          }
        };
      });
      
      const completed = await Promise.all(promises);
      completed.forEach(({ format, result }) => {
        results.set(format, result);
      });
    } else {
      // Sequential processing
      for (const options of formats) {
        const startTime = performance.now();
        let data: Blob | string | ArrayBuffer;
        
        switch (options.format) {
          case 'svg':
            data = await this.exportToSVG(elements, options);
            break;
          case 'png':
            data = await this.exportToPNG(elements, options);
            break;
          case 'pdf':
            data = await this.exportToPDF(elements, options);
            break;
          case 'json':
            data = '{}'; // Placeholder
            break;
          default:
            continue;
        }
        
        const processingTime = performance.now() - startTime;
        const size = typeof data === 'string' ? 
          new TextEncoder().encode(data).length : 
          data instanceof Blob ? data.size : data.byteLength;
        
        results.set(options.format, {
          format: options.format,
          data,
          size,
          processingTime,
          quality: options.quality
        });
      }
    }
    
    return results;
  }

  private calculateBounds(elements: WhiteboardElement[], customBounds?: WhiteboardBounds): WhiteboardBounds {
    if (customBounds) return customBounds;
    
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 800, height: 600 };
    }
    
    const bounds = WhiteboardCoordinates.getSelectionBounds(elements);
    return bounds || { x: 0, y: 0, width: 800, height: 600 };
  }

  private sortElementsByLayer(elements: WhiteboardElement[]): WhiteboardElement[] {
    return [...elements].sort((a, b) => a.metadata.layer - b.metadata.layer);
  }

  private elementToSVG(element: WhiteboardElement, bounds: WhiteboardBounds): string {
    // Simplified SVG generation - would need full implementation for each element type
    const relativeX = element.position.x - bounds.x;
    const relativeY = element.position.y - bounds.y;
    
    switch (element.type) {
      case 'sticky-note':
        return `<rect x="${relativeX}" y="${relativeY}" width="${element.size.width}" height="${element.size.height}" fill="${element.style.color.fill}" stroke="${element.style.color.stroke}"/>`;
      case 'text':
        return `<text x="${relativeX}" y="${relativeY}" fill="${element.style.color.fill}">${element.content || ''}</text>`;
      default:
        return '';
    }
  }

  private renderElementToCanvas(ctx: CanvasRenderingContext2D, element: WhiteboardElement): void {
    // Simplified canvas rendering - would need full implementation for each element type
    ctx.save();
    
    switch (element.type) {
      case 'sticky-note':
        ctx.fillStyle = element.style.color.fill;
        ctx.fillRect(element.position.x, element.position.y, element.size.width, element.size.height);
        break;
      case 'text':
        ctx.fillStyle = element.style.color.fill;
        ctx.fillText(element.content || '', element.position.x, element.position.y);
        break;
    }
    
    ctx.restore();
  }
}

// Performance Benchmarking System
export class PerformanceBenchmarkSuite {
  async runBenchmark(elements: WhiteboardElement[]): Promise<PerformanceBenchmark> {
    const results: PerformanceBenchmark = {
      elementCreation: await this.benchmarkElementCreation(),
      spatialQueries: await this.benchmarkSpatialQueries(elements),
      renderTime: await this.benchmarkRenderTime(elements),
      memoryUsage: this.measureMemoryUsage(),
      fileLoadTime: await this.benchmarkFileOperations('load'),
      fileSaveTime: await this.benchmarkFileOperations('save'),
      exportTime: await this.benchmarkExport(elements),
      timestamp: Date.now()
    };
    
    return results;
  }

  private async benchmarkElementCreation(): Promise<number> {
    const iterations = 100;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      WhiteboardElementFactory.createStickyNote(
        { x: Math.random() * 1000, y: Math.random() * 1000 },
        'Test note',
        '#fef3c7'
      );
    }
    
    const endTime = performance.now();
    return (endTime - startTime) / iterations;
  }

  private async benchmarkSpatialQueries(elements: WhiteboardElement[]): Promise<number> {
    const spatialIndex = new QuadTreeSpatialIndex({ x: -1000, y: -1000, width: 2000, height: 2000 });
    elements.forEach(el => spatialIndex.insert(el));
    
    const iterations = 100;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      spatialIndex.query({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        width: 100,
        height: 100
      });
    }
    
    const endTime = performance.now();
    return (endTime - startTime) / iterations;
  }

  private async benchmarkRenderTime(elements: WhiteboardElement[]): Promise<number> {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d')!;
    
    const startTime = performance.now();
    
    // Simulate rendering
    ctx.clearRect(0, 0, 1000, 1000);
    elements.forEach(element => {
      ctx.fillStyle = element.style.color.fill;
      ctx.fillRect(element.position.x, element.position.y, element.size.width, element.size.height);
    });
    
    const endTime = performance.now();
    return endTime - startTime;
  }

  private measureMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private async benchmarkFileOperations(operation: 'load' | 'save'): Promise<number> {
    const startTime = performance.now();
    
    // Simulate file operation
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const endTime = performance.now();
    return endTime - startTime;
  }

  private async benchmarkExport(elements: WhiteboardElement[]): Promise<number> {
    const exporter = new AdvancedExportEngineImpl();
    const startTime = performance.now();
    
    await exporter.exportToSVG(elements, {
      format: 'svg',
      quality: 1.0,
      dpi: 96,
      backgroundTransparent: false,
      includeHiddenElements: false
    });
    
    const endTime = performance.now();
    return endTime - startTime;
  }
}

// Enhanced Memory Pool Manager - Phase 1c Extension
export class WhiteboardMemoryPoolManager implements WhiteboardMemoryPools {
  public points: ObjectPool<WhiteboardPoint & PoolableObject>;
  public bounds: ObjectPool<WhiteboardBounds & PoolableObject>;
  public elements: ObjectPool<WhiteboardElement & PoolableObject>;
  public pathPoints: ObjectPool<WhiteboardPoint[] & PoolableObject>;
  public transformMatrix: ObjectPool<DOMMatrix & PoolableObject>;
  public events: ObjectPool<Event & PoolableObject>;

  constructor() {
    this.points = new ObjectPool<WhiteboardPoint & PoolableObject>(
      () => ({ 
        x: 0, 
        y: 0, 
        reset() { 
          this.x = 0; 
          this.y = 0; 
        } 
      }),
      (obj) => { obj.x = 0; obj.y = 0; },
      100
    );

    this.bounds = new ObjectPool<WhiteboardBounds & PoolableObject>(
      () => ({ 
        x: 0, 
        y: 0, 
        width: 0, 
        height: 0, 
        reset() { 
          this.x = 0; 
          this.y = 0; 
          this.width = 0; 
          this.height = 0; 
        } 
      }),
      (obj) => { obj.x = 0; obj.y = 0; obj.width = 0; obj.height = 0; },
      50
    );

    this.elements = new ObjectPool<WhiteboardElement & PoolableObject>(
      () => this.createPoolableElement(),
      (obj) => this.resetElement(obj),
      25
    );

    this.pathPoints = new ObjectPool<WhiteboardPoint[] & PoolableObject>(
      () => Object.assign([], { reset() { this.length = 0; } }),
      (obj) => { obj.length = 0; },
      30
    );

    this.transformMatrix = new ObjectPool<DOMMatrix & PoolableObject>(
      () => Object.assign(new DOMMatrix(), { reset() { this.setMatrixValue('matrix(1,0,0,1,0,0)'); } }),
      (obj) => { obj.setMatrixValue('matrix(1,0,0,1,0,0)'); },
      20
    );

    this.events = new ObjectPool<Event & PoolableObject>(
      () => Object.assign(new CustomEvent('pool'), { reset() { /* no-op */ } }),
      () => { /* no-op */ },
      50
    );
  }

  private createPoolableElement(): WhiteboardElement & PoolableObject {
    const now = new Date().toISOString();
    return Object.assign({
      id: '',
      type: 'sticky-note' as const,
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
      transform: { rotation: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      style: {
        color: { fill: '#ffffff', stroke: '#000000', opacity: 1 },
        stroke: { width: 1, style: 'solid' as const }
      },
      metadata: {
        layer: 0,
        locked: false,
        visible: true,
        createdBy: '',
        tags: []
      },
      createdAt: now,
      updatedAt: now
    }, {
      reset() {
        this.id = '';
        this.position.x = 0;
        this.position.y = 0;
        this.size.width = 0;
        this.size.height = 0;
      }
    });
  }

  private resetElement(element: WhiteboardElement & PoolableObject): void {
    element.id = '';
    element.position.x = 0;
    element.position.y = 0;
    element.size.width = 0;
    element.size.height = 0;
  }

  getOverallStats(): { [key: string]: ObjectPoolStats } {
    return {
      points: this.points.getStats(),
      bounds: this.bounds.getStats(),
      elements: this.elements.getStats(),
      pathPoints: this.pathPoints.getStats(),
      transformMatrix: this.transformMatrix.getStats(),
      events: this.events.getStats()
    };
  }

  getTotalMemoryUsage(): number {
    const stats = this.getOverallStats();
    return Object.values(stats).reduce((total, stat) => total + stat.currentlyPooled * 64, 0);
  }

  clearAll(): void {
    this.points.clear();
    this.bounds.clear();
    this.elements.clear();
    this.pathPoints.clear();
    this.transformMatrix.clear();
    this.events.clear();
  }
}