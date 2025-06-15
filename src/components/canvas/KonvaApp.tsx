// src/components/Canvas/KonvaApp.tsx
import React, { useState, useEffect, useRef } from 'react';
import Konva from 'konva';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import KonvaCanvas from '../canvas/KonvaCanvas'; // Corrected casing
import KonvaToolbar from '../Toolbar/KonvaToolbar';
import CanvasSidebar from '../canvas/CanvasSidebar';
import { useKonvaCanvasStore } from '../../stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';
import { usePanZoom } from '../../hooks/usePanZoom';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import '../../styles/konvaCanvas.css';
import '../../styles/canvas-enhancements.css';

const KonvaApp: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const { 
    panZoomState, 
    handleWheel, 
    handleTouchMove, 
    handleTouchEnd, 
    resetZoom, 
    zoomToFit, 
    zoomIn, 
    zoomOut 
  } = usePanZoom();

  // Enable keyboard shortcuts for pan/zoom and other canvas actions
  useKeyboardShortcuts(); // This hook might need stageRef or zoom functions if it handles zoom shortcuts
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { selectedElementId, elements: canvasElements } = useKonvaCanvasStore();

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
  }, []);  return (
    <div 
      className="app h-screen flex flex-col"
      style={{ 
        fontFamily: designSystem.typography.fontFamily.sans,
        backgroundColor: designSystem.colors.secondary[50] 
      }}
    >
      <KonvaToolbar 
        onZoomIn={() => { if (stageRef.current) zoomIn(stageRef.current); }}
        onZoomOut={() => { if (stageRef.current) zoomOut(stageRef.current); }}
        onResetZoom={() => { if (stageRef.current) resetZoom(stageRef.current); }}
        onZoomToFit={() => { if (stageRef.current && canvasElements) zoomToFit(stageRef.current, Object.values(canvasElements)); }}
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
        >        <KonvaCanvas
          width={canvasSize.width}
          height={canvasSize.height}
          onElementSelect={(element) => {
            console.log('Element selected:', element);
          }}
          panZoomState={panZoomState}
          stageRef={stageRef}
          onWheelHandler={handleWheel}
          onTouchMoveHandler={handleTouchMove}
          onTouchEndHandler={handleTouchEnd}
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
