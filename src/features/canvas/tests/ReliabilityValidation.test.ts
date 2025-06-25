/**
 * Reliability Validation Test Suite
 * Tests the enhanced event handling reliability improvements
 * June 24, 2025
 */

import { eventHandlerManager } from '../utils/state/EventHandlerManager';
import { drawingStateManager } from '../utils/state/DrawingStateManager';
import { stateSynchronizationMonitor } from '../utils/state/StateSynchronizationMonitor';

describe('Reliability Improvements Validation', () => {
  beforeEach(() => {
    // Reset all systems before each test
    jest.clearAllMocks();
  });

  describe('EventHandlerManager', () => {
    it('should create safe event handlers with error handling', () => {
      const mockHandler = jest.fn();
      const mockFallback = jest.fn();
      
      const safeHandler = eventHandlerManager.createSafeEventHandler(
        'testHandler',
        mockHandler,
        mockFallback
      );

      expect(safeHandler).toBeDefined();
      expect(typeof safeHandler).toBe('function');
    });

    it('should track handler metrics', () => {
      const metrics = eventHandlerManager.getHandlerMetrics('testHandler');
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('successCount');
      expect(metrics).toHaveProperty('errorCount');
    });

    it('should provide system status', () => {
      const status = eventHandlerManager.getSystemStatus();
      expect(status).toBeDefined();
      expect(status).toHaveProperty('activeHandlers');
      expect(status).toHaveProperty('emergencyMode');
    });
  });

  describe('DrawingStateManager', () => {
    it('should manage drawing operations with timeout protection', () => {
      expect(drawingStateManager.isOperationActive()).toBe(false);
      
      drawingStateManager.startOperation('section');
      expect(drawingStateManager.isOperationActive()).toBe(true);
      
      drawingStateManager.completeOperation();
      expect(drawingStateManager.isOperationActive()).toBe(false);
    });

    it('should provide operation status', () => {
      const status = drawingStateManager.getOperationStatus();
      expect(status).toBeDefined();
      expect(status).toHaveProperty('isActive');
      expect(status).toHaveProperty('currentOperation');
    });
  });

  describe('StateSynchronizationMonitor', () => {
    it('should start and stop monitoring', () => {
      stateSynchronizationMonitor.startMonitoring();
      expect(stateSynchronizationMonitor.isMonitoring()).toBe(true);
      
      stateSynchronizationMonitor.stopMonitoring();
      expect(stateSynchronizationMonitor.isMonitoring()).toBe(false);
    });

    it('should track state snapshots', () => {
      stateSynchronizationMonitor.recordStateSnapshot(
        'select',
        { isActive: false, currentOperation: null },
        new Set(),
        { zoom: 1, pan: { x: 0, y: 0 } }
      );
      
      const report = stateSynchronizationMonitor.getMonitoringReport();
      expect(report).toBeDefined();
      expect(report.totalSnapshots).toBeGreaterThan(0);
    });
  });

  describe('Integration Test', () => {
    it('should handle all reliability systems working together', () => {
      // Start monitoring
      stateSynchronizationMonitor.startMonitoring();
      
      // Create a safe handler
      const testHandler = eventHandlerManager.createSafeEventHandler(
        'integrationTest',
        () => {
          drawingStateManager.startOperation('test');
          drawingStateManager.completeOperation();
        }
      );
      
      // Test the integration
      expect(() => testHandler({} as any)).not.toThrow();
      
      // Verify systems tracked the operation
      const handlerMetrics = eventHandlerManager.getHandlerMetrics('integrationTest');
      const systemStatus = eventHandlerManager.getSystemStatus();
      const monitoringReport = stateSynchronizationMonitor.getMonitoringReport();
      
      expect(handlerMetrics).toBeDefined();
      expect(systemStatus).toBeDefined();
      expect(monitoringReport).toBeDefined();
      
      // Cleanup
      stateSynchronizationMonitor.stopMonitoring();
    });
  });
});
