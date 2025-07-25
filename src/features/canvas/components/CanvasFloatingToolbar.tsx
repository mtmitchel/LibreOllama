import React from 'react';
import { Button, Card } from '../../../components/ui';
import { Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { cn } from '../../../core/lib/utils';

interface CanvasFloatingToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onExport: () => void;
  className?: string;
}

export function CanvasFloatingToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onExport,
  className
}: CanvasFloatingToolbarProps) {
  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className={cn("fixed right-6 top-6 z-40", className)}>
      <Card className="flex items-center gap-1 p-1 shadow-lg">
        {/* Canvas Selector */}
        <select 
          className="rounded-md border-none bg-transparent px-3 py-1.5 text-sm focus:outline-none"
          style={{ color: 'var(--text-primary)' }}
        >
          <option>Canvas 1</option>
          <option>Canvas 2</option>
          <option>+ New Canvas</option>
        </select>
        
        <div className="bg-border-default mx-1 h-6 w-px" />
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            disabled={zoom <= 0.1}
            className="size-8 p-0"
          >
            <ZoomOut size={16} />
          </Button>
          
          <button
            onClick={onResetZoom}
            className="min-w-[60px] rounded px-2 py-1 text-sm font-medium transition-colors hover:bg-hover"
            style={{ color: 'var(--text-primary)' }}
          >
            {zoomPercentage}%
          </button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            disabled={zoom >= 5}
            className="size-8 p-0"
          >
            <ZoomIn size={16} />
          </Button>
        </div>
        
        <div className="bg-border-default mx-1 h-6 w-px" />
        
        {/* Actions */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="gap-2"
        >
          <Download size={16} />
          Export
        </Button>
      </Card>
    </div>
  );
}

// Floating tool palette for canvas
interface CanvasFloatingToolsProps {
  selectedTool: string;
  onSelectTool: (tool: string) => void;
  className?: string;
}

export function CanvasFloatingTools({
  selectedTool,
  onSelectTool,
  className
}: CanvasFloatingToolsProps) {
  const tools = [
    { id: 'select', icon: '↖', label: 'Select' },
    { id: 'pen', icon: '✏️', label: 'Pen' },
    { id: 'text', icon: 'T', label: 'Text' },
    { id: 'shape', icon: '□', label: 'Shape' },
    { id: 'connector', icon: '↗', label: 'Connector' },
  ];

  return (
    <div className={cn("fixed left-6 top-1/2 z-40 -translate-y-1/2", className)}>
      <Card className="p-2 shadow-lg">
        <div className="flex flex-col gap-1">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={selectedTool === tool.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onSelectTool(tool.id)}
              className="size-10 p-0 text-lg"
              title={tool.label}
            >
              {tool.icon}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}