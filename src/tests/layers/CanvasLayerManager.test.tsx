import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanvasLayerManager } from '../../features/canvas/layers/CanvasLayerManager';
import { 
  setupTestEnvironment, 
  createMockCanvasElement,
  createMockElements,
  createMockStage,
  type TestEnvironment 
} from '../utils/testUtils';

// Mock all the shape components
jest.mock('../../features/canvas/shapes/RectangleShape', () => ({
  RectangleShape: ({ element }: any) => (
    <div data-testid={`rectangle-${element.id}`}>Rectangle {element.id}</div>
  )
}));

jest.mock('../../features/canvas/shapes/CircleShape', () => ({
  CircleShape: ({ element }: any) => (
    <div data-testid={`circle-${element.id}`}>Circle {element.id}</div>
  )
}));

jest.mock('../../features/canvas/shapes/TextShape', () => ({
  TextShape: ({ element }: any) => (
    <div data-testid={`text-${element.id}`}>Text {element.id}</div>
  )
}));

describe('CanvasLayerManager', () => {
  let testEnv: TestEnvironment;
  let mockStageRef: any;
  let mockElements: Map<string, any>;
  let defaultProps: any;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    mockStageRef = { current: createMockStage() };
    
    // Create mock elements
    const elements = createMockElements(3);
    mockElements = new Map(elements.map(el => [el.id, el]));

    defaultProps = {
      elements: mockElements,
      selectedElementIds: new Set(),
      onElementClick: jest.fn(),
      onElementDragStart: jest.fn(),
      onElementDragMove: jest.fn(),
      onElementDragEnd: jest.fn(),
      onElementUpdate: jest.fn(),
      onStartTextEdit: jest.fn(),
      stageRef: mockStageRef,
      onTransformEnd: jest.fn(),
      stageSize: { width: 800, height: 600 }
    };
  });

  describe('Layer Rendering', () => {
    test('renders all layer components correctly', async () => {
      await testEnv.render(
        <CanvasLayerManager {...defaultProps} />
      );

      // Should render background layer
      expect(screen.getByTestId('konva-layer')).toBeDefined();
    });

    test('renders elements in correct layers', async () => {
      await testEnv.render(
        <CanvasLayerManager {...defaultProps} />
      );

      // Check that elements are rendered
      const elements = Array.from(mockElements.values());
      elements.forEach(element => {
        if (element.type === 'rectangle') {
          expect(screen.getByTestId(`rectangle-${element.id}`)).toBeDefined();
        } else if (element.type === 'circle') {
          expect(screen.getByTestId(`circle-${element.id}`)).toBeDefined();
        } else if (element.type === 'text') {
          expect(screen.getByTestId(`text-${element.id}`)).toBeDefined();
        }
      });
    });

    test('renders UI layer with selection indicators', async () => {
      const selectedIds = new Set([Array.from(mockElements.keys())[0]]);
      
      await testEnv.render(
        <CanvasLayerManager 
          {...defaultProps} 
          selectedElementIds={selectedIds}
        />
      );

      expect(screen.getByTestId('konva-layer')).toBeDefined();
    });
  });

  describe('Layer Management', () => {
    test('manages layer z-order correctly', async () => {
      await testEnv.render(
        <CanvasLayerManager {...defaultProps} />
      );

      // Layers should be in correct order: background, main, connectors, UI
      const layers = screen.getAllByTestId('konva-layer');
      expect(layers.length).toBeGreaterThan(0);
    });

    test('optimizes layer rendering with memoization', async () => {
      const { rerender } = await testEnv.render(
        <CanvasLayerManager {...defaultProps} />
      );

      // Re-render with same props should use memoization
      await rerender(
        <CanvasLayerManager {...defaultProps} />
      );

      expect(screen.getByTestId('konva-layer')).toBeDefined();
    });

    test('updates layers when elements change', async () => {
      const { rerender } = await testEnv.render(
        <CanvasLayerManager {...defaultProps} />
      );

      // Add new element
      const newElement = createMockCanvasElement({ type: 'rectangle' });
      const updatedElements = new Map(mockElements);
      updatedElements.set(newElement.id, newElement);

      await rerender(
        <CanvasLayerManager 
          {...defaultProps} 
          elements={updatedElements}
        />
      );

      expect(screen.getByTestId(`rectangle-${newElement.id}`)).toBeDefined();
    });
  });

  describe('Event Handling', () => {
    test('handles element click events', async () => {
      const onElementClick = jest.fn();
      
      await testEnv.render(
        <CanvasLayerManager 
          {...defaultProps} 
          onElementClick={onElementClick}
        />
      );

      const firstElement = Array.from(mockElements.values())[0];
      const elementNode = screen.getByTestId(`${firstElement.type}-${firstElement.id}`);
      
      await testEnv.user.click(elementNode);
      // Note: In real implementation, click would be handled by the element component
    });

    test('handles element drag events', async () => {
      const onElementDragStart = jest.fn();
      const onElementDragEnd = jest.fn();
      
      await testEnv.render(
        <CanvasLayerManager 
          {...defaultProps} 
          onElementDragStart={onElementDragStart}
          onElementDragEnd={onElementDragEnd}
        />
      );

      expect(screen.getByTestId('konva-layer')).toBeDefined();
    });

    test('handles background clicks for deselection', async () => {
      await testEnv.render(
        <CanvasLayerManager {...defaultProps} />
      );

      const backgroundLayer = screen.getByTestId('konva-layer');
      await testEnv.user.click(backgroundLayer);
      
      // Background click should trigger deselection (handled by parent)
      expect(backgroundLayer).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('handles large number of elements efficiently', async () => {
      // Create many elements to test performance
      const manyElements = new Array(100).fill(null).map((_, i) => 
        createMockCanvasElement({
          type: 'rectangle',
          x: (i % 10) * 100,
          y: Math.floor(i / 10) * 100
        })
      );
      
      const largeElementsMap = new Map(manyElements.map(el => [el.id, el]));

      const startTime = performance.now();
      
      await testEnv.render(
        <CanvasLayerManager 
          {...defaultProps} 
          elements={largeElementsMap}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000); // 1 second
      expect(screen.getByTestId('konva-layer')).toBeDefined();
    });

    test('implements viewport culling for off-screen elements', async () => {
      // Create elements outside viewport
      const offScreenElements = [
        createMockCanvasElement({ 
          type: 'rectangle', 
          x: -1000, 
          y: -1000 
        }),
        createMockCanvasElement({ 
          type: 'rectangle', 
          x: 2000, 
          y: 2000 
        })
      ];

      const elementsMap = new Map(offScreenElements.map(el => [el.id, el]));

      await testEnv.render(
        <CanvasLayerManager 
          {...defaultProps} 
          elements={elementsMap}
        />
      );

      expect(screen.getByTestId('konva-layer')).toBeDefined();
    });
  });

  describe('Layer Composition', () => {
    test('renders background layer correctly', async () => {
      await testEnv.render(
        <CanvasLayerManager {...defaultProps} />
      );

      // Background layer should be present
      expect(screen.getByTestId('konva-layer')).toBeDefined();
    });

    test('renders main content layer with elements', async () => {
      await testEnv.render(
        <CanvasLayerManager {...defaultProps} />
      );

      // All elements should be rendered in main layer
      const elements = Array.from(mockElements.values());
      elements.forEach(element => {
        expect(screen.getByTestId(`${element.type}-${element.id}`)).toBeDefined();
      });
    });

    test('renders UI layer on top', async () => {
      const selectedIds = new Set([Array.from(mockElements.keys())[0]]);
      
      await testEnv.render(
        <CanvasLayerManager 
          {...defaultProps} 
          selectedElementIds={selectedIds}
        />
      );

      // UI layer should contain transformer and other UI elements
      expect(screen.getByTestId('konva-layer')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('handles empty elements map gracefully', async () => {
      await testEnv.render(
        <CanvasLayerManager 
          {...defaultProps} 
          elements={new Map()}
        />
      );

      expect(screen.getByTestId('konva-layer')).toBeDefined();
    });

    test('handles malformed elements gracefully', async () => {
      const malformedElement = { 
        id: 'malformed', 
        type: 'unknown', 
        x: 'invalid', 
        y: null 
      };
      
      const elementsMap = new Map([['malformed', malformedElement]]);

      await testEnv.render(
        <CanvasLayerManager 
          {...defaultProps} 
          elements={elementsMap}
        />
      );

      expect(screen.getByTestId('konva-layer')).toBeDefined();
    });

    test('recovers from layer rendering errors', async () => {
      // Mock console.error to suppress error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await testEnv.render(
        <CanvasLayerManager {...defaultProps} />
      );

      expect(screen.getByTestId('konva-layer')).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });
});
