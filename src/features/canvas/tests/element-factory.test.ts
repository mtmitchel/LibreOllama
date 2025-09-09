/**
 * Tests for ElementFactory
 * Comprehensive test coverage for element creation and configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Konva from 'konva';
import { ElementFactory, type ElementFactoryConfig, type ElementFactoryStoreAdapter } from '../renderer/factory/ElementFactory';
import type { ElementId, CanvasElement } from '../types/enhanced.types';

describe('ElementFactory', () => {
  let nodeMap: Map<string, Konva.Node>;
  let storeAdapter: ElementFactoryStoreAdapter;
  let config: ElementFactoryConfig;
  let scheduleDraw: ReturnType<typeof vi.fn>;
  let onTextEditorOpen: ReturnType<typeof vi.fn>;
  let container: HTMLDivElement;

  beforeEach(() => {
    // Setup DOM container for Konva
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Setup node map
    nodeMap = new Map();

    // Setup mock store adapter
    storeAdapter = {
      updateElement: vi.fn()
    };

    // Setup mock callbacks
    scheduleDraw = vi.fn();
    onTextEditorOpen = vi.fn();

    // Create config
    config = {
      nodeMap,
      storeAdapter,
      scheduleDraw,
      onTextEditorOpen,
      debug: { log: false }
    };
  });

  afterEach(() => {
    // Cleanup DOM
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize element factory with default config', () => {
      const factory = new ElementFactory(config);
      
      expect(factory).toBeDefined();
    });

    it('should initialize with debug logging enabled', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugConfig = { ...config, debug: { log: true } };
      
      new ElementFactory(debugConfig);
      
      expect(consoleSpy).toHaveBeenCalledWith('[ElementFactory] Initialized element factory system');
      consoleSpy.mockRestore();
    });

    it('should initialize without store adapter', () => {
      const configWithoutStore = { ...config, storeAdapter: undefined };
      
      expect(() => new ElementFactory(configWithoutStore)).not.toThrow();
    });
  });

  describe('Rectangle Creation', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should create rectangle element', () => {
      const element: CanvasElement = {
        id: 'rect1' as ElementId,
        type: 'rectangle',
        x: 100,
        y: 50,
        width: 200,
        height: 100,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2
      } as any;

      const result = factory.createElement(element);

      expect(result.group).toBeInstanceOf(Konva.Group);
      expect(result.group.id()).toBe('rect1');
      expect(result.group.name()).toBe('rectangle');
      expect(result.group.x()).toBe(100);
      expect(result.group.y()).toBe(50);
      expect(result.needsTextEditor).toBeUndefined();
    });

    it('should create rectangle with text content', () => {
      const element: CanvasElement = {
        id: 'rect2' as ElementId,
        type: 'rect',
        x: 0,
        y: 0,
        width: 150,
        height: 80,
        text: 'Hello World',
        fontSize: 16,
        fontFamily: 'Arial'
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const textNode = group.findOne('Text') as Konva.Text;

      expect(textNode).toBeDefined();
      expect(textNode.text()).toBe('Hello World');
      expect(textNode.fontSize()).toBe(16);
      expect(textNode.fontFamily()).toBe('Arial');
    });

    it('should handle rectangle with minimum dimensions', () => {
      const element: CanvasElement = {
        id: 'rect3' as ElementId,
        type: 'rectangle',
        width: 0,
        height: -5
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const rect = group.findOne('Rect') as Konva.Rect;

      // Should enforce minimum dimensions
      expect(rect.width()).toBe(1);
      expect(rect.height()).toBe(1);
    });
  });

  describe('Circle Creation', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should create circle element', () => {
      const element: CanvasElement = {
        id: 'circle1' as ElementId,
        type: 'circle',
        x: 200,
        y: 150,
        radius: 50,
        fill: '#00ff00',
        stroke: '#333333'
      } as any;

      const result = factory.createElement(element);

      expect(result.group).toBeInstanceOf(Konva.Group);
      expect(result.group.id()).toBe('circle1');
      expect(result.group.name()).toBe('circle');
      expect(result.group.x()).toBe(200);
      expect(result.group.y()).toBe(150);
    });

    it('should create circle with default radius when missing', () => {
      const element: CanvasElement = {
        id: 'circle2' as ElementId,
        type: 'circle'
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const circle = group.findOne('Circle') as Konva.Circle;

      expect(circle.radius()).toBe(40); // Default radius
    });

    it('should calculate radius from width/height', () => {
      const element: CanvasElement = {
        id: 'circle3' as ElementId,
        type: 'circle',
        width: 100,
        height: 80
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const circle = group.findOne('Circle') as Konva.Circle;

      expect(circle.radius()).toBe(40); // Min(100, 80) / 2
    });
  });

  describe('Circle Text Creation', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should create circle with text', () => {
      const element: CanvasElement = {
        id: 'circletext1' as ElementId,
        type: 'circle-text',
        x: 300,
        y: 200,
        radius: 60,
        text: 'Circle Text',
        fontSize: 14,
        textColor: '#ffffff'
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const text = group.findOne('Text') as Konva.Text;

      expect(result.group.name()).toBe('circle-text');
      expect(text).toBeDefined();
      expect(text.text()).toBe('Circle Text');
      expect(text.fontSize()).toBe(14);
      expect(text.fill()).toBe('#ffffff');
      expect(text.align()).toBe('center');
    });
  });

  describe('Triangle Creation', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should create triangle element', () => {
      const element: CanvasElement = {
        id: 'triangle1' as ElementId,
        type: 'triangle',
        x: 400,
        y: 300,
        width: 120,
        height: 100,
        fill: '#0000ff'
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const triangle = group.findOne('Line') as Konva.Line;

      expect(result.group.name()).toBe('triangle');
      expect(triangle).toBeDefined();
      expect(triangle.closed()).toBe(true);
      expect(triangle.points()).toEqual([60, 0, 120, 100, 0, 100]); // [w/2, 0, w, h, 0, h]
    });

    it('should create triangle with default dimensions', () => {
      const element: CanvasElement = {
        id: 'triangle2' as ElementId,
        type: 'triangle'
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const triangle = group.findOne('Line') as Konva.Line;

      expect(triangle.points()).toEqual([90, 0, 180, 180, 0, 180]); // Default 180x180
    });
  });

  describe('Text Creation', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should create text element', () => {
      const element: CanvasElement = {
        id: 'text1' as ElementId,
        type: 'text',
        x: 50,
        y: 100,
        width: 300,
        height: 50,
        text: 'Sample Text',
        fontSize: 18,
        fontFamily: 'Helvetica',
        textColor: '#333333'
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const text = group.findOne('Text') as Konva.Text;

      expect(result.group.name()).toBe('text');
      expect(text.text()).toBe('Sample Text');
      expect(text.fontSize()).toBe(18);
      expect(text.fontFamily()).toBe('Helvetica');
      expect(text.fill()).toBe('#333333');
    });

    it('should create rich-text element', () => {
      const element: CanvasElement = {
        id: 'richtext1' as ElementId,
        type: 'rich-text',
        text: 'Rich Text Content'
      } as any;

      const result = factory.createElement(element);

      expect(result.group.name()).toBe('text');
      expect(result.needsTextEditor).toBeUndefined();
    });

    it('should indicate text editor needed for newly created text', () => {
      const element: CanvasElement = {
        id: 'newtext1' as ElementId,
        type: 'text',
        newlyCreated: true
      } as any;

      const result = factory.createElement(element);

      expect(result.needsTextEditor).toBe(true);
    });
  });

  describe('Table Creation', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should create table element', () => {
      const element: CanvasElement = {
        id: 'table1' as ElementId,
        type: 'table',
        x: 100,
        y: 200,
        rows: 3,
        cols: 4,
        cellWidth: 80,
        cellHeight: 30
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;

      expect(result.group.name()).toBe('table');
      
      // Should create grid of cell rectangles
      const cellRects = group.find('Rect').filter(node => node.name() !== 'hit-area');
      expect(cellRects.length).toBe(12); // 3 rows × 4 cols
    });

    it('should create table with enhanced table data', () => {
      const element: CanvasElement = {
        id: 'table2' as ElementId,
        type: 'table',
        enhancedTableData: {
          rows: [{ height: 40 }, { height: 40 }],
          columns: [{ width: 100 }, { width: 150 }],
          cells: [
            [{ content: 'Header 1' }, { content: 'Header 2' }],
            [{ content: 'Cell 1' }, { content: 'Cell 2' }]
          ]
        }
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const textNodes = group.find('Text');

      expect(textNodes.length).toBe(4); // 2x2 cells with text
      expect((textNodes[0] as Konva.Text).text()).toBe('Header 1');
      expect((textNodes[3] as Konva.Text).text()).toBe('Cell 2');
    });

    it('should handle table with minimum dimensions', () => {
      const element: CanvasElement = {
        id: 'table3' as ElementId,
        type: 'table',
        rows: 0,
        cols: -1
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const cellRects = group.find('Rect').filter(node => node.name() !== 'hit-area');

      expect(cellRects.length).toBe(1); // Minimum 1x1 table
    });
  });

  describe('Image Creation', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should create image placeholder', () => {
      const element: CanvasElement = {
        id: 'image1' as ElementId,
        type: 'image',
        x: 300,
        y: 400,
        width: 200,
        height: 150
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const placeholders = group.find('Rect').filter(node => node.name() !== 'hit-area');
      const placeholderText = group.findOne('Text') as Konva.Text;

      expect(result.group.name()).toBe('image');
      expect(placeholders.length).toBeGreaterThan(0);
      expect(placeholderText.text()).toBe('Image');
    });

    it('should handle image with source URL', () => {
      const element: CanvasElement = {
        id: 'image2' as ElementId,
        type: 'image',
        src: 'data:image/png;base64,test',
        width: 100,
        height: 100
      } as any;

      const result = factory.createElement(element);

      expect(result.group.name()).toBe('image');
      // Image loading is async, so we just verify the element is created
    });
  });

  describe('Sticky Note Creation', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should create sticky note element', () => {
      const element: CanvasElement = {
        id: 'sticky1' as ElementId,
        type: 'sticky-note',
        x: 500,
        y: 300,
        width: 180,
        height: 120,
        text: 'Sticky note content',
        backgroundColor: '#fff59d'
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const rects = group.find('Rect');
      const text = group.findOne('Text') as Konva.Text;

      expect(result.group.name()).toBe('sticky-note');
      expect(rects.length).toBe(3); // Hit area + shadow + note background
      expect(text.text()).toBe('Sticky note content');
    });

    it('should indicate text editor needed for newly created sticky', () => {
      const element: CanvasElement = {
        id: 'newsticky1' as ElementId,
        type: 'sticky',
        newlyCreated: true
      } as any;

      const result = factory.createElement(element);

      expect(result.needsTextEditor).toBe(true);
    });
  });

  describe('Connector Creation', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should create line connector', () => {
      const element: CanvasElement = {
        id: 'line1' as ElementId,
        type: 'line',
        points: [10, 20, 100, 80],
        stroke: '#333333',
        strokeWidth: 3
      } as any;

      const result = factory.createElement(element);

      expect(result.group).toBeInstanceOf(Konva.Line);
      expect(result.group.id()).toBe('line1');
      expect(result.group.name()).toBe('connector');
      expect((result.group as Konva.Line).points()).toEqual([10, 20, 100, 80]);
    });

    it('should create arrow connector', () => {
      const element: CanvasElement = {
        id: 'arrow1' as ElementId,
        type: 'arrow',
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 150, y: 100 },
        pointerLength: 12,
        pointerWidth: 10
      } as any;

      const result = factory.createElement(element);

      expect(result.group).toBeInstanceOf(Konva.Arrow);
      expect((result.group as Konva.Arrow).pointerLength()).toBe(12);
      expect((result.group as Konva.Arrow).pointerWidth()).toBe(10);
    });

    it('should create connector with default points when missing', () => {
      const element: CanvasElement = {
        id: 'connector1' as ElementId,
        type: 'connector'
      } as any;

      const result = factory.createElement(element);

      expect((result.group as Konva.Line).points()).toEqual([0, 0, 100, 100]); // Default points
    });

    it('should handle edge type as connector', () => {
      const element: CanvasElement = {
        id: 'edge1' as ElementId,
        type: 'edge',
        points: [50, 60, 200, 180]
      } as any;

      const result = factory.createElement(element);

      expect(result.group).toBeInstanceOf(Konva.Line);
      expect(result.group.name()).toBe('connector');
    });
  });

  describe('Unknown Element Types', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should create fallback element for unknown type', () => {
      const element: CanvasElement = {
        id: 'unknown1' as ElementId,
        type: 'unknown-type' as any,
        x: 100,
        y: 200,
        width: 150,
        height: 100
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const errorText = group.findOne('Text') as Konva.Text;

      expect(result.group.name()).toBe('fallback');
      expect(errorText.text()).toBe('Unknown: unknown-type');
    });

    it('should log warning for unknown element type when debug enabled', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const debugFactory = new ElementFactory({ ...config, debug: { log: true } });

      const element: CanvasElement = {
        id: 'unknown2' as ElementId,
        type: 'mystery-element' as any
      } as any;

      debugFactory.createElement(element);

      expect(consoleSpy).toHaveBeenCalledWith('[ElementFactory] Unknown element type: mystery-element');
      
      debugFactory.destroy();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should handle creation errors gracefully', () => {
      // Mock a specific creation method to throw error instead of constructor
      const originalCreateRectangle = factory['createRectangle'];
      factory['createRectangle'] = vi.fn().mockImplementation(() => {
        throw new Error('Rectangle creation failed');
      });

      const element: CanvasElement = {
        id: 'error1' as ElementId,
        type: 'rectangle'
      } as any;

      const result = factory.createElement(element);

      expect(result.group).toBeDefined();
      expect(result.group.name()).toBe('fallback'); // Should fallback to error element

      // Restore original
      factory['createRectangle'] = originalCreateRectangle;
    });

    it('should log creation errors when debug enabled', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const debugFactory = new ElementFactory({ ...config, debug: { log: true } });

      // Mock a creation method to throw error
      const originalCreateRectangle = debugFactory['createRectangle'];
      debugFactory['createRectangle'] = vi.fn().mockImplementation(() => {
        throw new Error('Rectangle creation failed');
      });

      const element: CanvasElement = {
        id: 'error2' as ElementId,
        type: 'rectangle'
      } as any;

      debugFactory.createElement(element);

      expect(consoleSpy).toHaveBeenCalledWith('[ElementFactory] Failed to create element:', expect.any(Error));
      
      // Restore original
      debugFactory['createRectangle'] = originalCreateRectangle;
      debugFactory.destroy();
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration Management', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should update configuration', () => {
      const newScheduleDraw = vi.fn();
      const newOnTextEditorOpen = vi.fn();

      factory.updateConfig({
        scheduleDraw: newScheduleDraw,
        onTextEditorOpen: newOnTextEditorOpen,
        debug: { log: true }
      });

      // Configuration should be updated (can't directly test private config, but method exists)
      expect(() => factory.updateConfig({})).not.toThrow();
    });

    it('should clear caches', () => {
      expect(() => factory.clearCache()).not.toThrow();
    });
  });

  describe('Cleanup and Destruction', () => {
    it('should destroy factory and clear caches', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugFactory = new ElementFactory({ ...config, debug: { log: true } });

      debugFactory.destroy();

      expect(consoleSpy).toHaveBeenCalledWith('[ElementFactory] Element factory destroyed');
      consoleSpy.mockRestore();
    });

    it('should be safe to call destroy multiple times', () => {
      const factory = new ElementFactory(config);

      expect(() => {
        factory.destroy();
        factory.destroy();
      }).not.toThrow();
    });

    it('should handle destroy after cache operations', () => {
      const factory = new ElementFactory(config);

      factory.clearCache();
      expect(() => factory.destroy()).not.toThrow();
    });
  });

  describe('Element Positioning', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should position elements correctly', () => {
      const element: CanvasElement = {
        id: 'positioned1' as ElementId,
        type: 'rectangle',
        x: 250,
        y: 350
      } as any;

      const result = factory.createElement(element);

      expect(result.group.x()).toBe(250);
      expect(result.group.y()).toBe(350);
    });

    it('should handle missing position coordinates', () => {
      const element: CanvasElement = {
        id: 'nopos1' as ElementId,
        type: 'circle'
      } as any;

      const result = factory.createElement(element);

      expect(result.group.x()).toBe(0); // Default position
      expect(result.group.y()).toBe(0);
    });
  });

  describe('Element Properties', () => {
    let factory: ElementFactory;

    beforeEach(() => {
      factory = new ElementFactory(config);
    });

    afterEach(() => {
      factory.destroy();
    });

    it('should apply fill and stroke colors', () => {
      const element: CanvasElement = {
        id: 'colored1' as ElementId,
        type: 'rectangle',
        fill: '#ff5722',
        stroke: '#795548',
        strokeWidth: 4
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const rects = group.find('Rect');
      const rect = rects.find(r => r.name() !== 'hit-area') as Konva.Rect;

      expect(rect.fill()).toBe('#ff5722');
      expect(rect.stroke()).toBe('#795548');
      expect(rect.strokeWidth()).toBe(4);
    });

    it('should apply default colors when missing', () => {
      const element: CanvasElement = {
        id: 'defaults1' as ElementId,
        type: 'rectangle'
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const rects = group.find('Rect');
      const rect = rects.find(r => r.name() !== 'hit-area') as Konva.Rect;

      expect(rect.fill()).toBe('#ffffff'); // Default fill
      expect(rect.stroke()).toBe('#333333'); // Default stroke
      expect(rect.strokeWidth()).toBe(2); // Default stroke width
    });

    it('should handle alternative property names', () => {
      const element: CanvasElement = {
        id: 'alt1' as ElementId,
        type: 'rectangle',
        backgroundColor: '#e91e63',
        borderColor: '#880e4f'
      } as any;

      const result = factory.createElement(element);
      const group = result.group as Konva.Group;
      const rects = group.find('Rect');
      const rect = rects.find(r => r.name() !== 'hit-area') as Konva.Rect;

      expect(rect.fill()).toBe('#e91e63'); // backgroundColor used as fill
      expect(rect.stroke()).toBe('#880e4f'); // borderColor used as stroke
    });
  });
});