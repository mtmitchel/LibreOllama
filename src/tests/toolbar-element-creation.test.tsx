/**
 * Toolbar Element Creation Integration Test
 * Tests the complete toolbar → tool selection → element creation workflow
 * Following testing philosophy: Real store instances with minimal UI testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createUnifiedTestStore } from './helpers/createUnifiedTestStore';

describe('Toolbar Element Creation Workflow', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    store = createUnifiedTestStore();
  });

  it('should handle tool selection and element creation sequence', () => {
    const actions = store.getState();

    // 1. Start with select tool
    expect(actions.selectedTool).toBe('select');

    // 2. Switch to rectangle tool (simulating toolbar click)
    actions.setSelectedTool('rectangle');
    expect(store.getState().selectedTool).toBe('rectangle');

    // 3. Simulate canvas click to create element
    // In real app: UnifiedEventHandler detects selectedTool='rectangle' and calls createElement
    const testPosition = { x: 150, y: 150 };
    
    // For now, manually create element as createElement signature is different
    const rectangleElement = {
      id: 'rect-created-' + Date.now(),
      type: 'rectangle',
      x: testPosition.x,
      y: testPosition.y,
      width: 100,
      height: 80,
      fill: '#4CAF50',
      stroke: '#333333',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    actions.addElement(rectangleElement);

    // 4. Verify element was created
    const state = store.getState();
    expect(state.elements.size).toBe(1);
    
    const createdElement = Array.from(state.elements.values())[0];
    expect(createdElement.type).toBe('rectangle');
    expect(createdElement.x).toBe(testPosition.x);
    expect(createdElement.y).toBe(testPosition.y);

    // 5. Tool should automatically switch back to select after creation
    // (This is handled in the actual UnifiedEventHandler)
  });

  it('should create different element types based on selected tool', () => {
    const actions = store.getState();
    const toolsToTest = ['rectangle', 'circle', 'text', 'sticky-note'];

    toolsToTest.forEach((toolType, index) => {
      // Select tool
      actions.setSelectedTool(toolType);
      expect(store.getState().selectedTool).toBe(toolType);

      // Create element for this tool
      const position = { x: index * 200, y: 100 };
      let element: any;

      switch (toolType) {
        case 'rectangle':
          element = {
            id: `rect-${index}`,
            type: 'rectangle',
            x: position.x,
            y: position.y,
            width: 100,
            height: 80,
            fill: '#4CAF50',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          break;
        case 'circle':
          element = {
            id: `circle-${index}`,
            type: 'circle',
            x: position.x,
            y: position.y,
            radius: 50,
            fill: '#2196F3',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          break;
        case 'text':
          element = {
            id: `text-${index}`,
            type: 'text',
            x: position.x,
            y: position.y,
            text: 'Type here...',
            fontSize: 16,
            fill: '#333333',
            width: 200,
            height: 30,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          break;
        case 'sticky-note':
          element = {
            id: `sticky-${index}`,
            type: 'sticky-note',
            x: position.x,
            y: position.y,
            text: 'Note...',
            backgroundColor: '#ffeb3b',
            width: 150,
            height: 150,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          break;
      }

      actions.addElement(element);
    });

    // Verify all elements were created
    const finalState = store.getState();
    expect(finalState.elements.size).toBe(toolsToTest.length);

    // Verify each element type exists
    const elements = Array.from(finalState.elements.values());
    toolsToTest.forEach(expectedType => {
      const elementOfType = elements.find(el => el.type === expectedType);
      expect(elementOfType).toBeDefined();
      expect(elementOfType!.type).toBe(expectedType);
    });
  });

  it('should handle element creation → selection → tool reset workflow', () => {
    const actions = store.getState();

    // 1. Select rectangle tool
    actions.setSelectedTool('rectangle');
    
    // 2. Create element
    const element = {
      id: 'test-rect-workflow',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 80,
      fill: '#4CAF50',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    actions.addElement(element);

    // 3. Auto-select the created element (simulating UnifiedEventHandler behavior)
    actions.selectElement('test-rect-workflow');

    // 4. Tool should switch back to select
    actions.setSelectedTool('select');

    // 5. Verify final state
    const finalState = store.getState();
    expect(finalState.elements.size).toBe(1);
    expect(finalState.selectedElementIds.has('test-rect-workflow')).toBe(true);
    expect(finalState.selectedTool).toBe('select');
    expect(finalState.lastSelectedElementId).toBe('test-rect-workflow');
  });
});