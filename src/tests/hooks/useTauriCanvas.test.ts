import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTauriCanvas } from '@/features/canvas/hooks/useTauriCanvas';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, __emit, __clearListeners } from '@tauri-apps/api/event';
import { createMockCanvasElement } from '../../utils/testUtils';

// Mock Tauri APIs
const mockInvoke = invoke as jest.MockedFunction<typeof invoke>;
const mockListen = listen as jest.MockedFunction<typeof listen>;

describe('useTauriCanvas', () => {
  let mockCanvasData: any;
  let mockUnlisten: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    __clearListeners();
    
    mockUnlisten = jest.fn();
    mockListen.mockResolvedValue(mockUnlisten);

    mockCanvasData = {
      elements: [
        createMockCanvasElement({ id: 'elem1', type: 'rectangle' }),
        createMockCanvasElement({ id: 'elem2', type: 'circle' })
      ],
      viewport: { scale: 1, position: { x: 0, y: 0 } }
    };
  });

  afterEach(() => {
    __clearListeners();
  });

  describe('Canvas Save Operations', () => {
    test('saves canvas data successfully', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.saveCanvas(mockCanvasData, 'test-canvas.json');
      });

      expect(mockInvoke).toHaveBeenCalledWith('save_canvas_data', {
        data: JSON.stringify(mockCanvasData),
        filename: 'test-canvas.json'
      });
    });

    test('handles save errors', async () => {
      mockInvoke.mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() => useTauriCanvas());

      await expect(
        result.current.saveCanvas(mockCanvasData, 'test-canvas.json')
      ).rejects.toThrow('Save failed');
    });

    test('validates data before saving', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTauriCanvas());

      const invalidData = { elements: null };

      await expect(
        result.current.saveCanvas(invalidData, 'test.json')
      ).rejects.toThrow();
    });

    test('auto-saves at intervals when enabled', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useTauriCanvas({ autoSave: true, autoSaveInterval: 100 })
      );

      // Update canvas data
      await act(async () => {
        result.current.setCanvasData(mockCanvasData);
      });

      // Wait for auto-save
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('save_canvas_data', expect.any(Object));
      }, { timeout: 200 });
    });
  });

  describe('Canvas Load Operations', () => {
    test('loads canvas data successfully', async () => {
      mockInvoke.mockResolvedValue(JSON.stringify(mockCanvasData));

      const { result } = renderHook(() => useTauriCanvas());

      const data = await act(async () => {
        return await result.current.loadCanvas('test-canvas.json');
      });

      expect(mockInvoke).toHaveBeenCalledWith('load_canvas_data', {
        filename: 'test-canvas.json'
      });
      expect(data).toEqual(mockCanvasData);
    });

    test('handles corrupted data gracefully', async () => {
      mockInvoke.mockResolvedValue('invalid json');

      const { result } = renderHook(() => useTauriCanvas());

      await expect(
        result.current.loadCanvas('corrupted.json')
      ).rejects.toThrow();
    });

    test('loads canvas on mount when specified', async () => {
      mockInvoke.mockResolvedValue(JSON.stringify(mockCanvasData));

      const onLoad = jest.fn();
      
      renderHook(() => 
        useTauriCanvas({ 
          loadOnMount: true, 
          filename: 'auto-load.json',
          onLoad 
        })
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('load_canvas_data', {
          filename: 'auto-load.json'
        });
        expect(onLoad).toHaveBeenCalledWith(mockCanvasData);
      });
    });
  });

  describe('Event Listeners', () => {
    test('listens for canvas update events', async () => {
      const onCanvasUpdate = jest.fn();
      
      renderHook(() => 
        useTauriCanvas({ onCanvasUpdate })
      );

      // Emit update event
      const updateData = {
        elementId: 'elem1',
        updates: { x: 200, y: 200 }
      };
      
      act(() => {
        __emit('canvas:update', updateData);
      });

      expect(onCanvasUpdate).toHaveBeenCalledWith(updateData);
    });

    test('listens for collaborative edit events', async () => {
      const onCollaborativeEdit = jest.fn();
      
      renderHook(() => 
        useTauriCanvas({ onCollaborativeEdit })
      );

      const editData = {
        userId: 'user-2',
        elementId: 'elem1',
        action: 'move',
        data: { x: 300, y: 300 }
      };

      act(() => {
        __emit('canvas:collaborative-edit', editData);
      });

      expect(onCollaborativeEdit).toHaveBeenCalledWith(editData);
    });

    test('cleans up listeners on unmount', async () => {
      const { unmount } = renderHook(() => useTauriCanvas());

      expect(mockListen).toHaveBeenCalled();

      unmount();

      // Should call unlisten functions
      expect(mockUnlisten).toHaveBeenCalled();
    });

    test('handles multiple event types simultaneously', async () => {
      const handlers = {
        onCanvasUpdate: jest.fn(),
        onCanvasDelete: jest.fn(),
        onCanvasAdd: jest.fn()
      };

      renderHook(() => useTauriCanvas(handlers));

      act(() => {
        __emit('canvas:update', { elementId: 'elem1' });
        __emit('canvas:delete', { elementId: 'elem2' });
        __emit('canvas:add', { element: createMockCanvasElement() });
      });

      expect(handlers.onCanvasUpdate).toHaveBeenCalled();
      expect(handlers.onCanvasDelete).toHaveBeenCalled();
      expect(handlers.onCanvasAdd).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    test('manages loading state', async () => {
      mockInvoke.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(JSON.stringify(mockCanvasData)), 100))
      );

      const { result } = renderHook(() => useTauriCanvas());

      expect(result.current.isLoading).toBe(false);

      const loadPromise = act(async () => {
        return result.current.loadCanvas('test.json');
      });

      expect(result.current.isLoading).toBe(true);

      await loadPromise;

      expect(result.current.isLoading).toBe(false);
    });

    test('manages error state', async () => {
      mockInvoke.mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useTauriCanvas());

      expect(result.current.error).toBeNull();

      await act(async () => {
        try {
          await result.current.loadCanvas('test.json');
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toEqual(expect.any(Error));
      expect(result.current.error?.message).toBe('Load failed');
    });

    test('tracks save status', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTauriCanvas());

      expect(result.current.isSaved).toBe(true);

      // Make changes
      act(() => {
        result.current.setCanvasData(mockCanvasData);
      });

      expect(result.current.isSaved).toBe(false);

      // Save
      await act(async () => {
        await result.current.saveCanvas(mockCanvasData, 'test.json');
      });

      expect(result.current.isSaved).toBe(true);
    });
  });

  describe('Advanced Features', () => {
    test('implements debounced save', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useTauriCanvas({ debounceDelay: 100 })
      );

      // Trigger multiple saves rapidly
      await act(async () => {
        result.current.debouncedSave(mockCanvasData, 'test.json');
        result.current.debouncedSave(mockCanvasData, 'test.json');
        result.current.debouncedSave(mockCanvasData, 'test.json');
      });

      // Should only save once after debounce delay
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });

    test('supports multiple canvas instances', async () => {
      const { result: canvas1 } = renderHook(() => 
        useTauriCanvas({ canvasId: 'canvas-1' })
      );
      
      const { result: canvas2 } = renderHook(() => 
        useTauriCanvas({ canvasId: 'canvas-2' })
      );

      // Each canvas should maintain separate state
      act(() => {
        canvas1.current.setCanvasData({ id: 'canvas-1', elements: [] });
        canvas2.current.setCanvasData({ id: 'canvas-2', elements: [] });
      });

      expect(canvas1.current.canvasData).not.toEqual(canvas2.current.canvasData);
    });

    test('implements optimistic updates', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useTauriCanvas({ optimisticUpdates: true })
      );

      const newElement = createMockCanvasElement({ id: 'new-elem' });

      act(() => {
        result.current.addElement(newElement);
      });

      // Element should be added immediately
      expect(result.current.canvasData?.elements).toContainEqual(newElement);

      // Save should happen in background
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled();
      });
    });

    test('implements conflict resolution', async () => {
      const onConflict = jest.fn();
      
      renderHook(() => 
        useTauriCanvas({ onConflict })
      );

      // Simulate conflicting update from backend
      act(() => {
        __emit('canvas:conflict', {
          local: { elementId: 'elem1', version: 1 },
          remote: { elementId: 'elem1', version: 2 }
        });
      });

      expect(onConflict).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    test('implements retry logic', async () => {
      let attempts = 0;
      mockInvoke.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(JSON.stringify(mockCanvasData));
      });

      const { result } = renderHook(() => 
        useTauriCanvas({ maxRetries: 3 })
      );

      const data = await act(async () => {
        return await result.current.loadCanvas('test.json');
      });

      expect(attempts).toBe(3);
      expect(data).toEqual(mockCanvasData);
    });

    test('falls back to cached data on error', async () => {
      // First successful load
      mockInvoke.mockResolvedValueOnce(JSON.stringify(mockCanvasData));
      
      const { result } = renderHook(() => 
        useTauriCanvas({ enableCache: true })
      );

      await act(async () => {
        await result.current.loadCanvas('test.json');
      });

      // Second load fails
      mockInvoke.mockRejectedValueOnce(new Error('Network error'));

      const cachedData = await act(async () => {
        return await result.current.loadCanvas('test.json');
      });

      expect(cachedData).toEqual(mockCanvasData);
    });

    test('provides offline mode', async () => {
      const { result } = renderHook(() => 
        useTauriCanvas({ offlineMode: true })
      );

      // Should work without backend calls
      act(() => {
        result.current.setCanvasData(mockCanvasData);
      });

      expect(result.current.canvasData).toEqual(mockCanvasData);
      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe('Performance Optimizations', () => {
    test('batches multiple operations', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useTauriCanvas({ batchOperations: true })
      );

      // Perform multiple operations
      act(() => {
        result.current.startBatch();
        result.current.addElement(createMockCanvasElement({ id: 'elem3' }));
        result.current.updateElement('elem1', { x: 500 });
        result.current.deleteElement('elem2');
        result.current.endBatch();
      });

      // Should send as single operation
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledTimes(1);
      });
    });

    test('implements lazy loading for large canvases', async () => {
      const largeData = {
        elements: Array.from({ length: 10000 }, (_, i) => 
          createMockCanvasElement({ id: `elem${i}` })
        )
      };

      mockInvoke.mockResolvedValue(JSON.stringify(largeData));

      const { result } = renderHook(() => 
        useTauriCanvas({ lazyLoad: true, chunkSize: 100 })
      );

      await act(async () => {
        await result.current.loadCanvas('large.json');
      });

      // Should load in chunks
      expect(result.current.loadProgress).toBeDefined();
      expect(result.current.isPartiallyLoaded).toBe(true);
    });
  });
});
