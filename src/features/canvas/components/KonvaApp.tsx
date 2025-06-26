// src/features/canvas/components/KonvaApp.tsx
import React, { useState, useEffect, useRef } from 'react';
import Konva from 'konva';
import CanvasIntegrationWrapper from './CanvasIntegrationWrapper';
import KonvaToolbar from './toolbar/KonvaToolbar';
import CanvasSidebar from './CanvasSidebar';
import { designSystem } from '../../../design-system';
import { useViewportControls } from '../hooks/useViewportControls';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { LayersPanel } from './ui/LayersPanel';
import { useCanvasStore } from '../../../stores';

const KonvaApp: React.FC = () => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const {
    zoom,
    pan,
    zoomIn,
    zoomOut,
    resetViewport,
    zoomToFit
  } = useViewportControls();
  
  // Enable keyboard shortcuts for pan/zoom and other canvas actions
  useKeyboardShortcuts();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [sidebarOpen, setSidebarOpen] = useState(true);  // Keyboard shortcuts enabled
  const layersPanelOpen = useCanvasStore((state) => state.layersPanelOpen);
  useKeyboardShortcuts();

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setCanvasSize({
          width: rect.width - 32, // Account for padding
          height: rect.height - 32
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  return (
    <div      className="app h-screen flex flex-col"
      style={{ 
        fontFamily: designSystem.typography.fontFamily.sans,
        backgroundColor: designSystem.colors.secondary[50] 
      }}
    >
      <KonvaToolbar
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onResetZoom={() => resetViewport()}
        onZoomToFit={() => zoomToFit([])}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
        <div className="flex h-full">
        <CanvasSidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <div 
          id="canvas-container" 
          style={{
            flex: 1,
            padding: `${designSystem.spacing.lg}px`,
            background: `linear-gradient(135deg, ${designSystem.colors.secondary[50]} 0%, ${designSystem.colors.secondary[100]} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >          <CanvasIntegrationWrapper
            width={canvasSize.width}
            height={canvasSize.height}
            onElementSelect={(element: any) => {
              console.log('Element selected:', element);
            }}
            stageRef={stageRef}
            panZoomState={{
              scale: zoom || 1,
              position: { x: pan?.x || 0, y: pan?.y || 0 }
            }}
            onWheelHandler={(e: any) => {
              // Handle wheel events for zoom/pan
              e.evt.preventDefault();
            }}
          />
        </div>
        {layersPanelOpen && (
          <div className="absolute top-16 right-4 z-10">
            <LayersPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default KonvaApp;


