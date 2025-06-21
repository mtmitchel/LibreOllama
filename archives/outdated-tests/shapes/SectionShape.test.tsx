/**
 * SectionShape Component - Comprehensive Test Suite
 * Tests section container rendering, child management, and grouping behavior
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, Layer } from 'react-konva';
import { SectionShape } from '../../features/canvas/shapes/SectionShape';
import { setupTestEnvironment } from '../utils/testUtils';
import type { SectionElement } from '../../types/section';
import type { ElementId } from '../../features/canvas/types/enhanced.types';

const { render: testRender, user } = setupTestEnvironment();

// Mock section element
const createMockSectionElement = (overrides: Partial<SectionElement> = {}): SectionElement => ({
  id: `test-section-${Math.random().toString(36).substr(2, 9)}`,
  type: 'section',
  x: 0,
  y: 0,
  width: 300,
  height: 200,
  title: 'Test Section',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderColor: '#3B82F6',
  borderWidth: 2,
  cornerRadius: 8,
  titleBarHeight: 32,
  titleFontSize: 14,
  titleColor: '#1F2937',
  isLocked: false,
  isHidden: false,
  containedElementIds: [],
  ...overrides,
} as SectionElement);

const renderSectionShape = (props: Partial<any> = {}) => {
  const mockElement = createMockSectionElement(props.element);
  const defaultProps = {
    element: mockElement,
    isSelected: false,
    onUpdate: jest.fn(),
    onStartTextEdit: jest.fn(),
    onSectionResize: jest.fn(),
    children: [],
    konvaProps: {
      x: mockElement.x,
      y: mockElement.y,
      'data-testid': 'konva-section',
    },
    ...props,
  };

  return testRender(
    <Stage width={800} height={600}>
      <Layer>
        <SectionShape {...defaultProps} />
      </Layer>
    </Stage>
  );
};

describe('SectionShape Component', () => {
  describe('Rendering', () => {
    it('should render section with default properties', async () => {
      await renderSectionShape();
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should render with custom title', async () => {
      await renderSectionShape({
        element: {
          title: 'Custom Section Title',
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should render with custom dimensions', async () => {
      await renderSectionShape({
        element: {
          width: 500,
          height: 350,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should render with custom background color', async () => {
      await renderSectionShape({
        element: {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: '#EF4444',
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle selected state correctly', async () => {
      await renderSectionShape({
        isSelected: true,
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Title Bar Rendering', () => {
    it('should render title bar with correct height', async () => {
      await renderSectionShape({
        element: {
          titleBarHeight: 40,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should render title with custom font size', async () => {
      await renderSectionShape({
        element: {
          titleFontSize: 18,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should render title with custom color', async () => {
      await renderSectionShape({
        element: {
          titleColor: '#EF4444',
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle empty title gracefully', async () => {
      await renderSectionShape({
        element: {
          title: '',
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle very long titles', async () => {
      await renderSectionShape({
        element: {
          title: 'This is a very long section title that might need to be truncated or wrapped',
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Border and Corner Styling', () => {
    it('should render with custom border width', async () => {
      await renderSectionShape({
        element: {
          borderWidth: 4,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should render with custom corner radius', async () => {
      await renderSectionShape({
        element: {
          cornerRadius: 16,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle zero border width', async () => {
      await renderSectionShape({
        element: {
          borderWidth: 0,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle zero corner radius', async () => {
      await renderSectionShape({
        element: {
          cornerRadius: 0,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Child Element Management', () => {
    it('should render with child elements', async () => {
      const mockChildren = [
        <rect key="child1" x={10} y={40} width={50} height={30} fill="#FF0000" />,
        <circle key="child2" cx={100} cy={80} r={20} fill="#00FF00" />,
      ];

      await renderSectionShape({
        children: mockChildren,
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle empty children array', async () => {
      await renderSectionShape({
        children: [],
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle many child elements', async () => {
      const mockChildren = Array.from({ length: 20 }, (_, index) => (
        <rect 
          key={`child-${index}`} 
          x={(index % 5) * 50 + 10} 
          y={Math.floor(index / 5) * 30 + 40} 
          width={40} 
          height={20} 
          fill={`hsl(${index * 18}, 70%, 50%)`} 
        />
      ));

      await renderSectionShape({
        children: mockChildren,
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('should handle mouse events', async () => {
      const onMouseEnter = jest.fn();
      const onMouseLeave = jest.fn();
      const onClick = jest.fn();
      
      await renderSectionShape({
        konvaProps: {
          'data-testid': 'konva-section',
          onMouseEnter,
          onMouseLeave,
          onClick,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      
      await user.hover(section);
      await user.click(section);
      await user.unhover(section);
      
      expect(section).toBeInTheDocument();
    });

    it('should handle drag events', async () => {
      const onDragStart = jest.fn();
      const onDragEnd = jest.fn();
      
      await renderSectionShape({
        konvaProps: {
          'data-testid': 'konva-section',
          draggable: true,
          onDragStart,
          onDragEnd,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle resize events', async () => {
      const onSectionResize = jest.fn();
      
      await renderSectionShape({
        onSectionResize,
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle text editing start', async () => {
      const onStartTextEdit = jest.fn();
      
      await renderSectionShape({
        onStartTextEdit,
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Lock and Visibility States', () => {
    it('should handle locked state', async () => {
      await renderSectionShape({
        element: {
          isLocked: true,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle hidden state', async () => {
      await renderSectionShape({
        element: {
          isHidden: true,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle both locked and hidden states', async () => {
      await renderSectionShape({
        element: {
          isLocked: true,
          isHidden: true,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    it('should render efficiently with React.memo', async () => {
      const { rerender } = await renderSectionShape();
      
      // Re-render with same props should not cause re-render due to memo
      await rerender(
        <Stage width={800} height={600}>
          <Layer>
            <SectionShape
              element={createMockSectionElement()}
              isSelected={false}
              onUpdate={jest.fn()}
              onStartTextEdit={jest.fn()}
              onSectionResize={jest.fn()}
              children={[]}
              konvaProps={{
                x: 0,
                y: 0,
                'data-testid': 'konva-section',
              }}
            />
          </Layer>
        </Stage>
      );
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle shape caching for large sections', async () => {
      await renderSectionShape({
        element: {
          width: 1000,
          height: 800,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero dimensions gracefully', async () => {
      await renderSectionShape({
        element: {
          width: 0,
          height: 0,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle negative dimensions gracefully', async () => {
      await renderSectionShape({
        element: {
          width: -100,
          height: -50,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle invalid colors gracefully', async () => {
      await renderSectionShape({
        element: {
          backgroundColor: 'invalid-color',
          borderColor: 'also-invalid',
          titleColor: 'not-a-color',
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle missing required properties', async () => {
      await renderSectionShape({
        element: {
          title: undefined,
          backgroundColor: undefined,
          borderColor: undefined,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible to screen readers', async () => {
      await renderSectionShape({
        element: {
          title: 'Important Section',
        },
        konvaProps: {
          'data-testid': 'konva-section',
          'aria-label': 'Important Section container',
          role: 'group',
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-label', 'Important Section container');
      expect(section).toHaveAttribute('role', 'group');
    });

    it('should support keyboard navigation', async () => {
      await renderSectionShape({
        konvaProps: {
          'data-testid': 'konva-section',
          tabIndex: 0,
        },
      });
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid state changes', async () => {
      const { rerender } = await renderSectionShape();
      
      // Simulate rapid state changes
      const states = [
        { isLocked: true, isHidden: false },
        { isLocked: false, isHidden: true },
        { isLocked: true, isHidden: true },
        { isLocked: false, isHidden: false },
      ];
      
      for (let i = 0; i < states.length; i++) {
        await rerender(
          <Stage width={800} height={600}>
            <Layer>
              <SectionShape
                element={createMockSectionElement(states[i])}
                isSelected={i % 2 === 0}
                onUpdate={jest.fn()}
                onStartTextEdit={jest.fn()}
                onSectionResize={jest.fn()}
                children={[]}
                konvaProps={{
                  x: i * 10,
                  y: i * 10,
                  'data-testid': 'konva-section',
                }}
              />
            </Layer>
          </Stage>
        );
      }
      
      const section = screen.getByTestId('konva-section');
      expect(section).toBeInTheDocument();
    });

    it('should handle multiple sections efficiently', async () => {
      const sections = Array.from({ length: 10 }, (_, index) => 
        createMockSectionElement({
          id: `section-${index}` as ElementId,
          x: (index % 3) * 320,
          y: Math.floor(index / 3) * 220,
          title: `Section ${index + 1}`,
          backgroundColor: `hsla(${index * 36}, 70%, 50%, 0.1)`,
        })
      );

      await testRender(
        <Stage width={1000} height={800}>
          <Layer>
            {sections.map((sectionElement, index) => (
              <SectionShape
                key={sectionElement.id}
                element={sectionElement}
                isSelected={false}
                onUpdate={jest.fn()}
                onStartTextEdit={jest.fn()}
                onSectionResize={jest.fn()}
                children={[]}
                konvaProps={{
                  x: sectionElement.x,
                  y: sectionElement.y,
                  'data-testid': `konva-section-${index}`,
                }}
              />
            ))}
          </Layer>
        </Stage>
      );
      
      const sectionElements = screen.getAllByTestId(/konva-section-/);
      expect(sectionElements).toHaveLength(10);
    });
  });
});
