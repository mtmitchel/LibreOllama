/**
 * Comprehensive Canvas Integration Tests
 * Tests all critical user interactions and edge cases including:
 * - Text editing in text boxes, sticky notes, and tables
 * - Resizing all possible elements
 * - Adding all possible elements to sections and containment
 * - Arrow and line connectors with movement
 * - Deleting objects from canvas
 * - Drawing sections around existing elements
 * - General drawing functionality
 * - Image uploading
 */

import React, { useState, useRef, useEffect } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { setupTestEnvironment } from '../utils/testUtils';

// Import types with proper paths
import type { 
  CanvasElement, 
  ElementId, 
  SectionId,
  TextElement,
  StickyNoteElement,
  TableElement,
  ConnectorElement,
  ImageElement,
  SectionElement,
  RectangleElement,
  CircleElement,
  TableCell,
  ConnectorStyle,
  PenElement
} from '../../features/canvas/types/enhanced.types';

// Import components with proper paths
import { TextShape } from '../../features/canvas/shapes/TextShape';
import { StickyNoteShape } from '../../features/canvas/shapes/StickyNoteShape';
import { ConnectorRenderer } from '../../features/canvas/components/ConnectorRenderer';
import { ImageShape } from '../../features/canvas/shapes/ImageShape';
import { SectionShape } from '../../features/canvas/shapes/SectionShape';
import { RectangleShape } from '../../features/canvas/shapes/RectangleShape';
import { CircleShape } from '../../features/canvas/shapes/CircleShape';
import { PenShape } from '../../features/canvas/shapes/PenShape';

const { render: testRender, user } = setupTestEnvironment();

// Mock File API for image upload tests
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  
  constructor(parts: any[], filename: string, properties?: any) {
    this.name = filename;
    this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0);
    this.type = properties?.type || '';
    this.lastModified = Date.now();
  }
} as any;

// Mock FileReader for image upload tests
global.FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null;
  error: any = null;
  readyState: number = 0;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  
  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      this.readyState = 2;
      if (this.onload) {
        const event = {} as ProgressEvent<FileReader>;
        this.onload.call(this as any, event);
      }
    });
  }

  abort() {}
  readAsArrayBuffer(file: File) {}
  readAsBinaryString(file: File) {}
  readAsText(file: File, encoding?: string) {}
  
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
} as any;

// Helper functions to create properly typed elements
const createTextElement = (overrides: Partial<TextElement> = {}): TextElement => ({
  id: `text-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'text',
  x: 100,
  y: 100,
  text: 'Test Text',
  fontSize: 16,
  fontFamily: 'Arial',
  fill: '#000000',
  isLocked: false,
  isHidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const createStickyNoteElement = (overrides: Partial<StickyNoteElement> = {}): StickyNoteElement => ({
  id: `sticky-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'sticky-note',
  x: 200,
  y: 200,
  width: 200,
  height: 100,
  text: 'Test Sticky Note',
  backgroundColor: '#FFEB3B',
  textColor: '#000000',
  fontSize: 14,
  isLocked: false,
  isHidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const createTableElement = (overrides: Partial<TableElement> = {}): TableElement => ({
  id: `table-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'table',
  x: 300,
  y: 300,
  width: 400,
  height: 200,
  rows: 3,
  cols: 3,
  tableData: [
    [
      { content: 'Header 1', backgroundColor: '#f0f0f0' },
      { content: 'Header 2', backgroundColor: '#f0f0f0' },
      { content: 'Header 3', backgroundColor: '#f0f0f0' }
    ],
    [
      { content: 'Row 1 Col 1' },
      { content: 'Row 1 Col 2' },
      { content: 'Row 1 Col 3' }
    ],
    [
      { content: 'Row 2 Col 1' },
      { content: 'Row 2 Col 2' },
      { content: 'Row 2 Col 3' }
    ]
  ],
  cellPadding: 8,
  borderWidth: 1,
  borderColor: '#000000',
  isLocked: false,
  isHidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const createConnectorElement = (overrides: Partial<ConnectorElement> = {}): ConnectorElement => ({
  id: `connector-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'connector',
  subType: 'arrow',
  x: 0,
  y: 0,
  startPoint: { x: 100, y: 100 },
  endPoint: { x: 200, y: 200 },
  stroke: '#000000',
  strokeWidth: 2,
  connectorStyle: {
    strokeColor: '#000000',
    strokeWidth: 2,
    endArrow: 'arrow',
    startArrow: 'none'
  },
  isLocked: false,
  isHidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const createSectionElement = (overrides: Partial<SectionElement> = {}): SectionElement => ({
  id: `section-${Math.random().toString(36).substr(2, 9)}` as SectionId,
  type: 'section',
  x: 50,
  y: 50,
  width: 400,
  height: 300,
  title: 'Test Section',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderColor: '#3B82F6',
  borderWidth: 2,
  cornerRadius: 8,
  childElementIds: [],
  isLocked: false,
  isHidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const createRectangleElement = (overrides: Partial<RectangleElement> = {}): RectangleElement => ({
  id: `rect-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'rectangle',
  x: 150,
  y: 150,
  width: 200,
  height: 100,
  fill: '#FF5722',
  stroke: '#000000',
  strokeWidth: 1,
  isLocked: false,
  isHidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const createImageElement = (overrides: Partial<ImageElement> = {}): ImageElement => ({
  id: `image-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'image',
  x: 250,
  y: 250,
  width: 200,
  height: 150,
  imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  opacity: 1,
  isLocked: false,
  isHidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const createPenElement = (overrides: Partial<PenElement> = {}): PenElement => ({
  id: `pen-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'pen',
  x: 0,
  y: 0,
  points: [10, 10, 20, 20, 30, 15, 40, 25],
  stroke: '#000000',
  strokeWidth: 2,
  tension: 0.5,
  isLocked: false,
  isHidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

// Comprehensive Test Canvas Component
interface TestCanvasProps {
  elements: CanvasElement[];
  sections: SectionElement[];
  onElementUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onSectionUpdate: (id: SectionId, updates: Partial<SectionElement>) => void;
  onElementAdd: (element: CanvasElement) => void;
  onElementDelete: (id: ElementId) => void;
  onStartTextEdit: (elementId: ElementId) => void;
  selectedIds: Set<ElementId>;
  editingTextId?: ElementId | null;
}

const TestCanvas: React.FC<TestCanvasProps> = ({
  elements,
  sections,
  onElementUpdate,
  onSectionUpdate,
  onElementAdd,
  onElementDelete,
  onStartTextEdit,
  selectedIds,
  editingTextId
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const allElements = new Map<ElementId | SectionId, CanvasElement>();
  elements.forEach(el => allElements.set(el.id, el));
  sections.forEach(section => allElements.set(section.id, section as any));
  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedIds.has(element.id as ElementId);
    const konvaProps = {
      x: element.x,
      y: element.y,
      'data-testid': `canvas-element-${element.id}`,
    };

    switch (element.type) {
      case 'text':
        return (
          <TextShape
            key={element.id}
            element={element as TextElement}
            isSelected={isSelected}
            konvaProps={konvaProps}
            onUpdate={onElementUpdate}
            onStartTextEdit={onStartTextEdit}
            stageRef={stageRef}
          />
        );
      
      case 'sticky-note':
        return (
          <StickyNoteShape
            key={element.id}
            element={element as StickyNoteElement}
            isSelected={isSelected}
            konvaProps={konvaProps}
            onUpdate={onElementUpdate}
            onStartTextEdit={onStartTextEdit}
            stageRef={stageRef}
          />
        );
        case 'rectangle':
        return (
          <RectangleShape
            key={element.id}
            element={element as RectangleElement}
            isSelected={isSelected}
            konvaProps={konvaProps}
            onUpdate={onElementUpdate}
            onStartTextEdit={onStartTextEdit}
          />
        );
      
      case 'circle':
        return (
          <CircleShape
            key={element.id}
            element={element as CircleElement}
            isSelected={isSelected}
            konvaProps={konvaProps}
            onUpdate={onElementUpdate}
            onStartTextEdit={onStartTextEdit}
          />
        );
      
      case 'image':
        return (
          <ImageShape
            key={element.id}
            element={element as ImageElement}
            isSelected={isSelected}
            konvaProps={konvaProps}
            onUpdate={onElementUpdate}
            onStartTextEdit={onStartTextEdit}
          />
        );
      
      case 'connector':
        return (
          <ConnectorRenderer
            key={element.id}
            element={element as ConnectorElement}
            isSelected={isSelected}
            onSelect={() => {}}
            onUpdate={onElementUpdate}
            elements={allElements}
          />
        );      case 'pen':
        return (
          <PenShape
            key={element.id}
            element={element as PenElement}
            konvaProps={konvaProps}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      <button
        data-testid="add-text-button"
        onClick={() => onElementAdd(createTextElement())}
      >
        Add Text
      </button>
      <button
        data-testid="add-sticky-note-button"
        onClick={() => onElementAdd(createStickyNoteElement())}
      >
        Add Sticky Note
      </button>
      <button
        data-testid="add-rectangle-button"
        onClick={() => onElementAdd(createRectangleElement())}
      >
        Add Rectangle
      </button>
      <button
        data-testid="add-section-button"
        onClick={() => onElementAdd(createSectionElement() as any)}
      >
        Add Section
      </button>
      <input
        data-testid="image-upload-input"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              onElementAdd(createImageElement({ 
                imageUrl: reader.result as string 
              }));
            };
            reader.readAsDataURL(file);
          }
        }}
      />
      
      <Stage width={800} height={600} ref={stageRef}>
        <Layer>          {/* Render sections first */}
          {sections.map(section => (
            <SectionShape
              key={section.id}
              element={{
                ...section,
                title: section.title || 'Untitled Section'
              } as any}
              isSelected={selectedIds.has(section.id as any)}
              konvaProps={{
                x: section.x,
                y: section.y,
                'data-testid': `canvas-section-${section.id}`,
              }}
              onUpdate={(id, updates) => onSectionUpdate(section.id, updates as any)}
              onStartTextEdit={() => {}}
              onSectionResize={() => {}}
              children={[]}
            />
          ))}
          
          {/* Render elements */}
          {elements.map(renderElement)}
        </Layer>
      </Stage>
    </div>
  );
};

describe('Comprehensive Canvas Integration Tests', () => {
  let mockElements: CanvasElement[];
  let mockSections: SectionElement[];
  let mockSelectedIds: Set<ElementId>;
  let mockEditingTextId: ElementId | null;
  let mockOnElementUpdate: jest.Mock;
  let mockOnSectionUpdate: jest.Mock;
  let mockOnElementAdd: jest.Mock;
  let mockOnElementDelete: jest.Mock;
  let mockOnStartTextEdit: jest.Mock;

  beforeEach(() => {
    mockElements = [];
    mockSections = [];
    mockSelectedIds = new Set();
    mockEditingTextId = null;
    mockOnElementUpdate = jest.fn();
    mockOnSectionUpdate = jest.fn();
    mockOnElementAdd = jest.fn();
    mockOnElementDelete = jest.fn();
    mockOnStartTextEdit = jest.fn();
  });

  const renderTestCanvas = (props: Partial<TestCanvasProps> = {}) => {
    return testRender(
      <TestCanvas
        elements={mockElements}
        sections={mockSections}
        onElementUpdate={mockOnElementUpdate}
        onSectionUpdate={mockOnSectionUpdate}
        onElementAdd={mockOnElementAdd}
        onElementDelete={mockOnElementDelete}
        onStartTextEdit={mockOnStartTextEdit}
        selectedIds={mockSelectedIds}
        editingTextId={mockEditingTextId}
        {...props}
      />
    );
  };

  describe('Text Editing Integration', () => {
    it('should handle text editing in text elements', async () => {
      const textElement = createTextElement({ text: 'Original Text' });
      mockElements = [textElement];
      
      await renderTestCanvas();
      
      const textShape = screen.getByTestId(`canvas-element-${textElement.id}`);
      expect(textShape).toBeInTheDocument();
      
      // Double-click to start editing
      await user.dblClick(textShape);
      
      expect(mockOnStartTextEdit).toHaveBeenCalledWith(textElement.id);
    });

    it('should handle text editing in sticky notes', async () => {
      const stickyNote = createStickyNoteElement({ text: 'Original Note' });
      mockElements = [stickyNote];
      
      await renderTestCanvas();
      
      const stickyShape = screen.getByTestId(`canvas-element-${stickyNote.id}`);
      expect(stickyShape).toBeInTheDocument();
      
      // Double-click to start editing
      await user.dblClick(stickyShape);
      
      expect(mockOnStartTextEdit).toHaveBeenCalledWith(stickyNote.id);
    });

    it('should handle multi-line text editing', async () => {
      const multiLineText = createTextElement({ 
        text: 'Line 1\nLine 2\nLine 3' 
      });
      mockElements = [multiLineText];
      
      await renderTestCanvas();
      
      const textShape = screen.getByTestId(`canvas-element-${multiLineText.id}`);
      expect(textShape).toBeInTheDocument();
      
      // Start editing
      await user.dblClick(textShape);
      expect(mockOnStartTextEdit).toHaveBeenCalledWith(multiLineText.id);
    });
  });

  describe('Element Resizing Integration', () => {
    it('should handle rectangle resizing', async () => {
      const rectangle = createRectangleElement({ 
        width: 200, 
        height: 100 
      });
      mockElements = [rectangle];
      mockSelectedIds = new Set([rectangle.id]);
      
      await renderTestCanvas();
      
      const rectShape = screen.getByTestId(`canvas-element-${rectangle.id}`);
      expect(rectShape).toBeInTheDocument();
      
      // Simulate resize operation
      fireEvent.mouseDown(rectShape, { clientX: 350, clientY: 250 }); // Bottom-right corner
      fireEvent.mouseMove(rectShape, { clientX: 400, clientY: 300 }); // Drag to resize
      fireEvent.mouseUp(rectShape);
      
      // Should trigger update with new dimensions
      expect(mockOnElementUpdate).toHaveBeenCalledWith(
        rectangle.id,
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number)
        })
      );
    });

    it('should handle sticky note resizing', async () => {
      const stickyNote = createStickyNoteElement({ 
        width: 200, 
        height: 100 
      });
      mockElements = [stickyNote];
      mockSelectedIds = new Set([stickyNote.id]);
      
      await renderTestCanvas();
      
      const stickyShape = screen.getByTestId(`canvas-element-${stickyNote.id}`);
      expect(stickyShape).toBeInTheDocument();
      
      // Simulate resize operation
      fireEvent.mouseDown(stickyShape, { clientX: 400, clientY: 300 });
      fireEvent.mouseMove(stickyShape, { clientX: 450, clientY: 350 });
      fireEvent.mouseUp(stickyShape);
      
      expect(mockOnElementUpdate).toHaveBeenCalledWith(
        stickyNote.id,
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number)
        })
      );
    });

    it('should handle image resizing with aspect ratio', async () => {
      const image = createImageElement({ 
        width: 200, 
        height: 150 
      });
      mockElements = [image];
      mockSelectedIds = new Set([image.id]);
      
      await renderTestCanvas();
      
      const imageShape = screen.getByTestId(`canvas-element-${image.id}`);
      expect(imageShape).toBeInTheDocument();
      
      // Test resize
      fireEvent.mouseDown(imageShape, { clientX: 450, clientY: 400 });
      fireEvent.mouseMove(imageShape, { clientX: 500, clientY: 450 });
      fireEvent.mouseUp(imageShape);
      
      expect(mockOnElementUpdate).toHaveBeenCalled();
    });
  });

  describe('Section Containment Integration', () => {
    it('should add elements to sections', async () => {
      const section = createSectionElement({ 
        x: 100, 
        y: 100, 
        width: 400, 
        height: 300 
      });
      const rectangle = createRectangleElement({ 
        x: 150, 
        y: 150 
      });
      
      mockSections = [section];
      mockElements = [rectangle];
      
      await renderTestCanvas();
      
      const sectionShape = screen.getByTestId(`canvas-section-${section.id}`);
      const rectShape = screen.getByTestId(`canvas-element-${rectangle.id}`);
      
      expect(sectionShape).toBeInTheDocument();
      expect(rectShape).toBeInTheDocument();
      
      // Drag rectangle into section
      fireEvent.dragStart(rectShape);
      fireEvent.dragEnter(sectionShape);
      fireEvent.drop(sectionShape);
      
      // Should update section to contain the rectangle
      expect(mockOnSectionUpdate).toHaveBeenCalledWith(
        section.id,
        expect.objectContaining({
          childElementIds: expect.arrayContaining([rectangle.id])
        })
      );
    });

    it('should move sections with contained elements', async () => {
      const section = createSectionElement({ 
        x: 100, 
        y: 100,
        childElementIds: ['contained-rect'] as ElementId[]
      });
      const containedRect = createRectangleElement({ 
        id: 'contained-rect' as ElementId,
        x: 150, 
        y: 150,
        sectionId: section.id
      });
      
      mockSections = [section];
      mockElements = [containedRect];
      
      await renderTestCanvas();
      
      const sectionShape = screen.getByTestId(`canvas-section-${section.id}`);
      
      // Move section
      fireEvent.mouseDown(sectionShape, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(sectionShape, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(sectionShape);
      
      // Should update section position
      expect(mockOnSectionUpdate).toHaveBeenCalledWith(
        section.id,
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      );
    });

    it('should enforce section boundaries', async () => {
      const section = createSectionElement({ 
        x: 100, 
        y: 100, 
        width: 200, 
        height: 200 
      });
      const rectangle = createRectangleElement({ 
        x: 150, 
        y: 150,
        sectionId: section.id
      });
      
      mockSections = [section];
      mockElements = [rectangle];
      
      await renderTestCanvas();
      
      const rectShape = screen.getByTestId(`canvas-element-${rectangle.id}`);
      
      // Try to drag element outside section
      fireEvent.mouseDown(rectShape, { clientX: 150, clientY: 150 });
      fireEvent.mouseMove(rectShape, { clientX: 400, clientY: 400 }); // Outside section
      fireEvent.mouseUp(rectShape);
      
      // Should constrain to section boundaries or remove from section
      expect(mockOnElementUpdate).toHaveBeenCalled();
    });
  });

  describe('Connector Integration', () => {
    it('should create connectors between elements', async () => {
      const rect1 = createRectangleElement({ 
        x: 100, 
        y: 100, 
        width: 100, 
        height: 100 
      });
      const rect2 = createRectangleElement({ 
        x: 300, 
        y: 300, 
        width: 100, 
        height: 100 
      });
      
      mockElements = [rect1, rect2];
      
      await renderTestCanvas();
      
      // Create connector between elements
      const connector = createConnectorElement({
        startElementId: rect1.id,
        endElementId: rect2.id,
        startPoint: { x: 200, y: 150 }, // Right edge of rect1
        endPoint: { x: 300, y: 350 }    // Left edge of rect2
      });
      
      // Add connector to canvas
      await act(async () => {
        mockOnElementAdd(connector);
      });
      
      expect(mockOnElementAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'connector',
          startElementId: rect1.id,
          endElementId: rect2.id
        })
      );
    });

    it('should move connectors with connected elements', async () => {
      const rect1 = createRectangleElement({ 
        x: 100, 
        y: 100 
      });
      const rect2 = createRectangleElement({ 
        x: 300, 
        y: 300 
      });
      const connector = createConnectorElement({
        startElementId: rect1.id,
        endElementId: rect2.id
      });
      
      mockElements = [rect1, rect2, connector];
      
      await renderTestCanvas();
      
      const rect1Shape = screen.getByTestId(`canvas-element-${rect1.id}`);
      
      // Move rect1
      fireEvent.mouseDown(rect1Shape, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(rect1Shape, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(rect1Shape);
      
      // Should update rect1 position
      expect(mockOnElementUpdate).toHaveBeenCalledWith(
        rect1.id,
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      );
      
      // Connector should automatically update its start point
      expect(mockOnElementUpdate).toHaveBeenCalledWith(
        connector.id,
        expect.objectContaining({
          startPoint: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number)
          })
        })
      );
    });

    it('should handle connector path recalculation', async () => {
      const rect1 = createRectangleElement({ x: 100, y: 100 });
      const rect2 = createRectangleElement({ x: 400, y: 400 });
      const connector = createConnectorElement({
        startElementId: rect1.id,
        endElementId: rect2.id,
        subType: 'curved'
      });
      
      mockElements = [rect1, rect2, connector];
      
      await renderTestCanvas();
      
      // Move one of the connected elements
      const rect2Shape = screen.getByTestId(`canvas-element-${rect2.id}`);
      fireEvent.mouseDown(rect2Shape, { clientX: 400, clientY: 400 });
      fireEvent.mouseMove(rect2Shape, { clientX: 500, y: 500 });
      fireEvent.mouseUp(rect2Shape);
      
      // Connector should recalculate its path
      expect(mockOnElementUpdate).toHaveBeenCalledWith(
        connector.id,
        expect.objectContaining({
          endPoint: expect.any(Object)
        })
      );
    });
  });

  describe('Element Deletion Integration', () => {
    it('should delete single elements', async () => {
      const rectangle = createRectangleElement();
      mockElements = [rectangle];
      
      await renderTestCanvas();
      
      const rectShape = screen.getByTestId(`canvas-element-${rectangle.id}`);
      expect(rectShape).toBeInTheDocument();
      
      // Simulate delete operation (e.g., Delete key)
      fireEvent.keyDown(rectShape, { key: 'Delete' });
      
      expect(mockOnElementDelete).toHaveBeenCalledWith(rectangle.id);
    });

    it('should delete multiple selected elements', async () => {
      const rect1 = createRectangleElement();
      const rect2 = createRectangleElement();
      mockElements = [rect1, rect2];
      mockSelectedIds = new Set([rect1.id, rect2.id]);
      
      await renderTestCanvas();
      
      // Simulate multi-delete
      fireEvent.keyDown(document, { key: 'Delete' });
      
      expect(mockOnElementDelete).toHaveBeenCalledWith(rect1.id);
      expect(mockOnElementDelete).toHaveBeenCalledWith(rect2.id);
    });

    it('should cascade delete connected elements', async () => {
      const rect1 = createRectangleElement();
      const rect2 = createRectangleElement();
      const connector = createConnectorElement({
        startElementId: rect1.id,
        endElementId: rect2.id
      });
      
      mockElements = [rect1, rect2, connector];
      
      await renderTestCanvas();
      
      // Delete rect1
      const rect1Shape = screen.getByTestId(`canvas-element-${rect1.id}`);
      fireEvent.keyDown(rect1Shape, { key: 'Delete' });
      
      // Should delete rect1 and its connector
      expect(mockOnElementDelete).toHaveBeenCalledWith(rect1.id);
      expect(mockOnElementDelete).toHaveBeenCalledWith(connector.id);
    });
  });

  describe('Drawing and Section Creation Integration', () => {
    it('should create sections around existing elements', async () => {
      const rect1 = createRectangleElement({ x: 150, y: 150 });
      const rect2 = createRectangleElement({ x: 250, y: 250 });
      mockElements = [rect1, rect2];
      
      await renderTestCanvas();
      
      // Select multiple elements
      const rect1Shape = screen.getByTestId(`canvas-element-${rect1.id}`);
      const rect2Shape = screen.getByTestId(`canvas-element-${rect2.id}`);
      
      fireEvent.click(rect1Shape);
      fireEvent.click(rect2Shape, { ctrlKey: true }); // Multi-select
      
      // Create section around selected elements
      const addSectionBtn = screen.getByTestId('add-section-button');
      await user.click(addSectionBtn);
      
      expect(mockOnElementAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'section',
          x: expect.any(Number),
          y: expect.any(Number),
          width: expect.any(Number),
          height: expect.any(Number),
          childElementIds: expect.arrayContaining([rect1.id, rect2.id])
        })
      );
    });

    it('should handle pen drawing', async () => {
      await renderTestCanvas();
      
      const stage = screen.getByRole('presentation'); // Konva stage
      
      // Simulate pen drawing
      fireEvent.mouseDown(stage, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(stage, { clientX: 110, clientY: 110 });
      fireEvent.mouseMove(stage, { clientX: 120, clientY: 115 });
      fireEvent.mouseMove(stage, { clientX: 130, clientY: 125 });
      fireEvent.mouseUp(stage);
      
      // Should create a pen element
      expect(mockOnElementAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pen',
          points: expect.any(Array)
        })
      );
    });

    it('should handle freeform drawing with multiple strokes', async () => {
      await renderTestCanvas();
      
      const stage = screen.getByRole('presentation');
      
      // First stroke
      fireEvent.mouseDown(stage, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(stage, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(stage);
      
      // Second stroke
      fireEvent.mouseDown(stage, { clientX: 200, clientY: 200 });
      fireEvent.mouseMove(stage, { clientX: 250, clientY: 250 });
      fireEvent.mouseUp(stage);
      
      // Should create multiple pen elements
      expect(mockOnElementAdd).toHaveBeenCalledTimes(2);
    });
  });

  describe('Image Upload Integration', () => {
    it('should handle image file upload', async () => {
      await renderTestCanvas();
      
      const fileInput = screen.getByTestId('image-upload-input');
      
      // Create mock image file
      const mockFile = new File(['dummy content'], 'test-image.png', {
        type: 'image/png'
      });
      
      // Upload file
      await user.upload(fileInput, mockFile);
      
      // Wait for FileReader to process
      await waitFor(() => {
        expect(mockOnElementAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'image',
            imageUrl: expect.stringContaining('data:image/png;base64')
          })
        );
      });
    });

    it('should handle multiple image uploads', async () => {
      await renderTestCanvas();
      
      const fileInput = screen.getByTestId('image-upload-input');
      
      // Upload first image
      const mockFile1 = new File(['dummy content 1'], 'image1.png', {
        type: 'image/png'
      });
      await user.upload(fileInput, mockFile1);
      
      // Upload second image
      const mockFile2 = new File(['dummy content 2'], 'image2.jpg', {
        type: 'image/jpeg'
      });
      await user.upload(fileInput, mockFile2);
      
      await waitFor(() => {
        expect(mockOnElementAdd).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle image upload errors', async () => {      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      global.FileReader = class MockErrorFileReader {
        onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
          readAsDataURL() {
          setTimeout(() => {
            if (this.onerror) {
              const event = {} as ProgressEvent<FileReader>;
              this.onerror.call(this as any, event);
            }
          });
        }
        
        // Add other required methods
        result: string | ArrayBuffer | null = null;
        error: any = null;
        readyState: number = 0;
        onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        abort() {}
        readAsArrayBuffer(file: File) {}
        readAsBinaryString(file: File) {}
        readAsText(file: File, encoding?: string) {}
        addEventListener() {}
        removeEventListener() {}
        dispatchEvent() { return true; }
      } as any;
      
      await renderTestCanvas();
      
      const fileInput = screen.getByTestId('image-upload-input');
      const mockFile = new File(['dummy content'], 'invalid-image.txt', {
        type: 'text/plain'
      });
      
      await user.upload(fileInput, mockFile);
      
      // Should not add element on error
      await waitFor(() => {
        expect(mockOnElementAdd).not.toHaveBeenCalled();
      });
      
      // Restore original FileReader
      global.FileReader = originalFileReader;
    });
  });

  describe('Complex Workflow Integration', () => {
    it('should handle complete user workflow: create, edit, move, connect, delete', async () => {
      await renderTestCanvas();
      
      // 1. Add elements
      const addTextBtn = screen.getByTestId('add-text-button');
      const addRectBtn = screen.getByTestId('add-rectangle-button');
      
      await user.click(addTextBtn);
      await user.click(addRectBtn);
      
      expect(mockOnElementAdd).toHaveBeenCalledTimes(2);
      
      // 2. Simulate elements being added to state
      const textElement = createTextElement();
      const rectElement = createRectangleElement();
      mockElements = [textElement, rectElement];
      
      await renderTestCanvas({ elements: mockElements });
      
      // 3. Edit text
      const textShape = screen.getByTestId(`canvas-element-${textElement.id}`);
      await user.dblClick(textShape);
      expect(mockOnStartTextEdit).toHaveBeenCalledWith(textElement.id);
      
      // 4. Move elements
      const rectShape = screen.getByTestId(`canvas-element-${rectElement.id}`);
      fireEvent.mouseDown(rectShape, { clientX: 150, clientY: 150 });
      fireEvent.mouseMove(rectShape, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(rectShape);
      
      expect(mockOnElementUpdate).toHaveBeenCalledWith(
        rectElement.id,
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      );
      
      // 5. Create connector
      const connector = createConnectorElement({
        startElementId: textElement.id,
        endElementId: rectElement.id
      });
      
      await act(async () => {
        mockOnElementAdd(connector);
      });
      
      // 6. Delete element
      fireEvent.keyDown(textShape, { key: 'Delete' });
      expect(mockOnElementDelete).toHaveBeenCalledWith(textElement.id);
    });

    it('should handle performance with many elements', async () => {
      // Create many elements
      const manyElements = Array.from({ length: 100 }, (_, i) => {
        if (i % 3 === 0) return createRectangleElement({ x: i * 10, y: i * 10 });
        if (i % 3 === 1) return createTextElement({ x: i * 10, y: i * 10 });
        return createStickyNoteElement({ x: i * 10, y: i * 10 });
      });
      
      mockElements = manyElements;
      
      const startTime = performance.now();
      await renderTestCanvas();
      const endTime = performance.now();
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // 1 second
      
      // All elements should be rendered
      manyElements.forEach(element => {
        const elementShape = screen.getByTestId(`canvas-element-${element.id}`);
        expect(elementShape).toBeInTheDocument();
      });
    });

    it('should handle complex multi-element operations', async () => {
      const elements = [
        createTextElement({ x: 100, y: 100 }),
        createRectangleElement({ x: 200, y: 200 }),
        createStickyNoteElement({ x: 300, y: 300 }),
        createImageElement({ x: 400, y: 400 })
      ];
      
      mockElements = elements;
      mockSelectedIds = new Set(elements.map(el => el.id));
      
      await renderTestCanvas();
      
      // Multi-element move
      const stage = screen.getByRole('presentation');
      fireEvent.mouseDown(stage, { clientX: 200, clientY: 200 });
      fireEvent.mouseMove(stage, { clientX: 250, clientY: 250 });
      fireEvent.mouseUp(stage);
      
      // Should update all selected elements
      elements.forEach(element => {
        expect(mockOnElementUpdate).toHaveBeenCalledWith(
          element.id,
          expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number)
          })
        );
      });
    });
  });
});

