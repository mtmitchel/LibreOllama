import React from 'react';
import {
  ChevronLeft,
  FileText,
  Pin,
  Trash2
} from 'lucide-react';
import { Card, Button } from '../ui';
import { SavedCanvas } from '../../hooks/canvas/useCanvasState';

interface PastCanvasesSidebarProps {
  showPastCanvases: boolean;
  savedCanvases: SavedCanvas[];
  hoveredCanvas: string | null;
  pinnedCanvases: Set<string>;
  onToggleSidebar: () => void;
  onLoadCanvas: (canvas: SavedCanvas) => void;
  onHoverCanvas: (canvasId: string | null) => void;
  onTogglePin: (canvasId: string) => void;
  onDeleteCanvas: (canvasId: string, canvasName: string) => void;
  onExportCanvas: (canvas: SavedCanvas) => void;
}

export const PastCanvasesSidebar: React.FC<PastCanvasesSidebarProps> = ({
  showPastCanvases,
  savedCanvases,
  hoveredCanvas,
  pinnedCanvases,
  onToggleSidebar,
  onLoadCanvas,
  onHoverCanvas,
  onTogglePin,
  onDeleteCanvas,
  onExportCanvas
}) => {
  if (!showPastCanvases) {
    return null;
  }

  return (
    <Card className="w-80 flex-shrink-0 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Past Canvases</h3>
        <button
          className="p-1 hover:bg-bg-tertiary rounded-md transition-colors text-text-secondary hover:text-text-primary"
          onClick={onToggleSidebar}
          aria-label="Collapse Past Canvases sidebar"
          title="Collapse sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      
      <div className="space-y-3">
        {savedCanvases.map((canvas) => (
          <div
            key={canvas.id}
            className="relative"
            onMouseEnter={() => onHoverCanvas(canvas.id)}
            onMouseLeave={() => onHoverCanvas(null)}
          >
            <Card
              className="p-3 cursor-pointer hover:bg-bg-subtle transition-colors"
              onClick={() => onLoadCanvas(canvas)}
            >
              <h4 className="font-medium text-text-primary mb-1 pr-8">
                {canvas.name}
                {pinnedCanvases.has(canvas.id) && (
                  <Pin size={12} className="inline ml-2 text-accent" />
                )}
              </h4>
              <p className="text-sm text-text-secondary mb-2">
                Updated: {new Date(canvas.updatedAt).toLocaleDateString()}
              </p>
              <div className="text-xs text-text-secondary">
                {canvas.elements.length} elements
              </div>
            </Card>

            {/* Hover Menu */}
            {hoveredCanvas === canvas.id && (
              <div className="absolute top-2 right-2 bg-bg-primary border border-border-subtle rounded-md shadow-lg z-20 p-1 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExportCanvas(canvas);
                  }}
                  title="Export as JSON (PDF export coming soon)"
                >
                  <FileText size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(canvas.id);
                  }}
                  title={pinnedCanvases.has(canvas.id) ? "Unpin" : "Pin"}
                >
                  <Pin size={12} className={pinnedCanvases.has(canvas.id) ? "text-accent" : ""} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCanvas(canvas.id, canvas.name);
                  }}
                  title="Delete Canvas"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
