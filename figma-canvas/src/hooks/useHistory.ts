import { useCallback, useEffect } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { useCanvasStore } from '../store/canvasStore';

export const useHistory = () => {
  const {
    history,
    currentIndex,
    maxHistorySize,
    isUndoing,
    isRedoing,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
    setMaxHistorySize,
    getCurrentState,
    getStateAt,
    getHistoryInfo
  } = useHistoryStore();

  const {
    elements,
    selectedIds,
    viewport,
    updateElement,
    selectElements,
    setViewport,
    clear: clearCanvas
  } = useCanvasStore();

  // Auto-save current state to history
  const saveCurrentState = useCallback((description: string) => {
    if (isUndoing || isRedoing) return;
    saveState(elements, selectedIds, viewport, description);
  }, [elements, selectedIds, viewport, saveState, isUndoing, isRedoing]);

  // Apply a history state to the canvas
  const applyHistoryState = useCallback((state: any) => {
    if (!state) return;

    // Clear current canvas state
    clearCanvas();

    // Apply elements
    Object.values(state.elements).forEach((element: any) => {
      updateElement(element.id, element);
    });

    // Apply selection
    selectElements(state.selectedIds);

    // Apply viewport
    setViewport(state.viewport);
  }, [clearCanvas, updateElement, selectElements, setViewport]);

  // Enhanced undo with state application
  const undoWithApplication = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      applyHistoryState(previousState);
      return true;
    }
    return false;
  }, [undo, applyHistoryState]);

  // Enhanced redo with state application
  const redoWithApplication = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      applyHistoryState(nextState);
      return true;
    }
    return false;
  }, [redo, applyHistoryState]);

  // Jump to specific history state
  const jumpToState = useCallback((index: number) => {
    const state = getStateAt(index);
    if (state) {
      // Update current index manually
      useHistoryStore.setState({ currentIndex: index });
      applyHistoryState(state);
      return true;
    }
    return false;
  }, [getStateAt, applyHistoryState]);

  // Keyboard shortcuts handler
  const handleKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undoWithApplication();
    } else if (isCtrlOrCmd && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault();
      redoWithApplication();
    }
  }, [undoWithApplication, redoWithApplication]);

  // History navigation
  const navigateHistory = useCallback((direction: 'back' | 'forward' | 'start' | 'end') => {
    const info = getHistoryInfo();
    let targetIndex = currentIndex;

    switch (direction) {
      case 'back':
        targetIndex = Math.max(0, currentIndex - 1);
        break;
      case 'forward':
        targetIndex = Math.min(info.total - 1, currentIndex + 1);
        break;
      case 'start':
        targetIndex = 0;
        break;
      case 'end':
        targetIndex = info.total - 1;
        break;
    }

    if (targetIndex !== currentIndex) {
      return jumpToState(targetIndex);
    }
    return false;
  }, [currentIndex, getHistoryInfo, jumpToState]);

  // History statistics
  const getHistoryStats = useCallback(() => {
    const info = getHistoryInfo();
    const memoryUsage = history.reduce((total, state) => {
      return total + JSON.stringify(state).length;
    }, 0);

    return {
      ...info,
      memoryUsage,
      averageStateSize: history.length > 0 ? memoryUsage / history.length : 0,
      isAtStart: currentIndex === 0,
      isAtEnd: currentIndex === info.total - 1,
      percentagePosition: info.total > 0 ? (currentIndex / (info.total - 1)) * 100 : 0
    };
  }, [history, currentIndex, getHistoryInfo]);

  // History compression (remove intermediate states)
  const compressHistory = useCallback((keepEveryNthState: number = 5) => {
    const compressedHistory = history.filter((_, index) => 
      index === 0 || // Keep first state
      index === history.length - 1 || // Keep last state
      index % keepEveryNthState === 0 // Keep every nth state
    );

    // Update the store directly (this would need to be exposed by the store)
    useHistoryStore.setState({
      history: compressedHistory,
      currentIndex: Math.min(currentIndex, compressedHistory.length - 1)
    });
  }, [history, currentIndex]);

  // Export history for backup
  const exportHistory = useCallback(() => {
    return {
      history,
      currentIndex,
      maxHistorySize,
      exportedAt: Date.now()
    };
  }, [history, currentIndex, maxHistorySize]);

  // Import history from backup
  const importHistory = useCallback((historyData: any) => {
    try {
      useHistoryStore.setState({
        history: historyData.history || [],
        currentIndex: historyData.currentIndex || 0,
        maxHistorySize: historyData.maxHistorySize || 50
      });
      return true;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  }, []);

  // Set up keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  return {
    // Basic operations
    saveCurrentState,
    undo: undoWithApplication,
    redo: redoWithApplication,
    canUndo,
    canRedo,
    clear,
    
    // Advanced operations
    jumpToState,
    navigateHistory,
    compressHistory,
    
    // State information
    getCurrentState,
    getStateAt,
    getHistoryInfo,
    getHistoryStats,
    
    // Configuration
    setMaxHistorySize,
    maxHistorySize,
    
    // Import/Export
    exportHistory,
    importHistory,
    
    // Current state
    history,
    currentIndex,
    isUndoing,
    isRedoing
  };
};

// Hook for automatic history saving with debouncing
export const useAutoHistory = (description: string, dependencies: any[], delay: number = 1000) => {
  const { saveCurrentState } = useHistory();

  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          saveCurrentState(description);
        }, delay);
      };
    })(),
    [saveCurrentState, description, delay]
  );

  useEffect(() => {
    debouncedSave();
  }, dependencies);
};

// Hook for history visualization
export const useHistoryVisualization = () => {
  const { history, currentIndex } = useHistoryStore();
  const { jumpToState } = useHistory();

  const historyItems = history.map((state, index) => ({
    id: state.id,
    description: state.description,
    timestamp: state.timestamp,
    isCurrent: index === currentIndex,
    isPast: index < currentIndex,
    isFuture: index > currentIndex,
    elementCount: Object.keys(state.elements).length,
    canNavigateTo: true
  }));

  const navigateToItem = useCallback((index: number) => {
    jumpToState(index);
  }, [jumpToState]);

  return {
    historyItems,
    currentIndex,
    navigateToItem
  };
};

// Hook for history performance monitoring
export const useHistoryPerformance = () => {
  const { history, getHistoryStats } = useHistory();

  const performance = getHistoryStats();
  
  const recommendations = [];

  if (performance.memoryUsage > 10 * 1024 * 1024) { // 10MB
    recommendations.push('Consider compressing history to reduce memory usage');
  }

  if (performance.total > 100) {
    recommendations.push('History is getting large, consider reducing max history size');
  }

  if (performance.averageStateSize > 500 * 1024) { // 500KB per state
    recommendations.push('States are quite large, consider optimizing element data');
  }

  return {
    ...performance,
    recommendations,
    isHealthy: recommendations.length === 0
  };
};

export default useHistory;
