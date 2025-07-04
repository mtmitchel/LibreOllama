/**
 * LazyToolRenderer - Lazy loading infrastructure for heavy canvas tools
 * Reduces initial bundle size by loading tools only when needed
 */

import React, { Suspense, lazy } from 'react';
import Konva from 'konva';

// Lazy load heavy tools
const TextTool = lazy(() => import('./tools/creation/TextTool').then(module => ({ default: module.TextTool })));
const StickyNoteTool = lazy(() => import('./tools/creation/StickyNoteTool').then(module => ({ default: module.StickyNoteTool })));

interface LazyToolRendererProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  toolType: 'text' | 'sticky-note';
  isActive: boolean;
}

// Loading fallback for tools
const ToolLoadingFallback: React.FC = () => (
  <div style={{ 
    position: 'absolute', 
    top: '50%', 
    left: '50%', 
    transform: 'translate(-50%, -50%)',
    fontSize: '12px',
    color: '#666',
    fontFamily: 'monospace'
  }}>
    Loading tool...
  </div>
);

/**
 * LazyToolRenderer - Renders lazy-loaded tools with proper fallbacks
 */
export const LazyToolRenderer: React.FC<LazyToolRendererProps> = ({ 
  stageRef, 
  toolType, 
  isActive 
}) => {
  const renderTool = () => {
    switch (toolType) {
      case 'text':
        return <TextTool stageRef={stageRef} isActive={isActive} />;
      case 'sticky-note':
        return <StickyNoteTool stageRef={stageRef} isActive={isActive} />;
      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<ToolLoadingFallback />}>
      {renderTool()}
    </Suspense>
  );
};

export default LazyToolRenderer; 