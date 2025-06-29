/**
 * CanvasContainer - Phase 1.3: Component Hierarchy Restoration
 * 
 * Primary container that establishes the clean component hierarchy:
 * CanvasPage → CanvasContainer → KonvaApp
 * 
 * Responsibilities:
 * - Provide canvas container styling and layout
 * - Delegate to KonvaApp for Stage ownership and management
 * - Maintain separation of concerns per approved blueprint
 */

import React from 'react';
import KonvaApp from './KonvaApp';

interface CanvasContainerProps {
  appSidebarOpen?: boolean;
  canvasSidebarOpen: boolean;
  toggleCanvasSidebar: () => void;
}

/**
 * CanvasContainer - Owns the Konva Stage and manages canvas dimensions
 */
/**
 * CanvasContainer - Clean delegation to KonvaApp per approved blueprint
 */
const CanvasContainer: React.FC<CanvasContainerProps> = ({ 
  appSidebarOpen = true, 
  canvasSidebarOpen,
  toggleCanvasSidebar 
}) => {
  return (
    <KonvaApp 
      appSidebarOpen={appSidebarOpen}
      canvasSidebarOpen={canvasSidebarOpen}
      toggleCanvasSidebar={toggleCanvasSidebar}
    />
  );
};

export default CanvasContainer;