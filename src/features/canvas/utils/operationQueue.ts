/**
 * Operation Queue System
 * Prevents race conditions and ensures atomic operations in the canvas
 * Based on production readiness guidelines
 */

export interface QueuedOperation {
  id: string;
  operation: () => Promise<void>;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export class OperationQueue {
  private queue: QueuedOperation[] = [];
  private processing = false;
  private readonly maxRetries = 3;
  private readonly retryDelay = 100; // ms

  /**
   * Add an operation to the queue
   */
  async enqueue(
    operation: () => Promise<void>,
    options: {
      priority?: 'high' | 'normal' | 'low';
      maxRetries?: number;
      id?: string;
    } = {}
  ): Promise<void> {
    const queuedOp: QueuedOperation = {
      id: options.id || `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      priority: options.priority || 'normal',
      timestamp: Date.now(),
      retries: 0,
      maxRetries: options.maxRetries || this.maxRetries
    };

    // Insert based on priority
    const insertIndex = this.findInsertionIndex(queuedOp);
    this.queue.splice(insertIndex, 0, queuedOp);

    console.log(`⏳ [OPERATION QUEUE] Enqueued operation ${queuedOp.id} (priority: ${queuedOp.priority})`);

    // Start processing if not already running
    if (!this.processing) {
      await this.process();
    }
  }

  /**
   * Process all operations in the queue
   */
  private async process(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    console.log(`🔄 [OPERATION QUEUE] Starting to process ${this.queue.length} operations`);

    while (this.queue.length > 0) {
      const operation = this.queue.shift()!;
      
      try {
        console.log(`▶️ [OPERATION QUEUE] Executing operation ${operation.id}`);
        await operation.operation();
        console.log(`✅ [OPERATION QUEUE] Operation ${operation.id} completed`);
      } catch (error) {
        console.error(`❌ [OPERATION QUEUE] Operation ${operation.id} failed:`, error);
        
        // Retry logic
        if (operation.retries < operation.maxRetries) {
          operation.retries++;
          console.log(`🔄 [OPERATION QUEUE] Retrying operation ${operation.id} (attempt ${operation.retries}/${operation.maxRetries})`);
          
          // Add delay before retry
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * operation.retries));
          
          // Re-queue with same priority
          const insertIndex = this.findInsertionIndex(operation);
          this.queue.splice(insertIndex, 0, operation);
        } else {
          console.error(`💥 [OPERATION QUEUE] Operation ${operation.id} failed after ${operation.maxRetries} retries`);
          // Could emit an error event here for monitoring
        }
      }
    }

    this.processing = false;
    console.log(`🏁 [OPERATION QUEUE] Processing complete`);
  }

  /**
   * Find the correct insertion index based on priority
   */
  private findInsertionIndex(operation: QueuedOperation): number {
    const priorityOrder = { 'high': 0, 'normal': 1, 'low': 2 };
    const opPriority = priorityOrder[operation.priority];

    for (let i = 0; i < this.queue.length; i++) {
      const queuePriority = priorityOrder[this.queue[i].priority];
      if (opPriority < queuePriority) {
        return i;
      }
    }

    return this.queue.length;
  }

  /**
   * Cancel all pending operations
   */
  cancelAll(): void {
    const canceledCount = this.queue.length;
    this.queue = [];
    console.log(`🚫 [OPERATION QUEUE] Canceled ${canceledCount} pending operations`);
  }

  /**
   * Cancel operations by ID pattern
   */
  cancelByPattern(pattern: string | RegExp): number {
    const originalLength = this.queue.length;
    
    if (typeof pattern === 'string') {
      this.queue = this.queue.filter(op => !op.id.includes(pattern));
    } else {
      this.queue = this.queue.filter(op => !pattern.test(op.id));
    }

    const canceledCount = originalLength - this.queue.length;
    console.log(`🚫 [OPERATION QUEUE] Canceled ${canceledCount} operations matching pattern`);
    return canceledCount;
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      isProcessing: this.processing,
      queueLength: this.queue.length,
      operations: this.queue.map(op => ({
        id: op.id,
        priority: op.priority,
        retries: op.retries,
        age: Date.now() - op.timestamp
      }))
    };
  }
}

// Global operation queue instance
export const canvasOperationQueue = new OperationQueue();

/**
 * Utility functions for common canvas operations
 */
export const QueuedOperations = {
  /**
   * Queue an element update operation
   */
  async updateElement(elementId: string, updates: any, store: any): Promise<void> {
    return canvasOperationQueue.enqueue(
      async () => {
        store.getState().updateElement(elementId, updates);
      },
      {
        id: `update_element_${elementId}`,
        priority: 'normal'
      }
    );
  },

  /**
   * Queue an element deletion operation
   */
  async deleteElement(elementId: string, store: any): Promise<void> {
    return canvasOperationQueue.enqueue(
      async () => {
        store.getState().deleteElement(elementId);
      },
      {
        id: `delete_element_${elementId}`,
        priority: 'high' // Deletions should be processed quickly
      }
    );
  },

  /**
   * Queue a section move operation (affects many children)
   */
  async moveSection(sectionId: string, newPosition: { x: number; y: number }, store: any): Promise<void> {
    return canvasOperationQueue.enqueue(
      async () => {
        const state = store.getState();
        const section = state.elements[sectionId];
        if (!section) return;

        // Update section position
        state.updateElement(sectionId, newPosition);

        // Note: Child coordinate updates are handled automatically by the coordinate system
      },
      {
        id: `move_section_${sectionId}`,
        priority: 'normal',
        maxRetries: 5 // Section moves are critical
      }
    );
  },

  /**
   * Queue a batch update operation
   */
  async batchUpdate(updates: Array<{ id: string; updates: any }>, store: any): Promise<void> {
    return canvasOperationQueue.enqueue(
      async () => {
        const state = store.getState();
        updates.forEach(({ id, updates: elementUpdates }) => {
          state.updateElement(id, elementUpdates);
        });
      },
      {
        id: `batch_update_${Date.now()}`,
        priority: 'normal'
      }
    );
  }
};

/**
 * Debounced operation utilities
 */
export class DebouncedOperations {
  private static timers = new Map<string, NodeJS.Timeout>();

  /**
   * Debounce an operation by key
   */
  static debounce<T extends any[]>(
    key: string,
    operation: (...args: T) => Promise<void>,
    delay: number = 300
  ) {
    return (...args: T) => {
      // Clear existing timer
      const existingTimer = this.timers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          await operation(...args);
        } catch (error) {
          console.error(`❌ [DEBOUNCED OPERATION] ${key} failed:`, error);
        } finally {
          this.timers.delete(key);
        }
      }, delay);

      this.timers.set(key, timer);
    };
  }

  /**
   * Cancel a debounced operation
   */
  static cancel(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * Cancel all debounced operations
   */
  static cancelAll(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}
