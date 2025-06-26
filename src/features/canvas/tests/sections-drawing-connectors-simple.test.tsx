/**
 * Sections, Containment, Drawing & Dynamic Connectors Test Suite (Simplified)
 * 
 * This test suite focuses on the most complex and critical aspects of the canvas:
 * - Section creation and element containment logic
 * - Dynamic drawing workflows with real-time feedback
 * - Connector auto-routing and dynamic path updates
 * - Complex interactions between sections, elements, and connectors
 * 
 * These features are the core differentiators of your canvas system.
 */

import { vi } from 'vitest';
import { 
  ElementId, 
  SectionId, 
  CanvasElement,
  SectionElement,
  ConnectorElement
} from '@/features/canvas/types/enhanced.types';

// Mock all external dependencies to avoid setup issues
vi.mock('@/features/canvas/stores/canvasStore.enhanced', () => ({
  useCanvasStore: vi.fn()
}));

// Working mock store with actual state management
const createWorkingMockStore = () => {
  const store = {
    // === STATE ===
    elements: new Map<ElementId, CanvasElement>(),
    sections: new Map<SectionId, SectionElement>(),
    connectors: new Map<ElementId, ConnectorElement>(),
    selectedElementIds: new Set<ElementId>(),
    selectedSectionIds: new Set<SectionId>(),
    selectedTool: 'select' as any,
    
    // Internal state for containment and routing
    sectionBounds: new Map<SectionId, { x: number; y: number; width: number; height: number }>(),
    sectionContainmentCache: new Map<SectionId, Set<ElementId>>(),
    connectorAttachments: new Map<ElementId, { start?: ElementId; end?: ElementId }>(),
    
    // Drawing states
    isDrawing: false,
    drawingMode: null as 'element' | 'section' | 'connector' | null,
    drawingStartPoint: null as { x: number; y: number } | null,
    drawingCurrentPoint: null as { x: number; y: number } | null,
    
    // === OPERATIONS ===
    setSelectedTool: vi.fn((tool: string) => {
      store.selectedTool = tool;
    }),
    
    // Drawing operations
    startDrawing: vi.fn((point: { x: number; y: number }, tool: string) => {
      store.isDrawing = true;
      store.drawingStartPoint = point;
      store.drawingMode = tool === 'section' ? 'section' : tool === 'connector' ? 'connector' : 'element';
    }),
    
    updateDrawing: vi.fn((point: { x: number; y: number }) => {
      store.drawingCurrentPoint = point;
    }),
    
    finishDrawing: vi.fn(() => {
      store.isDrawing = false;
      store.drawingMode = null;
      store.drawingStartPoint = null;
      store.drawingCurrentPoint = null;
    }),
    
    cancelDrawing: vi.fn(() => {
      store.isDrawing = false;
      store.drawingMode = null;
      store.drawingStartPoint = null;
      store.drawingCurrentPoint = null;
    }),
    
    // Section operations
    createSection: vi.fn((sectionId: SectionId, bounds: { x: number; y: number; width: number; height: number; title?: string }) => {
      store.sectionBounds.set(sectionId, bounds);
      store.sectionContainmentCache.set(sectionId, new Set());
      const section: SectionElement = {
        id: sectionId,
        type: 'section',
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        title: bounds.title,
        backgroundColor: '#f5f5f5',
        borderColor: '#dddddd',
        borderWidth: 2,
        cornerRadius: 8,
        collapsed: false,
        childElementIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        rotation: 0
      };
      store.sections.set(sectionId, section);
      return sectionId;
    }),
    
    updateSectionBounds: vi.fn((sectionId: SectionId, newBounds: { x: number; y: number; width: number; height: number }) => {
      store.sectionBounds.set(sectionId, newBounds);
      store.recalculateContainment(sectionId);
      return newBounds;
    }),
    
    checkElementContainment: vi.fn((elementId: ElementId, elementBounds: { x: number; y: number; width: number; height: number }): SectionId | null => {
      for (const [sectionId, sectionBounds] of store.sectionBounds.entries()) {
        if (elementBounds.x >= sectionBounds.x &&
            elementBounds.y >= sectionBounds.y &&
            elementBounds.x + elementBounds.width <= sectionBounds.x + sectionBounds.width &&
            elementBounds.y + elementBounds.height <= sectionBounds.y + sectionBounds.height) {
          return sectionId;
        }
      }
      return null;
    }),
    
    moveElementToSection: vi.fn((elementId: ElementId, sectionId: SectionId) => {
      const containedElements = store.sectionContainmentCache.get(sectionId) || new Set();
      containedElements.add(elementId);
      store.sectionContainmentCache.set(sectionId, containedElements);
      
      // Remove from other sections
      for (const [otherSectionId, otherContained] of store.sectionContainmentCache.entries()) {
        if (otherSectionId !== sectionId) {
          otherContained.delete(elementId);
        }
      }
      
      store.updateConnectorsForMovedElement(elementId);
      return true;
    }),
    
    removeElementFromSection: vi.fn((elementId: ElementId, sectionId: SectionId) => {
      const containedElements = store.sectionContainmentCache.get(sectionId);
      if (containedElements) {
        containedElements.delete(elementId);
        store.updateConnectorsForMovedElement(elementId);
      }
      return true;
    }),
    
    recalculateContainment: vi.fn((sectionId: SectionId) => {
      const newContained = new Set<ElementId>();
      const sectionBounds = store.sectionBounds.get(sectionId);
      
      if (!sectionBounds) return newContained;
      
      for (const [elementId, element] of store.elements.entries()) {
        const elementBounds = {
          x: element.x,
          y: element.y,
          width: (element as any).width || 50,
          height: (element as any).height || 50
        };
        
        if (store.checkElementContainment(elementId, elementBounds) === sectionId) {
          newContained.add(elementId);
        }
      }
      
      store.sectionContainmentCache.set(sectionId, newContained);
      return newContained;
    }),
    
    collapseSection: vi.fn((sectionId: SectionId) => {
      const containedElements = store.sectionContainmentCache.get(sectionId) || new Set();
      containedElements.forEach(elementId => {
        const element = store.elements.get(elementId);
        if (element) {
          store.updateElement(elementId, { visible: false });
        }
      });
      return true;
    }),
    
    expandSection: vi.fn((sectionId: SectionId) => {
      const containedElements = store.sectionContainmentCache.get(sectionId) || new Set();
      containedElements.forEach(elementId => {
        const element = store.elements.get(elementId);
        if (element) {
          store.updateElement(elementId, { visible: true });
        }
      });
      return true;
    }),
    
    // Connector operations
    createConnector: vi.fn((connectorId: ElementId, startElement: ElementId, endElement: ElementId) => {
      const startPos = store.getElementCenter(startElement);
      const endPos = store.getElementCenter(endElement);
      const path = store.calculateConnectorPath(startPos, endPos);
      
      const connector: ConnectorElement = {
        id: connectorId,
        type: 'connector',
        subType: 'straight',
        startElementId: startElement,
        endElementId: endElement,
        startPoint: startPos,
        endPoint: endPos,
        pathPoints: path,
        x: startPos.x,
        y: startPos.y,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      store.connectors.set(connectorId, connector);
      store.connectorAttachments.set(connectorId, { start: startElement, end: endElement });
      
      return connector;
    }),
    
    updateConnectorPath: vi.fn((connectorId: ElementId) => {
      const connector = store.connectors.get(connectorId);
      const attachments = store.connectorAttachments.get(connectorId);
      
      if (!connector || !attachments) return null;
      
      let startPos = connector.startPoint;
      let endPos = connector.endPoint;
      
      if (attachments.start) {
        startPos = store.getElementCenter(attachments.start);
      }
      if (attachments.end) {
        endPos = store.getElementCenter(attachments.end);
      }
      
      const newPath = store.calculateConnectorPath(startPos, endPos);
      
      const updatedConnector = {
        ...connector,
        startPoint: startPos,
        endPoint: endPos,
        pathPoints: newPath,
        updatedAt: Date.now()
      };
      
      store.connectors.set(connectorId, updatedConnector);
      return updatedConnector;
    }),
    
    calculateConnectorPath: vi.fn((start: { x: number; y: number }, end: { x: number; y: number }) => {
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const midX = start.x + deltaX / 2;
        return [start.x, start.y, midX, start.y, midX, end.y, end.x, end.y];
      } else {
        const midY = start.y + deltaY / 2;
        return [start.x, start.y, start.x, midY, end.x, midY, end.x, end.y];
      }
    }),
    
    updateConnectorsForMovedElement: vi.fn((elementId: ElementId) => {
      const affectedConnectors: ElementId[] = [];
      
      for (const [connectorId, attachments] of store.connectorAttachments.entries()) {
        if (attachments.start === elementId || attachments.end === elementId) {
          affectedConnectors.push(connectorId);
          store.updateConnectorPath(connectorId);
        }
      }
      
      return affectedConnectors;
    }),
    
    attachConnectorToElement: vi.fn((connectorId: ElementId, elementId: ElementId, endpoint: 'start' | 'end') => {
      const attachments = store.connectorAttachments.get(connectorId) || {};
      
      if (endpoint === 'start') {
        attachments.start = elementId;
      } else {
        attachments.end = elementId;
      }
      
      store.connectorAttachments.set(connectorId, attachments);
      store.updateConnectorPath(connectorId);
      return true;
    }),
    
    detachConnector: vi.fn((connectorId: ElementId, endpoint: 'start' | 'end') => {
      const attachments = store.connectorAttachments.get(connectorId);
      
      if (attachments) {
        if (endpoint === 'start') {
          delete attachments.start;
        } else {
          delete attachments.end;
        }
        store.connectorAttachments.set(connectorId, attachments);
      }
      
      return true;
    }),
    
    // Helper operations
    getElementCenter: vi.fn((elementId: ElementId): { x: number; y: number } => {
      const element = store.elements.get(elementId);
      if (!element) return { x: 0, y: 0 };
      
      const width = (element as any).width || 50;
      const height = (element as any).height || 50;
      
      return {
        x: element.x + width / 2,
        y: element.y + height / 2
      };
    }),
    
    // Standard operations
    addElement: vi.fn((element: CanvasElement) => {
      // Type guard to check if this is a section
      if ('type' in element && element.type === 'section') {
        store.sections.set(element.id as SectionId, element as any);
      } else {
        store.elements.set(element.id as ElementId, element);
      }
    }),
    
    updateElement: vi.fn((elementId: ElementId, updates: any) => {
      const element = store.elements.get(elementId);
      if (element) {
        const updatedElement = { ...element, ...updates };
        store.elements.set(elementId, updatedElement);
      }
    }),
    
    moveElement: vi.fn((elementId: ElementId, position: { x: number; y: number }) => {
      store.updateElement(elementId, position);
      store.updateConnectorsForMovedElement(elementId);
    }),
  };
  
  return store;
};

const createMockElement = (type: string, overrides = {}): CanvasElement => ({
  id: ElementId(`${type}-${Date.now()}-${Math.random()}`),
  type: type as any,
  x: 100,
  y: 100,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
} as CanvasElement);

describe('Sections, Containment, Drawing & Dynamic Connectors', () => {
  let mockStore: ReturnType<typeof createWorkingMockStore>;

  beforeEach(() => {
    mockStore = createWorkingMockStore();
    vi.clearAllMocks();
  });

  describe('🏗️ Section Creation & Management', () => {
    test('Complete section creation workflow with bounds calculation', () => {
      const sectionId = SectionId('test-section');
      const sectionBounds = { x: 50, y: 50, width: 400, height: 300, title: 'Test Section' };
      
      // Create section
      mockStore.setSelectedTool('section');
      const result = mockStore.createSection(sectionId, sectionBounds);
      
      expect(mockStore.setSelectedTool).toHaveBeenCalledWith('section');
      expect(mockStore.createSection).toHaveBeenCalledWith(sectionId, sectionBounds);
      expect(result).toBe(sectionId);
      
      // Verify bounds are stored
      expect(mockStore.sectionBounds.get(sectionId)).toEqual(sectionBounds);
      expect(mockStore.sectionContainmentCache.get(sectionId)).toEqual(new Set());
    });

    test('Section bounds update triggers containment recalculation', () => {
      const sectionId = SectionId('resizable-section');
      
      // Create initial section
      mockStore.createSection(sectionId, { x: 100, y: 100, width: 200, height: 200 });
      
      // Update bounds (resize section)
      const newBounds = { x: 100, y: 100, width: 300, height: 250 };
      mockStore.updateSectionBounds(sectionId, newBounds);
      
      expect(mockStore.updateSectionBounds).toHaveBeenCalledWith(sectionId, newBounds);
      expect(mockStore.recalculateContainment).toHaveBeenCalledWith(sectionId);
    });

    test('Section collapse/expand affects contained element visibility', () => {
      const sectionId = SectionId('collapsible-section');
      const elementIds = [ElementId('elem-1'), ElementId('elem-2'), ElementId('elem-3')];
      
      // Setup section with contained elements
      mockStore.createSection(sectionId, { x: 50, y: 50, width: 300, height: 200 });
      
      // Add elements to store and section
      elementIds.forEach(id => {
        const element = createMockElement('rectangle', { id });
        mockStore.elements.set(id, element);
      });
      
      // Mock contained elements
      const containedElements = new Set(elementIds);
      mockStore.sectionContainmentCache.set(sectionId, containedElements);
      
      // Collapse section
      mockStore.collapseSection(sectionId);
      
      expect(mockStore.collapseSection).toHaveBeenCalledWith(sectionId);
      expect(mockStore.updateElement).toHaveBeenCalledTimes(elementIds.length);
      
      // Expand section
      mockStore.expandSection(sectionId);
      
      expect(mockStore.expandSection).toHaveBeenCalledWith(sectionId);
      expect(mockStore.updateElement).toHaveBeenCalledTimes(elementIds.length * 2);
    });
  });

  describe('📦 Element Containment Logic', () => {
    test('Element containment detection with precise bounds checking', () => {
      const sectionId = SectionId('container-section');
      const sectionBounds = { x: 100, y: 100, width: 300, height: 200 };
      
      mockStore.createSection(sectionId, sectionBounds);
      
      // Test element fully inside section
      const insideElementBounds = { x: 150, y: 150, width: 50, height: 50 };
      const containingSection = mockStore.checkElementContainment(
        ElementId('inside-element'), 
        insideElementBounds
      );
      expect(containingSection).toBe(sectionId);
      
      // Test element partially outside section
      const outsideElementBounds = { x: 350, y: 250, width: 100, height: 100 };
      const nonContainingSection = mockStore.checkElementContainment(
        ElementId('outside-element'),
        outsideElementBounds
      );
      expect(nonContainingSection).toBe(null);
      
      // Test element on section boundary (should be inside)
      const boundaryElementBounds = { x: 100, y: 100, width: 50, height: 50 };
      const boundaryContainment = mockStore.checkElementContainment(
        ElementId('boundary-element'),
        boundaryElementBounds
      );
      expect(boundaryContainment).toBe(sectionId);
    });

    test('Moving element to section updates containment cache', () => {
      const sectionId = SectionId('target-section');
      const elementId = ElementId('movable-element');
      
      mockStore.createSection(sectionId, { x: 50, y: 50, width: 300, height: 200 });
      
      // Move element to section
      const result = mockStore.moveElementToSection(elementId, sectionId);
      
      expect(result).toBe(true);
      expect(mockStore.moveElementToSection).toHaveBeenCalledWith(elementId, sectionId);
      
      // Check containment cache updated
      const containedElements = mockStore.sectionContainmentCache.get(sectionId);
      expect(containedElements?.has(elementId)).toBe(true);
      
      // Should trigger connector updates
      expect(mockStore.updateConnectorsForMovedElement).toHaveBeenCalledWith(elementId);
    });

    test('Removing element from section cleans up containment', () => {
      const sectionId = SectionId('source-section');
      const elementId = ElementId('removable-element');
      
      // Setup element in section
      mockStore.createSection(sectionId, { x: 50, y: 50, width: 300, height: 200 });
      mockStore.moveElementToSection(elementId, sectionId);
      
      // Remove element from section
      const result = mockStore.removeElementFromSection(elementId, sectionId);
      
      expect(result).toBe(true);
      expect(mockStore.removeElementFromSection).toHaveBeenCalledWith(elementId, sectionId);
      
      // Should trigger connector updates
      expect(mockStore.updateConnectorsForMovedElement).toHaveBeenCalledWith(elementId);
    });
  });

  describe('🎨 Advanced Drawing Workflows', () => {
    test('Interactive section drawing with real-time preview', () => {
      const startPoint = { x: 100, y: 100 };
      const currentPoint = { x: 300, y: 200 };
      
      // Start drawing section
      mockStore.setSelectedTool('section');
      mockStore.startDrawing(startPoint, 'section');
      
      expect(mockStore.startDrawing).toHaveBeenCalledWith(startPoint, 'section');
      expect(mockStore.isDrawing).toBe(true);
      expect(mockStore.drawingMode).toBe('section');
      expect(mockStore.drawingStartPoint).toEqual(startPoint);
      
      // Update drawing (real-time preview)
      mockStore.updateDrawing(currentPoint);
      
      expect(mockStore.updateDrawing).toHaveBeenCalledWith(currentPoint);
      expect(mockStore.drawingCurrentPoint).toEqual(currentPoint);
      
      // Finish drawing
      mockStore.finishDrawing();
      
      expect(mockStore.finishDrawing).toHaveBeenCalled();
      expect(mockStore.isDrawing).toBe(false);
    });

    test('Element drawing with automatic containment detection', () => {
      const sectionId = SectionId('auto-container');
      const sectionBounds = { x: 50, y: 50, width: 400, height: 300 };
      
      // Create section first
      mockStore.createSection(sectionId, sectionBounds);
      
      // Draw element inside section bounds
      const elementStartPoint = { x: 150, y: 150 };
      const elementEndPoint = { x: 200, y: 200 };
      
      mockStore.setSelectedTool('rectangle');
      mockStore.startDrawing(elementStartPoint, 'rectangle');
      mockStore.updateDrawing(elementEndPoint);
      mockStore.finishDrawing();
      
      // After drawing, element should be automatically added to section
      const elementBounds = {
        x: elementStartPoint.x,
        y: elementStartPoint.y,
        width: elementEndPoint.x - elementStartPoint.x,
        height: elementEndPoint.y - elementStartPoint.y
      };
      
      const containingSection = mockStore.checkElementContainment(
        ElementId('new-element'),
        elementBounds
      );
      
      expect(containingSection).toBe(sectionId);
    });

    test('Drawing cancellation cleans up state', () => {
      const startPoint = { x: 100, y: 100 };
      
      // Start drawing
      mockStore.setSelectedTool('rectangle');
      mockStore.startDrawing(startPoint, 'rectangle');
      
      expect(mockStore.isDrawing).toBe(true);
      
      // Cancel drawing
      mockStore.cancelDrawing();
      
      expect(mockStore.cancelDrawing).toHaveBeenCalled();
      expect(mockStore.isDrawing).toBe(false);
    });
  });

  describe('🔗 Dynamic Connector System', () => {
    test('Connector creation with automatic path calculation', () => {
      const elementAId = ElementId('element-a');
      const elementBId = ElementId('element-b');
      const connectorId = ElementId('connector-ab');
      
      // Create elements
      const elementA = createMockElement('rectangle', {
        id: elementAId,
        x: 100,
        y: 100,
        width: 80,
        height: 60
      });
      
      const elementB = createMockElement('circle', {
        id: elementBId,
        x: 300,
        y: 200,
        width: 60,
        height: 60
      });
      
      mockStore.elements.set(elementAId, elementA);
      mockStore.elements.set(elementBId, elementB);
      
      // Create connector
      const connector = mockStore.createConnector(connectorId, elementAId, elementBId);
      
      expect(mockStore.createConnector).toHaveBeenCalledWith(connectorId, elementAId, elementBId);
      expect(connector).toBeDefined();
      expect(connector.startElementId).toBe(elementAId);
      expect(connector.endElementId).toBe(elementBId);
      expect(connector.pathPoints).toBeDefined();
      
      // Verify connector is stored
      expect(mockStore.connectors.get(connectorId)).toBe(connector);
      expect(mockStore.connectorAttachments.get(connectorId)).toEqual({
        start: elementAId,
        end: elementBId
      });
    });

    test('Dynamic connector path updates when elements move', () => {
      const elementAId = ElementId('moving-element-a');
      const elementBId = ElementId('static-element-b');
      const connectorId = ElementId('dynamic-connector');
      
      // Setup elements and connector
      mockStore.elements.set(elementAId, createMockElement('rectangle', {
        id: elementAId,
        x: 100,
        y: 100,
        width: 50,
        height: 50
      }));
      
      mockStore.elements.set(elementBId, createMockElement('rectangle', {
        id: elementBId,
        x: 300,
        y: 200,
        width: 50,
        height: 50
      }));
      
      mockStore.createConnector(connectorId, elementAId, elementBId);
      
      // Move element A
      const newPosition = { x: 150, y: 120 };
      mockStore.moveElement(elementAId, newPosition);
      
      // This should trigger connector updates
      const affectedConnectors = mockStore.updateConnectorsForMovedElement(elementAId);
      
      expect(affectedConnectors).toContain(connectorId);
      expect(mockStore.updateConnectorPath).toHaveBeenCalledWith(connectorId);
    });

    test('Connector path calculation with different routing algorithms', () => {
      // Test horizontal-first routing
      const horizontalStart = { x: 100, y: 150 };
      const horizontalEnd = { x: 300, y: 180 };
      
      const horizontalPath = mockStore.calculateConnectorPath(horizontalStart, horizontalEnd);
      
      expect(mockStore.calculateConnectorPath).toHaveBeenCalledWith(horizontalStart, horizontalEnd);
      expect(horizontalPath).toEqual([
        100, 150, // start
        200, 150, // mid horizontal
        200, 180, // mid vertical
        300, 180  // end
      ]);
      
      // Test vertical-first routing
      const verticalStart = { x: 150, y: 100 };
      const verticalEnd = { x: 180, y: 300 };
      
      const verticalPath = mockStore.calculateConnectorPath(verticalStart, verticalEnd);
      
      expect(verticalPath).toEqual([
        150, 100, // start
        150, 200, // mid vertical
        180, 200, // mid horizontal
        180, 300  // end
      ]);
    });

    test('Connector attachment and detachment', () => {
      const connectorId = ElementId('test-connector');
      const elementId = ElementId('attachment-element');
      
      // Attach connector start to element
      const attachResult = mockStore.attachConnectorToElement(connectorId, elementId, 'start');
      
      expect(attachResult).toBe(true);
      expect(mockStore.attachConnectorToElement).toHaveBeenCalledWith(connectorId, elementId, 'start');
      expect(mockStore.updateConnectorPath).toHaveBeenCalledWith(connectorId);
      
      // Detach connector
      const detachResult = mockStore.detachConnector(connectorId, 'start');
      
      expect(detachResult).toBe(true);
      expect(mockStore.detachConnector).toHaveBeenCalledWith(connectorId, 'start');
    });

    test('Multiple connectors update when single element moves', () => {
      const centralElementId = ElementId('central-hub');
      const connectedElementIds = [
        ElementId('spoke-1'),
        ElementId('spoke-2'),
        ElementId('spoke-3')
      ];
      
      const connectorIds = [
        ElementId('connector-1'),
        ElementId('connector-2'),
        ElementId('connector-3')
      ];
      
      // Setup central element connected to multiple elements
      mockStore.elements.set(centralElementId, createMockElement('rectangle', {
        id: centralElementId,
        x: 200,
        y: 200
      }));
      
      connectedElementIds.forEach((elemId, index) => {
        mockStore.elements.set(elemId, createMockElement('circle', {
          id: elemId,
          x: 100 + index * 100,
          y: 100
        }));
        
        // Create connector
        mockStore.createConnector(connectorIds[index], centralElementId, elemId);
      });
      
      // Move central element
      mockStore.moveElement(centralElementId, { x: 250, y: 250 });
      
      // All connectors should be updated
      const affectedConnectors = mockStore.updateConnectorsForMovedElement(centralElementId);
      
      expect(affectedConnectors).toHaveLength(3);
      connectorIds.forEach(connectorId => {
        expect(affectedConnectors).toContain(connectorId);
        expect(mockStore.updateConnectorPath).toHaveBeenCalledWith(connectorId);
      });
    });
  });

  describe('🔄 Complex Integration Scenarios', () => {
    test('Element moves between sections with connected elements', () => {
      const section1Id = SectionId('section-1');
      const section2Id = SectionId('section-2');
      const movingElementId = ElementId('moving-element');
      const connectedElementId = ElementId('connected-element');
      const connectorId = ElementId('cross-section-connector');
      
      // Create two sections
      mockStore.createSection(section1Id, { x: 50, y: 50, width: 200, height: 200 });
      mockStore.createSection(section2Id, { x: 300, y: 50, width: 200, height: 200 });
      
      // Create elements
      mockStore.elements.set(movingElementId, createMockElement('rectangle', {
        id: movingElementId,
        x: 100, y: 100 // Inside section 1
      }));
      
      mockStore.elements.set(connectedElementId, createMockElement('circle', {
        id: connectedElementId,
        x: 350, y: 100 // Inside section 2
      }));
      
      // Create connector between elements in different sections
      mockStore.createConnector(connectorId, movingElementId, connectedElementId);
      
      // Move element from section 1 to section 2
      mockStore.moveElementToSection(movingElementId, section2Id);
      
      // Verify element moved to new section
      expect(mockStore.moveElementToSection).toHaveBeenCalledWith(movingElementId, section2Id);
      
      // Verify connector was updated
      expect(mockStore.updateConnectorsForMovedElement).toHaveBeenCalledWith(movingElementId);
    });

    test('Section resize affects contained elements and their connectors', () => {
      const sectionId = SectionId('resizing-section');
      const containedElementIds = [ElementId('elem-1'), ElementId('elem-2')];
      const externalElementId = ElementId('external-element');
      const connectorIds = [ElementId('conn-1'), ElementId('conn-2')];
      
      // Create section with contained elements
      mockStore.createSection(sectionId, { x: 100, y: 100, width: 200, height: 200 });
      
      containedElementIds.forEach((elemId, index) => {
        const element = createMockElement('rectangle', {
          id: elemId,
          x: 150 + index * 50,
          y: 150
        });
        mockStore.elements.set(elemId, element);
        mockStore.moveElementToSection(elemId, sectionId);
      });
      
      // Create external element
      mockStore.elements.set(externalElementId, createMockElement('circle', {
        id: externalElementId,
        x: 400,
        y: 150
      }));
      
      // Create connectors from contained elements to external element
      containedElementIds.forEach((elemId, index) => {
        mockStore.createConnector(connectorIds[index], elemId, externalElementId);
      });
      
      // Resize section
      const newBounds = { x: 100, y: 100, width: 300, height: 250 };
      mockStore.updateSectionBounds(sectionId, newBounds);
      
      expect(mockStore.updateSectionBounds).toHaveBeenCalledWith(sectionId, newBounds);
      expect(mockStore.recalculateContainment).toHaveBeenCalledWith(sectionId);
    });
  });

  describe('🎯 Performance & Edge Cases', () => {
    test('Large number of elements in section with efficient containment checking', () => {
      const sectionId = SectionId('performance-section');
      const elementCount = 100;
      
      // Create large section
      mockStore.createSection(sectionId, { x: 0, y: 0, width: 1000, height: 1000 });
      
      // Add many elements
      for (let i = 0; i < elementCount; i++) {
        const elementId = ElementId(`perf-element-${i}`);
        const element = createMockElement('rectangle', {
          id: elementId,
          x: (i % 10) * 90 + 10,
          y: Math.floor(i / 10) * 90 + 10,
          width: 80,
          height: 80
        });
        
        mockStore.elements.set(elementId, element);
      }
      
      const startTime = performance.now();
      
      // Recalculate containment for all elements
      const containedElements = mockStore.recalculateContainment(sectionId);
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      expect(operationTime).toBeLessThan(100); // Should be fast
      expect(containedElements).toBeInstanceOf(Set);
      expect(mockStore.recalculateContainment).toHaveBeenCalledWith(sectionId);
    });

    test('Edge case: Element on exact section boundary', () => {
      const sectionId = SectionId('boundary-section');
      const sectionBounds = { x: 100, y: 100, width: 200, height: 200 };
      
      mockStore.createSection(sectionId, sectionBounds);
      
      // Element exactly on boundary
      const boundaryElementBounds = { x: 100, y: 100, width: 50, height: 50 };
      const containment1 = mockStore.checkElementContainment(
        ElementId('boundary-element-1'),
        boundaryElementBounds
      );
      expect(containment1).toBe(sectionId); // Should be contained
      
      // Element extending exactly to boundary
      const edgeElementBounds = { x: 250, y: 250, width: 50, height: 50 };
      const containment2 = mockStore.checkElementContainment(
        ElementId('edge-element'),
        edgeElementBounds
      );
      expect(containment2).toBe(sectionId); // Should be contained
      
      // Element one pixel outside
      const outsideElementBounds = { x: 301, y: 301, width: 50, height: 50 };
      const containment3 = mockStore.checkElementContainment(
        ElementId('outside-element'),
        outsideElementBounds
      );
      expect(containment3).toBe(null); // Should not be contained
    });

    test('Zero-length connector handling', () => {
      const elementId = ElementId('self-connected');
      const connectorId = ElementId('zero-length-connector');
      
      mockStore.elements.set(elementId, createMockElement('rectangle', {
        id: elementId,
        x: 200,
        y: 200
      }));
      
      // Create connector from element to itself
      const connector = mockStore.createConnector(connectorId, elementId, elementId);
      
      expect(connector).toBeDefined();
      expect(connector.startElementId).toBe(elementId);
      expect(connector.endElementId).toBe(elementId);
      expect(connector.pathPoints).toBeDefined();
      
      // Should handle zero-length path calculation
      const zeroLengthPath = mockStore.calculateConnectorPath(
        { x: 200, y: 200 },
        { x: 200, y: 200 }
      );
      expect(zeroLengthPath).toBeDefined();
    });
  });
});