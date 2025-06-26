import React, { useState, useRef, useEffect } from 'react';
import { 
  Square, 
  Circle, 
  Minus, 
  Triangle, 
  Star,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore.enhanced';
import '../../../../design-system/globals.css';

const shapeTools = [
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'connector-line', name: 'Line Connector', icon: Minus },
  { id: 'connector-arrow', name: 'Arrow Connector', icon: ArrowRight },
  { id: 'triangle', name: 'Triangle', icon: Triangle },
  { id: 'star', name: 'Star', icon: Star }
];

interface ShapesDropdownProps {
  onToolSelect: (toolId: string) => void;
}

const ShapesDropdown: React.FC<ShapesDropdownProps> = ({ onToolSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);  // Fixed: Use modular store hook - split selector
  const selectedTool = useCanvasStore((state) => state.selectedTool);
  
  // Find the currently selected shape tool, default to rectangle
  const currentShapeTool = shapeTools.find(tool => tool.id === selectedTool) || shapeTools[0]!;
  const CurrentIcon = currentShapeTool.icon;
  
  // Close dropdown when clicking outside
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
    <div className="shapes-dropdown" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`konva-toolbar-tool-btn shapes-dropdown-trigger ${
          shapeTools.some(tool => tool.id === selectedTool) ? 'active' : ''
        }`}
        title={`Shapes (${currentShapeTool.name} selected)`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <CurrentIcon size={16} />
        <ChevronDown size={12} className="dropdown-arrow" />
      </button>
      
      {isOpen && (
        <div className="shapes-dropdown-menu" role="menu">
          {shapeTools.map(tool => {
            const IconComponent = tool.icon;
            const isActive = selectedTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleShapeSelect(tool.id)}
                className={`shapes-dropdown-item ${isActive ? 'active' : ''}`}
                title={tool.name}
                role="menuitem"
              >
                <IconComponent size={16} />
                <span className="shape-name">{tool.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShapesDropdown;
