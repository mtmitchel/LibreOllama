// src/components/Canvas/KonvaApp.tsx
import React, { useState, useEffect, useRef } from 'react';
import Konva from 'konva';
import KonvaCanvas from '../../features/canvas/components/KonvaCanvas'; // Corrected casing
import KonvaToolbar from '../../components/Toolbar/KonvaToolbar';
import CanvasSidebar from './CanvasSidebar';
import { useKonvaCanvasStore } from '../../features/canvas/stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';
import { useViewportControls } from '../../features/canvas/hooks/canvas/useViewportControls';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import '../../styles/konvaCanvas.css';
import '../../styles/canvas-enhancements.css';

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
  useKeyboardShortcuts(); // This hook might need stageRef or zoom functions if it handles zoom shortcuts
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
    // Use specific selectors to prevent infinite re-renders - temporarily disable elements count
  const selectedElementId = useKonvaCanvasStore(state => state.selectedElementId);
  // const elementsCount = useKonvaCanvasStore(state => Object.keys(state.elements).length);

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
    <div 
      className="app h-screen flex flex-col"
      style={{ 
        fontFamily: designSystem.typography.fontFamily.sans,
        backgroundColor: designSystem.colors.secondary[50] 
      }}
    >      <KonvaToolbar
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onResetZoom={() => resetViewport()}
        onZoomToFit={() => { 
          // Temporarily disable element count check
          zoomToFit([]); 
        }}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex h-full">

        {sidebarOpen && (
          <CanvasSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        )}
        
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
        >
        <KonvaCanvas
          width={canvasSize.width}
          height={canvasSize.height}
          onElementSelect={(element) => {
            console.log('Element selected:', element);
          }}
          stageRef={stageRef}
          panZoomState={{
            scale: zoom || 1,
            position: { x: pan?.x || 0, y: pan?.y || 0 }
          }}
          onWheelHandler={(e) => {
            // Handle wheel events for zoom/pan
            e.evt.preventDefault();
          }}
        />
        </div>
      </div>
      
      {selectedElementId && (
        <div 
          style={{
            background: designSystem.colors.secondary[100],
            padding: `${designSystem.spacing.xs}px ${designSystem.spacing.md}px`,
            fontSize: `${designSystem.typography.fontSize.sm}px`,
            color: designSystem.colors.secondary[700],
            borderTop: `1px solid ${designSystem.colors.secondary[200]}`,
            display: 'flex',
            alignItems: 'center',
            gap: `${designSystem.spacing.xs}px`
          }}
        >
          <span style={{ fontWeight: designSystem.typography.fontWeight.medium }}>
            Selected:
          </span>
          <span style={{ 
            fontFamily: designSystem.typography.fontFamily.mono,
            fontSize: `${designSystem.typography.fontSize.xs}px`,
            background: designSystem.colors.secondary[200],
            padding: '2px 6px',
            borderRadius: `${designSystem.borderRadius.sm}px`
          }}>
            {selectedElementId}
          </span>
        </div>
      )}
    </div>
  );
};

export default KonvaApp;
