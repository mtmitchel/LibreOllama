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
        className="relative size-9"
        title={`Connectors (${currentConnectorTool.name} selected)`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <GitBranch size={16} />
        <ChevronDown size={10} className="absolute bottom-0 right-0" />
      </Button>
      
      {isOpen && (
        <div className="bg-bg-elevated border-border-default absolute bottom-full left-1/2 z-[1200] mb-2 w-44 -translate-x-1/2 rounded-xl border p-2 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <div className="text-text-muted px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wide">
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
                    className="flex h-auto w-full items-center justify-start gap-2 px-2 py-1.5 text-left"
                    title={tool.name}
                  >
                    <IconComponent size={16} />
                    <span className="asana-text-sm font-medium">{tool.name}</span>
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