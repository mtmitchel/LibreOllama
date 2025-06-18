// src/stores/slices/canvasHistoryStore.ts
/**
 * Canvas History Store - Undo/redo functionality using Immer patches
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 */

import { StateCreator } from 'zustand';
import { Draft } from 'immer';
import { Patch, applyPatches } from 'immer';
import { PerformanceMonitor } from '../../../../utils/performance/PerformanceMonitor';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  patches: Patch[];
  inversePatches: Patch[];
  metadata?: {
    elementIds?: string[];
    operationType?: 'create' | 'update' | 'delete' | 'move' | 'format';
    affectedCount?: number;
  };
}

export interface CanvasHistoryState {
  // History stack
  history: HistoryEntry[];
  currentIndex: number;
  maxHistorySize: number;
  
  // History grouping
  isGrouping: boolean;
  currentGroupId: string | null;
  groupStartTime: number;
  maxGroupDuration: number; // milliseconds
  
  // Performance tracking
  historyMetrics: {
    undoOperations: number;
    redoOperations: number;
    totalHistoryEntries: number;
    averageUndoTime: number;
    averageRedoTime: number;
    memoryUsage: number;
  };
  
  // History operations
  addHistoryEntry: (action: string, patches: Patch[], inversePatches: Patch[], metadata?: HistoryEntry['metadata']) => void;
  undo: () => Patch[] | null;
  redo: () => Patch[] | null;
  
  // Grouping operations
  startHistoryGroup: (groupId?: string) => void;
  endHistoryGroup: () => void;
  isInGroup: () => boolean;
  
  // History queries
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistoryLength: () => number;
  getCurrentHistoryEntry: () => HistoryEntry | null;
  getHistoryPreview: (maxEntries?: number) => HistoryEntry[];
  
  // History management
  clearHistory: () => void;
  clearRedoHistory: () => void;
  compactHistory: () => void;
  setMaxHistorySize: (size: number) => void;
  
  // Advanced operations
  jumpToHistoryIndex: (index: number) => Patch[] | null;
  findHistoryEntry: (predicate: (entry: HistoryEntry) => boolean) => HistoryEntry | null;
  getHistoryStatistics: () => {
    totalEntries: number;
    oldestEntry: number;
    newestEntry: number;
    mostCommonAction: string;
    memoryFootprint: number;
  };
  
  // Performance utilities
  getHistoryPerformance: () => { avgUndoTime: number; avgRedoTime: number; operationCount: number };
  resetHistoryMetrics: () => void;
  optimizeHistoryMemory: () => void;
}

export const createCanvasHistoryStore: StateCreator<
  CanvasHistoryState,
  [['zustand/immer', never]],
  [],
  CanvasHistoryState
> = (set, get) => ({
  // Initial state
  history: [],
  currentIndex: -1,
  maxHistorySize: 100,
  
  // Grouping state
  isGrouping: false,
  currentGroupId: null,
  groupStartTime: 0,
  maxGroupDuration: 5000, // 5 seconds
  
  // Performance metrics
  historyMetrics: {
    undoOperations: 0,
    redoOperations: 0,
    totalHistoryEntries: 0,
    averageUndoTime: 0,
    averageRedoTime: 0,
    memoryUsage: 0
  },

  // History operations
  addHistoryEntry: (action: string, patches: Patch[], inversePatches: Patch[], metadata?: HistoryEntry['metadata']) => {
    const endTiming = PerformanceMonitor.startTiming('addHistoryEntry');
    
    try {
      console.log('📚 [HISTORY STORE] Adding history entry:', action, patches.length, 'patches');
      
      set((state: Draft<CanvasHistoryState>) => {
        const now = performance.now();
        const entryId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Check if we should group this with the previous entry
        const shouldGroup = state.isGrouping && 
                           state.currentGroupId && 
                           (now - state.groupStartTime) < state.maxGroupDuration &&
                           state.history.length > 0;
        
        if (shouldGroup) {
          // Merge with the last entry in the current group
          const lastEntry = state.history[state.currentIndex];
          if (lastEntry && lastEntry.metadata?.operationType === metadata?.operationType) {
            lastEntry.patches.push(...patches);
            lastEntry.inversePatches.unshift(...inversePatches);
            lastEntry.timestamp = now;
            
            if (metadata?.elementIds) {
              const existingIds = new Set(lastEntry.metadata?.elementIds || []);
              metadata.elementIds.forEach(id => existingIds.add(id));
              lastEntry.metadata = {
                ...lastEntry.metadata,
                ...metadata,
                elementIds: Array.from(existingIds)
              };
            }
            
            console.log('📚 [HISTORY STORE] Entry merged with group:', state.currentGroupId);
            return;
          }
        }
        
        // Create new history entry
        const newEntry: HistoryEntry = {
          id: entryId,
          timestamp: now,
          action,
          patches,
          inversePatches,
          ...(metadata && { metadata })
        };
        
        // Remove any redo history when adding new entry
        if (state.currentIndex < state.history.length - 1) {
          state.history.splice(state.currentIndex + 1);
        }
        
        // Add new entry
        state.history.push(newEntry);
        state.currentIndex = state.history.length - 1;
        
        // Enforce history size limit
        if (state.history.length > state.maxHistorySize) {
          const removeCount = state.history.length - state.maxHistorySize;
          state.history.splice(0, removeCount);
          state.currentIndex -= removeCount;
        }
        
        // Update metrics
        state.historyMetrics.totalHistoryEntries++;
        state.historyMetrics.memoryUsage = state.history.length * 100; // Rough estimate
        
        console.log('✅ [HISTORY STORE] History entry added successfully:', entryId);
      });
      
      PerformanceMonitor.recordMetric('historyEntryAdded', patches.length, 'canvas', {
        action,
        grouped: get().isGrouping,
        totalEntries: get().history.length
      });
    } finally {
      endTiming();
    }
  },

  undo: () => {
    const endTiming = PerformanceMonitor.startTiming('undoOperation');
    
    try {
      const { history, currentIndex } = get();
      
      if (currentIndex < 0 || currentIndex >= history.length) {
        console.log('📚 [HISTORY STORE] Cannot undo: no history available');
        return null;
      }
      
      const entry = history[currentIndex];
      if (!entry) {
        console.log('📚 [HISTORY STORE] Cannot undo: entry not found');
        return null;
      }
      
      console.log('↶ [HISTORY STORE] Undoing action:', entry.action);
      
      set((state: Draft<CanvasHistoryState>) => {
        state.currentIndex--;
        state.historyMetrics.undoOperations++;
      });
      
      PerformanceMonitor.recordMetric('undoOperation', 1, 'canvas', {
        action: entry.action,
        patchCount: entry.inversePatches.length
      });
      
      console.log('✅ [HISTORY STORE] Undo completed, returning patches:', entry.inversePatches.length);
      return entry.inversePatches;
    } finally {
      endTiming();
    }
  },

  redo: () => {
    const endTiming = PerformanceMonitor.startTiming('redoOperation');
    
    try {
      const { history, currentIndex } = get();
      
      if (currentIndex >= history.length - 1) {
        console.log('📚 [HISTORY STORE] Cannot redo: no redo history available');
        return null;
      }
      
      const entry = history[currentIndex + 1];
      if (!entry) {
        console.log('📚 [HISTORY STORE] Cannot redo: entry not found');
        return null;
      }
      
      console.log('↷ [HISTORY STORE] Redoing action:', entry.action);
      
      set((state: Draft<CanvasHistoryState>) => {
        state.currentIndex++;
        state.historyMetrics.redoOperations++;
      });
      
      PerformanceMonitor.recordMetric('redoOperation', 1, 'canvas', {
        action: entry.action,
        patchCount: entry.patches.length
      });
      
      console.log('✅ [HISTORY STORE] Redo completed, returning patches:', entry.patches.length);
      return entry.patches;
    } finally {
      endTiming();
    }
  },

  // Grouping operations
  startHistoryGroup: (groupId?: string) => {
    const id = groupId || `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    set((state: Draft<CanvasHistoryState>) => {
      state.isGrouping = true;
      state.currentGroupId = id;
      state.groupStartTime = performance.now();
    });
    
    console.log('📚 [HISTORY STORE] Started history group:', id);
  },

  endHistoryGroup: () => {
    set((state: Draft<CanvasHistoryState>) => {
      state.isGrouping = false;
      state.currentGroupId = null;
      state.groupStartTime = 0;
    });
    
    console.log('📚 [HISTORY STORE] Ended history group');
  },

  isInGroup: (): boolean => {
    return get().isGrouping;
  },

  // History queries
  canUndo: (): boolean => {
    const { currentIndex } = get();
    return currentIndex >= 0;
  },

  canRedo: (): boolean => {
    const { history, currentIndex } = get();
    return currentIndex < history.length - 1;
  },

  getHistoryLength: (): number => {
    return get().history.length;
  },

  getCurrentHistoryEntry: (): HistoryEntry | null => {
    const { history, currentIndex } = get();
    return currentIndex >= 0 && currentIndex < history.length ? history[currentIndex]! : null;
  },

  getHistoryPreview: (maxEntries: number = 10): HistoryEntry[] => {
    const { history, currentIndex } = get();
    const start = Math.max(0, currentIndex - maxEntries + 1);
    const end = Math.min(history.length, currentIndex + maxEntries);
    return history.slice(start, end);
  },

  // History management
  clearHistory: () => {
    const endTiming = PerformanceMonitor.startTiming('clearHistory');
    
    try {
      const historyLength = get().history.length;
      console.log('📚 [HISTORY STORE] Clearing history:', historyLength, 'entries');
      
      set((state: Draft<CanvasHistoryState>) => {
        state.history = [];
        state.currentIndex = -1;
        state.isGrouping = false;
        state.currentGroupId = null;
        state.historyMetrics.memoryUsage = 0;
      });
      
      PerformanceMonitor.recordMetric('historyClear', historyLength, 'canvas');
      
      console.log('✅ [HISTORY STORE] History cleared');
    } finally {
      endTiming();
    }
  },

  clearRedoHistory: () => {
    set((state: Draft<CanvasHistoryState>) => {
      if (state.currentIndex < state.history.length - 1) {
        const removedCount = state.history.length - state.currentIndex - 1;
        state.history.splice(state.currentIndex + 1);
        state.historyMetrics.memoryUsage = state.history.length * 100;
        
        console.log('📚 [HISTORY STORE] Cleared redo history:', removedCount, 'entries');
      }
    });
  },

  compactHistory: () => {
    const endTiming = PerformanceMonitor.startTiming('compactHistory');
    
    try {
      console.log('📚 [HISTORY STORE] Compacting history');
      
      set((state: Draft<CanvasHistoryState>) => {
        const originalLength = state.history.length;
        
        // Remove entries older than 1 hour
        const oneHourAgo = performance.now() - (60 * 60 * 1000);
        const compactedHistory = state.history.filter(entry => 
          entry.timestamp > oneHourAgo || 
          state.history.indexOf(entry) > state.currentIndex - 10 // Keep last 10 entries
        );
        
        const adjustedIndex = Math.max(-1, state.currentIndex - (originalLength - compactedHistory.length));
        
        state.history = compactedHistory;
        state.currentIndex = adjustedIndex;
        state.historyMetrics.memoryUsage = state.history.length * 100;
        
        console.log('✅ [HISTORY STORE] History compacted:', originalLength, '->', compactedHistory.length);
      });
      
      PerformanceMonitor.recordMetric('historyCompact', 1, 'canvas');
    } finally {
      endTiming();
    }
  },

  setMaxHistorySize: (size: number) => {
    set((state: Draft<CanvasHistoryState>) => {
      state.maxHistorySize = Math.max(10, Math.min(1000, size));
      
      // Trim history if it exceeds new limit
      if (state.history.length > state.maxHistorySize) {
        const removeCount = state.history.length - state.maxHistorySize;
        state.history.splice(0, removeCount);
        state.currentIndex = Math.max(-1, state.currentIndex - removeCount);
        state.historyMetrics.memoryUsage = state.history.length * 100;
      }
    });
    
    console.log('📚 [HISTORY STORE] Max history size set to:', size);
  },

  // Advanced operations
  jumpToHistoryIndex: (index: number): Patch[] | null => {
    const { history, currentIndex } = get();
    
    if (index < -1 || index >= history.length) {
      console.log('📚 [HISTORY STORE] Invalid history index:', index);
      return null;
    }
    
    console.log('📚 [HISTORY STORE] Jumping to history index:', index);
    
    // Calculate patches needed to reach target state
    const patches: Patch[] = [];
    
    if (index < currentIndex) {
      // Moving backward - apply inverse patches
      for (let i = currentIndex; i > index; i--) {
        const entry = history[i];
        if (entry) {
          patches.push(...entry.inversePatches);
        }
      }
    } else if (index > currentIndex) {
      // Moving forward - apply forward patches
      for (let i = currentIndex + 1; i <= index; i++) {
        const entry = history[i];
        if (entry) {
          patches.push(...entry.patches);
        }
      }
    }
    
    set((state: Draft<CanvasHistoryState>) => {
      state.currentIndex = index;
    });
    
    PerformanceMonitor.recordMetric('historyJump', Math.abs(index - currentIndex), 'canvas');
    
    return patches;
  },

  findHistoryEntry: (predicate: (entry: HistoryEntry) => boolean): HistoryEntry | null => {
    return get().history.find(predicate) || null;
  },

  getHistoryStatistics: () => {
    const { history } = get();
    
    if (history.length === 0) {
      return {
        totalEntries: 0,
        oldestEntry: 0,
        newestEntry: 0,
        mostCommonAction: '',
        memoryFootprint: 0
      };
    }
    
    const actions = history.map(entry => entry.action);
    const actionCounts = actions.reduce((acc, action) => {
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonAction = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    
    return {
      totalEntries: history.length,
      oldestEntry: history[0]?.timestamp || 0,
      newestEntry: history[history.length - 1]?.timestamp || 0,
      mostCommonAction,
      memoryFootprint: history.length * 100 // Rough estimate
    };
  },

  // Performance utilities
  getHistoryPerformance: () => {
    const { historyMetrics } = get();
    
    return {
      avgUndoTime: historyMetrics.averageUndoTime,
      avgRedoTime: historyMetrics.averageRedoTime,
      operationCount: historyMetrics.undoOperations + historyMetrics.redoOperations
    };
  },

  resetHistoryMetrics: () => {
    set((state: Draft<CanvasHistoryState>) => {
      state.historyMetrics = {
        undoOperations: 0,
        redoOperations: 0,
        totalHistoryEntries: 0,
        averageUndoTime: 0,
        averageRedoTime: 0,
        memoryUsage: state.history.length * 100
      };
    });
    
    console.log('📚 [HISTORY STORE] History metrics reset');
  },

  optimizeHistoryMemory: () => {
    const endTiming = PerformanceMonitor.startTiming('optimizeHistoryMemory');
    
    try {
      console.log('📚 [HISTORY STORE] Optimizing history memory usage');
      
      set((state: Draft<CanvasHistoryState>) => {
        // Compact similar consecutive operations
        const optimizedHistory: HistoryEntry[] = [];
        
        for (let i = 0; i < state.history.length; i++) {
          const current = state.history[i];
          const next = state.history[i + 1];
          
          if (!current) continue;
          
          // If next entry is similar and within time threshold, skip current
          if (next &&
              current.action === next.action &&
              next.timestamp - current.timestamp < 1000 && // 1 second threshold
              current.metadata?.operationType === next.metadata?.operationType) {
            continue; // Skip current entry
          }
          
          optimizedHistory.push(current);
        }
        
        const originalLength = state.history.length;
        state.history = optimizedHistory;
        
        // Adjust current index
        state.currentIndex = Math.min(state.currentIndex, optimizedHistory.length - 1);
        state.historyMetrics.memoryUsage = optimizedHistory.length * 100;
        
        console.log('✅ [HISTORY STORE] Memory optimized:', originalLength, '->', optimizedHistory.length);
      });
      
      PerformanceMonitor.recordMetric('historyMemoryOptimize', 1, 'canvas');
    } finally {
      endTiming();
    }
  }
});