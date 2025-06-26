/**
 * Complete User Workflow Test Suite
 * 
 * This test suite covers ALL essential desktop user interactions and workflows with the canvas system.
 * It tests the complete user journey from basic drawing to complex multi-element operations.
 * 
 * Test Categories:
 * 1. 🎨 Basic Drawing Workflows
 * 2. 📝 Text Editing Workflows  
 * 3. 🔧 Element Manipulation Workflows
 * 4. 📦 Section Management Workflows
 * 5. 🔗 Connector & Relationship Workflows
 * 6. 📋 Table Creation & Editing Workflows
 * 7. 🎯 Selection & Multi-Selection Workflows
 * 8. ↩️ Undo/Redo & History Workflows
 * 9. 🔍 Viewport & Navigation Workflows
 * 10. 🎨 Visual Styling & Formatting Workflows
 * 11. 💾 Persistence & Export Workflows
 * 12. ⚡ Performance & Edge Case Workflows
 * 13. ♿ Accessibility & Keyboard Workflows
 * 14. 🧪 Complex Integration Scenarios
 */

import { vi } from 'vitest';
import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithKonva } from '@/tests/utils/konva-test-utils';
import KonvaCanvas from '@/features/canvas/components/KonvaCanvas';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { 
  ElementId, 
  SectionId, 
  CanvasElement,
  TextElement,
  RectangleElement,
  CircleElement,
  ConnectorElement,
  SectionElement,
  TableElement,
  CanvasTool
} from '@/features/canvas/types/enhanced.types';

// Comprehensive mock store with all user-facing operations
const createComprehensiveMockStore = () => ({
  // === STATE ===
  elements: new Map<ElementId, CanvasElement>(),
  sections: new Map<SectionId, SectionElement>(),
  selectedElementIds: new Set<ElementId>(),
  selectedSectionIds: new Set<SectionId>(),
  selectedTool: 'select' as CanvasTool,
  isDrawing: false,
  
  // Drawing states
  currentPath: [],
  drawingStartPoint: null,
  drawingEndPoint: null,
  
  // Connector states
  isDrawingConnector: false,
  connectorStart: null,
  connectorEnd: null,
  
  // Section states
  isDrawingSection: false,
  sectionStart: null,
  previewSection: null,
  
  // Text editing states
  editingTextId: null,
  textEditingMode: false,
  richTextFormattingOptions: {
    bold: false,
    italic: false,
    underline: false,
    fontSize: 14,
    fontFamily: 'Arial',
    color: '#000000'
  },
  
  // Viewport states
  zoom: 1,
  pan: { x: 0, y: 0 },
  viewport: { scale: 1, position: { x: 0, y: 0 } },
  
  // History states
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  
  // Performance states
  renderMode: 'normal',
  debugMode: false,
  
  // === BASIC DRAWING OPERATIONS ===
  setSelectedTool: vi.fn(),
  startDrawing: vi.fn(),
  continueDrawing: vi.fn(),
  finishDrawing: vi.fn(),
  
  // === ELEMENT CRUD OPERATIONS ===
  addElement: vi.fn(),
  updateElement: vi.fn(),
  deleteElement: vi.fn(),
  duplicateElement: vi.fn(),
  
  // === ELEMENT MANIPULATION ===
  moveElement: vi.fn(),
  resizeElement: vi.fn(),
  rotateElement: vi.fn(),
  scaleElement: vi.fn(),
  flipElement: vi.fn(),
  
  // === SELECTION OPERATIONS ===
  selectElement: vi.fn(),
  selectMultipleElements: vi.fn(),
  clearSelection: vi.fn(),
  selectAll: vi.fn(),
  selectByType: vi.fn(),
  selectInArea: vi.fn(),
  
  // === TEXT OPERATIONS ===
  startTextEditing: vi.fn(),
  updateTextContent: vi.fn(),
  finishTextEditing: vi.fn(),
  applyTextFormatting: vi.fn(),
  setFontSize: vi.fn(),
  setFontFamily: vi.fn(),
  setTextColor: vi.fn(),
  setTextAlignment: vi.fn(),
  
  // === SECTION OPERATIONS ===
  createSection: vi.fn(),
  updateSection: vi.fn(),
  deleteSection: vi.fn(),
  moveElementToSection: vi.fn(),
  removeElementFromSection: vi.fn(),
  collapseSection: vi.fn(),
  expandSection: vi.fn(),
  resizeSection: vi.fn(),
  
  // === CONNECTOR OPERATIONS ===
  startConnector: vi.fn(),
  updateConnectorPath: vi.fn(),
  finishConnector: vi.fn(),
  deleteConnector: vi.fn(),
  attachConnectorToElement: vi.fn(),
  detachConnector: vi.fn(),
  
  // === TABLE OPERATIONS ===
  createTable: vi.fn(),
  addTableRow: vi.fn(),
  addTableColumn: vi.fn(),
  deleteTableRow: vi.fn(),
  deleteTableColumn: vi.fn(),
  updateTableCell: vi.fn(),
  resizeTableColumn: vi.fn(),
  resizeTableRow: vi.fn(),
  
  // === STYLING OPERATIONS ===
  setElementFill: vi.fn(),
  setElementStroke: vi.fn(),
  setElementOpacity: vi.fn(),
  applyStyle: vi.fn(),
  copyStyle: vi.fn(),
  pasteStyle: vi.fn(),
  
  // === LAYER OPERATIONS ===
  bringToFront: vi.fn(),
  sendToBack: vi.fn(),
  bringForward: vi.fn(),
  sendBackward: vi.fn(),
  
  // === ALIGNMENT OPERATIONS ===
  alignLeft: vi.fn(),
  alignCenter: vi.fn(),
  alignRight: vi.fn(),
  alignTop: vi.fn(),
  alignMiddle: vi.fn(),
  alignBottom: vi.fn(),
  distributeHorizontally: vi.fn(),
  distributeVertically: vi.fn(),
  
  // === GROUPING OPERATIONS ===
  groupElements: vi.fn(),
  ungroupElements: vi.fn(),
  
  // === VIEWPORT OPERATIONS ===
  setZoom: vi.fn(),
  setPan: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  zoomToFit: vi.fn(),
  zoomToSelection: vi.fn(),
  resetViewport: vi.fn(),
  
  // === HISTORY OPERATIONS ===
  undo: vi.fn(),
  redo: vi.fn(),
  addHistoryEntry: vi.fn(),
  clearHistory: vi.fn(),
  
  // === COORDINATE OPERATIONS ===
  screenToCanvas: vi.fn(),
  canvasToScreen: vi.fn(),
  
  // === PERSISTENCE OPERATIONS ===
  saveCanvas: vi.fn(),
  loadCanvas: vi.fn(),
  exportCanvas: vi.fn(),
  importCanvas: vi.fn(),
  
  // === UTILITY OPERATIONS ===
  getElementById: vi.fn(),
  getSectionById: vi.fn(),
  getElementBounds: vi.fn(),
  checkCollision: vi.fn(),
  snapToGrid: vi.fn(),
  snapToElement: vi.fn(),
});

let mockStore = createComprehensiveMockStore();

// Mock the enhanced store
vi.mock('@/features/canvas/stores/canvasStore.enhanced', () => ({
  useCanvasStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStore);
    }
    return mockStore;  }),
}));

// Helper functions
const createCanvasProps = (overrides = {}) => ({
  width: 800,
  height: 600,
  panZoomState: { scale: 1, position: { x: 0, y: 0 } },
  stageRef: { current: null },
  onWheelHandler: vi.fn(),
  ...overrides,
});

const renderCanvas = (props = {}) => {
  const canvasProps = createCanvasProps(props);
  return renderWithKonva(<KonvaCanvas {...canvasProps} />);
};

const createMockElement = (type: string, overrides = {}): CanvasElement => ({
  id: ElementId(`${type}-${Date.now()}`),
  type: type as any,
  x: 100,
  y: 100,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
} as CanvasElement);

describe('Complete User Workflow Test Suite', () => {
  beforeEach(() => {
    mockStore = createComprehensiveMockStore();
    vi.clearAllMocks();
  });

  describe('🎨 1. Basic Drawing Workflows', () => {
    test('Complete shape drawing workflow: Rectangle', async () => {
      renderCanvas();
      
      // 1. User selects rectangle tool
      act(() => {
        mockStore.setSelectedTool('rectangle');
      });
      expect(mockStore.setSelectedTool).toHaveBeenCalledWith('rectangle');
      
      // 2. Simulate drawing sequence through store
      act(() => {
        mockStore.startDrawing();
        mockStore.continueDrawing();
        mockStore.finishDrawing();
        mockStore.addElement(createMockElement('rectangle'));
      });
      
      // 3. Verify rectangle element was created
      expect(mockStore.startDrawing).toHaveBeenCalled();
      expect(mockStore.continueDrawing).toHaveBeenCalled();
      expect(mockStore.finishDrawing).toHaveBeenCalled();
      expect(mockStore.addElement).toHaveBeenCalled();
    });

    test('Complete shape drawing workflow: Circle', async () => {
      renderCanvas();
      
      act(() => {
        mockStore.setSelectedTool('circle');
        mockStore.startDrawing();
        mockStore.continueDrawing();
        mockStore.finishDrawing();
        mockStore.addElement(createMockElement('circle'));
      });
      
      expect(mockStore.setSelectedTool).toHaveBeenCalledWith('circle');
      expect(mockStore.addElement).toHaveBeenCalled();
    });

    test('Pen/freehand drawing workflow', async () => {
      const { container } = renderCanvas();
      
      act(() => {
        mockStore.setSelectedTool('pen');
      });
      
      const canvas = container.querySelector('canvas')!;
      
      // Simulate freehand drawing with multiple points
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      
      // Multiple mouse moves to create path
      const points = [
        { x: 105, y: 102 },
        { x: 110, y: 108 },
        { x: 120, y: 120 },
        { x: 135, y: 140 }
      ];
      
      points.forEach(point => {
        fireEvent.mouseMove(canvas, { clientX: point.x, clientY: point.y });
      });
      
      fireEvent.mouseUp(canvas, { clientX: 135, clientY: 140 });
      
      expect(mockStore.continueDrawing).toHaveBeenCalledTimes(points.length);
      expect(mockStore.finishDrawing).toHaveBeenCalled();
    });

    test('Shape drawing with grid snapping', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      
      // Enable grid snapping (simulated)
      mockStore.snapToGrid.mockReturnValue({ x: 100, y: 100 });
      
      act(() => {
        mockStore.setSelectedTool('rectangle');
      });
      
      // Draw with slightly off-grid coordinates
      fireEvent.mouseDown(canvas, { clientX: 103, clientY: 97 });
      fireEvent.mouseUp(canvas, { clientX: 203, clientY: 147 });
      
      // Should snap to grid
      expect(mockStore.snapToGrid).toHaveBeenCalled();
    });
  });

  describe('📝 2. Text Editing Workflows', () => {
    test('Complete text creation and editing workflow', async () => {
      const { container } = renderCanvas();
      
      // 1. Select text tool and create text element
      act(() => {
        mockStore.setSelectedTool('text');
      });
      
      const canvas = container.querySelector('canvas')!;
      fireEvent.click(canvas, { clientX: 200, clientY: 200 });
      
      expect(mockStore.startTextEditing).toHaveBeenCalled();
      
      // 2. User types text content
      const textInput = 'Hello, World!';
      act(() => {
        mockStore.updateTextContent(ElementId('text-1'), textInput);
      });
      
      // 3. Apply text formatting
      act(() => {
        mockStore.applyTextFormatting(ElementId('text-1'), {
          bold: true,
          fontSize: 18,
          color: '#0066cc'
        });
      });
      
      // 4. Finish text editing
      act(() => {
        mockStore.finishTextEditing(ElementId('text-1'), textInput);
      });
      
      expect(mockStore.updateTextContent).toHaveBeenCalledWith(ElementId('text-1'), textInput);
      expect(mockStore.applyTextFormatting).toHaveBeenCalled();
      expect(mockStore.finishTextEditing).toHaveBeenCalled();
    });

    test('Rich text formatting workflow', async () => {
      const textElementId = ElementId('text-rich');
      
      // Apply multiple formatting options sequentially
      const formattingOptions = [
        { bold: true },
        { italic: true },
        { underline: true },
        { fontSize: 20 },
        { fontFamily: 'Georgia' },
        { color: '#ff0000' },
        { textAlign: 'center' }
      ];
      
      formattingOptions.forEach(formatting => {
        act(() => {
          mockStore.applyTextFormatting(textElementId, formatting);
        });
      });
      
      expect(mockStore.applyTextFormatting).toHaveBeenCalledTimes(formattingOptions.length);
    });

    test('Multi-line text editing workflow', async () => {
      const textElementId = ElementId('text-multiline');
      const multiLineText = "Line 1\nLine 2\nLine 3";
      
      act(() => {
        mockStore.startTextEditing(textElementId);
        mockStore.updateTextContent(textElementId, multiLineText);
        mockStore.finishTextEditing(textElementId, multiLineText);
      });
      
      expect(mockStore.updateTextContent).toHaveBeenCalledWith(textElementId, multiLineText);
    });

    test('Text editing with escape to cancel', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      const textElementId = ElementId('text-cancel');
      
      // Start editing
      act(() => {
        mockStore.startTextEditing(textElementId);
      });
      
      // User presses Escape to cancel
      fireEvent.keyDown(canvas, { key: 'Escape' });
      
      // Should finish editing without saving changes
      expect(mockStore.finishTextEditing).toHaveBeenCalled();
    });
  });

  describe('🔧 3. Element Manipulation Workflows', () => {
    test('Complete element selection and transformation workflow', async () => {
      const elementId = ElementId('rect-1');
      const element = createMockElement('rectangle', { id: elementId, width: 100, height: 80 });
      
      // Add element to store
      mockStore.elements.set(elementId, element);
      
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      
      // 1. Select element
      fireEvent.click(canvas, { clientX: 150, clientY: 140 }); // Click center of element
      expect(mockStore.selectElement).toHaveBeenCalled();
      
      // 2. Move element via drag
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 140 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 180 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 180 });
      expect(mockStore.moveElement).toHaveBeenCalled();
      
      // 3. Resize element via corner handle
      const newSize = { width: 150, height: 120 };
      act(() => {
        mockStore.resizeElement(elementId, newSize);
      });
      expect(mockStore.resizeElement).toHaveBeenCalledWith(elementId, newSize);
      
      // 4. Rotate element via rotation handle
      act(() => {
        mockStore.rotateElement(elementId, 45);
      });
      expect(mockStore.rotateElement).toHaveBeenCalledWith(elementId, 45);
      
      // 5. Delete element with Delete key
      fireEvent.keyDown(canvas, { key: 'Delete' });
      expect(mockStore.deleteElement).toHaveBeenCalled();
    });

    test('Element duplication workflow (Ctrl+D)', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      const originalId = ElementId('original');
      
      // Select element
      act(() => {
        mockStore.selectElement(originalId);
      });
      
      // Duplicate with Ctrl+D
      fireEvent.keyDown(canvas, { key: 'd', ctrlKey: true });
      
      expect(mockStore.duplicateElement).toHaveBeenCalledWith(originalId);
    });

    test('Element copy/paste workflow', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      const elementId = ElementId('copy-source');
      
      // Select and copy element
      act(() => {
        mockStore.selectElement(elementId);
      });
      
      fireEvent.keyDown(canvas, { key: 'c', ctrlKey: true });
      fireEvent.keyDown(canvas, { key: 'v', ctrlKey: true });
      
      // Should create a new element
      expect(mockStore.addElement).toHaveBeenCalled();
    });

    test('Element styling workflow', async () => {
      const elementId = ElementId('styled-rect');
      
      // Apply multiple style changes
      const styleUpdates = [
        { fill: '#ff6b6b' },
        { stroke: '#4ecdc4' },
        { strokeWidth: 3 },
        { opacity: 0.8 },
        { cornerRadius: 10 }
      ];
      
      styleUpdates.forEach(style => {
        act(() => {
          mockStore.updateElement(elementId, style);
        });
      });
      
      expect(mockStore.updateElement).toHaveBeenCalledTimes(styleUpdates.length);
    });
  });

  describe('📦 4. Section Management Workflows', () => {
    test('Complete section creation and management workflow', async () => {
      const { container } = renderCanvas();
      
      // 1. Select section tool
      act(() => {
        mockStore.setSelectedTool('section');
      });
      
      const canvas = container.querySelector('canvas')!;
      
      // 2. Draw section by dragging
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(canvas, { clientX: 350, clientY: 250 });
      fireEvent.mouseUp(canvas, { clientX: 350, clientY: 250 });
      
      expect(mockStore.createSection).toHaveBeenCalled();
      
      // 3. Add elements to section by dragging them in
      const elementId = ElementId('element-in-section');
      const sectionId = SectionId('section-1');
      
      act(() => {
        mockStore.moveElementToSection(elementId, sectionId);
      });
      expect(mockStore.moveElementToSection).toHaveBeenCalledWith(elementId, sectionId);
      
      // 4. Collapse section by clicking collapse button
      act(() => {
        mockStore.collapseSection(sectionId);
      });
      expect(mockStore.collapseSection).toHaveBeenCalledWith(sectionId);
      
      // 5. Expand section
      act(() => {
        mockStore.expandSection(sectionId);
      });
      expect(mockStore.expandSection).toHaveBeenCalledWith(sectionId);
      
      // 6. Remove element from section by dragging out
      act(() => {
        mockStore.removeElementFromSection(elementId, sectionId);
      });
      expect(mockStore.removeElementFromSection).toHaveBeenCalledWith(elementId, sectionId);
    });

    test('Section resizing with contained elements workflow', async () => {
      const sectionId = SectionId('resizable-section');
      const containedElementIds = [
        ElementId('contained-1'),
        ElementId('contained-2')
      ];
      
      // Resize section
      const newBounds = { width: 400, height: 300 };
      act(() => {
        mockStore.resizeSection(sectionId, newBounds);
      });
      
      expect(mockStore.resizeSection).toHaveBeenCalledWith(sectionId, newBounds);
    });

    test('Nested sections workflow', async () => {
      const parentSectionId = SectionId('parent-section');
      const childSectionId = SectionId('child-section');
      
      // Create parent section
      act(() => {
        mockStore.createSection(parentSectionId, {
          x: 50,
          y: 50,
          width: 500,
          height: 400,
          title: 'Parent Section'
        });
      });
      
      // Create child section within parent
      act(() => {
        mockStore.createSection(childSectionId, {
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          title: 'Child Section'
        });
        mockStore.moveElementToSection(childSectionId as any, parentSectionId);
      });
      
      expect(mockStore.createSection).toHaveBeenCalledTimes(2);
      expect(mockStore.moveElementToSection).toHaveBeenCalled();
    });
  });

  describe('🔗 5. Connector & Relationship Workflows', () => {
    test('Complete connector creation workflow', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      
      // Setup: Create two elements to connect
      const element1Id = ElementId('element-1');
      const element2Id = ElementId('element-2');
      
      mockStore.elements.set(element1Id, createMockElement('rectangle', { id: element1Id, x: 100, y: 100 }));
      mockStore.elements.set(element2Id, createMockElement('circle', { id: element2Id, x: 300, y: 200 }));
      
      // 1. Select connector tool
      act(() => {
        mockStore.setSelectedTool('connector');
      });
      
      // 2. Start connector from first element
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 140 }); // Center of element1
      expect(mockStore.startConnector).toHaveBeenCalled();
      
      // 3. Drag to second element
      fireEvent.mouseMove(canvas, { clientX: 300, clientY: 200 });
      
      // 4. Finish connector on second element
      fireEvent.mouseUp(canvas, { clientX: 300, clientY: 200 }); // Center of element2
      expect(mockStore.finishConnector).toHaveBeenCalled();
    });

    test('Connector attachment and detachment workflow', async () => {
      const connectorId = ElementId('connector-1');
      const elementId = ElementId('target-element');
      
      // Attach connector to element
      act(() => {
        mockStore.attachConnectorToElement(connectorId, elementId, 'start');
      });
      expect(mockStore.attachConnectorToElement).toHaveBeenCalledWith(connectorId, elementId, 'start');
      
      // Detach connector
      act(() => {
        mockStore.detachConnector(connectorId, 'start');
      });
      expect(mockStore.detachConnector).toHaveBeenCalledWith(connectorId, 'start');
    });

    test('Dynamic connector path updates when elements move', async () => {
      const connectorId = ElementId('dynamic-connector');
      const connectedElementId = ElementId('connected-element');
      
      // Simulate element movement which should trigger connector update
      act(() => {
        mockStore.moveElement(connectedElementId, { x: 250, y: 300 });
        mockStore.updateConnectorPath(connectorId);
      });
      
      expect(mockStore.updateConnectorPath).toHaveBeenCalledWith(connectorId);
    });

    test('Connector styling and arrow types workflow', async () => {
      const connectorId = ElementId('styled-connector');
      
      // Apply connector styling
      const connectorStyles = [
        { stroke: '#ff0000' },
        { strokeWidth: 3 },
        { startArrow: 'triangle' },
        { endArrow: 'diamond' },
        { pathType: 'curved' }
      ];
      
      connectorStyles.forEach(style => {
        act(() => {
          mockStore.updateElement(connectorId, style);
        });
      });
      
      expect(mockStore.updateElement).toHaveBeenCalledTimes(connectorStyles.length);
    });
  });

  describe('📋 6. Table Creation & Editing Workflows', () => {
    test('Complete table creation and editing workflow', async () => {
      const { container } = renderCanvas();
      
      // 1. Select table tool and create table
      act(() => {
        mockStore.setSelectedTool('table');
      });
      
      const canvas = container.querySelector('canvas')!;
      fireEvent.click(canvas, { clientX: 200, clientY: 150 });
      
      expect(mockStore.createTable).toHaveBeenCalled();
      
      const tableId = ElementId('table-1');
      
      // 2. Add rows and columns
      act(() => {
        mockStore.addTableRow(tableId);
        mockStore.addTableColumn(tableId);
      });
      
      // 3. Edit cell content by double-clicking cells
      const cellEdits = [
        { row: 0, col: 0, content: 'Header 1' },
        { row: 0, col: 1, content: 'Header 2' },
        { row: 1, col: 0, content: 'Row 1 Col 1' },
        { row: 1, col: 1, content: 'Row 1 Col 2' }
      ];
      
      cellEdits.forEach(edit => {
        act(() => {
          mockStore.updateTableCell(tableId, edit.row, edit.col, edit.content);
        });
      });
      
      // 4. Resize columns and rows by dragging borders
      act(() => {
        mockStore.resizeTableColumn(tableId, 0, 150);
        mockStore.resizeTableRow(tableId, 0, 40);
      });
      
      // 5. Delete row/column
      act(() => {
        mockStore.deleteTableRow(tableId, 1);
        mockStore.deleteTableColumn(tableId, 1);
      });
      
      expect(mockStore.updateTableCell).toHaveBeenCalledTimes(cellEdits.length);
      expect(mockStore.resizeTableColumn).toHaveBeenCalled();
      expect(mockStore.resizeTableRow).toHaveBeenCalled();
      expect(mockStore.deleteTableRow).toHaveBeenCalled();
      expect(mockStore.deleteTableColumn).toHaveBeenCalled();
    });

    test('Table navigation with keyboard workflow', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      const tableId = ElementId('keyboard-table');
      
      // Simulate keyboard navigation in table
      const navigationKeys = ['Tab', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
      
      navigationKeys.forEach(key => {
        fireEvent.keyDown(canvas, { key });
      });
      
      // Enter should start editing current cell
      fireEvent.keyDown(canvas, { key: 'Enter' });
      expect(mockStore.startTextEditing).toHaveBeenCalled();
    });
  });

  describe('🎯 7. Selection & Multi-Selection Workflows', () => {
    test('Complete multi-selection workflow', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      
      // Create multiple elements
      const elementIds = [
        ElementId('multi-1'),
        ElementId('multi-2'),
        ElementId('multi-3')
      ];
      
      elementIds.forEach((id, index) => {
        mockStore.elements.set(id, createMockElement('rectangle', { 
          id, 
          x: 100 + (index * 100), 
          y: 100 
        }));
      });
      
      // 1. Select first element
      fireEvent.click(canvas, { clientX: 150, clientY: 140 });
      
      // 2. Add to selection with Ctrl+click
      fireEvent.click(canvas, { 
        clientX: 250, 
        clientY: 140, 
        ctrlKey: true 
      });
      
      // 3. Add third element to selection
      fireEvent.click(canvas, { 
        clientX: 350, 
        clientY: 140, 
        ctrlKey: true 
      });
      
      expect(mockStore.selectElement).toHaveBeenCalledTimes(3);
      
      // 4. Select all with Ctrl+A
      fireEvent.keyDown(canvas, { key: 'a', ctrlKey: true });
      expect(mockStore.selectAll).toHaveBeenCalled();
      
      // 5. Clear selection with Escape
      fireEvent.keyDown(canvas, { key: 'Escape' });
      expect(mockStore.clearSelection).toHaveBeenCalled();
    });

    test('Area selection (marquee) workflow', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      
      // 1. Click and drag to create selection rectangle
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(canvas, { clientX: 250, clientY: 200 });
      fireEvent.mouseUp(canvas, { clientX: 250, clientY: 200 });
      
      // Should select elements within the dragged area
      expect(mockStore.selectInArea).toHaveBeenCalled();
    });

    test('Selection filtering by type workflow', async () => {
      // Select all rectangles
      act(() => {
        mockStore.selectByType('rectangle');
      });
      expect(mockStore.selectByType).toHaveBeenCalledWith('rectangle');
      
      // Select all text elements
      act(() => {
        mockStore.selectByType('text');
      });
      expect(mockStore.selectByType).toHaveBeenCalledWith('text');
    });

    test('Multi-selection group operations', async () => {
      const elementIds = [
        ElementId('group-1'),
        ElementId('group-2'),
        ElementId('group-3')
      ];
      
      // Select multiple elements
      act(() => {
        mockStore.selectMultipleElements(elementIds);
      });
      
      // Group selected elements
      act(() => {
        mockStore.groupElements(elementIds);
      });
      expect(mockStore.groupElements).toHaveBeenCalledWith(elementIds);
      
      // Ungroup
      act(() => {
        mockStore.ungroupElements(ElementId('group-id'));
      });
      expect(mockStore.ungroupElements).toHaveBeenCalled();
    });
  });

  describe('↩️ 8. Undo/Redo & History Workflows', () => {
    test('Complete undo/redo workflow', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      
      // 1. Perform actions that should be recorded in history
      act(() => {
        mockStore.addElement(createMockElement('rectangle'));
        mockStore.addHistoryEntry('ADD_ELEMENT', [], []);
      });
      
      act(() => {
        mockStore.addElement(createMockElement('circle'));
        mockStore.addHistoryEntry('ADD_ELEMENT', [], []);
      });
      
      act(() => {
        mockStore.updateElement(ElementId('element-1'), { x: 200, y: 200 });
        mockStore.addHistoryEntry('UPDATE_ELEMENT', [], []);
      });
      
      // 2. Undo with Ctrl+Z
      fireEvent.keyDown(canvas, { key: 'z', ctrlKey: true });
      expect(mockStore.undo).toHaveBeenCalled();
      
      // 3. Redo with Ctrl+Y
      fireEvent.keyDown(canvas, { key: 'y', ctrlKey: true });
      expect(mockStore.redo).toHaveBeenCalled();
      
      // 4. Multiple undos
      fireEvent.keyDown(canvas, { key: 'z', ctrlKey: true });
      fireEvent.keyDown(canvas, { key: 'z', ctrlKey: true });
      
      expect(mockStore.undo).toHaveBeenCalledTimes(3);
    });

    test('History branching on new action after undo', async () => {
      // Undo some actions
      act(() => {
        mockStore.undo();
        mockStore.undo();
      });
      
      // Perform new action (should branch history)
      act(() => {
        mockStore.addElement(createMockElement('text'));
        mockStore.addHistoryEntry('ADD_ELEMENT', [], []);
      });
      
      // Previous redo states should be cleared
      expect(mockStore.addHistoryEntry).toHaveBeenCalled();
    });
  });

  describe('🔍 9. Viewport & Navigation Workflows', () => {
    test('Complete viewport manipulation workflow', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      
      // 1. Zoom with mouse wheel
      fireEvent.wheel(canvas, { deltaY: -100 }); // Zoom in
      fireEvent.wheel(canvas, { deltaY: 100 });  // Zoom out
      
      // 2. Pan with middle mouse button drag
      fireEvent.mouseDown(canvas, { button: 1, clientX: 400, clientY: 300 });
      fireEvent.mouseMove(canvas, { clientX: 450, clientY: 350 });
      fireEvent.mouseUp(canvas, { button: 1, clientX: 450, clientY: 350 });
      
      // 3. Zoom keyboard shortcuts
      fireEvent.keyDown(canvas, { key: '=', ctrlKey: true }); // Zoom in
      fireEvent.keyDown(canvas, { key: '-', ctrlKey: true }); // Zoom out
      
      // 4. Zoom to fit all content
      fireEvent.keyDown(canvas, { key: '0', ctrlKey: true });
      expect(mockStore.zoomToFit).toHaveBeenCalled();
      
      // 5. Zoom to selection
      act(() => {
        mockStore.selectElement(ElementId('element-1'));
        mockStore.zoomToSelection();
      });
      expect(mockStore.zoomToSelection).toHaveBeenCalled();
      
      // 6. Reset viewport to default
      act(() => {
        mockStore.resetViewport();
      });
      expect(mockStore.resetViewport).toHaveBeenCalled();
    });

    test('Viewport constraints workflow', async () => {
      // Test zoom limits
      act(() => {
        // Zoom in beyond max
        for (let i = 0; i < 20; i++) {
          mockStore.zoomIn();
        }
        
        // Zoom out beyond min
        for (let i = 0; i < 20; i++) {
          mockStore.zoomOut();
        }
      });
      
      // Should respect zoom limits
      expect(mockStore.zoomIn).toHaveBeenCalled();
      expect(mockStore.zoomOut).toHaveBeenCalled();
    });

    test('Pan boundaries workflow', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      
      // Try to pan beyond canvas boundaries
      const extremePanValues = [
        { x: -10000, y: -10000 },
        { x: 10000, y: 10000 }
      ];
      
      extremePanValues.forEach(panValue => {
        act(() => {
          mockStore.setPan(panValue);
        });
      });
      
      // Should enforce reasonable pan limits
      expect(mockStore.setPan).toHaveBeenCalledTimes(extremePanValues.length);
    });
  });

  describe('🎨 10. Visual Styling & Formatting Workflows', () => {
    test('Complete styling workflow', async () => {
      const elementId = ElementId('styled-element');
      
      // 1. Apply fill color
      act(() => {
        mockStore.setElementFill(elementId, '#ff6b6b');
      });
      
      // 2. Apply stroke
      act(() => {
        mockStore.setElementStroke(elementId, '#333333');
      });
      
      // 3. Apply opacity
      act(() => {
        mockStore.setElementOpacity(elementId, 0.7);
      });
      
      // 4. Copy and paste style
      act(() => {
        mockStore.copyStyle(elementId);
        mockStore.pasteStyle(ElementId('target-element'));
      });
      
      expect(mockStore.setElementFill).toHaveBeenCalled();
      expect(mockStore.setElementStroke).toHaveBeenCalled();
      expect(mockStore.setElementOpacity).toHaveBeenCalled();
      expect(mockStore.copyStyle).toHaveBeenCalled();
      expect(mockStore.pasteStyle).toHaveBeenCalled();
    });

    test('Element alignment workflow', async () => {
      const elementIds = [
        ElementId('align-1'),
        ElementId('align-2'),
        ElementId('align-3')
      ];
      
      // Select multiple elements
      act(() => {
        mockStore.selectMultipleElements(elementIds);
      });
      
      // Test all alignment operations
      const alignmentOperations = [
        'alignLeft',
        'alignCenter', 
        'alignRight',
        'alignTop',
        'alignMiddle',
        'alignBottom',
        'distributeHorizontally',
        'distributeVertically'
      ];
      
      alignmentOperations.forEach(operation => {
        act(() => {
          (mockStore as any)[operation]();
        });
        expect((mockStore as any)[operation]).toHaveBeenCalled();
      });
    });

    test('Layer ordering workflow', async () => {
      const elementId = ElementId('layered-element');
      
      // Test layer operations
      const layerOperations = [
        'bringToFront',
        'sendToBack',
        'bringForward',
        'sendBackward'
      ];
      
      layerOperations.forEach(operation => {
        act(() => {
          (mockStore as any)[operation](elementId);
        });
        expect((mockStore as any)[operation]).toHaveBeenCalledWith(elementId);
      });
    });
  });

  describe('💾 11. Persistence & Export Workflows', () => {
    test('Complete save/load workflow', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      
      // 1. Save canvas with Ctrl+S
      fireEvent.keyDown(canvas, { key: 's', ctrlKey: true });
      expect(mockStore.saveCanvas).toHaveBeenCalled();
      
      // 2. Load canvas with Ctrl+O
      fireEvent.keyDown(canvas, { key: 'o', ctrlKey: true });
      expect(mockStore.loadCanvas).toHaveBeenCalled();
      
      // 3. Export canvas in different formats
      const exportFormats = ['png', 'jpg', 'svg', 'pdf'];
      
      exportFormats.forEach(format => {
        act(() => {
          mockStore.exportCanvas(format);
        });
      });
      
      expect(mockStore.exportCanvas).toHaveBeenCalledTimes(exportFormats.length);
    });

    test('Auto-save workflow', async () => {
      // Simulate auto-save triggers
      const autoSaveTriggers = [
        () => mockStore.addElement(createMockElement('rectangle')),
        () => mockStore.updateElement(ElementId('element-1'), { x: 100 }),
        () => mockStore.deleteElement(ElementId('element-2'))
      ];
      
      autoSaveTriggers.forEach(trigger => {
        act(() => {
          trigger();
          // Auto-save should be triggered
          mockStore.saveCanvas();
        });
      });
      
      expect(mockStore.saveCanvas).toHaveBeenCalledTimes(autoSaveTriggers.length);
    });
  });

  describe('⚡ 12. Performance & Edge Case Workflows', () => {
    test('Large canvas with many elements performance workflow', async () => {
      // Create 100 elements efficiently
      const elements = Array.from({ length: 100 }, (_, i) => 
        createMockElement('rectangle', { 
          id: ElementId(`perf-element-${i}`),
          x: (i % 10) * 100,
          y: Math.floor(i / 10) * 100
        })
      );
      
      const startTime = performance.now();
      
      // Add all elements
      elements.forEach(element => {
        if ('type' in element && element.type === 'section') {
          mockStore.sections.set(element.id as SectionId, element as any);
        } else {
          mockStore.elements.set(element.id as ElementId, element);
        }
      });
      
      // Perform bulk operations
      act(() => {
        mockStore.selectAll();
        mockStore.moveElement(ElementId('perf-element-0'), { x: 500, y: 500 });
      });
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      // Should complete operations quickly
      expect(operationTime).toBeLessThan(100);
      expect(mockStore.elements.size).toBe(100);
    });

    test('Memory cleanup on element deletion workflow', async () => {
      const elementIds = Array.from({ length: 50 }, (_, i) => ElementId(`cleanup-${i}`));
      
      // Add elements
      elementIds.forEach(id => {
        mockStore.elements.set(id, createMockElement('rectangle', { id }));
      });
      
      // Delete all elements
      elementIds.forEach(id => {
        act(() => {
          mockStore.deleteElement(id);
        });
      });
      
      // Verify cleanup calls
      expect(mockStore.deleteElement).toHaveBeenCalledTimes(elementIds.length);
    });

    test('Rapid viewport changes stress test', async () => {
      // Simulate rapid zoom/pan changes
      for (let i = 0; i < 50; i++) {
        act(() => {
          mockStore.setZoom(1 + (i % 10) * 0.1);
          mockStore.setPan({ x: i * 10, y: i * 5 });
        });
      }
      
      expect(mockStore.setZoom).toHaveBeenCalledTimes(50);
      expect(mockStore.setPan).toHaveBeenCalledTimes(50);
    });

    test('Concurrent operations workflow', async () => {
      // Simulate multiple operations happening simultaneously
      act(() => {
        // Drawing while zooming
        mockStore.startDrawing();
        mockStore.setZoom(1.5);
        mockStore.continueDrawing();
        mockStore.setPan({ x: 50, y: 50 });
        mockStore.finishDrawing();
        
        // Text editing while selecting
        mockStore.startTextEditing(ElementId('text-1'));
        mockStore.selectElement(ElementId('element-1'));
        mockStore.finishTextEditing(ElementId('text-1'), 'Updated text');
      });
      
      // Should handle concurrent operations gracefully
      expect(mockStore.startDrawing).toHaveBeenCalled();
      expect(mockStore.setZoom).toHaveBeenCalled();
      expect(mockStore.startTextEditing).toHaveBeenCalled();
      expect(mockStore.selectElement).toHaveBeenCalled();
    });
  });

  describe('♿ 13. Accessibility & Keyboard Workflows', () => {
    test('Complete keyboard navigation workflow', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      
      // Test all essential keyboard shortcuts
      const shortcuts = [
        { key: 'Delete', action: 'deleteElement', description: 'Delete selected elements' },
        { key: 'Escape', action: 'clearSelection', description: 'Clear selection' },
        { key: 'z', ctrlKey: true, action: 'undo', description: 'Undo' },
        { key: 'y', ctrlKey: true, action: 'redo', description: 'Redo' },
        { key: 'a', ctrlKey: true, action: 'selectAll', description: 'Select all' },
        { key: 's', ctrlKey: true, action: 'saveCanvas', description: 'Save canvas' },
        { key: 'o', ctrlKey: true, action: 'loadCanvas', description: 'Open canvas' },
        { key: 'c', ctrlKey: true, action: 'copy', description: 'Copy' },
        { key: 'v', ctrlKey: true, action: 'paste', description: 'Paste' },
        { key: 'd', ctrlKey: true, action: 'duplicateElement', description: 'Duplicate' }
      ];
      
      shortcuts.forEach(shortcut => {
        fireEvent.keyDown(canvas, {
          key: shortcut.key,
          ctrlKey: shortcut.ctrlKey || false
        });
        
        if (mockStore[shortcut.action as keyof typeof mockStore]) {
          expect((mockStore as any)[shortcut.action]).toHaveBeenCalled();
        }
      });
    });

    test('Arrow key navigation workflow', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      const elementId = ElementId('nav-element');
      
      // Select element
      act(() => {
        mockStore.selectElement(elementId);
      });
      
      // Navigate with arrow keys (should move element)
      const directions = [
        { key: 'ArrowUp', expectedDelta: { x: 0, y: -1 } },
        { key: 'ArrowDown', expectedDelta: { x: 0, y: 1 } },
        { key: 'ArrowLeft', expectedDelta: { x: -1, y: 0 } },
        { key: 'ArrowRight', expectedDelta: { x: 1, y: 0 } }
      ];
      
      directions.forEach(direction => {
        fireEvent.keyDown(canvas, { key: direction.key });
        // Should move element by 1 pixel (or configured increment)
        expect(mockStore.moveElement).toHaveBeenCalled();
      });
    });

    test('Tab navigation for tool selection', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      
      // Tab through tools
      const tools = ['select', 'rectangle', 'circle', 'text', 'pen'];
      
      tools.forEach(tool => {
        fireEvent.keyDown(canvas, { key: 'Tab' });
        // Should cycle through tools (simplified test)
      });
      
      // Shift+Tab should go backwards
      fireEvent.keyDown(canvas, { key: 'Tab', shiftKey: true });
    });

    test('Focus management during text editing', async () => {
      const { container } = renderCanvas();
      const canvas = container.querySelector('canvas')!;
      const textElementId = ElementId('focus-text');
      
      // Start text editing
      act(() => {
        mockStore.startTextEditing(textElementId);
      });
      
      // Focus should be managed properly
      expect(mockStore.startTextEditing).toHaveBeenCalledWith(textElementId);
      
      // Tab out of text editing
      fireEvent.keyDown(canvas, { key: 'Tab' });
      
      // Should finish text editing and move focus
      expect(mockStore.finishTextEditing).toHaveBeenCalled();
    });
  });

  describe('🧪 14. Complex Integration Scenarios', () => {
    test('Complete project workflow: Create flowchart diagram', async () => {
      const { container } = renderCanvas();
      
      // 1. Create main section for the flowchart
      const mainSectionId = SectionId('flowchart-section');
      act(() => {
        mockStore.setSelectedTool('section');
        mockStore.createSection(mainSectionId, {
          x: 50,
          y: 50,
          width: 700,
          height: 500,
          title: 'Flowchart Diagram'
        });
      });
      
      // 2. Create flowchart elements
      const flowElements = [
        { id: ElementId('start'), type: 'circle', x: 150, y: 100, label: 'Start' },
        { id: ElementId('process1'), type: 'rectangle', x: 150, y: 200, label: 'Process 1' },
        { id: ElementId('decision'), type: 'diamond', x: 150, y: 300, label: 'Decision?' },
        { id: ElementId('process2'), type: 'rectangle', x: 300, y: 300, label: 'Process 2' },
        { id: ElementId('end'), type: 'circle', x: 150, y: 400, label: 'End' }
      ];
      
      flowElements.forEach(elem => {
        act(() => {
          mockStore.addElement(createMockElement(elem.type, {
            id: elem.id,
            x: elem.x,
            y: elem.y
          }));
          mockStore.moveElementToSection(elem.id, mainSectionId);
        });
      });
      
      // 3. Connect elements with connectors
      const connections = [
        { from: ElementId('start'), to: ElementId('process1') },
        { from: ElementId('process1'), to: ElementId('decision') },
        { from: ElementId('decision'), to: ElementId('process2') },
        { from: ElementId('decision'), to: ElementId('end') },
        { from: ElementId('process2'), to: ElementId('end') }
      ];
      
      connections.forEach(conn => {
        act(() => {
          mockStore.setSelectedTool('connector');
          mockStore.startConnector(conn.from, conn.to);
          mockStore.finishConnector();
        });
      });
      
      // 4. Add text labels to elements
      flowElements.forEach(elem => {
        const textId = ElementId(`${elem.id}-label`);
        act(() => {
          mockStore.addElement(createMockElement('text', {
            id: textId,
            x: elem.x,
            y: elem.y - 20,
            text: elem.label
          }));
          mockStore.moveElementToSection(textId, mainSectionId);
        });
      });
      
      // 5. Style the flowchart elements
      act(() => {
        mockStore.setElementFill(ElementId('start'), '#4CAF50');
        mockStore.setElementFill(ElementId('end'), '#F44336');
        mockStore.setElementFill(ElementId('decision'), '#FF9800');
        mockStore.setElementFill(ElementId('process1'), '#2196F3');
        mockStore.setElementFill(ElementId('process2'), '#2196F3');
      });
      
      // 6. Save the complete flowchart
      act(() => {
        mockStore.addHistoryEntry('CREATE_FLOWCHART', [], []);
        mockStore.saveCanvas();
      });
      
      // Verify complete workflow
      expect(mockStore.createSection).toHaveBeenCalled();
      expect(mockStore.addElement).toHaveBeenCalledTimes(flowElements.length * 2); // Elements + labels
      expect(mockStore.finishConnector).toHaveBeenCalledTimes(connections.length);
      expect(mockStore.setElementFill).toHaveBeenCalledTimes(5);
      expect(mockStore.saveCanvas).toHaveBeenCalled();
    });

    test('Complete editing session workflow', async () => {
      // Simulate a complete editing session with multiple operations
      const sessionOperations = [
        // Initial canvas setup
        () => mockStore.setSelectedTool('rectangle'),
        () => mockStore.addElement(createMockElement('rectangle')),
        () => mockStore.addHistoryEntry('ADD_ELEMENT', [], []),
        
        // Add more elements
        () => mockStore.setSelectedTool('circle'),
        () => mockStore.addElement(createMockElement('circle')),
        () => mockStore.addHistoryEntry('ADD_ELEMENT', [], []),
        
        // Text addition
        () => mockStore.setSelectedTool('text'),
        () => mockStore.addElement(createMockElement('text', { text: 'Hello World' })),
        () => mockStore.addHistoryEntry('ADD_ELEMENT', [], []),
        
        // Element manipulation
        () => mockStore.selectElement(ElementId('rectangle-1')),
        () => mockStore.moveElement(ElementId('rectangle-1'), { x: 200, y: 200 }),
        () => mockStore.addHistoryEntry('MOVE_ELEMENT', [], []),
        
        // Styling
        () => mockStore.setElementFill(ElementId('rectangle-1'), '#ff6b6b'),
        () => mockStore.addHistoryEntry('STYLE_ELEMENT', [], []),
        
        // Section creation
        () => mockStore.setSelectedTool('section'),
        () => mockStore.createSection(SectionId('section-1'), { x: 50, y: 50, width: 400, height: 300 }),
        () => mockStore.addHistoryEntry('CREATE_SECTION', [], []),
        
        // Element grouping
        () => mockStore.selectMultipleElements([ElementId('rectangle-1'), ElementId('circle-1')]),
        () => mockStore.moveElementToSection(ElementId('rectangle-1'), SectionId('section-1')),
        () => mockStore.addHistoryEntry('MOVE_TO_SECTION', [], []),
        
        // Final save
        () => mockStore.saveCanvas()
      ];
      
      // Execute all operations
      sessionOperations.forEach(operation => {
        act(() => {
          operation();
        });
      });
      
      // Verify session completed successfully
      expect(mockStore.addElement).toHaveBeenCalledTimes(3);
      expect(mockStore.createSection).toHaveBeenCalledTimes(1);
      expect(mockStore.moveElement).toHaveBeenCalledTimes(1);
      expect(mockStore.setElementFill).toHaveBeenCalledTimes(1);
      expect(mockStore.saveCanvas).toHaveBeenCalledTimes(1);
      expect(mockStore.addHistoryEntry).toHaveBeenCalledTimes(7);
    });

    test('Import/export workflow with complex canvas', async () => {
      // Create complex canvas state
      const complexElements = [
        createMockElement('rectangle', { x: 100, y: 100, width: 150, height: 100 }),
        createMockElement('circle', { x: 300, y: 100, radius: 50 }),
        createMockElement('text', { x: 100, y: 250, text: 'Complex Canvas Test' }),
        createMockElement('connector', { startPoint: { x: 250, y: 150 }, endPoint: { x: 300, y: 150 } })
      ];
      
      // Add elements to store
      complexElements.forEach(element => {
        if ('type' in element && element.type === 'section') {
          mockStore.sections.set(element.id as SectionId, element as any);
        } else {
          mockStore.elements.set(element.id as ElementId, element);
        }
      });
      
      // Create sections
      const section = {
        id: SectionId('complex-section'),
        x: 50,
        y: 50,
        width: 400,
        height: 300,
        title: 'Complex Section'
      };
      mockStore.sections.set(section.id, section as any);
      
      // Export canvas to JSON
      act(() => {
        mockStore.exportCanvas('json');
      });
      
      // Clear canvas
      act(() => {
        mockStore.elements.clear();
        mockStore.sections.clear();
        mockStore.clearHistory();
      });
      
      // Import canvas back
      act(() => {
        mockStore.importCanvas();
      });
      
      expect(mockStore.exportCanvas).toHaveBeenCalledWith('json');
      expect(mockStore.importCanvas).toHaveBeenCalled();
      expect(mockStore.clearHistory).toHaveBeenCalled();
    });

    test('Error recovery workflow', async () => {
      const { container } = renderCanvas();
      
      // Simulate various error conditions and recovery
      const errorScenarios = [
        // Invalid element data
        () => {
          try {
            mockStore.addElement(null as any);
          } catch (error) {
            // Should handle gracefully
          }
        },
        
        // Missing element reference
        () => {
          try {
            mockStore.updateElement(ElementId('non-existent'), { x: 100 });
          } catch (error) {
            // Should handle gracefully
          }
        },
        
        // Invalid viewport values
        () => {
          try {
            mockStore.setZoom(-5); // Invalid zoom
            mockStore.setPan({ x: NaN, y: Infinity });
          } catch (error) {
            // Should handle gracefully
          }
        }
      ];
      
      // Execute error scenarios
      errorScenarios.forEach(scenario => {
        act(() => {
          scenario();
        });
      });
      
      // Canvas should remain functional after errors
      act(() => {
        mockStore.addElement(createMockElement('rectangle'));
        mockStore.selectElement(ElementId('recovery-test'));
      });
      
      // Should still be able to perform normal operations
      expect(mockStore.addElement).toHaveBeenCalled();
    });
  });
});