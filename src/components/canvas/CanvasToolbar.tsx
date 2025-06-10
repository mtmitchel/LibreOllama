import React from 'react';
import {
  MousePointer2,
  Type,
  StickyNote,
  RectangleHorizontal,
  Circle,
  Pencil,
  Trash2,
  Triangle,
  Square,
  Hexagon,
  Star,
  ChevronDown,
  Undo,
  Redo,
  Minus,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Image,
  Eraser,
  Highlighter
} from 'lucide-react';
import { Card, Button } from '../ui';
import { CanvasTool } from '../../stores/canvasStore';

export interface ShapeType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  element: 'rectangle' | 'circle' | 'triangle' | 'square' | 'hexagon' | 'star';
}

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  selectedShape: string;
  showShapeDropdown: boolean;
  dropdownPosition: { left: number; top: number } | null;
  canUndo: boolean;
  canRedo: boolean;  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onToolSelect: (toolId: string, event?: React.MouseEvent) => void;
  onShapeSelect: (shapeId: string) => void;
  onUndo?: () => void; // Added
  onRedo?: () => void; // Added
  onDelete?: () => void; // Added
  onZoomIn?: () => void; // Added
  onZoomOut?: () => void; // Added
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTool,
  selectedShape,
  showShapeDropdown,
  dropdownPosition,
  canUndo,
  canRedo,
  dropdownRef,
  onToolSelect,
  onShapeSelect,
  onUndo, // Added
  onRedo, // Added
  onDelete, // Added
  onZoomIn, // Added
  onZoomOut, // Added
}) => {
  const shapes: ShapeType[] = [
    { id: 'rectangle', name: 'Rectangle', icon: RectangleHorizontal, element: 'rectangle' },
    { id: 'circle', name: 'Circle', icon: Circle, element: 'circle' },
    { id: 'triangle', name: 'Triangle', icon: Triangle, element: 'triangle' },
    { id: 'square', name: 'Square', icon: Square, element: 'square' },
    { id: 'hexagon', name: 'Hexagon', icon: Hexagon, element: 'hexagon' },
    { id: 'star', name: 'Star', icon: Star, element: 'star' },
  ];

  const tools = [
    { id: 'select', icon: MousePointer2, title: 'Select', onClick: () => onToolSelect('select') },
    { id: 'undo', icon: Undo, title: 'Undo', onClick: onUndo, disabled: !canUndo },
    { id: 'redo', icon: Redo, title: 'Redo', onClick: onRedo, disabled: !canRedo },
    { id: 'zoom-in', icon: ZoomIn, title: 'Zoom In', onClick: onZoomIn },
    { id: 'zoom-out', icon: ZoomOut, title: 'Zoom Out', onClick: onZoomOut },
    { id: 'image', icon: Image, title: 'Add Image', onClick: () => onToolSelect('image') },
    { id: 'text', icon: Type, title: 'Text', onClick: () => onToolSelect('text') },
    { id: 'highlighter', icon: Highlighter, title: 'Text Highlighter', onClick: () => onToolSelect('highlighter') },
    { id: 'sticky-note', icon: StickyNote, title: 'Sticky Note', onClick: () => onToolSelect('sticky-note') },
    { 
      id: 'shapes', 
      icon: () => {
        const SelectedShapeIcon = shapes.find(s => s.id === selectedShape)?.icon || RectangleHorizontal;
        return (
          <div className="flex items-center gap-1">
            <SelectedShapeIcon size={16} />
            <ChevronDown size={10} />
          </div>
        );
      }, 
      title: 'Shapes',
      onClick: (event: React.MouseEvent) => onToolSelect('shapes', event) 
    },
    { id: 'line', icon: Minus, title: 'Line', onClick: () => onToolSelect('line') },
    { id: 'arrow', icon: ArrowRight, title: 'Arrow', onClick: () => onToolSelect('arrow') },
    { id: 'pen', icon: Pencil, title: 'Pen', onClick: () => onToolSelect('pen') },
    { id: 'eraser', icon: Eraser, title: 'Eraser', onClick: () => onToolSelect('eraser') },
    { id: 'delete', icon: Trash2, title: 'Delete Selected', onClick: onDelete }
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-4 items-center">
      <Card padding="none" className="p-2 flex gap-0.5 items-center justify-center">
        {tools.map(tool => (
          <div key={tool.id} className="relative">
            <Button
              variant={activeTool === tool.id ? "secondary" : "ghost"}
              size="icon"
              onClick={tool.onClick as React.MouseEventHandler<HTMLButtonElement>} // Added onClick handler
              title={tool.title} // Added title for accessibility
              disabled={(tool as any).disabled} // Added disabled state
              className={`p-2 ${activeTool === tool.id ? 'bg-action-hover' : ''}`}
            >
              {React.createElement(tool.icon, { size: 18 })}
            </Button>
            
            {/* Shape Dropdown */}
            {tool.id === 'shapes' && showShapeDropdown && dropdownPosition && (
              <div 
                ref={dropdownRef}
                className="fixed z-50" 
                style={{
                  left: `${dropdownPosition.left}px`,
                  top: `${dropdownPosition.top}px`
                }}
              >
                <Card className="p-2 min-w-48 shadow-xl border border-border-subtle bg-bg-primary">
                  <div className="grid grid-cols-2 gap-1">
                    {shapes.map(shape => (
                      <Button
                        key={shape.id}
                        variant={selectedShape === shape.id ? 'primary' : 'ghost'}
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                        onClick={() => onShapeSelect(shape.id)}
                      >
                        <shape.icon size={12} />
                        <span>{shape.name}</span>
                      </Button>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
};
