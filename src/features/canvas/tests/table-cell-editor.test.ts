import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TableCellEditor, TableCellNavigationManager } from '../renderer/table/TableCellEditor';
import type { TableCellEditorConfig, CellDimensions } from '../renderer/table/TableCellEditor';

// Create a proper container hierarchy for DOM overlay management
const createMockStageContainer = () => {
  const grandParent = document.createElement('div');
  grandParent.id = 'table-canvas-container-parent';
  
  const container = document.createElement('div');
  container.id = 'table-canvas-container';
  
  grandParent.appendChild(container);
  document.body.appendChild(grandParent);
  
  // Mock getBoundingClientRect for positioning
  container.getBoundingClientRect = vi.fn(() => ({ 
    left: 10, 
    top: 20, 
    width: 800, 
    height: 600,
    right: 810,
    bottom: 620,
    x: 10,
    y: 20
  }));
  
  // Mock contains method
  container.contains = vi.fn(() => false);
  
  return container;
};

let mockContainer: HTMLElement;

// Mock Konva objects
const createMockStage = () => ({
  getPointerPosition: vi.fn(() => ({ x: 150, y: 100 })),
  container: vi.fn(() => mockContainer)
} as any);

const createMockGroup = () => ({
  getClientRect: vi.fn(() => ({ x: 100, y: 50, width: 400, height: 200 })),
  getStage: vi.fn(() => mockStage),
  getAbsoluteTransform: vi.fn(() => ({
    copy: vi.fn(() => ({
      invert: vi.fn(() => ({
        point: vi.fn(() => ({ x: 50, y: 25 }))
      }))
    }))
  }))
} as any);

let mockStage: any;
let mockTableNode: any;

describe('Table Cell Editor System', () => {
  describe('TableCellEditor', () => {
    let cellEditor: TableCellEditor;
    let config: TableCellEditorConfig;

    beforeEach(() => {
      mockContainer = createMockStageContainer();
      mockStage = createMockStage();
      mockTableNode = createMockGroup();

      config = {
        stage: mockStage,
        updateCellCallback: vi.fn(),
        scheduleDraw: vi.fn(),
        debug: { log: true }
      };

      cellEditor = new TableCellEditor(config);
    });

    afterEach(() => {
      cellEditor.destroy();
      // Clean up DOM elements
      document.querySelectorAll('#table-canvas-container-parent').forEach(el => el.remove());
      document.querySelectorAll('div[id="__canvas_overlay_root__"]').forEach(el => el.remove());
      document.querySelectorAll('textarea').forEach(el => {
        const parent = el.parentElement;
        if (parent && parent.parentElement === document.body) {
          parent.remove();
        } else {
          el.remove();
        }
      });
    });

    it('creates cell editor with proper configuration', () => {
      expect(cellEditor).toBeDefined();
      expect(cellEditor.isEditingCell()).toBe(false);
      expect(cellEditor.getCurrentEditingInfo()).toBeNull();
    });

    it('opens cell editor for table cell', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 100,
        cellHeight: 50,
        padding: 8
      };

      await cellEditor.openCellEditor(
        'table-1',
        mockTableNode,
        1,
        2,
        dimensions,
        'Initial content'
      );

      expect(cellEditor.isEditingCell()).toBe(true);
      
      const editingInfo = cellEditor.getCurrentEditingInfo();
      expect(editingInfo).toEqual({
        tableId: 'table-1',
        row: 1,
        col: 2
      });

      // Check that DOM overlay was created
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      expect(overlayRoot).toBeTruthy();
      expect(overlayRoot!.children.length).toBe(1);

      // Check textarea element was created
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      const textareaElement = wrapper.children[0] as HTMLTextAreaElement;
      expect(textareaElement).toBeTruthy();
      expect(textareaElement.tagName).toBe('TEXTAREA');
      expect(textareaElement.value).toBe('Initial content');
    });

    it('closes cell editor properly', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 80,
        cellHeight: 40,
        padding: 4
      };

      // Open editor first
      await cellEditor.openCellEditor('table-1', mockTableNode, 0, 1, dimensions, 'Test content');
      expect(cellEditor.isEditingCell()).toBe(true);

      // Close editor
      cellEditor.closeCellEditor();
      expect(cellEditor.isEditingCell()).toBe(false);
      expect(cellEditor.getCurrentEditingInfo()).toBeNull();

      // DOM should be cleaned up
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      if (overlayRoot) {
        expect(overlayRoot.children.length).toBe(0);
      }
    });

    it('commits cell edit with updated content', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 120,
        cellHeight: 60,
        padding: 8
      };

      const updateCallback = vi.fn();
      const scheduleDrawCallback = vi.fn();

      const configWithCallbacks: TableCellEditorConfig = {
        ...config,
        updateCellCallback: updateCallback,
        scheduleDraw: scheduleDrawCallback
      };

      const editorWithCallbacks = new TableCellEditor(configWithCallbacks);

      await editorWithCallbacks.openCellEditor(
        'table-1',
        mockTableNode,
        2,
        1,
        dimensions,
        'Original content'
      );

      // Simulate user typing
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      const textareaElement = wrapper.children[0] as HTMLTextAreaElement;
      textareaElement.value = 'Updated content';

      // Commit edit
      editorWithCallbacks.commitCellEdit();

      expect(updateCallback).toHaveBeenCalledWith('table-1', 2, 1, 'Updated content');
      expect(scheduleDrawCallback).toHaveBeenCalledWith('main');
      expect(editorWithCallbacks.isEditingCell()).toBe(false);

      editorWithCallbacks.destroy();
    });

    it('cancels cell edit without saving changes', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 90,
        cellHeight: 45,
        padding: 6
      };

      const updateCallback = vi.fn();

      const configWithCallback: TableCellEditorConfig = {
        ...config,
        updateCellCallback: updateCallback
      };

      const editorWithCallback = new TableCellEditor(configWithCallback);

      await editorWithCallback.openCellEditor(
        'table-1',
        mockTableNode,
        1,
        1,
        dimensions,
        'Original content'
      );

      // Simulate user typing
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      const textareaElement = wrapper.children[0] as HTMLTextAreaElement;
      textareaElement.value = 'Changed content';

      // Cancel edit
      editorWithCallback.cancelCellEdit();

      // Should not call update callback
      expect(updateCallback).not.toHaveBeenCalled();
      expect(editorWithCallback.isEditingCell()).toBe(false);

      editorWithCallback.destroy();
    });

    it('handles keyboard events correctly', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 100,
        cellHeight: 50,
        padding: 8
      };

      const updateCallback = vi.fn();
      const configWithCallback: TableCellEditorConfig = {
        ...config,
        updateCellCallback: updateCallback
      };

      const editorWithCallback = new TableCellEditor(configWithCallback);

      await editorWithCallback.openCellEditor(
        'table-1',
        mockTableNode,
        0,
        0,
        dimensions,
        'Test'
      );

      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      const textareaElement = wrapper.children[0] as HTMLTextAreaElement;
      textareaElement.value = 'Updated via keyboard';

      // Test Enter key (should commit)
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        shiftKey: false,
        cancelable: true 
      });
      textareaElement.dispatchEvent(enterEvent);

      expect(updateCallback).toHaveBeenCalledWith('table-1', 0, 0, 'Updated via keyboard');
      expect(editorWithCallback.isEditingCell()).toBe(false);

      editorWithCallback.destroy();
    });

    it('handles escape key to cancel editing', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 100,
        cellHeight: 50,
        padding: 8
      };

      await cellEditor.openCellEditor('table-1', mockTableNode, 1, 1, dimensions, 'Original');

      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      const textareaElement = wrapper.children[0] as HTMLTextAreaElement;
      textareaElement.value = 'Modified';

      // Test Escape key (should cancel)
      const escapeEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        cancelable: true 
      });
      textareaElement.dispatchEvent(escapeEvent);

      expect(cellEditor.isEditingCell()).toBe(false);
      expect(config.updateCellCallback).not.toHaveBeenCalled();
    });

    it('calculates cell bounds correctly', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 150,
        cellHeight: 75,
        padding: 10
      };

      // Mock specific table and container positions
      mockTableNode.getClientRect.mockReturnValue({ x: 200, y: 100, width: 600, height: 300 });
      mockContainer.getBoundingClientRect.mockReturnValue({ 
        left: 50, top: 80, width: 800, height: 600, right: 850, bottom: 680, x: 50, y: 80 
      });

      await cellEditor.openCellEditor('table-1', mockTableNode, 2, 3, dimensions, 'Test');

      // Check that overlay was positioned correctly
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      
      // The wrapper should be positioned based on calculated cell bounds
      expect(wrapper.style.position).toBe('absolute');
      expect(parseInt(wrapper.style.left)).toBeGreaterThan(0);
      expect(parseInt(wrapper.style.top)).toBeGreaterThan(0);
    });

    it('handles stage container errors gracefully', () => {
      // Mock stage that throws errors
      const problematicStage = {
        container: vi.fn(() => {
          throw new Error('Container error');
        })
      } as any;

      const problematicConfig: TableCellEditorConfig = {
        ...config,
        stage: problematicStage
      };

      // Constructor should throw error
      expect(() => {
        new TableCellEditor(problematicConfig);
      }).toThrow('Container error');
    });

    it('properly destroys resources on cleanup', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 100,
        cellHeight: 50,
        padding: 8
      };

      // Open editor
      await cellEditor.openCellEditor('table-1', mockTableNode, 1, 1, dimensions, 'Test');
      expect(cellEditor.isEditingCell()).toBe(true);

      // Destroy should clean up everything
      cellEditor.destroy();
      expect(cellEditor.isEditingCell()).toBe(false);
      expect(cellEditor.getCurrentEditingInfo()).toBeNull();
    });
  });

  describe('TableCellNavigationManager', () => {
    let cellEditor: TableCellEditor;
    let navigationManager: TableCellNavigationManager;
    let config: TableCellEditorConfig;

    beforeEach(() => {
      mockContainer = createMockStageContainer();
      mockStage = createMockStage();
      mockTableNode = createMockGroup();

      config = {
        stage: mockStage,
        updateCellCallback: vi.fn(),
        scheduleDraw: vi.fn(),
        debug: { log: false }
      };

      cellEditor = new TableCellEditor(config);
      navigationManager = new TableCellNavigationManager(cellEditor);
    });

    afterEach(() => {
      cellEditor.destroy();
      document.querySelectorAll('#table-canvas-container-parent').forEach(el => el.remove());
      document.querySelectorAll('div[id="__canvas_overlay_root__"]').forEach(el => el.remove());
    });

    it('creates navigation manager', () => {
      expect(navigationManager).toBeDefined();
    });

    it('sets current table for navigation', () => {
      navigationManager.setCurrentTable('table-1', 3, 4);
      
      // Navigation context is set (private state, tested through behavior)
      expect(() => navigationManager.setCurrentTable('table-1', 3, 4)).not.toThrow();
    });

    it('clears current table navigation context', () => {
      navigationManager.setCurrentTable('table-1', 2, 2);
      navigationManager.clearCurrentTable();
      
      // Should not navigate when no current table
      const result = navigationManager.navigateToCell('right');
      expect(result).toBe(false);
    });

    it('handles navigation without active editing session', () => {
      navigationManager.setCurrentTable('table-1', 3, 3);
      
      // No active editing session
      expect(cellEditor.isEditingCell()).toBe(false);
      
      // Should return false
      const result = navigationManager.navigateToCell('up');
      expect(result).toBe(false);
    });

    it('prevents navigation beyond table boundaries', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 100,
        cellHeight: 50,
        padding: 8
      };

      navigationManager.setCurrentTable('table-1', 2, 2); // 2x2 table

      // Open editor at top-left (0,0)
      await cellEditor.openCellEditor('table-1', mockTableNode, 0, 0, dimensions, 'Test');
      
      // Try to navigate up from top-left (should not move)
      const resultUp = navigationManager.navigateToCell('up');
      expect(resultUp).toBe(false);
      
      // Try to navigate left from top-left (should not move)
      const resultLeft = navigationManager.navigateToCell('left');
      expect(resultLeft).toBe(false);
    });

    it('handles navigation with mismatched table ID', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 100,
        cellHeight: 50,
        padding: 8
      };

      navigationManager.setCurrentTable('table-1', 2, 2);

      // Open editor for different table
      await cellEditor.openCellEditor('table-2', mockTableNode, 0, 0, dimensions, 'Test');
      
      // Should not navigate due to table ID mismatch
      const result = navigationManager.navigateToCell('right');
      expect(result).toBe(false);
    });
  });

  describe('TableCellEditor Integration', () => {
    let cellEditor: TableCellEditor;
    let config: TableCellEditorConfig;

    beforeEach(() => {
      mockContainer = createMockStageContainer();
      mockStage = createMockStage();
      mockTableNode = createMockGroup();

      config = {
        stage: mockStage,
        updateCellCallback: vi.fn(),
        scheduleDraw: vi.fn(),
        debug: { log: false }
      };

      cellEditor = new TableCellEditor(config);
    });

    afterEach(() => {
      cellEditor.destroy();
      document.querySelectorAll('#table-canvas-container-parent').forEach(el => el.remove());
      document.querySelectorAll('div[id="__canvas_overlay_root__"]').forEach(el => el.remove());
    });

    it('handles complete cell editing workflow', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 120,
        cellHeight: 60,
        padding: 8
      };

      const updateCallback = vi.fn();
      const scheduleDrawCallback = vi.fn();

      const workflowConfig: TableCellEditorConfig = {
        ...config,
        updateCellCallback: updateCallback,
        scheduleDraw: scheduleDrawCallback
      };

      const workflowEditor = new TableCellEditor(workflowConfig);

      // Initial state
      expect(workflowEditor.isEditingCell()).toBe(false);
      expect(workflowEditor.getCurrentEditingInfo()).toBeNull();

      // Open editor
      await workflowEditor.openCellEditor('table-1', mockTableNode, 1, 2, dimensions, 'Initial');
      expect(workflowEditor.isEditingCell()).toBe(true);
      expect(workflowEditor.getCurrentEditingInfo()).toEqual({
        tableId: 'table-1',
        row: 1,
        col: 2
      });

      // Simulate editing
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      const textareaElement = wrapper.children[0] as HTMLTextAreaElement;
      textareaElement.value = 'Final content';

      // Commit changes
      workflowEditor.commitCellEdit();
      expect(updateCallback).toHaveBeenCalledWith('table-1', 1, 2, 'Final content');
      expect(scheduleDrawCallback).toHaveBeenCalledWith('main');
      expect(workflowEditor.isEditingCell()).toBe(false);

      workflowEditor.destroy();
    });

    it('prevents multiple simultaneous editing sessions', async () => {
      const dimensions: CellDimensions = {
        cellWidth: 100,
        cellHeight: 50,
        padding: 8
      };

      // Open first editor
      await cellEditor.openCellEditor('table-1', mockTableNode, 0, 0, dimensions, 'First');
      expect(cellEditor.isEditingCell()).toBe(true);
      expect(cellEditor.getCurrentEditingInfo()?.row).toBe(0);
      expect(cellEditor.getCurrentEditingInfo()?.col).toBe(0);

      // Open second editor (should close first)
      await cellEditor.openCellEditor('table-1', mockTableNode, 1, 1, dimensions, 'Second');
      expect(cellEditor.isEditingCell()).toBe(true);
      expect(cellEditor.getCurrentEditingInfo()?.row).toBe(1);
      expect(cellEditor.getCurrentEditingInfo()?.col).toBe(1);

      // Only one overlay should exist
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      expect(overlayRoot!.children.length).toBe(1);
    });
  });
});