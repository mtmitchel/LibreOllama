// src/tests/hooks/useTauriCanvas.test.ts
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock the canvas store
vi.mock('@/features/canvas/stores/canvasStore.enhanced', () => ({
  useCanvasStore: vi.fn(),
}));

// Import after mocks are set up
import { useTauriCanvas } from '../../features/canvas/hooks/useTauriCanvas';

describe('useTauriCanvas', () => {
  let mockInvoke: any;
  let mockExportElements: any;
  let mockImportElements: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    console.log = vi.fn(); // Mock console.log
    console.error = vi.fn(); // Mock console.error
    
    // Get mocked functions
    mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;
    mockExportElements = vi.fn();
    mockImportElements = vi.fn();
    
    // Setup store mock to handle Zustand selector pattern
    const mockUseCanvasStore = vi.mocked(await import('../../features/canvas/stores/canvasStore.enhanced')).useCanvasStore;
    mockUseCanvasStore.mockImplementation((selector) => {
      const mockStore = {
        exportElements: mockExportElements,
        importElements: mockImportElements,
        elements: new Map(),
        sections: new Map(),
        selectedElementIds: new Set(),
        editingTextId: null,
        selectedTool: 'select' as const,
        viewportBounds: { left: 0, top: 0, right: 800, bottom: 600 },
        isDrawing: false,
        currentPath: [],
        findSectionAtPoint: vi.fn(),
        handleElementDrop: vi.fn(),
        captureElementsAfterSectionCreation: vi.fn(),
        updateElementCoordinatesOnSectionMove: vi.fn(),
        convertElementToAbsoluteCoordinates: vi.fn(),
        convertElementToRelativeCoordinates: vi.fn(),
        clearCanvas: vi.fn(),
      };
      return selector ? selector(mockStore as any) : mockStore;
    });
  });

  describe('saveToFile', () => {
    test('should save canvas data successfully', async () => {
      const mockElements = [
        { id: 'elem1', type: 'rectangle', x: 0, y: 0, width: 100, height: 50 },
        { id: 'elem2', type: 'circle', x: 100, y: 100, radius: 25 },
      ];
      
      mockExportElements.mockReturnValue(mockElements);
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.saveToFile('test-canvas.json');
      });

      expect(mockExportElements).toHaveBeenCalledTimes(1);
      expect(mockInvoke).toHaveBeenCalledWith('save_canvas_data', {
        data: JSON.stringify(mockElements),
        filename: 'test-canvas.json',
      });
      expect(console.log).toHaveBeenCalledWith('Canvas saved successfully');
    });

    test('should handle save errors gracefully', async () => {
      const mockError = new Error('Save failed');
      mockExportElements.mockReturnValue([]);
      mockInvoke.mockRejectedValue(mockError);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.saveToFile('test-canvas.json');
      });

      expect(console.error).toHaveBeenCalledWith('Error saving canvas:', mockError);
    });

    test('should export elements before saving', async () => {
      const mockElements = [{ id: 'test', type: 'rectangle' }];
      mockExportElements.mockReturnValue(mockElements);
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.saveToFile('canvas.json');
      });

      expect(mockExportElements).toHaveBeenCalledBefore(mockInvoke as any);
      expect(mockInvoke).toHaveBeenCalledWith('save_canvas_data', {
        data: JSON.stringify(mockElements),
        filename: 'canvas.json',
      });
    });
  });

  describe('loadFromFile', () => {
    test('should load canvas data successfully', async () => {
      const mockElements = [
        { id: 'loaded1', type: 'circle', x: 50, y: 50, radius: 30 },
        { id: 'loaded2', type: 'text', x: 200, y: 100, text: 'Hello' },
      ];
      const mockData = JSON.stringify(mockElements);
      
      mockInvoke.mockResolvedValue(mockData);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.loadFromFile('saved-canvas.json');
      });

      expect(mockInvoke).toHaveBeenCalledWith('load_canvas_data', {
        filename: 'saved-canvas.json',
      });
      expect(mockImportElements).toHaveBeenCalledWith(mockElements);
      expect(console.log).toHaveBeenCalledWith('Canvas loaded successfully');
    });

    test('should handle load errors gracefully', async () => {
      const mockError = new Error('Load failed');
      mockInvoke.mockRejectedValue(mockError);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.loadFromFile('nonexistent.json');
      });

      expect(console.error).toHaveBeenCalledWith('Error loading canvas:', mockError);
      expect(mockImportElements).not.toHaveBeenCalled();
    });

    test('should parse JSON data before importing', async () => {
      const mockElements = [{ id: 'parsed', type: 'star' }];
      const mockData = JSON.stringify(mockElements);
      
      mockInvoke.mockResolvedValue(mockData);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.loadFromFile('data.json');
      });

      expect(mockImportElements).toHaveBeenCalledWith(mockElements);
    });

    test('should handle invalid JSON data', async () => {
      const invalidJson = 'invalid-json-data';
      mockInvoke.mockResolvedValue(invalidJson);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.loadFromFile('invalid.json');
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error loading canvas:',
        expect.any(SyntaxError)
      );
    });
  });

  describe('integration tests', () => {
    test('should save and load the same data', async () => {
      const originalElements = [
        { id: 'elem1', type: 'rectangle', x: 10, y: 20, width: 100, height: 50 },
        { id: 'elem2', type: 'circle', x: 150, y: 200, radius: 40 },
      ];

      // Setup save operation
      mockExportElements.mockReturnValue(originalElements);
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

      expect(mockExportElements).toHaveBeenCalledTimes(1);
      expect(mockImportElements).toHaveBeenCalledWith(originalElements);
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });

    test('should handle empty canvas export/import', async () => {
      mockExportElements.mockReturnValue([]);
      mockInvoke.mockResolvedValueOnce(undefined); // For save
      mockInvoke.mockResolvedValueOnce('[]'); // For load

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.saveToFile('empty.json');
      });

      await act(async () => {
        await result.current.loadFromFile('empty.json');
      });

      expect(mockImportElements).toHaveBeenCalledWith([]);
    });
  });

  describe('return value', () => {
    test('should return saveToFile and loadFromFile functions', () => {
      const { result } = renderHook(() => useTauriCanvas());

      expect(result.current).toEqual({
        saveToFile: expect.any(Function),
        loadFromFile: expect.any(Function),
      });
    });

    test('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useTauriCanvas());
      const firstRender = result.current;

      rerender();
      const secondRender = result.current;

      expect(firstRender.saveToFile).toBe(secondRender.saveToFile);
      expect(firstRender.loadFromFile).toBe(secondRender.loadFromFile);
    });
  });
});