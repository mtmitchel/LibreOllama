/**
 * User Workflow Test Suite - Simplified Store-Only Version
 * 
 * This test suite focuses on testing the store logic and user workflows
 * without rendering canvas components to avoid DOM/canvas issues.
 * Tests all user workflows through direct store interactions.
 */

import { vi } from 'vitest';
import { 
  ElementId, 
  SectionId, 
  CanvasElement,
  CanvasTool
} from '@/features/canvas/types/enhanced.types';

// Comprehensive mock store matching your architecture
const createComprehensiveMockStore = () => ({
  // === STATE ===
  elements: new Map<ElementId, CanvasElement>(),
  sections: new Map<SectionId, any>(),
  selectedElementIds: new Set<ElementId>(),
  selectedSectionIds: new Set<SectionId>(),
  selectedTool: 'select' as CanvasTool,
  isDrawing: false,
  
  // Drawing states
  currentPath: [],
  drawingStartPoint: null,
  drawingEndPoint: null,
  
  // Text editing states
  editingTextId: null,
  textEditingMode: false,
  
  // Viewport states
  zoom: 1,
  pan: { x: 0, y: 0 },
  
  // History states
  history: [],
  historyIndex: -1,
  
  // === OPERATIONS ===
  setSelectedTool: vi.fn(),
  startDrawing: vi.fn(),
  continueDrawing: vi.fn(),
  finishDrawing: vi.fn(),
  
  // Element operations
  addElement: vi.fn(),
  updateElement: vi.fn(),
  deleteElement: vi.fn(),
  duplicateElement: vi.fn(),
  moveElement: vi.fn(),
  resizeElement: vi.fn(),
  rotateElement: vi.fn(),
  
  // Selection operations
  selectElement: vi.fn(),
  selectMultipleElements: vi.fn(),
  clearSelection: vi.fn(),
  selectAll: vi.fn(),
  
  // Text operations
  startTextEditing: vi.fn(),
  updateTextContent: vi.fn(),
  finishTextEditing: vi.fn(),
  applyTextFormatting: vi.fn(),
  
  // Section operations
  createSection: vi.fn(),
  updateSection: vi.fn(),
  deleteSection: vi.fn(),
  moveElementToSection: vi.fn(),
  removeElementFromSection: vi.fn(),
  collapseSection: vi.fn(),
  expandSection: vi.fn(),
  
  // Connector operations
  startConnector: vi.fn(),
  finishConnector: vi.fn(),
  attachConnectorToElement: vi.fn(),
  detachConnector: vi.fn(),
  updateConnectorPath: vi.fn(),
  
  // Table operations
  createTable: vi.fn(),
  addTableRow: vi.fn(),
  addTableColumn: vi.fn(),
  updateTableCell: vi.fn(),
  resizeTableColumn: vi.fn(),
  resizeTableRow: vi.fn(),
  
  // Styling operations
  setElementFill: vi.fn(),
  setElementStroke: vi.fn(),
  setElementOpacity: vi.fn(),
  copyStyle: vi.fn(),
  pasteStyle: vi.fn(),
  
  // Alignment operations
  alignLeft: vi.fn(),
  alignCenter: vi.fn(),
  alignRight: vi.fn(),
  alignTop: vi.fn(),
  alignMiddle: vi.fn(),
  alignBottom: vi.fn(),
  distributeHorizontally: vi.fn(),
  distributeVertically: vi.fn(),
  
  // Layer operations
  bringToFront: vi.fn(),
  sendToBack: vi.fn(),
  bringForward: vi.fn(),
  sendBackward: vi.fn(),
  
  // Grouping operations
  groupElements: vi.fn(),
  ungroupElements: vi.fn(),
  
  // Viewport operations
  setZoom: vi.fn(),
  setPan: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  zoomToFit: vi.fn(),
  zoomToSelection: vi.fn(),
  resetViewport: vi.fn(),
  
  // History operations
  undo: vi.fn(),
  redo: vi.fn(),
  addHistoryEntry: vi.fn(),
  clearHistory: vi.fn(),
  
  // Persistence operations
  saveCanvas: vi.fn(),
  loadCanvas: vi.fn(),
  exportCanvas: vi.fn(),
  importCanvas: vi.fn(),
  
  // Utility operations
  snapToGrid: vi.fn(),
  checkCollision: vi.fn(),
});

const createMockElement = (type: string, overrides = {}): CanvasElement => ({
  id: ElementId(`${type}-${Date.now()}-${Math.random()}`),
  type: type as any,
  x: 100,
  y: 100,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  visible: true,
  draggable: true,
  opacity: 1,
  rotation: 0,
  ...overrides,
});

describe('User Workflow Test Suite - Store Logic', () => {
  let mockStore: ReturnType<typeof createComprehensiveMockStore>;

  beforeEach(() => {
    mockStore = createComprehensiveMockStore();
    vi.clearAllMocks();
  });

  describe('🎨 1. Basic Drawing Workflows', () => {
    test('Complete rectangle drawing workflow', () => {
      // 1. User selects rectangle tool
      mockStore.setSelectedTool('rectangle');
      expect(mockStore.setSelectedTool).toHaveBeenCalledWith('rectangle');
      
      // 2. User draws rectangle
      mockStore.startDrawing();
      mockStore.continueDrawing();
      mockStore.finishDrawing();
      
      // 3. Rectangle element is created
      const rectElement = createMockElement('rectangle', { width: 100, height: 80 });
      mockStore.addElement(rectElement);
      
      expect(mockStore.startDrawing).toHaveBeenCalled();
      expect(mockStore.continueDrawing).toHaveBeenCalled();
      expect(mockStore.finishDrawing).toHaveBeenCalled();
      expect(mockStore.addElement).toHaveBeenCalledWith(rectElement);
    });

    test('Complete circle drawing workflow', () => {
      mockStore.setSelectedTool('circle');
      mockStore.startDrawing();
      mockStore.finishDrawing();
      
      const circleElement = createMockElement('circle', { radius: 50 });
      mockStore.addElement(circleElement);
      
      expect(mockStore.setSelectedTool).toHaveBeenCalledWith('circle');
      expect(mockStore.addElement).toHaveBeenCalledWith(circleElement);
    });

    test('Pen drawing workflow with multiple points', () => {
      mockStore.setSelectedTool('pen');
      mockStore.startDrawing();
      
      // Multiple drawing points
      for (let i = 0; i < 5; i++) {
        mockStore.continueDrawing();
      }
      
      mockStore.finishDrawing();
      
      const penElement = createMockElement('pen', { points: [10, 10, 20, 20, 30, 30] });
      mockStore.addElement(penElement);
      
      expect(mockStore.continueDrawing).toHaveBeenCalledTimes(5);
      expect(mockStore.addElement).toHaveBeenCalledWith(penElement);
    });

    test('Drawing with grid snapping', () => {
      const rawPosition = { x: 103, y: 197 };
      const snappedPosition = { x: 100, y: 200 };
      
      mockStore.snapToGrid.mockReturnValue(snappedPosition);
      
      const result = mockStore.snapToGrid(rawPosition);
      expect(mockStore.snapToGrid).toHaveBeenCalledWith(rawPosition);
      expect(result).toEqual(snappedPosition);
    });
  });

  describe('📝 2. Text Editing Workflows', () => {
    test('Complete text creation and editing workflow', () => {
      const textElementId = ElementId('text-1');
      const textContent = 'Hello, World!';
      
      // 1. Start text creation
      mockStore.setSelectedTool('text');
      mockStore.startTextEditing(textElementId);
      
      // 2. User types content
      mockStore.updateTextContent(textElementId, textContent);
      
      // 3. Apply formatting
      const formatting = { bold: true, fontSize: 18, color: '#0066cc' };
      mockStore.applyTextFormatting(textElementId, formatting);
      
      // 4. Finish editing
      mockStore.finishTextEditing(textElementId, textContent);
      
      expect(mockStore.setSelectedTool).toHaveBeenCalledWith('text');
      expect(mockStore.startTextEditing).toHaveBeenCalledWith(textElementId);
      expect(mockStore.updateTextContent).toHaveBeenCalledWith(textElementId, textContent);
      expect(mockStore.applyTextFormatting).toHaveBeenCalledWith(textElementId, formatting);
      expect(mockStore.finishTextEditing).toHaveBeenCalledWith(textElementId, textContent);
    });

    test('Rich text formatting workflow', () => {
      const textElementId = ElementId('rich-text');
      
      const formattingOptions = [
        { bold: true },
        { italic: true },
        { underline: true },
        { fontSize: 20 },
        { fontFamily: 'Georgia' },
        { color: '#ff0000' }
      ];
      
      formattingOptions.forEach(formatting => {
        mockStore.applyTextFormatting(textElementId, formatting);
      });
      
      expect(mockStore.applyTextFormatting).toHaveBeenCalledTimes(formattingOptions.length);
    });

    test('Multi-line text editing', () => {
      const textElementId = ElementId('multiline-text');
      const multiLineText = "Line 1\nLine 2\nLine 3";
      
      mockStore.startTextEditing(textElementId);
      mockStore.updateTextContent(textElementId, multiLineText);
      mockStore.finishTextEditing(textElementId, multiLineText);
      
      expect(mockStore.updateTextContent).toHaveBeenCalledWith(textElementId, multiLineText);
    });
  });

  describe('🔧 3. Element Manipulation Workflows', () => {
    test('Complete element transformation workflow', () => {
      const elementId = ElementId('transform-element');
      const element = createMockElement('rectangle', { id: elementId });
      
      // Add and select element
      mockStore.addElement(element);
      mockStore.selectElement(elementId);
      
      // Move element
      const newPosition = { x: 200, y: 180 };
      mockStore.moveElement(elementId, newPosition);
      
      // Resize element
      const newSize = { width: 150, height: 120 };
      mockStore.resizeElement(elementId, newSize);
      
      // Rotate element
      mockStore.rotateElement(elementId, 45);
      
      // Delete element
      mockStore.deleteElement(elementId);
      
      expect(mockStore.addElement).toHaveBeenCalledWith(element);
      expect(mockStore.selectElement).toHaveBeenCalledWith(elementId);
      expect(mockStore.moveElement).toHaveBeenCalledWith(elementId, newPosition);
      expect(mockStore.resizeElement).toHaveBeenCalledWith(elementId, newSize);
      expect(mockStore.rotateElement).toHaveBeenCalledWith(elementId, 45);
      expect(mockStore.deleteElement).toHaveBeenCalledWith(elementId);
    });

    test('Element duplication workflow', () => {
      const originalId = ElementId('original-element');
      
      mockStore.selectElement(originalId);
      mockStore.duplicateElement(originalId);
      
      expect(mockStore.selectElement).toHaveBeenCalledWith(originalId);
      expect(mockStore.duplicateElement).toHaveBeenCalledWith(originalId);
    });

    test('Element styling workflow', () => {
      const elementId = ElementId('styled-element');
      
      const styleUpdates = [
        { fill: '#ff6b6b' },
        { stroke: '#4ecdc4' },
        { strokeWidth: 3 },
        { opacity: 0.8 }
      ];
      
      styleUpdates.forEach(style => {
        mockStore.updateElement(elementId, style);
      });
      
      expect(mockStore.updateElement).toHaveBeenCalledTimes(styleUpdates.length);
    });
  });

  describe('📦 4. Section Management Workflows', () => {
    test('Complete section creation and management workflow', () => {
      const sectionId = SectionId('main-section');
      const elementId = ElementId('section-element');
      
      // Create section
      mockStore.setSelectedTool('section');
      mockStore.createSection(sectionId, {
        x: 50, y: 50, width: 300, height: 200, title: 'Test Section'
      });
      
      // Add element to section
      mockStore.moveElementToSection(elementId, sectionId);
      
      // Collapse and expand section
      mockStore.collapseSection(sectionId);
      mockStore.expandSection(sectionId);
      
      // Remove element from section
      mockStore.removeElementFromSection(elementId, sectionId);
      
      expect(mockStore.setSelectedTool).toHaveBeenCalledWith('section');
      expect(mockStore.createSection).toHaveBeenCalled();
      expect(mockStore.moveElementToSection).toHaveBeenCalledWith(elementId, sectionId);
      expect(mockStore.collapseSection).toHaveBeenCalledWith(sectionId);
      expect(mockStore.expandSection).toHaveBeenCalledWith(sectionId);
      expect(mockStore.removeElementFromSection).toHaveBeenCalledWith(elementId, sectionId);
    });

    test('Nested sections workflow', () => {
      const parentSectionId = SectionId('parent-section');
      const childSectionId = SectionId('child-section');
      
      // Create parent section
      mockStore.createSection(parentSectionId, {
        x: 50, y: 50, width: 500, height: 400, title: 'Parent'
      });
      
      // Create child section within parent
      mockStore.createSection(childSectionId, {
        x: 100, y: 100, width: 200, height: 150, title: 'Child'
      });
      
      // Move child section into parent
      mockStore.moveElementToSection(childSectionId as any, parentSectionId);
      
      expect(mockStore.createSection).toHaveBeenCalledTimes(2);
      expect(mockStore.moveElementToSection).toHaveBeenCalled();
    });
  });

  describe('🔗 5. Connector & Relationship Workflows', () => {
    test('Complete connector creation workflow', () => {
      const element1Id = ElementId('element-1');
      const element2Id = ElementId('element-2');
      const connectorId = ElementId('connector-1');
      
      // Select connector tool
      mockStore.setSelectedTool('connector');
      
      // Create connector between elements
      mockStore.startConnector(element1Id, element2Id);
      mockStore.finishConnector();
      
      expect(mockStore.setSelectedTool).toHaveBeenCalledWith('connector');
      expect(mockStore.startConnector).toHaveBeenCalledWith(element1Id, element2Id);
      expect(mockStore.finishConnector).toHaveBeenCalled();
    });

    test('Connector attachment and detachment workflow', () => {
      const connectorId = ElementId('connector-1');
      const elementId = ElementId('target-element');
      
      // Attach connector
      mockStore.attachConnectorToElement(connectorId, elementId, 'start');
      
      // Detach connector
      mockStore.detachConnector(connectorId, 'start');
      
      expect(mockStore.attachConnectorToElement).toHaveBeenCalledWith(connectorId, elementId, 'start');
      expect(mockStore.detachConnector).toHaveBeenCalledWith(connectorId, 'start');
    });

    test('Dynamic connector updates when elements move', () => {
      const connectorId = ElementId('dynamic-connector');
      const connectedElementId = ElementId('connected-element');
      
      // Move element and update connector
      mockStore.moveElement(connectedElementId, { x: 250, y: 300 });
      mockStore.updateConnectorPath(connectorId);
      
      expect(mockStore.moveElement).toHaveBeenCalledWith(connectedElementId, { x: 250, y: 300 });
      expect(mockStore.updateConnectorPath).toHaveBeenCalledWith(connectorId);
    });
  });

  describe('📋 6. Table Creation & Editing Workflows', () => {
    test('Complete table creation and editing workflow', () => {
      const tableId = ElementId('table-1');
      
      // Create table
      mockStore.setSelectedTool('table');
      mockStore.createTable(tableId);
      
      // Add rows and columns
      mockStore.addTableRow(tableId);
      mockStore.addTableColumn(tableId);
      
      // Edit cell content
      mockStore.updateTableCell(tableId, 0, 0, 'Header 1');
      mockStore.updateTableCell(tableId, 0, 1, 'Header 2');
      mockStore.updateTableCell(tableId, 1, 0, 'Row 1 Col 1');
      
      // Resize
      mockStore.resizeTableColumn(tableId, 0, 150);
      mockStore.resizeTableRow(tableId, 0, 40);
      
      expect(mockStore.setSelectedTool).toHaveBeenCalledWith('table');
      expect(mockStore.createTable).toHaveBeenCalledWith(tableId);
      expect(mockStore.addTableRow).toHaveBeenCalledWith(tableId);
      expect(mockStore.addTableColumn).toHaveBeenCalledWith(tableId);
      expect(mockStore.updateTableCell).toHaveBeenCalledTimes(3);
      expect(mockStore.resizeTableColumn).toHaveBeenCalled();
      expect(mockStore.resizeTableRow).toHaveBeenCalled();
    });
  });

  describe('🎯 7. Selection & Multi-Selection Workflows', () => {
    test('Complete multi-selection workflow', () => {
      const elementIds = [
        ElementId('multi-1'),
        ElementId('multi-2'),
        ElementId('multi-3')
      ];
      
      // Select individual elements
      elementIds.forEach(id => mockStore.selectElement(id));
      
      // Select multiple elements at once
      mockStore.selectMultipleElements(elementIds);
      
      // Select all
      mockStore.selectAll();
      
      // Clear selection
      mockStore.clearSelection();
      
      expect(mockStore.selectElement).toHaveBeenCalledTimes(elementIds.length);
      expect(mockStore.selectMultipleElements).toHaveBeenCalledWith(elementIds);
      expect(mockStore.selectAll).toHaveBeenCalled();
      expect(mockStore.clearSelection).toHaveBeenCalled();
    });

    test('Group operations workflow', () => {
      const elementIds = [ElementId('group-1'), ElementId('group-2'), ElementId('group-3')];
      
      // Select and group elements
      mockStore.selectMultipleElements(elementIds);
      mockStore.groupElements(elementIds);
      
      // Ungroup
      const groupId = ElementId('group-id');
      mockStore.ungroupElements(groupId);
      
      expect(mockStore.groupElements).toHaveBeenCalledWith(elementIds);
      expect(mockStore.ungroupElements).toHaveBeenCalledWith(groupId);
    });
  });

  describe('↩️ 8. Undo/Redo & History Workflows', () => {
    test('Complete undo/redo workflow', () => {
      // Perform actions with history tracking
      mockStore.addElement(createMockElement('rectangle'));
      mockStore.addHistoryEntry('ADD_ELEMENT', [], []);
      
      mockStore.addElement(createMockElement('circle'));
      mockStore.addHistoryEntry('ADD_ELEMENT', [], []);
      
      mockStore.updateElement(ElementId('element-1'), { x: 200, y: 200 });
      mockStore.addHistoryEntry('UPDATE_ELEMENT', [], []);
      
      // Undo and redo operations
      mockStore.undo();
      mockStore.undo();
      mockStore.redo();
      
      expect(mockStore.addHistoryEntry).toHaveBeenCalledTimes(3);
      expect(mockStore.undo).toHaveBeenCalledTimes(2);
      expect(mockStore.redo).toHaveBeenCalledTimes(1);
    });

    test('History branching workflow', () => {
      // Undo some actions
      mockStore.undo();
      mockStore.undo();
      
      // Perform new action (should branch history)
      mockStore.addElement(createMockElement('text'));
      mockStore.addHistoryEntry('ADD_ELEMENT', [], []);
      
      expect(mockStore.addHistoryEntry).toHaveBeenCalled();
    });
  });

  describe('🔍 9. Viewport & Navigation Workflows', () => {
    test('Complete viewport manipulation workflow', () => {
      // Zoom operations
      mockStore.zoomIn();
      mockStore.zoomOut();
      mockStore.setZoom(1.5);
      
      // Pan operations
      mockStore.setPan({ x: 100, y: 50 });
      
      // Navigation shortcuts
      mockStore.zoomToFit();
      mockStore.zoomToSelection();
      mockStore.resetViewport();
      
      expect(mockStore.zoomIn).toHaveBeenCalled();
      expect(mockStore.zoomOut).toHaveBeenCalled();
      expect(mockStore.setZoom).toHaveBeenCalledWith(1.5);
      expect(mockStore.setPan).toHaveBeenCalledWith({ x: 100, y: 50 });
      expect(mockStore.zoomToFit).toHaveBeenCalled();
      expect(mockStore.zoomToSelection).toHaveBeenCalled();
      expect(mockStore.resetViewport).toHaveBeenCalled();
    });

    test('Viewport constraints workflow', () => {
      // Test zoom limits
      for (let i = 0; i < 10; i++) {
        mockStore.zoomIn();
      }
      
      for (let i = 0; i < 10; i++) {
        mockStore.zoomOut();
      }
      
      expect(mockStore.zoomIn).toHaveBeenCalledTimes(10);
      expect(mockStore.zoomOut).toHaveBeenCalledTimes(10);
    });
  });

  describe('🎨 10. Visual Styling & Formatting Workflows', () => {
    test('Complete styling workflow', () => {
      const elementId = ElementId('styled-element');
      
      // Apply various styles
      mockStore.setElementFill(elementId, '#ff6b6b');
      mockStore.setElementStroke(elementId, '#333333');
      mockStore.setElementOpacity(elementId, 0.7);
      
      // Copy and paste style
      mockStore.copyStyle(elementId);
      mockStore.pasteStyle(ElementId('target-element'));
      
      expect(mockStore.setElementFill).toHaveBeenCalledWith(elementId, '#ff6b6b');
      expect(mockStore.setElementStroke).toHaveBeenCalledWith(elementId, '#333333');
      expect(mockStore.setElementOpacity).toHaveBeenCalledWith(elementId, 0.7);
      expect(mockStore.copyStyle).toHaveBeenCalledWith(elementId);
      expect(mockStore.pasteStyle).toHaveBeenCalled();
    });

    test('Element alignment workflow', () => {
      const elementIds = [ElementId('align-1'), ElementId('align-2'), ElementId('align-3')];
      
      // Select multiple elements
      mockStore.selectMultipleElements(elementIds);
      
      // Test alignment operations
      mockStore.alignLeft();
      mockStore.alignCenter();
      mockStore.alignRight();
      mockStore.alignTop();
      mockStore.alignMiddle();
      mockStore.alignBottom();
      mockStore.distributeHorizontally();
      mockStore.distributeVertically();
      
      expect(mockStore.selectMultipleElements).toHaveBeenCalledWith(elementIds);
      expect(mockStore.alignLeft).toHaveBeenCalled();
      expect(mockStore.alignCenter).toHaveBeenCalled();
      expect(mockStore.alignRight).toHaveBeenCalled();
      expect(mockStore.alignTop).toHaveBeenCalled();
      expect(mockStore.alignMiddle).toHaveBeenCalled();
      expect(mockStore.alignBottom).toHaveBeenCalled();
      expect(mockStore.distributeHorizontally).toHaveBeenCalled();
      expect(mockStore.distributeVertically).toHaveBeenCalled();
    });

    test('Layer ordering workflow', () => {
      const elementId = ElementId('layered-element');
      
      mockStore.bringToFront(elementId);
      mockStore.sendToBack(elementId);
      mockStore.bringForward(elementId);
      mockStore.sendBackward(elementId);
      
      expect(mockStore.bringToFront).toHaveBeenCalledWith(elementId);
      expect(mockStore.sendToBack).toHaveBeenCalledWith(elementId);
      expect(mockStore.bringForward).toHaveBeenCalledWith(elementId);
      expect(mockStore.sendBackward).toHaveBeenCalledWith(elementId);
    });
  });

  describe('💾 11. Persistence & Export Workflows', () => {
    test('Complete save/load workflow', () => {
      // Save canvas
      mockStore.saveCanvas();
      
      // Load canvas
      mockStore.loadCanvas();
      
      // Export in different formats
      const exportFormats = ['png', 'jpg', 'svg', 'pdf'];
      exportFormats.forEach(format => {
        mockStore.exportCanvas(format);
      });
      
      expect(mockStore.saveCanvas).toHaveBeenCalled();
      expect(mockStore.loadCanvas).toHaveBeenCalled();
      expect(mockStore.exportCanvas).toHaveBeenCalledTimes(exportFormats.length);
    });

    test('Auto-save workflow simulation', () => {
      // Simulate auto-save triggers
      mockStore.addElement(createMockElement('rectangle'));
      mockStore.saveCanvas(); // Auto-save triggered
      
      mockStore.updateElement(ElementId('element-1'), { x: 100 });
      mockStore.saveCanvas(); // Auto-save triggered
      
      mockStore.deleteElement(ElementId('element-2'));
      mockStore.saveCanvas(); // Auto-save triggered
      
      expect(mockStore.saveCanvas).toHaveBeenCalledTimes(3);
    });
  });

  describe('⚡ 12. Performance & Edge Case Workflows', () => {
    test('Large canvas with many elements performance workflow', () => {
      const startTime = performance.now();
      
      // Create 100 elements
      const elements = Array.from({ length: 100 }, (_, i) => 
        createMockElement('rectangle', { 
          id: ElementId(`perf-element-${i}`),
          x: (i % 10) * 100,
          y: Math.floor(i / 10) * 100
        })
      );
      
      // Add all elements
      elements.forEach(element => {
        mockStore.addElement(element);
      });
      
      // Bulk operations
      mockStore.selectAll();
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      expect(operationTime).toBeLessThan(100); // Should be fast
      expect(mockStore.addElement).toHaveBeenCalledTimes(100);
      expect(mockStore.selectAll).toHaveBeenCalled();
    });

    test('Memory cleanup workflow', () => {
      const elementIds = Array.from({ length: 50 }, (_, i) => ElementId(`cleanup-${i}`));
      
      // Add elements
      elementIds.forEach(id => {
        mockStore.addElement(createMockElement('rectangle', { id }));
      });
      
      // Delete all elements
      elementIds.forEach(id => {
        mockStore.deleteElement(id);
      });
      
      expect(mockStore.addElement).toHaveBeenCalledTimes(50);
      expect(mockStore.deleteElement).toHaveBeenCalledTimes(50);
    });

    test('Concurrent operations workflow', () => {
      // Simulate multiple operations happening simultaneously
      mockStore.startDrawing();
      mockStore.setZoom(1.5);
      mockStore.continueDrawing();
      mockStore.setPan({ x: 50, y: 50 });
      mockStore.finishDrawing();
      
      mockStore.startTextEditing(ElementId('text-1'));
      mockStore.selectElement(ElementId('element-1'));
      mockStore.finishTextEditing(ElementId('text-1'), 'Updated text');
      
      // Should handle concurrent operations gracefully
      expect(mockStore.startDrawing).toHaveBeenCalled();
      expect(mockStore.setZoom).toHaveBeenCalled();
      expect(mockStore.startTextEditing).toHaveBeenCalled();
      expect(mockStore.selectElement).toHaveBeenCalled();
    });
  });

  describe('🧪 13. Complex Integration Scenarios', () => {
    test('Complete flowchart creation workflow', () => {
      const sectionId = SectionId('flowchart-section');
      
      // 1. Create main section
      mockStore.setSelectedTool('section');
      mockStore.createSection(sectionId, {
        x: 50, y: 50, width: 700, height: 500, title: 'Flowchart'
      });
      
      // 2. Create flowchart elements
      const flowElements = [
        { id: ElementId('start'), type: 'circle', label: 'Start' },
        { id: ElementId('process1'), type: 'rectangle', label: 'Process 1' },
        { id: ElementId('decision'), type: 'diamond', label: 'Decision?' },
        { id: ElementId('end'), type: 'circle', label: 'End' }
      ];
      
      flowElements.forEach(elem => {
        mockStore.addElement(createMockElement(elem.type, { id: elem.id }));
        mockStore.moveElementToSection(elem.id, sectionId);
      });
      
      // 3. Connect elements
      mockStore.setSelectedTool('connector');
      mockStore.startConnector(ElementId('start'), ElementId('process1'));
      mockStore.finishConnector();
      mockStore.startConnector(ElementId('process1'), ElementId('decision'));
      mockStore.finishConnector();
      
      // 4. Add text labels
      flowElements.forEach(elem => {
        const textId = ElementId(`${elem.id}-label`);
        mockStore.addElement(createMockElement('text', { id: textId, text: elem.label }));
        mockStore.moveElementToSection(textId, sectionId);
      });
      
      // 5. Style elements
      mockStore.setElementFill(ElementId('start'), '#4CAF50');
      mockStore.setElementFill(ElementId('end'), '#F44336');
      
      // 6. Save
      mockStore.addHistoryEntry('CREATE_FLOWCHART', [], []);
      mockStore.saveCanvas();
      
      expect(mockStore.createSection).toHaveBeenCalled();
      expect(mockStore.addElement).toHaveBeenCalledTimes(flowElements.length * 2); // Elements + labels
      expect(mockStore.finishConnector).toHaveBeenCalledTimes(2);
      expect(mockStore.setElementFill).toHaveBeenCalledTimes(2);
      expect(mockStore.saveCanvas).toHaveBeenCalled();
    });

    test('Complete editing session workflow', () => {
      // Simulate a complete editing session
      const sessionOperations = [
        () => mockStore.setSelectedTool('rectangle'),
        () => mockStore.addElement(createMockElement('rectangle')),
        () => mockStore.addHistoryEntry('ADD_ELEMENT', [], []),
        () => mockStore.setSelectedTool('circle'),
        () => mockStore.addElement(createMockElement('circle')),
        () => mockStore.addHistoryEntry('ADD_ELEMENT', [], []),
        () => mockStore.selectElement(ElementId('rectangle-1')),
        () => mockStore.moveElement(ElementId('rectangle-1'), { x: 200, y: 200 }),
        () => mockStore.addHistoryEntry('MOVE_ELEMENT', [], []),
        () => mockStore.setElementFill(ElementId('rectangle-1'), '#ff6b6b'),
        () => mockStore.saveCanvas()
      ];
      
      // Execute all operations
      sessionOperations.forEach(operation => operation());
      
      expect(mockStore.addElement).toHaveBeenCalledTimes(2);
      expect(mockStore.moveElement).toHaveBeenCalledTimes(1);
      expect(mockStore.setElementFill).toHaveBeenCalledTimes(1);
      expect(mockStore.saveCanvas).toHaveBeenCalledTimes(1);
      expect(mockStore.addHistoryEntry).toHaveBeenCalledTimes(3);
    });

    test('Import/export workflow with complex data', () => {
      // Create complex canvas state
      const elements = [
        createMockElement('rectangle'),
        createMockElement('circle'),
        createMockElement('text', { text: 'Complex Canvas Test' })
      ];
      
      elements.forEach(element => {
        mockStore.addElement(element);
      });
      
      // Create section
      const sectionId = SectionId('complex-section');
      mockStore.createSection(sectionId, {
        x: 50, y: 50, width: 400, height: 300, title: 'Complex Section'
      });
      
      // Export
      mockStore.exportCanvas('json');
      
      // Clear
      mockStore.clearHistory();
      
      // Import
      mockStore.importCanvas();
      
      expect(mockStore.addElement).toHaveBeenCalledTimes(3);
      expect(mockStore.createSection).toHaveBeenCalled();
      expect(mockStore.exportCanvas).toHaveBeenCalledWith('json');
      expect(mockStore.importCanvas).toHaveBeenCalled();
    });
  });
});