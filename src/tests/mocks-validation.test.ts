// Vitest globals enabled in config - no need to import describe, test, expect, beforeEach
import { vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit, __emit, __clearListeners } from '@tauri-apps/api/event';

describe('Mock Validation Tests', () => {
  beforeEach(() => {
    // Clear mocks between tests
    __clearListeners();
    (invoke as any).mockClear();
  });

  describe('Tauri API Mocks', () => {
    test('invoke mock is properly set up', async () => {
      const mockInvoke = invoke as any;
      mockInvoke.mockResolvedValue({ success: true });

      const result = await invoke('test_command', { data: 'test' });
      
      expect(mockInvoke).toHaveBeenCalledWith('test_command', { data: 'test' });
      expect(result).toEqual({ success: true });
    });    test('event system mock is properly configured', async () => {
      // Test that listen is a mock function
      expect(listen).toBeDefined();
      expect(vi.isMockFunction(listen)).toBe(true);
      
      // Test that __emit helper exists
      expect(__emit).toBeDefined();
      expect(typeof __emit).toBe('function');
      
      // Test that __clearListeners helper exists
      expect(__clearListeners).toBeDefined();
      expect(typeof __clearListeners).toBe('function');
    });

    test('import.meta.env is mocked', () => {
      // Vitest provides import.meta.env automatically
      expect(import.meta.env).toBeDefined();
      expect(import.meta.env.MODE).toBe('test');
      expect(import.meta.env.DEV).toBe(true); // Vitest sets DEV to true in test mode
      expect(import.meta.env.PROD).toBe(false); // In test mode, PROD should be false
    });
  });

  describe('Jest Environment', () => {
    test('jest globals are available', () => {
      expect(vi).toBeDefined();
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
