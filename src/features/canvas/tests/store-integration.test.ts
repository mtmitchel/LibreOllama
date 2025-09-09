import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  GlobalStoreAdapter,
  TextEditingStoreManager,
  MockStoreAdapter,
  type CanvasStoreAdapter,
  type ElementUpdateData
} from '../renderer/store/StoreIntegration';

// Mock global store with persistent mock state
const mockMethods = {
  updateElement: vi.fn(),
  selectElement: vi.fn(),
  clearSelection: vi.fn(),
  addTableColumn: vi.fn(),
  addTableRow: vi.fn(),
  removeTableColumn: vi.fn(),
  removeTableRow: vi.fn(),
  saveSnapshot: vi.fn(),
  reflowEdgesForElement: vi.fn(),
  computeAndCommitDirtyEdges: vi.fn()
};

const mockStore = {
  getState: vi.fn(() => ({
    ...mockMethods,
    elements: new Map([
      ['test-element', {
        id: 'test-element',
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        text: 'Hello World'
      }]
    ]),
    selectedElementIds: new Set(['test-element'])
  }))
};

describe('Store Integration System', () => {
  describe('GlobalStoreAdapter', () => {
    let adapter: GlobalStoreAdapter;

    beforeEach(() => {
      adapter = new GlobalStoreAdapter();
      // Mock the global store
      (window as any).__UNIFIED_CANVAS_STORE__ = mockStore;
    });

    afterEach(() => {
      delete (window as any).__UNIFIED_CANVAS_STORE__;
      // Reset specific mock methods
      Object.values(mockMethods).forEach(mock => mock.mockClear());
    });

    it('checks store connection', () => {
      expect(adapter.isConnected()).toBe(true);

      delete (window as any).__UNIFIED_CANVAS_STORE__;
      expect(adapter.isConnected()).toBe(false);
    });

    it('updates elements in store', () => {
      const updates: ElementUpdateData = { text: 'Updated text', width: 300 };
      const options = { skipHistory: true };

      adapter.updateElement('test-element', updates, options);

      expect(mockMethods.updateElement).toHaveBeenCalledWith('test-element', updates, options);
    });

    it('selects elements in store', () => {
      adapter.selectElement('test-element', false);

      expect(mockMethods.selectElement).toHaveBeenCalledWith('test-element', false);
    });

    it('gets elements from store', () => {
      const element = adapter.getElement('test-element');

      expect(element).toBeDefined();
      expect(element?.id).toBe('test-element');
      expect(element?.text).toBe('Hello World');
    });

    it('gets selected element IDs', () => {
      const selectedIds = adapter.getSelectedElementIds();

      expect(selectedIds).toBeInstanceOf(Set);
      expect(selectedIds.has('test-element')).toBe(true);
    });

    it('clears selection', () => {
      adapter.clearSelection();

      expect(mockMethods.clearSelection).toHaveBeenCalled();
    });

    it('handles table operations', () => {
      adapter.addTableColumn('table-1', 2);
      adapter.addTableRow('table-1', 1);
      adapter.removeTableColumn('table-1', 0);
      adapter.removeTableRow('table-1', 3);

      expect(mockMethods.addTableColumn).toHaveBeenCalledWith('table-1', 2);
      expect(mockMethods.addTableRow).toHaveBeenCalledWith('table-1', 1);
      expect(mockMethods.removeTableColumn).toHaveBeenCalledWith('table-1', 0);
      expect(mockMethods.removeTableRow).toHaveBeenCalledWith('table-1', 3);
    });

    it('handles state operations', () => {
      adapter.saveSnapshot();
      adapter.reflowEdgesForElement('test-element');
      adapter.computeAndCommitDirtyEdges();

      expect(mockMethods.saveSnapshot).toHaveBeenCalled();
      expect(mockMethods.reflowEdgesForElement).toHaveBeenCalledWith('test-element');
      expect(mockMethods.computeAndCommitDirtyEdges).toHaveBeenCalled();
    });

    it('handles store errors gracefully', () => {
      // Mock store with error
      (window as any).__UNIFIED_CANVAS_STORE__ = {
        getState: () => {
          throw new Error('Store error');
        }
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not throw
      adapter.updateElement('test-element', { text: 'test' });
      adapter.selectElement('test-element');
      const element = adapter.getElement('test-element');
      const selected = adapter.getSelectedElementIds();

      expect(element).toBeUndefined();
      expect(selected).toEqual(new Set());
      expect(consoleSpy).toHaveBeenCalledWith('[StoreAdapter] Failed to update element:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('TextEditingStoreManager', () => {
    let mockAdapter: MockStoreAdapter;
    let manager: TextEditingStoreManager;

    beforeEach(() => {
      mockAdapter = new MockStoreAdapter();
      manager = new TextEditingStoreManager(mockAdapter);
      
      // Set up test element
      mockAdapter.setElement('test-element', {
        id: 'test-element',
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        text: 'Original text'
      } as any);
    });

    afterEach(() => {
      mockAdapter.reset();
    });

    it('starts editing session', () => {
      manager.startEditing('test-element', 'Initial text');

      const updateCalls = mockAdapter.updateElementCalls;
      const selectCalls = mockAdapter.selectElementCalls;

      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]).toEqual({
        id: 'test-element',
        updates: { isEditing: true, text: 'Initial text' },
        options: undefined
      });

      expect(selectCalls).toHaveLength(1);
      expect(selectCalls[0]).toEqual({
        id: 'test-element',
        additive: false
      });
    });

    it('updates text during live editing', () => {
      manager.updateTextLive('test-element', 'Live text update', true);

      const updateCalls = mockAdapter.updateElementCalls;
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]).toEqual({
        id: 'test-element',
        updates: { text: 'Live text update' },
        options: { skipHistory: true }
      });
    });

    it('updates dimensions during auto-resize', () => {
      const dimensions = { width: 250, height: 75 };
      
      manager.updateDimensions('test-element', dimensions, true);

      const updateCalls = mockAdapter.updateElementCalls;
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]).toEqual({
        id: 'test-element',
        updates: dimensions,
        options: { skipHistory: true }
      });
    });

    it('commits editing session', () => {
      const finalDimensions = { width: 300, height: 80 };
      
      manager.commitEditing('test-element', 'Final text', finalDimensions);

      const updateCalls = mockAdapter.updateElementCalls;
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]).toEqual({
        id: 'test-element',
        updates: {
          text: 'Final text',
          isEditing: false,
          ...finalDimensions
        },
        options: undefined
      });
    });

    it('cancels editing session', () => {
      const originalDimensions = { width: 200, height: 50 };
      
      manager.cancelEditing('test-element', 'Original text', originalDimensions);

      const updateCalls = mockAdapter.updateElementCalls;
      const selectCalls = mockAdapter.selectElementCalls;

      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]).toEqual({
        id: 'test-element',
        updates: {
          isEditing: false,
          text: 'Original text',
          ...originalDimensions
        },
        options: undefined
      });

      expect(selectCalls).toHaveLength(1);
      expect(selectCalls[0]).toEqual({
        id: 'test-element',
        additive: false
      });
    });

    it('gets element data', () => {
      const element = manager.getElement('test-element');

      expect(element).toBeDefined();
      expect(element?.id).toBe('test-element');
      expect(element?.text).toBe('Original text');
    });

    it('gets selected element IDs', () => {
      mockAdapter.selectElement('test-element');
      
      const selectedIds = manager.getSelectedElementIds();

      expect(selectedIds).toBeInstanceOf(Set);
      expect(selectedIds.has('test-element')).toBe(true);
    });

    it('checks connection status', () => {
      expect(manager.isConnected()).toBe(true);
    });
  });

  describe('MockStoreAdapter', () => {
    let adapter: MockStoreAdapter;

    beforeEach(() => {
      adapter = new MockStoreAdapter();
    });

    it('tracks update element calls', () => {
      const updates = { text: 'Test text', width: 100 };
      const options = { skipHistory: true };

      adapter.updateElement('test-id', updates, options);

      expect(adapter.updateElementCalls).toHaveLength(1);
      expect(adapter.updateElementCalls[0]).toEqual({
        id: 'test-id',
        updates,
        options
      });
    });

    it('tracks select element calls', () => {
      adapter.selectElement('test-id', true);

      expect(adapter.selectElementCalls).toHaveLength(1);
      expect(adapter.selectElementCalls[0]).toEqual({
        id: 'test-id',
        additive: true
      });
    });

    it('manages mock elements', () => {
      const testElement = {
        id: 'test-element',
        type: 'text',
        x: 0,
        y: 0,
        text: 'Test'
      } as any;

      adapter.setElement('test-element', testElement);

      const retrieved = adapter.getElement('test-element');
      expect(retrieved).toEqual(testElement);
    });

    it('manages mock selection', () => {
      adapter.selectElement('element-1');
      adapter.selectElement('element-2', true);

      const selected = adapter.getSelectedElementIds();
      expect(selected).toEqual(new Set(['element-1', 'element-2']));

      adapter.clearSelection();
      expect(adapter.getSelectedElementIds()).toEqual(new Set());
    });

    it('resets state correctly', () => {
      adapter.updateElement('test', { text: 'test' });
      adapter.selectElement('test');
      adapter.setElement('test', { id: 'test' } as any);

      adapter.reset();

      expect(adapter.updateElementCalls).toHaveLength(0);
      expect(adapter.selectElementCalls).toHaveLength(0);
      expect(adapter.getElement('test')).toBeUndefined();
      expect(adapter.getSelectedElementIds()).toEqual(new Set());
    });

    it('is always connected', () => {
      expect(adapter.isConnected()).toBe(true);
    });
  });
});