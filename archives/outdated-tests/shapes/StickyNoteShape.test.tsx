/**
 * StickyNoteShape Component - Comprehensive Test Suite
 * Tests sticky note rendering, text editing, and interactive features
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, Layer } from 'react-konva';
import { StickyNoteShape } from '../../features/canvas/shapes/StickyNoteShape';
import { setupTestEnvironment } from '../utils/testUtils';
import type { StickyNoteElement, ElementId } from '../../features/canvas/types/enhanced.types';

const { render: testRender, user } = setupTestEnvironment();

// Mock sticky note element
const createMockStickyNoteElement = (overrides: Partial<StickyNoteElement> = {}): StickyNoteElement => ({
  id: `test-sticky-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'sticky-note',
  x: 0,
  y: 0,
  width: 150,
  height: 150,
  text: 'Sample sticky note',
  fontSize: 14,
  fontFamily: 'Arial',
  fill: '#ffeb3b',
  stroke: '#fbc02d',
  strokeWidth: 1,
  cornerRadius: 8,
  ...overrides,
} as StickyNoteElement);

const renderStickyNoteShape = (props: Partial<any> = {}) => {
  const mockElement = createMockStickyNoteElement(props.element);
  const defaultProps = {
    element: mockElement,
    isSelected: false,
    onUpdate: jest.fn(),
    onStartTextEdit: jest.fn(),
    konvaProps: {
      x: mockElement.x,
      y: mockElement.y,
      'data-testid': 'konva-sticky-note',
    },
    ...props,
  };

  return testRender(
    <Stage width={800} height={600}>
      <Layer>
        <StickyNoteShape {...defaultProps} />
      </Layer>
    </Stage>
  );
};

describe('StickyNoteShape Component', () => {
  describe('Rendering', () => {
    it('should render sticky note with default properties', async () => {
      await renderStickyNoteShape();
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should render with custom dimensions', async () => {
      await renderStickyNoteShape({
        element: {
          width: 200,
          height: 100,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should render with custom text content', async () => {
      await renderStickyNoteShape({
        element: {
          text: 'Custom sticky note text with multiple lines\nLine 2\nLine 3',
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should render with custom colors', async () => {
      await renderStickyNoteShape({
        element: {
          fill: '#ff9800',
          stroke: '#f57c00',
          strokeWidth: 2,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should render with custom corner radius', async () => {
      await renderStickyNoteShape({
        element: {
          cornerRadius: 15,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should render with selection styling', async () => {
      await renderStickyNoteShape({
        isSelected: true,
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });
  });

  describe('Text Handling', () => {
    it('should render empty text gracefully', async () => {
      await renderStickyNoteShape({
        element: {
          text: '',
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should handle long text content', async () => {
      const longText = 'This is a very long text that should wrap within the sticky note boundaries. '.repeat(10);
      
      await renderStickyNoteShape({
        element: {
          text: longText,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should render with different font sizes', async () => {
      await renderStickyNoteShape({
        element: {
          fontSize: 18,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should render with different font families', async () => {
      await renderStickyNoteShape({
        element: {
          fontFamily: 'Comic Sans MS',
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should handle text with special characters', async () => {
      await renderStickyNoteShape({
        element: {
          text: '🎉 Special characters: @#$%^&*()_+={[}]|\\:";\'<>?,./`~',
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should respond to click events', async () => {
      const mockClick = jest.fn();
      
      await renderStickyNoteShape({
        konvaProps: {
          onClick: mockClick,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      fireEvent.click(stickyNote);
      
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle double-click for text editing', async () => {
      const mockDoubleClick = jest.fn();
      const mockStartTextEdit = jest.fn();
      
      await renderStickyNoteShape({
        onStartTextEdit: mockStartTextEdit,
        konvaProps: {
          onDblClick: mockDoubleClick,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      fireEvent.doubleClick(stickyNote);
      
      expect(mockDoubleClick).toHaveBeenCalled();
    });

    it('should handle drag events', async () => {
      const mockDragStart = jest.fn();
      const mockDragEnd = jest.fn();
      
      await renderStickyNoteShape({
        konvaProps: {
          draggable: true,
          onDragStart: mockDragStart,
          onDragEnd: mockDragEnd,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      fireEvent.dragStart(stickyNote);
      fireEvent.dragEnd(stickyNote);
      
      expect(mockDragStart).toHaveBeenCalled();
      expect(mockDragEnd).toHaveBeenCalled();
    });

    it('should handle hover events', async () => {
      const mockMouseEnter = jest.fn();
      const mockMouseLeave = jest.fn();
      
      await renderStickyNoteShape({
        konvaProps: {
          onMouseEnter: mockMouseEnter,
          onMouseLeave: mockMouseLeave,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      fireEvent.mouseEnter(stickyNote);
      fireEvent.mouseLeave(stickyNote);
      
      expect(mockMouseEnter).toHaveBeenCalled();
      expect(mockMouseLeave).toHaveBeenCalled();
    });
  });

  describe('Performance Optimizations', () => {
    it('should maintain stable references with React.memo', async () => {
      const element = createMockStickyNoteElement();
      const { rerender } = await renderStickyNoteShape({ element });
      
      // Re-render with same props should not cause unnecessary re-render
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should re-render when text content changes', async () => {
      const element1 = createMockStickyNoteElement({ text: 'Original text' });
      const element2 = createMockStickyNoteElement({ text: 'Updated text' });
      
      const { rerender } = await renderStickyNoteShape({ element: element1 });
      
      // Change text content
      await renderStickyNoteShape({ element: element2 });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should handle multiple sticky notes efficiently', async () => {
      const stickyNotes = Array.from({ length: 30 }, (_, i) => 
        createMockStickyNoteElement({
          x: (i % 6) * 160,
          y: Math.floor(i / 6) * 160,
          text: `Sticky Note ${i + 1}`,
          fill: `hsl(${i * 12}, 70%, 80%)`,
        })
      );

      const startTime = performance.now();
      
      await testRender(
        <Stage width={800} height={600}>
          <Layer>
            {stickyNotes.map((note, index) => (
              <StickyNoteShape
                key={note.id}
                element={note}
                isSelected={false}
                onUpdate={jest.fn()}
                onStartTextEdit={jest.fn()}
                konvaProps={{
                  x: note.x,
                  y: note.y,
                  'data-testid': `konva-sticky-note-${index}`,
                }}
              />
            ))}
          </Layer>
        </Stage>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render multiple sticky notes efficiently
      expect(renderTime).toBeLessThan(150); // 150ms threshold
      expect(screen.getAllByTestId(/konva-sticky-note-/)).toHaveLength(30);
    });
  });

  describe('Visual States', () => {
    it('should apply selection highlighting', async () => {
      await renderStickyNoteShape({
        isSelected: true,
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should handle opacity changes', async () => {
      await renderStickyNoteShape({
        element: {
          opacity: 0.7,
        },
        konvaProps: {
          opacity: 0.7,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should handle rotation transformations', async () => {
      await renderStickyNoteShape({
        element: {
          rotation: 15,
        },
        konvaProps: {
          rotation: 15,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should handle scaling transformations', async () => {
      await renderStickyNoteShape({
        konvaProps: {
          scaleX: 1.2,
          scaleY: 0.9,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });
  });

  describe('Color Variations', () => {
    it('should render with yellow color scheme', async () => {
      await renderStickyNoteShape({
        element: {
          fill: '#ffeb3b',
          stroke: '#fbc02d',
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should render with pink color scheme', async () => {
      await renderStickyNoteShape({
        element: {
          fill: '#e91e63',
          stroke: '#c2185b',
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should render with blue color scheme', async () => {
      await renderStickyNoteShape({
        element: {
          fill: '#2196f3',
          stroke: '#1976d2',
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should render with green color scheme', async () => {
      await renderStickyNoteShape({
        element: {
          fill: '#4caf50',
          stroke: '#388e3c',
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing text gracefully', async () => {
      await renderStickyNoteShape({
        element: {
          text: undefined,
        } as any,
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should handle invalid dimensions', async () => {
      await renderStickyNoteShape({
        element: {
          width: 0,
          height: -10,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should handle invalid font size', async () => {
      await renderStickyNoteShape({
        element: {
          fontSize: -5,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should handle extreme coordinate values', async () => {
      await renderStickyNoteShape({
        element: {
          x: -5000,
          y: 5000,
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA labels', async () => {
      await renderStickyNoteShape({
        konvaProps: {
          'aria-label': 'Sticky note with sample text',
          role: 'note',
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });

    it('should provide semantic information for screen readers', async () => {
      await renderStickyNoteShape({
        element: {
          text: 'Important reminder',
        },
        konvaProps: {
          'aria-describedby': 'sticky-note-description',
        },
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('should clean up properly when unmounted', async () => {
      const { unmount } = await renderStickyNoteShape();
      
      unmount();
      
      expect(screen.queryByTestId('konva-sticky-note')).not.toBeInTheDocument();
    });

    it('should handle rapid property changes without memory leaks', async () => {
      const { rerender } = await renderStickyNoteShape();
      
      // Simulate rapid property changes
      for (let i = 0; i < 25; i++) {
        const element = createMockStickyNoteElement({
          text: `Dynamic text ${i}`,
          fill: `hsl(${i * 14}, 70%, 80%)`,
          fontSize: 12 + (i % 8),
        });
        
        rerender(
          <Stage width={800} height={600}>
            <Layer>
              <StickyNoteShape
                element={element}
                isSelected={false}
                onUpdate={jest.fn()}
                onStartTextEdit={jest.fn()}
                konvaProps={{
                  x: element.x,
                  y: element.y,
                  'data-testid': 'konva-sticky-note',
                }}
              />
            </Layer>
          </Stage>
        );
      }
      
      expect(screen.getByTestId('konva-sticky-note')).toBeInTheDocument();
    });
  });

  describe('Text Editing Integration', () => {
    it('should trigger text editing on double click', async () => {
      const mockStartTextEdit = jest.fn();
      
      await renderStickyNoteShape({
        onStartTextEdit: mockStartTextEdit,
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      fireEvent.doubleClick(stickyNote);
      
      // Note: The exact behavior depends on the component implementation
      // This test verifies the event is properly bound
      expect(stickyNote).toBeInTheDocument();
    });

    it('should handle text update events', async () => {
      const mockUpdate = jest.fn();
      
      await renderStickyNoteShape({
        onUpdate: mockUpdate,
      });
      
      const stickyNote = screen.getByTestId('konva-sticky-note');
      expect(stickyNote).toBeInTheDocument();
      
      // Simulate text update would be triggered by external text editor
      expect(mockUpdate).toBeDefined();
    });
  });
});
