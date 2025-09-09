/**
 * Element Factory
 * Handles creation and configuration of all canvas element types
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import Konva from 'konva';
import type { ElementId, CanvasElement } from '../../types/enhanced.types';

/**
 * Store adapter interface for element factory integration
 */
export interface ElementFactoryStoreAdapter {
  updateElement(id: ElementId, updates: any, options?: { skipHistory?: boolean }): void;
}

/**
 * Element factory configuration
 */
export interface ElementFactoryConfig {
  storeAdapter?: ElementFactoryStoreAdapter;
  nodeMap: Map<string, Konva.Node>;
  onTextEditorOpen?: (elementId: ElementId, node: Konva.Node) => void;
  scheduleDraw?: (layer: 'main' | 'overlay' | 'preview') => void;
  debug?: {
    log?: boolean;
  };
}

/**
 * Element creation result
 */
export interface ElementCreationResult {
  group: Konva.Group | Konva.Line | Konva.Arrow;
  needsTextEditor?: boolean;
}

/**
 * Text measurement utilities
 */
interface TextMeasurement {
  lines: string[];
  totalHeight: number;
  maxWidth: number;
}

/**
 * Element Factory
 * Creates and configures all types of canvas elements with proper Konva groups
 */
export class ElementFactory {
  private config: ElementFactoryConfig;
  private textCache = new Map<string, { width: number; height: number }>();
  private fontCache = new Map<string, number>();

  constructor(config: ElementFactoryConfig) {
    this.config = config;

    if (this.config.debug?.log) {
      console.info('[ElementFactory] Initialized element factory system');
    }
  }

  /**
   * Create element based on type
   */
  createElement(element: CanvasElement): ElementCreationResult {
    try {
      switch (element.type) {
        case 'rectangle':
        case 'rect':
          return { group: this.createRectangle(element) };
        
        case 'circle':
          return { group: this.createCircle(element) };
        
        case 'circle-text':
          return { group: this.createCircleText(element) };
        
        case 'triangle':
          return { group: this.createTriangle(element) };
        
        case 'text':
        case 'rich-text':
          return { group: this.createText(element), needsTextEditor: (element as any).newlyCreated };
        
        case 'table':
          return { group: this.createTable(element) };
        
        case 'image':
          return { group: this.createImage(element) };
        
        case 'sticky-note':
        case 'sticky':
          return { group: this.createStickyNote(element), needsTextEditor: (element as any).newlyCreated };
        
        case 'connector':
        case 'edge':
        case 'line':
        case 'arrow':
          return { group: this.createConnector(element) };
        
        default:
          if (this.config.debug?.log) {
            console.warn(`[ElementFactory] Unknown element type: ${(element as any).type}`);
          }
          // Create fallback element for unknown types
          return { group: this.createFallbackElement(element) };
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[ElementFactory] Failed to create element:', error);
      }
      // Return a basic rectangle as fallback
      return { group: this.createFallbackElement(element) };
    }
  }

  /**
   * Create rectangle element
   */
  private createRectangle(el: CanvasElement): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, (el as any).width || 1);
    let h = Math.max(1, (el as any).height || 1);

    const group = this.createGroupWithHitArea(id, w, h);
    group.name('rectangle');

    // Create rectangle shape
    const rect = new Konva.Rect({
      x: 0, y: 0,
      width: w, height: h,
      fill: (el as any).fill || (el as any).backgroundColor || '#ffffff',
      stroke: (el as any).stroke || (el as any).borderColor || '#333333',
      strokeWidth: (el as any).strokeWidth || 2,
      cornerRadius: (el as any).cornerRadius || 0,
      listening: false
    });

    group.add(rect);

    // Handle text content if present
    if ((el as any).text) {
      this.addTextToShape(group, (el as any).text, w, h, (el as any).fontSize, (el as any).fontFamily);
    }

    // Position the group
    group.position({ x: (el as any).x || 0, y: (el as any).y || 0 });

    return group;
  }

  /**
   * Create circle element
   */
  private createCircle(el: CanvasElement): Konva.Group {
    const id = String(el.id);
    let r = (el as any).radius ?? (Math.min((el as any).width || 0, (el as any).height || 0) / 2);
    if (!r || r <= 0) r = 40;

    const group = new Konva.Group({ 
      id, 
      name: 'circle', 
      listening: true, 
      draggable: true,
      offsetX: 0,
      offsetY: 0
    });

    // Create circle shape
    const circle = new Konva.Circle({
      x: 0, y: 0,
      radius: r,
      fill: (el as any).fill || (el as any).backgroundColor || '#ffffff',
      stroke: (el as any).stroke || (el as any).borderColor || '#333333',
      strokeWidth: (el as any).strokeWidth || 2,
      listening: false
    });

    group.add(circle);

    // Create invisible hit area for better interaction
    const hitArea = new Konva.Circle({
      x: 0, y: 0,
      radius: Math.max(r, 20),
      fill: 'transparent',
      listening: true,
      name: 'hit-area'
    });

    group.add(hitArea);

    // Position the group
    group.position({ x: (el as any).x || 0, y: (el as any).y || 0 });

    return group;
  }

  /**
   * Create circle with text element
   */
  private createCircleText(el: CanvasElement): Konva.Group {
    const id = String(el.id);
    let r = (el as any).radius ?? (Math.min((el as any).width || 0, (el as any).height || 0) / 2);
    if (!r || r <= 0) r = 40;

    const group = new Konva.Group({ 
      id, 
      name: 'circle-text', 
      listening: true, 
      draggable: true,
      offsetX: 0,
      offsetY: 0
    });

    // Create circle background
    const circle = new Konva.Circle({
      x: 0, y: 0,
      radius: r,
      fill: (el as any).fill || (el as any).backgroundColor || '#ffffff',
      stroke: (el as any).stroke || (el as any).borderColor || '#333333',
      strokeWidth: (el as any).strokeWidth || 2,
      listening: false
    });

    group.add(circle);

    // Add text if present
    if ((el as any).text) {
      const fontSize = (el as any).fontSize || 16;
      const text = new Konva.Text({
        x: -r,
        y: -fontSize / 2,
        width: r * 2,
        text: (el as any).text,
        fontSize,
        fontFamily: (el as any).fontFamily || 'Inter',
        fill: (el as any).textColor || '#000000',
        align: 'center',
        verticalAlign: 'middle',
        wrap: 'word',
        listening: false
      });

      group.add(text);
    }

    // Create hit area
    const hitArea = new Konva.Circle({
      x: 0, y: 0,
      radius: Math.max(r, 20),
      fill: 'transparent',
      listening: true,
      name: 'hit-area'
    });

    group.add(hitArea);

    // Position the group
    group.position({ x: (el as any).x || 0, y: (el as any).y || 0 });

    return group;
  }

  /**
   * Create triangle element
   */
  private createTriangle(el: CanvasElement): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, (el as any).width || 180);
    const h = Math.max(1, (el as any).height || 180);

    const group = this.createGroupWithHitArea(id, w, h);
    group.name('triangle');

    // Create triangle shape
    const triangle = new Konva.Line({
      points: [Math.round(w / 2), 0, w, h, 0, h],
      closed: true,
      fill: (el as any).fill || (el as any).backgroundColor || '#ffffff',
      stroke: (el as any).stroke || (el as any).borderColor || '#333333',
      strokeWidth: (el as any).strokeWidth || 2,
      lineJoin: 'round',
      listening: false
    });

    group.add(triangle);

    // Handle text content if present
    if ((el as any).text) {
      this.addTextToShape(group, (el as any).text, w, h, (el as any).fontSize, (el as any).fontFamily);
    }

    // Position the group
    group.position({ x: (el as any).x || 0, y: (el as any).y || 0 });

    return group;
  }

  /**
   * Create text element
   */
  private createText(el: CanvasElement): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, (el as any).width || 1);
    const h = Math.max(1, (el as any).height || 1);

    const group = this.createGroupWithHitArea(id, w, h, true);
    group.name('text');

    // Create text shape
    const text = new Konva.Text({
      x: 0, y: 0,
      width: w,
      height: h,
      text: (el as any).text || 'Text',
      fontSize: (el as any).fontSize || 16,
      fontFamily: (el as any).fontFamily || 'Inter',
      fill: (el as any).fill || (el as any).textColor || '#000000',
      align: (el as any).textAlign || 'left',
      verticalAlign: (el as any).verticalAlign || 'top',
      wrap: 'word',
      listening: false
    });

    group.add(text);

    // Position the group
    group.position({ x: (el as any).x || 0, y: (el as any).y || 0 });

    return group;
  }

  /**
   * Create table element
   */
  private createTable(el: CanvasElement): Konva.Group {
    const id = String(el.id);
    const rows = Math.max(1, (el as any).rows || ((el as any).enhancedTableData?.rows?.length || 1));
    const cols = Math.max(1, (el as any).cols || ((el as any).enhancedTableData?.columns?.length || 1));
    const cellW = (el as any).cellWidth || 100;
    const cellH = (el as any).cellHeight || 40;
    const w = cols * cellW;
    const h = rows * cellH;

    const group = this.createGroupWithHitArea(id, w, h);
    group.name('table');

    // Create table grid
    const tableGroup = new Konva.Group({ listening: false });

    // Create cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellX = col * cellW;
        const cellY = row * cellH;

        // Cell background
        const cellRect = new Konva.Rect({
          x: cellX,
          y: cellY,
          width: cellW,
          height: cellH,
          fill: (el as any).fill || '#ffffff',
          stroke: (el as any).stroke || '#cccccc',
          strokeWidth: 1,
          listening: false
        });

        tableGroup.add(cellRect);

        // Cell text content
        const cellData = (el as any).enhancedTableData?.cells?.[row]?.[col];
        if (cellData && cellData.content) {
          const cellText = new Konva.Text({
            x: cellX + 5,
            y: cellY + 5,
            width: cellW - 10,
            height: cellH - 10,
            text: cellData.content,
            fontSize: cellData.fontSize || 12,
            fontFamily: cellData.fontFamily || 'Inter',
            fill: cellData.textColor || '#000000',
            align: cellData.textAlign || 'left',
            verticalAlign: 'middle',
            wrap: 'word',
            listening: false
          });

          tableGroup.add(cellText);
        }
      }
    }

    group.add(tableGroup);

    // Position the group
    group.position({ x: (el as any).x || 0, y: (el as any).y || 0 });

    return group;
  }

  /**
   * Create image element
   */
  private createImage(el: CanvasElement): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, (el as any).width || 100);
    const h = Math.max(1, (el as any).height || 100);

    const group = this.createGroupWithHitArea(id, w, h);
    group.name('image');

    // Create placeholder rectangle
    const placeholder = new Konva.Rect({
      x: 0, y: 0,
      width: w, height: h,
      fill: (el as any).fill || '#f0f0f0',
      stroke: (el as any).stroke || '#cccccc',
      strokeWidth: 2,
      dash: [5, 5],
      listening: false
    });

    group.add(placeholder);

    // Add placeholder text
    const placeholderText = new Konva.Text({
      x: 0, y: 0,
      width: w, height: h,
      text: 'Image',
      fontSize: 16,
      fontFamily: 'Inter',
      fill: '#999999',
      align: 'center',
      verticalAlign: 'middle',
      listening: false
    });

    group.add(placeholderText);

    // If image source is available, load it
    if ((el as any).src) {
      this.loadImageContent(group, (el as any).src, w, h);
    }

    // Position the group
    group.position({ x: (el as any).x || 0, y: (el as any).y || 0 });

    return group;
  }

  /**
   * Create sticky note element
   */
  private createStickyNote(el: CanvasElement): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, (el as any).width || 200);
    const h = Math.max(1, (el as any).height || 150);

    const group = this.createGroupWithHitArea(id, w, h);
    group.name('sticky-note');

    // Create sticky note background with shadow
    const shadow = new Konva.Rect({
      x: 3, y: 3,
      width: w, height: h,
      fill: 'rgba(0,0,0,0.1)',
      cornerRadius: 3,
      listening: false
    });

    const note = new Konva.Rect({
      x: 0, y: 0,
      width: w, height: h,
      fill: (el as any).fill || (el as any).backgroundColor || '#fff59d',
      stroke: (el as any).stroke || (el as any).borderColor || '#f9a825',
      strokeWidth: (el as any).strokeWidth || 1,
      cornerRadius: 3,
      listening: false
    });

    group.add(shadow);
    group.add(note);

    // Add text if present
    if ((el as any).text) {
      const text = new Konva.Text({
        x: 10, y: 10,
        width: w - 20,
        height: h - 20,
        text: (el as any).text,
        fontSize: (el as any).fontSize || 14,
        fontFamily: (el as any).fontFamily || 'Inter',
        fill: (el as any).textColor || '#333333',
        align: 'left',
        verticalAlign: 'top',
        wrap: 'word',
        listening: false
      });

      group.add(text);
    }

    // Position the group
    group.position({ x: (el as any).x || 0, y: (el as any).y || 0 });

    return group;
  }

  /**
   * Create connector element (line/arrow)
   */
  private createConnector(el: CanvasElement): Konva.Line | Konva.Arrow {
    const points = Array.isArray((el as any).points) && (el as any).points.length >= 4
      ? [...(el as any).points]
      : ((el as any).startPoint && (el as any).endPoint 
          ? [(el as any).startPoint.x, (el as any).startPoint.y, (el as any).endPoint.x, (el as any).endPoint.y] 
          : [0, 0, 100, 100]);

    const isArrow = (el as any).type === 'arrow' || (el as any).arrowType === 'arrow';
    
    const connectorConfig: any = {
      id: String(el.id),
      name: 'connector',
      points,
      stroke: (el as any).stroke || (el as any).color || '#333333',
      strokeWidth: (el as any).strokeWidth || 2,
      lineCap: 'round',
      lineJoin: 'round',
      listening: true,
      draggable: false, // Connectors are not draggable like other elements
      perfectDrawEnabled: false
    };

    if (isArrow) {
      connectorConfig.pointerLength = (el as any).pointerLength || 10;
      connectorConfig.pointerWidth = (el as any).pointerWidth || 8;
      return new Konva.Arrow(connectorConfig);
    } else {
      return new Konva.Line(connectorConfig);
    }
  }

  /**
   * Create fallback element for unknown types
   */
  private createFallbackElement(el: CanvasElement): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, (el as any).width || 100);
    const h = Math.max(1, (el as any).height || 50);

    const group = this.createGroupWithHitArea(id, w, h);
    group.name('fallback');

    // Create error indicator rectangle
    const rect = new Konva.Rect({
      x: 0, y: 0,
      width: w, height: h,
      fill: '#ffebee',
      stroke: '#f44336',
      strokeWidth: 2,
      dash: [5, 5],
      listening: false
    });

    const errorText = new Konva.Text({
      x: 5, y: 5,
      width: w - 10,
      height: h - 10,
      text: `Unknown: ${(el as any).type || 'element'}`,
      fontSize: 12,
      fontFamily: 'Inter',
      fill: '#f44336',
      align: 'center',
      verticalAlign: 'middle',
      listening: false
    });

    group.add(rect);
    group.add(errorText);

    // Position the group
    group.position({ x: (el as any).x || 0, y: (el as any).y || 0 });

    return group;
  }

  // Helper methods

  /**
   * Create group with hit area for interaction
   */
  private createGroupWithHitArea(id: string, width: number, height: number, draggable: boolean = true): Konva.Group {
    const group = new Konva.Group({ id, listening: true, draggable });
    
    const hitArea = new Konva.Rect({
      x: 0, y: 0, 
      width, height,
      fill: 'transparent',
      listening: true,
      name: 'hit-area'
    });
    
    group.add(hitArea);
    return group;
  }

  /**
   * Add text content to a shape
   */
  private addTextToShape(group: Konva.Group, text: string, width: number, height: number, fontSize?: number, fontFamily?: string): void {
    const textNode = new Konva.Text({
      x: 5, y: 5,
      width: width - 10,
      height: height - 10,
      text,
      fontSize: fontSize || 14,
      fontFamily: fontFamily || 'Inter',
      fill: '#333333',
      align: 'left',
      verticalAlign: 'top',
      wrap: 'word',
      listening: false
    });

    group.add(textNode);
  }

  /**
   * Load image content asynchronously
   */
  private async loadImageContent(group: Konva.Group, src: string, width: number, height: number): Promise<void> {
    try {
      const image = new Image();
      image.onload = () => {
        // Remove placeholder content
        group.find('.placeholder').forEach(node => node.destroy());

        // Create Konva image
        const konvaImage = new Konva.Image({
          x: 0, y: 0,
          width, height,
          image,
          listening: false
        });

        group.add(konvaImage);

        // Trigger redraw
        if (this.config.scheduleDraw) {
          this.config.scheduleDraw('main');
        }
      };
      image.src = src;
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[ElementFactory] Failed to load image:', error);
      }
    }
  }

  /**
   * Measure text dimensions
   */
  private measureText(text: string, fontSize: number, fontFamily: string): TextMeasurement {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return { lines: [text], totalHeight: fontSize, maxWidth: 0 };

      ctx.font = `${fontSize}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      
      return {
        lines: [text],
        totalHeight: fontSize * 1.2,
        maxWidth: metrics.width
      };
    } catch (error) {
      return { lines: [text], totalHeight: fontSize, maxWidth: text.length * fontSize * 0.6 };
    }
  }

  /**
   * Update element factory configuration
   */
  updateConfig(newConfig: Partial<ElementFactoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.textCache.clear();
    this.fontCache.clear();
  }

  /**
   * Destroy element factory and cleanup resources
   */
  destroy(): void {
    this.clearCache();

    if (this.config.debug?.log) {
      console.info('[ElementFactory] Element factory destroyed');
    }
  }
}