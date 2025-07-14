// src/app/pages/Canvas.tsx - Phase 1.3: Component Hierarchy Restoration (FINAL)
import React, { useEffect, useState } from 'react';
import { CanvasContainer } from '../../features/canvas/components/CanvasContainer';
import { useHeader } from '../contexts/HeaderContext';
import { Button } from '../../components/ui';
import { PanelRightClose } from 'lucide-react';
import CanvasSidebar from '../../features/canvas/components/CanvasSidebar';
import Konva from 'konva';

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
    setHeaderProps({
      title: "Canvas"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  return (
    <div className="relative flex h-full gap-4 bg-canvas p-6">
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
          className="absolute z-10 rounded-full"
          style={{
            top: 'var(--space-4)',
            left: 'var(--space-3)',
            color: 'var(--text-secondary)',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-primary)'
          }}
        >
          <PanelRightClose size={20} />
        </Button>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <CanvasContainer onStageReady={handleStageReady} />
      </main>
    </div>
  );
}

export default CanvasPage;