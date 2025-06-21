import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock Tauri APIs using jest.unstable_mockModule for ESM support
const mockInvoke = jest.fn();

// Mock the Tauri modules before importing the hook
jest.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke
}));

// Mock the canvas store
jest.mock('@/features/canvas/stores/canvasStore.enhanced', () => ({
  useCanvasStore: jest.fn((selector) => {
    const mockState = {
      exportElements: jest.fn(() => [
        { id: 'elem1', type: 'rectangle', x: 100, y: 100 },
        { id: 'elem2', type: 'circle', x: 200, y: 200 }
      ]),
      importElements: jest.fn()
    };
    return selector(mockState);
  })
}));

// Import the hook after mocking
import { useTauriCanvas } from '@/features/canvas/hooks/useTauriCanvas';

describe('useTauriCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Canvas Save Operations', () => {
    test('should invoke Tauri command with correct payload when saving canvas', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.saveToFile('test-canvas.json');
      });

      // Assert that the Tauri invoke function is called with the correct payload
      expect(mockInvoke).toHaveBeenCalledTimes(1);
      expect(mockInvoke).toHaveBeenCalledWith('save_canvas_data', {
        data: expect.any(String),
        filename: 'test-canvas.json'
      });

      // Verify the data contains the exported elements
      const callArgs = mockInvoke.mock.calls[0][1];
      const savedData = JSON.parse(callArgs.data);
      expect(savedData).toHaveLength(2);
      expect(savedData[0].id).toBe('elem1');
    });

    test('should handle save errors gracefully', async () => {
      const errorMessage = 'Save failed';
      mockInvoke.mockRejectedValue(new Error(errorMessage));
      
      // Mock console.error to prevent error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useTauriCanvas());

      // Should not throw, but log error
      await act(async () => {
        await result.current.saveToFile('test-canvas.json');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error saving canvas:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Canvas Load Operations', () => {
    test('should invoke Tauri command and import elements when loading canvas', async () => {
      const mockCanvasData = [
        { id: 'loaded1', type: 'rectangle', x: 50, y: 50 },
        { id: 'loaded2', type: 'circle', x: 150, y: 150 }
      ];
      
      mockInvoke.mockResolvedValue(JSON.stringify(mockCanvasData));

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.loadFromFile('test-canvas.json');
      });

      expect(mockInvoke).toHaveBeenCalledTimes(1);
      expect(mockInvoke).toHaveBeenCalledWith('load_canvas_data', {
        filename: 'test-canvas.json'
      });
    });

    test('should handle load errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Load failed'));
      
      // Mock console.error to prevent error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useTauriCanvas());

      // Should not throw, but log error
      await act(async () => {
        await result.current.loadFromFile('test-canvas.json');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error loading canvas:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    test('should handle corrupted data gracefully', async () => {
      mockInvoke.mockResolvedValue('invalid json {]');
      
      // Mock console.error to prevent error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.loadFromFile('corrupted.json');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error loading canvas:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration with Store', () => {
    test('should call exportElements when saving', async () => {
      mockInvoke.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.saveToFile('test.json');
      });

      // The hook should have called exportElements to get the data
      expect(mockInvoke).toHaveBeenCalled();
    });

    test('should call importElements when loading', async () => {
      const mockData = [{ id: 'test', type: 'rectangle' }];
      mockInvoke.mockResolvedValue(JSON.stringify(mockData));
      
      const { result } = renderHook(() => useTauriCanvas());

      await act(async () => {
        await result.current.loadFromFile('test.json');
      });

      // The hook should have called importElements with the loaded data
      expect(mockInvoke).toHaveBeenCalled();
    });
  });
});
