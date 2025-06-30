import React, { useEffect, useRef, useState } from 'react';

interface StabilityMetrics {
  renderCount: number;
  lastRenderTime: number;
  stabilityScore: number;
  isStable: boolean;
}

export const CanvasStabilityCheck: React.FC = () => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  const [metrics, setMetrics] = useState<StabilityMetrics>({
    renderCount: 0,
    lastRenderTime: Date.now(),
    stabilityScore: 100,
    isStable: true
  });

  // Track renders - FIXED: Added empty dependency array to prevent infinite loop
  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    // Calculate stability score (lower is better for render frequency)
    const stabilityScore = timeSinceLastRender > 100 ? 100 : Math.max(0, 100 - (100 / timeSinceLastRender));
    const isStable = renderCountRef.current < 50 && timeSinceLastRender > 50;

    setMetrics({
      renderCount: renderCountRef.current,
      lastRenderTime: now,
      stabilityScore,
      isStable
    });

    // Reset counter after a period to avoid inflated numbers
    if (renderCountRef.current > 100) {
      setTimeout(() => {
        renderCountRef.current = 0;
      }, 5000);
    }
  }, []); // CRITICAL FIX: Empty dependency array

  // Development only component
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getStatusColor = () => {
    if (metrics.renderCount > 50) return '#ff4757'; // Red - potentially unstable
    if (metrics.renderCount > 20) return '#ffa502'; // Orange - moderate activity
    return '#2ed573'; // Green - stable
  };

  const getStatusMessage = () => {
    if (metrics.renderCount > 50) return 'HIGH ACTIVITY - Possible infinite loop';
    if (metrics.renderCount > 20) return 'MODERATE ACTIVITY - Monitor closely';
    return 'STABLE - Normal render cycle';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 10000,
      minWidth: '250px'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: getStatusColor() }}>
        🔍 Canvas Stability Monitor
      </h4>
      
      <div style={{ marginBottom: '4px' }}>
        <strong>Renders:</strong> {metrics.renderCount}
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        <strong>Stability Score:</strong> {Math.round(metrics.stabilityScore)}%
      </div>
      
      <div style={{ 
        marginBottom: '8px',
        color: getStatusColor(),
        fontWeight: 'bold'
      }}>
        {getStatusMessage()}
      </div>
      
      <div style={{ 
        fontSize: '10px',
        opacity: 0.7,
        borderTop: '1px solid #333',
        paddingTop: '4px'
      }}>
        Last render: {new Date(metrics.lastRenderTime).toLocaleTimeString()}
      </div>
      
      {metrics.renderCount > 50 && (
        <div style={{
          marginTop: '8px',
          padding: '6px',
          background: '#ff4757',
          borderRadius: '4px',
          fontSize: '10px'
        }}>
          ⚠️ High render count detected! Check for infinite loops.
        </div>
      )}
    </div>
  );
};

export default CanvasStabilityCheck; 