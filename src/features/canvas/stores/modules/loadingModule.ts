/**
 * Loading Module for Unified Canvas Store
 * 
 * Manages loading states for all canvas operations:
 * - Element operations (create, update, delete)
 * - Store operations (save, load)
 * - File operations
 * - Bulk operations
 */

import { LoadingOperation } from '../../hooks/useLoadingStates';
import { ElementId } from '../../types/enhanced.types';
import { recordCanvasMetric } from '../../monitoring/canvasMonitor';

export interface LoadingState {
  // Global loading state
  isGlobalLoading: boolean;
  globalOperation: LoadingOperation | null;
  globalMessage: string;
  globalProgress: number;
  
  // Element-specific loading states
  elementLoadingStates: Map<ElementId, {
    operation: LoadingOperation;
    message: string;
    progress: number;
    startTime: number;
  }>;
  
  // Operation-specific loading states
  operationLoadingStates: Map<string, {
    operation: LoadingOperation;
    message: string;
    progress: number;
    startTime: number;
    elementIds?: ElementId[];
  }>;
  
  // Bulk operation state
  isBulkLoading: boolean;
  bulkOperation: LoadingOperation | null;
  bulkProgress: number;
  bulkTotal: number;
  bulkCompleted: number;
  bulkMessage: string;
}

export interface LoadingActions {
  // Global loading actions
  setGlobalLoading: (
    isLoading: boolean,
    operation?: LoadingOperation,
    message?: string
  ) => void;
  updateGlobalProgress: (progress: number, message?: string) => void;
  
  // Element loading actions
  setElementLoading: (
    elementId: ElementId,
    isLoading: boolean,
    operation?: LoadingOperation,
    message?: string
  ) => void;
  updateElementProgress: (elementId: ElementId, progress: number, message?: string) => void;
  
  // Operation loading actions
  startOperation: (
    operationId: string,
    operation: LoadingOperation,
    message: string,
    elementIds?: ElementId[]
  ) => string;
  updateOperationProgress: (operationId: string, progress: number, message?: string) => void;
  finishOperation: (operationId: string, error?: Error) => void;
  
  // Bulk operation actions
  startBulkOperation: (
    operation: LoadingOperation,
    total: number,
    message: string
  ) => void;
  updateBulkProgress: (completed: number, message?: string) => void;
  finishBulkOperation: (error?: Error) => void;
  
  // Utility actions
  clearAllLoadingStates: () => void;
  isElementLoading: (elementId: ElementId) => boolean;
  isOperationActive: (operation: LoadingOperation) => boolean;
  getActiveOperationsCount: () => number;
}

type Set = (fn: (draft: any) => void) => void;
type Get = () => any;

export const createLoadingModule = (set: Set, get: Get) => {
  // Create properly named functions for clarity
  const setState = set;
  const getState = get;
  
  const initialState: LoadingState = {
    isGlobalLoading: false,
    globalOperation: null,
    globalMessage: '',
    globalProgress: 0,
    elementLoadingStates: new Map(),
    operationLoadingStates: new Map(),
    isBulkLoading: false,
    bulkOperation: null,
    bulkProgress: 0,
    bulkTotal: 0,
    bulkCompleted: 0,
    bulkMessage: ''
  };

  const actions: LoadingActions = {
    setGlobalLoading: (isLoading, operation, message) => {
      setState((draft) => {
        draft.isGlobalLoading = isLoading;
        draft.globalOperation = isLoading ? (operation || null) : null;
        draft.globalMessage = isLoading ? (message || 'Loading...') : '';
        draft.globalProgress = isLoading ? 0 : 100;
      });
    },

    updateGlobalProgress: (progress, message) => {
      setState((draft) => {
        if (draft.isGlobalLoading) {
          draft.globalProgress = Math.max(0, Math.min(100, progress));
          if (message) draft.globalMessage = message;
        }
      });
    },

    setElementLoading: (elementId, isLoading, operation, message) => {
      setState((draft) => {
        // Defensive check - ensure elementLoadingStates Map exists
        if (!draft.elementLoadingStates || !(draft.elementLoadingStates instanceof Map)) {
          draft.elementLoadingStates = new Map();
        }
        
        if (isLoading && operation) {
          draft.elementLoadingStates.setState(elementId, {
            operation,
            message: message || 'Processing element...',
            progress: 0,
            startTime: performance.now()
          });
        } else {
          const state = draft.elementLoadingStates.get(elementId);
          if (state) {
            const duration = performance.now() - state.startTime;
            recordCanvasMetric(
              `element-${state.operation}`,
              duration,
              'interaction',
              { elementId }
            );
          }
          draft.elementLoadingStates.delete(elementId);
        }
      });
    },

    updateElementProgress: (elementId, progress, message) => {
      setState((draft) => {
        const state = draft.elementLoadingStates.get(elementId);
        if (state) {
          state.progress = Math.max(0, Math.min(100, progress));
          if (message) state.message = message;
        }
      });
    },

    startOperation: (operationId, operation, message, elementIds) => {
      setState((draft) => {
        // Defensive check - ensure operationLoadingStates Map exists
        if (!draft.operationLoadingStates || !(draft.operationLoadingStates instanceof Map)) {
          draft.operationLoadingStates = new Map();
        }
        
        draft.operationLoadingStates.setState(operationId, {
          operation,
          message,
          progress: 0,
          startTime: performance.now(),
          elementIds
        });
      });
      return operationId;
    },

    updateOperationProgress: (operationId, progress, message) => {
      setState((draft) => {
        const state = draft.operationLoadingStates.get(operationId);
        if (state) {
          state.progress = Math.max(0, Math.min(100, progress));
          if (message) state.message = message;
        }
      });
    },

    finishOperation: (operationId, error) => {
      const state = getState().operationLoadingStates.get(operationId);
      if (state) {
        const duration = performance.now() - state.startTime;
        recordCanvasMetric(
          `operation-${state.operation}`,
          duration,
          error ? 'error' : 'interaction',
          {
            operationId,
            success: !error,
            error: error?.message,
            elementCount: state.elementIds?.length
          }
        );
      }

      setState((draft) => {
        draft.operationLoadingStates.delete(operationId);
      });
    },

    startBulkOperation: (operation, total, message) => {
      setState((draft) => {
        draft.isBulkLoading = true;
        draft.bulkOperation = operation;
        draft.bulkTotal = total;
        draft.bulkCompleted = 0;
        draft.bulkProgress = 0;
        draft.bulkMessage = message;
      });
    },

    updateBulkProgress: (completed, message) => {
      setState((draft) => {
        if (draft.isBulkLoading) {
          draft.bulkCompleted = completed;
          draft.bulkProgress = draft.bulkTotal > 0 
            ? (completed / draft.bulkTotal) * 100 
            : 0;
          if (message) draft.bulkMessage = message;
        }
      });
    },

    finishBulkOperation: (error) => {
      const state = getState();
      if (state.isBulkLoading && state.bulkOperation) {
        recordCanvasMetric(
          `bulk-${state.bulkOperation}`,
          0, // Duration tracked elsewhere
          error ? 'error' : 'interaction',
          {
            total: state.bulkTotal,
            completed: state.bulkCompleted,
            success: !error,
            error: error?.message
          }
        );
      }

      setState((draft) => {
        draft.isBulkLoading = false;
        draft.bulkOperation = null;
        draft.bulkProgress = 0;
        draft.bulkTotal = 0;
        draft.bulkCompleted = 0;
        draft.bulkMessage = '';
      });
    },

    clearAllLoadingStates: () => {
      setState((draft) => {
        draft.isGlobalLoading = false;
        draft.globalOperation = null;
        draft.globalMessage = '';
        draft.globalProgress = 0;
        draft.elementLoadingStates.clear();
        draft.operationLoadingStates.clear();
        draft.isBulkLoading = false;
        draft.bulkOperation = null;
        draft.bulkProgress = 0;
        draft.bulkTotal = 0;
        draft.bulkCompleted = 0;
        draft.bulkMessage = '';
      });
    },

    isElementLoading: (elementId) => {
      return getState().elementLoadingStates.has(elementId);
    },

    isOperationActive: (operation) => {
      const state = getState();
      if (state.globalOperation === operation || state.bulkOperation === operation) {
        return true;
      }
      
      for (const loadingState of state.elementLoadingStates.values()) {
        if (loadingState.operation === operation) return true;
      }
      
      for (const loadingState of state.operationLoadingStates.values()) {
        if (loadingState.operation === operation) return true;
      }
      
      return false;
    },

    getActiveOperationsCount: () => {
      const state = getState();
      let count = 0;
      
      if (state.isGlobalLoading) count++;
      if (state.isBulkLoading) count++;
      count += state.elementLoadingStates.size;
      count += state.operationLoadingStates.size;
      
      return count;
    }
  };

  return {
    state: initialState,
    actions
  };
};