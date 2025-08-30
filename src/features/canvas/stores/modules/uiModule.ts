import { ElementId } from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';
import { LoadingOperation } from '../../hooks/useLoadingStates';
import { recordCanvasMetric } from '../../utils/performance/performanceTracker';

/**
 * UI module state (includes loading functionality from loadingModule)
 */
export interface UIState {
  selectedTool: string;
  textEditingElementId: ElementId | null;
  selectedStickyNoteColor: string;
  penColor: string;
  showGrid: boolean;
  snapToGrid: boolean;
  isUploading: boolean;
  snapLines: number[]; // Added snapLines state
  visibleElementIds: Set<ElementId>;
  
  // Resize protection flags to prevent snap-back
  resizingId: ElementId | null;
  resizeShadow: { id: ElementId; width: number; height: number; fontSize?: number } | null;

  // Loading states (merged from loadingModule)
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

/**
 * UI module actions (includes loading functionality from loadingModule)
 */
export interface UIActions {
  setSelectedTool: (tool: string) => void;
  setTextEditingElement: (id: ElementId | null) => void;
  setSelectedStickyNoteColor: (color: string) => void;
  setPenColor: (color: string) => void;
  setSnapLines: (lines: number[]) => void; // Added setSnapLines action
  setVisibleElementIds: (ids: Set<ElementId>) => void;
  
  // Resize protection actions
  setResizingId: (id: ElementId | null) => void;
  setResizeShadow: (shadow: { id: ElementId; width: number; height: number; fontSize?: number } | null) => void;
  
  // Legacy compatibility
  setStickyNoteColor: (color: string) => void;
  setActiveTool: (tool: string) => void;
  
  // Utility methods
  uploadImage: (file: File, position: { x: number; y: number }) => Promise<void>;
  findNearestSnapPoint: (pointer: { x: number; y: number }, snapRadius?: number) => any;
  toggleLayersPanel: () => void;

  // Loading actions (merged from loadingModule)
  setGlobalLoading: (isLoading: boolean, operation?: LoadingOperation, message?: string) => void;
  updateGlobalProgress: (progress: number, message?: string) => void;
  setElementLoading: (elementId: ElementId, isLoading: boolean, operation?: LoadingOperation, message?: string) => void;
  updateElementProgress: (elementId: ElementId, progress: number, message?: string) => void;
  startOperation: (operationId: string, operation: LoadingOperation, message: string, elementIds?: ElementId[]) => string;
  updateOperationProgress: (operationId: string, progress: number, message?: string) => void;
  finishOperation: (operationId: string, error?: Error) => void;
  startBulkOperation: (operation: LoadingOperation, total: number, message: string) => void;
  updateBulkProgress: (completed: number, message?: string) => void;
  finishBulkOperation: (error?: Error) => void;
  clearAllLoadingStates: () => void;
  isElementLoading: (elementId: ElementId) => boolean;
  isOperationActive: (operation: LoadingOperation) => boolean;
  getActiveOperationsCount: () => number;
}

/**
 * Creates the UI module
 */
export const createUIModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<UIState, UIActions> => {
  // Cast the set and get functions to work with any state for flexibility
  const setState = set as any;
  const getState = get as any;

  return {
    state: {
      selectedTool: 'select',
      textEditingElementId: null,
      selectedStickyNoteColor: '#FFF2CC',
      penColor: '#000000',
      showGrid: true,
      snapToGrid: false,
      isUploading: false,
      snapLines: [], // Initialize snapLines
      visibleElementIds: new Set<ElementId>(),
      
      // Resize protection flags
      resizingId: null,
      resizeShadow: null,

      // Loading states (merged from loadingModule)
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
    },
    
    actions: {
      setSelectedTool: (tool) => setState((state: any) => { state.selectedTool = tool; }),

      setTextEditingElement: (id) => {
        // Log the state change for debugging in development
        if (process.env.NODE_ENV === 'development') {
          const currentId = getState().textEditingElementId;
          // Removed excessive logging
          
          // If we're setting a new element while another is being edited,
          // we need to ensure cleanup happens
          if (currentId && id && currentId !== id) {
            // Switching text editing focus
          }
        }
        
        setState((state: any) => { state.textEditingElementId = id; });
      },

      setSelectedStickyNoteColor: (color) => setState((state: any) => { state.selectedStickyNoteColor = color; }),

      setPenColor: (color) => setState((state: any) => { state.penColor = color; }),

      setSnapLines: (lines) => setState((state: any) => { state.snapLines = lines; }), // Added implementation for setSnapLines

      setVisibleElementIds: (ids) => setState((state: any) => { state.visibleElementIds = ids; }),
      
      // Resize protection actions
      setResizingId: (id) => setState((state: any) => { state.resizingId = id; }),
      setResizeShadow: (shadow) => setState((state: any) => { state.resizeShadow = shadow; }),

      // Legacy compatibility
      setStickyNoteColor: (color) => setState((state: any) => { state.selectedStickyNoteColor = color; }),
      setActiveTool: (tool) => setState((state: any) => { state.selectedTool = tool; }),

      // Utility methods
      uploadImage: async (file, position) => {
        setState((state: any) => { state.isUploading = true; });
        try {
          // Create image element from uploaded file
          const imageUrl = URL.createObjectURL(file);
          const imageElement = {
            id: `image-${Date.now()}`,
            type: 'image',
            x: position.x,
            y: position.y,
            width: 200,
            height: 150,
            src: imageUrl,
            draggable: true,
            visible: true,
          };
          getState().addElement(imageElement);
        } finally {
          setState((state: any) => { state.isUploading = false; });
        }
      },

      findNearestSnapPoint: (pointer, snapRadius) => {
        // Implementation placeholder for snap point finding
        return {};
      },

      toggleLayersPanel: () => {
        // Implementation placeholder for layers panel toggle
      },

      // Loading actions (merged from loadingModule)
      setGlobalLoading: (isLoading, operation, message) => {
        setState((draft: any) => {
          draft.isGlobalLoading = isLoading;
          draft.globalOperation = isLoading ? (operation || null) : null;
          draft.globalMessage = isLoading ? (message || 'Loading...') : '';
          draft.globalProgress = isLoading ? 0 : 100;
        });
      },

      updateGlobalProgress: (progress, message) => {
        setState((draft: any) => {
          if (draft.isGlobalLoading) {
            draft.globalProgress = Math.max(0, Math.min(100, progress));
            if (message) draft.globalMessage = message;
          }
        });
      },

      setElementLoading: (elementId, isLoading, operation, message) => {
        setState((draft: any) => {
          // Defensive check - ensure elementLoadingStates Map exists
          if (!draft.elementLoadingStates || !(draft.elementLoadingStates instanceof Map)) {
            draft.elementLoadingStates = new Map();
          }
          
          if (isLoading && operation) {
            draft.elementLoadingStates.set(elementId, {
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
        setState((draft: any) => {
          const state = draft.elementLoadingStates.get(elementId);
          if (state) {
            state.progress = Math.max(0, Math.min(100, progress));
            if (message) state.message = message;
          }
        });
      },

      startOperation: (operationId, operation, message, elementIds) => {
        setState((draft: any) => {
          // Defensive check - ensure operationLoadingStates Map exists
          if (!draft.operationLoadingStates || !(draft.operationLoadingStates instanceof Map)) {
            draft.operationLoadingStates = new Map();
          }
          
          draft.operationLoadingStates.set(operationId, {
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
        setState((draft: any) => {
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

        setState((draft: any) => {
          draft.operationLoadingStates.delete(operationId);
        });
      },

      startBulkOperation: (operation, total, message) => {
        setState((draft: any) => {
          draft.isBulkLoading = true;
          draft.bulkOperation = operation;
          draft.bulkTotal = total;
          draft.bulkCompleted = 0;
          draft.bulkProgress = 0;
          draft.bulkMessage = message;
        });
      },

      updateBulkProgress: (completed, message) => {
        setState((draft: any) => {
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

        setState((draft: any) => {
          draft.isBulkLoading = false;
          draft.bulkOperation = null;
          draft.bulkProgress = 0;
          draft.bulkTotal = 0;
          draft.bulkCompleted = 0;
          draft.bulkMessage = '';
        });
      },

      clearAllLoadingStates: () => {
        setState((draft: any) => {
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
    },
  };
};