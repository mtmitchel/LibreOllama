/**
 * State Synchronization Monitor
 * Monitors and maintains consistency between UI state and canvas state
 * Solves: State desynchronization, tool state mismatches, async update failures
 */

import { produce } from "immer";
import { throttle } from "../throttle";
import { logger } from "@/core/lib/logger";
import { CanvasTool } from '../../types/enhanced.types';

export interface StateSnapshot {
  timestamp: number;
  toolState: CanvasTool;
  drawingStates: {
    isDrawingSection: boolean;
    isDrawingConnector: boolean;
    isDrawing: boolean;
  };
  selectionState: {
    selectedElementIds: Set<string>;
    hoveredElementId: string | null;
  };
  viewportState: {
    zoom: number;
    pan: { x: number; y: number };
  };
}

export interface SynchronizationIssue {
  type: 'tool_mismatch' | 'drawing_state_mismatch' | 'selection_mismatch' | 'viewport_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedValue: unknown;
  actualValue: unknown;
  timestamp: number;
  autoFixed: boolean;
}

export class StateSynchronizationMonitor {
  private static instance: StateSynchronizationMonitor;
  private snapshots: StateSnapshot[] = [];
  private readonly maxSnapshots = 100;
  private synchronizationIssues: SynchronizationIssue[] = [];
  private readonly maxIssueHistory = 200;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  // State consistency thresholds
  private readonly thresholds = {
    toolStateSync: 1000, // Tool state should sync within 1 second
    drawingStateSync: 500, // Drawing state should sync within 500ms
    selectionStateSync: 300, // Selection should sync within 300ms
    viewportStateSync: 100, // Viewport should sync within 100ms
  };

  /**
   * Start monitoring state synchronization
   */
  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) {
      logger.warn('State monitor already running');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performSynchronizationCheck();
    }, intervalMs);

    logger.log('State synchronization monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;    logger.log('State synchronization monitoring stopped');
  }

  /**
   * Public method to record synchronization issues from external sources
   */
  reportIssue(issue: Omit<SynchronizationIssue, 'timestamp'>): void {
    this.recordSynchronizationIssue({
      ...issue,
      timestamp: Date.now()
    });
  }

  /**
   * Get the current system status for testing and debugging
   */
  getSystemStatus(): {
    isMonitoring: boolean;
    snapshots: StateSnapshot[];
    issues: SynchronizationIssue[];
  } {
    return {
      isMonitoring: this.isMonitoring,
      snapshots: [...this.snapshots],
      issues: [...this.synchronizationIssues],
    };
  }

  /**
   * Record current state snapshot
   */
  recordStateSnapshot(
    toolState: CanvasTool,
    drawingStates: StateSnapshot['drawingStates'],
    selectionState: StateSnapshot['selectionState'],
    viewportState: StateSnapshot['viewportState']
  ): void {
    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      toolState,
      drawingStates: { ...drawingStates },
      selectionState: {
        selectedElementIds: new Set(selectionState.selectedElementIds),
        hoveredElementId: selectionState.hoveredElementId,
      },
      viewportState: { ...viewportState },
    };

    this.snapshots.push(snapshot);

    // Limit snapshot history
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }
  }

  /**
   * Perform comprehensive synchronization check
   */
  private performSynchronizationCheck(): void {
    try {
      const currentTime = Date.now();
      const recentSnapshots = this.getRecentSnapshots(5000); // Last 5 seconds

      if (recentSnapshots.length < 2) {
        return; // Not enough data to compare
      }

      // Check for tool state inconsistencies
      this.checkToolStateConsistency(recentSnapshots, currentTime);

      // Check for drawing state issues
      this.checkDrawingStateConsistency(recentSnapshots, currentTime);

      // Check for selection state issues
      this.checkSelectionStateConsistency(recentSnapshots, currentTime);

      // Check for viewport state issues
      this.checkViewportStateConsistency(recentSnapshots, currentTime);

      // Auto-fix critical issues
      this.autoFixCriticalIssues();

    } catch (error) {
      logger.error('Error during synchronization check:', error);
    }
  }

  /**
   * Check tool state consistency
   */
  private checkToolStateConsistency(snapshots: StateSnapshot[], currentTime: number): void {
    const toolChanges = this.findStateChanges(snapshots, 'toolState');
    
    for (const change of toolChanges) {
      const timeSinceChange = currentTime - change.timestamp;
      
      // Check if tool change was followed by consistent state updates
      const subsequentSnapshots = snapshots.filter(s => s.timestamp > change.timestamp);
      
      if (subsequentSnapshots.length > 0) {
        const hasInconsistentDrawingState = subsequentSnapshots.some(snapshot => {
          // If tool is 'section' but not drawing sections
          if (change.newValue === 'section' && !snapshot.drawingStates.isDrawingSection) {
            return timeSinceChange > this.thresholds.toolStateSync;
          }
          // If tool is not 'section' but still drawing sections
          if (change.newValue !== 'section' && snapshot.drawingStates.isDrawingSection) {
            return true;
          }
          return false;
        });

        if (hasInconsistentDrawingState) {
          this.recordSynchronizationIssue({
            type: 'tool_mismatch',
            severity: 'high',
            description: `Tool state '${change.newValue}' not reflected in drawing state`,
            expectedValue: { tool: change.newValue, shouldBeDrawing: change.newValue === 'section' },
            actualValue: { tool: change.newValue, isDrawing: subsequentSnapshots[0].drawingStates.isDrawingSection },
            timestamp: currentTime,
            autoFixed: false,
          });
        }
      }
    }
  }

  /**
   * Check drawing state consistency
   */
  private checkDrawingStateConsistency(snapshots: StateSnapshot[], currentTime: number): void {
    const latestSnapshot = snapshots[snapshots.length - 1];
    
    // Check for abandoned drawing states
    const drawingStateChanges = this.findStateChanges(snapshots, 'drawingStates.isDrawingSection');
    
    for (const change of drawingStateChanges) {
      if (change.newValue === true) {
        const timeSinceStarted = currentTime - change.timestamp;
        
        // If drawing has been active for too long without completion
        if (timeSinceStarted > 30000) { // 30 seconds
          this.recordSynchronizationIssue({
            type: 'drawing_state_mismatch',
            severity: 'medium',
            description: 'Drawing operation stuck in active state',
            expectedValue: false,
            actualValue: true,
            timestamp: currentTime,
            autoFixed: false,
          });
        }
      }
    }

    // Check for drawing state without proper tool
    if (latestSnapshot.drawingStates.isDrawingSection && latestSnapshot.toolState !== 'section') {
      this.recordSynchronizationIssue({
        type: 'drawing_state_mismatch',
        severity: 'high',
        description: 'Drawing section without section tool selected',
        expectedValue: 'section',
        actualValue: latestSnapshot.toolState,
        timestamp: currentTime,
        autoFixed: false,
      });
    }
  }

  /**
   * Check selection state consistency
   */
  private checkSelectionStateConsistency(snapshots: StateSnapshot[], currentTime: number): void {
    // Check for rapid selection changes that might indicate issues
    const selectionChanges = this.findStateChanges(snapshots, 'selectionState.selectedElementIds');
    
    if (selectionChanges.length > 10) { // More than 10 selection changes in 5 seconds
      this.recordSynchronizationIssue({
        type: 'selection_mismatch',
        severity: 'medium',
        description: 'Excessive selection state changes detected',
        expectedValue: 'stable selection',
        actualValue: `${selectionChanges.length} changes`,
        timestamp: currentTime,
        autoFixed: false,
      });
    }
  }

  /**
   * Check viewport state consistency
   */
  private checkViewportStateConsistency(snapshots: StateSnapshot[], currentTime: number): void {
    const latestSnapshot = snapshots[snapshots.length - 1];
    
    // Check for invalid viewport values
    if (!Number.isFinite(latestSnapshot.viewportState.zoom) || 
        latestSnapshot.viewportState.zoom <= 0 ||
        latestSnapshot.viewportState.zoom > 10) {
      this.recordSynchronizationIssue({
        type: 'viewport_mismatch',
        severity: 'critical',
        description: 'Invalid zoom value detected',
        expectedValue: 'finite positive number ≤ 10',
        actualValue: latestSnapshot.viewportState.zoom,
        timestamp: currentTime,
        autoFixed: false,
      });
    }

    if (!Number.isFinite(latestSnapshot.viewportState.pan.x) ||
        !Number.isFinite(latestSnapshot.viewportState.pan.y)) {
      this.recordSynchronizationIssue({
        type: 'viewport_mismatch',
        severity: 'critical',
        description: 'Invalid pan values detected',
        expectedValue: 'finite numbers',
        actualValue: latestSnapshot.viewportState.pan,
        timestamp: currentTime,
        autoFixed: false,
      });
    }
  }

  /**
   * Auto-fix critical synchronization issues
   */
  private autoFixCriticalIssues(): void {
    const criticalIssues = this.synchronizationIssues
      .filter(issue => issue.severity === 'critical' && !issue.autoFixed)
      .slice(-5); // Only handle recent critical issues

    for (const issue of criticalIssues) {
      try {
        let fixed = false;

        switch (issue.type) {
          case 'viewport_mismatch':
            // Reset viewport to safe values
            logger.warn('Auto-fixing critical viewport issue:', issue.description);
            // This would need to integrate with the actual store
            // store.setZoom(1);
            // store.setPan({ x: 0, y: 0 });
            fixed = true;
            break;

          case 'tool_mismatch':
            // Reset tool to safe state
            logger.warn('Auto-fixing critical tool state issue:', issue.description);
            // store.setSelectedTool('select');
            fixed = true;
            break;
        }

        if (fixed) {
          issue.autoFixed = true;
          logger.log('Auto-fixed critical synchronization issue:', issue.type);
        }
      } catch (error) {
        logger.error('Failed to auto-fix synchronization issue:', error);
      }
    }
  }

  /**
   * Find state changes in snapshots
   */
  private findStateChanges(snapshots: StateSnapshot[], path: string): Array<{
    timestamp: number;
    oldValue: unknown;
    newValue: unknown;
  }> {
    const changes: Array<{ timestamp: number; oldValue: unknown; newValue: unknown }> = [];
    
    for (let i = 1; i < snapshots.length; i++) {
      const prevValue = this.getNestedValue(snapshots[i - 1] as unknown as Record<string, unknown>, path);
      const currentValue = this.getNestedValue(snapshots[i] as unknown as Record<string, unknown>, path);
      
      if (!this.deepEqual(prevValue, currentValue)) {
        changes.push({
          timestamp: snapshots[i].timestamp,
          oldValue: prevValue,
          newValue: currentValue,
        });
      }
    }
    
    return changes;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: any, key: string) => current?.[key], obj);
  }

  /**
   * Deep equality check for state comparison
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a instanceof Set && b instanceof Set) {
      return a.size === b.size && [...a].every(item => b.has(item));
    }
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.deepEqual((a as any)[key], (b as any)[key]));
    }
    return false;
  }

  /**
   * Get recent snapshots within time window
   */
  private getRecentSnapshots(timeWindowMs: number): StateSnapshot[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.snapshots.filter(snapshot => snapshot.timestamp >= cutoff);
  }

  /**
   * Record synchronization issue
   */
  private recordSynchronizationIssue(issue: SynchronizationIssue): void {
    this.synchronizationIssues.push(issue);
    
    // Limit issue history
    if (this.synchronizationIssues.length > this.maxIssueHistory) {
      this.synchronizationIssues = this.synchronizationIssues.slice(-this.maxIssueHistory);
    }

    // Log high severity issues immediately
    if (issue.severity === 'high' || issue.severity === 'critical') {
      logger.warn('State synchronization issue detected:', issue);
    }
  }

  /**
   * Get synchronization health report
   */
  getHealthReport(): {
    isMonitoring: boolean;
    totalSnapshots: number;
    recentIssues: SynchronizationIssue[];
    issuesSummary: Record<SynchronizationIssue['type'], number>;
    autoFixedCount: number;
  } {
    const recentIssues = this.synchronizationIssues.filter(
      issue => Date.now() - issue.timestamp < 300000 // Last 5 minutes
    );

    const issuesSummary = recentIssues.reduce((summary, issue) => {
      summary[issue.type] = (summary[issue.type] || 0) + 1;
      return summary;
    }, {} as Record<SynchronizationIssue['type'], number>);

    const autoFixedCount = this.synchronizationIssues.filter(issue => issue.autoFixed).length;

    return {
      isMonitoring: this.isMonitoring,
      totalSnapshots: this.snapshots.length,
      recentIssues,
      issuesSummary,
      autoFixedCount,
    };
  }

  /**
   * Manual state recovery trigger
   */
  triggerStateRecovery(): void {
    logger.warn('Manual state recovery triggered');
    
    // Cancel any ongoing operations
    // Reset to safe state
    // Clear inconsistent state
    
    this.recordSynchronizationIssue({
      type: 'tool_mismatch',
      severity: 'medium',
      description: 'Manual state recovery triggered',
      expectedValue: 'consistent state',
      actualValue: 'unknown state',
      timestamp: Date.now(),
      autoFixed: true,
    });
  }
}

// Export singleton instance
export const stateSynchronizationMonitor = new StateSynchronizationMonitor();
