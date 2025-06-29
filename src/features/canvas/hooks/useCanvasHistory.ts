// src/hooks/canvas/useCanvasHistory.ts
import { useCallback } from 'react';
import { useUnifiedCanvasStore } from '../../../stores';

/**
 * useCanvasHistory - Undo/redo operations from history store
 * - Integrates with canvas history store for undo/redo functionality
 * - Provides convenient methods for history management
 * - Handles history grouping and performance tracking
 */
export const useCanvasHistory = () => {
  // Use unified store selectors for history functionality
  const history = useUnifiedCanvasStore((state) => state.history);
  const currentIndex = useUnifiedCanvasStore((state) => state.currentIndex);
  const canUndo = useUnifiedCanvasStore((state) => state.canUndo);
  const canRedo = useUnifiedCanvasStore((state) => state.canRedo);
  const undo = useUnifiedCanvasStore((state) => state.undo);
  const redo = useUnifiedCanvasStore((state) => state.redo);
  const addHistoryEntry = useUnifiedCanvasStore((state) => state.addHistoryEntry);
  const clearHistory = useUnifiedCanvasStore((state) => state.clearHistory);
  const getHistoryLength = useUnifiedCanvasStore((state) => state.getHistoryLength);
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
    addHistoryEntry(action, metadata); // Simplified signature for unified store
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
        action: entry.operation, // Use 'operation' instead of 'action'
        timestamp: entry.timestamp,
        metadata: {} // No metadata in simplified interface
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
        enabled: state.canUndo,        tooltip: state.canUndo && currentIndex >= 0 && history[currentIndex] 
          ? `Undo: ${history[currentIndex]!.operation}` 
          : 'Nothing to undo'
      },
      redo: {
        enabled: state.canRedo,        tooltip: state.canRedo && currentIndex + 1 < history.length && history[currentIndex + 1]
          ? `Redo: ${history[currentIndex + 1]?.operation || 'Unknown action'}`
          : 'Nothing to redo'
      }
    };
  }, [getHistoryState, currentIndex, history]);
  // Get memory usage statistics for history
  const getMemoryUsage = useCallback(() => {
    // Estimate memory usage based on history entries using the available methods
    let estimatedSize = 0;
    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      if (entry) {
        estimatedSize += JSON.stringify(entry).length;
      }
    }

    return {
      estimatedBytes: estimatedSize,
      estimatedKB: Math.round(estimatedSize / 1024),
      entryCount: history.length,
      averageEntrySize: history.length > 0 ? Math.round(estimatedSize / history.length) : 0
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