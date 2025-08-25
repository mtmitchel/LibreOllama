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
import { CanvasStage } from './CanvasStage';
import ModernKonvaToolbar from '../toolbar/ModernKonvaToolbar';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';

export const CanvasContainer = () => {
  const undo = useUnifiedCanvasStore(state => state.undo);
  const redo = useUnifiedCanvasStore(state => state.redo);

  return (
    <div className="text-text-primary flex size-full bg-canvas">
      <div className="relative size-full flex-1 overflow-hidden bg-canvas">
        <ModernKonvaToolbar onUndo={undo} onRedo={redo} />
        <CanvasStage />
      </div>
    </div>
  );
};

export default CanvasContainer;