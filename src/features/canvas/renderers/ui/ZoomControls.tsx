import React, { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUnifiedCanvasStore } from '../../store/useCanvasStore';
import { ZoomIn, ZoomOut } from 'lucide-react';

declare global {
  interface Window {
    resetZoom?: () => void;
    resetTo100?: () => void;
    zoomIn?: () => void;
    zoomOut?: () => void;
  }
}

interface ZoomControlsProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ className, style }) => {
  const { viewport, setViewport } = useUnifiedCanvasStore(useShallow((state) => ({
    viewport: state.viewport,
    setViewport: state.setViewport
  })));

  const currentZoom = Math.round(viewport.scale * 100);

  const zoomIn = useCallback(() => {
    const newScale = Math.min(10, viewport.scale * 1.2);
    setViewport({ scale: newScale });
  }, [viewport.scale, setViewport]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(0.1, viewport.scale / 1.2);
    setViewport({ scale: newScale });
  }, [viewport.scale, setViewport]);

  const resetZoom = useCallback(() => {
    setViewport({ scale: 1 });
  }, [setViewport]);

  const resetTo100 = useCallback(() => {
    setViewport({ scale: 1 });
  }, [setViewport]);

  // Expose zoom functions for keyboard shortcuts (React-Konva pattern)
  useEffect(() => {
    window.resetZoom = resetZoom;
    window.resetTo100 = resetTo100;
    window.zoomIn = zoomIn;
    window.zoomOut = zoomOut;
    
    return () => {
      delete window.resetZoom;
      delete window.resetTo100;
      delete window.zoomIn;
      delete window.zoomOut;
    };
  }, [resetZoom, resetTo100, zoomIn, zoomOut]);

  return (
    <div 
      className={`border-border-default flex items-center gap-1 rounded-lg border bg-white p-1 shadow-md ${className}`}
      style={style}
    >
      {/* Zoom Out */}
      <button
        onClick={zoomOut}
        disabled={currentZoom <= 10}
        className="flex size-8 items-center justify-center rounded bg-transparent text-secondary transition-colors hover:bg-surface hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        title="Zoom Out (Ctrl + -)"
      >
        <ZoomOut size={16} />
      </button>

      {/* Zoom Level Display - Click to Reset to 100% */}
      <button
        onClick={resetTo100}
        className="min-w-[3rem] px-2 py-1 text-[11px] font-medium text-secondary transition-colors hover:bg-surface hover:text-primary"
        title="Reset to 100%"
      >
        {currentZoom}%
      </button>

      {/* Zoom In */}
      <button
        onClick={zoomIn}
        disabled={currentZoom >= 1000}
        className="flex size-8 items-center justify-center rounded bg-transparent text-secondary transition-colors hover:bg-surface hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        title="Zoom In (Ctrl + +)"
      >
        <ZoomIn size={16} />
      </button>
    </div>
  );
}; 