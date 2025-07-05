import React, { useState, useRef, useEffect } from 'react';
import { 
  Minus, 
  ArrowRight,
  ChevronDown,
  GitBranch
} from 'lucide-react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { Button } from '../../../components/ui';

const connectorTools = [
  { id: 'connector-line', name: 'Line', icon: Minus },
  { id: 'connector-arrow', name: 'Arrow', icon: ArrowRight }
];

interface ConnectorDropdownProps {
  onToolSelect: (toolId: string) => void;
}

const ConnectorDropdown: React.FC<ConnectorDropdownProps> = ({ onToolSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  
  // Check if any connector tool is active, default to line connector
  const currentConnectorTool = connectorTools.find(tool => tool.id === selectedTool) || connectorTools[0]!;
  const isActive = connectorTools.some(tool => tool.id === selectedTool);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleConnectorSelect = (toolId: string) => {
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
        title={`Connectors (${currentConnectorTool.name} selected)`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <GitBranch size={16} />
        <ChevronDown size={10} className="absolute bottom-0 right-0" />
      </Button>
      
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-bg-elevated border border-border-default rounded-xl shadow-xl backdrop-blur-sm p-2 z-[1200] w-44">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wide text-center px-2 py-1">
              Connectors
            </div>
            <div className="flex flex-col gap-1">
              {connectorTools.map(tool => {
                const IconComponent = tool.icon;
                const isToolActive = selectedTool === tool.id;
                return (
                  <Button
                    key={tool.id}
                    variant={isToolActive ? "primary" : "ghost"}
                    onClick={() => handleConnectorSelect(tool.id)}
                    className="flex items-center gap-2 justify-start px-2 py-1.5 h-auto text-left w-full"
                    title={tool.name}
                  >
                    <IconComponent size={16} />
                    <span className="text-sm font-medium">{tool.name}</span>
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

export default ConnectorDropdown; 