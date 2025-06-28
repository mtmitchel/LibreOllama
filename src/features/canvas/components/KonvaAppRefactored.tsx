/**
 * KonvaApp (Refactored) - Phase 4B: Component Migration
 * 
 * Migrated to use unified store architecture:
 * - Fixed duplicate interface definitions
 * - Connected undo/redo to unified store actions
 * - Consistent store import patterns
 * - Maintained all existing functionality
 * - Type-safe store operations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import CanvasIntegrationWrapper from './CanvasIntegrationWrapper';
import ModernKonvaToolbar from './toolbar/ModernKonvaToolbar';
import { useViewportControls } from '../hooks/useViewportControls';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { LayersPanel } from './ui/LayersPanel';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';
import { Button } from '../../../shared/ui';

// Import unified store with consistent pattern through main stores
import { useUnifiedCanvasStore, canvasSelectors } from '../../../stores';

interface KonvaAppProps {
  appSidebarOpen?: boolean;
  canvasSidebarOpen: boolean;
  toggleCanvasSidebar: () => void;
}

const KonvaAppRefactored: React.FC<KonvaAppProps> = ({ 
  appSidebarOpen = true, 
  canvasSidebarOpen, 
  toggleCanvasSidebar 
}) => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Use viewport controls (these will need to be updated to use unified store)
  const { zoom, pan } = useViewportControls();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Local state for canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Unified store state access with type-safe selectors
  const showGrid = useUnifiedCanvasStore(state => state.showGrid);
  const canUndo = useUnifiedCanvasStore(canvasSelectors.canUndo);
  const canRedo = useUnifiedCanvasStore(canvasSelectors.canRedo);
  
  // Unified store actions
  const { undo, redo } = useUnifiedCanvasStore();
  
  // For now, use a local state for layers panel until we migrate LayersPanel
  // TODO: This should be moved to unified store UI state
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);

  const updateCanvasSize = useCallback(() => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      // SAFETY: Ensure minimum canvas size to prevent Konva errors
      const width = Math.max(rect.width || 800, 100);
      const height = Math.max(rect.height || 600, 100);
      
      setCanvasSize({ width, height });
      console.log('🎨 [KonvaApp] Canvas size updated:', { width, height });
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      // Delay the update slightly to allow the layout to settle
      setTimeout(updateCanvasSize, 50);
    };

    handleResize(); // Initial size calculation
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize, appSidebarOpen, canvasSidebarOpen]);

  // Type-safe undo/redo handlers connected to unified store
  const handleUndo = useCallback(() => {
    if (canUndo) {
      undo();
    }
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      redo();
    }
  }, [canRedo, redo]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full relative">
      <div 
        id="canvas-container" 
        ref={canvasContainerRef} 
        className="relative flex-1 w-full h-full rounded-lg" 
        style={{ backgroundColor: 'var(--canvas-bg)' }}
      >
        <CanvasIntegrationWrapper
          width={canvasSize.width}
          height={canvasSize.height}
          stageRef={stageRef}
          panZoomState={{
            scale: zoom || 1,
            position: { x: pan?.x || 0, y: pan?.y || 0 },
          }}
          onWheelHandler={(e: any) => e.evt.preventDefault()}
        />
      </div>

      {/* Layers Panel positioned relative to container */}
      {layersPanelOpen && (
        <div className="absolute top-20 right-4 z-10">
          <LayersPanel />
        </div>
      )}

      {/* Modern toolbar with unified store integration */}
      <ModernKonvaToolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        sidebarOpen={canvasSidebarOpen}
        onToggleSidebar={toggleCanvasSidebar}
        appSidebarOpen={appSidebarOpen}
      />
    </div>
  );
};

export default KonvaAppRefactored;