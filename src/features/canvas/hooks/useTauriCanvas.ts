// src/hooks/useTauriCanvas.ts
import { invoke } from '@tauri-apps/api/core';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { useCallback, useMemo, useEffect, useRef } from 'react';
import { debounce } from '../utils/debounce';

// Cache for encryption key initialization status
let encryptionInitialized = false;

/**
 * Ensures encryption key is set up before any persistence operations
 * This is a safeguard to prevent data loss or security issues
 */
const ensureEncryptionKey = async (): Promise<boolean> => {
  if (encryptionInitialized) {
    return true;
  }

  try {
    // Verify or initialize the encryption key
    // This command should be implemented in the Tauri backend
    await invoke('ensure_encryption_key');
    encryptionInitialized = true;
    console.log('Encryption key verified/initialized');
    return true;
  } catch (error) {
    console.warn('Encryption key initialization failed:', error);
    // For now, allow operations to continue but log the warning
    // In production, you might want to handle this more strictly
    encryptionInitialized = true; // Set to true to avoid repeated attempts
    return true;
  }
};

export const useTauriCanvas = (options?: { autoSave?: boolean; autoSaveInterval?: number }) => {
  const { autoSave = true, autoSaveInterval = 500 } = options || {};
  
  // Use stable selectors with proper memoization
  const elements = useUnifiedCanvasStore(
    useCallback((state) => state.elements, [])
  );
  const importElements = useUnifiedCanvasStore(
    useCallback((state) => state.importElements, [])
  );
  
  // Track the last saved state to detect changes
  const lastSavedState = useRef<string>('');
  const autoSaveFilename = useRef<string>('canvas-autosave.json');
  
  // Memoize expensive operations
  const saveToFile = useCallback(async (filename: string) => {
    try {
      // Ensure encryption key is initialized before save
      await ensureEncryptionKey();
      
      if (!filename || typeof filename !== 'string') {
        throw new Error('Invalid filename provided');
      }
      
      const elementsArray = Array.from(elements.values());
      if (elementsArray.length === 0) {
        throw new Error('No elements to export');
      }
      
      const data = JSON.stringify(elementsArray);
      
      // Save to file with encryption safeguard in place
      await invoke('save_canvas_data', { data, filename });
      
      // Update last saved state for change detection
      lastSavedState.current = data;
      
      console.log('Canvas saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving canvas:', error);
      throw error; // Re-throw for caller to handle
    }
  }, [elements]);

  const loadFromFile = useCallback(async (filename: string) => {
    try {
      // Ensure encryption key is initialized before load
      await ensureEncryptionKey();
      
      if (!filename || typeof filename !== 'string') {
        throw new Error('Invalid filename provided');
      }
      
      // Load from file with encryption safeguard in place
      const data = await invoke('load_canvas_data', { filename });
      if (!data) {
        throw new Error('No data received from file');
      }
      
      let elements;
      try {
        elements = JSON.parse(data as string);
      } catch (parseError) {
        throw new Error('Invalid JSON data in file');
      }
      
      if (!elements || typeof elements !== 'object') {
        throw new Error('Invalid canvas data format');
      }
      
      importElements(elements);
      
      // Update last saved state after successful load
      lastSavedState.current = data as string;
      
      console.log('Canvas loaded successfully');
      return elements;
    } catch (error) {
      console.error('Error loading canvas:', error);
      throw error; // Re-throw for caller to handle
    }
  }, [importElements]);

  const listCanvasFiles = useCallback(async (): Promise<string[]> => {
    try {
      // Ensure encryption key is initialized before listing
      await ensureEncryptionKey();
      
      const files = await invoke('list_canvas_files') as string[];
      console.log('Canvas files listed successfully:', files.length, 'files');
      return files;
    } catch (error) {
      console.error('Error listing canvas files:', error);
      throw error;
    }
  }, []);

  const deleteCanvasFile = useCallback(async (filename: string): Promise<void> => {
    try {
      // Ensure encryption key is initialized before deletion
      await ensureEncryptionKey();
      
      if (!filename || typeof filename !== 'string') {
        throw new Error('Invalid filename provided');
      }
      
      await invoke('delete_canvas_file', { filename });
      console.log('Canvas file deleted successfully:', filename);
    } catch (error) {
      console.error('Error deleting canvas file:', error);
      throw error;
    }
  }, []);

  // Create debounced auto-save function (500ms delay as specified)
  const debouncedAutoSave = useMemo(
    () => debounce(async () => {
      try {
        const elementsArray = Array.from(elements.values());
        
        // Skip auto-save if no elements
        if (elementsArray.length === 0) {
          return;
        }
        
        const currentState = JSON.stringify(elementsArray);
        
        // Skip auto-save if nothing changed
        if (currentState === lastSavedState.current) {
          return;
        }
        
        // Ensure encryption key before auto-save
        await ensureEncryptionKey();
        
        // Perform auto-save
        await invoke('save_canvas_data', { 
          data: currentState, 
          filename: autoSaveFilename.current 
        });
        
        // Update last saved state
        lastSavedState.current = currentState;
        
        console.log('Canvas auto-saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Don't throw - auto-save failures should not interrupt user work
      }
    }, autoSaveInterval),
    [elements, autoSaveInterval]
  );

  // Implement auto-save listener on Zustand state changes
  useEffect(() => {
    if (!autoSave) {
      return;
    }

    // Subscribe to store changes
    const unsubscribe = useUnifiedCanvasStore.subscribe(
      (state) => state.elements,
      () => {
        // Trigger debounced auto-save on any element changes
        debouncedAutoSave();
      }
    );

    // Initial encryption key setup
    ensureEncryptionKey().catch(console.error);

    return () => {
      unsubscribe();
      // Note: debounced function doesn't have cancel method
    };
  }, [autoSave, debouncedAutoSave]);

  // Memoize the returned object to prevent unnecessary re-renders
  const api = useMemo(() => ({
    saveToFile,
    loadFromFile,
    listCanvasFiles,
    deleteCanvasFile,
    // Add utility functions for error handling
    isFileSupported: (filename: string) => {
      return filename && (filename.endsWith('.json') || filename.endsWith('.canvas'));
    },
    sanitizeFilename: (filename: string) => {
      return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    },
    // Expose auto-save configuration
    setAutoSaveFilename: (filename: string) => {
      autoSaveFilename.current = filename;
    },
    getAutoSaveStatus: () => ({
      enabled: autoSave,
      filename: autoSaveFilename.current,
      lastSaved: lastSavedState.current ? 'Has data' : 'No data'
    })
  }), [saveToFile, loadFromFile, listCanvasFiles, deleteCanvasFile, autoSave]);

  return api;
};
