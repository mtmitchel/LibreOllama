/**
 * Canvas Performance Profiler
 * Profiles canvas operations to identify performance bottlenecks
 */

import { logger } from '../../../../lib/logger';
import { PerformanceMonitor } from './PerformanceMonitor';

interface PerformanceMark {
  name: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceProfile {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  marks: PerformanceMark[];
  metadata: Record<string, any>;
}

class CanvasPerformanceProfilerImpl {
  private activeProfiles = new Map<string, PerformanceProfile>();
  private completedProfiles: PerformanceProfile[] = [];
  private readonly maxCompletedProfiles = 100;
  private isEnabled = process.env.NODE_ENV === 'development';

  /**
   * Start profiling an operation
   */
  startProfile(operation: string, metadata: Record<string, any> = {}): string {
    if (!this.isEnabled) return '';

    const profileId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const profile: PerformanceProfile = {
      operation,
      startTime: performance.now(),
      marks: [],
      metadata
    };

    this.activeProfiles.set(profileId, profile);
    logger.log(`📊 [PerformanceProfiler] Started profiling: ${operation}`);

    return profileId;
  }

  /**
   * Add a performance mark to an active profile
   */
  mark(profileId: string, markName: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled || !profileId) return;

    const profile = this.activeProfiles.get(profileId);
    if (!profile) {
      logger.warn(`📊 [PerformanceProfiler] Profile not found: ${profileId}`);
      return;
    }

    const mark: PerformanceMark = {
      name: markName,
      timestamp: performance.now(),
      metadata
    };

    profile.marks.push(mark);
  }

  /**
   * End profiling and calculate results
   */
  endProfile(profileId: string, additionalMetadata?: Record<string, any>): PerformanceProfile | null {
    if (!this.isEnabled || !profileId) return null;

    const profile = this.activeProfiles.get(profileId);
    if (!profile) {
      logger.warn(`📊 [PerformanceProfiler] Profile not found: ${profileId}`);
      return null;
    }

    profile.endTime = performance.now();
    profile.duration = profile.endTime - profile.startTime;

    if (additionalMetadata) {
      profile.metadata = { ...profile.metadata, ...additionalMetadata };
    }

    this.activeProfiles.delete(profileId);
    this.completedProfiles.push(profile);

    // Maintain size limit
    if (this.completedProfiles.length > this.maxCompletedProfiles) {
      this.completedProfiles = this.completedProfiles.slice(-this.maxCompletedProfiles);
    }

    // Log if operation was slow
    if (profile.duration > 16) { // More than one frame at 60fps
      logger.warn(`🐌 [PerformanceProfiler] Slow operation detected: ${profile.operation} took ${profile.duration.toFixed(2)}ms`);
      this.logProfileDetails(profile);
    }

    // Record in global performance monitor
    PerformanceMonitor.recordMetric(
      `canvas.${profile.operation}`,
      profile.duration,
      'canvas',
      profile.metadata
    );

    return profile;
  }

  /**
   * Profile a synchronous operation
   */
  profileSync<T>(operation: string, fn: () => T, metadata: Record<string, any> = {}): T {
    const profileId = this.startProfile(operation, metadata);
    
    try {
      const result = fn();
      this.endProfile(profileId, { status: 'success' });
      return result;
    } catch (error) {
      this.endProfile(profileId, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Profile an async operation
   */
  async profileAsync<T>(operation: string, fn: () => Promise<T>, metadata: Record<string, any> = {}): Promise<T> {
    const profileId = this.startProfile(operation, metadata);
    
    try {
      const result = await fn();
      this.endProfile(profileId, { status: 'success' });
      return result;
    } catch (error) {
      this.endProfile(profileId, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get performance statistics for a specific operation
   */
  getOperationStats(operation: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
  } {
    const profiles = this.completedProfiles.filter(p => p.operation === operation && p.duration !== undefined);
    
    if (profiles.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0
      };
    }

    const durations = profiles.map(p => p.duration!).sort((a, b) => a - b);
    const sum = durations.reduce((acc, d) => acc + d, 0);
    const p95Index = Math.floor(durations.length * 0.95);

    return {
      count: profiles.length,
      avgDuration: sum / profiles.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[p95Index] || durations[durations.length - 1]
    };
  }

  /**
   * Get slow operations above a threshold
   */
  getSlowOperations(thresholdMs: number = 16): PerformanceProfile[] {
    return this.completedProfiles.filter(p => p.duration && p.duration > thresholdMs);
  }

  /**
   * Log detailed profile information
   */
  private logProfileDetails(profile: PerformanceProfile): void {
    console.group(`📊 Performance Profile: ${profile.operation}`);
    console.log(`Duration: ${profile.duration?.toFixed(2)}ms`);
    
    if (profile.marks.length > 0) {
      console.log('Marks:');
      let previousTime = profile.startTime;
      
      profile.marks.forEach(mark => {
        const elapsed = mark.timestamp - profile.startTime;
        const delta = mark.timestamp - previousTime;
        console.log(`  - ${mark.name}: ${elapsed.toFixed(2)}ms (+${delta.toFixed(2)}ms)`);
        previousTime = mark.timestamp;
      });
    }
    
    if (Object.keys(profile.metadata).length > 0) {
      console.log('Metadata:', profile.metadata);
    }
    
    console.groupEnd();
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    totalProfiles: number;
    activeProfiles: number;
    operationStats: Record<string, {
      count: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
      p95Duration: number;
    }>;
    slowOperations: Array<{ operation: string; duration: number; metadata: any }>;
    recommendations: string[];
  } {
    const operationStats: Record<string, {
      count: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
      p95Duration: number;
    }> = {};
    const operations = new Set(this.completedProfiles.map(p => p.operation));
    
    operations.forEach(op => {
      operationStats[op] = this.getOperationStats(op);
    });

    const slowOperations = this.getSlowOperations()
      .map(p => ({
        operation: p.operation,
        duration: p.duration!,
        metadata: p.metadata
      }))
      .slice(-10); // Last 10 slow operations

    const recommendations: string[] = [];

    // Generate recommendations based on stats
    Object.entries(operationStats).forEach(([op, stats]) => {
      if (stats.avgDuration > 50) {
        recommendations.push(`Operation "${op}" is very slow (avg ${stats.avgDuration.toFixed(1)}ms)`);
      }
      if (stats.maxDuration > 100) {
        recommendations.push(`Operation "${op}" has extreme outliers (max ${stats.maxDuration.toFixed(1)}ms)`);
      }
    });

    if (this.activeProfiles.size > 10) {
      recommendations.push(`Many active profiles (${this.activeProfiles.size}) - possible incomplete operations`);
    }

    return {
      totalProfiles: this.completedProfiles.length,
      activeProfiles: this.activeProfiles.size,
      operationStats,
      slowOperations,
      recommendations
    };
  }

  /**
   * Clear all profiling data
   */
  clear(): void {
    this.activeProfiles.clear();
    this.completedProfiles = [];
  }

  /**
   * Log current performance status
   */
  logStatus(): void {
    if (!this.isEnabled) return;

    const report = this.generateReport();
    
    console.group('📊 Canvas Performance Report');
    console.log('Total profiles:', report.totalProfiles);
    console.log('Active profiles:', report.activeProfiles);
    
    console.log('Operation Statistics:');
    Object.entries(report.operationStats).forEach(([op, stats]) => {
      if (stats.count > 0) {
        console.log(`  ${op}:`);
        console.log(`    Count: ${stats.count}`);
        console.log(`    Avg: ${stats.avgDuration.toFixed(2)}ms`);
        console.log(`    Min/Max: ${stats.minDuration.toFixed(2)}ms / ${stats.maxDuration.toFixed(2)}ms`);
        console.log(`    P95: ${stats.p95Duration.toFixed(2)}ms`);
      }
    });

    if (report.slowOperations.length > 0) {
      console.warn('⚠️ Recent slow operations:');
      report.slowOperations.forEach(op => {
        console.warn(`  - ${op.operation}: ${op.duration.toFixed(2)}ms`);
      });
    }

    if (report.recommendations.length > 0) {
      console.warn('💡 Recommendations:');
      report.recommendations.forEach(rec => console.warn(`  - ${rec}`));
    }

    console.groupEnd();
  }

  /**
   * Enable/disable profiling
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }
}

// Singleton instance
export const CanvasPerformanceProfiler = new CanvasPerformanceProfilerImpl();

// Convenience functions
export function profileCanvasOperation<T>(
  operation: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  return CanvasPerformanceProfiler.profileSync(operation, fn, metadata);
}

export async function profileCanvasOperationAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return CanvasPerformanceProfiler.profileAsync(operation, fn, metadata);
}

// Auto-log status in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Log status every 60 seconds
  setInterval(() => {
    CanvasPerformanceProfiler.logStatus();
  }, 60000);
}
