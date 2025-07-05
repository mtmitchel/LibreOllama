import React, { useState, useRef, useEffect } from 'react';
import { 
  Square, 
  Circle, 
  Triangle, 
  ChevronDown,
  Workflow
} from 'lucide-react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { Button } from '../../../components/ui';

const basicShapes = [
  { id: 'draw-rectangle', name: 'Rectangle', icon: Square },
  { id: 'draw-circle', name: 'Circle', icon: Circle },
  { id: 'draw-triangle', name: 'Triangle', icon: Triangle },
  { id: 'mindmap', name: 'Mindmap', icon: Workflow }
];

const allShapeTools = [...basicShapes];

interface ShapesDropdownProps {
  onToolSelect: (toolId: string) => void;
}

const ShapesDropdown: React.FC<ShapesDropdownProps> = ({ onToolSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  
  const currentShapeTool = allShapeTools.find(tool => tool.id === selectedTool) || basicShapes[0]!;
  const CurrentIcon = currentShapeTool.icon;
  const isActive = allShapeTools.some(tool => tool.id === selectedTool);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleShapeSelect = (toolId: string) => {
    onToolSelect(toolId);
    setIsOpen(false);
  };
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant={isActive ? "primary" : "ghost"}
        size="icon"
        onClick={toggleDropdown}
        className="h-9 w-9 relative"
        title={`Shapes (${currentShapeTool.name} selected)`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <CurrentIcon size={16} />
        <ChevronDown size={10} className="absolute bottom-0 right-0" />
      </Button>
      
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-bg-elevated border border-border-default rounded-xl shadow-xl backdrop-blur-sm p-2 z-[1200] min-w-max">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wide text-center px-2 py-1">
              Shapes
            </div>
            <div className="flex gap-1 justify-center items-center">
              {basicShapes.map(tool => {
                const IconComponent = tool.icon;
                const isToolActive = selectedTool === tool.id;
                return (
                  <Button
                    key={tool.id}
                    variant={isToolActive ? "primary" : "ghost"}
                    size="icon"
                    onClick={() => handleShapeSelect(tool.id)}
                    className="h-9 w-9 flex items-center justify-center"
                    title={tool.name}
                  >
                    <IconComponent size={16} />
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShapesDropdown;
