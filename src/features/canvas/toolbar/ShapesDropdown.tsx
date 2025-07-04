import React, { useState, useRef, useEffect } from 'react';
import { 
  Square, 
  Circle, 
  Triangle, 
  ChevronDown,
  Workflow
} from 'lucide-react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import styles from './ModernToolbar.module.css';
import '../../../core/design-system/globals.css';

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
        </div>
      )}
    </div>
  );
};

export default ShapesDropdown;
