/**
 * CanvasContainer - Phase 1.3: Component Hierarchy Restoration
 * 
 * Primary container that establishes the clean component hierarchy:
 * CanvasPage → CanvasContainer → CanvasStage
 * 
 * Responsibilities:
 * - Provide canvas container styling and layout
 * - Delegate to CanvasStage for Stage ownership and management
 * - Include canvas toolbar
 * - Maintain separation of concerns per approved blueprint
 */

import React from 'react';
import CanvasStage from './CanvasStage';
import ModernKonvaToolbar from '../toolbar/ModernKonvaToolbar';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';

/**
 * CanvasContainer - Owns the Konva Stage and manages canvas dimensions
 */
const CanvasContainer: React.FC = () => {
  // Essential store functions for toolbar
  const undo = useUnifiedCanvasStore(state => state.undo);
  const redo = useUnifiedCanvasStore(state => state.redo);

  return (
    <div className="relative w-full h-full bg-bg-primary">
      <CanvasStage />
      <ModernKonvaToolbar
        onUndo={undo}
        onRedo={redo}
        sidebarOpen={false}
        onToggleSidebar={() => {}}
      />
    </div>
  );
};

export default CanvasContainer;