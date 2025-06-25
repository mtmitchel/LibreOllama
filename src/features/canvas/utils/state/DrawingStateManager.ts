/**
 * Drawing State Recovery System
 * Addresses drawing state management issues and provides recovery mechanisms
 * Solves: "Section drawing aborts", state tracking failures, race conditions
 */

import { logger } from '@/lib/logger';
import { CanvasTool } from '../../types/enhanced.types';

export interface DrawingState {
  isDrawing: boolean;
  tool: CanvasTool | null;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  preview: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export interface DrawingStateSnapshot {
  state: DrawingState;
  timestamp: number;
  operationId: string;
}

export class DrawingStateManager {
  private currentState: DrawingState = {
    isDrawing: false,
    tool: null,
    startPoint: null,
    currentPoint: null,
    preview: null,
  };

  private stateHistory: DrawingStateSnapshot[] = [];
  private readonly maxHistorySize = 50;
  private operationTimeouts = new Map<string, NodeJS.Timeout>();
  private currentOperationId: string | null = null;

  /**
   * Start a drawing operation with automatic timeout protection
   */
  startDrawing(
    tool: CanvasTool,
    startPoint: { x: number; y: number },
    timeoutMs: number = 30000 // 30 second timeout
  ): string {
    const operationId = `draw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Cancel any existing operation
    this.cancelCurrentOperation();

    // Update state
    this.currentState = {
      isDrawing: true,
      tool,
      startPoint,
      currentPoint: startPoint,
      preview: null,
    };

    this.currentOperationId = operationId;
    this.saveStateSnapshot(operationId);

    // Set timeout protection
    const timeout = setTimeout(() => {
      logger.warn('Drawing operation timed out, auto-recovering:', operationId);
      this.recoverFromFailedOperation(operationId, 'timeout');
    }, timeoutMs);

    this.operationTimeouts.set(operationId, timeout);

    logger.log('Drawing state: Started operation', { operationId, tool, startPoint });
    return operationId;
  }

  /**
   * Update drawing state with validation
   */
  updateDrawing(
    operationId: string,
    currentPoint: { x: number; y: number },
    preview?: { x: number; y: number; width: number; height: number }
  ): boolean {
    if (!this.validateOperation(operationId)) {
      logger.warn('Drawing state: Invalid operation update attempt', operationId);
      return false;
    }

    if (!this.currentState.isDrawing || !this.currentState.startPoint) {
      logger.warn('Drawing state: Update attempted on inactive drawing state');
      this.recoverFromFailedOperation(operationId, 'invalid_state');
      return false;
    }

    // Validate coordinates
    if (!this.isValidCoordinate(currentPoint)) {
      logger.warn('Drawing state: Invalid coordinates provided', currentPoint);
      return false;
    }

    this.currentState.currentPoint = currentPoint;
    if (preview) {
      this.currentState.preview = preview;
    }

    return true;
  }

  /**
   * Complete drawing operation with validation
   */
  completeDrawing(operationId: string): DrawingState | null {
    if (!this.validateOperation(operationId)) {
      logger.warn('Drawing state: Invalid operation completion attempt', operationId);
      return null;
    }

    if (!this.currentState.isDrawing) {
      logger.warn('Drawing state: Completion attempted on inactive drawing state');
      return null;
    }

    // Validate final state
    if (!this.isValidDrawingCompletion()) {
      logger.warn('Drawing state: Invalid final drawing state, aborting');
      this.cancelCurrentOperation();
      return null;
    }

    const completedState = { ...this.currentState };
    this.cleanupOperation(operationId);
    
    logger.log('Drawing state: Operation completed successfully', operationId);
    return completedState;
  }

  /**
   * Cancel current drawing operation
   */
  cancelCurrentOperation(): void {
    if (this.currentOperationId) {
      this.cleanupOperation(this.currentOperationId);
      logger.log('Drawing state: Operation cancelled', this.currentOperationId);
    }
  }

  /**
   * Get current drawing state (defensive copy)
   */
  getCurrentState(): DrawingState {
    return {
      ...this.currentState,
      startPoint: this.currentState.startPoint ? { ...this.currentState.startPoint } : null,
      currentPoint: this.currentState.currentPoint ? { ...this.currentState.currentPoint } : null,
      preview: this.currentState.preview ? { ...this.currentState.preview } : null,
    };
  }

  /**
   * Check if currently in a drawing operation
   */
  isCurrentlyDrawing(): boolean {
    return this.currentState.isDrawing && this.currentOperationId !== null;
  }

  /**
   * Recover from failed operation with error context
   */
  private recoverFromFailedOperation(operationId: string, reason: string): void {
    logger.warn('Drawing state: Recovering from failed operation', { operationId, reason });
    
    // Attempt to restore from previous valid state
    const lastValidState = this.findLastValidState();
    if (lastValidState) {
      this.currentState = { ...lastValidState.state };
      logger.log('Drawing state: Restored from previous valid state');
    } else {
      // Reset to clean state
      this.resetToCleanState();
      logger.log('Drawing state: Reset to clean state');
    }

    this.cleanupOperation(operationId);
  }

  /**
   * Validate operation ID and state consistency
   */
  private validateOperation(operationId: string): boolean {
    if (operationId !== this.currentOperationId) {
      return false;
    }
    return this.operationTimeouts.has(operationId);
  }

  /**
   * Validate coordinates are finite and reasonable
   */
  private isValidCoordinate(point: { x: number; y: number }): boolean {
    return (
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      Math.abs(point.x) < 1000000 &&
      Math.abs(point.y) < 1000000
    );
  }

  /**
   * Validate that drawing can be completed successfully
   */
  private isValidDrawingCompletion(): boolean {
    const { startPoint, currentPoint, preview } = this.currentState;
    
    if (!startPoint || !currentPoint) {
      return false;
    }

    // For section drawing, ensure minimum size
    if (preview) {
      const minSize = 2; // Matches the existing validation
      return Math.abs(preview.width) >= minSize && Math.abs(preview.height) >= minSize;
    }

    // For other drawing types, ensure points are different
    const distance = Math.sqrt(
      Math.pow(currentPoint.x - startPoint.x, 2) + 
      Math.pow(currentPoint.y - startPoint.y, 2)
    );
    return distance > 1;
  }

  /**
   * Save state snapshot for recovery
   */
  private saveStateSnapshot(operationId: string): void {
    const snapshot: DrawingStateSnapshot = {
      state: { ...this.currentState },
      timestamp: Date.now(),
      operationId,
    };

    this.stateHistory.push(snapshot);
    
    // Limit history size
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Find last valid drawing state
   */
  private findLastValidState(): DrawingStateSnapshot | null {
    for (let i = this.stateHistory.length - 1; i >= 0; i--) {
      const snapshot = this.stateHistory[i];
      if (!snapshot.state.isDrawing) {
        return snapshot;
      }
    }
    return null;
  }

  /**
   * Reset to completely clean state
   */
  private resetToCleanState(): void {
    this.currentState = {
      isDrawing: false,
      tool: null,
      startPoint: null,
      currentPoint: null,
      preview: null,
    };
    this.currentOperationId = null;
  }

  /**
   * Clean up operation resources
   */
  private cleanupOperation(operationId: string): void {
    const timeout = this.operationTimeouts.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      this.operationTimeouts.delete(operationId);
    }

    if (this.currentOperationId === operationId) {
      this.resetToCleanState();
    }
  }

  /**
   * Get state diagnostics for debugging
   */
  getStateDiagnostics(): {
    currentState: DrawingState;
    activeOperations: number;
    historySize: number;
    currentOperationId: string | null;
  } {
    return {
      currentState: this.getCurrentState(),
      activeOperations: this.operationTimeouts.size,
      historySize: this.stateHistory.length,
      currentOperationId: this.currentOperationId,
    };
  }
}

// Export singleton instance
export const drawingStateManager = new DrawingStateManager();
