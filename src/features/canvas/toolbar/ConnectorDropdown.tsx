import React, { useState, useRef, useEffect } from 'react';
import { 
  Minus, 
  ArrowRight,
  ChevronDown,
  GitBranch
} from 'lucide-react';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';
import styles from './ModernToolbar.module.css';
import '../../../core/design-system/globals.css';

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
  const selectedTool = useUnifiedCanvasStore(canvasSelectors.selectedTool);
  
  // Check if any connector tool is active, default to line connector
  const currentConnectorTool = connectorTools.find(tool => tool.id === selectedTool) || connectorTools[0]!;
  const CurrentIcon = currentConnectorTool.icon;
  
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
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`${styles.toolButton} ${
          connectorTools.some(tool => tool.id === selectedTool) ? styles.active : ''
        }`}
        title={`Connectors (${currentConnectorTool.name} selected)`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <GitBranch size={16} />
        <ChevronDown size={12} style={{ marginLeft: '4px' }} />
      </button>
      
      {isOpen && (
        <div className={styles.connectorsDropdownContent} role="menu">
          <div className={styles.connectorsDropdownSection}>
            <div className={styles.connectorsDropdownHeader}>Connectors</div>
            <div className={styles.connectorsGrid}>
              {connectorTools.map(tool => {
                const IconComponent = tool.icon;
                const isActive = selectedTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleConnectorSelect(tool.id)}
                    className={`${styles.connectorsDropdownItem} ${isActive ? styles.active : ''}`}
                    title={tool.name}
                    role="menuitem"
                  >
                    <IconComponent size={20} />
                    <span>{tool.name}</span>
                  </button>
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