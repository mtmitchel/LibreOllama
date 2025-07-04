import React from 'react';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';
import { useUnifiedCanvasStore } from '../../stores/unifiedCanvasStore';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface ZoomControlsProps {
  className?: string;
  stageRef?: React.RefObject<Konva.Stage | null>;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ className, stageRef }) => {
  const { viewport, setViewport, elements } = useUnifiedCanvasStore(useShallow((state) => ({
    viewport: state.viewport,
    setViewport: state.setViewport,
    elements: state.elements
  })));

  const currentZoom = Math.round(viewport.scale * 100);

  const zoomIn = () => {
    const newScale = Math.min(10, viewport.scale * 1.2);
    setViewport({ ...viewport, scale: newScale });
  };

  const zoomOut = () => {
    const newScale = Math.max(0.1, viewport.scale / 1.2);
    setViewport({ ...viewport, scale: newScale });
  };

  const resetZoom = () => {
    setViewport({ x: 0, y: 0, scale: 1 });
  };

  const resetTo100 = () => {
    console.log('🔍 [ZoomControls] Reset to 100%');
    setViewport({ ...viewport, scale: 1 });
  };



  // Expose zoom functions for keyboard shortcuts (React-Konva pattern)
  React.useEffect(() => {
    (window as any).resetZoom = resetZoom;
    (window as any).resetTo100 = resetTo100;
    (window as any).zoomIn = zoomIn;
    (window as any).zoomOut = zoomOut;
    
    return () => {
      delete (window as any).resetZoom;
      delete (window as any).resetTo100;
      delete (window as any).zoomIn;
      delete (window as any).zoomOut;
    };
  }, [resetZoom, resetTo100, zoomIn, zoomOut]);

  return (
    <div className={`flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1 ${className}`}>
      {/* Zoom Out */}
      <button
        onClick={zoomOut}
        disabled={currentZoom <= 10}
        className="flex items-center justify-center w-8 h-8 rounded bg-transparent hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white transition-colors"
        title="Zoom Out (Ctrl + -)"
      >
        <ZoomOut size={16} />
      </button>

      {/* Zoom Level Display - Click to Reset to 100% */}
      <button
        onClick={resetTo100}
        className="px-2 py-1 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors min-w-[50px]"
        title="Reset to 100% (Ctrl + 0)"
      >
        {currentZoom}%
      </button>

      {/* Zoom In */}
      <button
        onClick={zoomIn}
        disabled={currentZoom >= 1000}
        className="flex items-center justify-center w-8 h-8 rounded bg-transparent hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white transition-colors"
        title="Zoom In (Ctrl + +)"
      >
        <ZoomIn size={16} />
      </button>


    </div>
  );
}; 