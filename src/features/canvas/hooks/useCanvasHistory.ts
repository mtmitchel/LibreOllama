// src/hooks/canvas/useCanvasHistory.ts
import { useCallback } from 'react';
import { useCanvasStore } from '../stores';

/**
 * useCanvasHistory - Undo/redo operations from history store
 * - Integrates with canvas history store for undo/redo functionality
 * - Provides convenient methods for history management
 * - Handles history grouping and performance tracking
 */
export const useCanvasHistory = () => {
  // Use unified store selectors for history functionality
  const history = useCanvasStore((state) => state.history);
  const currentIndex = useCanvasStore((state) => state.currentIndex);
  const canUndo = useCanvasStore((state) => state.canUndo);
  const canRedo = useCanvasStore((state) => state.canRedo);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const addHistoryEntry = useCanvasStore((state) => state.addHistoryEntry);
  const clearHistory = useCanvasStore((state) => state.clearHistory);
  const getHistoryLength = useCanvasStore((state) => state.getHistoryLength);
  // Perform undo operation
  const performUndo = useCallback(() => {
    if (canUndo()) {
      const patches = undo();
      return patches;
    }
    return null;
  }, [canUndo, undo]);

  // Perform redo operation
  const performRedo = useCallback(() => {
    if (canRedo()) {
      const patches = redo();
      return patches;
    }
    return null;
  }, [canRedo, redo]);

  // Add a new history entry with optional metadata
  const addToHistory = useCallback((
    action: string,
    patches: any[] = [],
    inversePatches: any[] = [],
    metadata?: {
      elementIds?: string[];
      operationType?: 'create' | 'update' | 'delete' | 'move' | 'format';
      affectedCount?: number;
    }
  ) => {
    addHistoryEntry(action, patches, inversePatches, metadata);
  }, [addHistoryEntry]);

  // Clear all history
  const clearAllHistory = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  // Get current history state
  const getHistoryState = useCallback(() => {
    return {
      length: getHistoryLength(),
      currentIndex,
      canUndo: canUndo(),
      canRedo: canRedo(),
      hasHistory: getHistoryLength() > 0
    };
  }, [getHistoryLength, currentIndex, canUndo, canRedo]);

  // Get history summary for UI display
  const getHistorySummary = useCallback(() => {
    const state = getHistoryState();
    const recentEntries = history.slice(Math.max(0, currentIndex - 4), currentIndex + 1);
    
    return {
      ...state,
      recentActions: recentEntries.map(entry => ({
        action: entry.action,
        timestamp: entry.timestamp,
        metadata: entry.metadata
      }))
    };
  }, [getHistoryState, history, currentIndex]);

  // Batch multiple operations into a single history entry
  const batchOperations = useCallback((
    batchName: string,
    operations: () => void,
    metadata?: any
  ) => {
    // For now, just execute operations and add a single history entry
    // In a more sophisticated implementation, this would group operations
    operations();
    addToHistory(batchName, [], [], {
      isBatch: true,
      ...metadata
    });
  }, [addToHistory]);

  // Check if we can navigate to a specific point in history
  const canNavigateToIndex = useCallback((index: number) => {
    return index >= 0 && index < getHistoryLength();
  }, [getHistoryLength]);

  // Get undo/redo button states for UI
  const getButtonStates = useCallback(() => {
    const state = getHistoryState();
    return {
      undo: {
        enabled: state.canUndo,        tooltip: state.canUndo && currentIndex >= 0 && history.get(currentIndex) 
          ? `Undo: ${history.get(currentIndex)!.action}` 
          : 'Nothing to undo'
      },
      redo: {
        enabled: state.canRedo,        tooltip: state.canRedo && currentIndex + 1 < history.getSize() && history.get(currentIndex + 1)
          ? `Redo: ${history.get(currentIndex + 1)?.action || 'Unknown action'}`
          : 'Nothing to redo'
      }
    };
  }, [getHistoryState, currentIndex, history]);
  // Get memory usage statistics for history
  const getMemoryUsage = useCallback(() => {
    // Estimate memory usage based on history entries using the available methods
    let estimatedSize = 0;
    for (let i = 0; i < history.getSize(); i++) {
      const entry = history.get(i);
      if (entry) {
        estimatedSize += JSON.stringify(entry).length;
      }
    }

    return {
      estimatedBytes: estimatedSize,
      estimatedKB: Math.round(estimatedSize / 1024),
      entryCount: history.getSize(),
      averageEntrySize: history.getSize() > 0 ? Math.round(estimatedSize / history.getSize()) : 0
    };
  }, [history]);
  return {
    // State
    history,
    currentIndex,
    
    // Basic operations
    performUndo,
    performRedo,
    addToHistory,
    clearAllHistory,
    
    // State checks
    canUndo: canUndo(),
    canRedo: canRedo(),
    hasHistory: getHistoryLength() > 0,
    historyLength: getHistoryLength(),
    
    // Utility functions
    getHistoryState,
    getHistorySummary,
    batchOperations,
    canNavigateToIndex,
    getButtonStates,
    getMemoryUsage
  };
};