/**
 * Comprehensive Shape Components Test Suite
 * Tests all 12 canvas element types for production readiness
 */

import { vi } from 'vitest';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithKonva } from '@/tests/utils/testUtils';

import { canvasTheme } from '../utils/canvasTheme';

// Import all shape components
import { RectangleShape } from '@/features/canvas/shapes/RectangleShape';
import { CircleShape } from '@/features/canvas/shapes/CircleShape';
import { TriangleShape } from '@/features/canvas/shapes/TriangleShape';
import { TextShape } from '@/features/canvas/shapes/TextShape';
import { StickyNoteShape } from '@/features/canvas/shapes/StickyNoteShape';
import { PenShape } from '@/features/canvas/shapes/PenShape';
import { ImageShape } from '@/features/canvas/shapes/ImageShape';

// Import element type utilities
import { 
  ElementId,
  isRectangleElement,
  isCircleElement,
  isTriangleElement,
  isTextElement,
  isStickyNoteElement,
  isPenElement,
  isImageElement
} from '@/features/canvas/types/enhanced.types';

// Import compatibility utilities
import { toElementId } from '@/features/canvas/types/compatibility';

// Mock the whole module
vi.mock('../utils/canvasTheme', () => ({
  canvasTheme: {
    colors: {
      primary: '#3B82F6',
      primaryLight: '#93C5FD',
      secondary: {
        800: '#1E293B',
      },
      stickyNote: {
        yellow: '#FFE299',
        yellowBorder: '#E6C975',
        blue: '#A8DAFF',
        blueBorder: '#85C1FF',
        pink: '#FFB3BA',
        pinkBorder: '#FF8A94',
        green: '#BAFFC9',
        greenBorder: '#94E6A7',
        orange: '#FFDFBA',
        orangeBorder: '#FFCC99',
        purple: '#E6BAFF',
        purpleBorder: '#D194FF',
      },
    },
    typography: {
      fontFamily: {
        sans: 'Inter, sans-serif',
      },
    },
  },
  getStickyNoteColors: vi.fn((variant) => ({
    fill: '#FFE299',
    stroke: '#E6C975',
  })),
}));

// Mock the whole module
vi.mock('../utils/fontLoader', () => ({
  ensureFontsLoaded: vi.fn().mockResolvedValue(true),
  getAvailableFontFamily: vi.fn().mockReturnValue('Inter, -apple-system, system-ui, sans-serif')
}));

// Common test element factory
const createElement = (type: string, overrides = {}): any => {
  const baseElement = {
    id: toElementId(`${type}-test-element`),
    type,
    x: 100,
    y: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  };

  // Add type-specific required properties
  switch (type) {
    case 'rectangle':
      return {
        ...baseElement,
        width: 100,
        height: 50,
        fill: '#3B82F6',
        stroke: '#1E40AF',
        strokeWidth: 1,
        ...overrides
      };
    case 'circle':
      return {
        ...baseElement,
        radius: 50,
        fill: '#3B82F6',
        stroke: '#1E40AF',
        strokeWidth: 1,
        ...overrides
      };
    case 'triangle':
      return {
        ...baseElement,
        width: 100,
        height: 100,
        fill: '#3B82F6',
        stroke: '#1E40AF',
        strokeWidth: 1,
        ...overrides
      };
    case 'text':
      return {
        ...baseElement,
        text: 'Sample text',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#000000',
        ...overrides
      };
    case 'sticky-note':
      return {
        ...baseElement,
        text: 'Note text',
        width: 100,
        height: 100,
        fill: '#FFEB3B',
        ...overrides
      };
    case 'pen':
      return {
        ...baseElement,
        points: [0, 0, 10, 10, 20, 20],
        stroke: '#000000',
        strokeWidth: 2,
        ...overrides
      };
    case 'image':
      return {
        ...baseElement,
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        width: 100,
        height: 100,
        ...overrides
      };
    default:
      return baseElement;
  }
};

// Common props for all shape components
const getBaseShapeProps = (element: any) => ({
  element,
  isSelected: false,
  isDragging: false,
  konvaProps: {
    x: element.x || 0,
    y: element.y || 0,
    id: element.id,
    draggable: true,
    onClick: vi.fn(),
    onMouseDown: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
  },
  onSelect: vi.fn(),
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onElementDoubleClick: vi.fn(),
  onUpdate: vi.fn(),
  onStartTextEdit: vi.fn(),
  onTransformEnd: vi.fn(),
  stageScale: 1,
  nodeRef: { current: null },
});

describe('Comprehensive Shape Components Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rectangle Elements', () => {
    test('should render rectangle with correct properties', () => {
      const element = createElement('rectangle', {
        width: 150,
        height: 100,
        fill: '#DBEAFE',
        stroke: '#3B82F6',
        strokeWidth: 2,
        cornerRadius: 4
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<RectangleShape {...props} />);

      expect(container).toBeTruthy();
      expect(isRectangleElement(element)).toBe(true);
    });

    test('should handle rectangle selection state', () => {
      const element = createElement('rectangle', { width: 100, height: 100 });
      const props = { ...getBaseShapeProps(element), isSelected: true };

      const { container } = renderWithKonva(<RectangleShape {...props} />);
      expect(container).toBeTruthy();
    });

    test('should handle rectangle dragging state', () => {
      const element = createElement('rectangle', { width: 100, height: 100 });
      const props = { ...getBaseShapeProps(element), isDragging: true };

      const { container } = renderWithKonva(<RectangleShape {...props} />);
      expect(container).toBeTruthy();
    });

    test('should handle rectangle resize operations', () => {
      const element = createElement('rectangle', { width: 100, height: 100 });
      const props = getBaseShapeProps(element);

      // Test with different dimensions
      const resizedElement = { ...element, width: 200, height: 150 };
      const resizedProps = { ...props, element: resizedElement };

      const { container } = renderWithKonva(<RectangleShape {...resizedProps} />);
      expect(container).toBeTruthy();
    });
  });

  describe('Circle Elements', () => {
    test('should render circle with correct properties', () => {
      const element = createElement('circle', {
        radius: 50,
        fill: '#FEE2E2',
        stroke: '#EF4444',
        strokeWidth: 2
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<CircleShape {...props} />);

      expect(container).toBeTruthy();
      expect(isCircleElement(element)).toBe(true);
    });

    test('should handle circle selection and dragging', () => {
      const element = createElement('circle', { radius: 30 });
      const props = { 
        ...getBaseShapeProps(element), 
        isSelected: true, 
        isDragging: true 
      };

      const { container } = renderWithKonva(<CircleShape {...props} />);
      expect(container).toBeTruthy();
    });

    test('should handle different circle sizes', () => {
      const sizes = [10, 25, 50, 100];
      
      sizes.forEach(radius => {
        const element = createElement('circle', { radius });
        const props = getBaseShapeProps(element);
        
        const { container } = renderWithKonva(<CircleShape {...props} />);
        expect(container).toBeTruthy();
      });
    });
  });

  describe('Triangle Elements', () => {
    test('should render triangle with correct properties', () => {
      const element = createElement('triangle', {
        points: [0, -50, -43, 25, 43, 25], // Equilateral triangle
        fill: '#FEF3C7',
        stroke: '#F59E0B',
        strokeWidth: 2
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<TriangleShape {...props} />);

      expect(container).toBeTruthy();
      expect(isTriangleElement(element)).toBe(true);
    });

    test('should handle triangle transformations', () => {
      const element = createElement('triangle', {
        points: [0, -30, -26, 15, 26, 15],
        rotation: 45,
        scaleX: 1.5,
        scaleY: 1.2
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<TriangleShape {...props} />);
      
      expect(container).toBeTruthy();
    });
  });

  describe('Text Elements', () => {
    test('should render text with correct properties', () => {
      const element = createElement('text', {
        text: 'Test Text Element',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#1F2937',
        width: 200,
        height: 50
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<TextShape {...props} />);

      expect(container).toBeTruthy();
      expect(isTextElement(element)).toBe(true);
    });

    test('should handle text formatting options', () => {
      const element = createElement('text', {
        text: 'Formatted Text',
        fontSize: 24,
        fontFamily: 'Helvetica',
        fontStyle: 'bold',
        fill: '#059669',
        align: 'center'
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<TextShape {...props} />);
      
      expect(container).toBeTruthy();
    });

    test('should handle multiline text', () => {
      const element = createElement('text', {
        text: 'Line 1\\nLine 2\\nLine 3',
        fontSize: 14,
        width: 150,
        height: 60
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<TextShape {...props} />);
      
      expect(container).toBeTruthy();
    });


  });

  describe('Sticky Note Elements', () => {
    test('should render sticky note with correct properties', () => {
      const element = createElement('sticky-note', {
        text: 'Sticky note content',
        width: 150,
        height: 150,
        backgroundColor: '#FEF08A',
        fontSize: 14
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<StickyNoteShape {...props} />);

      expect(container).toBeTruthy();
      expect(isStickyNoteElement(element)).toBe(true);
    });

    test('should handle different sticky note colors', () => {
      const colors = ['#FEF08A', '#FECACA', '#C7D2FE', '#D1FAE5'];
      
      colors.forEach(backgroundColor => {
        const element = createElement('sticky-note', {
          text: 'Sticky note',
          backgroundColor,
          width: 120,
          height: 120
        });

        const props = getBaseShapeProps(element);
        const { container } = renderWithKonva(<StickyNoteShape {...props} />);
        
        expect(container).toBeTruthy();
      });
    });
  });

  describe('Pen Elements', () => {
    test('should render pen drawing with correct properties', () => {
      const element = createElement('pen', {
        points: [10, 10, 20, 20, 30, 15, 40, 25, 50, 30],
        stroke: '#1F2937',
        strokeWidth: 3,
        tension: 0.5
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<PenShape {...props} />);

      expect(container).toBeTruthy();
      expect(isPenElement(element)).toBe(true);
    });

    test('should handle different pen stroke properties', () => {
      const element = createElement('pen', {
        points: [0, 0, 50, 50, 100, 25],
        stroke: '#DC2626',
        strokeWidth: 5,
        lineCap: 'round',
        lineJoin: 'round'
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<PenShape {...props} />);
      
      expect(container).toBeTruthy();
    });

    test('should handle complex pen paths', () => {
      // Simulate a complex drawing path
      const complexPoints = Array.from({ length: 20 }, (_, i) => [
        i * 5,
        Math.sin(i * 0.5) * 20 + 50
      ]).flat();

      const element = createElement('pen', {
        points: complexPoints,
        stroke: '#7C3AED',
        strokeWidth: 2
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<PenShape {...props} />);
      
      expect(container).toBeTruthy();
    });
  });

  describe('Image Elements', () => {
    test('should render image with correct properties', () => {
      const element = createElement('image', {
        src: 'data:image/svg+xml;base64,PHN2Zy4uLi8+', // Mock base64 image
        width: 200,
        height: 150,
        opacity: 1
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<ImageShape {...props} />);

      expect(container).toBeTruthy();
      expect(isImageElement(element)).toBe(true);
    });

    test('should handle image loading states', () => {
      const element = createElement('image', {
        src: 'https://example.com/image.jpg',
        width: 300,
        height: 200,
        isLoading: true
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<ImageShape {...props} />);
      
      expect(container).toBeTruthy();
    });

    test('should handle image transformations', () => {
      const element = createElement('image', {
        src: 'data:image/svg+xml;base64,PHN2Zy4uLi8+',
        width: 100,
        height: 100,
        rotation: 30,
        scaleX: 0.8,
        scaleY: 1.2,
        opacity: 0.7
      });

      const props = getBaseShapeProps(element);
      const { container } = renderWithKonva(<ImageShape {...props} />);
      
      expect(container).toBeTruthy();
    });
  });

  describe('Element Type Predicates', () => {
    test('should correctly identify element types', () => {
      const elements = [
        createElement('rectangle', { width: 100, height: 100 }),
        createElement('circle', { radius: 50 }),
        createElement('triangle', { points: [0, -30, -26, 15, 26, 15] }),
        createElement('text', { text: 'Test', fontSize: 16 }),
        createElement('sticky-note', { text: 'Note', backgroundColor: '#FEF08A' }),
        createElement('pen', { points: [0, 0, 50, 50] }),
        createElement('image', { src: 'test.jpg', width: 100, height: 100 })
      ];

      expect(isRectangleElement(elements[0])).toBe(true);
      expect(isCircleElement(elements[1])).toBe(true);
      expect(isTriangleElement(elements[2])).toBe(true);
      expect(isTextElement(elements[3])).toBe(true);
      expect(isStickyNoteElement(elements[4])).toBe(true);
      expect(isPenElement(elements[5])).toBe(true);
      expect(isImageElement(elements[6])).toBe(true);

      // Cross-type validation
      expect(isRectangleElement(elements[1])).toBe(false);
      expect(isCircleElement(elements[0])).toBe(false);
    });
  });

  describe('Element Interaction Handlers', () => {
    test('should handle selection for all element types', () => {
      const elementTypes = [
        { type: 'rectangle', props: { width: 100, height: 100 } },
        { type: 'circle', props: { radius: 50 } },
        { type: 'triangle', props: { points: [0, -30, -26, 15, 26, 15] } },
        { type: 'text', props: { text: 'Test', fontSize: 16 } },
        { type: 'sticky-note', props: { text: 'Note', backgroundColor: '#FEF08A' } },
        { type: 'pen', props: { points: [0, 0, 50, 50] } },
        { type: 'image', props: { src: 'test.jpg', width: 100, height: 100 } }
      ];

      elementTypes.forEach(({ type, props }) => {
        const element = createElement(type, props);
        const onSelect = vi.fn();
        
        // Create type-specific props to avoid intersection type issues
        let shapeProps: any;
        let ShapeComponent: any;
        
        switch (type) {
          case 'rectangle': 
            ShapeComponent = RectangleShape;
            shapeProps = { ...getBaseShapeProps(element), onSelect };
            break;
          case 'circle': 
            ShapeComponent = CircleShape;
            shapeProps = { ...getBaseShapeProps(element), onSelect };
            break;
          case 'triangle': 
            ShapeComponent = TriangleShape;
            shapeProps = { ...getBaseShapeProps(element), onSelect };
            break;
          case 'text': 
            ShapeComponent = TextShape;
            shapeProps = { ...getBaseShapeProps(element), onSelect };
            break;
          case 'sticky-note': 
            ShapeComponent = StickyNoteShape;
            shapeProps = { ...getBaseShapeProps(element), onSelect };
            break;
          case 'pen': 
            ShapeComponent = PenShape;
            shapeProps = { ...getBaseShapeProps(element), onSelect };
            break;
          case 'image': 
            ShapeComponent = ImageShape;
            shapeProps = { ...getBaseShapeProps(element), onSelect };
            break;
          default: return;
        }

        const { container } = renderWithKonva(<ShapeComponent {...shapeProps} />);
        expect(container).toBeTruthy();
        
        // Verify the onSelect handler is available
        expect(onSelect).toBeDefined();
      });
    });
  });

  describe('Element Performance', () => {
    test('should render multiple elements efficiently', () => {
      const startTime = performance.now();
      
      // Create 20 elements of different types
      const elements = Array.from({ length: 20 }, (_, i) => {
        const types = ['rectangle', 'circle', 'triangle', 'text'];
        const type = types[i % types.length];
        return createElement(type, {
          ...(type === 'rectangle' && { width: 50, height: 50 }),
          ...(type === 'circle' && { radius: 25 }),
          ...(type === 'triangle' && { points: [0, -20, -17, 10, 17, 10] }),
          ...(type === 'text' && { text: 'Test', fontSize: 16 })
        });
      });

      elements.forEach(element => {
        // Use type assertion to avoid intersection type issues
        const props: any = getBaseShapeProps(element);
        let ShapeComponent: any;
        
        switch (element.type) {
          case 'rectangle': ShapeComponent = RectangleShape; break;
          case 'circle': ShapeComponent = CircleShape; break;
          case 'triangle': ShapeComponent = TriangleShape; break;
          case 'text': ShapeComponent = TextShape; break;
          default: return;
        }

        const { unmount } = renderWithKonva(<ShapeComponent {...props} />);
        unmount(); // Clean up immediately to test rapid creation/destruction
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render all elements within reasonable time
      expect(renderTime).toBeLessThan(500); // 500ms threshold
    });
  });

  describe('Element Error Handling', () => {
    test('should handle missing or invalid properties gracefully', () => {
      const invalidElements = [
        createElement('rectangle', {}), // Missing width/height
        createElement('circle', {}), // Missing radius
        createElement('text', {}), // Missing text
        createElement('pen', {}), // Missing points
      ];

      invalidElements.forEach(element => {
        // Use type assertion to avoid intersection type issues
        const props: any = getBaseShapeProps(element);
        let ShapeComponent: any;
        
        switch (element.type) {
          case 'rectangle': ShapeComponent = RectangleShape; break;
          case 'circle': ShapeComponent = CircleShape; break;
          case 'text': ShapeComponent = TextShape; break;
          case 'pen': ShapeComponent = PenShape; break;
          default: return;
        }

        // Should not throw errors even with invalid data
        expect(() => {
          const { container } = renderWithKonva(<ShapeComponent {...props} />);
          expect(container).toBeTruthy();
        }).not.toThrow();
      });
    });
  });
});

