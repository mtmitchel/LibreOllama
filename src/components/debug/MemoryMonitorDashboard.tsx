// src/components/debug/MemoryMonitorDashboard.tsx
/**
 * Development dashboard for monitoring canvas memory usage
 * Part of Phase 4 Performance Optimizations
 */

import React, { useState, useEffect } from 'react';
import { useCanvasMemoryStats, useMemoryAlerts } from '../../features/canvas/hooks/canvas/useCanvasPerformance';
import type { MemoryAlert } from '@/performance/MemoryUsageMonitor';

interface MemoryMonitorDashboardProps {
  className?: string;
  refreshInterval?: number;
  showOptimizations?: boolean;
}

export const MemoryMonitorDashboard: React.FC<MemoryMonitorDashboardProps> = ({
  className = '',
  refreshInterval = 2000,
  showOptimizations = true
}) => {
  const getStats = useCanvasMemoryStats();
  const [stats, setStats] = useState(getStats());
  const [alerts, setAlerts] = useState<MemoryAlert[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Subscribe to memory alerts
  const { getRecentAlerts, forceGarbageCollection } = useMemoryAlerts((alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
  });

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
      setAlerts(getRecentAlerts(300000)); // Last 5 minutes
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [getStats, getRecentAlerts, refreshInterval]);

  const handleForceGC = () => {
    if (forceGarbageCollection()) {
      alert('Garbage collection triggered');
    } else {
      alert('Garbage collection not available in this environment');
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getAlertLevelColor = (level: MemoryAlert['level']) => {
    switch (level) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const currentMemory = stats.memory.current;
  const canvasInfo = stats.canvas;
  const leakDetection = stats.leakDetection;

  return (
    <div className={`bg-white border border-gray-300 rounded-lg shadow-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Memory Monitor</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Memory Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">JS Heap Used</div>
          <div className="text-xl font-bold">
            {currentMemory ? formatBytes(currentMemory.usedJSHeapSize) : 'N/A'}
          </div>
          <div className="text-sm text-gray-500">
            {currentMemory ? `${currentMemory.usedPercent.toFixed(1)}% of limit` : ''}
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Growth Rate</div>
          <div className={`text-xl font-bold ${stats.memory.growthRate > 1 ? 'text-red-500' : 'text-green-500'}`}>
            {stats.memory.growthRate.toFixed(2)} MB/min
          </div>
          <div className="text-sm text-gray-500">
            {leakDetection.isLeak ? `Leak confidence: ${(leakDetection.confidence * 100).toFixed(0)}%` : 'No leak detected'}
          </div>
        </div>
      </div>

      {/* Canvas Specific Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-sm text-blue-600">Konva Nodes</div>
          <div className="text-xl font-bold text-blue-800">{canvasInfo.konvaNodes}</div>
        </div>
        
        <div className="bg-purple-50 p-3 rounded">
          <div className="text-sm text-purple-600">Texture Memory</div>
          <div className="text-xl font-bold text-purple-800">{canvasInfo.textureMemory.toFixed(1)} MB</div>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Detailed Canvas Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-3 rounded">
              <div className="text-sm text-green-600">Cached Elements</div>
              <div className="text-xl font-bold text-green-800">{canvasInfo.cachedElements}</div>
            </div>
            
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-sm text-orange-600">Event Listeners</div>
              <div className="text-xl font-bold text-orange-800">{canvasInfo.eventListeners}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleForceGC}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Force GC
            </button>
            <button
              onClick={() => setAlerts([])}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Clear Alerts
            </button>
          </div>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Recent Alerts</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {alerts.map((alert, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                    <div className={`font-medium ${getAlertLevelColor(alert.level)}`}>
                      {alert.level.toUpperCase()}: {alert.message}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {showOptimizations && stats.optimizations.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Optimization Suggestions</h4>
              <ul className="space-y-1">
                {stats.optimizations.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-yellow-500 mr-2">💡</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MemoryMonitorDashboard;
