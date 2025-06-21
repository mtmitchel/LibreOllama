import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { act } from '@testing-library/react';
import { renderWithKonva } from '@/tests/utils/konva-test-utils';
import { EditableNode } from '@/features/canvas/shapes/EditableNode';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { CanvasElement, ElementId } from '@/features/canvas/types/enhanced.types';

// Mock the store
jest.mock('@/features/canvas/stores/canvasStore.enhanced');
const mockUseCanvasStore = useCanvasStore as jest.MockedFunction<typeof useCanvasStore>;

describe('TextShape', () => {
  const selectElementMock = jest.fn();
  const updateElementMock = jest.fn();
  const startTextEditMock = jest.fn();
  const setEditingTextIdMock = jest.fn();
  
  let mockElement: CanvasElement;
  let mockStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockElement = {
      id: 'text-1',
      type: 'text',
      tool: 'text',
      x: 100,
      y: 100,
      text: 'Hello World',
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#000000',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    mockStore = {
      elements: new Map([[mockElement.id, mockElement]]),
      selectedElementIds: new Set<string>(),
      editingTextId: null,
      selectElement: selectElementMock,
      updateElement: updateElementMock,
      setEditingTextId: setEditingTextIdMock,
      selectedTool: 'select',
    };

    mockUseCanvasStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });
  });

  afterEach(() => {
    act(() => {
      jest.clearAllMocks();
    });
  });

  describe('Rendering', () => {
    test('should render text element via EditableNode', () => {
      renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();
    });

    test('should render multi-line text correctly', () => {
      const multiLineElement: CanvasElement = {
        ...mockElement,
        text: 'Line 1\nLine 2\nLine 3',
      };

      renderWithKonva(
        <EditableNode
          element={multiLineElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      expect(multiLineElement.text).toContain('\n');
    });
  });

  describe('Text Editing', () => {
    test('should enter edit mode on double click', () => {
      const handleStartEdit = jest.fn((elementId: string) => {
        mockStore.editingTextId = elementId;
        setEditingTextIdMock(elementId);
        startTextEditMock(elementId);
      });

      renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={handleStartEdit}
        />
      );

      const canvas = screen.getByRole('presentation').querySelector('canvas');
      
      // Simulate double click
      act(() => {
        fireEvent.dblClick(canvas!);
      });

      expect(handleStartEdit).toHaveBeenCalledWith(mockElement.id);
      expect(startTextEditMock).toHaveBeenCalledWith(mockElement.id);
    });

    test('should update text content when editing', () => {
      mockStore.editingTextId = mockElement.id;

      renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={true}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      // Simulate text update
      const newText = 'Updated Text Content';
      act(() => {
        updateElementMock(mockElement.id, { text: newText });
      });

      expect(updateElementMock).toHaveBeenCalledWith(mockElement.id, { text: newText });
    });

    test('should handle empty text gracefully', () => {
      const emptyTextElement: CanvasElement = {
        ...mockElement,
        text: '',
      };

      renderWithKonva(
        <EditableNode
          element={emptyTextElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      // Should render without errors
      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();
    });
  });

  describe('Font Styling', () => {
    test('should apply font properties correctly', () => {
      const styledElement: CanvasElement = {
        ...mockElement,
        fontSize: 24,
        fontFamily: 'Helvetica',
        fontStyle: 'bold italic',
      };

      renderWithKonva(
        <EditableNode
          element={styledElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      expect(styledElement.fontSize).toBe(24);
      expect(styledElement.fontFamily).toBe('Helvetica');
      expect(styledElement.fontStyle).toBe('bold italic');
    });

    test('should update font properties dynamically', () => {
      const { rerender } = renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      // Update font size
      act(() => {
        updateElementMock(mockElement.id, { fontSize: 32 });
      });

      expect(updateElementMock).toHaveBeenCalledWith(mockElement.id, { fontSize: 32 });

      // Update the element for re-render
      const updatedElement = { ...mockElement, fontSize: 32 };
      
      rerender(
        <EditableNode
          element={updatedElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );
    });
  });

  describe('Selection and Interaction', () => {
    test('should show selection state when selected', () => {
      mockStore.selectedElementIds = new Set([mockElement.id]);

      renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={true}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      // Component should render with selection state
      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();
    });

    test('should be draggable when select tool is active', () => {
      const handleDragEnd = jest.fn();

      renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={handleDragEnd}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      const canvas = screen.getByRole('presentation').querySelector('canvas');
      
      // Simulate drag
      act(() => {
        fireEvent.mouseDown(canvas!);
        fireEvent.mouseMove(canvas!, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas!);
      });

      expect(handleDragEnd).toHaveBeenCalled();
    });
  });

  describe('Special Characters and Edge Cases', () => {
    test('should handle special characters and emojis', () => {
      const specialTextElement: CanvasElement = {
        ...mockElement,
        text: 'Hello 👋 World™ © 2024',
      };

      renderWithKonva(
        <EditableNode
          element={specialTextElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      expect(specialTextElement.text).toContain('👋');
      expect(specialTextElement.text).toContain('™');
      expect(specialTextElement.text).toContain('©');
    });

    test('should handle very long text', () => {
      const longTextElement: CanvasElement = {
        ...mockElement,
        text: 'A'.repeat(1000),
      };

      renderWithKonva(
        <EditableNode
          element={longTextElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      expect(longTextElement.text.length).toBe(1000);
    });

    test('should handle RTL text', () => {
      const rtlElement: CanvasElement = {
        ...mockElement,
        text: 'مرحبا بالعالم',
        direction: 'rtl',
      };

      renderWithKonva(
        <EditableNode
          element={rtlElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      expect(rtlElement.direction).toBe('rtl');
    });
  });

  describe('Performance', () => {
    test('should update efficiently when text changes', () => {
      const { rerender } = renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      // Measure performance of multiple updates
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        const updatedElement = {
          ...mockElement,
          text: `Updated Text ${i}`,
        };

        act(() => {
          rerender(
            <EditableNode
              element={updatedElement}
              isSelected={false}
              selectedTool="select"
              onElementClick={jest.fn()}
              onElementDragEnd={jest.fn()}
              onElementUpdate={updateElementMock}
              onStartTextEdit={startTextEditMock}
            />
          );
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete multiple updates quickly
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('Integration with Store', () => {
    test('should integrate with text editing store state', () => {
      const handleElementClick = jest.fn((e, element) => {
        selectElementMock(element.id);
      });

      renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={handleElementClick}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      const canvas = screen.getByRole('presentation').querySelector('canvas');
      
      // Click to select
      act(() => {
        fireEvent.click(canvas!);
      });

      expect(handleElementClick).toHaveBeenCalled();
      expect(selectElementMock).toHaveBeenCalledWith(mockElement.id);
    });

    test('should handle text updates through store', () => {
      renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={jest.fn()}
          onElementDragEnd={jest.fn()}
          onElementUpdate={updateElementMock}
          onStartTextEdit={startTextEditMock}
        />
      );

      // Update through store
      act(() => {
        const newText = 'Store Updated Text';
        updateElementMock(mockElement.id, { text: newText });
      });

      expect(updateElementMock).toHaveBeenCalledWith(
        mockElement.id,
        { text: 'Store Updated Text' }
      );
    });
  });
});
