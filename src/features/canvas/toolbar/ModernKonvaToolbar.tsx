// Modern Bottom-Center Floating Toolbar (FigJam-style)
import React, { useState } from 'react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { useTauriCanvas } from '../hooks/useTauriCanvas';
import { ElementId } from '../types/enhanced.types';
import { SHAPE_CREATORS, ShapeType } from '../utils/shapeCreators';
import { 
  MousePointer2, 
  Type, 
  StickyNote, 
  Pen, 
  Trash2,
  Undo2,
  Redo2,
  Hand,
  Layout,
  Table,
  Group,
  Ungroup,
  Layers,
  Highlighter,
  Eraser,
  Edit3,
  Brush,
  GitBranch,
  Workflow,
  Image as ImageIcon
} from 'lucide-react';
import ShapesDropdown from './ShapesDropdown';
import ConnectorDropdown from './ConnectorDropdown';
import styles from './ModernToolbar.module.css';

const basicTools = [
  { id: 'select', name: 'Select', icon: MousePointer2 },
  { id: 'pan', name: 'Pan', icon: Hand }
];

const contentTools = [
  { id: 'text', name: 'Text', icon: Type },
  { id: 'sticky-note', name: 'Sticky Note', icon: StickyNote },
  // { id: 'section', name: 'Section', icon: Layout }, // Temporarily commented out - will implement in future sprint
  { id: 'table', name: 'Table', icon: Table },
  { id: 'image', name: 'Image', icon: ImageIcon }
];

const drawingTools = [
  { id: 'pen', name: 'Pen', icon: Edit3 },
  { id: 'marker', name: 'Marker', icon: Brush },
  { id: 'highlighter', name: 'Highlighter', icon: Highlighter },
  { id: 'eraser', name: 'Eraser Tool', icon: Eraser }
];

const selectionTools = [
  // Reserved for future advanced selection tools
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Direct store access without useShallow to test
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  const selectedElementIds = useUnifiedCanvasStore(state => state.selectedElementIds);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  const deleteElement = useUnifiedCanvasStore(state => state.deleteElement);
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const setStickyNoteColor = useUnifiedCanvasStore(state => state.setStickyNoteColor);
  const canUndo = useUnifiedCanvasStore(state => state.canUndo);
  const canRedo = useUnifiedCanvasStore(state => state.canRedo);

  // STABLE: Use useMemo to prevent recalculation on every render
  const selectedElementId = React.useMemo(() => {
    return selectedElementIds.size > 0 ? Array.from(selectedElementIds)[0] as ElementId : null;
  }, [selectedElementIds.size]); // Only depend on size, not the Set itself
  
  // STABLE: Use selector with stable dependency
  const selectedElement = useUnifiedCanvasStore(state => 
    selectedElementId ? state.elements.get(selectedElementId) || null : null
  );
  const groupElements = (elementIds: string[]) => {
// TODO: Implement in unified store
    return null;
  };
  const ungroupElements = (elementId: string) => {
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

  // Add keyboard shortcut support for delete
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key for selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId]);

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
    // Special handling for image tool
    if (toolId === 'image') {
      fileInputRef.current?.click();
      return;
    }
    
    // Set the tool directly
    setSelectedTool(toolId);
    
    // Hide color picker when switching tools
    if (showColorPicker) {
      setShowColorPicker(false);
    }
  };

  const handleColorChange = (color: string) => {
// Set default sticky note color for future elements
    setStickyNoteColor(color);
    
    // If an element is selected, update its color
    if (selectedElementId && selectedElement) {
      const colorProperty = selectedElement.type === 'sticky-note' ? 'backgroundColor' : 'fill';
      updateElement(selectedElementId, { [colorProperty]: color });
    }
  };
  
  const canShowColorPicker = selectedElement && 
    ['rectangle', 'circle', 'triangle', 'mindmap', 'sticky-note'].includes(selectedElement.type);
  
  // Check if current selection can be grouped/ungrouped
  const canGroup = selectedElementIds.size >= 2;
  const canUngroup = selectedElementId ? !!isElementInGroup(selectedElementId) : false;

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Calculate dimensions maintaining aspect ratio
          const maxWidth = 300;
          const maxHeight = 300;
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            if (width > height) {
              width = maxWidth;
              height = maxWidth / aspectRatio;
            } else {
              height = maxHeight;
              width = maxHeight * aspectRatio;
            }
          }

          // Create image element in center of viewport
          const imageElement = {
            id: (Date.now().toString() + index) as ElementId,
            type: 'image' as const,
            x: 400 + (index * 20), // Center-ish position with offset for multiple images
            y: 300 + (index * 20),
            width,
            height,
            imageUrl: event.target?.result as string,
            opacity: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isLocked: false,
            isHidden: false
          };
          
          addElement(imageElement);
          setSelectedTool('select');
          
          // Select the new image after a brief delay
          setTimeout(() => {
            const selectElement = useUnifiedCanvasStore.getState().selectElement;
            selectElement(imageElement.id as any, false);
          }, 10);
};
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the input
    e.target.value = '';
  };

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
                      { color: '#FFF2CC', label: 'Soft Yellow (Default)' },
                      { color: '#E8F5E8', label: 'Soft Green' },
                      { color: '#E0F7F7', label: 'Soft Teal' },
                      { color: '#E6F3FF', label: 'Soft Blue' },
                      { color: '#F0E6FF', label: 'Soft Violet' },
                      { color: '#FFE6F2', label: 'Soft Pink' },
                      { color: '#FFE8E6', label: 'Soft Coral' },
                      { color: '#FFF0E6', label: 'Soft Peach' },
                      { color: '#FFFFFF', label: 'White' },
                      { color: '#F5F5F5', label: 'Soft Gray' }
                    ].map((colorOption, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Use the consolidated color change handler
                          handleColorChange(colorOption.color);
}}
                        className={styles.colorButton}
                        style={{ backgroundColor: colorOption.color, border: colorOption.color === '#FFFFFF' ? '1px solid #E5E7EB' : 'none' }}
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

        {/* Shapes */}
        <div className={styles.toolbarGroup}>
          <div className={styles.dropdownContainer}>
            <ShapesDropdown onToolSelect={handleToolClick} />
          </div>
        </div>

        <div className={styles.separator} />

        {/* Drawing Tools */}
        <div className={styles.toolbarGroup}>
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

        {/* Connection Tools */}
        <div className={styles.toolbarGroup}>
          <ConnectorDropdown onToolSelect={handleToolClick} />
        </div>

        <div className={styles.separator} />

        {/* Action Tools */}
        <div className={styles.toolbarGroup}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`${styles.toolButton} ${!canUndo ? styles.disabled : ''}`}
            title={canUndo ? "Undo" : "Nothing to undo"}
            aria-label="Undo"
          >
            <Undo2 size={16} />
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`${styles.toolButton} ${!canRedo ? styles.disabled : ''}`}
            title={canRedo ? "Redo" : "Nothing to redo"}
            aria-label="Redo"
          >
            <Redo2 size={16} />
          </button>
          
          {selectedElementId && (
            <button
              onClick={handleDeleteSelected}
              className={styles.toolButton}
              title="Delete Selected Element (Delete/Backspace)"
              aria-label="Delete Selected Element"
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
          
          {/* Layer Panel Toggle - Temporarily Disabled
          <button
            onClick={() => setShowLayersPanel()}
            className={`${styles.toolButton} ${showLayersPanel ? styles.active : ''}`}
            title="Toggle Layers Panel"
            aria-label="Toggle Layers Panel"
          >
            <Layers size={16} />
          </button>
          */}
        </div>

        {/* Removed duplicate color picker - sticky notes now use inline color picker */}
      </div>
      
      {/* Hidden file input for image tool */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ModernKonvaToolbar;