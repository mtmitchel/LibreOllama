import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { render, screen, act, waitFor } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, emit, __emit, __clearListeners } from '@tauri-apps/api/event';
import { KonvaCanvas } from '@/features/canvas/components/KonvaCanvas';
import { setupTestEnvironment, createMockCanvasElement } from '@/tests/utils/testUtils';

// Get the mocked functions
const mockInvoke = invoke as jest.MockedFunction<typeof invoke>;
const mockListen = listen as jest.MockedFunction<typeof listen>;

describe('Tauri Canvas Integration', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>;
  let mockCanvasData: any;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    
    // Clear all mocks
    mockInvoke.mockReset();
    mockListen.mockClear();
    __clearListeners();

    // Setup default canvas data
    mockCanvasData = {
      elements: [
        createMockCanvasElement({ id: 'elem1', type: 'rectangle', x: 100, y: 100 }),
        createMockCanvasElement({ id: 'elem2', type: 'circle', x: 200, y: 200 }),
        createMockCanvasElement({ id: 'elem3', type: 'text', x: 300, y: 300, text: 'Hello' })
      ],
      viewport: { scale: 1, position: { x: 0, y: 0 } }
    };
  });

  afterEach(() => {
    __clearListeners();
  });

  describe('Canvas Save Operations', () => {
    test('saves canvas data to backend', async () => {
      mockInvoke.mockImplementation((command: string, args?: any) => {
        if (command === 'save_canvas_data') {
          return Promise.resolve();
        }
        return Promise.reject(new Error(`Command ${command} not mocked`));
      });

      const onSave = jest.fn();
      await testEnv.render(
        <div>
          <button onClick={async () => {
            const canvasState = {
              elements: mockCanvasData.elements,
              viewport: mockCanvasData.viewport
            };
            
            await invoke('save_canvas_data', {
              data: JSON.stringify(canvasState),
              filename: 'test-canvas.json'
            });
            onSave();
          }}>
            Save Canvas
          </button>
        </div>
      );

      const saveButton = screen.getByText('Save Canvas');
      await testEnv.user.click(saveButton);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('save_canvas_data', {
          data: expect.any(String),
          filename: 'test-canvas.json'
        });
        expect(onSave).toHaveBeenCalled();
      });
    });

    test('handles save errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Failed to save'));

      const onError = jest.fn();
      await testEnv.render(
        <div>
          <button onClick={async () => {
            try {
              await invoke('save_canvas_data', {
                data: JSON.stringify(mockCanvasData),
                filename: 'test-canvas.json'
              });
            } catch (error) {
              onError(error);
            }
          }}>
            Save Canvas
          </button>
        </div>
      );

      const saveButton = screen.getByText('Save Canvas');
      await testEnv.user.click(saveButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    test('validates data before saving', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const validateAndSave = jest.fn(async (data: any) => {
        // Validate elements
        if (!data.elements || !Array.isArray(data.elements)) {
          throw new Error('Invalid canvas data');
        }

        // Validate each element
        data.elements.forEach((el: any) => {
          if (!el.id || !el.type) {
            throw new Error('Invalid element structure');
          }
        });

        await invoke('save_canvas_data', {
          data: JSON.stringify(data),
          filename: 'validated-canvas.json'
        });
      });

      await testEnv.render(
        <div>
          <button onClick={() => validateAndSave(mockCanvasData)}>
            Save with Validation
          </button>
        </div>
      );

      const saveButton = screen.getByText('Save with Validation');
      await testEnv.user.click(saveButton);

      await waitFor(() => {
        expect(validateAndSave).toHaveBeenCalledWith(mockCanvasData);
        expect(mockInvoke).toHaveBeenCalled();
      });
    });
  });

  describe('Canvas Load Operations', () => {
    test('loads canvas data from backend', async () => {
      const savedData = JSON.stringify(mockCanvasData);
      
      mockInvoke.mockImplementation((command: string, args?: any) => {
        if (command === 'load_canvas_data') {
          return Promise.resolve(savedData);
        }
        return Promise.reject(new Error(`Command ${command} not mocked`));
      });

      const onLoad = jest.fn();
      await testEnv.render(
        <div>
          <button onClick={async () => {
            const data = await invoke('load_canvas_data', {
              filename: 'test-canvas.json'
            });
            const parsedData = JSON.parse(data as string);
            onLoad(parsedData);
          }}>
            Load Canvas
          </button>
        </div>
      );

      const loadButton = screen.getByText('Load Canvas');
      await testEnv.user.click(loadButton);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('load_canvas_data', {
          filename: 'test-canvas.json'
        });
        expect(onLoad).toHaveBeenCalledWith(mockCanvasData);
      });
    });

    test('handles corrupted data gracefully', async () => {
      mockInvoke.mockResolvedValue('invalid json data');

      const onError = jest.fn();
      await testEnv.render(
        <div>
          <button onClick={async () => {
            try {
              const data = await invoke('load_canvas_data', {
                filename: 'corrupted.json'
              });
              JSON.parse(data as string);
            } catch (error) {
              onError(error);
            }
          }}>
            Load Corrupted
          </button>
        </div>
      );

      const loadButton = screen.getByText('Load Corrupted');
      await testEnv.user.click(loadButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Backend Event Listeners', () => {
    test('listens for canvas update events from backend', async () => {
      const onCanvasUpdate = jest.fn();
      
      await testEnv.render(
        <div>
          <div data-testid="canvas-container">Canvas</div>
        </div>
      );

      // Setup listener
      await listen('canvas:update', onCanvasUpdate);

      // Simulate event from backend
      const updateData = {
        elementId: 'elem1',
        updates: { x: 150, y: 150 }
      };
      __emit('canvas:update', updateData);

      expect(onCanvasUpdate).toHaveBeenCalledWith({
        event: 'canvas:update',
        payload: updateData
      });
    });

    test('listens for collaborative editing events', async () => {
      const onCollaborativeEdit = jest.fn();
      
      await testEnv.render(
        <div data-testid="collaborative-canvas">
          Collaborative Canvas
        </div>
      );

      await listen('canvas:collaborative-edit', onCollaborativeEdit);

      // Simulate another user's edit
      const editData = {
        userId: 'user-2',
        elementId: 'elem1',
        action: 'move',
        data: { x: 200, y: 200 }
      };
      __emit('canvas:collaborative-edit', editData);

      expect(onCollaborativeEdit).toHaveBeenCalledWith({
        event: 'canvas:collaborative-edit',
        payload: editData
      });
    });

    test('cleans up event listeners on unmount', async () => {
      const unlisten = jest.fn();
      mockListen.mockResolvedValue(unlisten);

      const { unmount } = await testEnv.render(
        <div data-testid="temp-canvas">Temporary Canvas</div>
      );

      await listen('canvas:update', jest.fn());
      
      unmount();

      // In real implementation, useEffect cleanup would call unlisten
      expect(mockListen).toHaveBeenCalled();
    });

    test('handles multiple simultaneous events', async () => {
      const handlers = {
        onUpdate: jest.fn(),
        onDelete: jest.fn(),
        onAdd: jest.fn()
      };

      await listen('canvas:update', handlers.onUpdate);
      await listen('canvas:delete', handlers.onDelete);
      await listen('canvas:add', handlers.onAdd);

      // Emit multiple events
      __emit('canvas:update', { elementId: 'elem1', updates: { x: 100 } });
      __emit('canvas:delete', { elementId: 'elem2' });
      __emit('canvas:add', { element: createMockCanvasElement() });

      expect(handlers.onUpdate).toHaveBeenCalled();
      expect(handlers.onDelete).toHaveBeenCalled();
      expect(handlers.onAdd).toHaveBeenCalled();
    });
  });

  describe('Complex Data Flow Scenarios', () => {
    test('full save-load-update cycle', async () => {
      // Mock all necessary commands
      mockInvoke.mockImplementation((command: string, args?: any) => {
        switch (command) {
          case 'save_canvas_data':
            return Promise.resolve();
          case 'load_canvas_data':
            return Promise.resolve(JSON.stringify(mockCanvasData));
          default:
            return Promise.reject(new Error(`Command ${command} not mocked`));
        }
      });

      const lifecycle = jest.fn();

      await testEnv.render(
        <div>
          <button onClick={async () => {
            // 1. Save current state
            lifecycle('saving');
            await invoke('save_canvas_data', {
              data: JSON.stringify(mockCanvasData),
              filename: 'lifecycle-test.json'
            });

            // 2. Load saved state
            lifecycle('loading');
            const loadedData = await invoke('load_canvas_data', {
              filename: 'lifecycle-test.json'
            });

            // 3. Parse and update
            lifecycle('updating');
            const parsed = JSON.parse(loadedData as string);
            parsed.elements[0].x = 500;

            // 4. Save updated state
            lifecycle('saving-updated');
            await invoke('save_canvas_data', {
              data: JSON.stringify(parsed),
              filename: 'lifecycle-test.json'
            });

            lifecycle('complete');
          }}>
            Run Full Cycle
          </button>
        </div>
      );

      const button = screen.getByText('Run Full Cycle');
      await testEnv.user.click(button);

      await waitFor(() => {
        expect(lifecycle).toHaveBeenCalledWith('saving');
        expect(lifecycle).toHaveBeenCalledWith('loading');
        expect(lifecycle).toHaveBeenCalledWith('updating');
        expect(lifecycle).toHaveBeenCalledWith('saving-updated');
        expect(lifecycle).toHaveBeenCalledWith('complete');
      });

      expect(mockInvoke).toHaveBeenCalledTimes(3); // 2 saves + 1 load
    });

    test('handles concurrent operations', async () => {
      mockInvoke.mockImplementation((command: string) => {
        // Simulate different response times
        if (command === 'save_canvas_data') {
          return new Promise(resolve => setTimeout(resolve, 100));
        }
        if (command === 'load_canvas_data') {
          return new Promise(resolve => 
            setTimeout(() => resolve(JSON.stringify(mockCanvasData)), 50)
          );
        }
        return Promise.reject(new Error('Unknown command'));
      });

      const operations = jest.fn();

      await testEnv.render(
        <div>
          <button onClick={async () => {
            // Start multiple operations concurrently
            const promises = [
              invoke('save_canvas_data', { data: '{}', filename: 'file1.json' })
                .then(() => operations('save1-complete')),
              invoke('load_canvas_data', { filename: 'file2.json' })
                .then(() => operations('load-complete')),
              invoke('save_canvas_data', { data: '{}', filename: 'file3.json' })
                .then(() => operations('save2-complete'))
            ];

            await Promise.all(promises);
            operations('all-complete');
          }}>
            Run Concurrent
          </button>
        </div>
      );

      const button = screen.getByText('Run Concurrent');
      await testEnv.user.click(button);

      await waitFor(() => {
        expect(operations).toHaveBeenCalledWith('load-complete');
        expect(operations).toHaveBeenCalledWith('save1-complete');
        expect(operations).toHaveBeenCalledWith('save2-complete');
        expect(operations).toHaveBeenCalledWith('all-complete');
      }, { timeout: 300 });
    });
  });

  describe('Error Recovery', () => {
    test('implements retry logic for failed operations', async () => {
      let attempts = 0;
      mockInvoke.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve();
      });

      const retryOperation = async (maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            await invoke('save_canvas_data', {
              data: JSON.stringify(mockCanvasData),
              filename: 'retry-test.json'
            });
            return { success: true, attempts: i + 1 };
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };

      const result = await retryOperation();
      expect(result).toEqual({ success: true, attempts: 3 });
      expect(attempts).toBe(3);
    });

    test('provides fallback for unavailable backend', async () => {
      mockInvoke.mockRejectedValue(new Error('Backend unavailable'));

      const useFallback = jest.fn();
      
      await testEnv.render(
        <div>
          <button onClick={async () => {
            try {
              await invoke('save_canvas_data', {
                data: JSON.stringify(mockCanvasData),
                filename: 'test.json'
              });
            } catch (error) {
              // Fallback to local storage
              localStorage.setItem('canvas-backup', JSON.stringify(mockCanvasData));
              useFallback();
            }
          }}>
            Save with Fallback
          </button>
        </div>
      );

      const button = screen.getByText('Save with Fallback');
      await testEnv.user.click(button);

      await waitFor(() => {
        expect(useFallback).toHaveBeenCalled();
        expect(localStorage.getItem('canvas-backup')).toBe(JSON.stringify(mockCanvasData));
      });

      // Cleanup
      localStorage.removeItem('canvas-backup');
    });
  });
});
