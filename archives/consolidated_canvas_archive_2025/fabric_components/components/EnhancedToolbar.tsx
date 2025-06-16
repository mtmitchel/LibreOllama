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

  return (
    <>
      {/* Main Toolbar */}
      <div className="flex items-center gap-1 p-2">
        {/* Selection Tools */}
        <button
          onClick={() => onToolSelect('select')}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 ${
            activeTool === 'select'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
          }`}
          title="Select Tool (V)"
        >
          <MousePointer2 size={18} />
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* History */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 ${
            !canUndo
              ? 'opacity-50 cursor-not-allowed bg-white'
              : 'hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md cursor-pointer'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={18} />
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 ${
            !canRedo
              ? 'opacity-50 cursor-not-allowed bg-white'
              : 'hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md cursor-pointer'
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo size={18} />
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Zoom */}
        <button
          onClick={onZoomIn}
          className="p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md cursor-pointer"
          title="Zoom In (Ctrl++)"
        >
          <ZoomIn size={18} />
        </button>
        
        <button
          onClick={onZoomOut}
          className="p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md cursor-pointer"
          title="Zoom Out (Ctrl+-)"
        >
          <ZoomOut size={18} />
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Content Tools */}
        <button
          onClick={() => onToolSelect('image')}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 ${
            activeTool === 'image'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
          }`}
          title="Add Image"
        >
          <Image size={18} />
        </button>
        
        <button
          onClick={() => onToolSelect('text')}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 ${
            activeTool === 'text'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
          }`}
          title="Add Text (T)"
        >
          <Type size={18} />
        </button>
        
        <button
          onClick={() => onToolSelect('sticky-note')}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 ${
            activeTool === 'sticky-note'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
          }`}
          title="Sticky Note"
        >
          <StickyNote size={18} />
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Drawing Tools */}
        <button
          onClick={onToggleColorPicker}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 ${
            showColorPicker
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
          }`}
          title="Color Picker"
        >
          <div className="flex items-center gap-1">
            <div 
              className="w-4 h-4 rounded border-2 border-white shadow"
              style={{ backgroundColor: currentColor }}
            />
            <Palette size={12} />
          </div>
        </button>
        
        <button
          onClick={() => onToolSelect('pen')}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 ${
            activeTool === 'pen'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
          }`}
          title="Drawing Pen (P)"
        >
          <Pencil size={18} />
        </button>
        
        <button
          onClick={() => onToolSelect('eraser')}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 ${
            activeTool === 'eraser'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
          }`}
          title="Eraser"
        >
          <Eraser size={18} />
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Shape Tools */}
        <button
          onClick={(event) => onToolSelect('shapes', event)}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 ${
            showShapeDropdown
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
          }`}
          title="Shapes"
        >
          <div className="flex items-center gap-1">
            {(() => {
              const SelectedShapeIcon = shapes.find(s => s.id === selectedShape)?.icon || RectangleHorizontal;
              return <SelectedShapeIcon size={16} />;
            })()}
            <ChevronDown size={10} />
          </div>
        </button>
        
        <button
          onClick={() => onToolSelect('line')}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 ${
            activeTool === 'line'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
          }`}
          title="Line"
        >
          <Minus size={18} />
        </button>
        
        <button
          onClick={() => onToolSelect('arrow')}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 ${
            activeTool === 'arrow'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
          }`}
          title="Arrow"
        >
          <ArrowRight size={18} />
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Action Tools */}
        <button
          onClick={onDelete}
          className="p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md cursor-pointer"
          title="Delete Selected (Del)"
        >
          <Trash2 size={18} />
        </button>
        
        <button
          className="p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md cursor-pointer"
          title="Toggle Grid (G)"
        >
          <Grid3X3 size={18} />
        </button>
        
        <button
          className="p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md cursor-pointer"
          title="Layers Panel"
        >
          <Layers size={18} />
        </button>
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
