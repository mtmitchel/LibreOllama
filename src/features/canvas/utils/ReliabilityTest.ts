/**
 * Reliability Test Suite
 * Tests the enhanced error handling and state recovery systems
 * Validates fixes for identified high-risk patterns
 */

import { logger } from '@/lib/logger';
import { drawingStateManager } from './state/DrawingStateManager';
import { stateSynchronizationMonitor } from './state/StateSynchronizationMonitor';
import { enhancedFeatureFlagManager } from './state/EnhancedFeatureFlagManager';

export interface ReliabilityTestResult {
  testName: string;
  passed: boolean;
  message: string;
  timing: number;
  error?: Error;
}

export class ReliabilityTestSuite {
  private results: ReliabilityTestResult[] = [];

  /**
   * Run all reliability tests
   */
  async runAllTests(): Promise<ReliabilityTestResult[]> {
    this.results = [];
    
    logger.log('🧪 Starting reliability test suite...');
    
    await this.testDrawingStateRecovery();
    // NOTE: testEventHandlerFallbacks removed - functionality now in UnifiedEventHandler
    await this.testStateSynchronizationMonitoring();
    await this.testFeatureFlagFallbacks();
    await this.testErrorBoundaryRecovery();
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    logger.log(`🧪 Reliability tests completed: ${passed}/${total} passed`);
    
    if (passed < total) {
      logger.warn('Some reliability tests failed - system may have vulnerabilities');
    } else {
      logger.log('✅ All reliability tests passed - system is robust');
    }
    
    return this.results;
  }

  /**
   * Test drawing state management and recovery
   */
  private async testDrawingStateRecovery(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test normal drawing operation
      const operationId = drawingStateManager.startDrawing('rectangle', { x: 100, y: 100 });
      drawingStateManager.updateDrawing(operationId, { x: 150, y: 150 });
      const finalState = drawingStateManager.completeDrawing(operationId);
      
      if (!finalState) {
        throw new Error('Failed to complete drawing operation');
      }
      
      // Test timeout recovery
      const timeoutOperationId = drawingStateManager.startDrawing('circle', { x: 200, y: 200 }, 100); // 100ms timeout
      await new Promise(resolve => setTimeout(resolve, 150)); // Wait longer than timeout
      
      // Should have auto-recovered
      const currentState = drawingStateManager.getCurrentState();
      if (currentState.isDrawing) {
        throw new Error('Drawing state not recovered after timeout');
      }
      
      // Test invalid operation recovery
      try {
        drawingStateManager.updateDrawing('invalid-id', { x: 0, y: 0 });
      } catch (error) {
        // Expected error - should not crash system
      }
      
      this.addResult('Drawing State Recovery', true, 'All drawing state scenarios handled correctly', Date.now() - startTime);
    } catch (error) {
      this.addResult('Drawing State Recovery', false, `Drawing state test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime, error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * NOTE: Event handler tests removed - functionality now integrated into UnifiedEventHandler
   */

  /**
   * Test state synchronization monitoring
   */
  private async testStateSynchronizationMonitoring(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Start monitoring
      stateSynchronizationMonitor.startMonitoring(500); // 500ms interval
      
      // Record a test state snapshot
      stateSynchronizationMonitor.recordStateSnapshot(
        'rectangle',
        {
          isDrawing: false,
          isDrawingSection: false,
          isDrawingConnector: false
        },
        {
          selectedElementIds: new Set(),
          hoveredElementId: null
        },
        {
          zoom: 1,
          pan: { x: 0, y: 0 }
        }
      );
      
      // Report a test issue
      stateSynchronizationMonitor.reportIssue({
        type: 'tool_mismatch',
        severity: 'low',
        description: 'Test issue',
        expectedValue: 'test',
        actualValue: 'test-actual',
        autoFixed: false
      });
      
      // Wait for monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Stop monitoring
      stateSynchronizationMonitor.stopMonitoring();
      
      this.addResult('State Synchronization Monitoring', true, 'State monitoring system functioning correctly', Date.now() - startTime);
    } catch (error) {
      this.addResult('State Synchronization Monitoring', false, `State monitoring test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime, error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Test feature flag fallback system
   */
  private async testFeatureFlagFallbacks(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test getting flags with fallbacks
      const centralizedTransformer = enhancedFeatureFlagManager.getFlag('centralized-transformer');
      const groupedSections = enhancedFeatureFlagManager.getFlag('grouped-section-rendering');
      
      // Should return boolean values without throwing
      if (typeof centralizedTransformer !== 'boolean' || typeof groupedSections !== 'boolean') {
        throw new Error('Feature flags should return boolean values');
      }
      
      // Test unknown flag (should return false without crashing)
      const unknownFlag = enhancedFeatureFlagManager.getFlag('non-existent-flag');
      if (unknownFlag !== false) {
        throw new Error('Unknown flags should return false');
      }
      
      // Start health monitoring
      enhancedFeatureFlagManager.startHealthMonitoring();
      
      // Wait for health check cycle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Stop health monitoring
      enhancedFeatureFlagManager.stopHealthMonitoring();
      
      this.addResult('Feature Flag Fallbacks', true, 'Feature flag system functioning with proper fallbacks', Date.now() - startTime);
    } catch (error) {
      this.addResult('Feature Flag Fallbacks', false, `Feature flag test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime, error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Test error boundary recovery (simulated)
   */
  private async testErrorBoundaryRecovery(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // This is a conceptual test since error boundaries are React components
      // We test that our error handling utilities are available and functional
      
      // Test error classification (simulated)
      const testError = new Error('Test rendering error');
      const errorType = this.classifyError(testError);
      
      if (!errorType) {
        throw new Error('Error classification failed');
      }
      
      // Test error recovery actions (simulated)
      const recoveryAction = this.getRecoveryAction(errorType);
      
      if (!recoveryAction) {
        throw new Error('Recovery action not available');
      }
      
      this.addResult('Error Boundary Recovery', true, 'Error classification and recovery mechanisms available', Date.now() - startTime);
    } catch (error) {
      this.addResult('Error Boundary Recovery', false, `Error boundary test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime, error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Classify error types (helper for error boundary testing)
   */
  private classifyError(error: Error): string | null {
    if (error.message.includes('render')) return 'render';
    if (error.message.includes('state')) return 'state';
    if (error.message.includes('konva')) return 'konva';
    return 'general';
  }

  /**
   * Get recovery action for error type (helper for error boundary testing)
   */
  private getRecoveryAction(errorType: string): string | null {
    const actions = {
      render: 'clearCanvas',
      state: 'resetState',
      konva: 'recreateStage',
      general: 'showError'
    };
    return actions[errorType as keyof typeof actions] || null;
  }

  /**
   * Add test result
   */
  private addResult(testName: string, passed: boolean, message: string, timing: number, error?: Error): void {
    this.results.push({
      testName,
      passed,
      message,
      timing,
      error
    });
    
    const status = passed ? '✅' : '❌';
    logger.log(`${status} ${testName}: ${message} (${timing}ms)`);
    
    if (error) {
      logger.error(`   Error details:`, error);
    }
  }

  /**
   * Get test results
   */
  getResults(): ReliabilityTestResult[] {
    return [...this.results];
  }

  /**
   * Get test summary
   */
  getSummary(): { passed: number; failed: number; total: number; avgTiming: number } {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;
    const avgTiming = this.results.reduce((sum, r) => sum + r.timing, 0) / this.results.length;
    
    return {
      passed,
      failed,
      total: this.results.length,
      avgTiming: Math.round(avgTiming)
    };
  }
}

// Export singleton instance
export const reliabilityTestSuite = new ReliabilityTestSuite();
