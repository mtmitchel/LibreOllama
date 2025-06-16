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
  Palette,
  Grid3X3,
  Layers
} from 'lucide-react';

export interface ShapeType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  element: 'rectangle' | 'circle' | 'triangle' | 'square' | 'hexagon' | 'star';
}

type CanvasTool = 'select' | 'text' | 'sticky-note' | 'image' | 'pen' | 'eraser' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'triangle' | 'square' | 'hexagon' | 'star' | 'shapes';

interface ToolItem {
  id: string;
  icon: React.ComponentType<any> | (() => JSX.Element);
  title: string;
  onClick: (() => void) | ((event: React.MouseEvent) => void) | undefined;
  disabled?: boolean;
  active?: boolean;
}

interface EnhancedCanvasToolbarProps {
  activeTool: CanvasTool;
  selectedShape: string;
  showShapeDropdown: boolean;
  dropdownPosition: { left: number; top: number } | null;
  canUndo: boolean;
  canRedo: boolean;
  currentColor: string;
  brushSize: number;
  showColorPicker: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onToolSelect: (toolId: string, event?: React.MouseEvent) => void;
  onShapeSelect: (shapeId: string) => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onToggleColorPicker: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export const EnhancedCanvasToolbar: React.FC<EnhancedCanvasToolbarProps> = ({
  activeTool,
  selectedShape,
  showShapeDropdown,
  dropdownPosition,
  canUndo,
  canRedo,
  currentColor,
  brushSize,
  showColorPicker,
  dropdownRef,
  onToolSelect,
  onShapeSelect,
  onColorChange,
  onBrushSizeChange,
  onToggleColorPicker,
  onUndo,
  onRedo,
  onDelete,
  onZoomIn,
  onZoomOut,
}) => {
  const shapes: ShapeType[] = [
    { id: 'rectangle', name: 'Rectangle', icon: RectangleHorizontal, element: 'rectangle' },
    { id: 'circle', name: 'Circle', icon: Circle, element: 'circle' },
    { id: 'triangle', name: 'Triangle', icon: Triangle, element: 'triangle' },
    { id: 'square', name: 'Square', icon: Square, element: 'square' },
    { id: 'hexagon', name: 'Hexagon', icon: Hexagon, element: 'hexagon' },
    { id: 'star', name: 'Star', icon: Star, element: 'star' },
  ];

  const colorPalette = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316',
    '#06b6d4', '#84cc16', '#ec4899', '#6366f1', '#f43f5e', '#14b8a6',
    '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff'
  ];

  const brushSizes = [1, 2, 3, 5, 8, 12, 16, 20];

  const toolGroups = [
    {
      name: 'Selection',
      tools: [
        { id: 'select', icon: MousePointer2, title: 'Select Tool', onClick: () => onToolSelect('select') }
      ]
    },
    {
      name: 'History',
      tools: [
        { id: 'undo', icon: Undo, title: 'Undo', onClick: onUndo, disabled: !canUndo },
        { id: 'redo', icon: Redo, title: 'Redo', onClick: onRedo, disabled: !canRedo }
      ]
    },
    {
      name: 'View',
      tools: [
        { id: 'zoom-in', icon: ZoomIn, title: 'Zoom In', onClick: onZoomIn },
        { id: 'zoom-out', icon: ZoomOut, title: 'Zoom Out', onClick: onZoomOut }
      ]
    },
    {
      name: 'Content',
      tools: [
        { id: 'image', icon: Image, title: 'Add Image', onClick: () => onToolSelect('image') },
        { id: 'text', icon: Type, title: 'Add Text', onClick: () => onToolSelect('text') },
        { id: 'sticky-note', icon: StickyNote, title: 'Sticky Note', onClick: () => onToolSelect('sticky-note') }
      ]
    },
    {
      name: 'Drawing',
      tools: [
        { 
          id: 'color-picker', 
          icon: () => (
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded border-2 border-white shadow"
                style={{ backgroundColor: currentColor }}
              />
              <Palette size={12} />
            </div>
          ), 
          title: 'Color Picker', 
          onClick: onToggleColorPicker,
          active: showColorPicker
        },
        { id: 'pen', icon: Pencil, title: 'Drawing Pen', onClick: () => onToolSelect('pen') },
        { id: 'eraser', icon: Eraser, title: 'Eraser', onClick: () => onToolSelect('eraser') }
      ]
    },
    {
      name: 'Shapes',
      tools: [
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
          onClick: (event: React.MouseEvent) => onToolSelect('shapes', event),
          active: showShapeDropdown
        },
        { id: 'line', icon: Minus, title: 'Line', onClick: () => onToolSelect('line') },
        { id: 'arrow', icon: ArrowRight, title: 'Arrow', onClick: () => onToolSelect('arrow') }
      ]
    },
    {
      name: 'Actions',
      tools: [
        { id: 'delete', icon: Trash2, title: 'Delete Selected', onClick: onDelete },
        { id: 'grid', icon: Grid3X3, title: 'Toggle Grid', onClick: () => {} },
        { id: 'layers', icon: Layers, title: 'Layers Panel', onClick: () => {} }
      ]
    }
  ];

  return (
    <>
      {/* Main Toolbar */}
      <div className="flex items-center gap-1 p-2">
        {toolGroups.map((group, groupIndex) => (
          <React.Fragment key={group.name}>
            {groupIndex > 0 && <div className="w-px h-8 bg-gray-200 mx-1" />}
            <div className="flex items-center gap-1">
              {group.tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={tool.onClick}
                  disabled={tool.disabled}
                  className={`
                    p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center relative
                    ${activeTool === tool.id || tool.active
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white hover:bg-gray-50 text-gray-700'
                    }
                    ${tool.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-md cursor-pointer'
                    }
                    border border-gray-200 hover:border-gray-300
                  `}
                  title={tool.title}
                >
                  {typeof tool.icon === 'function' ? <tool.icon /> : <tool.icon size={18} />}
                </button>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Color Picker Dropdown */}
      {showColorPicker && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Colors</h3>
            <div className="grid grid-cols-6 gap-2">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`
                    w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110
                    ${currentColor === color ? 'border-blue-500 shadow-md' : 'border-gray-200'}
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Brush Size</h3>
            <div className="flex items-center gap-2">
              {brushSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => onBrushSizeChange(size)}
                  className={`
                    w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200
                    ${brushSize === size ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                  title={`${size}px`}
                >
                  <div 
                    className="rounded-full bg-gray-600"
                    style={{ 
                      width: Math.min(size * 2, 16), 
                      height: Math.min(size * 2, 16) 
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shape Dropdown */}
      {showShapeDropdown && dropdownPosition && (
        <div
          ref={dropdownRef}
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 p-2 z-50"
          style={{
            left: dropdownPosition.left,
            top: dropdownPosition.top,
          }}
        >
          <div className="grid grid-cols-3 gap-1">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => onShapeSelect(shape.id)}
                className={`
                  p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 min-w-[60px]
                  ${selectedShape === shape.id
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
                title={shape.name}
              >
                <shape.icon size={20} />
                <span className="text-xs font-medium">{shape.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
