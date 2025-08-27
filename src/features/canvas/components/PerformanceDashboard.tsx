/**
 * Performance Dashboard Component
 * Real-time performance metrics visualization for development
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getPerformanceReport, exportPerformanceData } from '../utils/performance/performanceMonitor';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';
import { canvasLog } from '../utils/canvasLogger';

interface PerformanceDashboardProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  updateInterval?: number;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isVisible = false,
  onToggle,
  position = 'top-right',
  updateInterval = 1000
}) => {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'memory' | 'rendering' | 'interactions'>('overview');
  
  const performanceMonitor = usePerformanceMonitoring('PerformanceDashboard', {
    enabled: process.env.NODE_ENV === 'development',
    autoStart: false
  });

  // Update performance data
  const updateData = useCallback(() => {
    try {
      const report = getPerformanceReport();
      setPerformanceData(report);
    } catch (error) {
      canvasLog.error('Failed to get performance report:', error);
    }
  }, []);

  // Auto-update performance data
  useEffect(() => {
    if (!isVisible) return;

    updateData();
    const interval = setInterval(updateData, updateInterval);
    
    return () => clearInterval(interval);
  }, [isVisible, updateInterval, updateData]);

  // Export performance data
  const handleExportData = useCallback(() => {
    try {
      const data = exportPerformanceData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `canvas-performance-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      canvasLog.info('Performance data exported successfully');
    } catch (error) {
      canvasLog.error('Failed to export performance data:', error);
    }
  }, []);

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const positionStyles = {
    'top-left': { top: 20, left: 20 },
    'top-right': { top: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 }
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        width: isMinimized ? 'auto' : 400,
        maxHeight: isMinimized ? 'auto' : 600,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        borderRadius: 8,
        padding: isMinimized ? 8 : 16,
        fontFamily: 'monospace',
        fontSize: 12,
        zIndex: 10000,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: isMinimized ? 0 : 12,
        borderBottom: isMinimized ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
        paddingBottom: isMinimized ? 0 : 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: '#4ade80' }}>📊</div>
          {!isMinimized && <span style={{ fontWeight: 'bold' }}>Performance Monitor</span>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 10
            }}
          >
            {isMinimized ? '📈' : '➖'}
          </button>
          {onToggle && (
            <button
              onClick={() => onToggle(false)}
              style={{
                background: 'rgba(255, 0, 0, 0.2)',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 10
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {!isMinimized && performanceData && (
        <div>
          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: 4, 
            marginBottom: 12,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: 8
          }}>
            {(['overview', 'memory', 'rendering', 'interactions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                style={{
                  background: selectedTab === tab ? 'rgba(79, 172, 254, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 10,
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {selectedTab === 'overview' && (
              <OverviewTab data={performanceData} />
            )}
            {selectedTab === 'memory' && (
              <MemoryTab data={performanceData} />
            )}
            {selectedTab === 'rendering' && (
              <RenderingTab data={performanceData} />
            )}
            {selectedTab === 'interactions' && (
              <InteractionsTab data={performanceData} />
            )}
          </div>

          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            marginTop: 12, 
            paddingTop: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
          }}>
            <button
              onClick={updateData}
              style={{
                background: 'rgba(79, 172, 254, 0.3)',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 10
              }}
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleExportData}
              style={{
                background: 'rgba(34, 197, 94, 0.3)',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 10
              }}
            >
              📥 Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Overview tab component
const OverviewTab: React.FC<{ data: any }> = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <MetricRow label="FPS" value={data.avgFPS.toFixed(1)} unit="" status={data.avgFPS >= 50 ? 'good' : data.avgFPS >= 30 ? 'warning' : 'error'} />
    <MetricRow label="Frame Drops" value={data.frameDrops} unit="" status={data.frameDrops === 0 ? 'good' : data.frameDrops < 10 ? 'warning' : 'error'} />
    <MetricRow label="Memory" value={data.memoryUsage.toFixed(1)} unit="MB" status={data.memoryUsage < 100 ? 'good' : data.memoryUsage < 200 ? 'warning' : 'error'} />
    <MetricRow label="Init Time" value={data.canvasInitTime.toFixed(0)} unit="ms" status={data.canvasInitTime < 1000 ? 'good' : data.canvasInitTime < 3000 ? 'warning' : 'error'} />
    
    {data.recommendations.length > 0 && (
      <div style={{ marginTop: 12 }}>
        <div style={{ color: '#fbbf24', marginBottom: 4 }}>💡 Recommendations:</div>
        {data.recommendations.slice(0, 3).map((rec: string, index: number) => (
          <div key={index} style={{ color: '#d1d5db', fontSize: 10, marginLeft: 12, marginBottom: 2 }}>
            • {rec}
          </div>
        ))}
      </div>
    )}
  </div>
);

// Memory tab component
const MemoryTab: React.FC<{ data: any }> = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <MetricRow label="Current Usage" value={data.memoryUsage.toFixed(1)} unit="MB" />
    <MetricRow label="RAF Scheduled" value={data.rafStats.scheduledCount} unit="" />
    <MetricRow label="RAF Completed" value={data.rafStats.completedCount} unit="" />
    <MetricRow label="Budget Exceeded" value={data.rafStats.frameBudgetExceeded} unit="" status={data.rafStats.frameBudgetExceeded === 0 ? 'good' : 'warning'} />
  </div>
);

// Rendering tab component
const RenderingTab: React.FC<{ data: any }> = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <MetricRow label="Avg Render Time" value={data.renderingTimes.average.toFixed(2)} unit="ms" status={data.renderingTimes.average < 16.67 ? 'good' : 'warning'} />
    <MetricRow label="Max Render Time" value={data.renderingTimes.max.toFixed(2)} unit="ms" />
    <MetricRow label="Min Render Time" value={data.renderingTimes.min === Infinity ? '0' : data.renderingTimes.min.toFixed(2)} unit="ms" />
    <MetricRow label="Render Samples" value={data.renderingTimes.samples} unit="" />
  </div>
);

// Interactions tab component
const InteractionsTab: React.FC<{ data: any }> = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <MetricRow label="Avg Latency" value={data.interactionLatency.average.toFixed(2)} unit="ms" status={data.interactionLatency.average < 50 ? 'good' : data.interactionLatency.average < 100 ? 'warning' : 'error'} />
    <MetricRow label="Max Latency" value={data.interactionLatency.max.toFixed(2)} unit="ms" />
    <MetricRow label="Interaction Samples" value={data.interactionLatency.samples} unit="" />
    
    {Object.keys(data.toolSwitchTimes).length > 0 && (
      <div style={{ marginTop: 8 }}>
        <div style={{ color: '#9ca3af', marginBottom: 4, fontSize: 10 }}>Recent Tool Switches:</div>
        {Object.entries(data.toolSwitchTimes).slice(-3).map(([tool, time]: [string, any]) => (
          <div key={tool} style={{ color: '#d1d5db', fontSize: 10, marginLeft: 8 }}>
            {tool}: {new Date(time).toLocaleTimeString()}
          </div>
        ))}
      </div>
    )}
  </div>
);

// Metric row component
interface MetricRowProps {
  label: string;
  value: string | number;
  unit: string;
  status?: 'good' | 'warning' | 'error';
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, unit, status }) => {
  const statusColors = {
    good: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  };
  
  const statusColor = status ? statusColors[status] : '#d1d5db';
  
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#9ca3af' }}>{label}:</span>
      <span style={{ color: statusColor }}>
        {value}{unit && ` ${unit}`}
      </span>
    </div>
  );
};

export default PerformanceDashboard;