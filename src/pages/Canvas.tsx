// src/pages/Canvas.tsx - Phase 1.3: Component Hierarchy Restoration (FINAL)
import React, { useState, useEffect } from 'react';
import CanvasContainer from '../features/canvas/components/CanvasContainer';
import CanvasSidebar from '../features/canvas/components/CanvasSidebar';
import { PanelRightClose } from 'lucide-react';
import { Button } from '../shared/ui';
import { useUnifiedCanvasStore } from '../stores';

/**
 * This component establishes the two-pane layout for the Canvas feature,
 * following the same pattern as the Notes and Projects pages.
 * The Canvas Sidebar is on the left, and the main canvas content is on the right.
 */
export function CanvasPage({ appSidebarOpen }: { appSidebarOpen: boolean }) {
  const [isCanvasSidebarOpen, setCanvasSidebarOpen] = useState(true);

  // Debug: Expose unified store to window for testing (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Simple debug exposure without getState calls in render
      (window as any).__CANVAS_STORE__ = {
        getState: () => useUnifiedCanvasStore.getState(),
        subscribe: useUnifiedCanvasStore.subscribe,
        createTestElements: () => useUnifiedCanvasStore.getState().createTestElements()
      };
      console.log('🛠️ [Debug] Unified canvas store exposed to window.__CANVAS_STORE__');
    }
  }, []);

  return (
    <div className="flex h-full bg-bg-primary p-4 md:p-6 gap-4 md:gap-6 relative">
      {isCanvasSidebarOpen && (
        <CanvasSidebar
          isOpen={isCanvasSidebarOpen}
          onToggle={() => setCanvasSidebarOpen(!isCanvasSidebarOpen)}
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
        <CanvasContainer
          appSidebarOpen={appSidebarOpen}
          canvasSidebarOpen={isCanvasSidebarOpen}
          toggleCanvasSidebar={() => setCanvasSidebarOpen(!isCanvasSidebarOpen)}
        />
      </main>
    </div>
  );
}

export default CanvasPage;