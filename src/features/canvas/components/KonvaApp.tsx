// src/features/canvas/components/KonvaApp.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import CanvasIntegrationWrapper from './CanvasIntegrationWrapper';
import ModernKonvaToolbar from './toolbar/ModernKonvaToolbar';
import { useViewportControls } from '../hooks/useViewportControls';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { LayersPanel } from './ui/LayersPanel';
import { useUnifiedCanvasStore, canvasSelectors } from '../../../stores';

interface KonvaAppProps {
  appSidebarOpen?: boolean;
  canvasSidebarOpen: boolean;
  toggleCanvasSidebar: () => void;
}

import { PanelLeftClose, PanelRightClose } from 'lucide-react';
import { Button } from '../../../shared/ui';

interface KonvaAppProps {
  appSidebarOpen?: boolean;
  canvasSidebarOpen: boolean;
  toggleCanvasSidebar: () => void;
}

const KonvaApp: React.FC<KonvaAppProps> = ({ appSidebarOpen = true, canvasSidebarOpen, toggleCanvasSidebar }) => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const { zoom, pan } = useViewportControls();
  
  useKeyboardShortcuts();

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  // TODO: Implement layers panel state in unified store
  const layersPanelOpen = false; // useUnifiedCanvasStore((state) => state.layersPanelOpen);

  const updateCanvasSize = useCallback(() => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
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

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full relative">
      <div id="canvas-container" ref={canvasContainerRef} className="relative flex-1 w-full h-full rounded-lg" style={{ backgroundColor: 'var(--canvas-bg)' }}>
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

      {/* Layers Panel and Toolbar are positioned relative to this container */}
      {layersPanelOpen && (
        <div className="absolute top-20 right-4 z-10">
          <LayersPanel />
        </div>
      )}

      <ModernKonvaToolbar
        onUndo={() => {}}
        onRedo={() => {}}
        sidebarOpen={canvasSidebarOpen}
        onToggleSidebar={toggleCanvasSidebar}
        appSidebarOpen={appSidebarOpen}
      />
    </div>
  );
};

export default KonvaApp;