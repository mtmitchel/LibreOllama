/**
 * Operation Queue for Canvas State Management
 * Prevents race conditions and ensures ordered execution of canvas operations
 */

export interface QueuedOperation {
  id: string;
  operation: () => Promise<void>;
  priority: 'low' | 'medium' | 'high';
  timeout?: number;
  retries?: number;
}

export interface OperationQueueOptions {
  concurrency?: number;
  defaultTimeout?: number;
  maxRetries?: number;
  onError?: (error: Error, operation: QueuedOperation) => void;
  onSuccess?: (operation: QueuedOperation) => void;
}

export class OperationQueue {
  private queue: QueuedOperation[] = [];
  private processing = new Set<string>();
  private options: Required<OperationQueueOptions>;

  constructor(options: OperationQueueOptions = {}) {
    this.options = {
      concurrency: 1,
      defaultTimeout: 5000,
      maxRetries: 3,
      onError: (error, op) => console.error(`Operation ${op.id} failed:`, error),
      onSuccess: (op) => console.debug(`Operation ${op.id} completed`),
      ...options
    };
  }

  /**
   * Add operation to queue with priority handling
   */
  async enqueue(operation: Omit<QueuedOperation, 'id'>): Promise<void> {
    const queuedOp: QueuedOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retries: 0,
      timeout: this.options.defaultTimeout,
      ...operation
    };

    // Insert based on priority
    const insertIndex = this.findInsertIndex(queuedOp.priority);
    this.queue.splice(insertIndex, 0, queuedOp);

    // Start processing if under concurrency limit
    if (this.processing.size < this.options.concurrency) {
      await this.processNext();
    }
  }

  /**
   * Process the next operation in queue
   */
  private async processNext(): Promise<void> {
    if (this.queue.length === 0 || this.processing.size >= this.options.concurrency) {
      return;
    }

    const operation = this.queue.shift();
    if (!operation) return;

    this.processing.add(operation.id);

    try {
      // Execute with timeout
      await this.executeWithTimeout(operation);
      this.options.onSuccess(operation);
    } catch (error) {
      await this.handleError(error as Error, operation);
    } finally {
      this.processing.delete(operation.id);
      
      // Process next operation
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout(operation: QueuedOperation): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation ${operation.id} timed out after ${operation.timeout}ms`));
      }, operation.timeout);

      operation.operation()
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Handle operation errors with retry logic
   */
  private async handleError(error: Error, operation: QueuedOperation): Promise<void> {
    operation.retries = (operation.retries || 0) + 1;

    if (operation.retries <= this.options.maxRetries) {
      // Retry with exponential backoff
      const delay = Math.pow(2, operation.retries) * 100;
      setTimeout(() => {
        this.queue.unshift(operation); // Add to front for retry
        this.processNext();
      }, delay);
    } else {
      this.options.onError(error, operation);
    }
  }
  /**
   * Find insertion index based on priority
   */
  private findInsertIndex(priority: QueuedOperation['priority']): number {
    const priorities = { high: 3, medium: 2, low: 1 };
    const targetWeight = priorities[priority];    for (let i = 0; i < this.queue.length; i++) {
      const queueItem = this.queue[i];
      if (!queueItem) continue;
      const currentWeight = priorities[queueItem.priority] || 1;
      if (targetWeight > currentWeight) {
        return i;
      }
    }
    return this.queue.length;
  }

  /**
   * Clear all pending operations
   */
  clear(): void {
    this.queue.length = 0;
  }

  /**
   * Get queue status
   */
  getStatus(): {
    pending: number;
    processing: number;
    capacity: number;
  } {
    return {
      pending: this.queue.length,
      processing: this.processing.size,
      capacity: this.options.concurrency
    };
  }

  /**
   * Wait for all operations to complete
   */
  async flush(): Promise<void> {
    while (this.queue.length > 0 || this.processing.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

/**
 * Singleton operation queue for canvas operations
 */
export const canvasOperationQueue = new OperationQueue({
  concurrency: 1, // Single-threaded for state consistency
  defaultTimeout: 10000,
  maxRetries: 2,
  onError: (error, operation) => {
    console.error(`Canvas operation ${operation.id} failed:`, error);
    // Could integrate with error tracking service here
  }
});

/**
 * Helper functions for common canvas operations
 */
export const queueCanvasOperation = async (
  operation: () => Promise<void>,
  priority: QueuedOperation['priority'] = 'medium'
): Promise<void> => {
  return canvasOperationQueue.enqueue({
    operation,
    priority
  });
};

/**
 * Queue element update operation
 */
export const queueElementUpdate = async (
  _elementId: string,
  updateFn: () => Promise<void>
): Promise<void> => {
  return queueCanvasOperation(
    updateFn,
    'high'
  );
};

/**
 * Queue bulk operation
 */
export const queueBulkOperation = async (
  _operationName: string,
  operation: () => Promise<void>
): Promise<void> => {
  return queueCanvasOperation(
    operation,
    'low'
  );
};
