// src/app/pages/Canvas.tsx - Phase 1.3: Component Hierarchy Restoration (FINAL)
import React, { useEffect, useState } from 'react';
import { CanvasContainer } from '../../features/canvas/components/CanvasContainer';
import { useHeader } from '../contexts/HeaderContext';
import { Button } from '../../components/ui/design-system/Button';
import { PanelRight } from 'lucide-react';
import CanvasSidebar from '../../features/canvas/components/CanvasSidebar';
import Konva from 'konva';
import { Page, PageCard } from '../../components/ui/design-system/Page';

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
    <Page full>
      <PageCard>
    <div style={{ 
      display: 'flex', 
      height: '100%', 
      overflow: 'hidden', 
      background: 'var(--bg-page)',
      padding: isCanvasSidebarOpen ? '24px' : '24px 24px 24px 0',
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
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              padding: 0,
              flexShrink: 0
            }}
            title="Show canvas sidebar"
            aria-label="Show canvas sidebar"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
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
        background: 'var(--bg-content)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        
        <CanvasContainer onStageReady={handleStageReady} />
      </main>
    </div>
      </PageCard>
    </Page>
  );
}

export default CanvasPage;