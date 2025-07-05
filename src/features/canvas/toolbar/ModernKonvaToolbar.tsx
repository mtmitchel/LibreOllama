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
  Image as ImageIcon,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import ShapesDropdown from './ShapesDropdown';
import ConnectorDropdown from './ConnectorDropdown';
import { Button } from '../../../components/ui';

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
  const viewport = useUnifiedCanvasStore(state => state.viewport);
  const setViewport = useUnifiedCanvasStore(state => state.setViewport);

  // STABLE: Use useMemo to prevent recalculation on every render
  const selectedElementId = React.useMemo(() => {
    return selectedElementIds.size > 0 ? Array.from(selectedElementIds)[0] as ElementId : null;
  }, [selectedElementIds.size]); // Only depend on size, not the Set itself
  
  // STABLE: Use selector with stable dependency
  const selectedElement = useUnifiedCanvasStore(state => 
    selectedElementId ? state.elements.get(selectedElementId) || null : null
  );

  // Zoom controls functions
  const currentZoom = Math.round(viewport.scale * 100);

  const zoomIn = () => {
    const newScale = Math.min(10, viewport.scale * 1.2);
    setViewport({ scale: newScale });
  };

  const zoomOut = () => {
    const newScale = Math.max(0.1, viewport.scale / 1.2);
    setViewport({ scale: newScale });
  };

  const resetZoom = () => {
    setViewport({ scale: 1 });
  };

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
    <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-[1000]">
      <div className="pointer-events-auto flex items-center justify-center gap-3 px-3 py-1.5 bg-bg-elevated border border-border-default rounded-lg shadow-xl backdrop-blur-sm max-w-[95vw] overflow-visible">
        {/* Basic Tools */}
        <div className="flex items-center gap-1">
          {basicTools.map(tool => {
            const IconComponent = tool.icon;
            const isActive = selectedTool === tool.id;
            return (
              <Button
                key={tool.id}
                variant={isActive ? "primary" : "ghost"}
                size="icon"
                onClick={() => handleToolClick(tool.id)}
                className="h-9 w-9"
                title={tool.name}
                aria-label={tool.name}
              >
                <IconComponent size={16} />
              </Button>
            );
          })}
        </div>

        {/* Content Tools */}
        <div className="flex items-center gap-1">
          {contentTools.map(tool => {
            const IconComponent = tool.icon;
            const isActive = selectedTool === tool.id;
            return (
              <div key={tool.id} className="relative">
                <Button
                  variant={isActive ? "primary" : "ghost"}
                  size="icon"
                  onClick={() => handleToolClick(tool.id)}
                  className="h-9 w-9"
                  title={tool.name}
                  aria-label={tool.name}
                >
                  <IconComponent size={16} />
                </Button>
                
                {/* Color bar for sticky note tool when active */}
                {tool.id === 'sticky-note' && isActive && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 p-3 bg-bg-elevated border border-border-default rounded-xl shadow-xl backdrop-blur-sm">
                    {[
                      { color: 'var(--stickynote-yellow)', label: 'Soft Yellow (Default)' },
                      { color: 'var(--stickynote-green)', label: 'Soft Green' },
                      { color: 'var(--stickynote-teal)', label: 'Soft Teal' },
                      { color: 'var(--stickynote-blue)', label: 'Soft Blue' },
                      { color: 'var(--stickynote-violet)', label: 'Soft Violet' },
                      { color: 'var(--stickynote-pink)', label: 'Soft Pink' },
                      { color: 'var(--stickynote-coral)', label: 'Soft Coral' },
                      { color: 'var(--stickynote-peach)', label: 'Soft Peach' },
                      { color: 'var(--stickynote-white)', label: 'White' },
                      { color: 'var(--stickynote-gray)', label: 'Soft Gray' }
                    ].map((colorOption, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleColorChange(colorOption.color);
                        }}
                        className="w-4 h-4 rounded-full border-2 hover:scale-110 hover:border-accent-primary transition-transform"
                        style={{ 
                          backgroundColor: colorOption.color, 
                          border: colorOption.color === 'var(--stickynote-white)' ? '1px solid var(--border-default)' : '2px solid transparent'
                        }}
                        title={colorOption.label}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Shapes & Drawing Tools - Combined cluster */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <ShapesDropdown onToolSelect={handleToolClick} />
          </div>
          
          {drawingTools.map(tool => {
            const IconComponent = tool.icon;
            const isActive = selectedTool === tool.id;
            return (
              <Button
                key={tool.id}
                variant={isActive ? "primary" : "ghost"}
                size="icon"
                onClick={() => handleToolClick(tool.id)}
                className="h-9 w-9"
                title={tool.name}
                aria-label={tool.name}
              >
                <IconComponent size={16} />
              </Button>
            );
          })}
        </div>

        {/* Connection Tools */}
        <div className="flex items-center gap-1">
          <ConnectorDropdown onToolSelect={handleToolClick} />
        </div>

        {/* Action Tools & Zoom - Combined right cluster */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            title={canUndo ? "Undo" : "Nothing to undo"}
            aria-label="Undo"
            className="h-9 w-9"
          >
            <Undo2 size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            title={canRedo ? "Redo" : "Nothing to redo"}
            aria-label="Redo"
            className="h-9 w-9"
          >
            <Redo2 size={16} />
          </Button>
          
          {selectedElementId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteSelected}
              title="Delete Selected Element (Delete/Backspace)"
              aria-label="Delete Selected Element"
              className="h-9 w-9"
            >
              <Trash2 size={16} />
            </Button>
          )}
          
          <div className="w-px h-5 bg-border-subtle mx-1" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            disabled={currentZoom <= 10}
            title="Zoom Out (Ctrl + -)"
            aria-label="Zoom Out"
            className="h-9 w-9"
          >
            <ZoomOut size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={resetZoom}
            title="Reset to 100% (Ctrl + 0)"
            aria-label="Reset Zoom"
            className="h-9 w-9 min-w-[45px] text-xs font-medium"
          >
            {currentZoom}%
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            disabled={currentZoom >= 1000}
            title="Zoom In (Ctrl + +)"
            aria-label="Zoom In"
            className="h-9 w-9"
          >
            <ZoomIn size={16} />
          </Button>
        </div>

        {/* Group/Ungroup Tools - Only show when needed */}
        {(canGroup || canUngroup) && (
          <div className="flex items-center gap-1">
            <div className="w-px h-5 bg-border-subtle mx-1" />
            {canGroup && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGroupElements}
                title="Group Elements"
                aria-label="Group Elements"
                className="h-9 w-9"
              >
                <Group size={16} />
              </Button>
            )}
            
            {canUngroup && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUngroupElements}
                title="Ungroup Elements"
                aria-label="Ungroup Elements"
                className="h-9 w-9"
              >
                <Ungroup size={16} />
              </Button>
            )}
          </div>
        )}
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