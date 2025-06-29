// Modern Bottom-Center Floating Toolbar (FigJam-style)
import React, { useState } from 'react';
import { useUnifiedCanvasStore, canvasSelectors } from '../../../../stores';
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
  appSidebarOpen?: boolean; // For app-level sidebar if present
}

const ModernKonvaToolbar: React.FC<ModernKonvaToolbarProps> = ({
  onUndo,
  onRedo,
  sidebarOpen,
  onToggleSidebar,
  appSidebarOpen = false
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorButtonRef = React.useRef<HTMLButtonElement>(null);
  
  // Unified store hooks
  const selectedTool = useUnifiedCanvasStore(canvasSelectors.selectedTool);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  const selectedElementIds = useUnifiedCanvasStore(canvasSelectors.selectedElementIds);
  const selectedElementId = selectedElementIds.size > 0 ? 
    Array.from(selectedElementIds)[0] as ElementId : null;
  const selectedElement = useUnifiedCanvasStore(state => 
    selectedElementId ? state.elements.get(selectedElementId) || null : null
  );
  const deleteElement = useUnifiedCanvasStore(state => state.deleteElement);
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  
  // Sticky note color functionality
  const setStickyNoteColor = useUnifiedCanvasStore(state => state.setSelectedStickyNoteColor);
  const groupElements = (elementIds: string[]) => {
    console.log('🔗 [ModernToolbar] Grouping elements:', elementIds);
    // TODO: Implement in unified store
    return null;
  };
  const ungroupElements = (elementId: string) => {
    console.log('🔗 [ModernToolbar] Ungrouping element:', elementId);
    // TODO: Implement in unified store
  };
  const isElementInGroup = (elementId: string) => {
    // TODO: Implement in unified store
    return false;
  };
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
    console.log('🎨 [ModernToolbar] Handling color change:', color);
    
    // Set default sticky note color for future elements
    setStickyNoteColor(color);
    
    // If an element is selected, update its color
    if (selectedElementId && selectedElement) {
      const colorProperty = selectedElement.type === 'sticky-note' ? 'backgroundColor' : 'fill';
      updateElement(selectedElementId, { [colorProperty]: color });
    }
  };
  
  const canShowColorPicker = selectedElement && 
    ['rectangle', 'circle', 'triangle', 'star', 'sticky-note'].includes(selectedElement.type);
  
  // Check if current selection can be grouped/ungrouped
  const canGroup = selectedElementIds.size >= 2;
  const canUngroup = selectedElementId ? !!isElementInGroup(selectedElementId) : false;

  return (
    <div className={styles.toolbarContainer}>
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
              <div key={tool.id} className={styles.toolContainer}>
                <button
                  onClick={() => handleToolClick(tool.id)}
                  className={`${styles.toolButton} ${isActive ? styles.active : ''}`}
                  title={tool.name}
                  aria-label={tool.name}
                >
                  <IconComponent size={16} />
                </button>
                
                {/* Color bar for sticky note tool when active */}
                {tool.id === 'sticky-note' && isActive && (
                  <div className={styles.stickyColorBar}>
                    {[
                      { color: '#FFE299', label: 'Yellow' },
                      { color: '#A8DAFF', label: 'Blue' },
                      { color: '#FFB3BA', label: 'Pink' },
                      { color: '#BAFFC9', label: 'Green' },
                      { color: '#FFDFBA', label: 'Peach' },
                      { color: '#E6BAFF', label: 'Purple' }
                    ].map((colorOption, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Use the consolidated color change handler
                          handleColorChange(colorOption.color);
                          console.log('🎨 [MODERN TOOLBAR] Color selected:', colorOption.color);
                        }}
                        className={styles.colorButton}
                        style={{ backgroundColor: colorOption.color }}
                        title={colorOption.label}
                      />
                    ))}
                  </div>
                )}
              </div>
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

        {/* Removed duplicate color picker - sticky notes now use inline color picker */}
      </div>
    </div>
  );
};

export default ModernKonvaToolbar;