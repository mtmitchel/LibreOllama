import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useKanbanDrag } from '../hooks/useKanbanDrag';
import { useGoogleStore } from '../../../stores/googleStore';
import { mockInvoke } from '../../../services/google/mockGoogleService';

// Mock the Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockImplementation(mockInvoke),
}));

// Mock zustand
vi.mock('../../../stores/googleStore', () => ({
  useGoogleStore: vi.fn(),
}));

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
  vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
  vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockConsole.log.mockClear();
  mockConsole.error.mockClear();
  mockConsole.warn.mockClear();
});

describe('Drag and Drop Tests', () => {
  let mockStore: any;
  let mockPendingOperations: any;
  let mockProcessQueue: any;
  let mockKanbanColumns: any;

  beforeEach(() => {
    // Create mock store functions
    mockStore = {
      taskIdToListId: new Map([
        ['task-1', 'list-1'],
        ['task-2', 'list-1'],
        ['task-3', 'list-2'],
        ['task-4', 'list-2'],
        ['task-5', 'list-3'],
      ]),
      optimisticMoveTask: vi.fn(),
      optimisticReorderTask: vi.fn(),
      activeAccount: {
        id: 'account-1',
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    // Create mock pending operations
    mockPendingOperations = {
      current: [],
    };

    // Create mock process queue
    mockProcessQueue = vi.fn();

    // Create mock kanban columns
    mockKanbanColumns = [
      {
        taskList: { id: 'list-1', title: 'To Do' },
        tasks: [
          { id: 'task-1', title: 'Task 1', status: 'needsAction' },
          { id: 'task-2', title: 'Task 2', status: 'needsAction' },
        ],
      },
      {
        taskList: { id: 'list-2', title: 'In Progress' },
        tasks: [
          { id: 'task-3', title: 'Task 3', status: 'needsAction' },
          { id: 'task-4', title: 'Task 4', status: 'needsAction' },
        ],
      },
      {
        taskList: { id: 'list-3', title: 'Done' },
        tasks: [
          { id: 'task-5', title: 'Task 5', status: 'completed' },
        ],
      },
    ];

    // Mock the useGoogleStore hook
    vi.mocked(useGoogleStore).mockReturnValue(mockStore);
  });

  describe('Drag Initialization', () => {
    it('should initialize with empty drag state', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      expect(result.current.dragState.activeTask).toBeNull();
      expect(result.current.dragState.sourceListId).toBeNull();
    });

    it('should provide drag event handlers', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      expect(result.current.handleDragStart).toBeDefined();
      expect(result.current.handleDragOver).toBeDefined();
      expect(result.current.handleDragEnd).toBeDefined();
    });
  });

  describe('Drag Start', () => {
    it('should set drag state on drag start', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      expect(result.current.dragState.activeTask).toEqual(
        expect.objectContaining({ id: 'task-1', title: 'Task 1' })
      );
      expect(result.current.dragState.sourceListId).toBe('list-1');
    });

    it('should handle drag start with non-existent task', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      const dragStartEvent: DragStartEvent = {
        active: { id: 'non-existent-task', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      expect(result.current.dragState.activeTask).toBeNull();
      expect(result.current.dragState.sourceListId).toBeNull();
    });

    it('should handle drag start with task not in taskIdToListId map', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Remove task from map
      mockStore.taskIdToListId.delete('task-1');

      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      expect(result.current.dragState.activeTask).toBeNull();
      expect(result.current.dragState.sourceListId).toBeNull();
    });
  });

  describe('Drag Over', () => {
    it('should handle drag over same item', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // Drag over same item
      const dragOverEvent: DragOverEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        delta: { x: 0, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragOver(dragOverEvent);
      });

      expect(mockStore.optimisticMoveTask).not.toHaveBeenCalled();
      expect(mockStore.optimisticReorderTask).not.toHaveBeenCalled();
    });

    it('should handle drag over different task in same list', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // Drag over different task in same list
      const dragOverEvent: DragOverEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'task-2', data: { current: {} }, rect: { current: {} } },
        delta: { x: 0, y: 20 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragOver(dragOverEvent);
      });

      expect(mockStore.optimisticReorderTask).toHaveBeenCalledWith('list-1', 'task-1', 'task-2');
      expect(mockStore.optimisticMoveTask).not.toHaveBeenCalled();
    });

    it('should handle drag over different list', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // Drag over different list
      const dragOverEvent: DragOverEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'list-2', data: { current: {} }, rect: { current: {} } },
        delta: { x: 100, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragOver(dragOverEvent);
      });

      expect(mockStore.optimisticMoveTask).toHaveBeenCalledWith('task-1', 'list-1', 'list-2');
      expect(result.current.dragState.sourceListId).toBe('list-2');
    });

    it('should handle drag over task in different list', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // Drag over task in different list
      const dragOverEvent: DragOverEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'task-3', data: { current: {} }, rect: { current: {} } },
        delta: { x: 100, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragOver(dragOverEvent);
      });

      expect(mockStore.optimisticMoveTask).toHaveBeenCalledWith('task-1', 'list-1', 'list-2');
      expect(result.current.dragState.sourceListId).toBe('list-2');
    });

    it('should handle drag over with no target', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // Drag over nothing
      const dragOverEvent: DragOverEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
        delta: { x: 0, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragOver(dragOverEvent);
      });

      expect(mockStore.optimisticMoveTask).not.toHaveBeenCalled();
      expect(mockStore.optimisticReorderTask).not.toHaveBeenCalled();
    });
  });

  describe('Drag End', () => {
    it('should handle drag end with successful drop on column', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // End drag on column
      const dragEndEvent: DragEndEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'list-2', data: { current: {} }, rect: { current: {} } },
        delta: { x: 100, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragEnd(dragEndEvent);
      });

      expect(mockPendingOperations.current).toHaveLength(1);
      expect(mockPendingOperations.current[0]).toEqual(
        expect.objectContaining({
          taskId: 'task-1',
          sourceListId: 'list-1',
          targetListId: 'list-2',
          accountId: 'account-1',
        })
      );
      expect(mockProcessQueue).toHaveBeenCalled();
    });

    it('should handle drag end with drop on task', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // End drag on task
      const dragEndEvent: DragEndEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'task-3', data: { current: {} }, rect: { current: {} } },
        delta: { x: 100, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragEnd(dragEndEvent);
      });

      expect(mockPendingOperations.current).toHaveLength(1);
      expect(mockPendingOperations.current[0]).toEqual(
        expect.objectContaining({
          taskId: 'task-1',
          sourceListId: 'list-1',
          targetListId: 'list-2',
          previous: 'task-3',
        })
      );
      expect(mockProcessQueue).toHaveBeenCalled();
    });

    it('should handle drag end with drop on task in same list', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // End drag on task in same list
      const dragEndEvent: DragEndEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'task-2', data: { current: {} }, rect: { current: {} } },
        delta: { x: 0, y: 20 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragEnd(dragEndEvent);
      });

      expect(mockPendingOperations.current).toHaveLength(1);
      expect(mockPendingOperations.current[0]).toEqual(
        expect.objectContaining({
          taskId: 'task-1',
          sourceListId: 'list-1',
          targetListId: 'list-1',
          previous: 'task-2',
        })
      );
      expect(mockProcessQueue).toHaveBeenCalled();
    });

    it('should handle drag end with drop on empty column', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Create empty column
      const emptyColumn = {
        taskList: { id: 'list-empty', title: 'Empty' },
        tasks: [],
      };
      const columnsWithEmpty = [...mockKanbanColumns, emptyColumn];

      const { result: resultWithEmpty } = renderHook(() => 
        useKanbanDrag(columnsWithEmpty, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        resultWithEmpty.current.handleDragStart(dragStartEvent);
      });

      // End drag on empty column
      const dragEndEvent: DragEndEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'list-empty', data: { current: {} }, rect: { current: {} } },
        delta: { x: 200, y: 0 },
        collisions: [],
      };

      act(() => {
        resultWithEmpty.current.handleDragEnd(dragEndEvent);
      });

      expect(mockPendingOperations.current).toHaveLength(1);
      expect(mockPendingOperations.current[0]).toEqual(
        expect.objectContaining({
          taskId: 'task-1',
          sourceListId: 'list-1',
          targetListId: 'list-empty',
          previous: undefined,
        })
      );
      expect(mockProcessQueue).toHaveBeenCalled();
    });

    it('should handle drag end with no drop target', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // End drag with no target
      const dragEndEvent: DragEndEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
        delta: { x: 0, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragEnd(dragEndEvent);
      });

      expect(mockPendingOperations.current).toHaveLength(0);
      expect(mockProcessQueue).not.toHaveBeenCalled();
    });

    it('should handle drag end with same source and target', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // End drag on same item
      const dragEndEvent: DragEndEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        delta: { x: 0, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragEnd(dragEndEvent);
      });

      expect(mockPendingOperations.current).toHaveLength(0);
      expect(mockProcessQueue).not.toHaveBeenCalled();
    });

    it('should reset drag state after drag end', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      expect(result.current.dragState.activeTask).not.toBeNull();

      // End drag
      const dragEndEvent: DragEndEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'list-2', data: { current: {} }, rect: { current: {} } },
        delta: { x: 100, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragEnd(dragEndEvent);
      });

      expect(result.current.dragState.activeTask).toBeNull();
      expect(result.current.dragState.sourceListId).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing activeAccount', () => {
      const storeWithoutAccount = {
        ...mockStore,
        activeAccount: null,
      };

      vi.mocked(useGoogleStore).mockReturnValue(storeWithoutAccount);

      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // End drag
      const dragEndEvent: DragEndEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'list-2', data: { current: {} }, rect: { current: {} } },
        delta: { x: 100, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragEnd(dragEndEvent);
      });

      expect(mockPendingOperations.current).toHaveLength(0);
      expect(mockProcessQueue).not.toHaveBeenCalled();
    });

    it('should handle missing taskIdToListId mapping', () => {
      const storeWithoutMapping = {
        ...mockStore,
        taskIdToListId: new Map(),
      };

      vi.mocked(useGoogleStore).mockReturnValue(storeWithoutMapping);

      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      expect(result.current.dragState.activeTask).toBeNull();
      expect(result.current.dragState.sourceListId).toBeNull();
    });

    it('should handle optimistic update failures', () => {
      // Mock console.error to avoid noise in tests
      const originalError = console.error;
      console.error = vi.fn();

      const storeWithFailingOptimistic = {
        ...mockStore,
        optimisticMoveTask: vi.fn().mockImplementation(() => {
          throw new Error('Optimistic update failed');
        }),
      };

      vi.mocked(useGoogleStore).mockReturnValue(storeWithFailingOptimistic);

      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // This should not crash - the drag handler should handle the error gracefully
      const dragOverEvent: DragOverEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'list-2', data: { current: {} }, rect: { current: {} } },
        delta: { x: 100, y: 0 },
        collisions: [],
      };

      // The drag handler should catch the error and not let it propagate
      act(() => {
        result.current.handleDragOver(dragOverEvent);
      });

      // The drag operation should continue normally despite the optimistic update failure
      expect(result.current.dragState.activeTask).toBeDefined();

      // Restore console.error
      console.error = originalError;
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle rapid drag movements', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // Multiple rapid drag over events
      const dragOverEvents = [
        { id: 'task-2', targetListId: 'list-1' },
        { id: 'list-2', targetListId: 'list-2' },
        { id: 'task-3', targetListId: 'list-2' },
        { id: 'list-3', targetListId: 'list-3' },
      ];

      dragOverEvents.forEach(({ id, targetListId }) => {
        const dragOverEvent: DragOverEvent = {
          active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
          over: { id, data: { current: {} }, rect: { current: {} } },
          delta: { x: 100, y: 0 },
          collisions: [],
        };

        act(() => {
          result.current.handleDragOver(dragOverEvent);
        });
      });

      // Should handle all movements without crashing
      expect(result.current.dragState.activeTask).not.toBeNull();
    });

    it('should handle drag between multiple columns', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // Move through multiple columns
      const dragOverList2: DragOverEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'list-2', data: { current: {} }, rect: { current: {} } },
        delta: { x: 100, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragOver(dragOverList2);
      });

      expect(result.current.dragState.sourceListId).toBe('list-2');

      const dragOverList3: DragOverEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'list-3', data: { current: {} }, rect: { current: {} } },
        delta: { x: 200, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragOver(dragOverList3);
      });

      expect(result.current.dragState.sourceListId).toBe('list-3');

      // End drag
      const dragEndEvent: DragEndEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'list-3', data: { current: {} }, rect: { current: {} } },
        delta: { x: 200, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragEnd(dragEndEvent);
      });

      expect(mockPendingOperations.current).toHaveLength(1);
      expect(mockPendingOperations.current[0].targetListId).toBe('list-3');
    });

    it('should handle drag with position calculation', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Start drag
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      // End drag on column with tasks (should set previous to last task)
      const dragEndEvent: DragEndEvent = {
        active: { id: 'task-1', data: { current: {} }, rect: { current: {} } },
        over: { id: 'list-2', data: { current: {} }, rect: { current: {} } },
        delta: { x: 100, y: 0 },
        collisions: [],
      };

      act(() => {
        result.current.handleDragEnd(dragEndEvent);
      });

      expect(mockPendingOperations.current).toHaveLength(1);
      expect(mockPendingOperations.current[0].previous).toBe('task-4'); // Last task in list-2
    });

    it('should handle concurrent drag operations', () => {
      const { result } = renderHook(() => 
        useKanbanDrag(mockKanbanColumns, mockPendingOperations, mockProcessQueue)
      );

      // Simulate multiple drag operations
      const dragOperations = [
        { taskId: 'task-1', targetListId: 'list-2' },
        { taskId: 'task-2', targetListId: 'list-3' },
      ];

      dragOperations.forEach(({ taskId, targetListId }) => {
        const dragStartEvent: DragStartEvent = {
          active: { id: taskId, data: { current: {} }, rect: { current: {} } },
          over: null,
        };

        act(() => {
          result.current.handleDragStart(dragStartEvent);
        });

        const dragEndEvent: DragEndEvent = {
          active: { id: taskId, data: { current: {} }, rect: { current: {} } },
          over: { id: targetListId, data: { current: {} }, rect: { current: {} } },
          delta: { x: 100, y: 0 },
          collisions: [],
        };

        act(() => {
          result.current.handleDragEnd(dragEndEvent);
        });
      });

      expect(mockPendingOperations.current).toHaveLength(2);
      expect(mockProcessQueue).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of columns efficiently', () => {
      const largeMockColumns = Array.from({ length: 50 }, (_, i) => ({
        taskList: { id: `list-${i}`, title: `List ${i}` },
        tasks: Array.from({ length: 10 }, (_, j) => ({
          id: `task-${i}-${j}`,
          title: `Task ${i}-${j}`,
          status: 'needsAction',
        })),
      }));

      // Update taskIdToListId for large dataset
      largeMockColumns.forEach(column => {
        column.tasks.forEach(task => {
          mockStore.taskIdToListId.set(task.id, column.taskList.id);
        });
      });

      const startTime = Date.now();

      const { result } = renderHook(() => 
        useKanbanDrag(largeMockColumns, mockPendingOperations, mockProcessQueue)
      );

      const initTime = Date.now() - startTime;

      // Should initialize quickly even with large dataset
      expect(initTime).toBeLessThan(100); // 100ms max

      // Test drag operations
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-0-0', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      const dragStartTime = Date.now();

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      const dragOperationTime = Date.now() - dragStartTime;

      // Should handle drag operations quickly
      expect(dragOperationTime).toBeLessThan(50); // 50ms max
    });

    it('should handle large number of tasks efficiently', () => {
      const largeMockColumns = [
        {
          taskList: { id: 'list-1', title: 'Large List' },
          tasks: Array.from({ length: 1000 }, (_, i) => ({
            id: `task-${i}`,
            title: `Task ${i}`,
            status: 'needsAction',
          })),
        },
      ];

      // Update taskIdToListId for large dataset
      largeMockColumns[0].tasks.forEach(task => {
        mockStore.taskIdToListId.set(task.id, 'list-1');
      });

      const { result } = renderHook(() => 
        useKanbanDrag(largeMockColumns, mockPendingOperations, mockProcessQueue)
      );

      // Test drag operations performance
      const dragStartEvent: DragStartEvent = {
        active: { id: 'task-500', data: { current: {} }, rect: { current: {} } },
        over: null,
      };

      const startTime = Date.now();

      act(() => {
        result.current.handleDragStart(dragStartEvent);
      });

      const operationTime = Date.now() - startTime;

      // Should handle large lists efficiently
      expect(operationTime).toBeLessThan(100); // 100ms max
    });
  });
}); 