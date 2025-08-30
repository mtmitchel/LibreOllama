/**
 * EMERGENCY: RAF Batching System
 * Batches all canvas operations to prevent violations
 */

interface BatchedOperation {
  id: string;
  operation: () => void;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
}

interface RAFBatchState {
  pendingOperations: BatchedOperation[];
  isProcessing: boolean;
  rafId?: number;
  frameBudget: number;
  violationCount: number;
}

// Global RAF batch state
const rafBatchState: RAFBatchState = {
  pendingOperations: [],
  isProcessing: false,
  frameBudget: 8, // Conservative 8ms budget
  violationCount: 0,
};

// Global RAF ID tracking for emergency cleanup
(window as any).__CANVAS_RAF_IDS__ = [];

// EMERGENCY: RAF Batcher for all canvas operations
export class EmergencyRafBatcher {
  private static instance: EmergencyRafBatcher;
  
  public static getInstance(): EmergencyRafBatcher {
    if (!EmergencyRafBatcher.instance) {
      EmergencyRafBatcher.instance = new EmergencyRafBatcher();
    }
    return EmergencyRafBatcher.instance;
  }
  
  private constructor() {
    // Monitor frame budget violations
    this.setupViolationMonitoring();
  }
  
  // Batch a canvas operation
  public batchOperation(
    id: string, 
    operation: () => void, 
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): void {
    // Remove existing operation with same ID
    rafBatchState.pendingOperations = rafBatchState.pendingOperations.filter(
      op => op.id !== id
    );
    
    // Add new operation
    rafBatchState.pendingOperations.push({
      id,
      operation,
      priority,
      timestamp: performance.now(),
    });
    
    // Schedule processing if not already scheduled
    if (!rafBatchState.isProcessing) {
      this.scheduleProcessing();
    }
  }
  
  // Schedule RAF processing
  private scheduleProcessing(): void {
    if (rafBatchState.isProcessing) return;
    
    rafBatchState.isProcessing = true;
    
    const rafId = requestAnimationFrame(() => {
      this.processOperations();
    });
    
    // Track RAF ID for emergency cleanup
    (window as any).__CANVAS_RAF_IDS__.push(rafId);
    rafBatchState.rafId = rafId;
  }
  
  // Process batched operations within frame budget
  private processOperations(): void {
    const startTime = performance.now();
    const operations = [...rafBatchState.pendingOperations];
    
    // Sort by priority and timestamp
    operations.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });
    
    let processedCount = 0;
    const maxOperations = 50; // Safety limit
    
    // Process operations within frame budget
    for (const operation of operations) {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;
      
      // Check frame budget and safety limits
      if (elapsed > rafBatchState.frameBudget || processedCount >= maxOperations) {
        console.warn(`RAF budget exceeded: ${elapsed}ms (${processedCount} operations)`);
        break;
      }
      
      try {
        operation.operation();
        
        // Remove processed operation
        rafBatchState.pendingOperations = rafBatchState.pendingOperations.filter(
          op => op.id !== operation.id
        );
        
        processedCount++;
      } catch (error) {
        console.error(`RAF operation failed (${operation.id}):`, error);
        
        // Remove failed operation
        rafBatchState.pendingOperations = rafBatchState.pendingOperations.filter(
          op => op.id !== operation.id
        );
      }
    }
    
    const totalTime = performance.now() - startTime;
    
    // Check for violations
    if (totalTime > 16) {
      rafBatchState.violationCount++;
      console.warn(`RAF violation: ${totalTime}ms (${processedCount} operations)`);
      
      // Emergency budget reduction
      if (rafBatchState.violationCount > 5) {
        rafBatchState.frameBudget = Math.max(4, rafBatchState.frameBudget - 1);
        console.warn(`Reduced RAF budget to ${rafBatchState.frameBudget}ms`);
      }
    }
    
    // Schedule next frame if operations remain
    rafBatchState.isProcessing = false;
    
    if (rafBatchState.pendingOperations.length > 0) {
      this.scheduleProcessing();
    }
    
    // Clean up RAF ID
    const rafIndex = (window as any).__CANVAS_RAF_IDS__.indexOf(rafBatchState.rafId);
    if (rafIndex > -1) {
      (window as any).__CANVAS_RAF_IDS__.splice(rafIndex, 1);
    }
  }
  
  // Setup violation monitoring
  private setupViolationMonitoring(): void {
    if (typeof PerformanceObserver === 'undefined') return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'requestAnimationFrame callback' && entry.duration > 16) {
            rafBatchState.violationCount++;
            
            // Emergency response
            if (rafBatchState.violationCount > 10) {
              this.emergencyStop('Too many RAF violations');
            }
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('RAF violation monitoring not available:', error);
    }
  }
  
  // Emergency stop all operations
  public emergencyStop(reason: string): void {
    console.error(`🛑 EMERGENCY: RAF Batcher stopped - ${reason}`);
    
    // Cancel current RAF
    if (rafBatchState.rafId) {
      cancelAnimationFrame(rafBatchState.rafId);
    }
    
    // Cancel all tracked RAF IDs
    (window as any).__CANVAS_RAF_IDS__.forEach(cancelAnimationFrame);
    (window as any).__CANVAS_RAF_IDS__ = [];
    
    // Clear pending operations
    rafBatchState.pendingOperations = [];
    rafBatchState.isProcessing = false;
    rafBatchState.rafId = undefined;
    
    // Set emergency mode
    (window as any).CANVAS_EMERGENCY_MODE = true;
  }
  
  // Get current status
  public getStatus() {
    return {
      pendingOperations: rafBatchState.pendingOperations.length,
      isProcessing: rafBatchState.isProcessing,
      frameBudget: rafBatchState.frameBudget,
      violationCount: rafBatchState.violationCount,
    };
  }
  
  // Clear all operations
  public clearAll(): void {
    rafBatchState.pendingOperations = [];
  }
}

// Global instance for easy access
export const emergencyRafBatcher = EmergencyRafBatcher.getInstance();

// Convenience functions
export const batchCanvasOperation = (
  id: string, 
  operation: () => void, 
  priority: 'high' | 'normal' | 'low' = 'normal'
): void => {
  emergencyRafBatcher.batchOperation(id, operation, priority);
};

export const emergencyStopRAF = (reason: string): void => {
  emergencyRafBatcher.emergencyStop(reason);
};

export const getRAFStatus = () => {
  return emergencyRafBatcher.getStatus();
};

// Optimized drawing operation wrapper
export const batchDrawingOperation = (
  layerId: string,
  drawOperation: () => void,
  priority: 'high' | 'normal' | 'low' = 'high'
): void => {
  batchCanvasOperation(
    `draw-${layerId}-${Date.now()}`,
    () => {
      try {
        drawOperation();
      } catch (error) {
        console.error(`Drawing operation failed for ${layerId}:`, error);
      }
    },
    priority
  );
};

// Canvas layer redraw batcher
export const batchLayerRedraw = (layer: any, priority: 'high' | 'normal' | 'low' = 'high'): void => {
  if (!layer || typeof layer.batchDraw !== 'function') return;
  
  const layerId = layer.id() || 'unknown-layer';
  
  batchCanvasOperation(
    `redraw-${layerId}`,
    () => {
      if (layer.isVisible && layer.isVisible()) {
        layer.batchDraw();
      }
    },
    priority
  );
};