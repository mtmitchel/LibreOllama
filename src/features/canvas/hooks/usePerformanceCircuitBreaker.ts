/**
 * EMERGENCY: Performance Circuit Breaker
 * Monitors performance violations and activates emergency mode
 */

import { useEffect, useRef } from 'react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';

interface PerformanceMetrics {
  violationCount: number;
  lastReset: number;
  emergencyMode: boolean;
  canvasInitCount: number;
}

// Global performance state
let performanceMetrics: PerformanceMetrics = {
  violationCount: 0,
  lastReset: Date.now(),
  emergencyMode: false,
  canvasInitCount: 0,
};

export const usePerformanceCircuitBreaker = () => {
  // COMPLETELY DISABLED: Performance monitoring was blocking the main thread
  // This hook now returns dummy values to prevent breaking the interface
  
  return {
    emergencyMode: false,
    violationCount: 0,
    resetMetrics: () => {}
  };
};

// Global emergency check - DISABLED
export const isCanvasInEmergencyMode = (): boolean => {
  return false; // Always return false since monitoring is disabled
};

// Emergency stop function - DISABLED
export const emergencyStopCanvas = (reason: string) => {
  // Do nothing - emergency mode is disabled
};