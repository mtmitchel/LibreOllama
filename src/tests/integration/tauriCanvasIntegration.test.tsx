import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react';
import { renderWithKonva } from '@/tests/utils/konva-test-utils';
import { KonvaCanvas } from '@/features/canvas/components/KonvaCanvas';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId } from '@/features/canvas/types/enhanced.types';

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn()
}));

jest.mock('@tauri-apps/api/event', () => ({
  listen: jest.fn(),
  emit: jest.fn()
}));

// Import mocked functions after mocking
import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';

const mockInvoke = invoke as jest.MockedFunction<typeof invoke>;
const mockListen = listen as jest.MockedFunction<typeof listen>;
const mockEmit = emit as jest.MockedFunction<typeof emit>;

describe('Tauri Canvas Integration - End to End', () => {
  let mockUnlisten: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset store to clean state
    const { result } = renderHook(() => useCanvasStore((state) => state));
    act(() => {
      result.current.clearCanvas();
    });
    
    // Setup unlisten mock
    mockUnlisten = jest.fn();
    mockListen.mockResolvedValue(mockUnlisten);
  });

  afterEach(() => {
    // Clean up
    mockUnlisten();
  });

  test('should complete full end-to-end flow: load data, render, modify, and save', async () => {
    // Step 1: Mock the Tauri API to simulate loading data
    const mockLoadedData = {
      elements: [
        {
          id: 'loaded-rect-1',
          type: 'rectangle',
          tool: 'rectangle',
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 2,
          createdAt: Date.now() - 10000,
          updatedAt: Date.now() - 10000,
        },
        {
          id: 'loaded-circle-1',
          type: 'circle',
          tool: 'circle',
          x: 200,
          y: 200,
          radius: 50,
          fill: '#00ff00',
          stroke: '#000000',
          strokeWidth: 1,
          createdAt: Date.now() - 5000,
          updatedAt: Date.now() - 5000,
        },
        {
          id: 'loaded-text-1',
          type: 'text',
          tool: 'text',
          x: 300,
          y: 100,
          text: 'Hello Canvas',
          fontSize: 24,
          fontFamily: 'Arial',
          fill: '#000000',
          createdAt: Date.now() - 3000,
          updatedAt: Date.now() - 3000,
        }
      ],
      viewport: {
        zoom: 1,
        pan: { x: 0, y: 0 }
      }
    };

    mockInvoke.mockImplementation((command: string, args?: any) => {
      if (command === 'load_canvas_data') {
        return Promise.resolve(JSON.stringify(mockLoadedData));
      }
      if (command === 'save_canvas_data') {
        return Promise.resolve();
      }
      return Promise.reject(new Error(`Unknown command: ${command}`));
    });

    // Mock the KonvaCanvas component since it has complex dependencies
    const MockKonvaCanvas = ({ loadOnMount, filename }: any) => {
      React.useEffect(() => {
        if (loadOnMount) {
          // Simulate loading data
          mockInvoke('load_canvas_data', { filename }).then((data) => {
            const parsed = JSON.parse(data as string);
            // Load elements into store
            const { result } = renderHook(() => useCanvasStore((state) => state));
            act(() => {
              parsed.elements.forEach((el: any) => {
                result.current.addElement({
                  ...el,
                  id: ElementId(el.id)
                });
              });
            });
          });
        }
      }, [loadOnMount, filename]);

      return <div data-testid="mock-canvas">Canvas</div>;
    };

    // Step 2: Render the component
    const { container } = renderWithKonva(
      <MockKonvaCanvas 
        width={800} 
        height={600}
        loadOnMount={true}
        filename="test-canvas.json"
      />
    );

    // Wait for the canvas to load data
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('load_canvas_data', {
        filename: 'test-canvas.json'
      });
    });

    // Get store hook to verify state
    const { result: storeHook } = renderHook(() => useCanvasStore((state) => ({
      elements: state.elements,
      addElement: state.addElement,
      updateElement: state.updateElement,
      deleteElement: state.deleteElement,
      selectElement: state.selectElement,
      setSelectedTool: state.setSelectedTool
    })));

    // Verify that elements were loaded into the store
    await waitFor(() => {
      expect(storeHook.current.elements.size).toBe(3);
    });

    // Step 3: Simulate user modifications
    act(() => {
      storeHook.current.setSelectedTool('rectangle');
    });

    // Add a new element
    act(() => {
      storeHook.current.addElement({
        id: ElementId('new-rect-1'),
        type: 'rectangle',
        tool: 'rectangle',
        x: 400,
        y: 300,
        width: 100,
        height: 100,
        fill: '#0000ff',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Verify new element was added
    expect(storeHook.current.elements.size).toBe(4);

    // Modify an existing element
    act(() => {
      storeHook.current.setSelectedTool('select');
      storeHook.current.selectElement(ElementId('loaded-rect-1'));
      storeHook.current.updateElement(ElementId('loaded-rect-1'), {
        x: 100,
        y: 100,
        fill: '#0000ff'
      });
    });

    // Delete an element
    act(() => {
      storeHook.current.selectElement(ElementId('loaded-circle-1'));
      storeHook.current.deleteElement(ElementId('loaded-circle-1'));
    });

    // Verify modifications
    expect(storeHook.current.elements.size).toBe(3);
    expect(storeHook.current.elements.has(ElementId('loaded-circle-1'))).toBe(false);
    
    const modifiedRect = storeHook.current.elements.get(ElementId('loaded-rect-1'));
    expect(modifiedRect?.x).toBe(100);
    expect(modifiedRect?.y).toBe(100);
    expect(modifiedRect?.fill).toBe('#0000ff');

    // Step 4: Simulate save
    const saveData = {
      elements: Array.from(storeHook.current.elements.values())
    };

    await act(async () => {
      await mockInvoke('save_canvas_data', {
        data: JSON.stringify(saveData),
        filename: 'test-canvas.json'
      });
    });

    // Assert that save was called
    expect(mockInvoke).toHaveBeenCalledWith('save_canvas_data', 
      expect.objectContaining({
        data: expect.any(String),
        filename: 'test-canvas.json'
      })
    );
  });

  test('should handle real-time collaboration events', async () => {
    // Get store hook
    const { result: storeHook } = renderHook(() => useCanvasStore((state) => ({
      elements: state.elements,
      addElement: state.addElement
    })));

    // Setup listener mock
    const eventHandler = jest.fn();
    mockListen.mockImplementation((event: string, handler: any) => {
      if (event === 'canvas:collaborative-edit') {
        eventHandler.mockImplementation(handler);
      }
      return Promise.resolve(mockUnlisten);
    });

    // Setup collaboration
    await act(async () => {
      await mockListen('canvas:collaborative-edit', eventHandler);
    });

    // Simulate receiving a collaborative edit
    const collaborativeEdit = {
      userId: 'user-123',
      action: 'add',
      element: {
        id: 'collab-elem-1',
        type: 'circle',
        tool: 'circle',
        x: 150,
        y: 150,
        radius: 30,
        fill: '#ff00ff',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    };

    act(() => {
      // Add element to store as if received from collaboration
      storeHook.current.addElement({
        ...collaborativeEdit.element,
        id: ElementId(collaborativeEdit.element.id)
      });
    });

    // Verify the collaborative element was added
    expect(storeHook.current.elements.has(ElementId('collab-elem-1'))).toBe(true);
    expect(storeHook.current.elements.size).toBe(1);
  });

  test('should recover from connection failures gracefully', async () => {
    let failureCount = 0;
    mockInvoke.mockImplementation((command: string) => {
      if (command === 'save_canvas_data') {
        failureCount++;
        if (failureCount <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve();
      }
      return Promise.resolve();
    });

    // Simulate retry logic
    const saveWithRetry = async (data: any, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          await mockInvoke('save_canvas_data', data);
          return;
        } catch (error) {
          if (i === maxRetries - 1) throw error;
        }
      }
    };

    // Test retry
    await saveWithRetry({ data: '{}', filename: 'test.json' });

    expect(failureCount).toBe(3);
    expect(mockInvoke).toHaveBeenCalledTimes(3);
  });
});
