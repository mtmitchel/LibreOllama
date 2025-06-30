import React, { useState, useRef, useEffect } from 'react';
import { 
  Square, 
  Circle, 
  Minus, 
  Triangle, 
  Star,
  ArrowRight,
  ChevronDown,
  Share2,
  Diamond,
  MessageSquare
} from 'lucide-react';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';
import styles from './ModernToolbar.module.css';
import '../../../core/design-system/globals.css';

const basicShapes = [
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'triangle', name: 'Triangle', icon: Triangle },
  { id: 'star', name: 'Star', icon: Star }
];

const connectors = [
  { id: 'connector-line', name: 'Line Connector', icon: Minus },
  { id: 'connector-arrow', name: 'Arrow Connector', icon: ArrowRight },
];

const allShapeTools = [...basicShapes, ...connectors];

interface ShapesDropdownProps {
  onToolSelect: (toolId: string) => void;
}

const ShapesDropdown: React.FC<ShapesDropdownProps> = ({ onToolSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedTool = useUnifiedCanvasStore(canvasSelectors.selectedTool);
  
  const currentShapeTool = allShapeTools.find(tool => tool.id === selectedTool) || basicShapes[0]!;
  const CurrentIcon = currentShapeTool.icon;
  
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
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`${styles.toolButton} ${
          allShapeTools.some(tool => tool.id === selectedTool) ? styles.active : ''
        }`}
        title={`Shapes (${currentShapeTool.name} selected)`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <CurrentIcon size={16} />
        <ChevronDown size={12} style={{ marginLeft: '4px' }} />
      </button>
      
      {isOpen && (
        <div className={styles.shapesDropdownContent} role="menu">
          <div className={styles.shapesDropdownSection}>
            <div className={styles.shapesDropdownHeader}>Shapes</div>
            <div className={styles.shapesGrid}>
              {basicShapes.map(tool => {
                const IconComponent = tool.icon;
                const isActive = selectedTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleShapeSelect(tool.id)}
                    className={`${styles.shapesDropdownItem} ${isActive ? styles.active : ''}`}
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
          <div className={styles.shapesDropdownSection}>
            <div className={styles.shapesDropdownHeader}>Connectors</div>
            <div className={styles.shapesGrid}>
              {connectors.map(tool => {
                const IconComponent = tool.icon;
                const isActive = selectedTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleShapeSelect(tool.id)}
                    className={`${styles.shapesDropdownItem} ${isActive ? styles.active : ''}`}
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

export default ShapesDropdown;
