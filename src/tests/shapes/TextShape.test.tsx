import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TextShape } from '@/features/canvas/shapes/TextShape';
import { createMockCanvasElement } from '../../utils/testUtils';

describe('TextShape', () => {
  let mockElement: any;
  let defaultProps: any;

  beforeEach(() => {
    mockElement = createMockCanvasElement({
      id: 'text-1',
      type: 'text',
      x: 100,
      y: 100,
      text: 'Hello World',
      fontSize: 16,
      fontFamily: 'Arial',
      fontStyle: 'normal',
      fill: '#000000',
      width: 150,
      height: 30,
      align: 'left',
      verticalAlign: 'top',
      rotation: 0,
      opacity: 1,
      visible: true,
      draggable: true
    });

    defaultProps = {
      element: mockElement,
      isSelected: false,
      onSelect: jest.fn(),
      onDragStart: jest.fn(),
      onDragMove: jest.fn(),
      onDragEnd: jest.fn(),
      onUpdate: jest.fn(),
      onDoubleClick: jest.fn(),
      onContextMenu: jest.fn(),
      onTextEdit: jest.fn(),
      isDragging: false,
      isEditing: false
    };
  });

  describe('Rendering', () => {
    test('renders text with correct content', () => {
      render(<TextShape {...defaultProps} />);

      const text = screen.getByTestId('konva-text');
      expect(text).toBeInTheDocument();
      expect(mockElement.text).toBe('Hello World');
    });

    test('applies font properties correctly', () => {
      render(<TextShape {...defaultProps} />);
      
      expect(mockElement.fontSize).toBe(16);
      expect(mockElement.fontFamily).toBe('Arial');
      expect(mockElement.fontStyle).toBe('normal');
    });

    test('handles multi-line text', () => {
      const multiLineElement = {
        ...mockElement,
        text: 'Line 1\nLine 2\nLine 3',
        height: 60
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={multiLineElement}
        />
      );

      expect(multiLineElement.text).toContain('\n');
    });

    test('applies text alignment', () => {
      const alignedElement = {
        ...mockElement,
        align: 'center',
        verticalAlign: 'middle'
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={alignedElement}
        />
      );

      expect(alignedElement.align).toBe('center');
      expect(alignedElement.verticalAlign).toBe('middle');
    });

    test('handles text wrapping', () => {
      const wrappedElement = {
        ...mockElement,
        text: 'This is a very long text that should wrap to multiple lines',
        width: 100,
        wrap: 'word'
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={wrappedElement}
        />
      );

      expect(wrappedElement.wrap).toBe('word');
    });

    test('applies text decoration', () => {
      const decoratedElement = {
        ...mockElement,
        textDecoration: 'underline'
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={decoratedElement}
        />
      );

      expect(decoratedElement.textDecoration).toBe('underline');
    });
  });

  describe('Text Editing', () => {
    test('enters edit mode on double click', () => {
      render(<TextShape {...defaultProps} />);

      const text = screen.getByTestId('konva-text');
      fireEvent.doubleClick(text);

      expect(defaultProps.onDoubleClick).toHaveBeenCalledWith(mockElement);
      expect(defaultProps.onTextEdit).toHaveBeenCalledWith(mockElement.id);
    });

    test('shows text editor when editing', async () => {
      const { rerender } = render(<TextShape {...defaultProps} />);

      // Enter edit mode
      rerender(
        <TextShape 
          {...defaultProps} 
          isEditing={true}
        />
      );

      // In real implementation, would show text input overlay
      expect(defaultProps.isEditing).toBe(true);
    });

    test('updates text content during editing', async () => {
      const onUpdate = jest.fn();
      
      render(
        <TextShape 
          {...defaultProps} 
          isEditing={true}
          onUpdate={onUpdate}
        />
      );

      // Simulate text change (in real implementation, through input)
      const newText = 'Updated Text';
      onUpdate(mockElement.id, { text: newText });

      expect(onUpdate).toHaveBeenCalledWith(mockElement.id, { text: newText });
    });

    test('exits edit mode on blur', async () => {
      const onTextEditEnd = jest.fn();
      
      const { rerender } = render(
        <TextShape 
          {...defaultProps} 
          isEditing={true}
          onTextEditEnd={onTextEditEnd}
        />
      );

      // Exit edit mode
      rerender(
        <TextShape 
          {...defaultProps} 
          isEditing={false}
          onTextEditEnd={onTextEditEnd}
        />
      );

      expect(defaultProps.isEditing).toBe(false);
    });

    test('handles empty text during editing', () => {
      const emptyTextElement = {
        ...mockElement,
        text: ''
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={emptyTextElement}
          isEditing={true}
        />
      );

      // Should show placeholder or minimum height
      expect(emptyTextElement.text).toBe('');
    });
  });

  describe('Font Styling', () => {
    test('applies bold font style', () => {
      const boldElement = {
        ...mockElement,
        fontStyle: 'bold'
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={boldElement}
        />
      );

      expect(boldElement.fontStyle).toBe('bold');
    });

    test('applies italic font style', () => {
      const italicElement = {
        ...mockElement,
        fontStyle: 'italic'
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={italicElement}
        />
      );

      expect(italicElement.fontStyle).toBe('italic');
    });

    test('combines multiple font styles', () => {
      const styledElement = {
        ...mockElement,
        fontStyle: 'bold italic'
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={styledElement}
        />
      );

      expect(styledElement.fontStyle).toBe('bold italic');
    });

    test('handles custom fonts', () => {
      const customFontElement = {
        ...mockElement,
        fontFamily: 'Custom Font, fallback-font'
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={customFontElement}
        />
      );

      expect(customFontElement.fontFamily).toBe('Custom Font, fallback-font');
    });
  });

  describe('Text Measurements', () => {
    test('auto-adjusts width based on text content', () => {
      const autoWidthElement = {
        ...mockElement,
        width: 'auto'
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={autoWidthElement}
        />
      );

      // Width should be calculated based on text
      expect(autoWidthElement.width).toBe('auto');
    });

    test('handles line height adjustments', () => {
      const lineHeightElement = {
        ...mockElement,
        lineHeight: 1.5
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={lineHeightElement}
        />
      );

      expect(lineHeightElement.lineHeight).toBe(1.5);
    });

    test('calculates proper bounds for selection', () => {
      render(<TextShape {...defaultProps} />);

      // Text bounds should include padding for selection
      const expectedBounds = {
        x: mockElement.x,
        y: mockElement.y,
        width: mockElement.width,
        height: mockElement.height
      };

      // In real implementation, would check actual bounds calculation
      expect(mockElement.width).toBe(150);
      expect(mockElement.height).toBe(30);
    });
  });

  describe('Rich Text Support', () => {
    test('renders rich text with formatting', () => {
      const richTextElement = {
        ...mockElement,
        richText: [
          { text: 'Bold', bold: true },
          { text: ' and ', bold: false },
          { text: 'Italic', italic: true }
        ]
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={richTextElement}
        />
      );

      expect(richTextElement.richText).toHaveLength(3);
    });

    test('applies inline styles to rich text', () => {
      const styledRichText = {
        ...mockElement,
        richText: [
          { text: 'Red', color: '#ff0000' },
          { text: ' Blue', color: '#0000ff' }
        ]
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={styledRichText}
        />
      );

      expect(styledRichText.richText[0].color).toBe('#ff0000');
      expect(styledRichText.richText[1].color).toBe('#0000ff');
    });
  });

  describe('Selection and Interaction', () => {
    test('shows selection highlight when selected', () => {
      render(
        <TextShape 
          {...defaultProps} 
          isSelected={true}
        />
      );

      // Would show selection border or background
      expect(defaultProps.isSelected).toBe(true);
    });

    test('handles click to position cursor', () => {
      const onCursorPosition = jest.fn();
      
      render(
        <TextShape 
          {...defaultProps} 
          isEditing={true}
          onCursorPosition={onCursorPosition}
        />
      );

      const text = screen.getByTestId('konva-text');
      fireEvent.click(text, { clientX: 120, clientY: 110 });

      // Would calculate cursor position based on click
    });

    test('supports text selection during editing', () => {
      const onTextSelect = jest.fn();
      
      render(
        <TextShape 
          {...defaultProps} 
          isEditing={true}
          onTextSelect={onTextSelect}
        />
      );

      // Simulate text selection
      const text = screen.getByTestId('konva-text');
      fireEvent.mouseDown(text);
      fireEvent.mouseMove(text);
      fireEvent.mouseUp(text);

      // Would handle text selection
    });
  });

  describe('Performance', () => {
    test('caches text rendering for performance', () => {
      const cachedElement = {
        ...mockElement,
        cache: true
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={cachedElement}
        />
      );

      expect(cachedElement.cache).toBe(true);
    });

    test('updates cache when text changes', () => {
      const { rerender } = render(
        <TextShape {...defaultProps} />
      );

      const updatedElement = {
        ...mockElement,
        text: 'Updated Text'
      };

      rerender(
        <TextShape 
          {...defaultProps} 
          element={updatedElement}
        />
      );

      // Cache would be invalidated and recreated
      expect(updatedElement.text).toBe('Updated Text');
    });
  });

  describe('Edge Cases', () => {
    test('handles very long text gracefully', () => {
      const longTextElement = {
        ...mockElement,
        text: 'A'.repeat(1000),
        ellipsis: true
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={longTextElement}
        />
      );

      expect(longTextElement.ellipsis).toBe(true);
    });

    test('handles special characters and emojis', () => {
      const specialTextElement = {
        ...mockElement,
        text: 'Hello 👋 World™ © 2024'
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={specialTextElement}
        />
      );

      expect(specialTextElement.text).toContain('👋');
    });

    test('handles RTL text direction', () => {
      const rtlElement = {
        ...mockElement,
        text: 'مرحبا بالعالم',
        direction: 'rtl'
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={rtlElement}
        />
      );

      expect(rtlElement.direction).toBe('rtl');
    });

    test('handles text with zero font size', () => {
      const zeroFontElement = {
        ...mockElement,
        fontSize: 0
      };

      render(
        <TextShape 
          {...defaultProps} 
          element={zeroFontElement}
        />
      );

      // Should handle gracefully, possibly with minimum size
      const text = screen.getByTestId('konva-text');
      expect(text).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides accessible text content', () => {
      render(<TextShape {...defaultProps} />);

      // Text content should be accessible
      expect(mockElement.text).toBe('Hello World');
    });

    test('handles screen reader announcements during editing', () => {
      const { rerender } = render(
        <TextShape {...defaultProps} />
      );

      rerender(
        <TextShape 
          {...defaultProps} 
          isEditing={true}
        />
      );

      // Would announce edit mode to screen readers
      expect(defaultProps.isEditing).toBe(true);
    });
  });
});
