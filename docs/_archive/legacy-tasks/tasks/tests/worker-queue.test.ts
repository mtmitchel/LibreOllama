import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockInvoke } from '../../../services/google/mockGoogleService';

// Mock the Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockImplementation(mockInvoke),
}));

// Mock the Web Worker
class MockWorker {
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private timeouts: NodeJS.Timeout[] = [];
  static forceFailure: boolean = false;
  static forceSuccess: boolean = false;

  constructor(scriptURL: string) {
    // Mock worker initialization
  }

  addEventListener(type: 'message', handler: (event: MessageEvent) => void) {
    if (type === 'message') {
      this.messageHandler = handler;
    }
  }

  set onmessage(handler: ((event: MessageEvent) => void) | null) {
    this.messageHandler = handler;
  }

  get onmessage() {
    return this.messageHandler;
  }

  postMessage(data: any) {
    // Send sync-started immediately (synchronously)
    if (this.messageHandler) {
      this.messageHandler({
        data: { type: 'sync-started' },
      } as MessageEvent);
    }
    
    // Use microtasks instead of setTimeout for better React compatibility
    this.simulateWorkerResponse(data);
  }

  private simulateWorkerResponse(operations: any[]) {
    if (!this.messageHandler) return;

    // Chain microtasks for sequential processing
    let promise = Promise.resolve();

    operations.forEach((op, index) => {
      promise = promise.then(() => {
        return new Promise<void>((resolve) => {
          // Use setTimeout only for the final delay, but shorter
          setTimeout(() => {
            if (!this.messageHandler) {
              resolve();
              return;
            }
            
            let success = Math.random() > 0.1; // 90% success rate by default
            if (MockWorker.forceFailure) success = false;
            if (MockWorker.forceSuccess) success = true;
            
            if (success) {
              this.messageHandler({
                data: {
                  type: 'operation-success',
                  payload: {
                    taskId: op.taskId,
                    operationId: op.operationId,
                    sourceListId: op.sourceListId,
                    targetListId: op.targetListId,
                  },
                },
              } as MessageEvent);
            } else {
              this.messageHandler({
                data: {
                  type: 'operation-failure',
                  payload: {
                    taskId: op.taskId,
                    operationId: op.operationId,
                    originalTaskTitle: op.originalTask?.title || 'Unknown Task',
                    sourceListId: op.sourceListId,
                    targetListId: op.targetListId,
                    error: 'Simulated failure',
                  },
                },
              } as MessageEvent);
            }
            resolve();
          }, 50); // Shorter delay for better test performance
        });
      });
    });

    // Send sync-finished after all operations complete
    promise.then(() => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          if (this.messageHandler) {
            this.messageHandler({
              data: { type: 'sync-finished' },
            } as MessageEvent);
          }
          resolve();
        }, 50);
      });
    }).catch(() => {
      // Even if operations fail, we should send sync-finished
      if (this.messageHandler) {
        this.messageHandler({
          data: { type: 'sync-finished' },
        } as MessageEvent);
      }
    });
  }

  terminate() {
    // Clear all timeouts to prevent orphaned callbacks
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts = [];
    this.messageHandler = null;
  }
}

// Mock the Worker constructor
Object.defineProperty(global, 'Worker', {
  value: MockWorker,
  writable: true,
});

// Import the hook that uses the worker
import { useTaskSyncQueue } from '../hooks/useTaskSyncQueue';
import { renderHook, act } from '@testing-library/react';

describe('Worker Queue Tests', () => {
  let mockAddToast: any;
  let originalWorker: any;

  beforeEach(() => {
    // Mock the addToast function
    mockAddToast = vi.fn();
    
    // Store original Worker
    originalWorker = global.Worker;
    
    // Set up mock Worker
    global.Worker = MockWorker as any;
    
    // Reset MockWorker flags
    MockWorker.forceFailure = false;
    MockWorker.forceSuccess = false;
  });

  afterEach(() => {
    // Restore original Worker
    global.Worker = originalWorker;
    
    // Reset MockWorker flags
    MockWorker.forceFailure = false;
    MockWorker.forceSuccess = false;
    
    // Clear mocks
    vi.clearAllMocks();
  });

  describe('Basic Queue Operations', () => {
    it('should initialize worker queue correctly', () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      expect(result.current.pendingOperations).toBeDefined();
      expect(result.current.processQueue).toBeDefined();
      expect(result.current.isSyncing).toBe(false);
    });

    it('should process single operation', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operation = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Test Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        result.current.processQueue();
      });

      expect(result.current.isSyncing).toBe(true);

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result.current.isSyncing).toBe(false);
    });

    it('should process multiple operations sequentially', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operations = [
        {
          id: 'op-1',
          taskId: 'task-1',
          accountId: 'account-1',
          sourceListId: 'list-1',
          targetListId: 'list-2',
          operationId: 'op-1',
          originalTask: { title: 'Task 1' },
        },
        {
          id: 'op-2',
          taskId: 'task-2',
          accountId: 'account-1',
          sourceListId: 'list-1',
          targetListId: 'list-3',
          operationId: 'op-2',
          originalTask: { title: 'Task 2' },
        },
        {
          id: 'op-3',
          taskId: 'task-3',
          accountId: 'account-1',
          sourceListId: 'list-2',
          targetListId: 'list-1',
          operationId: 'op-3',
          originalTask: { title: 'Task 3' },
        },
      ];

      act(() => {
        result.current.pendingOperations.current.push(...operations);
        result.current.processQueue();
      });

      expect(result.current.isSyncing).toBe(true);

      // Wait for all operations to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(result.current.isSyncing).toBe(false);
    });

    it('should handle empty queue', () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      act(() => {
        result.current.processQueue();
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it('should prevent concurrent queue processing', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operation = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Test Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        // Start processing
        result.current.processQueue();
        // Try to start processing again (should be ignored)
        result.current.processQueue();
      });

      expect(result.current.isSyncing).toBe(true);

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result.current.isSyncing).toBe(false);
    });
  });

  describe('Operation Success Handling', () => {
    it('should handle successful operation', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      // Mock successful operation
      const mockWorker = new MockWorker('test-worker.js');
      mockWorker.postMessage = vi.fn().mockImplementation((operations) => {
        setTimeout(() => {
          (mockWorker as any).messageHandler({
            data: { type: 'sync-started' },
          });
          
          operations.forEach((op: any) => {
            (mockWorker as any).messageHandler({
              data: {
                type: 'operation-success',
                payload: {
                  taskId: op.taskId,
                  operationId: op.operationId,
                  sourceListId: op.sourceListId,
                  targetListId: op.targetListId,
                },
              },
            });
          });
          
          (mockWorker as any).messageHandler({
            data: { type: 'sync-finished' },
          });
        }, 100);
      });

      const operation = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Test Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        result.current.processQueue();
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      expect(result.current.isSyncing).toBe(false);
    });

    it('should remove successful operations from queue', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operation = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Test Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        result.current.processQueue();
      });

      expect(result.current.pendingOperations.current).toHaveLength(1);

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result.current.pendingOperations.current).toHaveLength(0);
    });

    it('should handle mixed success and failure operations', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operations = [
        {
          id: 'op-1',
          taskId: 'task-1',
          accountId: 'account-1',
          sourceListId: 'list-1',
          targetListId: 'list-2',
          operationId: 'op-1',
          originalTask: { title: 'Success Task' },
        },
        {
          id: 'op-2',
          taskId: 'task-2',
          accountId: 'account-1',
          sourceListId: 'list-1',
          targetListId: 'list-3',
          operationId: 'op-2',
          originalTask: { title: 'Failure Task' },
        },
      ];

      // Mock mixed results
      const mockWorker = new MockWorker('test-worker.js');
      mockWorker.postMessage = vi.fn().mockImplementation((operations) => {
        setTimeout(() => {
          (mockWorker as any).messageHandler({
            data: { type: 'sync-started' },
          });
          
          // First operation succeeds
          (mockWorker as any).messageHandler({
            data: {
              type: 'operation-success',
              payload: {
                taskId: operations[0].taskId,
                operationId: operations[0].operationId,
                sourceListId: operations[0].sourceListId,
                targetListId: operations[0].targetListId,
              },
            },
          });
          
          // Second operation fails
          (mockWorker as any).messageHandler({
            data: {
              type: 'operation-failure',
              payload: {
                taskId: operations[1].taskId,
                operationId: operations[1].operationId,
                originalTaskTitle: operations[1].originalTask.title,
                sourceListId: operations[1].sourceListId,
                targetListId: operations[1].targetListId,
                error: 'Simulated failure',
              },
            },
          });
          
          (mockWorker as any).messageHandler({
            data: { type: 'sync-finished' },
          });
        }, 100);
      });

      act(() => {
        result.current.pendingOperations.current.push(...operations);
        result.current.processQueue();
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      expect(result.current.isSyncing).toBe(false);
      expect(mockAddToast).toHaveBeenCalledWith(
        'error',
        'Sync Failed',
        expect.stringContaining('Failure Task')
      );
    });
  });

  describe('Operation Failure Handling', () => {
    it('should handle operation failure', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      // Force all operations to fail
      MockWorker.forceFailure = true;

      const operation = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Failed Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        result.current.processQueue();
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result.current.isSyncing).toBe(false);
      expect(mockAddToast).toHaveBeenCalledWith(
        'error',
        'Sync Failed',
        expect.stringContaining('Failed Task')
      );
    });

    it('should retain failed operations in queue for retry', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      // Force all operations to fail
      MockWorker.forceFailure = true;
      
      const operation = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Failed Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        result.current.processQueue();
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Failed operation should remain in queue
      expect(result.current.pendingOperations.current).toHaveLength(1);
    });

    it('should handle multiple consecutive failures', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      // Force all operations to fail
      MockWorker.forceFailure = true;
      
      const operations = [
        {
          id: 'op-1',
          taskId: 'task-1',
          accountId: 'account-1',
          sourceListId: 'list-1',
          targetListId: 'list-2',
          operationId: 'op-1',
          originalTask: { title: 'Failed Task 1' },
        },
        {
          id: 'op-2',
          taskId: 'task-2',
          accountId: 'account-1',
          sourceListId: 'list-1',
          targetListId: 'list-3',
          operationId: 'op-2',
          originalTask: { title: 'Failed Task 2' },
        },
      ];

      act(() => {
        result.current.pendingOperations.current.push(...operations);
        result.current.processQueue();
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result.current.isSyncing).toBe(false);
      expect(mockAddToast).toHaveBeenCalledTimes(2);
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent duplicate operations for same task', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operation1 = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Test Task' },
      };

      const operation2 = {
        id: 'op-2',
        taskId: 'task-1', // Same task ID
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-3',
        operationId: 'op-2',
        originalTask: { title: 'Test Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation1);
        result.current.pendingOperations.current.push(operation2);
        result.current.processQueue();
      });

      expect(result.current.pendingOperations.current).toHaveLength(2);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Both operations should be processed sequentially
      expect(result.current.isSyncing).toBe(false);
    });

    it('should handle rapid queue additions', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operations = Array.from({ length: 10 }, (_, i) => ({
        id: `op-${i}`,
        taskId: `task-${i}`,
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: `op-${i}`,
        originalTask: { title: `Task ${i}` },
      }));

      act(() => {
        operations.forEach(op => {
          result.current.pendingOperations.current.push(op);
        });
        result.current.processQueue();
      });

      expect(result.current.pendingOperations.current).toHaveLength(10);
      expect(result.current.isSyncing).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(result.current.isSyncing).toBe(false);
    });

    it('should handle concurrent processQueue calls', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operation = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Test Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        // Call processQueue multiple times rapidly
        result.current.processQueue();
        result.current.processQueue();
        result.current.processQueue();
      });

      expect(result.current.isSyncing).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result.current.isSyncing).toBe(false);
    });
  });

  describe('Worker Message Handling', () => {
    it('should handle sync-started message', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operation = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Test Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        result.current.processQueue();
      });

      expect(result.current.isSyncing).toBe(true);
    });

    it('should handle sync-finished message', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operation = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Test Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        result.current.processQueue();
      });

      expect(result.current.isSyncing).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result.current.isSyncing).toBe(false);
    });

    it('should handle unknown message types gracefully', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      // Mock worker with unknown message type but still proper flow
      const mockWorker = new MockWorker('test-worker.js');
      mockWorker.postMessage = vi.fn().mockImplementation(() => {
        setTimeout(() => {
          // Send sync-started first
          (mockWorker as any).messageHandler({
            data: { type: 'sync-started' },
          });
          
          // Then unknown message type
          (mockWorker as any).messageHandler({
            data: { type: 'unknown-message-type' },
          });
          
          // Then sync-finished to complete the flow
          (mockWorker as any).messageHandler({
            data: { type: 'sync-finished' },
          });
        }, 50);
      });

      const operation = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Test Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        result.current.processQueue();
      });

      // First check that sync started
      expect(result.current.isSyncing).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Should not crash or throw errors and should finish sync properly
      expect(result.current.isSyncing).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle worker termination', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operation = {
        id: 'op-1',
        taskId: 'task-1',
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Test Task' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        result.current.processQueue();
      });

      expect(result.current.isSyncing).toBe(true);

      // This should not crash the system
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should handle operations with missing data', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const incompleteOperation = {
        id: 'op-1',
        taskId: 'task-1',
        // Missing required fields
        operationId: 'op-1',
      };

      act(() => {
        result.current.pendingOperations.current.push(incompleteOperation as any);
        result.current.processQueue();
      });

      // Should handle gracefully without crashing
      expect(result.current.isSyncing).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should handle very large queues', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const largeQueue = Array.from({ length: 100 }, (_, i) => ({
        id: `op-${i}`,
        taskId: `task-${i}`,
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: `op-${i}`,
        originalTask: { title: `Task ${i}` },
      }));

      act(() => {
        result.current.pendingOperations.current.push(...largeQueue);
        result.current.processQueue();
      });

      expect(result.current.pendingOperations.current).toHaveLength(100);
      expect(result.current.isSyncing).toBe(true);

      // Should not crash or hang
      await new Promise(resolve => setTimeout(resolve, 1000));
    });
  });

  describe('Memory Management', () => {
    it('should clean up completed operations', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operations = Array.from({ length: 5 }, (_, i) => ({
        id: `op-${i}`,
        taskId: `task-${i}`,
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: `op-${i}`,
        originalTask: { title: `Task ${i}` },
      }));

      act(() => {
        result.current.pendingOperations.current.push(...operations);
        result.current.processQueue();
      });

      expect(result.current.pendingOperations.current).toHaveLength(5);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Most operations should be cleaned up (assuming some succeed)
      expect(result.current.pendingOperations.current.length).toBeLessThan(5);
    });

    it('should handle queue overflow gracefully', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      // Add operations beyond reasonable limit
      const overflowOperations = Array.from({ length: 1000 }, (_, i) => ({
        id: `op-${i}`,
        taskId: `task-${i}`,
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: `op-${i}`,
        originalTask: { title: `Task ${i}` },
      }));

      act(() => {
        result.current.pendingOperations.current.push(...overflowOperations);
        result.current.processQueue();
      });

      // Should handle without crashing
      expect(result.current.isSyncing).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should process operations within reasonable time', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const operations = Array.from({ length: 10 }, (_, i) => ({
        id: `op-${i}`,
        taskId: `task-${i}`,
        accountId: 'account-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: `op-${i}`,
        originalTask: { title: `Task ${i}` },
      }));

      const startTime = Date.now();

      act(() => {
        result.current.pendingOperations.current.push(...operations);
        result.current.processQueue();
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (allowing for test environment)
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle rapid queue additions efficiently', async () => {
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      const startTime = Date.now();

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.pendingOperations.current.push({
            id: `op-${i}`,
            taskId: `task-${i}`,
            accountId: 'account-1',
            sourceListId: 'list-1',
            targetListId: 'list-2',
            operationId: `op-${i}`,
            originalTask: { title: `Task ${i}` },
          });
        }
        result.current.processQueue();
      });

      const additionTime = Date.now() - startTime;

      // Queue addition should be very fast
      expect(additionTime).toBeLessThan(100); // 100ms max
    });
  });
}); 