/**
 * CanvasContainer - Phase 1.3: Component Hierarchy Restoration
 * 
 * Primary container that establishes the clean component hierarchy:
 * CanvasPage → CanvasContainer → CanvasStage
 * 
 * Responsibilities:
 * - Provide canvas container styling and layout
 * - Delegate to CanvasStage for Stage ownership and management
 * - Include canvas toolbar
 * - Maintain separation of concerns per approved blueprint
 */

import React, { useRef, useEffect, useMemo } from 'react';
import Konva from 'konva';
// CanvasStage (react-konva) disabled per blueprint
import NonReactCanvasStage from './NonReactCanvasStage';
import { readNewCanvasFlag, installRollbackShortcuts } from '../utils/canvasFlags';
import ModernKonvaToolbar from '../toolbar/ModernKonvaToolbar';
import { CanvasDragDropHandler } from './ui/CanvasDragDropHandler';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { useCanvasSizing } from '../hooks/useCanvasSizing';

// Dev-only lazy overlay to avoid require() in ESM
const DevPerfOverlay = process.env.NODE_ENV === 'development' ?
  // eslint-disable-next-line react/display-name
  (React.lazy(() => import('./PerformanceOverlayHUD')) as any) : null;

// EMERGENCY FIX: Stable canvas key prevents remounting
const STABLE_CANVAS_KEY = 'canvas-stage-stable';

interface CanvasContainerProps {
  onStageReady?: (stageRef: React.RefObject<Konva.Stage | null>) => void;
}

/**
 * Main container for the canvas feature.
 * Integrates the stage, toolbar, and sidebar.
 */
const CanvasContainerComponent: React.FC<CanvasContainerProps> = ({ onStageReady }) => {
  // CRITICAL: Use stable references to prevent remounting
  const stableStageRef = useRef<Konva.Stage | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [resizeKey, setResizeKey] = React.useState(0);

  // Install rollback helpers and notify parent when stage is ready
  React.useEffect(() => {
    installRollbackShortcuts();
    if (onStageReady) {
      onStageReady(stableStageRef);
    }
  }, [onStageReady]);
  
  // EMERGENCY FIX: Atomic selectors prevent cascade re-renders
  const undo = useUnifiedCanvasStore(state => state.undo);
  const redo = useUnifiedCanvasStore(state => state.redo);
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  
  // CRITICAL: Stable handlers prevent prop instability
  const stableHandlers = useMemo(() => ({
    onUndo: undo,
    onRedo: redo,
  }), [undo, redo]);
  
  // CRITICAL: Stable canvas props prevent remounting
  const stableCanvasProps = useMemo(() => ({
    stageRef: stableStageRef,
    selectedTool: selectedTool,
  }), [selectedTool]);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    // Force resize check after sidebar toggle
    setTimeout(() => {
      setResizeKey(prev => prev + 1);
      // Also dispatch a resize event to trigger ResizeObserver
      window.dispatchEvent(new Event('resize'));
    }, 50);
  };

  return (
    <div className="text-text-primary flex size-full bg-canvas">
      <div className="relative size-full flex-1 overflow-hidden bg-canvas">
        <ModernKonvaToolbar {...stableHandlers} />
        <CanvasDragDropHandler stageRef={stableStageRef}>
          {/* Perf overlay only in development */}
          {process.env.NODE_ENV === 'development' && DevPerfOverlay && (
            <React.Suspense fallback={null}>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <DevPerfOverlay />
              </div>
            </React.Suspense>
          )}
          {readNewCanvasFlag() ? (
            <NonReactCanvasStage 
              key={STABLE_CANVAS_KEY}
              {...stableCanvasProps}
            />
          ) : (
            <>
              {/* Legacy fallback path (react-konva CanvasStage disabled per blueprint) */}
              <NonReactCanvasStage 
                key={STABLE_CANVAS_KEY}
                {...stableCanvasProps}
              />
            </>
          )}
        </CanvasDragDropHandler>
      </div>
    </div>
  );
};

// PERFORMANCE CRITICAL: Memoize CanvasContainer to prevent remounts when selectedTool changes
export const CanvasContainer = React.memo(CanvasContainerComponent, (prevProps, nextProps) => {
  // Only re-render if onStageReady changes (which should rarely happen)
  return prevProps.onStageReady === nextProps.onStageReady;
});

export default CanvasContainer;
