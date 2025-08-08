// src/app/pages/Canvas.tsx - Phase 1.3: Component Hierarchy Restoration (FINAL)
import React, { useEffect, useState } from 'react';
import { CanvasContainer } from '../../features/canvas/components/CanvasContainer';
import { useHeader } from '../contexts/HeaderContext';
import { Button } from '../../components/ui';
import { PanelRight } from 'lucide-react';
import CanvasSidebar from '../../features/canvas/components/CanvasSidebar';
import Konva from 'konva';
import './styles/page-asana-v2.css';

/**
 * This component establishes the two-pane layout for the Canvas feature,
 * following the same pattern as the Notes and Projects pages.
 * The Canvas Sidebar is on the left, and the main canvas content is on the right.
 */
  export function CanvasPage() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [isCanvasSidebarOpen, setCanvasSidebarOpen] = useState(true);
  const [canvasStageRef, setCanvasStageRef] = useState<React.RefObject<Konva.Stage | null> | undefined>(undefined);

  const handleStageReady = (stageRef: React.RefObject<Konva.Stage | null>) => {
    setCanvasStageRef(stageRef);
  };

  useEffect(() => {
    // Clear header as Canvas uses contextual header
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden', 
      background: '#FAFBFC',
      padding: isCanvasSidebarOpen ? '24px' : '24px 24px 24px 0', // remove left padding when closed so gutter is owned by the toggle container
      gap: isCanvasSidebarOpen ? '24px' : '0px'
    }}>
      {/* Sidebar - only renders when open */}
      {isCanvasSidebarOpen && (
        <CanvasSidebar
          isOpen={isCanvasSidebarOpen}
          onToggle={() => setCanvasSidebarOpen(!isCanvasSidebarOpen)}
          stageRef={canvasStageRef}
        />
      )}

      {/* Canvas sidebar toggle when closed - centered with minimal padding */}
      {!isCanvasSidebarOpen && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px', // owns the gutter; equal breathing room around 32px button
          height: '64px', // match main sidebar header height
          marginTop: '-24px' // cancel page top padding so centers align horizontally with the main sidebar toggle
        }}>
          <button
            onClick={() => setCanvasSidebarOpen(true)}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              color: '#7B8794',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              padding: 0,
              flexShrink: 0
            }}
            title="Show canvas sidebar"
            aria-label="Show canvas sidebar"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F4F6F8';
              e.currentTarget.style.color = '#323F4B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#7B8794';
            }}
          >
            <PanelRight size={18} strokeWidth={2} />
          </button>
        </div>
      )}

      <main style={{ 
        flex: 1, 
        minWidth: 0, 
        position: 'relative', 
        overflow: 'visible',
        background: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        
        <CanvasContainer onStageReady={handleStageReady} />
      </main>
    </div>
  );
}

export default CanvasPage;