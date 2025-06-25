/**
 * Reliability Validation Test
 * Tests that our reliability improvements are working correctly
 */

import { describe, test, expect, vi } from 'vitest';
import { EventHandlerManager } from '../utils/state/EventHandlerManager';
import { enhancedFeatureFlagManager } from '../utils/state/EnhancedFeatureFlagManager';

describe('Reliability System Validation', () => {
  test('EventHandlerManager creates safe handlers', () => {
    const manager = new EventHandlerManager();
    
    const originalHandler = vi.fn();
    const fallbackHandler = vi.fn();
    
    const safeHandler = manager.createSafeEventHandler(
      'test-handler',
      originalHandler,
      fallbackHandler
    );
    
    expect(typeof safeHandler).toBe('function');
    
    // Test normal execution
    const mockEvent = { target: { id: () => 'test' } } as any;
    safeHandler(mockEvent);
    
    expect(originalHandler).toHaveBeenCalledWith(mockEvent);
  });

  test('EventHandlerManager handles errors gracefully', async () => {
    const manager = new EventHandlerManager();
    
    const errorHandler = vi.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    const fallbackHandler = vi.fn();
    
    const safeHandler = manager.createSafeEventHandler(
      'error-handler',
      errorHandler,
      fallbackHandler
    );
    
    const mockEvent = { target: { id: () => 'test' } } as any;
    
    // Should not throw
    expect(() => safeHandler(mockEvent)).not.toThrow();
    
    // Give time for async error handling
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(errorHandler).toHaveBeenCalled();
    expect(fallbackHandler).toHaveBeenCalled();
  });

  test('EnhancedFeatureFlagManager provides flags', () => {
    const centralizedTransformer = enhancedFeatureFlagManager.getFlag('centralized-transformer');
    const groupedSections = enhancedFeatureFlagManager.getFlag('grouped-section-rendering');
    
    expect(typeof centralizedTransformer).toBe('boolean');
    expect(typeof groupedSections).toBe('boolean');
  });

  test('EnhancedFeatureFlagManager handles unknown flags gracefully', () => {
    const unknownFlag = enhancedFeatureFlagManager.getFlag('non-existent-flag');
    
    // Should return false for unknown flags
    expect(unknownFlag).toBe(false);
  });
  test('EventHandlerManager metrics tracking', () => {
    const manager = new EventHandlerManager();
    
    const handler = vi.fn();
    const safeHandler = manager.createSafeEventHandler('metrics-test', handler);
    
    const mockEvent = { target: { id: () => 'test' } } as any;
    safeHandler(mockEvent);
    
    const metrics = manager.getHandlerMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.has('metrics-test')).toBe(true);
    
    const handlerMetrics = metrics.get('metrics-test');
    expect(handlerMetrics?.successCount).toBeGreaterThan(0);
  });
});
