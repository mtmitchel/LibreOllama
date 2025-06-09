/**
 * Performance monitoring component for canvas development
 */

import React, { useState, useEffect } from 'react';
import { PerformanceMonitor } from '@/lib/canvas-performance';

interface PerformanceStatsProps {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({ 
  show = true, 
  position = 'top-right' 
}) => {
  const [stats, setStats] = useState({
    fps: 0,
    elementCount: 0,
    visibleElements: 0,
    culledElements: 0,
    memoryUsage: 0,
    renderTime: 0
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!show) return;

    const monitor = new PerformanceMonitor();
    monitor.start();

    const unsubscribe = monitor.onFpsUpdate((fps) => {
      setStats(prev => ({ ...prev, fps }));
    });

    // Monitor memory usage
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setStats(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024)
        }));
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(memoryInterval);
    };
  }, [show]);

  if (!show) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 50) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 bg-bg-primary border border-border-subtle rounded-lg shadow-lg`}>
      {/* Compact view */}
      <div 
        className="p-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-mono ${getFpsColor(stats.fps)}`}>
            {Math.round(stats.fps)} FPS
          </span>
          <span className="text-text-secondary">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-1 text-xs border-t border-border-subtle mt-2 pt-2">
          <div className="flex justify-between">
            <span className="text-text-secondary">Elements:</span>
            <span className="font-mono text-text-primary">{stats.elementCount}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-text-secondary">Visible:</span>
            <span className="font-mono text-text-primary">{stats.visibleElements}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-text-secondary">Culled:</span>
            <span className="font-mono text-text-primary">{stats.culledElements}</span>
          </div>
          
          {stats.memoryUsage > 0 && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Memory:</span>
              <span className="font-mono text-text-primary">{stats.memoryUsage}MB</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-text-secondary">Render:</span>
            <span className="font-mono text-text-primary">{stats.renderTime.toFixed(1)}ms</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for updating performance stats from canvas components
 */
export const usePerformanceStats = () => {
  const updateStats = (newStats: Partial<{
    fps: number;
    elementCount: number;
    visibleElements: number;
    culledElements: number;
    memoryUsage: number;
    renderTime: number;
  }>) => {
    // This could be connected to a global state if needed
    console.log('Performance update:', newStats);
  };

  return { updateStats };
};
