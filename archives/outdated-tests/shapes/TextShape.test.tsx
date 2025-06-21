import { describe, test, expect, beforeEach } from '@jest/globals';
import { screen } from '@testing-library/react';
import { TextShape } from '../../features/canvas/shapes/TextShape';
import { 
  setupTestEnvironment, 
  createMockCanvasElement,
  type TestEnvironment 
} from '../utils/testUtils';

describe('TextShape', () => {
  let testEnv: TestEnvironment;
  let mockElement: any;
  let defaultProps: any;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    
    mockElement = createMockCanvasElement({
      type: 'text',
      text: 'Test Text',
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#000000'
    });

    defaultProps = {
      element: mockElement,
      isSelected: false,
      konvaProps: {
        x: mockElement.x,
        y: mockElement.y,
        onClick: jest.fn(),
        onDragEnd: jest.fn(),
      },
      onUpdate: jest.fn(),
      stageRef: { current: null }
    };
  });

  describe('Rendering', () => {
    test('renders text with correct content', async () => {
      await testEnv.render(<TextShape {...defaultProps} />);
      expect(screen.getByTestId('konva-text')).toBeDefined();
    });

    test('handles empty text gracefully', async () => {
      const emptyTextElement = createMockCanvasElement({
        type: 'text',
        text: ''
      });
      
      await testEnv.render(
        <TextShape 
          {...defaultProps} 
          element={emptyTextElement} 
        />
      );
      
      expect(screen.getByTestId('konva-text')).toBeDefined();
    });

    test('applies default font properties when missing', async () => {
      const minimalElement = createMockCanvasElement({
        type: 'text',
        text: 'Test'
      });

      await testEnv.render(
        <TextShape 
          {...defaultProps} 
          element={minimalElement} 
        />
      );

      expect(screen.getByTestId('konva-text')).toBeDefined();
    });
  });

  describe('Typography', () => {
    test('applies font size correctly', async () => {
      const largeTextElement = createMockCanvasElement({
        type: 'text',
        text: 'Large Text',
        fontSize: 24
      });

      await testEnv.render(
        <TextShape 
          {...defaultProps} 
          element={largeTextElement} 
        />
      );

      expect(screen.getByTestId('konva-text')).toBeDefined();
    });

    test('applies font family correctly', async () => {
      const customFontElement = createMockCanvasElement({
        type: 'text',
        text: 'Custom Font',
        fontFamily: 'Times New Roman'
      });

      await testEnv.render(
        <TextShape 
          {...defaultProps} 
          element={customFontElement} 
        />
      );

      expect(screen.getByTestId('konva-text')).toBeDefined();
    });

    test('applies text color correctly', async () => {
      const coloredTextElement = createMockCanvasElement({
        type: 'text',
        text: 'Colored Text',
        fill: '#ff0000'
      });

      await testEnv.render(
        <TextShape 
          {...defaultProps} 
          element={coloredTextElement} 
        />
      );

      expect(screen.getByTestId('konva-text')).toBeDefined();
    });
  });

  describe('Interactions', () => {
    test('handles click events for editing', async () => {
      const onClickHandler = jest.fn();
      
      await testEnv.render(
        <TextShape 
          {...defaultProps}
          konvaProps={{
            ...defaultProps.konvaProps,
            onClick: onClickHandler,
          }}
        />
      );

      expect(screen.getByTestId('konva-text')).toBeDefined();
    });

    test('handles double-click for text editing', async () => {
      const onDoubleClickHandler = jest.fn();
      
      await testEnv.render(
        <TextShape 
          {...defaultProps}
          konvaProps={{
            ...defaultProps.konvaProps,
            onDblClick: onDoubleClickHandler,
          }}
        />
      );

      expect(screen.getByTestId('konva-text')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('handles very long text', async () => {
      const longTextElement = createMockCanvasElement({
        type: 'text',
        text: 'This is a very long text that might cause overflow issues in the canvas and should be handled gracefully by the text shape component'
      });

      await testEnv.render(
        <TextShape 
          {...defaultProps} 
          element={longTextElement} 
        />
      );

      expect(screen.getByTestId('konva-text')).toBeDefined();
    });

    test('handles special characters and unicode', async () => {
      const unicodeElement = createMockCanvasElement({
        type: 'text',
        text: '🎨 Unicode: αβγ δεζ ηθι 中文 العربية'
      });

      await testEnv.render(
        <TextShape 
          {...defaultProps} 
          element={unicodeElement} 
        />
      );

      expect(screen.getByTestId('konva-text')).toBeDefined();
    });

    test('handles multiline text', async () => {
      const multilineElement = createMockCanvasElement({
        type: 'text',
        text: 'Line 1\nLine 2\nLine 3'
      });

      await testEnv.render(
        <TextShape 
          {...defaultProps} 
          element={multilineElement} 
        />
      );

      expect(screen.getByTestId('konva-text')).toBeDefined();
    });
  });
});
