import React from 'react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  MousePointer, 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  ArrowUpRight, 
  Minus, 
  PenTool, 
  StickyNote, 
  Table, 
  GitBranch, 
  Image, 
  Layout, 
  Hand, 
  ZoomIn,
  RotateCcw,
  RotateCw,
  Copy,
  Scissors,
  ClipboardPaste
} from 'lucide-react';
import { useToolStore } from '../../store/toolStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useHistoryStore } from '../../store/historyStore';
import { ToolType, DEFAULT_TOOLS } from '../../types/tools';
import { cn } from '../../lib/utils';

interface MainToolbarProps {
  position?: 'top' | 'left' | 'right' | 'bottom';
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
  position = 'left',
  orientation = position === 'top' || position === 'bottom' ? 'horizontal' : 'vertical',
  size = 'md',
  className
}) => {
  const { currentTool, setTool } = useToolStore();
  const { 
    selectedIds, 
    copy, 
    cut, 
    paste, 
    deleteElements,
    zoomToFit,
    zoomToSelection 
  } = useCanvasStore();
  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  const getToolIcon = (toolType: ToolType) => {
    const iconMap = {
      [ToolType.SELECT]: MousePointer,
      [ToolType.TEXT]: Type,
      [ToolType.RECTANGLE]: Square,
      [ToolType.CIRCLE]: Circle,
      [ToolType.TRIANGLE]: Triangle,
      [ToolType.ARROW]: ArrowUpRight,
      [ToolType.LINE]: Minus,
      [ToolType.FREEFORM]: PenTool,
      [ToolType.STICKY_NOTE]: StickyNote,
      [ToolType.TABLE]: Table,
      [ToolType.CONNECTOR]: GitBranch,
      [ToolType.IMAGE]: Image,
      [ToolType.SECTION]: Layout,
      [ToolType.PAN]: Hand,
      [ToolType.ZOOM]: ZoomIn
    };
    return iconMap[toolType] || MousePointer;
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'sm';
      case 'lg': return 'lg';
      default: return 'default';
    }
  };

  const handleToolSelect = (tool: ToolType) => {
    setTool(tool);
  };

  const handleUndo = () => {
    if (canUndo()) {
      const previousState = undo();
      if (previousState) {
        // Apply the previous state to the canvas
        // This would typically be handled by the store
      }
    }
  };

  const handleRedo = () => {
    if (canRedo()) {
      const nextState = redo();
      if (nextState) {
        // Apply the next state to the canvas
        // This would typically be handled by the store
      }
    }
  };

  const handleDelete = () => {
    if (selectedIds.length > 0) {
      deleteElements(selectedIds);
    }
  };

  const toolGroups = [
    {
      name: 'Selection',
      tools: [ToolType.SELECT]
    },
    {
      name: 'Drawing',
      tools: [ToolType.FREEFORM, ToolType.LINE]
    },
    {
      name: 'Shapes',
      tools: [ToolType.RECTANGLE, ToolType.CIRCLE, ToolType.TRIANGLE, ToolType.ARROW]
    },
    {
      name: 'Content',
      tools: [ToolType.TEXT, ToolType.STICKY_NOTE, ToolType.TABLE, ToolType.IMAGE]
    },
    {
      name: 'Utilities',
      tools: [ToolType.CONNECTOR, ToolType.SECTION]
    },
    {
      name: 'Navigation',
      tools: [ToolType.PAN, ToolType.ZOOM]
    }
  ];

  const isHorizontal = orientation === 'horizontal';

  return (
    <TooltipProvider>
      <div 
        className={cn(
          'bg-white border border-gray-200 shadow-lg rounded-lg p-2',
          isHorizontal ? 'flex flex-row items-center space-x-1' : 'flex flex-col items-center space-y-1',
          className
        )}
      >
        {/* Tool Groups */}
        {toolGroups.map((group, groupIndex) => (
          <React.Fragment key={group.name}>
            {group.tools.map((toolType) => {
              const ToolIcon = getToolIcon(toolType);
              const tool = DEFAULT_TOOLS.find(t => t.id === toolType);
              const isActive = currentTool === toolType;
              
              return (
                <Tooltip key={toolType}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size={getButtonSize()}
                      onClick={() => handleToolSelect(toolType)}
                      className={cn(
                        'relative',
                        isActive && 'bg-blue-100 border-blue-300'
                      )}
                    >
                      <ToolIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side={isHorizontal ? 'bottom' : 'right'}>
                    <div className="text-sm">
                      <div className="font-medium">{tool?.name}</div>
                      {tool?.shortcut && (
                        <div className="text-xs text-gray-500">
                          Press {tool.shortcut}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 mt-1">
                        {tool?.description}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            
            {/* Separator between groups */}
            {groupIndex < toolGroups.length - 1 && (
              <Separator 
                orientation={isHorizontal ? 'vertical' : 'horizontal'} 
                className="mx-1"
              />
            )}
          </React.Fragment>
        ))}
        
        {/* Action Separator */}
        <Separator 
          orientation={isHorizontal ? 'vertical' : 'horizontal'} 
          className="mx-1"
        />
        
        {/* History Actions */}
        <div className={cn(
          isHorizontal ? 'flex flex-row space-x-1' : 'flex flex-col space-y-1'
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={getButtonSize()}
                onClick={handleUndo}
                disabled={!canUndo()}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isHorizontal ? 'bottom' : 'right'}>
              <div className="text-sm">
                <div className="font-medium">Undo</div>
                <div className="text-xs text-gray-500">Ctrl+Z</div>
              </div>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={getButtonSize()}
                onClick={handleRedo}
                disabled={!canRedo()}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isHorizontal ? 'bottom' : 'right'}>
              <div className="text-sm">
                <div className="font-medium">Redo</div>
                <div className="text-xs text-gray-500">Ctrl+Y</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Edit Actions */}
        <Separator 
          orientation={isHorizontal ? 'vertical' : 'horizontal'} 
          className="mx-1"
        />
        
        <div className={cn(
          isHorizontal ? 'flex flex-row space-x-1' : 'flex flex-col space-y-1'
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={getButtonSize()}
                onClick={copy}
                disabled={selectedIds.length === 0}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isHorizontal ? 'bottom' : 'right'}>
              <div className="text-sm">
                <div className="font-medium">Copy</div>
                <div className="text-xs text-gray-500">Ctrl+C</div>
              </div>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={getButtonSize()}
                onClick={cut}
                disabled={selectedIds.length === 0}
              >
                <Scissors className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isHorizontal ? 'bottom' : 'right'}>
              <div className="text-sm">
                <div className="font-medium">Cut</div>
                <div className="text-xs text-gray-500">Ctrl+X</div>
              </div>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={getButtonSize()}
                onClick={() => paste()}
              >
                <ClipboardPaste className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isHorizontal ? 'bottom' : 'right'}>
              <div className="text-sm">
                <div className="font-medium">Paste</div>
                <div className="text-xs text-gray-500">Ctrl+V</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* View Actions */}
        <Separator 
          orientation={isHorizontal ? 'vertical' : 'horizontal'} 
          className="mx-1"
        />
        
        <div className={cn(
          isHorizontal ? 'flex flex-row space-x-1' : 'flex flex-col space-y-1'
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={getButtonSize()}
                onClick={zoomToFit}
              >
                <Layout className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isHorizontal ? 'bottom' : 'right'}>
              <div className="text-sm">
                <div className="font-medium">Zoom to Fit</div>
                <div className="text-xs text-gray-500">Ctrl+0</div>
              </div>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={getButtonSize()}
                onClick={zoomToSelection}
                disabled={selectedIds.length === 0}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isHorizontal ? 'bottom' : 'right'}>
              <div className="text-sm">
                <div className="font-medium">Zoom to Selection</div>
                <div className="text-xs text-gray-500">Ctrl+2</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MainToolbar;
