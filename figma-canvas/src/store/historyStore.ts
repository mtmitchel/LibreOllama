import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { CanvasElement, HistoryState, Viewport } from '../types/canvas';

interface HistoryStore {
  history: HistoryState[];
  currentIndex: number;
  maxHistorySize: number;
  isUndoing: boolean;
  isRedoing: boolean;
  
  // Actions
  saveState: (elements: Record<string, CanvasElement>, selectedIds: string[], viewport: Viewport, description: string) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
  setMaxHistorySize: (size: number) => void;
  
  // Batch operations
  startBatch: () => void;
  endBatch: (description: string) => void;
  
  // State queries
  getCurrentState: () => HistoryState | null;
  getStateAt: (index: number) => HistoryState | null;
  getHistoryInfo: () => {
    current: number;
    total: number;
    canUndo: boolean;
    canRedo: boolean;
  };
}

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    history: [],
    currentIndex: -1,
    maxHistorySize: 50,
    isUndoing: false,
    isRedoing: false,

    saveState: (elements, selectedIds, viewport, description) => {
      const { isUndoing, isRedoing, maxHistorySize } = get();
      
      // Don't save state during undo/redo operations
      if (isUndoing || isRedoing) return;

      const newState: HistoryState = {
        id: uuidv4(),
        timestamp: Date.now(),
        elements: JSON.parse(JSON.stringify(elements)), // Deep clone
        selectedIds: [...selectedIds],
        viewport: { ...viewport },
        description
      };

      set((state) => {
        // Remove any states after current index (for branching)
        if (state.currentIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.currentIndex + 1);
        }

        // Add new state
        state.history.push(newState);
        state.currentIndex = state.history.length - 1;

        // Maintain max history size
        if (state.history.length > maxHistorySize) {
          const removeCount = state.history.length - maxHistorySize;
          state.history = state.history.slice(removeCount);
          state.currentIndex -= removeCount;
        }
      });
    },

    undo: () => {
      const { currentIndex, history } = get();
      
      if (currentIndex <= 0) return null;

      set((state) => {
        state.isUndoing = true;
        state.currentIndex = currentIndex - 1;
      });

      const previousState = history[currentIndex - 1];
      
      // Reset the undoing flag after a short delay
      setTimeout(() => {
        set((state) => {
          state.isUndoing = false;
        });
      }, 0);

      return previousState;
    },

    redo: () => {
      const { currentIndex, history } = get();
      
      if (currentIndex >= history.length - 1) return null;

      set((state) => {
        state.isRedoing = true;
        state.currentIndex = currentIndex + 1;
      });

      const nextState = history[currentIndex + 1];
      
      // Reset the redoing flag after a short delay
      setTimeout(() => {
        set((state) => {
          state.isRedoing = false;
        });
      }, 0);

      return nextState;
    },

    canUndo: () => {
      const { currentIndex } = get();
      return currentIndex > 0;
    },

    canRedo: () => {
      const { currentIndex, history } = get();
      return currentIndex < history.length - 1;
    },

    clear: () => {
      set((state) => {
        state.history = [];
        state.currentIndex = -1;
        state.isUndoing = false;
        state.isRedoing = false;
      });
    },

    setMaxHistorySize: (size) => {
      set((state) => {
        state.maxHistorySize = Math.max(1, size);
        
        // Trim history if needed
        if (state.history.length > state.maxHistorySize) {
          const removeCount = state.history.length - state.maxHistorySize;
          state.history = state.history.slice(removeCount);
          state.currentIndex = Math.max(0, state.currentIndex - removeCount);
        }
      });
    },

    startBatch: () => {
      // For batch operations, we could implement a batch counter
      // For now, this is a placeholder for future enhancement
    },

    endBatch: (description) => {
      // This would save the final state after a batch of operations
      // For now, this is a placeholder for future enhancement
    },

    getCurrentState: () => {
      const { currentIndex, history } = get();
      return currentIndex >= 0 && currentIndex < history.length ? history[currentIndex] : null;
    },

    getStateAt: (index) => {
      const { history } = get();
      return index >= 0 && index < history.length ? history[index] : null;
    },

    getHistoryInfo: () => {
      const { currentIndex, history } = get();
      return {
        current: currentIndex,
        total: history.length,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1
      };
    }
  }))
);

// Hook for automatic history saving
export const useAutoSaveHistory = () => {
  const saveState = useHistoryStore(state => state.saveState);
  
  return {
    saveHistory: (elements: Record<string, CanvasElement>, selectedIds: string[], viewport: Viewport, description: string) => {
      // Debounce rapid saves to avoid cluttering history
      const debouncedSave = debounce(() => {
        saveState(elements, selectedIds, viewport, description);
      }, 300);
      
      debouncedSave();
    }
  };
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Hook for keyboard shortcuts
export const useHistoryKeyboard = () => {
  const { undo, redo, canUndo, canRedo } = useHistoryStore();
  
  const handleKeyDown = (event: KeyboardEvent) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      if (canUndo()) {
        undo();
      }
    } else if (isCtrlOrCmd && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault();
      if (canRedo()) {
        redo();
      }
    }
  };

  return { handleKeyDown };
};

// History visualization component data
export const useHistoryVisualization = () => {
  const { history, currentIndex } = useHistoryStore();
  
  return {
    historyItems: history.map((state, index) => ({
      id: state.id,
      description: state.description,
      timestamp: state.timestamp,
      isCurrent: index === currentIndex,
      canNavigateTo: true
    })),
    currentIndex
  };
};
