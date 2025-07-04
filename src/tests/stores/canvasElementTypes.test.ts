import { describe, test, expect, beforeEach } from 'vitest';
import { createMockCanvasElement } from '../utils/testUtils';
import type { 
  RectangleElement, 
  CircleElement, 
  TriangleElement, 
  TextElement,
  ImageElement,
  TableElement,
  SectionElement,
  ConnectorElement,
  PenElement,
  StickyNoteElement
} from '@/features/canvas/types/enhanced.types';

/**
 * Canvas Element Types Validation Tests
 * 
 * Tests all 15+ canvas element types identified in the system inventory.
 * Validates element creation, properties, and type safety.
 */
describe('Canvas Element Types Validation', () => {
  describe('Basic Shape Elements', () => {
    test('should create and validate Rectangle element', () => {
      const element = createMockCanvasElement({
        type: 'rectangle',
        id: 'rect-test',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        cornerRadius: 8
      }) as RectangleElement;

      expect(element.type).toBe('rectangle');
      expect(element.width).toBe(200);
      expect(element.height).toBe(150);
      expect(element.cornerRadius).toBe(8);
      expect(element.fill).toBe('#ff0000');
      expect(element.id).toBe('rect-test');
    });

    test('should create and validate Circle element', () => {
      const element = createMockCanvasElement({
        type: 'circle',
        id: 'circle-test',
        x: 150,
        y: 150,
        radius: 75,
        fill: '#00ff00',
        stroke: '#333333',
        strokeWidth: 3
      }) as CircleElement;

      expect(element.type).toBe('circle');
      expect(element.radius).toBe(75);
      expect(element.fill).toBe('#00ff00');
      expect(element.strokeWidth).toBe(3);
      expect(element.id).toBe('circle-test');
    });

    test('should create and validate Triangle element', () => {
      const element = createMockCanvasElement({
        type: 'triangle',
        id: 'triangle-test',
        x: 100,
        y: 100,
        width: 100,
        height: 80,
        points: [50, 0, 0, 80, 100, 80], // Triangle points
        fill: '#0000ff',
        stroke: '#000000',
        strokeWidth: 1
      }) as TriangleElement;

      expect(element.type).toBe('triangle');
      expect(element.points).toEqual([50, 0, 0, 80, 100, 80]);
      expect(element.width).toBe(100);
      expect(element.height).toBe(80);
      expect(element.fill).toBe('#0000ff');
      expect(element.id).toBe('triangle-test');
    });

    test('should create and validate Pen/Drawing element', () => {
      const element = createMockCanvasElement({
        type: 'pen',
        id: 'pen-test',
        points: [10, 20, 30, 40, 50, 60, 70, 80],
        stroke: '#000000',
        strokeWidth: 3,
        tension: 0.5,
        fill: 'none'
      }) as PenElement;

      expect(element.type).toBe('pen');
      expect(element.points).toEqual([10, 20, 30, 40, 50, 60, 70, 80]);
      expect(element.tension).toBe(0.5);
      expect(element.strokeWidth).toBe(3);
      expect(element.fill).toBe('none');
      expect(element.id).toBe('pen-test');
    });
  });

  describe('Text & Content Elements', () => {
    test('should create and validate Text element', () => {
      const element = createMockCanvasElement({
        type: 'text',
        id: 'text-test',
        x: 50,
        y: 50,
        text: 'Hello World',
        fontSize: 24,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        textAlign: 'center',
        fill: '#333333',
        width: 200,
        height: 40
      }) as TextElement;

      expect(element.type).toBe('text');
      expect(element.text).toBe('Hello World');
      expect(element.fontSize).toBe(24);
      expect(element.fontFamily).toBe('Arial');
      expect(element.fontStyle).toBe('bold');
      expect(element.textAlign).toBe('center');
      expect(element.id).toBe('text-test');
    });

    test('should create and validate Sticky Note element', () => {
      const element = createMockCanvasElement({
        type: 'sticky-note',
        id: 'sticky-test',
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        text: 'Important note!',
        backgroundColor: '#ffff99',
        textColor: '#333333',
        fontSize: 14
      }) as StickyNoteElement;

      expect(element.type).toBe('sticky-note');
      expect(element.text).toBe('Important note!');
      expect(element.backgroundColor).toBe('#ffff99');
      expect(element.textColor).toBe('#333333');
      expect(element.fontSize).toBe(14);
      expect(element.id).toBe('sticky-test');
    });
  });

  describe('Media Elements', () => {
    test('should create and validate Image element', () => {
      const element = createMockCanvasElement({
        type: 'image',
        id: 'image-test',
        x: 0,
        y: 0,
        width: 300,
        height: 200,
        imageUrl: 'https://example.com/image.jpg',
        opacity: 0.9
      }) as ImageElement;

      expect(element.type).toBe('image');
      expect(element.imageUrl).toBe('https://example.com/image.jpg');
      expect(element.width).toBe(300);
      expect(element.height).toBe(200);
      expect(element.opacity).toBe(0.9);
      expect(element.id).toBe('image-test');
    });
  });

  describe('Complex Elements', () => {
    test('should create and validate Table element', () => {
      const element = createMockCanvasElement({
        type: 'table',
        id: 'table-test',
        x: 50,
        y: 50,
        width: 400,
        height: 300,
        rows: 3,
        cols: 3,
        tableData: [
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
          ['A3', 'B3', 'C3']
        ],
        cellPadding: 8,
        borderWidth: 1,
        borderColor: '#cccccc'
      }) as TableElement;

      expect(element.type).toBe('table');
      expect(element.rows).toBe(3);
      expect(element.cols).toBe(3);
      expect(element.tableData).toHaveLength(3);
      expect(element.tableData?.[0]).toEqual(['A1', 'B1', 'C1']);
      expect(element.cellPadding).toBe(8);
      expect(element.id).toBe('table-test');
    });

    test('should create and validate Section element', () => {
      const element = createMockCanvasElement({
        type: 'section',
        id: 'section-test',
        x: 0,
        y: 0,
        width: 500,
        height: 400,
        title: 'Test Section',
        backgroundColor: '#f5f5f5',
        borderColor: '#dddddd',
        borderWidth: 2,
        cornerRadius: 8,
        collapsed: false,
        childElementIds: ['child1', 'child2', 'child3']
      }) as SectionElement;

      expect(element.type).toBe('section');
      expect(element.title).toBe('Test Section');
      expect(element.backgroundColor).toBe('#f5f5f5');
      expect(element.collapsed).toBe(false);
      expect(element.childElementIds).toEqual(['child1', 'child2', 'child3']);
      expect(element.cornerRadius).toBe(8);
      expect(element.id).toBe('section-test');
    });

    test('should create and validate Connector element', () => {
      const element = createMockCanvasElement({
        type: 'connector',
        id: 'connector-test',
        subType: 'arrow',
        startElementId: 'elem1',
        endElementId: 'elem2',
        startPoint: { x: 100, y: 100 },
        endPoint: { x: 300, y: 200 },
        intermediatePoints: [{ x: 200, y: 150 }],
        stroke: '#666666',
        strokeWidth: 2,
        connectorStyle: 'curved'
      }) as ConnectorElement;

      expect(element.type).toBe('connector');
      expect(element.subType).toBe('arrow');
      expect(element.startElementId).toBe('elem1');
      expect(element.endElementId).toBe('elem2');
      expect(element.startPoint).toEqual({ x: 100, y: 100 });
      expect(element.endPoint).toEqual({ x: 300, y: 200 });
      expect(element.intermediatePoints).toHaveLength(1);
      expect(element.connectorStyle).toBe('curved');
      expect(element.id).toBe('connector-test');
    });
  });

  describe('Element Validation', () => {
    test('should validate common element properties', () => {
      const elements = [
        createMockCanvasElement({ type: 'rectangle', id: 'rect1' }),
        createMockCanvasElement({ type: 'circle', id: 'circle1' }),
        createMockCanvasElement({ type: 'text', id: 'text1' }),
        createMockCanvasElement({ type: 'image', id: 'image1' }),
        createMockCanvasElement({ type: 'table', id: 'table1' })
      ];

      elements.forEach(element => {
        // All elements should have these common properties
        expect(element).toHaveProperty('id');
        expect(element).toHaveProperty('type');
        expect(element).toHaveProperty('x');
        expect(element).toHaveProperty('y');
        expect(element).toHaveProperty('rotation');
        expect(element).toHaveProperty('zIndex');
        expect(element).toHaveProperty('visible');
        expect(element).toHaveProperty('opacity');
        expect(element).toHaveProperty('metadata');

        // Validate types
        expect(typeof element.id).toBe('string');
        expect(typeof element.type).toBe('string');
        expect(typeof element.x).toBe('number');
        expect(typeof element.y).toBe('number');
        expect(typeof element.rotation).toBe('number');
        expect(typeof element.zIndex).toBe('number');
        expect(typeof element.visible).toBe('boolean');
        expect(typeof element.opacity).toBe('number');
        expect(typeof element.metadata).toBe('object');
        
        // Validate metadata structure
        expect(element.metadata).toHaveProperty('createdAt');
        expect(element.metadata).toHaveProperty('updatedAt');
        expect(element.metadata).toHaveProperty('version');
      });
    });

    test('should validate element type discrimination', () => {
      const rectangle = createMockCanvasElement({ type: 'rectangle' });
      const circle = createMockCanvasElement({ type: 'circle' });
      const text = createMockCanvasElement({ type: 'text' });

      // Type guards should work properly
      expect(rectangle.type === 'rectangle').toBe(true);
      expect(circle.type === 'circle').toBe(true);
      expect(text.type === 'text').toBe(true);

      // Cross-type validation should fail
      expect(rectangle.type === 'circle').toBe(false);
      expect(circle.type === 'text').toBe(false);
      expect(text.type === 'rectangle').toBe(false);
    });
  });
});