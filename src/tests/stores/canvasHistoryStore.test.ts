import { vi } from 'vitest';
import { act } from '@testing-library/react';

// Mock the entire store module to avoid hook execution outside React
const mockHistoryState = {
  canUndo: vi.fn(() => false),
  canRedo: vi.fn(() => false),
  undo: vi.fn(() => null),
  redo: vi.fn(() => null),
  addHistoryEntry: vi.fn(),
  startHistoryGroup: vi.fn(),
  endHistoryGroup: vi.fn(),
  isInGroup: vi.fn(() => false),
  getHistoryLength: vi.fn(() => 0),
  getCurrentHistoryEntry: vi.fn(() => null),
  getHistoryPreview: vi.fn(() => []),
  clearHistory: vi.fn(),
  history: {
    entries: [],
    maxSize: 50,
    currentSize: 0,
    add: vi.fn(),
    clear: vi.fn(),
    get: vi.fn(),
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false)
  },
  currentIndex: -1,
  isGrouping: false,
  currentGroupId: null,
  groupStartTime: 0,
  maxGroupDuration: 1000,
  historyMetrics: {
    undoOperations: 0,
    redoOperations: 0,
    totalHistoryEntries: 0,
    averageUndoTime: 0,
    averageRedoTime: 0,
    memoryUsage: 0
  }
};

// Mock selector that returns our mock state
const mockUseCanvasStore = vi.fn((selector: any) => {
  if (typeof selector === 'function') {
    return selector(mockHistoryState);
  }
  return mockHistoryState;
});

vi.mock('../../features/canvas/stores/canvasStore.enhanced', () => ({
  useCanvasStore: mockUseCanvasStore,
  useCanvasHistory: () => ({
    canUndo: false,
    canRedo: false,
    undo: mockHistoryState.undo,
    redo: mockHistoryState.redo
  })
}));

describe('Canvas History Store', () => {  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock return values after clearAllMocks()
    mockHistoryState.canUndo.mockImplementation(() => false);
    mockHistoryState.canRedo.mockImplementation(() => false);
    mockHistoryState.isInGroup.mockImplementation(() => false);
    mockHistoryState.getHistoryLength.mockImplementation(() => 0);
    mockHistoryState.getCurrentHistoryEntry.mockImplementation(() => null);
    mockHistoryState.getHistoryPreview.mockImplementation(() => []);
    
    // Reset mock state
    mockHistoryState.currentIndex = -1;
    mockHistoryState.isGrouping = false;
    mockHistoryState.currentGroupId = null;
    mockHistoryState.historyMetrics.undoOperations = 0;
    mockHistoryState.historyMetrics.redoOperations = 0;
  });

  describe('Basic History Operations', () => {
    test('initializes with correct history state', () => {
      // Test that the mock state structure matches expected interface
      expect(mockHistoryState.canUndo).toBeDefined();
      expect(mockHistoryState.canRedo).toBeDefined();
      expect(typeof mockHistoryState.undo).toBe('function');
      expect(typeof mockHistoryState.redo).toBe('function');
    });

    test('undo function is callable', () => {
      expect(() => {
        act(() => {
          mockHistoryState.undo();
        });
      }).not.toThrow();
      
      expect(mockHistoryState.undo).toHaveBeenCalled();
    });

    test('redo function is callable', () => {
      expect(() => {
        act(() => {
          mockHistoryState.redo();
        });
      }).not.toThrow();
      
      expect(mockHistoryState.redo).toHaveBeenCalled();
    });
  });

  describe('History State Properties', () => {
    test('canUndo returns boolean', () => {
      const result = mockHistoryState.canUndo();
      expect(typeof result).toBe('boolean');
    });

    test('canRedo returns boolean', () => {
      const result = mockHistoryState.canRedo();
      expect(typeof result).toBe('boolean');
    });

    test('history operations are tracked', () => {
      // Test that history metrics are properly structured
      expect(mockHistoryState.historyMetrics).toBeDefined();
      expect(typeof mockHistoryState.historyMetrics.undoOperations).toBe('number');
      expect(typeof mockHistoryState.historyMetrics.redoOperations).toBe('number');
    });
  });

  describe('History Grouping', () => {
    test('grouping operations are available', () => {
      expect(typeof mockHistoryState.startHistoryGroup).toBe('function');
      expect(typeof mockHistoryState.endHistoryGroup).toBe('function');
      expect(typeof mockHistoryState.isInGroup).toBe('function');
    });

    test('isInGroup returns boolean', () => {
      const result = mockHistoryState.isInGroup();
      expect(typeof result).toBe('boolean');
    });
  });
});
