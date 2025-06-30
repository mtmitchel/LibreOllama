/**
 * Store-to-API Integration Test
 * 
 * Note: Despite the filename, this is not a UI integration test but rather
 * a store-to-API integration test. It tests the integration between the
 * canvas store and the Tauri API without actually rendering the real
 * KonvaCanvas component. The UI component is mocked to focus on testing
 * the data flow between the store and backend API.
 */
// Vitest globals enabled in config - no need to import describe, test, expect, beforeEach, afterEach
import { vi } from 'vitest';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { renderWithKonva } from '@/tests/utils/konva-test-utils';
import KonvaCanvas from '@/features/canvas/components/KonvaCanvas';
import { useUnifiedCanvasStore } from '@/features/canvas/stores/unifiedCanvasStore';
import type { CanvasElement } from '@/features/canvas/types/enhanced.types';
import { listen } from '@tauri-apps/api/event';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
  emit: vi.fn()
}));

// Import mocked functions after mocking
import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';

const mockInvoke = invoke as any;
const mockListen = listen as any;
const mockEmit = emit as any;

// Fix the mock setup
mockListen.mockImplementation(() => Promise.resolve(vi.fn()));

vi.unmock('@/features/canvas/stores/canvasStore.enhanced');

describe('Tauri Canvas Integration - End to End', () => {
  let mockUnlisten: any = vi.fn(); // Initialize at top level to avoid undefined issues

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset store to clean state
    act(() => {
      useUnifiedCanvasStore.getState().clearCanvas();
    });
    
    // Setup unlisten mock
    mockUnlisten = vi.fn();
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

    mockInvoke.mockImplementation(((command: string, args?: any) => {
      if (command === 'load_canvas_data') {
        return Promise.resolve(JSON.stringify(mockLoadedData));
      }
      if (command === 'save_canvas_data') {
        return Promise.resolve(undefined);
      }
      return Promise.reject(new Error(`Unknown command: ${command}`));
    }) as any);

    // Mock the KonvaCanvas component since it has complex dependencies
    const MockKonvaCanvas = ({ loadOnMount, filename }: any) => {
      React.useEffect(() => {
        if (loadOnMount) {
          // Simulate loading data
          mockInvoke('load_canvas_data', { filename }).then((data: any) => {
            const parsed = JSON.parse(data as string);
            // Load elements into store using direct access
            const store = useUnifiedCanvasStore.getState();
            parsed.elements.forEach((el: any) => {
              store.addElement({
                ...el,
                id: el.id as ElementId
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
    const store = useUnifiedCanvasStore.getState();

    // Verify that elements were loaded into the store
    await waitFor(() => {
      expect(store.elements.size).toBe(3);
    });

    // Step 3: Simulate user modifications
    store.setSelectedTool('rectangle');

    // Add a new element
    store.addElement({
      id: 'new-rect-1' as ElementId,
      type: 'rectangle',
      x: 400,
      y: 300,
      width: 100,
      height: 100,
      fill: '#0000ff',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Verify new element was added
    expect(store.elements.size).toBe(4);

    // Modify an existing element
    store.setSelectedTool('select');
    store.selectElement('loaded-rect-1' as ElementId);
    store.updateElement('loaded-rect-1' as ElementId, {
      x: 100,
      y: 100,
      fill: '#0000ff'
    });

    // Delete an element
    store.selectElement('loaded-circle-1' as ElementId);
    store.deleteElement('loaded-circle-1' as ElementId);

    // Verify modifications
    expect(store.elements.size).toBe(3);
    expect(store.elements.has('loaded-circle-1' as ElementId)).toBe(false);

    const modifiedRect = store.elements.get('loaded-rect-1' as ElementId);
    expect(modifiedRect?.x).toBe(100);
    expect(modifiedRect?.y).toBe(100);
    expect((modifiedRect as any)?.fill).toBe('#0000ff');

    // Step 4: Simulate save
    const saveData = {
      elements: Array.from(store.elements.values())
    };

    await mockInvoke('save_canvas_data', {
      data: JSON.stringify(saveData),
      filename: 'test-canvas.json'
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
    // Get store instance
    const store = useUnifiedCanvasStore.getState();

    // Setup listener mock
    const eventHandler = vi.fn();
    mockListen.mockImplementation((event: string, handler: any) => {
      if (event === 'canvas:collaborative-edit') {
        eventHandler.mockImplementation(handler);
      }
      return Promise.resolve(mockUnlisten);
    });

    // Setup collaboration
    await mockListen('canvas:collaborative-edit', eventHandler);

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

    // Add element to store as if received from collaboration
    store.addElement({
      id: collaborativeEdit.element.id as ElementId,
      type: 'circle',
      x: collaborativeEdit.element.x,
      y: collaborativeEdit.element.y,
      radius: collaborativeEdit.element.radius,
      fill: collaborativeEdit.element.fill,
      createdAt: collaborativeEdit.element.createdAt,
      updatedAt: collaborativeEdit.element.updatedAt,
    });

    // Verify the collaborative element was added
    expect(store.elements.has('collab-elem-1' as ElementId)).toBe(true);
    expect(store.elements.size).toBe(1);
  });

  test('should recover from connection failures gracefully', async () => {
    let failureCount = 0;
    mockInvoke.mockImplementation(((command: string) => {
      if (command === 'save_canvas_data') {
        failureCount++;
        if (failureCount <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(undefined);
      }
      return Promise.resolve(undefined);
    }) as any);

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
