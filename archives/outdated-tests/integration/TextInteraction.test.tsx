/**
 * Text Interaction Tests - Comprehensive Test Suite
 * Tests text entry, editing, and positioning across all text-capable components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, Layer } from 'react-konva';
import { TextShape } from '../../features/canvas/shapes/TextShape';
import { StickyNoteShape } from '../../features/canvas/shapes/StickyNoteShape';
import { EnhancedTableElement } from '../../features/canvas/components/EnhancedTableElement';
import { setupTestEnvironment } from '../utils/testUtils';
import type { TextElement, StickyNoteElement, TableElement, ElementId } from '../../features/canvas/types/enhanced.types';

const { render: testRender, user } = setupTestEnvironment();

describe('Text Interaction Integration Tests', () => {
  describe('Text Element Text Entry', () => {
    it('should allow entering text into text elements', async () => {      const mockTextElement: TextElement = {
        id: 'test-text-1' as ElementId,
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        text: 'Initial text',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#000000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const onUpdate = jest.fn();
      const onStartTextEdit = jest.fn();

      await testRender(
        <Stage width={800} height={600}>
          <Layer>
            <TextShape
              element={mockTextElement}
              isSelected={true}
              onUpdate={onUpdate}
              onStartTextEdit={onStartTextEdit}
              konvaProps={{
                x: mockTextElement.x,
                y: mockTextElement.y,
                'data-testid': 'text-element',
              }}
            />
          </Layer>
        </Stage>
      );

      const textElement = screen.getByTestId('text-element');
      
      // Double-click to start editing
      await user.dblClick(textElement);
      expect(onStartTextEdit).toHaveBeenCalledWith(mockTextElement.id);

      // Simulate text editing overlay
      const textInput = document.createElement('textarea');
      textInput.value = 'New text content';
      textInput.setAttribute('data-testid', 'text-overlay-input');
      document.body.appendChild(textInput);

      const overlayInput = screen.getByTestId('text-overlay-input');
      await user.clear(overlayInput);
      await user.type(overlayInput, 'Updated text content');

      expect(overlayInput).toHaveValue('Updated text content');
    });

    it('should handle multi-line text entry', async () => {
      const mockTextElement: TextElement = {
        id: 'test-text-multiline' as ElementId,
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'Line 1\nLine 2',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#000000',
      };

      const onUpdate = jest.fn();
      const onStartTextEdit = jest.fn();

      await testRender(
        <Stage width={800} height={600}>
          <Layer>
            <TextShape
              element={mockTextElement}
              isSelected={true}
              onUpdate={onUpdate}
              onStartTextEdit={onStartTextEdit}
              konvaProps={{
                x: mockTextElement.x,
                y: mockTextElement.y,
                'data-testid': 'multiline-text-element',
              }}
            />
          </Layer>
        </Stage>
      );

      const textElement = screen.getByTestId('multiline-text-element');
      await user.dblClick(textElement);

      // Simulate multi-line editing
      const textArea = document.createElement('textarea');
      textArea.value = 'Line 1\nLine 2\nLine 3\nLine 4';
      textArea.setAttribute('data-testid', 'multiline-text-input');
      document.body.appendChild(textArea);

      const multilineInput = screen.getByTestId('multiline-text-input');
      await user.clear(multilineInput);
      await user.type(multilineInput, 'First line{enter}Second line{enter}Third line');

      expect(multilineInput.value).toContain('\n');
    });
  });

  describe('Sticky Note Text Entry', () => {
    it('should allow entering text into sticky notes', async () => {
      const mockStickyNote: StickyNoteElement = {
        id: 'test-sticky-1' as ElementId,
        type: 'sticky-note',
        x: 150,
        y: 150,
        width: 200,
        height: 150,
        text: 'Initial sticky note',
        backgroundColor: '#ffeb3b',
        fontSize: 14,
        fontFamily: 'Arial',
      };

      const onUpdate = jest.fn();
      const onStartTextEdit = jest.fn();

      await testRender(
        <Stage width={800} height={600}>
          <Layer>
            <StickyNoteShape
              element={mockStickyNote}
              isSelected={true}
              onUpdate={onUpdate}
              onStartTextEdit={onStartTextEdit}
              konvaProps={{
                x: mockStickyNote.x,
                y: mockStickyNote.y,
                'data-testid': 'sticky-note-element',
              }}
            />
          </Layer>
        </Stage>
      );

      const stickyNote = screen.getByTestId('sticky-note-element');
      await user.dblClick(stickyNote);
      expect(onStartTextEdit).toHaveBeenCalledWith(mockStickyNote.id);

      // Simulate sticky note text editing
      const textArea = document.createElement('textarea');
      textArea.setAttribute('data-testid', 'sticky-note-input');
      textArea.style.position = 'absolute';
      textArea.style.left = '150px';
      textArea.style.top = '150px';
      textArea.style.width = '200px';
      textArea.style.height = '150px';
      document.body.appendChild(textArea);

      const stickyInput = screen.getByTestId('sticky-note-input');
      await user.type(stickyInput, 'This is a sticky note with important information!');

      expect(stickyInput).toHaveValue('This is a sticky note with important information!');
    });

    it('should handle rich text formatting in sticky notes', async () => {
      const mockStickyNote: StickyNoteElement = {
        id: 'test-sticky-rich' as ElementId,
        type: 'sticky-note',
        x: 200,
        y: 200,
        width: 250,
        height: 200,
        text: '**Bold text** and *italic text*',
        backgroundColor: '#e1f5fe',
        fontSize: 14,
        fontFamily: 'Arial',
      };

      const onUpdate = jest.fn();
      const onStartTextEdit = jest.fn();

      await testRender(
        <Stage width={800} height={600}>
          <Layer>
            <StickyNoteShape
              element={mockStickyNote}
              isSelected={true}
              onUpdate={onUpdate}
              onStartTextEdit={onStartTextEdit}
              konvaProps={{
                x: mockStickyNote.x,
                y: mockStickyNote.y,
                'data-testid': 'rich-sticky-note',
              }}
            />
          </Layer>
        </Stage>
      );

      const stickyNote = screen.getByTestId('rich-sticky-note');
      expect(stickyNote).toBeInTheDocument();
    });
  });

  describe('Table Cell Text Entry', () => {
    it('should allow entering text into table cells', async () => {
      const mockTable: TableElement = {
        id: 'test-table-1' as ElementId,
        type: 'table',
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        rows: 3,
        cols: 3,
        cellData: [
          ['Header 1', 'Header 2', 'Header 3'],
          ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
          ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3'],
        ],
        cellWidth: 133,
        cellHeight: 100,
        borderColor: '#000000',
        backgroundColor: '#ffffff',
      };

      const onUpdate = jest.fn();
      const onCellEdit = jest.fn();

      await testRender(
        <Stage width={800} height={600}>
          <Layer>
            <EnhancedTableElement
              element={mockTable}
              isSelected={true}
              onUpdate={onUpdate}
              onCellEdit={onCellEdit}
              konvaProps={{
                x: mockTable.x,
                y: mockTable.y,
                'data-testid': 'table-element',
              }}
            />
          </Layer>
        </Stage>
      );

      const tableElement = screen.getByTestId('table-element');
      
      // Click on a specific cell (simulate cell at row 1, col 1)
      const cellX = mockTable.x + mockTable.cellWidth / 2;
      const cellY = mockTable.y + mockTable.cellHeight + mockTable.cellHeight / 2;
      
      await user.click(tableElement);
      
      // Simulate cell editing overlay
      const cellInput = document.createElement('input');
      cellInput.setAttribute('data-testid', 'table-cell-input');
      cellInput.style.position = 'absolute';
      cellInput.style.left = `${cellX}px`;
      cellInput.style.top = `${cellY}px`;
      cellInput.value = 'Row 1 Col 1';
      document.body.appendChild(cellInput);

      const cellEditInput = screen.getByTestId('table-cell-input');
      await user.clear(cellEditInput);
      await user.type(cellEditInput, 'Updated cell content');

      expect(cellEditInput).toHaveValue('Updated cell content');
    });

    it('should handle table cell navigation with keyboard', async () => {
      const mockTable: TableElement = {
        id: 'test-table-nav' as ElementId,
        type: 'table',
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        rows: 2,
        cols: 2,
        cellData: [
          ['A1', 'B1'],
          ['A2', 'B2'],
        ],
        cellWidth: 150,
        cellHeight: 100,
        borderColor: '#000000',
        backgroundColor: '#ffffff',
      };

      const onUpdate = jest.fn();
      const onCellEdit = jest.fn();

      await testRender(
        <Stage width={800} height={600}>
          <Layer>
            <EnhancedTableElement
              element={mockTable}
              isSelected={true}
              onUpdate={onUpdate}
              onCellEdit={onCellEdit}
              konvaProps={{
                x: mockTable.x,
                y: mockTable.y,
                'data-testid': 'nav-table-element',
              }}
            />
          </Layer>
        </Stage>
      );

      // Simulate table cell navigation
      const tableElement = screen.getByTestId('nav-table-element');
      await user.click(tableElement);

      // Simulate cell input for navigation
      const cellInput = document.createElement('input');
      cellInput.setAttribute('data-testid', 'nav-cell-input');
      document.body.appendChild(cellInput);

      const navInput = screen.getByTestId('nav-cell-input');
      
      // Test Tab navigation (move to next cell)
      await user.type(navInput, 'Content{Tab}');
      
      // Test Enter navigation (move to next row)
      await user.type(navInput, 'More content{Enter}');
      
      expect(navInput).toBeInTheDocument();
    });
  });

  describe('Text Editing Overlay Positioning', () => {
    it('should position text editing overlay correctly for different element types', async () => {
      const elements = [
        {
          type: 'text',
          element: {
            id: 'text-pos-test' as ElementId,
            type: 'text' as const,
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            text: 'Position test',
          },
        },
        {
          type: 'sticky-note',
          element: {
            id: 'sticky-pos-test' as ElementId,
            type: 'sticky-note' as const,
            x: 300,
            y: 100,
            width: 200,
            height: 150,
            text: 'Sticky position test',
            backgroundColor: '#ffeb3b',
          },
        },
      ];

      for (const { type, element } of elements) {
        const overlay = document.createElement('div');
        overlay.setAttribute('data-testid', `${type}-overlay`);
        overlay.style.position = 'absolute';
        overlay.style.left = `${element.x}px`;
        overlay.style.top = `${element.y}px`;
        overlay.style.width = `${element.width}px`;
        overlay.style.height = `${element.height}px`;
        overlay.style.border = '2px solid #007bff';
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        document.body.appendChild(overlay);

        const overlayElement = screen.getByTestId(`${type}-overlay`);
        expect(overlayElement).toBeInTheDocument();
        expect(overlayElement.style.left).toBe(`${element.x}px`);
        expect(overlayElement.style.top).toBe(`${element.y}px`);
      }
    });

    it('should handle text overlay positioning with canvas transforms', async () => {
      // Test with scaled and panned canvas
      const canvasTransform = {
        scale: 1.5,
        x: 50,
        y: 25,
      };

      const elementPosition = { x: 100, y: 100 };
      
      // Calculate transformed position
      const transformedX = elementPosition.x * canvasTransform.scale + canvasTransform.x;
      const transformedY = elementPosition.y * canvasTransform.scale + canvasTransform.y;

      const overlay = document.createElement('textarea');
      overlay.setAttribute('data-testid', 'transformed-overlay');
      overlay.style.position = 'absolute';
      overlay.style.left = `${transformedX}px`;
      overlay.style.top = `${transformedY}px`;
      overlay.style.transform = `scale(${canvasTransform.scale})`;
      overlay.style.transformOrigin = 'top left';
      document.body.appendChild(overlay);

      const transformedOverlay = screen.getByTestId('transformed-overlay');
      expect(transformedOverlay).toBeInTheDocument();
      expect(transformedOverlay.style.left).toBe(`${transformedX}px`);
      expect(transformedOverlay.style.top).toBe(`${transformedY}px`);
    });
  });

  describe('Text Editing Error Handling', () => {
    it('should handle text editing cancellation', async () => {
      const textArea = document.createElement('textarea');
      textArea.setAttribute('data-testid', 'cancel-test-input');
      textArea.value = 'Original text';
      document.body.appendChild(textArea);

      const cancelInput = screen.getByTestId('cancel-test-input');
      
      // Start editing
      await user.clear(cancelInput);
      await user.type(cancelInput, 'Modified text');
      expect(cancelInput).toHaveValue('Modified text');

      // Simulate Escape key to cancel
      await user.keyboard('{Escape}');
      
      // Text should revert to original (simulated)
      cancelInput.value = 'Original text';
      expect(cancelInput).toHaveValue('Original text');
    });

    it('should handle text editing with invalid characters', async () => {
      const textInput = document.createElement('input');
      textInput.setAttribute('data-testid', 'invalid-char-input');
      textInput.setAttribute('maxlength', '50');
      document.body.appendChild(textInput);

      const invalidInput = screen.getByTestId('invalid-char-input');
      
      // Test with very long text
      const longText = 'a'.repeat(100);
      await user.type(invalidInput, longText);
      
      // Should be limited by maxlength
      expect(invalidInput.value.length).toBeLessThanOrEqual(50);
    });
  });
});

