/**
 * Node Factory Module with Object Pooling
 * Creates and manages Konva nodes for canvas elements
 */

import Konva from 'konva';
import { calculateHitArea, inscribedSquare, inscribedRectangle } from './geometry';
import { applyTextLayout, getRectangleTextLayout } from './text-layout';
import { CircleTextContract } from './circle-text-contract';
import { debugTextAlignment } from './debug-alignment';
import type { 
  CanvasElement, 
  CircleElement, 
  RectangleElement, 
  TextElement,
  TriangleElement,
  ImageElement,
  StickyNoteElement,
  TableElement,
  ConnectorElement,
  ElementId 
} from './types';

export interface NodeFactoryConfig {
  enablePooling?: boolean;
  maxPoolSize?: number;
  minHitAreaSize?: number;
  defaultStroke?: string;
  defaultFill?: string;
}

/**
 * Node pool for reusable nodes
 */
class NodePool<T extends Konva.Node> {
  private pool: T[] = [];
  private maxSize: number;
  private createFn: () => T;

  constructor(maxSize: number, createFn: () => T) {
    this.maxSize = maxSize;
    this.createFn = createFn;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(node: T): void {
    if (this.pool.length < this.maxSize) {
      // Reset node to default state
      node.setAttrs({
        x: 0,
        y: 0,
        visible: true,
        opacity: 1,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      });
      this.pool.push(node);
    } else {
      node.destroy();
    }
  }

  clear(): void {
    this.pool.forEach(node => node.destroy());
    this.pool = [];
  }
}

export class NodeFactory {
  private config: NodeFactoryConfig;
  private pools: Map<string, NodePool<any>> = new Map();
  private nodeCache = new Map<ElementId, Konva.Node>();
  private circleContract: CircleTextContract;

  constructor(config: NodeFactoryConfig = {}) {
    this.config = {
      enablePooling: true,
      maxPoolSize: 50,
      minHitAreaSize: 40,
      defaultStroke: '#000000',
      defaultFill: '#ffffff',
      ...config
    };

    if (this.config.enablePooling) {
      this.initializePools();
    }
    
    // Initialize circle text contract
    this.circleContract = new CircleTextContract({ padPx: 8 });
  }

  /**
   * Initialize node pools
   */
  private initializePools(): void {
    // Text node pool
    this.pools.set('text', new NodePool(20, () => new Konva.Text()));
    
    // Rect node pool (for hit areas)
    this.pools.set('rect', new NodePool(20, () => new Konva.Rect()));
    
    // Group node pool
    this.pools.set('group', new NodePool(10, () => new Konva.Group()));
  }

  /**
   * Create node for element
   */
  create(element: CanvasElement): Konva.Node {
    let node: Konva.Node;

    switch (element.type) {
      case 'circle':
        node = this.createCircle(element as CircleElement);
        break;
      case 'rectangle':
        node = this.createRectangle(element as RectangleElement);
        break;
      case 'text':
        node = this.createText(element as TextElement);
        break;
      case 'triangle':
        node = this.createTriangle(element as TriangleElement);
        break;
      case 'image':
        node = this.createImage(element as ImageElement);
        break;
      case 'sticky-note':
        node = this.createStickyNote(element as StickyNoteElement);
        break;
      case 'table':
        node = this.createTable(element as TableElement);
        break;
      case 'connector':
        node = this.createConnector(element as ConnectorElement);
        break;
      default:
        throw new Error(`Unknown element type: ${(element as any).type}`);
    }

    // Cache node
    this.nodeCache.set(element.id, node);
    
    // Set common attributes
    node.id(element.id);
    node.setAttr('elementType', element.type);
    node.x(element.x);
    node.y(element.y);
    node.visible(element.visible !== false);
    node.opacity(element.opacity ?? 1);
    node.rotation(element.rotation ?? 0);
    node.draggable(!element.locked);

    return node;
  }

  /**
   * Update existing node
   */
  update(node: Konva.Node, element: CanvasElement): void {
    // Update common attributes
    node.x(element.x);
    node.y(element.y);
    node.visible(element.visible !== false);
    node.opacity(element.opacity ?? 1);
    node.rotation(element.rotation ?? 0);
    node.draggable(!element.locked);

    // Update type-specific attributes
    switch (element.type) {
      case 'circle':
        this.updateCircle(node as Konva.Group, element as CircleElement);
        break;
      case 'rectangle':
        this.updateRectangle(node as Konva.Group, element as RectangleElement);
        break;
      case 'text':
        this.updateText(node as Konva.Group, element as TextElement);
        break;
      case 'triangle':
        this.updateTriangle(node as Konva.Group, element as TriangleElement);
        break;
      case 'image':
        this.updateImage(node as Konva.Group, element as ImageElement);
        break;
      case 'sticky-note':
        this.updateStickyNote(node as Konva.Group, element as StickyNoteElement);
        break;
      case 'table':
        this.updateTable(node as Konva.Group, element as TableElement);
        break;
      case 'connector':
        this.updateConnector(node as Konva.Line | Konva.Arrow, element as ConnectorElement);
        break;
    }
  }

  /**
   * Create circle element
   */
  private createCircle(element: CircleElement): Konva.Group {
    const group = this.getOrCreateGroup();
    
    // Create ellipse (circle)
    const ellipse = new Konva.Ellipse({
      radiusX: element.radius,
      radiusY: element.radius,
      fill: element.fill || '#FFE500',
      stroke: element.stroke || this.config.defaultStroke,
      strokeWidth: element.strokeWidth || 2,
      perfectDrawEnabled: false
    });
    group.add(ellipse);

    // Add text if present using contract for LEFT+TOP alignment
    if (element.text) {
      const text = this.getOrCreateText();
      
      // Calculate measurements using contract
      const measurement = this.circleContract.calculate(element, group);
      
      // Apply contract to ensure LEFT+TOP alignment
      this.circleContract.applyToKonva(text, measurement);
      
      // Set text content and font
      text.text(element.text);
      text.fontSize(element.fontSize || 14);
      text.fontFamily(element.fontFamily || 'Inter, system-ui, sans-serif');
      text.fill('#000000');
      
      // Debug logging
      if ((window as any).__CANVAS_TEXT_DEBUG__) {
        console.log('Circle text created:', {
          radius: element.radius,
          sidePx: measurement.sidePx,
          contentWpx: measurement.contentWpx,
          contentWWorld: measurement.contentWWorld,
          fontSize: element.fontSize || 14,
          text: element.text,
          textWidth: text.width(),
          textAlign: text.align(),
          textVerticalAlign: text.verticalAlign()
        });
        debugTextAlignment(text, 'circle');
      }
      
      group.add(text);
    }

    // Add hit area
    this.ensureHitArea(group, element.radius * 2, element.radius * 2);

    return group;
  }

  /**
   * Update circle element
   */
  private updateCircle(group: Konva.Group, element: CircleElement): void {
    const ellipse = group.findOne('Ellipse') as Konva.Ellipse;
    if (ellipse) {
      ellipse.radiusX(element.radius);
      ellipse.radiusY(element.radius);
      ellipse.fill(element.fill || '#FFE500');
      ellipse.stroke(element.stroke || this.config.defaultStroke);
      ellipse.strokeWidth(element.strokeWidth || 2);
    }

    // Update text using contract for LEFT+TOP alignment
    const text = group.findOne('Text') as Konva.Text;
    if (text && element.text) {
      // Calculate measurements using contract
      const measurement = this.circleContract.calculate(element, group);
      
      // Apply contract to ensure LEFT+TOP alignment
      this.circleContract.applyToKonva(text, measurement);
      
      // Update text content and font
      text.text(element.text);
      text.fontSize(element.fontSize || 14);
      text.fontFamily(element.fontFamily || 'Inter, system-ui, sans-serif');
    }

    // Update hit area
    this.ensureHitArea(group, element.radius * 2, element.radius * 2);
  }

  /**
   * Create rectangle element
   */
  private createRectangle(element: RectangleElement): Konva.Group {
    const group = this.getOrCreateGroup();
    
    // Create rectangle
    const rect = new Konva.Rect({
      x: -element.width / 2,
      y: -element.height / 2,
      width: element.width,
      height: element.height,
      fill: element.fill || this.config.defaultFill,
      stroke: element.stroke || this.config.defaultStroke,
      strokeWidth: element.strokeWidth || 2,
      cornerRadius: element.cornerRadius || 0,
      perfectDrawEnabled: false
    });
    group.add(rect);

    // Add hit area
    this.ensureHitArea(group, element.width, element.height);

    return group;
  }

  /**
   * Update rectangle element
   */
  private updateRectangle(group: Konva.Group, element: RectangleElement): void {
    const rect = group.findOne('Rect') as Konva.Rect;
    if (rect) {
      rect.x(-element.width / 2);
      rect.y(-element.height / 2);
      rect.width(element.width);
      rect.height(element.height);
      rect.fill(element.fill || this.config.defaultFill);
      rect.stroke(element.stroke || this.config.defaultStroke);
      rect.strokeWidth(element.strokeWidth || 2);
      rect.cornerRadius(element.cornerRadius || 0);
    }

    this.ensureHitArea(group, element.width, element.height);
  }

  /**
   * Create text element
   */
  private createText(element: TextElement): Konva.Group {
    const group = this.getOrCreateGroup();
    
    const text = this.getOrCreateText();
    text.text(element.text);
    text.fontSize(element.fontSize || 14);
    text.fontFamily(element.fontFamily || 'Inter, system-ui, sans-serif');
    text.fontStyle(element.fontStyle || 'normal');
    text.fill(element.fill || '#000000');
    text.width(element.width || 200);
    text.height(element.height);
    text.align(element.align || 'left');
    text.verticalAlign(element.verticalAlign || 'top');
    text.wrap('word');
    text.ellipsis(true);
    
    group.add(text);

    // Add hit area
    const bounds = text.getClientRect();
    this.ensureHitArea(group, bounds.width, bounds.height);

    return group;
  }

  /**
   * Update text element
   */
  private updateText(group: Konva.Group, element: TextElement): void {
    const text = group.findOne('Text') as Konva.Text;
    if (text) {
      text.text(element.text);
      text.fontSize(element.fontSize || 14);
      text.fontFamily(element.fontFamily || 'Inter, system-ui, sans-serif');
      text.fill(element.fill || '#000000');
      text.width(element.width || 200);
      text.height(element.height);
    }

    const bounds = text.getClientRect();
    this.ensureHitArea(group, bounds.width, bounds.height);
  }

  /**
   * Create triangle element
   */
  private createTriangle(element: TriangleElement): Konva.Group {
    const group = this.getOrCreateGroup();
    
    const triangle = new Konva.RegularPolygon({
      x: 0,
      y: 0,
      sides: 3,
      radius: Math.max(element.width, element.height) / 2,
      fill: element.fill || this.config.defaultFill,
      stroke: element.stroke || this.config.defaultStroke,
      strokeWidth: element.strokeWidth || 2
    });
    
    group.add(triangle);
    this.ensureHitArea(group, element.width, element.height);

    return group;
  }

  /**
   * Update triangle element
   */
  private updateTriangle(group: Konva.Group, element: TriangleElement): void {
    const triangle = group.findOne('RegularPolygon') as Konva.RegularPolygon;
    if (triangle) {
      triangle.radius(Math.max(element.width, element.height) / 2);
      triangle.fill(element.fill || this.config.defaultFill);
      triangle.stroke(element.stroke || this.config.defaultStroke);
      triangle.strokeWidth(element.strokeWidth || 2);
    }

    this.ensureHitArea(group, element.width, element.height);
  }

  /**
   * Create image element
   */
  private createImage(element: ImageElement): Konva.Group {
    const group = this.getOrCreateGroup();
    
    const imageObj = new Image();
    imageObj.src = element.src;
    
    const image = new Konva.Image({
      x: -element.width / 2,
      y: -element.height / 2,
      width: element.width,
      height: element.height,
      image: imageObj
    });
    
    group.add(image);
    this.ensureHitArea(group, element.width, element.height);

    return group;
  }

  /**
   * Update image element
   */
  private updateImage(group: Konva.Group, element: ImageElement): void {
    const image = group.findOne('Image') as Konva.Image;
    if (image) {
      image.x(-element.width / 2);
      image.y(-element.height / 2);
      image.width(element.width);
      image.height(element.height);
      
      // Update image source if changed
      const currentSrc = (image.image() as HTMLImageElement)?.src;
      if (currentSrc !== element.src) {
        const imageObj = new Image();
        imageObj.src = element.src;
        image.image(imageObj);
      }
    }

    this.ensureHitArea(group, element.width, element.height);
  }

  /**
   * Create sticky note element
   */
  private createStickyNote(element: StickyNoteElement): Konva.Group {
    const group = this.getOrCreateGroup();
    
    // Background
    const bg = new Konva.Rect({
      x: -element.width / 2,
      y: -element.height / 2,
      width: element.width,
      height: element.height,
      fill: element.fill || '#FFE500',
      cornerRadius: 4,
      shadowColor: 'black',
      shadowBlur: 5,
      shadowOpacity: 0.2,
      shadowOffsetX: 2,
      shadowOffsetY: 2
    });
    group.add(bg);

    // Text
    if (element.text) {
      const text = this.getOrCreateText();
      text.text(element.text);
      text.fontSize(element.fontSize || 14);
      text.fontFamily(element.fontFamily || 'Inter, system-ui, sans-serif');
      text.fill('#000000');
      text.width(element.width - 20);
      text.height(element.height - 20);
      text.x(-element.width / 2 + 10);
      text.y(-element.height / 2 + 10);
      text.wrap('word');
      group.add(text);
    }

    this.ensureHitArea(group, element.width, element.height);

    return group;
  }

  /**
   * Update sticky note element
   */
  private updateStickyNote(group: Konva.Group, element: StickyNoteElement): void {
    const bg = group.findOne('Rect') as Konva.Rect;
    if (bg) {
      bg.x(-element.width / 2);
      bg.y(-element.height / 2);
      bg.width(element.width);
      bg.height(element.height);
      bg.fill(element.fill || '#FFE500');
    }

    const text = group.findOne('Text') as Konva.Text;
    if (text && element.text) {
      text.text(element.text);
      text.width(element.width - 20);
      text.height(element.height - 20);
      text.x(-element.width / 2 + 10);
      text.y(-element.height / 2 + 10);
    }

    this.ensureHitArea(group, element.width, element.height);
  }

  /**
   * Create table element
   */
  private createTable(element: TableElement): Konva.Group {
    const group = this.getOrCreateGroup();
    
    // Create table grid
    for (let row = 0; row < element.rows; row++) {
      for (let col = 0; col < element.cols; col++) {
        const cell = new Konva.Rect({
          x: col * element.cellWidth,
          y: row * element.cellHeight,
          width: element.cellWidth,
          height: element.cellHeight,
          stroke: element.stroke || '#000000',
          strokeWidth: element.strokeWidth || 1,
          fill: element.fill || '#ffffff'
        });
        group.add(cell);

        // Add cell text if exists
        const cellKey = `${row},${col}`;
        const cellText = element.cells?.[cellKey];
        if (cellText) {
          const text = new Konva.Text({
            x: col * element.cellWidth + 5,
            y: row * element.cellHeight + 5,
            width: element.cellWidth - 10,
            height: element.cellHeight - 10,
            text: cellText,
            fontSize: 12,
            fontFamily: 'Inter, system-ui, sans-serif',
            fill: '#000000',
            wrap: 'word',
            ellipsis: true
          });
          group.add(text);
        }
      }
    }

    const totalWidth = element.cols * element.cellWidth;
    const totalHeight = element.rows * element.cellHeight;
    this.ensureHitArea(group, totalWidth, totalHeight);

    return group;
  }

  /**
   * Update table element
   */
  private updateTable(group: Konva.Group, element: TableElement): void {
    // Tables are complex - for now just recreate
    group.destroyChildren();
    const newTable = this.createTable(element);
    newTable.children.forEach(child => {
      child.moveTo(group);
    });
  }

  /**
   * Create connector element
   */
  private createConnector(element: ConnectorElement): Konva.Line | Konva.Arrow {
    const points = element.points || [
      element.startX, element.startY,
      element.endX, element.endY
    ];

    if (element.arrowEnd || element.arrowStart) {
      return new Konva.Arrow({
        points,
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 2,
        pointerAtBeginning: element.arrowStart,
        pointerAtEnding: element.arrowEnd,
        pointerLength: 10,
        pointerWidth: 10
      });
    } else {
      return new Konva.Line({
        points,
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 2
      });
    }
  }

  /**
   * Update connector element
   */
  private updateConnector(node: Konva.Line | Konva.Arrow, element: ConnectorElement): void {
    const points = element.points || [
      element.startX, element.startY,
      element.endX, element.endY
    ];
    
    node.points(points);
    node.stroke(element.stroke || '#000000');
    node.strokeWidth(element.strokeWidth || 2);
    
    if (node instanceof Konva.Arrow) {
      node.pointerAtBeginning(element.arrowStart);
      node.pointerAtEnding(element.arrowEnd);
    }
  }

  /**
   * Ensure hit area for group
   */
  private ensureHitArea(group: Konva.Group, width: number, height: number): void {
    let hitArea = group.findOne('.hitArea') as Konva.Rect;
    
    const hitSize = calculateHitArea(width, height, this.config.minHitAreaSize);
    
    if (!hitArea) {
      hitArea = this.getOrCreateRect();
      hitArea.name('hitArea');
      hitArea.listening(true);
      hitArea.fill('transparent');
      group.add(hitArea);
      hitArea.moveToBottom();
    }
    
    hitArea.width(hitSize.width);
    hitArea.height(hitSize.height);
    hitArea.x(-hitSize.width / 2);
    hitArea.y(-hitSize.height / 2);
  }

  /**
   * Get or create group from pool
   */
  private getOrCreateGroup(): Konva.Group {
    if (this.config.enablePooling && this.pools.has('group')) {
      return this.pools.get('group')!.acquire();
    }
    return new Konva.Group();
  }

  /**
   * Get or create text from pool
   */
  private getOrCreateText(): Konva.Text {
    if (this.config.enablePooling && this.pools.has('text')) {
      return this.pools.get('text')!.acquire();
    }
    return new Konva.Text();
  }

  /**
   * Get or create rect from pool
   */
  private getOrCreateRect(): Konva.Rect {
    if (this.config.enablePooling && this.pools.has('rect')) {
      return this.pools.get('rect')!.acquire();
    }
    return new Konva.Rect();
  }

  /**
   * Release node back to pool
   */
  release(node: Konva.Node): void {
    if (!this.config.enablePooling) {
      node.destroy();
      return;
    }

    const className = node.className;
    if (this.pools.has(className.toLowerCase())) {
      this.pools.get(className.toLowerCase())!.release(node);
    } else {
      node.destroy();
    }
  }

  /**
   * Get cached node
   */
  get(elementId: ElementId): Konva.Node | undefined {
    return this.nodeCache.get(elementId);
  }

  /**
   * Clear all pools and cache
   */
  dispose(): void {
    this.pools.forEach(pool => pool.clear());
    this.pools.clear();
    this.nodeCache.clear();
  }
}