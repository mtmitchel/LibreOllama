import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Palette,
  Type,
  Plus,
  Minus,
  MoreHorizontal
} from 'lucide-react';
import { useTextTool, useTableTool } from '../../store/toolStore';
import { useCanvasStore } from '../../store/canvasStore';
import { Point } from '../../types/canvas';
import { cn } from '../../lib/utils';

interface FloatingToolbarProps {
  position: Point;
  elementId: string;
  elementType: 'text' | 'table';
  visible: boolean;
  onClose?: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  position,
  elementId,
  elementType,
  visible,
  onClose
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  
  const { textEditingState, updateTextContent } = useTextTool();
  const { tableEditingState } = useTableTool();
  const { updateElement, getElementById } = useCanvasStore();

  const element = getElementById(elementId);

  // Adjust position to keep toolbar in viewport
  useEffect(() => {
    if (!toolbarRef.current || !visible) return;

    const toolbar = toolbarRef.current;
    const rect = toolbar.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newX = position.x;
    let newY = position.y;

    // Adjust horizontal position
    if (position.x + rect.width > viewportWidth) {
      newX = viewportWidth - rect.width - 10;
    }
    if (newX < 10) {
      newX = 10;
    }

    // Adjust vertical position
    if (position.y + rect.height > viewportHeight) {
      newY = position.y - rect.height - 10;
    }
    if (newY < 10) {
      newY = 10;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [position, visible]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  if (!visible || !element) return null;

  const renderTextToolbar = () => {
    const data = element.data as any;
    
    return (
      <TooltipProvider>
        <div className="flex items-center space-x-1">
          {/* Font Family */}
          <Select
            value={data?.fontFamily || 'Inter'}
            onValueChange={(value) => {
              updateElement(elementId, {
                data: { ...data, fontFamily: value },
                modifiedAt: Date.now()
              });
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
            </SelectContent>
          </Select>

          {/* Font Size */}
          <Select
            value={String(data?.fontSize || 16)}
            onValueChange={(value) => {
              updateElement(elementId, {
                data: { ...data, fontSize: parseInt(value) },
                modifiedAt: Date.now()
              });
            }}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72].map(size => (
                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={data?.fontWeight === 'bold' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  const newWeight = data?.fontWeight === 'bold' ? 'normal' : 'bold';
                  updateElement(elementId, {
                    data: { ...data, fontWeight: newWeight },
                    modifiedAt: Date.now()
                  });
                }}
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={data?.fontStyle === 'italic' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  const newStyle = data?.fontStyle === 'italic' ? 'normal' : 'italic';
                  updateElement(elementId, {
                    data: { ...data, fontStyle: newStyle },
                    modifiedAt: Date.now()
                  });
                }}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={data?.textDecoration?.includes('underline') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  const hasUnderline = data?.textDecoration?.includes('underline');
                  const newDecoration = hasUnderline ? 'none' : 'underline';
                  updateElement(elementId, {
                    data: { ...data, textDecoration: newDecoration },
                    modifiedAt: Date.now()
                  });
                }}
              >
                <Underline className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Alignment */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={data?.textAlign === 'left' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  updateElement(elementId, {
                    data: { ...data, textAlign: 'left' },
                    modifiedAt: Date.now()
                  });
                }}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Left</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={data?.textAlign === 'center' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  updateElement(elementId, {
                    data: { ...data, textAlign: 'center' },
                    modifiedAt: Date.now()
                  });
                }}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={data?.textAlign === 'right' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  updateElement(elementId, {
                    data: { ...data, textAlign: 'right' },
                    modifiedAt: Date.now()
                  });
                }}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={data?.textAlign === 'justify' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  updateElement(elementId, {
                    data: { ...data, textAlign: 'justify' },
                    modifiedAt: Date.now()
                  });
                }}
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Justify</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Color */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative"
              >
                <Type className="h-4 w-4" />
                <div 
                  className="absolute bottom-1 left-1 right-1 h-1 rounded"
                  style={{ backgroundColor: data?.color || '#000000' }}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Text Color</TooltipContent>
          </Tooltip>

          {/* Background Color */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative"
              >
                <Palette className="h-4 w-4" />
                <div 
                  className="absolute bottom-1 left-1 right-1 h-1 rounded"
                  style={{ backgroundColor: data?.backgroundColor || 'transparent' }}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Background Color</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  };

  const renderTableToolbar = () => {
    const data = element.data as any;
    
    return (
      <TooltipProvider>
        <div className="flex items-center space-x-1">
          {/* Add Row */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Add row logic
                  const newRows = (data?.rows || 3) + 1;
                  updateElement(elementId, {
                    data: { ...data, rows: newRows },
                    modifiedAt: Date.now()
                  });
                }}
              >
                <Plus className="h-4 w-4" />
                Row
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Row</TooltipContent>
          </Tooltip>

          {/* Remove Row */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newRows = Math.max(1, (data?.rows || 3) - 1);
                  updateElement(elementId, {
                    data: { ...data, rows: newRows },
                    modifiedAt: Date.now()
                  });
                }}
                disabled={(data?.rows || 3) <= 1}
              >
                <Minus className="h-4 w-4" />
                Row
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove Row</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          {/* Add Column */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newCols = (data?.cols || 3) + 1;
                  updateElement(elementId, {
                    data: { ...data, cols: newCols },
                    modifiedAt: Date.now()
                  });
                }}
              >
                <Plus className="h-4 w-4" />
                Col
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Column</TooltipContent>
          </Tooltip>

          {/* Remove Column */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newCols = Math.max(1, (data?.cols || 3) - 1);
                  updateElement(elementId, {
                    data: { ...data, cols: newCols },
                    modifiedAt: Date.now()
                  });
                }}
                disabled={(data?.cols || 3) <= 1}
              >
                <Minus className="h-4 w-4" />
                Col
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove Column</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          {/* Border Style */}
          <Select
            value={String(data?.borderWidth || 1)}
            onValueChange={(value) => {
              updateElement(elementId, {
                data: { ...data, borderWidth: parseInt(value) },
                modifiedAt: Date.now()
              });
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No Border</SelectItem>
              <SelectItem value="1">1px</SelectItem>
              <SelectItem value="2">2px</SelectItem>
              <SelectItem value="3">3px</SelectItem>
            </SelectContent>
          </Select>

          {/* More Options */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More Options</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  };

  return (
    <div
      ref={toolbarRef}
      className={cn(
        'fixed z-50 bg-white border border-gray-200 shadow-lg rounded-lg p-2',
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      {elementType === 'text' ? renderTextToolbar() : renderTableToolbar()}
    </div>
  );
};

// Text formatting toolbar that appears on text selection
export const TextSelectionToolbar: React.FC<{
  selection: { start: number; end: number };
  position: Point;
  visible: boolean;
  onFormat: (format: string, value?: any) => void;
}> = ({
  selection,
  position,
  visible,
  onFormat
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-gray-900 text-white rounded-md shadow-lg p-1 flex items-center space-x-1"
      style={{
        left: position.x,
        top: position.y - 10,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-gray-700"
        onClick={() => onFormat('bold')}
      >
        <Bold className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-gray-700"
        onClick={() => onFormat('italic')}
      >
        <Italic className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-gray-700"
        onClick={() => onFormat('underline')}
      >
        <Underline className="h-3 w-3" />
      </Button>
      
      <Separator orientation="vertical" className="h-4 bg-gray-600" />
      
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-gray-700"
        onClick={() => onFormat('color', '#ff0000')}
      >
        <Palette className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default FloatingToolbar;
