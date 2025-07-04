// src/tests/hooks/useTauriCanvas.test.ts
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock the unified canvas store
vi.mock('../../features/canvas/stores/unifiedCanvasStore', () => ({
  useUnifiedCanvasStore: vi.fn(),
}));

// Import after mocks are set up
import { useTauriCanvas } from '../../features/canvas/hooks/useTauriCanvas';
import { invoke } from '@tauri-apps/api/core';

describe('useTauriCanvas', () => {
  let mockInvoke: any;
  let mockElements: Map<string, any>;
  let mockImportElements: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    console.log = vi.fn(); // Mock console.log
    console.error = vi.fn(); // Mock console.error
    
    // Get mocked functions
    mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;
    mockImportElements = vi.fn();
    mockElements = new Map();
    
    // Setup store mock to handle Zustand selector pattern
    const { useUnifiedCanvasStore: mockUseUnifiedCanvasStore } = await import('../../features/canvas/stores/unifiedCanvasStore');
    const mockUseCanvasStore = vi.mocked(mockUseUnifiedCanvasStore);

    mockUseCanvasStore.mockImplementation((selector) => {
      const mockStore = {
        elements: mockElements,
        importElements: mockImportElements,
      };
      return selector ? selector(mockStore as any) : mockStore;
    });
  });

  describe('saveToFile', () => {
    test('should save canvas data successfully', async () => {
      // Setup elements in the mock store
      mockElements.set('elem1', { id: 'elem1', type: 'rectangle', x: 0, y: 0, width: 100, height: 50 });
      mockElements.set('elem2', { id: 'elem2', type: 'circle', x: 100, y: 100, radius: 25 });
      
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.saveToFile('test-canvas.json');
      });

      expect(mockInvoke).toHaveBeenCalledWith('save_canvas_data', {
        data: expect.stringContaining('elem1'),
        filename: 'test-canvas.json',
      });
      expect(console.log).toHaveBeenCalledWith('Canvas saved successfully');
    });

    test('should handle save errors gracefully', async () => {
      // Setup elements so we get past the "No elements" check
      mockElements.set('elem1', { id: 'elem1', type: 'rectangle' });
      
      const mockError = new Error('Save failed');
      mockInvoke.mockRejectedValue(mockError);

      const { result } = renderHook(() => useTauriCanvas());

      await expect(act(async () => {
        await result.current.saveToFile('test-canvas.json');
      })).rejects.toThrow('Save failed');

      expect(console.error).toHaveBeenCalledWith('Error saving canvas:', mockError);
    });

    test('should throw error when no elements to export', async () => {
      // Keep mockElements empty
      const { result } = renderHook(() => useTauriCanvas());

      await expect(act(async () => {
        await result.current.saveToFile('test-canvas.json');
      })).rejects.toThrow('No elements to export');
    });
  });

  describe('loadFromFile', () => {
    test('should load canvas data successfully', async () => {
      const mockElementsData = [
        { id: 'loaded1', type: 'circle', x: 50, y: 50, radius: 30 },
        { id: 'loaded2', type: 'text', x: 200, y: 100, text: 'Hello' },
      ];
      const mockData = JSON.stringify(mockElementsData);
      
      mockInvoke.mockResolvedValue(mockData);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.loadFromFile('saved-canvas.json');
      });

      expect(mockInvoke).toHaveBeenCalledWith('load_canvas_data', {
        filename: 'saved-canvas.json',
      });
      expect(mockImportElements).toHaveBeenCalledWith(mockElementsData);
      expect(console.log).toHaveBeenCalledWith('Canvas loaded successfully');
    });

    test('should handle load errors gracefully', async () => {
      const mockError = new Error('Load failed');
      mockInvoke.mockRejectedValue(mockError);

      const { result } = renderHook(() => useTauriCanvas());

      await expect(act(async () => {
        await result.current.loadFromFile('nonexistent.json');
      })).rejects.toThrow('Load failed');

      expect(console.error).toHaveBeenCalledWith('Error loading canvas:', mockError);
      expect(mockImportElements).not.toHaveBeenCalled();
    });

    test('should parse JSON data before importing', async () => {
      const mockElementsData = [{ id: 'parsed', type: 'star' }];
      const mockData = JSON.stringify(mockElementsData);
      
      mockInvoke.mockResolvedValue(mockData);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.loadFromFile('data.json');
      });

      expect(mockImportElements).toHaveBeenCalledWith(mockElementsData);
    });

    test('should handle invalid JSON data', async () => {
      const invalidJson = 'invalid-json-data';
      mockInvoke.mockResolvedValue(invalidJson);

      const { result } = renderHook(() => useTauriCanvas());

      await expect(act(async () => {
        await result.current.loadFromFile('invalid.json');
      })).rejects.toThrow('Invalid JSON data in file');
    });
  });

  describe('integration tests', () => {
    test('should save and load the same data', async () => {
      const originalElements = [
        { id: 'elem1', type: 'rectangle', x: 10, y: 20, width: 100, height: 50 },
        { id: 'elem2', type: 'circle', x: 150, y: 200, radius: 40 },
      ];

      // Setup elements in store for saving
      originalElements.forEach(elem => mockElements.set(elem.id, elem));

      // Setup save operation
      mockInvoke.mockResolvedValueOnce(undefined); // For save

      // Setup load operation  
      const savedData = JSON.stringify(originalElements);
      mockInvoke.mockResolvedValueOnce(savedData); // For load

      const { result } = renderHook(() => useTauriCanvas());

      // Save the canvas
      await act(async () => {
        await result.current.saveToFile('integration-test.json');
      });

      // Load the canvas
      await act(async () => {
        await result.current.loadFromFile('integration-test.json');
      });

      expect(mockImportElements).toHaveBeenCalledWith(originalElements);
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });

    test('should handle empty canvas load', async () => {
      // Test loading an empty canvas (which is valid)
      mockInvoke.mockResolvedValue('[]');

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.loadFromFile('empty.json');
      });

      expect(mockImportElements).toHaveBeenCalledWith([]);
    });
  });

  describe('return value', () => {
    test('should return all expected functions', () => {
      const { result } = renderHook(() => useTauriCanvas());

      expect(result.current).toEqual({
        saveToFile: expect.any(Function),
        loadFromFile: expect.any(Function),
        isFileSupported: expect.any(Function),
        sanitizeFilename: expect.any(Function),
      });
    });

    test('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useTauriCanvas());
      const firstRender = result.current;

      rerender();
      const secondRender = result.current;

      expect(firstRender.saveToFile).toBe(secondRender.saveToFile);
      expect(firstRender.loadFromFile).toBe(secondRender.loadFromFile);
      expect(firstRender.isFileSupported).toBe(secondRender.isFileSupported);
      expect(firstRender.sanitizeFilename).toBe(secondRender.sanitizeFilename);
    });
  });
});