// src/app/pages/Canvas.tsx - Phase 1.3: Component Hierarchy Restoration (FINAL)
import React, { useState, useRef, useEffect } from 'react';
import CanvasContainer from '../../features/canvas/components/CanvasContainer';
import CanvasSidebar from '../../features/canvas/components/CanvasSidebar';
import { PanelRightClose, Plus, Save } from 'lucide-react';
import { Button } from '../../components/ui';
import { useHeader } from '../contexts/HeaderContext';
import Konva from 'konva';

/**
 * This component establishes the two-pane layout for the Canvas feature,
 * following the same pattern as the Notes and Projects pages.
 * The Canvas Sidebar is on the left, and the main canvas content is on the right.
 */
export function CanvasPage({ appSidebarOpen }: { appSidebarOpen: boolean }) {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [isCanvasSidebarOpen, setCanvasSidebarOpen] = useState(true);
  const [canvasStageRef, setCanvasStageRef] = useState<React.RefObject<Konva.Stage | null> | undefined>(undefined);

  const handleStageReady = (stageRef: React.RefObject<Konva.Stage | null>) => {
    setCanvasStageRef(stageRef);
  };

  useEffect(() => {
    setHeaderProps({
      title: "Canvas"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);



  return (
    <div className="flex h-full bg-[var(--bg-primary)] relative" style={{ 
      padding: 'var(--space-layout-gutter)',
      gap: 'var(--space-4)'
    }}>
      {isCanvasSidebarOpen && (
        <CanvasSidebar
          isOpen={isCanvasSidebarOpen}
          onToggle={() => setCanvasSidebarOpen(!isCanvasSidebarOpen)}
          stageRef={canvasStageRef}
        />
      )}

      {!isCanvasSidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCanvasSidebarOpen(true)}
          className="absolute z-10 text-[var(--text-secondary)] bg-[var(--bg-surface)]/80 hover:bg-[var(--bg-surface)] rounded-full"
          style={{
            top: 'var(--space-4)',
            left: 'var(--space-3)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <PanelRightClose size={20} />
        </Button>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <CanvasContainer onStageReady={handleStageReady} />
      </main>

    </div>
  );
}

export default CanvasPage;