/**
 * Feature Flag Fallback System
 * Provides graceful degradation when centralized transformer fails
 * Solves: Feature flag dependencies, single point of failure risks
 */

import { logger } from "@/core/lib/logger";

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

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlagConfig> = new Map();
  private statuses: Map<string, FeatureFlagStatus> = new Map();
  private healthCheckInterval: number = 30000; // 30 seconds
  private maxErrorCount: number = 5;
  private intervalIds: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultFlags();
  }

  private initializeDefaultFlags(): void {
    // Canvas rendering flags
    this.registerFlag({
      name: 'viewport-culling',
      enabled: true,
      fallbackEnabled: true,
      fallbackValue: true,
      criticalityLevel: 'high',
      healthCheck: async () => {
        // Simple health check for viewport culling
        return Promise.resolve(true);
      }
    });

    this.registerFlag({
      name: 'performance-monitoring',
      enabled: process.env.NODE_ENV === 'development',
      fallbackEnabled: false,
      fallbackValue: false,
      criticalityLevel: 'low'
    });

    this.registerFlag({
      name: 'advanced-snapping',
      enabled: true,
      fallbackEnabled: true,
      fallbackValue: false,
      criticalityLevel: 'medium'
    });

    // CRITICAL FIX: Register missing centralized-transformer flag
    this.registerFlag({
      name: 'centralized-transformer',
      enabled: true,
      fallbackEnabled: true,
      fallbackValue: true, // FIXED: Ensure fallback also enables transformer
      criticalityLevel: 'high'
    });
  }

  registerFlag(config: FeatureFlagConfig): void {
    this.flags.set(config.name, config);
    
    const status: FeatureFlagStatus = {
      name: config.name,
      enabled: config.enabled,
      healthy: true,
      usingFallback: false,
      lastHealthCheck: Date.now(),
      errorCount: 0,
      dependencies: []
    };

    this.statuses.set(config.name, status);

    // Start health checks if configured
    if (config.healthCheck) {
      this.startHealthChecks(config.name);
    }

    logger.debug(`Feature flag registered: ${config.name}`, { config });
  }

  private startHealthChecks(flagName: string): void {
    const intervalId = setInterval(async () => {
      await this.performHealthCheck(flagName);
    }, this.healthCheckInterval);

    this.intervalIds.set(flagName, intervalId);
  }

  private async performHealthCheck(flagName: string): Promise<void> {
    const config = this.flags.get(flagName);
    const status = this.statuses.get(flagName);

    if (!config || !status || !config.healthCheck) {
      return;
    }

    try {
      const isHealthy = await config.healthCheck();
      
      if (isHealthy) {
        status.healthy = true;
        status.errorCount = 0;
        status.usingFallback = false;
        status.enabled = config.enabled;
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      status.errorCount++;
      status.healthy = false;
      
      if (status.errorCount >= this.maxErrorCount) {
        status.usingFallback = true;
        status.enabled = config.fallbackValue;
        
        logger.warn(`Feature flag ${flagName} switched to fallback mode`, {
          errorCount: status.errorCount,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    status.lastHealthCheck = Date.now();
  }

  isEnabled(flagName: string): boolean {
    const status = this.statuses.get(flagName);
    
    if (!status) {
      logger.warn(`Unknown feature flag: ${flagName}`);
      return false;
    }

    return status.enabled;
  }

  getStatus(flagName: string): FeatureFlagStatus | undefined {
    return this.statuses.get(flagName);
  }

  getAllStatuses(): FeatureFlagStatus[] {
    return Array.from(this.statuses.values());
  }

  forceReset(flagName: string): void {
    const config = this.flags.get(flagName);
    const status = this.statuses.get(flagName);

    if (!config || !status) {
      return;
    }

    status.enabled = config.enabled;
    status.healthy = true;
    status.usingFallback = false;
    status.errorCount = 0;
    status.lastHealthCheck = Date.now();

    logger.log(`Feature flag ${flagName} reset to default state`);
  }

  destroy(): void {
    // Clean up intervals
    for (const intervalId of this.intervalIds.values()) {
      clearInterval(intervalId);
    }
    this.intervalIds.clear();
    this.flags.clear();
    this.statuses.clear();
  }
}

export const featureFlagManager = new FeatureFlagManager();