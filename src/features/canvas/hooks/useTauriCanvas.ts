// src/hooks/useTauriCanvas.ts
import { invoke } from '@tauri-apps/api/core';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
import { useCallback, useMemo } from 'react';

export const useTauriCanvas = () => {
  // Use stable selectors with proper memoization
  const elements = useUnifiedCanvasStore(
    useCallback((state) => state.elements, [])
  );
  const importElements = useUnifiedCanvasStore(
    useCallback((state) => state.importElements, [])
  );
  
  // Memoize expensive operations
  const saveToFile = useCallback(async (filename: string) => {
    try {
      if (!filename || typeof filename !== 'string') {
        throw new Error('Invalid filename provided');
      }
      
      const elementsArray = Array.from(elements.values());
      if (elementsArray.length === 0) {
        throw new Error('No elements to export');
      }
      
      const data = JSON.stringify(elementsArray);
      await invoke('save_canvas_data', { data, filename });
      console.log('Canvas saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving canvas:', error);
      throw error; // Re-throw for caller to handle
    }
  }, [elements]);

  const loadFromFile = useCallback(async (filename: string) => {
    try {
      if (!filename || typeof filename !== 'string') {
        throw new Error('Invalid filename provided');
      }
      
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
      console.log('Canvas loaded successfully');
      return elements;
    } catch (error) {
      console.error('Error loading canvas:', error);
      throw error; // Re-throw for caller to handle
    }
  }, [importElements]);

  // Memoize the returned object to prevent unnecessary re-renders
  const api = useMemo(() => ({
    saveToFile,
    loadFromFile,
    // Add utility functions for error handling
    isFileSupported: (filename: string) => {
      return filename && (filename.endsWith('.json') || filename.endsWith('.canvas'));
    },
    sanitizeFilename: (filename: string) => {
      return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    }
  }), [saveToFile, loadFromFile]);

  return api;
};
