/**
 * Drawing Diagnostics Overlay - Dev-only overlay for drawing performance metrics
 * Shows real-time drawing-specific performance data as outlined in the handoff document
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface DrawingStats {
  pointerEventsPerSecond: number;
  pointsCapturedPerSecond: number;
  batchDrawCount: number;
  layerType: string;
  interpolatedPoints: number;
  totalPoints: number;
  lastStrokePointCount: number;
  avgStrokeLength: number;
  strokeCommitTime: number;
}

interface DrawingDiagnosticsOverlayProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const DrawingDiagnosticsOverlay: React.FC<DrawingDiagnosticsOverlayProps> = ({
  isVisible = false,
  onToggle,
  position = 'bottom-left'
}) => {
  const [stats, setStats] = useState<DrawingStats>({
    pointerEventsPerSecond: 0,
    pointsCapturedPerSecond: 0,
    batchDrawCount: 0,
    layerType: 'Unknown',
    interpolatedPoints: 0,
    totalPoints: 0,
    lastStrokePointCount: 0,
    avgStrokeLength: 0,
    strokeCommitTime: 0
  });

  const [isMinimized, setIsMinimized] = useState(false);
  
  // Refs for tracking metrics
  const pointerEventCountRef = useRef(0);
  const pointsCapturedCountRef = useRef(0);
  const batchDrawCountRef = useRef(0);
  const lastResetTimeRef = useRef(Date.now());
  const strokeHistoryRef = useRef<number[]>([]);

  // Collect drawing performance data
  const collectStats = useCallback(() => {
    const now = Date.now();
    const timeDiff = (now - lastResetTimeRef.current) / 1000;
    
    if (timeDiff < 0.1) return; // Don't update too frequently

    // Calculate events per second
    const pointerEventsPerSecond = Math.round(pointerEventCountRef.current / timeDiff);
    const pointsCapturedPerSecond = Math.round(pointsCapturedCountRef.current / timeDiff);
    
    // Get layer type from window flag
    const layerType = (window as any).USE_COMPONENT_DRAWING 
      ? ('Layer')
      : 'EventManager';

    // Calculate average stroke length
    const avgStrokeLength = strokeHistoryRef.current.length > 0
      ? Math.round(strokeHistoryRef.current.reduce((a, b) => a + b, 0) / strokeHistoryRef.current.length)
      : 0;

      // Get spatial index and progressive rendering metrics if available
    const spatialMetrics = (window as any).SPATIAL_INDEX_LAST || {};
    const progressiveRenderFrameTime = (window as any).DEBUG_PROGRESSIVE_RENDER_FRAME_TIME || 0;
    const progressiveRenderPressure = (window as any).DEBUG_PROGRESSIVE_RENDER_PRESSURE || 'low';

    setStats({
      pointerEventsPerSecond,
      pointsCapturedPerSecond,
      batchDrawCount: batchDrawCountRef.current,
      layerType,
      interpolatedPoints: (window as any).DEBUG_INTERPOLATED_POINTS || 0,
      totalPoints: pointsCapturedCountRef.current,
      lastStrokePointCount: strokeHistoryRef.current[strokeHistoryRef.current.length - 1] || 0,
      avgStrokeLength,
      strokeCommitTime: (window as any).DEBUG_STROKE_COMMIT_TIME || 0,
      progressiveRenderFrameTime,
      progressiveRenderPressure,
      progressiveRenderEnabled: false /* FastLayer removed */ && pointsCapturedPerSecond > 0
    });

    // Reset counters
    pointerEventCountRef.current = 0;
    pointsCapturedCountRef.current = 0;
    batchDrawCountRef.current = 0;
    lastResetTimeRef.current = now;
  }, []);

  // Set up monitoring hooks for drawing events
  useEffect(() => {
    if (!isVisible || process.env.NODE_ENV !== 'development') return;

    // Hook into global drawing events (if they exist)
    const originalPointerMove = HTMLElement.prototype.addEventListener;
    const originalBatchDraw = (window as any).KONVA_BATCH_DRAW_HOOK;

    // Monitor pointer events (rough approximation)
    const pointerEventListener = () => {
      pointerEventCountRef.current++;
    };

    // Monitor point capture (we'll increment this from drawing tools)
    const pointCaptureListener = () => {
      pointsCapturedCountRef.current++;
    };

    // Monitor batchDraw calls
    const batchDrawListener = () => {
      batchDrawCountRef.current++;
    };

    // Store global hooks for drawing tools to use
    (window as any).DRAWING_DIAGNOSTICS = {
      recordPointerEvent: pointerEventListener,
      recordPointCapture: pointCaptureListener,
      recordBatchDraw: batchDrawListener,
      recordStrokeComplete: (pointCount: number) => {
        strokeHistoryRef.current.push(pointCount);
        if (strokeHistoryRef.current.length > 10) {
          strokeHistoryRef.current.shift(); // Keep only last 10 strokes
        }
      },
      recordStrokeCommitTime: (time: number) => {
        (window as any).DEBUG_STROKE_COMMIT_TIME = time;
      }
    };

    // Update stats every 500ms
    const interval = setInterval(collectStats, 500);

    return () => {
      clearInterval(interval);
      delete (window as any).DRAWING_DIAGNOSTICS;
    };
  }, [isVisible, collectStats]);

  // Don't render in production or when not visible
  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const positionStyles = {
    'top-left': { top: 120, left: 20 },
    'top-right': { top: 120, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 }
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return '#22c55e';
    if (value >= thresholds.warning) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        width: isMinimized ? 'auto' : 280,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        borderRadius: 6,
        padding: isMinimized ? 6 : 12,
        fontFamily: 'monospace',
        fontSize: 11,
        zIndex: 9999,
        border: '1px solid rgba(64, 224, 208, 0.3)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: isMinimized ? 0 : 8,
        borderBottom: isMinimized ? 'none' : '1px solid rgba(64, 224, 208, 0.2)',
        paddingBottom: isMinimized ? 0 : 6
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ color: '#40e0d0' }}>✏️</div>
          {!isMinimized && <span style={{ fontWeight: 'bold', color: '#40e0d0' }}>Drawing Diagnostics</span>}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'rgba(64, 224, 208, 0.2)',
              border: 'none',
              color: '#40e0d0',
              padding: '2px 6px',
              borderRadius: 3,
              cursor: 'pointer',
              fontSize: 9
            }}
          >
            {isMinimized ? '📊' : '➖'}
          </button>
          {onToggle && (
            <button
              onClick={() => onToggle(false)}
              style={{
                background: 'rgba(255, 0, 0, 0.2)',
                border: 'none',
                color: 'white',
                padding: '2px 6px',
                borderRadius: 3,
                cursor: 'pointer',
                fontSize: 9
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Real-time drawing metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ color: '#9ca3af', fontSize: 9 }}>INPUT CAPTURE</span>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pointer/sec:</span>
                <span style={{ color: getStatusColor(stats.pointerEventsPerSecond, { good: 60, warning: 30 }) }}>
                  {stats.pointerEventsPerSecond}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Points/sec:</span>
                <span style={{ color: getStatusColor(stats.pointsCapturedPerSecond, { good: 50, warning: 20 }) }}>
                  {stats.pointsCapturedPerSecond}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ color: '#9ca3af', fontSize: 9 }}>RENDERING</span>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>BatchDraw/sec:</span>
                <span style={{ color: getStatusColor(stats.batchDrawCount, { good: 30, warning: 15 }) }}>
                  {stats.batchDrawCount}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Layer Type:</span>
                <span style={{ 
                  color: 'Layer' ? '#22c55e' : 
                        stats.layerType === 'Layer' ? '#f59e0b' : '#ef4444' 
                }}>
                  {stats.layerType}
                </span>
              </div>
            </div>
          </div>

          {/* Stroke analysis */}
          <div style={{ 
            marginTop: 8, 
            paddingTop: 6, 
            borderTop: '1px solid rgba(64, 224, 208, 0.2)' 
          }}>
            <span style={{ color: '#9ca3af', fontSize: 9 }}>STROKE ANALYSIS</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4, fontSize: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Last Stroke:</span>
                <span style={{ color: '#d1d5db' }}>{stats.lastStrokePointCount} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Avg Length:</span>
                <span style={{ color: '#d1d5db' }}>{stats.avgStrokeLength} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Interpolated:</span>
                <span style={{ color: '#40e0d0' }}>{stats.interpolatedPoints}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Commit Time:</span>
                <span style={{ 
                  color: stats.strokeCommitTime < 10 ? '#22c55e' : 
                        stats.strokeCommitTime < 50 ? '#f59e0b' : '#ef4444' 
                }}>
                  {stats.strokeCommitTime}ms
                </span>
              </div>
            </div>
          </div>

          {/* Performance indicators */}
          <div style={{ 
            marginTop: 8, 
            paddingTop: 6, 
            borderTop: '1px solid rgba(64, 224, 208, 0.2)',
            fontSize: 9,
            color: '#9ca3af'
          }}>
            <div>Pipeline: {(window as any).USE_COMPONENT_DRAWING ? 'Component' : 'EventManager'}</div>
            <div>Interpolation: {stats.interpolatedPoints > 0 ? 'Active (2px step)' : 'Inactive'}</div>
            <div>Progressive: {stats.progressiveRenderEnabled ? 
              <span style={{ color: '#22c55e' }}>Enabled ({stats.progressiveRenderFrameTime.toFixed(1)}ms)</span> : 
              <span style={{ color: '#9ca3af' }}>Disabled</span>
            }</div>
            <div>Memory: <span style={{ 
              color: stats.progressiveRenderPressure === 'high' ? '#ef4444' : 
                    stats.progressiveRenderPressure === 'medium' ? '#f59e0b' : '#22c55e'
            }}>{stats.progressiveRenderPressure}</span></div>
            <div>Performance: {
              stats.pointerEventsPerSecond >= 60 && stats.batchDrawCount >= 30
                ? <span style={{ color: '#22c55e' }}>Optimal</span>
                : stats.pointerEventsPerSecond >= 30 && stats.batchDrawCount >= 15
                ? <span style={{ color: '#f59e0b' }}>Good</span>
                : <span style={{ color: '#ef4444' }}>Needs Attention</span>
            }</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingDiagnosticsOverlay;