// Modern Bottom-Center Floating Toolbar (FigJam-style)
import React, { useState } from 'react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';

import { ElementId } from '../types/enhanced.types';

import { 
  MousePointer2, 
  Type, 
  StickyNote, 
  Trash2,
  Undo2,
  Redo2,
  Hand,
  Table,
  Group,
  Ungroup,
  Highlighter,
  Eraser,
  Edit3,
  Brush,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  X
} from 'lucide-react';
import ShapesDropdown from './ShapesDropdown';
import ConnectorDropdown from './ConnectorDropdown';
import { Button } from '../../../components/ui';
import { ColorSwatch } from '../../../components/ui/ColorSwatch';
import { resolveCSSVariable } from '../utils/colorUtils';

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



interface ModernKonvaToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
}

const ModernKonvaToolbar: React.FC<ModernKonvaToolbarProps> = ({
  onUndo,
  onRedo
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [focusedToolIndex, setFocusedToolIndex] = useState(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Direct store access without useShallow to test
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  
  // Debug: Log when selectedTool changes (dev-only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ [Toolbar] Selected tool changed to:', selectedTool);
    }
  }, [selectedTool]);
  const selectedElementIds = useUnifiedCanvasStore(state => state.selectedElementIds);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  const deleteElement = useUnifiedCanvasStore(state => state.deleteElement);
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const setStickyNoteColor = useUnifiedCanvasStore(state => state.setStickyNoteColor);
  const stickyNoteColor = useUnifiedCanvasStore(state => state.selectedStickyNoteColor);
  const canUndo = useUnifiedCanvasStore(state => state.canUndo);
  const canRedo = useUnifiedCanvasStore(state => state.canRedo);
  const viewport = useUnifiedCanvasStore(state => state.viewport);
  const setViewport = useUnifiedCanvasStore(state => state.setViewport);

  // STABLE: Use useMemo to prevent recalculation on every render with null safety
  const selectedElementId = React.useMemo(() => {
    if (!selectedElementIds || selectedElementIds.size === 0) return null;
    return Array.from(selectedElementIds)[0] as ElementId;
  }, [selectedElementIds?.size]); // Only depend on size, not the Set itself
  
  // STABLE: Use selector with stable dependency
  const selectedElement = useUnifiedCanvasStore(state => 
    selectedElementId ? state.elements.get(selectedElementId) || null : null
  );

  // Create flattened tool array for keyboard navigation
  const allTools = React.useMemo(() => [
    ...basicTools,
    ...contentTools,
    ...drawingTools,
    { id: 'undo', name: 'Undo', icon: Undo2 },
    { id: 'redo', name: 'Redo', icon: Redo2 },
  ], []);

  // Handler functions (moved before handleKeyDown to avoid TDZ)
  const handleToolClick = (toolId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ [Toolbar] Tool clicked:', toolId);
    }
    
    // Special handling for image tool
    if (toolId === 'image') {
      fileInputRef.current?.click();
      return;
    }
    
    // Set the tool directly
    setSelectedTool(toolId);
    console.log('🛠️ [Toolbar] Selected tool set to:', toolId);
    
    // Announce tool change for screen readers
    const toolName = allTools.find(t => t.id === toolId)?.name || toolId;
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-9999px';
    announcement.textContent = `${toolName} tool selected`;
    document.body.appendChild(announcement);
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
    
    // Hide color picker when switching tools
    if (showColorPicker) {
      setShowColorPicker(false);
    }
  };


  // Keyboard navigation handler
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const direction = e.key === 'ArrowRight' ? 1 : -1;
      const newIndex = (focusedToolIndex + direction + allTools.length) % allTools.length;
      setFocusedToolIndex(newIndex);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const tool = allTools[focusedToolIndex];
      if (tool) {
        if (tool.id === 'undo') onUndo();
        else if (tool.id === 'redo') onRedo();
        else handleToolClick(tool.id);
      }
    }
  }, [focusedToolIndex, allTools, onUndo, onRedo, handleToolClick]);

  // Focus management
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const currentButton = toolbarRef.current?.querySelector(`[data-tool-index="${focusedToolIndex}"]`) as HTMLElement;
    currentButton?.focus();
  }, [focusedToolIndex]);

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

  const groupElements = () => {
    const selectedIds = Array.from(selectedElementIds);
    if (selectedIds.length >= 2) {
      const groupId = useUnifiedCanvasStore.getState().groupElements(selectedIds);
      return groupId;
    }
    return null;
  };
  const ungroupElements = () => {
    const selectedIds = Array.from(selectedElementIds);
    if (selectedIds.length === 1) {
      const elementId = selectedIds[0];
      const groupId = useUnifiedCanvasStore.getState().isElementInGroup(elementId); // Get the groupId
      if (groupId) {
        useUnifiedCanvasStore.getState().ungroupElements(groupId); // Pass the groupId
      }
    }
  };
  const isElementInGroup = () => {
    const selectedIds = Array.from(selectedElementIds);
    if (selectedIds.length === 1) {
      const elementId = selectedIds[0];
      return useUnifiedCanvasStore.getState().isElementInGroup(elementId);
    }
    return false;
  };

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
      const groupId = groupElements();
      if (groupId) {
        // Selection will be handled by the store
      }
    }
  };

  const handleUngroupElements = () => {
    if (selectedElementId) {
      const groupId = useUnifiedCanvasStore.getState().isElementInGroup(selectedElementId); // Get the groupId
      if (groupId) {
        useUnifiedCanvasStore.getState().ungroupElements(groupId); // Pass the groupId
      }
    }
  };



  const handleColorChange = (color: string) => {
    // Resolve CSS variable to actual color value
    const resolvedColor = resolveCSSVariable(color);
    
    console.log('🎨 [Toolbar] Setting sticky note color:', resolvedColor);
    
    // Set default sticky note color for future elements
    setStickyNoteColor(resolvedColor);
    
    // If an element is selected, update its color
    if (selectedElementId && selectedElement) {
      const colorProperty = selectedElement.type === 'sticky-note' ? 'backgroundColor' : 'fill';
      updateElement(selectedElementId, { [colorProperty]: resolvedColor });
    }
  };
  

  
  // Check if current selection can be grouped/ungrouped with null safety
  const canGroup = selectedElementIds && selectedElementIds.size >= 2;
  const canUngroup = selectedElementId ? !!isElementInGroup() : false;

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
            selectElement(imageElement.id as ElementId, false);
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
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[1000] flex justify-center">
      <div 
        ref={toolbarRef}
        className="pointer-events-auto flex max-w-[95vw] items-center justify-center gap-3 overflow-visible"
        onKeyDown={handleKeyDown}
        role="toolbar"
        aria-label="Canvas tools"
        tabIndex={0}
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-card)'
        }}>
        {/* Basic Tools */}
        <div className="flex items-center gap-1">
          {basicTools.map((tool, index) => {
            const IconComponent = tool.icon;
            const isActive = selectedTool === tool.id;
            const toolIndex = allTools.findIndex(t => t.id === tool.id);
            const isFocused = focusedToolIndex === toolIndex;
            return (
              <Button
                key={tool.id}
                variant={isActive ? "primary" : "ghost"}
                size="icon"
                onClick={() => handleToolClick(tool.id)}
                className={`size-9 ${isActive ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-primary shadow-lg' : ''}`}
                title={tool.name}
                aria-label={`${tool.name}${isActive ? ' (active)' : ''}`}
                tabIndex={isFocused ? 0 : -1}
                data-tool-index={toolIndex}
                aria-pressed={isActive}
              >
                <IconComponent size={16} />
              </Button>
            );
          })}
        </div>

        {/* Content Tools */}
        <div className="flex items-center gap-1">
          {contentTools.map((tool, index) => {
            const IconComponent = tool.icon;
            const isActive = selectedTool === tool.id;
            const toolIndex = allTools.findIndex(t => t.id === tool.id);
            const isFocused = focusedToolIndex === toolIndex;
            return (
              <div key={tool.id} className="relative">
                <Button
                  variant={isActive ? "primary" : "ghost"}
                  size="icon"
                  onClick={() => handleToolClick(tool.id)}
                  className={`size-9 relative ${isActive ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-primary shadow-lg' : ''}`}
                  title={tool.name}
                  aria-label={`${tool.name}${isActive ? ' (active)' : ''}`}
                  tabIndex={isFocused ? 0 : -1}
                  data-tool-index={toolIndex}
                  aria-pressed={isActive}
                >
                  <IconComponent size={16} />
                  {tool.id === 'sticky-note' && stickyNoteColor && (
                    <div 
                      className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-white"
                      style={{ backgroundColor: stickyNoteColor }}
                    />
                  )}
                </Button>
                
                {/* Color picker for sticky note tool when active */}
                {tool.id === 'sticky-note' && isActive && (
                  <div className="bg-bg-elevated border-border-default absolute bottom-full left-1/2 z-[1200] mb-2 min-w-max -translate-x-1/2 rounded-xl border p-4 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-3">
                    {[
                      { color: '#FFE299', label: 'Yellow' },
                      { color: '#BAFFC9', label: 'Green' },
                      { color: '#A8DAFF', label: 'Blue' },
                      { color: '#E6BAFF', label: 'Violet' },
                      { color: '#FFB3BA', label: 'Pink' },
                      { color: '#FFDFBA', label: 'Coral' }
                    ].map((colorOption, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleColorChange(colorOption.color);
                        }}
                        className="focus:ring-accent-primary focus:ring-offset-elevated rounded-full border-2 border-transparent transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 motion-safe:hover:scale-110"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: colorOption.color,
                          borderRadius: '50%',
                          minWidth: '32px',
                          minHeight: '32px',
                          maxWidth: '32px',
                          maxHeight: '32px',
                          border: colorOption.color === stickyNoteColor ? '3px solid #6366f1' : '2px solid transparent'
                        }}
                        title={colorOption.label}
                        aria-label={`Select ${colorOption.label}`}
                      />
                    ))}
                    </div>
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
          
          {drawingTools.map((tool, index) => {
            const IconComponent = tool.icon;
            const isActive = selectedTool === tool.id;
            const toolIndex = allTools.findIndex(t => t.id === tool.id);
            const isFocused = focusedToolIndex === toolIndex;
            return (
              <Button
                key={tool.id}
                variant={isActive ? "primary" : "ghost"}
                size="icon"
                onClick={() => handleToolClick(tool.id)}
                className={`size-9 ${isActive ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-primary shadow-lg' : ''}`}
                title={tool.name}
                aria-label={`${tool.name}${isActive ? ' (active)' : ''}`}
                tabIndex={isFocused ? 0 : -1}
                data-tool-index={toolIndex}
                aria-pressed={isActive}
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
            aria-label={canUndo ? "Undo" : "Nothing to undo"}
            className="size-9"
            tabIndex={focusedToolIndex === allTools.findIndex(t => t.id === 'undo') ? 0 : -1}
            data-tool-index={allTools.findIndex(t => t.id === 'undo')}
          >
            <Undo2 size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            title={canRedo ? "Redo" : "Nothing to redo"}
            aria-label={canRedo ? "Redo" : "Nothing to redo"}
            className="size-9"
            tabIndex={focusedToolIndex === allTools.findIndex(t => t.id === 'redo') ? 0 : -1}
            data-tool-index={allTools.findIndex(t => t.id === 'redo')}
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
              className="size-9"
            >
              <Trash2 size={16} />
            </Button>
          )}
          
          <div className="bg-border-subtle mx-1 h-5 w-px" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            disabled={currentZoom <= 10}
            title="Zoom Out (Ctrl + -)"
            aria-label="Zoom Out"
            className="size-9"
          >
            <ZoomOut size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={resetZoom}
            title="Reset to 100% (Ctrl + 0)"
            aria-label="Reset Zoom"
            className="size-9 min-w-[45px] text-[11px] font-medium"
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
            className="size-9"
          >
            <ZoomIn size={16} />
          </Button>
        </div>

        {/* Group/Ungroup Tools - Only show when needed */}
        {(canGroup || canUngroup) && (
          <div className="flex items-center gap-1">
            <div className="bg-border-subtle mx-1 h-5 w-px" />
            {canGroup && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGroupElements}
                title="Group Elements"
                aria-label="Group Elements"
                className="size-9"
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
                className="size-9"
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
        id="canvas-image-input"
        name="canvas-images"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        style={{ display: 'none' }}
        aria-label="Canvas image upload"
      />
    </div>
  );
};

export default ModernKonvaToolbar;