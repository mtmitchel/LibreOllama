import { nanoid } from 'nanoid';
import { CanvasElement, ElementId } from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';

/**
 * Simplified history entry
 */
interface HistoryEntry {
  id: string;
  timestamp: number;
  operation: string;
  elementsSnapshot: Map<string, CanvasElement>;
  selectionSnapshot: Set<ElementId>;
}

/**
 * History module state
 */
export interface HistoryState {
  history: HistoryEntry[];
  currentHistoryIndex: number;
  currentIndex: number;
  maxHistorySize: number;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * History module actions
 */
export interface HistoryActions {
  addToHistory: (operation: string) => void;
  addHistoryEntry: (operation: string, metadata?: any) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  getHistoryLength: () => number;
  updateHistoryFlags: () => void;
}

/**
 * Creates the history module
 */
export const createHistoryModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<HistoryState, HistoryActions> => {
  return {
    state: {
      history: [],
      currentHistoryIndex: -1,
      currentIndex: -1,
      maxHistorySize: 50,
      canUndo: false,
      canRedo: false,
    },
    
    actions: {
      addToHistory: (operation) => {
        set(state => {
          // Simple history implementation
          const historyEntry = {
            id: nanoid(),
            timestamp: Date.now(),
            operation,
            elementsSnapshot: new Map(state.elements),
            selectionSnapshot: new Set(state.selectedElementIds)
          };
          
          // Remove future history if we're not at the end
          if (state.currentHistoryIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.currentHistoryIndex + 1);
          }
          
          // Add new entry
          state.history.push(historyEntry);
          state.currentHistoryIndex = state.history.length - 1;
          
          // Limit history size
          if (state.history.length > state.maxHistorySize) {
            state.history = state.history.slice(-state.maxHistorySize);
            state.currentHistoryIndex = state.history.length - 1;
          }
          
          // Update flags
          state.canUndo = state.currentHistoryIndex > 0;
          state.canRedo = state.currentHistoryIndex < state.history.length - 1;
        });
      },

      addHistoryEntry: (operation, metadata) => {
        set(state => {
          // Use the same logic as addToHistory for consistency
          const historyEntry = {
            id: nanoid(),
            timestamp: Date.now(),
            operation,
            elementsSnapshot: new Map(state.elements),
            selectionSnapshot: new Set(state.selectedElementIds)
          };
          
          // Remove future history if we're not at the end
          if (state.currentHistoryIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.currentHistoryIndex + 1);
          }
          
          // Add new entry
          state.history.push(historyEntry);
          state.currentHistoryIndex = state.history.length - 1;
          
          // Limit history size
          if (state.history.length > state.maxHistorySize) {
            state.history = state.history.slice(-state.maxHistorySize);
            state.currentHistoryIndex = state.history.length - 1;
          }
          
          // Update flags
          state.canUndo = state.currentHistoryIndex > 0;
          state.canRedo = state.currentHistoryIndex < state.history.length - 1;
          state.currentIndex = state.currentHistoryIndex;
        });
      },

      undo: () => {
        const state = get();
        if (state.canUndo && state.currentHistoryIndex > 0) {
          const targetIndex = state.currentHistoryIndex - 1;
          const targetEntry = state.history[targetIndex];
          
          if (targetEntry) {
            set(draft => {
              // Restore elements from history snapshot
              draft.elements = new Map(targetEntry.elementsSnapshot);
              draft.selectedElementIds = new Set(targetEntry.selectionSnapshot);
              
              // Update element order to match restored elements
              draft.elementOrder = Array.from(targetEntry.elementsSnapshot.keys());
              
              // Update history index
              draft.currentHistoryIndex = targetIndex;
              
              // Update history flags
              draft.canUndo = targetIndex > 0;
              draft.canRedo = targetIndex < draft.history.length - 1;
              draft.currentIndex = targetIndex;
            });
            
            console.log('✅ [Store] Undo successful - restored to:', targetEntry.operation);
          }
        }
      },
      
      redo: () => {
        const state = get();
        if (state.canRedo && state.currentHistoryIndex < state.history.length - 1) {
          const targetIndex = state.currentHistoryIndex + 1;
          const targetEntry = state.history[targetIndex];
          
          if (targetEntry) {
            set(draft => {
              // Restore elements from history snapshot
              draft.elements = new Map(targetEntry.elementsSnapshot);
              draft.selectedElementIds = new Set(targetEntry.selectionSnapshot);
              
              // Update element order to match restored elements
              draft.elementOrder = Array.from(targetEntry.elementsSnapshot.keys());
              
              // Update history index
              draft.currentHistoryIndex = targetIndex;
              
              // Update history flags
              draft.canUndo = targetIndex > 0;
              draft.canRedo = targetIndex < draft.history.length - 1;
              draft.currentIndex = targetIndex;
            });
            
            console.log('✅ [Store] Redo successful - restored to:', targetEntry.operation);
          }
        }
      },
      
      clearHistory: () => {
        set(state => {
          state.history = [];
          state.currentHistoryIndex = -1;
          state.canUndo = false;
          state.canRedo = false;
          state.currentIndex = -1;
        });
      },
      
      getHistoryLength: () => {
        return get().history.length;
      },

      updateHistoryFlags: () => {
        // Empty implementation for API compatibility
      },
    },
  };
};