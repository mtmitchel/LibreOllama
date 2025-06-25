/**
 * Enhanced Feature Flag Fallback System
 * Provides graceful degradation when centralized transformer fails
 * Solves: Feature flag dependencies, single point of failure risks
 */

import { logger } from '@/lib/logger';

export interface FeatureFlagConfig {
  name: string;
  enabled: boolean;
  fallbackEnabled: boolean;
  fallbackValue: boolean;
  healthCheck?: () => Promise<boolean>;
  dependencies?: string[];
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface FeatureFlagStatus {
  name: string;
  enabled: boolean;
  healthy: boolean;
  usingFallback: boolean;
  lastHealthCheck: number;
  errorCount: number;
  dependencies: Array<{
    name: string;
    satisfied: boolean;
    error?: string;
  }>;
}

export class EnhancedFeatureFlagManager {
  private flags = new Map<string, FeatureFlagConfig>();
  private flagStatus = new Map<string, FeatureFlagStatus>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly healthCheckIntervalMs = 30000; // 30 seconds
  private readonly maxErrorsBeforeFallback = 3;

  constructor() {
    this.initializeDefaultFlags();
  }

  /**
   * Initialize default canvas feature flags with fallbacks
   */
  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlagConfig[] = [
      {
        name: 'grouped-section-rendering',
        enabled: true,
        fallbackEnabled: true,
        fallbackValue: false, // Fall back to legacy rendering
        criticalityLevel: 'high',
        healthCheck: async () => {
          // Check if grouped section rendering is working
          try {
            // This would check if the component can render successfully
            return true;
          } catch {
            return false;
          }
        },
      },
      {
        name: 'centralized-transformer',
        enabled: true,
        fallbackEnabled: true,
        fallbackValue: false, // Fall back to distributed transformers
        criticalityLevel: 'critical',
        dependencies: ['grouped-section-rendering'],
        healthCheck: async () => {
          // Check if centralized transformer is working
          try {
            // This would check if transformer operations complete successfully
            return true;
          } catch {
            return false;
          }
        },
      },
      {
        name: 'advanced-spatial-indexing',
        enabled: true,
        fallbackEnabled: true,
        fallbackValue: false, // Fall back to simple element tracking
        criticalityLevel: 'medium',
        healthCheck: async () => {
          // Check if spatial indexing is working
          try {
            return true;
          } catch {
            return false;
          }
        },
      },
      {
        name: 'performance-monitoring',
        enabled: true,
        fallbackEnabled: true,
        fallbackValue: false, // Disable monitoring if it's causing issues
        criticalityLevel: 'low',
      },
    ];

    for (const flag of defaultFlags) {
      this.registerFlag(flag);
    }
  }

  /**
   * Register a feature flag with fallback configuration
   */
  registerFlag(config: FeatureFlagConfig): void {
    this.flags.set(config.name, config);
    this.flagStatus.set(config.name, {
      name: config.name,
      enabled: config.enabled,
      healthy: true,
      usingFallback: false,
      lastHealthCheck: Date.now(),
      errorCount: 0,
      dependencies: [],
    });

    logger.log(`Feature flag registered: ${config.name}`, config);
  }

  /**
   * Get feature flag value with automatic fallback
   */
  getFlag(flagName: string): boolean {
    const config = this.flags.get(flagName);
    const status = this.flagStatus.get(flagName);

    if (!config || !status) {
      logger.warn(`Unknown feature flag requested: ${flagName}`);
      return false;
    }

    // Check if we should use fallback
    if (this.shouldUseFallback(config, status)) {
      if (!status.usingFallback) {
        logger.warn(`Switching to fallback for feature flag: ${flagName}`);
        status.usingFallback = true;
        this.notifyFallbackActivation(flagName, config);
      }
      return config.fallbackValue;
    }

    // Check dependencies
    if (!this.checkDependencies(config)) {
      logger.warn(`Dependencies not satisfied for feature flag: ${flagName}`);
      return config.fallbackEnabled ? config.fallbackValue : false;
    }

    return status.enabled;
  }

  /**
   * Determine if fallback should be used
   */
  private shouldUseFallback(config: FeatureFlagConfig, status: FeatureFlagStatus): boolean {
    if (!config.fallbackEnabled) {
      return false;
    }

    // Use fallback if health checks are failing
    if (!status.healthy && status.errorCount >= this.maxErrorsBeforeFallback) {
      return true;
    }

    // Use fallback if dependencies are not satisfied
    if (config.dependencies && !this.checkDependencies(config)) {
      return true;
    }

    return false;
  }

  /**
   * Check if all dependencies are satisfied
   */
  private checkDependencies(config: FeatureFlagConfig): boolean {
    if (!config.dependencies) {
      return true;
    }

    return config.dependencies.every(depName => {
      const depStatus = this.flagStatus.get(depName);
      return depStatus && depStatus.healthy && !depStatus.usingFallback;
    });
  }

  /**
   * Report feature flag error
   */
  reportError(flagName: string, error: Error): void {
    const status = this.flagStatus.get(flagName);
    if (!status) {
      return;
    }

    status.errorCount++;
    status.healthy = false;

    logger.error(`Feature flag error: ${flagName}`, {
      error: error.message,
      errorCount: status.errorCount,
      willUseFallback: status.errorCount >= this.maxErrorsBeforeFallback,
    });

    // Auto-disable if too many errors
    if (status.errorCount >= this.maxErrorsBeforeFallback) {
      const config = this.flags.get(flagName);
      if (config?.fallbackEnabled) {
        logger.warn(`Auto-switching to fallback for ${flagName} due to repeated errors`);
        status.usingFallback = true;
        this.notifyFallbackActivation(flagName, config);
      }
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckIntervalMs);

    logger.log('Feature flag health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    logger.log('Feature flag health monitoring stopped');
  }

  /**
   * Perform health checks on all flags
   */
  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.flags.entries()).map(async ([name, config]) => {
      if (!config.healthCheck) {
        return;
      }

      const status = this.flagStatus.get(name)!;
      
      try {
        const isHealthy = await Promise.race([
          config.healthCheck(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          ),
        ]);

        if (isHealthy && !status.healthy) {
          // Recovery detected
          logger.log(`Feature flag recovered: ${name}`);
          status.healthy = true;
          status.errorCount = 0;
          status.usingFallback = false;
        } else if (!isHealthy && status.healthy) {
          // Health degradation detected
          this.reportError(name, new Error('Health check failed'));
        }

        status.lastHealthCheck = Date.now();
      } catch (error) {
        this.reportError(name, error instanceof Error ? error : new Error('Health check error'));
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Notify about fallback activation
   */
  private notifyFallbackActivation(flagName: string, config: FeatureFlagConfig): void {
    const message = `Feature flag fallback activated: ${flagName} -> ${config.fallbackValue}`;
    
    if (config.criticalityLevel === 'critical') {
      logger.error(message);
      // Could integrate with alerting system here
    } else {
      logger.warn(message);
    }
  }

  /**
   * Manually trigger fallback for a flag
   */
  triggerFallback(flagName: string, reason: string): boolean {
    const config = this.flags.get(flagName);
    const status = this.flagStatus.get(flagName);

    if (!config || !status || !config.fallbackEnabled) {
      return false;
    }

    logger.warn(`Manual fallback triggered for ${flagName}: ${reason}`);
    status.usingFallback = true;
    status.healthy = false;
    this.notifyFallbackActivation(flagName, config);

    return true;
  }

  /**
   * Manually recover a flag from fallback
   */
  recoverFromFallback(flagName: string): boolean {
    const status = this.flagStatus.get(flagName);

    if (!status || !status.usingFallback) {
      return false;
    }

    logger.log(`Manual recovery from fallback: ${flagName}`);
    status.usingFallback = false;
    status.healthy = true;
    status.errorCount = 0;

    return true;
  }

  /**
   * Get comprehensive status report
   */
  getStatusReport(): {
    totalFlags: number;
    healthyFlags: number;
    fallbackFlags: number;
    criticalIssues: string[];
    flagDetails: FeatureFlagStatus[];
  } {
    const flagDetails = Array.from(this.flagStatus.values());
    const criticalIssues: string[] = [];

    flagDetails.forEach(status => {
      const config = this.flags.get(status.name);
      if (config?.criticalityLevel === 'critical' && status.usingFallback) {
        criticalIssues.push(`${status.name} is using fallback`);
      }
    });

    return {
      totalFlags: flagDetails.length,
      healthyFlags: flagDetails.filter(s => s.healthy && !s.usingFallback).length,
      fallbackFlags: flagDetails.filter(s => s.usingFallback).length,
      criticalIssues,
      flagDetails,
    };
  }

  /**
   * Create a safe feature flag hook for React components
   */
  createSafeFeatureFlagHook() {
    return (flagName: string): boolean => {
      try {
        return this.getFlag(flagName);
      } catch (error) {
        logger.error(`Error getting feature flag ${flagName}:`, error);
        const config = this.flags.get(flagName);
        return config?.fallbackValue ?? false;
      }
    };
  }
}

// Export singleton instance
export const enhancedFeatureFlagManager = new EnhancedFeatureFlagManager();

// Create the safe hook for React components
export const useSafeFeatureFlag = enhancedFeatureFlagManager.createSafeFeatureFlagHook();
