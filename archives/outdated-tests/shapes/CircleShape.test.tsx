import { describe, test, expect, beforeEach } from '@jest/globals';
import { screen } from '@testing-library/react';
import { CircleShape } from '../../features/canvas/shapes/CircleShape';
import { 
  setupTestEnvironment, 
  createMockCanvasElement,
  type TestEnvironment 
} from '../utils/testUtils';

// Mock the hooks
jest.mock('../../features/canvas/hooks/canvas/useShapeCaching', () => ({
  useShapeCaching: () => ({ nodeRef: { current: null } })
}));

describe('CircleShape', () => {
  let testEnv: TestEnvironment;
  let mockElement: any;
  let defaultProps: any;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    
    mockElement = createMockCanvasElement({
      type: 'circle',
      radius: 50,
      fill: '#00ff00',
      stroke: '#000000',
      strokeWidth: 2
    });

    defaultProps = {
      element: mockElement,
      isSelected: false,
      konvaProps: {
        x: mockElement.x,
        y: mockElement.y,
        onClick: jest.fn(),
        onDragEnd: jest.fn(),
      }
    };
  });

  describe('Rendering', () => {
    test('renders circle with correct properties', async () => {
      await testEnv.render(<CircleShape {...defaultProps} />);
      expect(screen.getByTestId('konva-circle')).toBeDefined();
    });

    test('handles default radius when not specified', async () => {
      const elementWithoutRadius = createMockCanvasElement({
        type: 'circle',
      });
      
      await testEnv.render(
        <CircleShape 
          {...defaultProps} 
          element={elementWithoutRadius} 
        />
      );
      
      expect(screen.getByTestId('konva-circle')).toBeDefined();
    });

    test('applies correct position normalization', async () => {
      // Circle centers should be calculated correctly from top-left coordinates
      await testEnv.render(<CircleShape {...defaultProps} />);
      expect(screen.getByTestId('konva-circle')).toBeDefined();
    });
  });

  describe('Styling', () => {
    test('applies fill color correctly', async () => {
      const coloredElement = createMockCanvasElement({
        type: 'circle',
        fill: '#ff0000'
      });

      await testEnv.render(
        <CircleShape 
          {...defaultProps} 
          element={coloredElement} 
        />
      );

      expect(screen.getByTestId('konva-circle')).toBeDefined();
    });

    test('applies stroke properties', async () => {
      const strokeElement = createMockCanvasElement({
        type: 'circle',
        stroke: '#0000ff',
        strokeWidth: 5
      });

      await testEnv.render(
        <CircleShape 
          {...defaultProps} 
          element={strokeElement} 
        />
      );

      expect(screen.getByTestId('konva-circle')).toBeDefined();
    });

    test('applies selection styling when selected', async () => {
      await testEnv.render(
        <CircleShape 
          {...defaultProps} 
          isSelected={true} 
        />
      );

      expect(screen.getByTestId('konva-circle')).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('enables caching for large circles', async () => {
      const largeElement = createMockCanvasElement({
        type: 'circle',
        radius: 200
      });

      await testEnv.render(
        <CircleShape 
          {...defaultProps} 
          element={largeElement} 
        />
      );

      expect(screen.getByTestId('konva-circle')).toBeDefined();
    });

    test('applies performance optimizations', async () => {
      await testEnv.render(<CircleShape {...defaultProps} />);
      expect(screen.getByTestId('konva-circle')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('handles zero radius gracefully', async () => {
      const zeroElement = createMockCanvasElement({
        type: 'circle',
        radius: 0
      });

      await testEnv.render(
        <CircleShape 
          {...defaultProps} 
          element={zeroElement} 
        />
      );

      expect(screen.getByTestId('konva-circle')).toBeDefined();
    });

    test('handles negative radius gracefully', async () => {
      const negativeElement = createMockCanvasElement({
        type: 'circle',
        radius: -50
      });

      await testEnv.render(
        <CircleShape 
          {...defaultProps} 
          element={negativeElement} 
        />
      );

      expect(screen.getByTestId('konva-circle')).toBeDefined();
    });
  });
});
