import { useEffect, useState, useCallback, useRef } from 'react';
import { CanvasMemoryProfiler } from '../utils/memoryProfiler';
import { canvasLog } from '../utils/canvasLogger';

interface MemoryPressureState {
  isUnderPressure: boolean;
  pressureLevel: 'low' | 'moderate' | 'high' | 'critical';
  currentUsage: number;
  baseline: number;
  growth: number;
  recommendations: string[];
}

interface MemoryPressureOptions {
  checkInterval?: number;
  moderateThreshold?: number; // MB
  highThreshold?: number; // MB
  criticalThreshold?: number; // MB
  onPressureChange?: (state: MemoryPressureState) => void;
}

/**
 * Hook for monitoring memory pressure and automatically triggering optimizations
 */
export const useMemoryPressure = (options: MemoryPressureOptions = {}) => {
  const {
    checkInterval = 10000, // 10 seconds
    moderateThreshold = 50, // 50MB
    highThreshold = 100, // 100MB
    criticalThreshold = 200, // 200MB
    onPressureChange
  } = options;

  const [memoryState, setMemoryState] = useState<MemoryPressureState>({
    isUnderPressure: false,
    pressureLevel: 'low',
    currentUsage: 0,
    baseline: 0,
    growth: 0,
    recommendations: []
  });

  const profilerRef = useRef<CanvasMemoryProfiler | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCleanupRef = useRef<number>(0);

  // Initialize profiler
  useEffect(() => {
    profilerRef.current = new CanvasMemoryProfiler({
      measurementInterval: checkInterval,
      maxMeasurements: 50,
      leakThreshold: criticalThreshold * 1024 * 1024, // Convert to bytes
      warningThreshold: moderateThreshold * 1024 * 1024
    });

    profilerRef.current.startProfiling();
    canvasLog.memory('🔍 Memory pressure monitoring started');

    return () => {
      if (profilerRef.current) {
        profilerRef.current.stopProfiling();
        canvasLog.memory('🔍 Memory pressure monitoring stopped');
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkInterval, moderateThreshold, criticalThreshold]);

  // Periodic memory check
  useEffect(() => {
    const checkMemoryPressure = () => {
      if (!profilerRef.current) return;

      const status = profilerRef.current.getMemoryStatus();
      
      if (!status.isSupported) {
        canvasLog.warn('Memory monitoring not supported in this browser');
        return;
      }

      const growthMB = status.growth / (1024 * 1024);
      let pressureLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      let recommendations: string[] = [];

      // Determine pressure level
      if (growthMB > criticalThreshold) {
        pressureLevel = 'critical';
        recommendations = [
          'Critical memory usage - clearing caches',
          'Reducing viewport culling distance',
          'Disabling animations temporarily',
          'Consider refreshing the page'
        ];
      } else if (growthMB > highThreshold) {
        pressureLevel = 'high';
        recommendations = [
          'High memory usage detected',
          'Enabling aggressive viewport culling',
          'Clearing unused Konva nodes',
          'Reducing drawing quality temporarily'
        ];
      } else if (growthMB > moderateThreshold) {
        pressureLevel = 'moderate';
        recommendations = [
          'Moderate memory usage',
          'Optimizing stroke paths',
          'Clearing cached measurements',
          'Reducing background processes'
        ];
      }

      const newState: MemoryPressureState = {
        isUnderPressure: pressureLevel !== 'low',
        pressureLevel,
        currentUsage: status.current,
        baseline: status.baseline,
        growth: status.growth,
        recommendations
      };

      // Only update state if changed
      if (newState.pressureLevel !== memoryState.pressureLevel) {
        setMemoryState(newState);
        
        // Log pressure changes
        if (newState.isUnderPressure) {
          canvasLog.warn(`⚠️ Memory pressure: ${pressureLevel} (${growthMB.toFixed(1)}MB growth)`);
        } else {
          canvasLog.memory(`✅ Memory pressure normal (${growthMB.toFixed(1)}MB growth)`);
        }

        // Trigger callback
        if (onPressureChange) {
          onPressureChange(newState);
        }

        // Auto-trigger cleanup for high pressure
        if (pressureLevel === 'high' || pressureLevel === 'critical') {
          triggerCleanup(pressureLevel === 'critical');
        }
      }
    };

    // Start periodic checks
    intervalRef.current = setInterval(checkMemoryPressure, checkInterval);
    
    // Initial check
    checkMemoryPressure();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkInterval, moderateThreshold, highThreshold, criticalThreshold, onPressureChange, memoryState.pressureLevel]);

  // Manual cleanup trigger
  const triggerCleanup = useCallback((aggressive: boolean = false) => {
    const now = Date.now();
    
    // Throttle cleanup to prevent excessive calls
    if (now - lastCleanupRef.current < 5000) {
      canvasLog.memory('🧹 Memory cleanup throttled');
      return;
    }
    
    lastCleanupRef.current = now;
    
    canvasLog.memory(`🧹 Triggering memory cleanup (aggressive: ${aggressive})`);

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
      canvasLog.memory('🧹 Manual garbage collection triggered');
    }

    // Canvas-specific cleanup
    try {
      // Clear Konva caches
      const stages = document.querySelectorAll('canvas');
      stages.forEach(canvas => {
        const context = canvas.getContext('2d');
        if (context) {
          // Clear canvas context cache
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      });

      // Clear performance measurement buffers
      if (performance.clearMarks) {
        performance.clearMarks();
      }
      if (performance.clearMeasures) {
        performance.clearMeasures();
      }

      // Clear console logs in production
      if (process.env.NODE_ENV === 'production') {
        console.clear();
      }

      canvasLog.memory('🧹 Canvas cleanup completed');
    } catch (error) {
      canvasLog.error('❌ Error during memory cleanup:', error);
    }
  }, []);

  // Manual memory measurement
  const measureNow = useCallback((label?: string) => {
    if (profilerRef.current) {
      return profilerRef.current.takeMeasurement(label);
    }
    return null;
  }, []);

  // Get current memory status
  const getMemoryStatus = useCallback(() => {
    if (profilerRef.current) {
      return profilerRef.current.getMemoryStatus();
    }
    return {
      isSupported: false,
      current: 0,
      baseline: 0,
      growth: 0,
      status: 'unknown' as const
    };
  }, []);

  return {
    memoryState,
    triggerCleanup,
    measureNow,
    getMemoryStatus,
    isMonitoring: !!profilerRef.current,
  };
}; 