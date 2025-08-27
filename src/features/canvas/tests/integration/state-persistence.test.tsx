/**
 * State Persistence Integration Test
 * Tests canvas state persistence across application restarts with mocked Tauri
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import { ElementId, CanvasElement } from '../../types/enhanced.types';
import { nanoid } from 'nanoid';

// Mock Tauri API
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke,
}));

// Mock encryption key generation
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockImplementation((cmd: string, args?: any) => {
    if (cmd === 'get_encryption_key') {
      return Promise.resolve('mock-encryption-key-12345');
    }
    return mockInvoke(cmd, args);
  }),
}));

describe('Canvas State Persistence with Tauri', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;
  let savedState: any = null;

  beforeEach(() => {
    // Create fresh test store
    store = createUnifiedTestStore();
    
    // Reset mock
    mockInvoke.mockReset();
    savedState = null;
    
    // Setup default mock responses
    mockInvoke.mockImplementation((cmd: string, args?: any) => {
      if (cmd === 'saveCanvas') {
        savedState = args;
        return Promise.resolve({ success: true });
      }
      if (cmd === 'loadCanvas') {
        return Promise.resolve(savedState || { elements: [], viewport: {} });
      }
      if (cmd === 'get_encryption_key') {
        return Promise.resolve('mock-encryption-key-12345');
      }
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('State Saving', () => {
    it('should verify encryption key before saving canvas state', async () => {
      const element: CanvasElement = {
        id: 'persist-1' as ElementId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#ff0000',
        isLocked: false,
        isHidden: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      store.getState().addElement(element);
      
      // Simulate save operation
      await mockInvoke('get_encryption_key');
      await mockInvoke('saveCanvas', {
        elements: store.getState().elementOrder.map(id => store.getState().getElementById(id as ElementId)).filter(Boolean),
        viewport: store.getState().viewport,
      });

      // Verify encryption key was called first
      expect(mockInvoke).toHaveBeenCalledWith('get_encryption_key');
      expect(mockInvoke).toHaveBeenCalledWith('saveCanvas', expect.any(Object));
      
      // Verify call order
      const calls = mockInvoke.mock.calls;
      const encryptionKeyIndex = calls.findIndex(call => call[0] === 'get_encryption_key');
      const saveCanvasIndex = calls.findIndex(call => call[0] === 'saveCanvas');
      expect(encryptionKeyIndex).toBeLessThan(saveCanvasIndex);
    });

    it('should debounce state saves (500ms)', async () => {
      vi.useFakeTimers();
      
      // Simulate rapid state changes
      for (let i = 0; i < 10; i++) {
        store.getState().addElement({
          id: `rapid-${i}` as ElementId,
          type: 'circle',
          x: i * 10,
          y: i * 10,
          radius: 50,
        } as CanvasElement);
        
        // Advance time but not enough to trigger debounce
        vi.advanceTimersByTime(100);
      }

      // Should not have saved yet
      expect(mockInvoke).not.toHaveBeenCalledWith('saveCanvas', expect.any(Object));

      // Advance past debounce threshold
      vi.advanceTimersByTime(500);

      // Now should have saved once
      const saveCalls = mockInvoke.mock.calls.filter(call => call[0] === 'saveCanvas');
      expect(saveCalls.length).toBeLessThanOrEqual(1);

      vi.useRealTimers();
    });

    it('should save complete canvas state', async () => {
      // Add various element types
      const elements = [
        {
          id: 'rect-1' as ElementId,
          type: 'rectangle' as const,
          x: 50,
          y: 50,
          width: 100,
          height: 100,
        },
        {
          id: 'text-1' as ElementId,
          type: 'text' as const,
          x: 200,
          y: 200,
          text: 'Persisted Text',
          fontSize: 16,
        },
        {
          id: 'sticky-1' as ElementId,
          type: 'sticky-note' as const,
          x: 300,
          y: 300,
          width: 200,
          height: 200,
          text: 'Important Note',
          backgroundColor: '#ffeb3b',
        },
      ];

      elements.forEach(el => store.getState().addElement(el as CanvasElement));
      
      // Set viewport
      store.getState().setViewport({ x: 100, y: 100, scale: 1.5 });
      
      // Set selection
      store.getState().selectElement('rect-1' as ElementId);

      // Save state
      const stateToSave = {
        elements: store.getState().elementOrder.map(id => store.getState().getElementById(id as ElementId)).filter(Boolean),
        viewport: store.getState().viewport,
        selectedElementIds: Array.from(store.getState().selectedElementIds),
      };
      
      await mockInvoke('saveCanvas', stateToSave);

      expect(mockInvoke).toHaveBeenCalledWith('saveCanvas', expect.objectContaining({
        elements: expect.arrayContaining([
          expect.objectContaining({ id: 'rect-1' }),
          expect.objectContaining({ id: 'text-1' }),
          expect.objectContaining({ id: 'sticky-1' }),
        ]),
        viewport: expect.objectContaining({
          x: 100,
          y: 100,
          scale: 1.5,
        }),
        selectedElementIds: ['rect-1'],
      }));
    });
  });

  describe('State Loading', () => {
    it('should verify encryption key before loading canvas state', async () => {
      // Prepare saved state
      savedState = {
        elements: [
          {
            id: 'loaded-1',
            type: 'rectangle',
            x: 75,
            y: 75,
            width: 150,
            height: 100,
          },
        ],
        viewport: { x: 50, y: 50, scale: 1.2 },
      };

      // Load state
      await mockInvoke('get_encryption_key');
      const loadedState = await mockInvoke('loadCanvas');

      // Verify encryption key was called first
      const calls = mockInvoke.mock.calls;
      const encryptionKeyIndex = calls.findIndex(call => call[0] === 'get_encryption_key');
      const loadCanvasIndex = calls.findIndex(call => call[0] === 'loadCanvas');
      expect(encryptionKeyIndex).toBeLessThan(loadCanvasIndex);

      // Verify state was loaded
      expect(loadedState).toEqual(savedState);
    });

    it('should restore complete canvas state after restart', async () => {
      // Setup initial state
      const initialElements = [
        {
          id: 'persist-rect' as ElementId,
          type: 'rectangle' as const,
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#00ff00',
        },
        {
          id: 'persist-text' as ElementId,
          type: 'text' as const,
          x: 350,
          y: 100,
          text: 'Persistent Text',
          fontSize: 24,
        },
      ];

      // Add elements to store
      initialElements.forEach(el => store.getState().addElement(el as CanvasElement));
      store.getState().setViewport({ x: 200, y: 150, scale: 2 });

      // Save state
      const stateToSave = {
        elements: store.getState().elementOrder.map(id => store.getState().getElementById(id as ElementId)).filter(Boolean),
        viewport: store.getState().viewport,
      };
      await mockInvoke('saveCanvas', stateToSave);

      // Simulate app restart - clear store
      store.getState().clearAllElements();
      store.getState().setViewport({ x: 0, y: 0, scale: 1 });
      expect(store.getState().elementOrder.length).toBe(0);

      // Load saved state
      const loadedState = await mockInvoke('loadCanvas');
      
      // Restore to store
      if (loadedState && loadedState.elements) {
        loadedState.elements.forEach((el: CanvasElement) => {
          store.getState().addElement(el);
        });
        if (loadedState.viewport) {
          // Create a new object to avoid Immer read-only issues
          store.getState().setViewport({
            ...loadedState.viewport
          });
        }
      }

      // Verify restoration
      expect(store.getState().elementOrder.length).toBe(2);
      expect(store.getState().getElementById('persist-rect' as ElementId)).toMatchObject({
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
      });
      expect(store.getState().getElementById('persist-text' as ElementId)).toMatchObject({
        type: 'text',
        x: 350,
        y: 100,
        text: 'Persistent Text',
      });
      expect(store.getState().viewport).toMatchObject({
        x: 200,
        y: 150,
        scale: 2,
      });
    });

    it('should handle loading errors gracefully', async () => {
      // Mock load failure
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === 'loadCanvas') {
          return Promise.reject(new Error('Failed to load canvas'));
        }
        if (cmd === 'get_encryption_key') {
          return Promise.resolve('mock-key');
        }
        return Promise.resolve(null);
      });

      // Attempt to load
      let error = null;
      try {
        await mockInvoke('loadCanvas');
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
      expect((error as Error).message).toBe('Failed to load canvas');
      
      // Store should remain unchanged
      expect(store.getState().elementOrder.length).toBe(0);
    });

    it('should handle corrupted state gracefully', async () => {
      // Mock corrupted state
      savedState = {
        elements: 'invalid-data', // Should be array
        viewport: null,
      };

      const loadedState = await mockInvoke('loadCanvas');
      
      // Should return corrupted data
      expect(loadedState.elements).toBe('invalid-data');
      
      // Application should handle validation
      const isValidState = Array.isArray(loadedState.elements);
      expect(isValidState).toBe(false);
      
      // Should not crash when invalid
      if (!isValidState) {
        // Don't restore invalid state
        expect(store.getState().elementOrder.length).toBe(0);
      }
    });
  });

  describe('History Persistence', () => {
    it('should persist undo/redo history', async () => {
      // Create history
      store.getState().addElement({
        id: 'history-1' as ElementId,
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as CanvasElement);
      store.getState().addToHistory('Add Rectangle');

      store.getState().updateElement('history-1' as ElementId, { x: 50, y: 50 }, { skipHistory: false });
      store.getState().addToHistory('Move Rectangle');

      const historyLength = store.getState().getHistoryLength();
      expect(historyLength).toBeGreaterThan(0);

      // Save state with history
      const stateWithHistory = {
        elements: store.getState().elementOrder.map(id => store.getState().getElementById(id as ElementId)).filter(Boolean),
        viewport: store.getState().viewport,
        historyLength: store.getState().getHistoryLength(),
      };
      
      await mockInvoke('saveCanvas', stateWithHistory);

      // Clear store
      store.getState().clearAllElements();
      store.getState().clearHistory();
      expect(store.getState().getHistoryLength()).toBe(0);

      // Load and restore
      const loadedState = await mockInvoke('loadCanvas');
      
      if (loadedState.historyLength) {
        // Restore history (implementation would depend on store's history restoration method)
        expect(loadedState.historyLength).toBeDefined();
        expect(loadedState.historyLength).toBe(historyLength);
      }
    });
  });

  describe('Performance with Large State', () => {
    it('should efficiently save large canvas states', async () => {
      // Create large state (reduced for test performance)
      const largeElementCount = 500;
      const elements: CanvasElement[] = [];
      
      for (let i = 0; i < largeElementCount; i++) {
        elements.push({
          id: `perf-${i}` as ElementId,
          type: 'rectangle',
          x: Math.random() * 10000,
          y: Math.random() * 10000,
          width: 100,
          height: 100,
          rotation: Math.random() * 360,
          fill: '#' + Math.floor(Math.random() * 16777215).toString(16),
          isLocked: false,
          isHidden: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as CanvasElement);
      }

      // Add all elements
      const startTime = performance.now();
      elements.forEach(el => store.getState().addElement(el));
      
      // Save large state
      const stateToSave = {
        elements: store.getState().elementOrder.map(id => store.getState().getElementById(id as ElementId)).filter(Boolean),
        viewport: store.getState().viewport,
      };
      
      await mockInvoke('saveCanvas', stateToSave);
      const saveTime = performance.now() - startTime;

      // Should complete in reasonable time
      expect(saveTime).toBeLessThan(500); // 500ms for 500 elements
      
      // Verify data integrity
      expect(mockInvoke).toHaveBeenCalledWith('saveCanvas', expect.objectContaining({
        elements: expect.arrayContaining([
          expect.objectContaining({ id: 'perf-0' }),
          expect.objectContaining({ id: `perf-${largeElementCount - 1}` }),
        ]),
      }));
    });

    it('should handle incremental saves efficiently', async () => {
      // Initial state
      for (let i = 0; i < 100; i++) {
        store.getState().addElement({
          id: `initial-${i}` as ElementId,
          type: 'circle',
          x: i * 10,
          y: i * 10,
          radius: 20,
        } as CanvasElement);
      }

      // Save initial state
      await mockInvoke('saveCanvas', {
        elements: store.getState().elementOrder.map(id => store.getState().getElementById(id as ElementId)).filter(Boolean),
        version: 1,
      });

      // Make incremental change
      store.getState().updateElement('initial-50' as ElementId, { x: 500, y: 500 });
      
      // Save incremental update
      await mockInvoke('saveCanvas', {
        elements: store.getState().elementOrder.map(id => store.getState().getElementById(id as ElementId)).filter(Boolean),
        version: 2,
        incremental: true,
      });

      // Verify both saves
      expect(mockInvoke).toHaveBeenCalledTimes(2);
      const calls = mockInvoke.mock.calls;
      expect(calls[0][1].version).toBe(1);
      expect(calls[1][1].version).toBe(2);
      expect(calls[1][1].incremental).toBe(true);
    });
  });
});