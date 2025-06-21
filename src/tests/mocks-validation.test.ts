import { describe, test, expect, beforeEach } from '@jest/globals';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit, __emit, __clearListeners } from '@tauri-apps/api/event';

describe('Mock Validation Tests', () => {
  beforeEach(() => {
    // Clear mocks between tests
    __clearListeners();
    (invoke as jest.MockedFunction<typeof invoke>).mockClear();
  });

  describe('Tauri API Mocks', () => {
    test('invoke mock is properly set up', async () => {
      const mockInvoke = invoke as jest.MockedFunction<typeof invoke>;
      mockInvoke.mockResolvedValue({ success: true });

      const result = await invoke('test_command', { data: 'test' });
      
      expect(mockInvoke).toHaveBeenCalledWith('test_command', { data: 'test' });
      expect(result).toEqual({ success: true });
    });    test('event system mock is properly configured', async () => {
      // Test that listen is a mock function
      expect(listen).toBeDefined();
      expect(jest.isMockFunction(listen)).toBe(true);
      
      // Test that __emit helper exists
      expect(__emit).toBeDefined();
      expect(typeof __emit).toBe('function');
      
      // Test that __clearListeners helper exists
      expect(__clearListeners).toBeDefined();
      expect(typeof __clearListeners).toBe('function');
    });test('import.meta.env is mocked', () => {
      // Access through global since direct import.meta syntax doesn't work in Jest
      const importMeta = (global as any).import?.meta;
      expect(importMeta).toBeDefined();
      expect(importMeta.env.MODE).toBe('test');
      expect(importMeta.env.DEV).toBe(false);
      expect(importMeta.env.PROD).toBe(true);
    });
  });

  describe('Jest Environment', () => {
    test('jest globals are available', () => {
      expect(jest).toBeDefined();
      expect(expect).toBeDefined();
      expect(describe).toBeDefined();
      expect(test).toBeDefined();
    });

    test('jsdom environment is working', () => {
      expect(document).toBeDefined();
      expect(window).toBeDefined();
      expect(window.matchMedia).toBeDefined();
    });
  });
});
