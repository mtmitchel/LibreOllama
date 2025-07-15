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

import React, { useRef } from 'react';
import Konva from 'konva';
import CanvasStage from './CanvasStage';
import ModernKonvaToolbar from '../toolbar/ModernKonvaToolbar';
import { CanvasDragDropHandler } from './ui/CanvasDragDropHandler';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';

interface CanvasContainerProps {
  onStageReady?: (stageRef: React.RefObject<Konva.Stage | null>) => void;
}

/**
 * Main container for the canvas feature.
 * Integrates the stage, toolbar, and sidebar.
 */
export const CanvasContainer: React.FC<CanvasContainerProps> = ({ onStageReady }) => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Notify parent when stage is ready
  React.useEffect(() => {
    if (onStageReady) {
      onStageReady(stageRef);
    }
  }, [onStageReady]);
  
  // Essential store functions for toolbar
  const undo = useUnifiedCanvasStore(state => state.undo);
  const redo = useUnifiedCanvasStore(state => state.redo);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="text-text-primary flex size-full bg-canvas">
      <div className="relative size-full flex-1 overflow-hidden bg-canvas">
        <ModernKonvaToolbar 
          onUndo={undo} 
          onRedo={redo} 
        />
        <CanvasDragDropHandler stageRef={stageRef}>
          <CanvasStage stageRef={stageRef} />
        </CanvasDragDropHandler>
      </div>
    </div>
  );
};

export default CanvasContainer;