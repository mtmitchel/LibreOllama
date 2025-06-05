/**
 * Auto-Save Hook
 * 
 * Reusable React hook for auto-save functionality with debounced save operations,
 * save status management, and integration with the global auto-save system.
 * 
 * Features:
 * - Debounced save operations (configurable delay)
 * - Save status management (saving, saved, error)
 * - Integration with existing state management
 * - Optimistic updates with rollback on error
 * - TypeScript support with strict typing
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { autoSaveSystem, type ContentType, type SaveStatus, type AutoSaveConfig } from '../lib/auto-save-system';

export interface UseAutoSaveOptions<T> {
  contentType: ContentType;
  contentId: string;
  saveHandler: (data: T, metadata?: any) => Promise<boolean>;
  debounceMs?: number;
  enableOptimisticUpdates?: boolean;
  onSaveSuccess?: (data: T) => void;
  onSaveError?: (error: string, data: T) => void;
  onStatusChange?: (status: SaveStatus) => void;
}

export interface UseAutoSaveReturn<T> {
  // Save functions
  autoSave: (data: T, metadata?: any) => void;
  forceSave: (data: T, metadata?: any) => Promise<boolean>;
  
  // Status
  saveStatus: SaveStatus;
  isSaving: boolean;
  isSaved: boolean;
  hasError: boolean;
  isOnline: boolean;
  
  // Utilities
  clearError: () => void;
  retry: () => void;
}

/**
 * Hook for auto-save functionality
 */
export function useAutoSave<T = any>(options: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const {
    contentType,
    contentId,
    saveHandler,
    debounceMs = 500,
    enableOptimisticUpdates = true,
    onSaveSuccess,
    onSaveError,
    onStatusChange
  } = options;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>(() => 
    autoSaveSystem.getSaveStatus(contentId)
  );
  
  const lastDataRef = useRef<T | null>(null);
  const lastMetadataRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Register save handler with auto-save system
  useEffect(() => {
    if (!isInitializedRef.current) {
      autoSaveSystem.registerSaveHandler(contentType, async (operation) => {
        try {
          const success = await saveHandler(operation.data, operation.metadata);
          if (success && onSaveSuccess) {
            onSaveSuccess(operation.data);
          }
          return success;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (onSaveError) {
            onSaveError(errorMessage, operation.data);
          }
          throw error;
        }
      });
      isInitializedRef.current = true;
    }
  }, [contentType, saveHandler, onSaveSuccess, onSaveError]);

  // Subscribe to status changes
  useEffect(() => {
    const unsubscribe = autoSaveSystem.onStatusChange((id, status) => {
      if (id === contentId) {
        setSaveStatus(status);
        if (onStatusChange) {
          onStatusChange(status);
        }
      }
    });

    return unsubscribe;
  }, [contentId, onStatusChange]);

  // Auto-save function
  const autoSave = useCallback((data: T, metadata?: any) => {
    lastDataRef.current = data;
    lastMetadataRef.current = metadata;
    autoSaveSystem.autoSave(contentType, contentId, data, metadata);
  }, [contentType, contentId]);

  // Force save function
  const forceSave = useCallback(async (data: T, metadata?: any): Promise<boolean> => {
    lastDataRef.current = data;
    lastMetadataRef.current = metadata;
    return autoSaveSystem.forceSave(contentType, contentId, data, metadata);
  }, [contentType, contentId]);

  // Clear error status
  const clearError = useCallback(() => {
    setSaveStatus(prev => ({
      ...prev,
      status: 'idle',
      error: undefined
    }));
  }, []);

  // Retry last save operation
  const retry = useCallback(() => {
    if (lastDataRef.current !== null) {
      autoSave(lastDataRef.current, lastMetadataRef.current);
    }
  }, [autoSave]);

  // Derived status values
  const isSaving = saveStatus.status === 'saving';
  const isSaved = saveStatus.status === 'saved';
  const hasError = saveStatus.status === 'error' || saveStatus.status === 'conflict';
  const isOnline = saveStatus.isOnline;

  return {
    autoSave,
    forceSave,
    saveStatus,
    isSaving,
    isSaved,
    hasError,
    isOnline,
    clearError,
    retry
  };
}

/**
 * Hook for auto-save with form data
 * Specialized version for form-like data with field-level tracking
 */
export function useAutoSaveForm<T extends Record<string, any>>(
  options: UseAutoSaveOptions<T> & {
    initialData: T;
    validateBeforeSave?: (data: T) => boolean | string;
  }
) {
  const { initialData, validateBeforeSave, ...autoSaveOptions } = options;
  const [formData, setFormData] = useState<T>(initialData);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const autoSaveHook = useAutoSave<T>({
    ...autoSaveOptions,
    saveHandler: async (data, metadata) => {
      // Validate before saving if validator provided
      if (validateBeforeSave) {
        const validation = validateBeforeSave(data);
        if (validation !== true) {
          const error = typeof validation === 'string' ? validation : 'Validation failed';
          setValidationError(error);
          throw new Error(error);
        }
      }
      
      setValidationError(null);
      return autoSaveOptions.saveHandler(data, metadata);
    }
  });

  // Update form data and trigger auto-save
  const updateField = useCallback(<K extends keyof T>(
    field: K,
    value: T[K],
    metadata?: any
  ) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    autoSaveHook.autoSave(newData, metadata);
  }, [formData, autoSaveHook]);

  // Update multiple fields at once
  const updateFields = useCallback((
    updates: Partial<T>,
    metadata?: any
  ) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    autoSaveHook.autoSave(newData, metadata);
  }, [formData, autoSaveHook]);

  // Reset form to initial data
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setValidationError(null);
  }, [initialData]);

  // Force save current form data
  const saveForm = useCallback(async (): Promise<boolean> => {
    return autoSaveHook.forceSave(formData);
  }, [autoSaveHook, formData]);

  return {
    ...autoSaveHook,
    formData,
    updateField,
    updateFields,
    resetForm,
    saveForm,
    validationError,
    hasValidationError: validationError !== null
  };
}

/**
 * Hook for auto-save with undo/redo functionality
 */
export function useAutoSaveWithHistory<T>(
  options: UseAutoSaveOptions<T> & {
    maxHistorySize?: number;
  }
) {
  const { maxHistorySize = 50, ...autoSaveOptions } = options;
  const [history, setHistory] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const autoSaveHook = useAutoSave<T>(autoSaveOptions);

  // Add to history and auto-save
  const saveWithHistory = useCallback((data: T, metadata?: any) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(data);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        setCurrentIndex(prev => Math.max(0, prev));
      } else {
        setCurrentIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
    
    autoSaveHook.autoSave(data, metadata);
  }, [autoSaveHook, currentIndex, maxHistorySize]);

  // Undo to previous state
  const undo = useCallback((): T | null => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      const previousData = history[newIndex];
      autoSaveHook.autoSave(previousData);
      return previousData;
    }
    return null;
  }, [autoSaveHook, currentIndex, history]);

  // Redo to next state
  const redo = useCallback((): T | null => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      const nextData = history[newIndex];
      autoSaveHook.autoSave(nextData);
      return nextData;
    }
    return null;
  }, [autoSaveHook, currentIndex, history]);

  // Get current data
  const currentData = currentIndex >= 0 ? history[currentIndex] : null;
  
  // Check if undo/redo is available
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    ...autoSaveHook,
    saveWithHistory,
    undo,
    redo,
    currentData,
    canUndo,
    canRedo,
    historySize: history.length,
    currentIndex
  };
}

/**
 * Hook for batch auto-save operations
 * Useful for components that manage multiple items
 */
export function useAutoSaveBatch<T>(
  contentType: ContentType,
  saveHandler: (items: Array<{ id: string; data: T }>) => Promise<boolean>,
  options: {
    debounceMs?: number;
    maxBatchSize?: number;
    onSaveSuccess?: (items: Array<{ id: string; data: T }>) => void;
    onSaveError?: (error: string, items: Array<{ id: string; data: T }>) => void;
  } = {}
) {
  const {
    debounceMs = 500,
    maxBatchSize = 10,
    onSaveSuccess,
    onSaveError
  } = options;

  const [pendingItems, setPendingItems] = useState<Map<string, T>>(new Map());
  const [batchStatus, setBatchStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process batch save
  const processBatch = useCallback(async () => {
    if (pendingItems.size === 0) return;

    const items = Array.from(pendingItems.entries()).map(([id, data]) => ({ id, data }));
    setPendingItems(new Map());
    setBatchStatus('saving');
    setLastError(null);

    try {
      const success = await saveHandler(items);
      if (success) {
        setBatchStatus('saved');
        if (onSaveSuccess) {
          onSaveSuccess(items);
        }
        // Reset to idle after a short delay
        setTimeout(() => setBatchStatus('idle'), 1000);
      } else {
        throw new Error('Batch save failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setBatchStatus('error');
      setLastError(errorMessage);
      if (onSaveError) {
        onSaveError(errorMessage, items);
      }
    }
  }, [pendingItems, saveHandler, onSaveSuccess, onSaveError]);

  // Add item to batch
  const addToBatch = useCallback((id: string, data: T) => {
    setPendingItems(prev => new Map(prev).set(id, data));

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if we should process immediately due to batch size
    if (pendingItems.size >= maxBatchSize) {
      processBatch();
    } else {
      // Schedule debounced processing
      timeoutRef.current = setTimeout(processBatch, debounceMs);
    }
  }, [pendingItems.size, maxBatchSize, processBatch, debounceMs]);

  // Force immediate batch processing
  const flushBatch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    processBatch();
  }, [processBatch]);

  // Clear pending items
  const clearBatch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPendingItems(new Map());
    setBatchStatus('idle');
    setLastError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    addToBatch,
    flushBatch,
    clearBatch,
    batchStatus,
    lastError,
    pendingCount: pendingItems.size,
    isSaving: batchStatus === 'saving',
    hasError: batchStatus === 'error'
  };
}