/**
 * Circuit Breaker for Expensive Canvas Operations
 * 
 * Prevents cascade failures by automatically aborting operations
 * that exceed time limits or fail repeatedly
 */

import React from 'react';

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Circuit is open, failing fast
  HALF_OPEN = 'half_open' // Testing if service is back
}

export interface CircuitBreakerConfig {
  timeout: number;           // Max execution time in ms
  failureThreshold: number;  // Number of failures before opening
  resetTimeout: number;      // Time to wait before trying again
  monitorWindow: number;     // Time window for failure counting
  name: string;              // Circuit breaker name for logging
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  totalCalls: number;
  averageExecutionTime: number;
}

export class CircuitBreakerError extends Error {
  constructor(message: string, public circuitName: string, public state: CircuitState) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string, public timeout: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailure: number | null = null;
  private lastSuccess: number | null = null;
  private totalCalls = 0;
  private executionTimes: number[] = [];
  private nextAttempt = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      timeout: 5000,           // 5 seconds
      failureThreshold: 5,     // 5 failures
      resetTimeout: 30000,     // 30 seconds
      monitorWindow: 60000,    // 1 minute
      name: 'unnamed',
      ...config
    };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T> | T, context?: string): Promise<T> {
    this.totalCalls++;
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new CircuitBreakerError(
          `Circuit breaker ${this.config.name} is OPEN. Next attempt in ${
            Math.round((this.nextAttempt - Date.now()) / 1000)
          } seconds.`,
          this.config.name,
          this.state
        );
      } else {
        // Try half-open state
        this.state = CircuitState.HALF_OPEN;
      }
    }

    const startTime = performance.now();
    
    try {
      // Execute with timeout
      const result = await this.withTimeout(operation, this.config.timeout);
      
      // Record success
      const executionTime = performance.now() - startTime;
      this.onSuccess(executionTime);
      
      return result;
    } catch (error) {
      // Record failure
      const executionTime = performance.now() - startTime;
      this.onFailure(error as Error, executionTime, context);
      throw error;
    }
  }

  /**
   * Execute synchronous function with circuit breaker
   */
  executeSync<T>(operation: () => T, context?: string): T {
    return this.execute(() => operation(), context) as T;
  }

  /**
   * Wrap function with timeout
   */
  private withTimeout<T>(operation: () => Promise<T> | T, timeout: number): Promise<T> {
    return Promise.race([
      Promise.resolve(operation()),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new TimeoutError(`Operation timed out after ${timeout}ms`, timeout)),
          timeout
        )
      )
    ]);
  }

  /**
   * Handle successful execution
   */
  private onSuccess(executionTime: number): void {
    this.successes++;
    this.lastSuccess = Date.now();
    this.executionTimes.push(executionTime);
    
    // Keep execution time history bounded
    if (this.executionTimes.length > 100) {
      this.executionTimes = this.executionTimes.slice(-50);
    }

    // Reset circuit if it was half-open
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.failures = 0; // Reset failure count
      console.log(`✅ Circuit breaker ${this.config.name} reset to CLOSED`);
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error, executionTime: number, context?: string): void {
    this.failures++;
    this.lastFailure = Date.now();
    this.executionTimes.push(executionTime);
    
    console.warn(`⚠️ Circuit breaker ${this.config.name} failure:`, {
      error: error.message,
      context,
      executionTime: `${executionTime.toFixed(2)}ms`,
      failures: this.failures,
      threshold: this.config.failureThreshold
    });

    // Open circuit if threshold exceeded
    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.resetTimeout;
      
      console.error(`🔴 Circuit breaker ${this.config.name} opened! Next attempt at ${
        new Date(this.nextAttempt).toLocaleTimeString()
      }`);
    }
  }

  /**
   * Get current statistics
   */
  getStats(): CircuitBreakerStats {
    const avgExecutionTime = this.executionTimes.length > 0
      ? this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length
      : 0;

    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      totalCalls: this.totalCalls,
      averageExecutionTime: avgExecutionTime
    };
  }

  /**
   * Reset circuit breaker manually
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = null;
    this.lastSuccess = null;
    this.nextAttempt = 0;
    
    console.log(`🔄 Circuit breaker ${this.config.name} manually reset`);
  }

  /**
   * Force circuit to open (for testing)
   */
  forceOpen(resetTimeoutMs?: number): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + (resetTimeoutMs || this.config.resetTimeout);
    
    console.log(`🔴 Circuit breaker ${this.config.name} forced open`);
  }
}

/**
 * Circuit breaker registry for managing multiple circuits
 */
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create circuit breaker
   */
  getBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const breakerConfig = { ...config, name };
      this.breakers.set(name, new CircuitBreaker(breakerConfig));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Execute operation with named circuit breaker
   */
  async execute<T>(
    name: string, 
    operation: () => Promise<T> | T,
    config?: Partial<CircuitBreakerConfig>,
    context?: string
  ): Promise<T> {
    const breaker = this.getBreaker(name, config);
    return breaker.execute(operation, context);
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Get circuit breaker count
   */
  getCount(): number {
    return this.breakers.size;
  }
}

// Export singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// Predefined circuit breakers for common canvas operations
export const canvasCircuitBreakers = {
  // Element creation operations
  createElement: circuitBreakerRegistry.getBreaker('createElement', {
    timeout: 1000,        // 1 second
    failureThreshold: 3,  // 3 failures
    resetTimeout: 15000,  // 15 seconds
  }),

  // Batch operations
  batchUpdate: circuitBreakerRegistry.getBreaker('batchUpdate', {
    timeout: 5000,        // 5 seconds
    failureThreshold: 2,  // 2 failures
    resetTimeout: 30000,  // 30 seconds
  }),

  // Rendering operations
  render: circuitBreakerRegistry.getBreaker('render', {
    timeout: 100,         // 100ms
    failureThreshold: 10, // 10 failures
    resetTimeout: 5000,   // 5 seconds
  }),

  // Spatial indexing
  spatialIndex: circuitBreakerRegistry.getBreaker('spatialIndex', {
    timeout: 2000,        // 2 seconds
    failureThreshold: 3,  // 3 failures
    resetTimeout: 20000,  // 20 seconds
  }),

  // File operations
  fileOperation: circuitBreakerRegistry.getBreaker('fileOperation', {
    timeout: 10000,       // 10 seconds
    failureThreshold: 2,  // 2 failures
    resetTimeout: 60000,  // 1 minute
  }),
};

/**
 * Decorator for automatic circuit breaker protection
 */
export function withCircuitBreaker(
  name: string, 
  config?: Partial<CircuitBreakerConfig>
) {
  return function <T extends (...args: unknown[]) => unknown>(
    target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (this: any, ...args: unknown[]) {
      const breaker = circuitBreakerRegistry.getBreaker(name, config);
      return breaker.execute(() => originalMethod.apply(this, args), propertyKey);
    } as T;

    return descriptor;
  };
}

/**
 * React hook for circuit breaker monitoring
 */
export function useCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>) {
  const [stats, setStats] = React.useState<CircuitBreakerStats | null>(null);
  
  const breaker = React.useMemo(() => 
    circuitBreakerRegistry.getBreaker(name, config), [name, config]
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(breaker.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [breaker]);

  const execute = React.useCallback(async <T>(
    operation: () => Promise<T> | T,
    context?: string
  ): Promise<T> => {
    return breaker.execute(operation, context);
  }, [breaker]);

  return {
    stats,
    execute,
    reset: breaker.reset.bind(breaker),
    forceOpen: breaker.forceOpen.bind(breaker),
  };
}