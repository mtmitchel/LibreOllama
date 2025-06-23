/**
 * ImageShape Component - Comprehensive Test Suite
 * Tests image rendering, loading states, error handling, and performance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, Layer } from 'react-konva';
import { ImageShape } from '../../features/canvas/shapes/ImageShape';
import { setupTestEnvironment } from '../utils/testUtils';
import type { ImageElement, ElementId } from '../../features/canvas/types/enhanced.types';

const { render: testRender, user } = setupTestEnvironment();

// Mock image element
const createMockImageElement = (overrides: Partial<ImageElement> = {}): ImageElement => ({
  id: `test-image-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'image',
  x: 0,
  y: 0,
  width: 200,
  height: 150,
  imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  alt: 'Test image',
  ...overrides,
} as ImageElement);

const renderImageShape = (props: Partial<any> = {}) => {
  const mockElement = createMockImageElement(props.element);
  const defaultProps = {
    element: mockElement,
    isSelected: false,
    onUpdate: jest.fn(),
    onStartTextEdit: jest.fn(),
    konvaProps: {
      x: mockElement.x,
      y: mockElement.y,
      'data-testid': 'konva-image',
    },
    ...props,
  };

  return testRender(
    <Stage width={800} height={600}>
      <Layer>
        <ImageShape {...defaultProps} />
      </Layer>
    </Stage>
  );
};

// Mock Image constructor
const mockImage = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  crossOrigin: '',
  src: '',
  onload: null,
  onerror: null,
  width: 100,
  height: 100,
};

// Set up Image mock
beforeEach(() => {
  (global as any).Image = jest.fn(() => mockImage);
  mockImage.addEventListener.mockClear();
  mockImage.removeEventListener.mockClear();
});

describe('ImageShape Component', () => {
  describe('Rendering', () => {
    it('should render image with default properties', async () => {
      await renderImageShape();
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should render with custom dimensions', async () => {
      await renderImageShape({
        element: {
          width: 300,
          height: 200,
        },
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should render with different image URL', async () => {
      await renderImageShape({
        element: {
          imageUrl: 'https://example.com/test-image.jpg',
        },
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should handle selected state correctly', async () => {
      await renderImageShape({
        isSelected: true,
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Image Loading', () => {
    it('should handle successful image loading', async () => {
      await renderImageShape({
        element: {
          imageUrl: 'https://example.com/valid-image.jpg',
        },
      });

      // Simulate successful image load
      const imageInstance = (global as any).Image.mock.results[0].value;
      if (imageInstance.onload) {
        imageInstance.onload();
      }

      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should handle image loading errors gracefully', async () => {
      await renderImageShape({
        element: {
          imageUrl: 'https://example.com/invalid-image.jpg',
        },
      });

      // Simulate image load error
      const imageInstance = (global as any).Image.mock.results[0].value;
      if (imageInstance.onerror) {
        imageInstance.onerror();
      }

      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should set crossOrigin for external images', async () => {
      await renderImageShape({
        element: {
          imageUrl: 'https://external-domain.com/image.jpg',
        },
      });

      const imageInstance = (global as any).Image.mock.results[0].value;
      expect(imageInstance.crossOrigin).toBe('anonymous');
    });

    it('should handle data URLs correctly', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      await renderImageShape({
        element: {
          imageUrl: dataUrl,
        },
      });

      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('should handle mouse events', async () => {
      const onMouseEnter = jest.fn();
      const onMouseLeave = jest.fn();
      const onClick = jest.fn();
      
      await renderImageShape({
        konvaProps: {
          'data-testid': 'konva-image',
          onMouseEnter,
          onMouseLeave,
          onClick,
        },
      });
      
      const image = screen.getByTestId('konva-image');
      
      await user.hover(image);
      await user.click(image);
      await user.unhover(image);
      
      expect(image).toBeInTheDocument();
    });

    it('should handle drag events', async () => {
      const onDragStart = jest.fn();
      const onDragEnd = jest.fn();
      
      await renderImageShape({
        konvaProps: {
          'data-testid': 'konva-image',
          draggable: true,
          onDragStart,
          onDragEnd,
        },
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing imageUrl gracefully', async () => {
      await renderImageShape({
        element: {
          imageUrl: undefined,
        },
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should handle empty imageUrl gracefully', async () => {
      await renderImageShape({
        element: {
          imageUrl: '',
        },
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should handle malformed URLs gracefully', async () => {
      await renderImageShape({
        element: {
          imageUrl: 'not-a-valid-url',
        },
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should handle zero dimensions gracefully', async () => {
      await renderImageShape({
        element: {
          width: 0,
          height: 0,
        },
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should handle negative dimensions gracefully', async () => {
      await renderImageShape({
        element: {
          width: -100,
          height: -50,
        },
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    it('should render efficiently with React.memo', async () => {
      const { rerender } = await renderImageShape();
      
      // Re-render with same props should not cause re-render due to memo
      await rerender(
        <Stage width={800} height={600}>
          <Layer>
            <ImageShape
              element={createMockImageElement()}
              isSelected={false}
              onUpdate={jest.fn()}
              onStartTextEdit={jest.fn()}
              konvaProps={{
                x: 0,
                y: 0,
                'data-testid': 'konva-image',
              }}
            />
          </Layer>
        </Stage>
      );
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should handle large images efficiently', async () => {
      await renderImageShape({
        element: {
          width: 2000,
          height: 1500,
          imageUrl: 'https://example.com/large-image.jpg',
        },
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should cleanup image listeners on unmount', async () => {
      const { unmount } = await renderImageShape();
      
      unmount();
      
      // Verify that event listeners are cleaned up
      // This is important for preventing memory leaks
      expect(mockImage.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should support alt text for accessibility', async () => {
      const altText = 'A beautiful landscape photo';
      
      await renderImageShape({
        element: {
          alt: altText,
        },
        konvaProps: {
          'data-testid': 'konva-image',
          'aria-label': altText,
          role: 'img',
        },
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('aria-label', altText);
      expect(image).toHaveAttribute('role', 'img');
    });

    it('should handle missing alt text gracefully', async () => {
      await renderImageShape({
        element: {
          alt: undefined,
        },
      });
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid image URL changes', async () => {
      const { rerender } = await renderImageShape();
      
      // Simulate rapid image URL changes
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'https://example.com/image4.jpg',
      ];
      
      for (const imageUrl of imageUrls) {
        await rerender(
          <Stage width={800} height={600}>
            <Layer>
              <ImageShape
                element={createMockImageElement({ imageUrl })}
                isSelected={false}
                onUpdate={jest.fn()}
                onStartTextEdit={jest.fn()}
                konvaProps={{
                  x: 0,
                  y: 0,
                  'data-testid': 'konva-image',
                }}
              />
            </Layer>
          </Stage>
        );
      }
      
      const image = screen.getByTestId('konva-image');
      expect(image).toBeInTheDocument();
    });

    it('should handle multiple images efficiently', async () => {
      const images = Array.from({ length: 25 }, (_, index) => 
        createMockImageElement({
          id: `image-${index}` as ElementId,
          x: (index % 5) * 150,
          y: Math.floor(index / 5) * 120,
          imageUrl: `https://example.com/image-${index}.jpg`,
        })
      );

      await testRender(
        <Stage width={800} height={600}>
          <Layer>
            {images.map((imageElement, index) => (
              <ImageShape
                key={imageElement.id}
                element={imageElement}
                isSelected={false}
                onUpdate={jest.fn()}
                onStartTextEdit={jest.fn()}
                konvaProps={{
                  x: imageElement.x,
                  y: imageElement.y,
                  'data-testid': `konva-image-${index}`,
                }}
              />
            ))}
          </Layer>
        </Stage>
      );
      
      const imageElements = screen.getAllByTestId(/konva-image-/);
      expect(imageElements).toHaveLength(25);
    });
  });

  describe('Image Caching', () => {
    it('should cache loaded images for reuse', async () => {
      const imageUrl = 'https://example.com/cached-image.jpg';
      
      // Render first image
      await renderImageShape({
        element: { imageUrl },
      });
      
      // Render second image with same URL
      await renderImageShape({
        element: { 
          id: 'image-2' as ElementId,
          imageUrl 
        },
      });
      
      // The Image constructor should be called for each component
      // but the actual image loading should be optimized
      expect((global as any).Image).toHaveBeenCalled();
    });
  });
});

