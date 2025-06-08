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
import { CanvasTool } from '../../hooks/canvas/useCanvasState';

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
  canRedo: boolean;
  dropdownRef: React.RefObject<HTMLDivElement>;
  onToolSelect: (toolId: string, event?: React.MouseEvent) => void;
  onShapeSelect: (shapeId: string) => void;
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
  onShapeSelect
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
    { id: 'select', icon: MousePointer2, title: 'Select' },
    { id: 'undo', icon: Undo, title: 'Undo' },
    { id: 'redo', icon: Redo, title: 'Redo' },
    { id: 'zoom-in', icon: ZoomIn, title: 'Zoom In' },
    { id: 'zoom-out', icon: ZoomOut, title: 'Zoom Out' },
    { id: 'image', icon: Image, title: 'Add Image' },
    { id: 'text', icon: Type, title: 'Text' },
    { id: 'highlighter', icon: Highlighter, title: 'Text Highlighter' },
    { id: 'sticky-note', icon: StickyNote, title: 'Sticky Note' },
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
      title: 'Shapes' 
    },
    { id: 'line', icon: Minus, title: 'Line' },
    { id: 'arrow', icon: ArrowRight, title: 'Arrow' },
    { id: 'pen', icon: Pencil, title: 'Pen' },
    { id: 'eraser', icon: Eraser, title: 'Eraser' },
    { id: 'delete', icon: Trash2, title: 'Delete Selected' }
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-4 items-center">
      <Card padding="none" className="p-2 flex gap-0.5 items-center justify-center">
        {tools.map(tool => (
          <div key={tool.id} className="relative">
            <Button
              title={tool.title}
              variant={activeTool === tool.id ? 'primary' : 'ghost'}
              size="icon"
              data-tool={tool.id}
              onClick={(e) => onToolSelect(tool.id, e)}
              disabled={
                (tool.id === 'delete' && !canUndo) || 
                (tool.id === 'undo' && !canUndo) || 
                (tool.id === 'redo' && !canRedo)
              }
            >
              <tool.icon size={16} />
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
