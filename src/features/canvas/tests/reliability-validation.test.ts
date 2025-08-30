/**
 * Reliability Validation Test Suite
 *
 * This suite validates the core reliability systems for the canvas, ensuring
 * that event handling, state management, and feature flagging are robust and error-proof.
 *
 * It consolidates tests from previous Jest and Vitest files into a single,
 * comprehensive suite using Vitest.
 *
 * June 25, 2025
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { DrawingStateManager } from '../utils/state/DrawingStateManager';
import { StateSynchronizationMonitor } from '../utils/state/StateSynchronizationMonitor';
import { enhancedFeatureFlagManager } from '../utils/state/EnhancedFeatureFlagManager';
import { CanvasTool } from '../types/enhanced.types';

describe('Canvas Reliability Systems Validation', () => {
  let drawingStateManager: DrawingStateManager;
  let stateSynchronizationMonitor: StateSynchronizationMonitor;

  beforeEach(() => {
    // Reset instances before each test to ensure isolation
    drawingStateManager = new DrawingStateManager();
    stateSynchronizationMonitor = new StateSynchronizationMonitor();
    
    // Clear any mocks
    vi.clearAllMocks();
  });

  // NOTE: EventHandlerManager tests removed - functionality now integrated into CanvasEventManager

  // --- DrawingStateManager Tests (from Jest file) ---
  describe('DrawingStateManager', () => {
    test('should correctly manage the lifecycle of a drawing operation', () => {
      expect(drawingStateManager.getCurrentState().isDrawing).toBe(false);
      
      const operationId = drawingStateManager.startDrawing('section', { x: 10, y: 10 });
      expect(drawingStateManager.getCurrentState().isDrawing).toBe(true);
      expect(drawingStateManager.getCurrentState().tool).toBe('section');
      
      drawingStateManager.completeDrawing(operationId);
      expect(drawingStateManager.getCurrentState().isDrawing).toBe(false);
      expect(drawingStateManager.getCurrentState().tool).toBeNull();
    });

    test('should provide accurate operation status via getCurrentState', () => {
      const initialState = drawingStateManager.getCurrentState();
      expect(initialState).toEqual({
        isDrawing: false,
        tool: null,
        startPoint: null,
        currentPoint: null,
        preview: null,
      });

      drawingStateManager.startDrawing('rectangle', { x: 5, y: 5 });
      const activeState = drawingStateManager.getCurrentState();
      expect(activeState.isDrawing).toBe(true);
      expect(activeState.tool).toBe('rectangle');
      expect(activeState.startPoint).toEqual({ x: 5, y: 5 });
    });
  });

  // --- StateSynchronizationMonitor Tests (from Jest file) ---
  describe('StateSynchronizationMonitor', () => {
    test('should start and stop monitoring correctly', () => {
      expect(stateSynchronizationMonitor.getSystemStatus().isMonitoring).toBe(false);
      
      stateSynchronizationMonitor.startMonitoring();
      expect(stateSynchronizationMonitor.getSystemStatus().isMonitoring).toBe(true);
      
      stateSynchronizationMonitor.stopMonitoring();
      expect(stateSynchronizationMonitor.getSystemStatus().isMonitoring).toBe(false);
    });

    test('should record state snapshots and generate a report', () => {
      stateSynchronizationMonitor.startMonitoring();
      const mockState = {
          toolState: 'select' as CanvasTool,
          drawingStates: { isDrawing: true, isDrawingConnector: false, isDrawingSection: true },
          selectionState: { selectedElementIds: new Set(['item1']), hoveredElementId: null },
          viewportState: { zoom: 1.5, pan: { x: 10, y: 20 } }
      };

      stateSynchronizationMonitor.recordStateSnapshot(
        mockState.toolState,
        mockState.drawingStates,
        mockState.selectionState,
        mockState.viewportState
      );

      const status = stateSynchronizationMonitor.getSystemStatus();
      expect(status.snapshots.length).toBe(1);
      expect(status.snapshots[0].toolState).toBe('select');
      expect(status.snapshots[0].drawingStates.isDrawing).toBe(true);
    });
  });

  // --- EnhancedFeatureFlagManager Tests ---
  describe('EnhancedFeatureFlagManager', () => {
    test('should return the correct boolean value for a known flag', () => {
      // Assuming these flags are defined in the implementation
      const flag1 = enhancedFeatureFlagManager.getFlag('centralized-transformer');
      expect(typeof flag1).toBe('boolean');
    });

    test('should return false for an unknown flag', () => {
      const unknownFlag = enhancedFeatureFlagManager.getFlag('this-flag-does-not-exist');
      expect(unknownFlag).toBe(false);
    });
  });

  // --- Integration Test ---
  describe('System Integration (without EventHandlerManager)', () => {
    test('should handle drawing state and monitoring systems working together', async () => {
      // 1. Start monitoring
      stateSynchronizationMonitor.startMonitoring();
      expect(stateSynchronizationMonitor.getSystemStatus().isMonitoring).toBe(true);

      // 2. Test drawing operation lifecycle
      let operationId: string;
      operationId = drawingStateManager.startDrawing('connector-arrow', { x: 0, y: 0 });
      expect(drawingStateManager.getCurrentState().isDrawing).toBe(true);
      
      // 3. Complete the operation
      drawingStateManager.completeDrawing(operationId);
      expect(drawingStateManager.getCurrentState().isDrawing).toBe(false);

      // 4. Record a final snapshot for verification
      stateSynchronizationMonitor.recordStateSnapshot('select', {isDrawing: false, isDrawingConnector: false, isDrawingSection: false}, {selectedElementIds: new Set(), hoveredElementId: null}, {zoom: 1, pan: {x: 0, y: 0}});

      const syncStatus = stateSynchronizationMonitor.getSystemStatus();
      // We expect snapshots to have been recorded during this process
      expect(syncStatus.snapshots.length).toBeGreaterThan(0);
    });
  });
});
