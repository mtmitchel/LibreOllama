// Modern Bottom-Center Floating Toolbar (FigJam-style)
import React, { useState } from 'react';
import { useCanvasStore } from '../../../../stores';
import { useTauriCanvas } from '../../hooks/useTauriCanvas';
import { ElementId } from '../../types/enhanced.types';
import { 
  MousePointer2, 
  Type, 
  StickyNote, 
  Pen, 
  Trash2,
  Undo2,
  Redo2,
  Image,
  Hand,
  Layout,
  Table,
  Group,
  Ungroup,
  Layers
} from 'lucide-react';
import PortalColorPicker from './PortalColorPicker';
import ShapesDropdown from './ShapesDropdown';
import styles from './ModernToolbar.module.css';

const basicTools = [
  { id: 'select', name: 'Select', icon: MousePointer2 },
  { id: 'pan', name: 'Pan', icon: Hand }
];

const contentTools = [
  { id: 'text', name: 'Text', icon: Type },
  { id: 'sticky-note', name: 'Sticky Note', icon: StickyNote },
  { id: 'section', name: 'Section', icon: Layout },
  { id: 'table', name: 'Table', icon: Table }
];

const drawingTools = [
  { id: 'pen', name: 'Pen', icon: Pen },
  { id: 'image', name: 'Image', icon: Image }
];

interface ModernKonvaToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const ModernKonvaToolbar: React.FC<ModernKonvaToolbarProps> = ({
  onUndo,
  onRedo,
  sidebarOpen,
  onToggleSidebar
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorButtonRef = React.useRef<HTMLButtonElement>(null);
  
  // Canvas store hooks
  const selectedTool = useCanvasStore((state) => state.selectedTool);
  const setSelectedTool = useCanvasStore((state) => state.setSelectedTool);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const selectedElementId = selectedElementIds.size > 0 ? 
    Array.from(selectedElementIds)[0] as ElementId : null;
  const selectedElement = useCanvasStore((state) => 
    selectedElementId ? state.elements.get(selectedElementId) || null : null
  );
  const deleteElement = useCanvasStore((state) => state.deleteElement);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const groupElements = useCanvasStore((state) => state.groupElements);
  const ungroupElements = useCanvasStore((state) => state.ungroupElements);
  const isElementInGroup = useCanvasStore((state) => state.isElementInGroup);
  // Note: Layer panel functionality needs to be implemented in store
  const showLayersPanel = false; // useCanvasStore((state) => state.showLayersPanel);
  const setShowLayersPanel = () => {}; // useCanvasStore((state) => state.setShowLayersPanel);

  // Tauri canvas hooks
  const { saveToFile, loadFromFile } = useTauriCanvas();

  const handleDeleteSelected = () => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
    }
  };

  const handleGroupElements = () => {
    const selectedIds = Array.from(selectedElementIds);
    if (selectedIds.length >= 2) {
      const groupId = groupElements(selectedIds);
      if (groupId) {
        // Selection will be handled by the store
      }
    }
  };

  const handleUngroupElements = () => {
    if (selectedElementId) {
      const wasInGroup = isElementInGroup(selectedElementId);
      ungroupElements(selectedElementId);
      
      if (wasInGroup) {
        // Selection will be handled by the store
      }
    }
  };

  const handleToolClick = (toolId: string) => {
    console.log('🔧 [MODERN TOOLBAR] Tool selected:', toolId);
    setSelectedTool(toolId);
    
    // Hide color picker when switching tools
    if (showColorPicker) {
      setShowColorPicker(false);
    }
  };

  const handleColorChange = (color: string) => {
    if (!selectedElementId) return;
    
    const colorProperty = selectedElement?.type === 'sticky-note' ? 'backgroundColor' : 'fill';
    updateElement(selectedElementId, { [colorProperty]: color });
  };
  
  const canShowColorPicker = selectedElement && 
    ['rectangle', 'circle', 'triangle', 'star', 'sticky-note'].includes(selectedElement.type);
  
  // Check if current selection can be grouped/ungrouped
  const canGroup = selectedElementIds.size >= 2;
  const canUngroup = selectedElementId ? !!isElementInGroup(selectedElementId) : false;

  return (
    <div className={styles.modernToolbar}>
      {/* Basic Tools */}
      <div className={styles.toolbarGroup}>
        {basicTools.map(tool => {
          const IconComponent = tool.icon;
          const isActive = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`${styles.toolButton} ${isActive ? styles.active : ''}`}
              title={tool.name}
              aria-label={tool.name}
            >
              <IconComponent size={16} />
            </button>
          );
        })}
      </div>

      <div className={styles.separator} />

      {/* Content Tools */}
      <div className={styles.toolbarGroup}>
        {contentTools.map(tool => {
          const IconComponent = tool.icon;
          const isActive = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`${styles.toolButton} ${isActive ? styles.active : ''}`}
              title={tool.name}
              aria-label={tool.name}
            >
              <IconComponent size={16} />
            </button>
          );
        })}
      </div>

      <div className={styles.separator} />

      {/* Shapes & Drawing Tools */}
      <div className={styles.toolbarGroup}>
        <div className={styles.dropdownContainer}>
          <ShapesDropdown onToolSelect={handleToolClick} />
        </div>
        
        {drawingTools.map(tool => {
          const IconComponent = tool.icon;
          const isActive = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`${styles.toolButton} ${isActive ? styles.active : ''}`}
              title={tool.name}
              aria-label={tool.name}
            >
              <IconComponent size={16} />
            </button>
          );
        })}
      </div>

      <div className={styles.separator} />

      {/* Action Tools */}
      <div className={styles.toolbarGroup}>
        <button
          onClick={onUndo}
          className={styles.toolButton}
          title="Undo"
          aria-label="Undo"
        >
          <Undo2 size={16} />
        </button>
        
        <button
          onClick={onRedo}
          className={styles.toolButton}
          title="Redo"
          aria-label="Redo"
        >
          <Redo2 size={16} />
        </button>
        
        {selectedElementId && (
          <button
            onClick={handleDeleteSelected}
            className={styles.toolButton}
            title="Delete Selected"
            aria-label="Delete Selected"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className={styles.separator} />

      {/* Group/Ungroup Tools */}
      <div className={styles.toolbarGroup}>
        {canGroup && (
          <button
            onClick={handleGroupElements}
            className={styles.toolButton}
            title="Group Elements"
            aria-label="Group Elements"
          >
            <Group size={16} />
          </button>
        )}
        
        {canUngroup && (
          <button
            onClick={handleUngroupElements}
            className={styles.toolButton}
            title="Ungroup Elements"
            aria-label="Ungroup Elements"
          >
            <Ungroup size={16} />
          </button>
        )}
        
        <button
          onClick={() => setShowLayersPanel()}
          className={`${styles.toolButton} ${showLayersPanel ? styles.active : ''}`}
          title="Toggle Layers Panel"
          aria-label="Toggle Layers Panel"
        >
          <Layers size={16} />
        </button>
      </div>

      {/* Color Picker - Only show when element supports color */}
      {canShowColorPicker && (
        <>
          <div className={styles.separator} />
          <div className={`${styles.toolbarGroup} ${styles.colorPickerContainer}`}>
            <button
              ref={colorButtonRef}
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`${styles.toolButton} ${showColorPicker ? styles.active : ''}`}
              title="Colors"
              aria-label="Choose color"
              style={{
                background: selectedElement?.type === 'sticky-note' 
                  ? selectedElement.backgroundColor || '#FEF7CD'
                  : ('fill' in selectedElement ? selectedElement.fill : '#3B82F6') || '#3B82F6'
              }}
            >
              <div style={{ 
                width: 16, 
                height: 16, 
                borderRadius: '50%', 
                background: 'currentColor',
                border: '2px solid rgba(255,255,255,0.8)'
              }} />
            </button>
            
            {showColorPicker && selectedElement && (
              <PortalColorPicker
                selectedElement={selectedElement}
                onColorChange={handleColorChange}
                onClose={() => setShowColorPicker(false)}
                triggerRef={colorButtonRef as React.RefObject<HTMLElement>}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ModernKonvaToolbar;