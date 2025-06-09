/**
 * Simplified Canvas Toolbar for Infinite Canvas
 */

import React from 'react';
import {
  MousePointer2,
  Type,
  StickyNote,
  RectangleHorizontal,
  Circle,
  Trash2,
  Triangle,
  Square,
  Hexagon,
  Star,
  ZoomIn,
  ZoomOut,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../ui';
import { useCanvasStore } from '../../stores/canvasStore';

interface SimpleCanvasToolbarProps {
  onDelete?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onAddElement?: (type: string) => void;
}

export const SimpleCanvasToolbar: React.FC<SimpleCanvasToolbarProps> = ({
  onDelete,
  onZoomIn,
  onZoomOut,
  onAddElement
}) => {
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);

  const tools = [
    { 
      id: 'select', 
      icon: MousePointer2, 
      title: 'Select', 
      onClick: () => setActiveTool('select') 
    },
    { 
      id: 'text', 
      icon: Type, 
      title: 'Text', 
      onClick: () => {
        setActiveTool('text');
        onAddElement?.('text');
      }
    },
    { 
      id: 'sticky-note', 
      icon: StickyNote, 
      title: 'Sticky Note', 
      onClick: () => {
        setActiveTool('sticky-note');
        onAddElement?.('sticky-note');
      }
    },
    { 
      id: 'rectangle', 
      icon: RectangleHorizontal, 
      title: 'Rectangle', 
      onClick: () => {
        setActiveTool('rectangle');
        onAddElement?.('rectangle');
      }
    },
    { 
      id: 'circle', 
      icon: Circle, 
      title: 'Circle', 
      onClick: () => {
        setActiveTool('circle');
        onAddElement?.('circle');
      }
    },
    { 
      id: 'triangle', 
      icon: Triangle, 
      title: 'Triangle', 
      onClick: () => {
        setActiveTool('triangle');
        onAddElement?.('triangle');
      }
    },
    { 
      id: 'square', 
      icon: Square, 
      title: 'Square', 
      onClick: () => {
        setActiveTool('square');
        onAddElement?.('square');
      }
    },
    { 
      id: 'hexagon', 
      icon: Hexagon, 
      title: 'Hexagon', 
      onClick: () => {
        setActiveTool('hexagon');
        onAddElement?.('hexagon');
      }
    },
    { 
      id: 'star', 
      icon: Star, 
      title: 'Star', 
      onClick: () => {
        setActiveTool('star');
        onAddElement?.('star');
      }
    },
    { 
      id: 'line', 
      icon: Minus, 
      title: 'Line', 
      onClick: () => {
        setActiveTool('line');
        onAddElement?.('line');
      }
    },
    { 
      id: 'arrow', 
      icon: ArrowRight, 
      title: 'Arrow', 
      onClick: () => {
        setActiveTool('arrow');
        onAddElement?.('arrow');
      }
    }
  ];

  const controlTools = [
    { id: 'zoom-in', icon: ZoomIn, title: 'Zoom In', onClick: onZoomIn },
    { id: 'zoom-out', icon: ZoomOut, title: 'Zoom Out', onClick: onZoomOut },
    { id: 'delete', icon: Trash2, title: 'Delete', onClick: onDelete }
  ];

  return (
    <div className="bg-bg-primary border-b border-border-subtle p-4">
      <div className="flex items-center gap-2">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 mr-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? "default" : "ghost"}
                size="sm"
                onClick={tool.onClick}
                title={tool.title}
                className="h-8 w-8 p-0"
              >
                <Icon size={16} />
              </Button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border-subtle mx-2" />

        {/* Control Tools */}
        <div className="flex items-center gap-1">
          {controlTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant="ghost"
                size="sm"
                onClick={tool.onClick}
                title={tool.title}
                className="h-8 w-8 p-0"
                disabled={!tool.onClick}
              >
                <Icon size={16} />
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SimpleCanvasToolbar;
