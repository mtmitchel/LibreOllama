// src/app/pages/Canvas.tsx - Phase 1.3: Component Hierarchy Restoration (FINAL)
import React, { useState, useRef } from 'react';
import CanvasContainer from '../../features/canvas/components/CanvasContainer';
import CanvasSidebar from '../../features/canvas/components/CanvasSidebar';
import { PanelRightClose } from 'lucide-react';
import { Button } from '../../components/ui';
import Konva from 'konva';

/**
 * This component establishes the two-pane layout for the Canvas feature,
 * following the same pattern as the Notes and Projects pages.
 * The Canvas Sidebar is on the left, and the main canvas content is on the right.
 */
export function CanvasPage({ appSidebarOpen }: { appSidebarOpen: boolean }) {
  const [isCanvasSidebarOpen, setCanvasSidebarOpen] = useState(true);
  const [canvasStageRef, setCanvasStageRef] = useState<React.RefObject<Konva.Stage | null> | undefined>(undefined);

  const handleStageReady = (stageRef: React.RefObject<Konva.Stage | null>) => {
    setCanvasStageRef(stageRef);
  };



  return (
    <div className="flex h-full bg-bg-primary p-4 md:p-6 gap-4 md:gap-6 relative">
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
          className="absolute top-4 left-3 text-text-secondary bg-surface/80 hover:bg-surface/100 rounded-full z-10"
          style={{
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