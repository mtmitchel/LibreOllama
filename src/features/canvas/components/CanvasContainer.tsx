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
import { ZoomControls } from './ui/ZoomControls';
import { ImageUploadInput } from './ui/ImageUploadInput';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';

/**
 * CanvasContainer - Owns the Konva Stage and manages canvas dimensions
 */
const CanvasContainer: React.FC = () => {
  // Stage ref for React-Konva best practices
  const stageRef = useRef<Konva.Stage | null>(null);
  
  // Essential store functions for toolbar
  const undo = useUnifiedCanvasStore(state => state.undo);
  const redo = useUnifiedCanvasStore(state => state.redo);

  return (
    <div className="relative w-full h-full bg-bg-primary">
      <CanvasStage stageRef={stageRef} />
      <ModernKonvaToolbar
        onUndo={undo}
        onRedo={redo}
        sidebarOpen={false}
        onToggleSidebar={() => {}}
      />
      {/* Zoom Controls - positioned in bottom-right corner with stage ref */}
      <ZoomControls className="absolute bottom-6 right-6 z-20" stageRef={stageRef} />
      
      {/* HTML elements that need to be outside Konva context */}
      <ImageUploadInput />
    </div>
  );
};

export default CanvasContainer;