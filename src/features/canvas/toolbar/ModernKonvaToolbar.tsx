// Modern Bottom-Center Floating Toolbar (FigJam-style)
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';

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
  ZoomOut
, Maximize2 } from 'lucide-react';
import ShapesDropdown from './ShapesDropdown';
import ConnectorDropdown from './ConnectorDropdown';
import { Button } from '../../../components/ui';
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Direct store access without useShallow to test
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  const selectedElementIds = useUnifiedCanvasStore(state => state.selectedElementIds);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  const deleteElement = useUnifiedCanvasStore(state => state.deleteElement);
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const setSelectedStickyNoteColor = useUnifiedCanvasStore(state => state.setSelectedStickyNoteColor);
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
    setViewport({ scale: 1, x: 0, y: 0 });
  };

  const zoomToFit = () => {
    try { useUnifiedCanvasStore.getState().zoomToFit?.(40); } catch {}
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

  const handleToolClick = (toolId: string) => {
    // When sticky-note tool is toggled active, also ensure any canvas previews don't capture clicks
    try { (window as any).__disableCanvasPointerEventsDuringToolbarPopover = toolId === 'sticky-note'; } catch {}

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
    // Resolve CSS variable to actual color value
    const resolvedColor = resolveCSSVariable(color);
    
    // Set default sticky note color for future elements
    setSelectedStickyNoteColor(resolvedColor);
    
    // If an element is selected, update its color
    if (selectedElementId && selectedElement) {
      const colorProperty = selectedElement.type === 'sticky-note' ? 'backgroundColor' : 'fill';
      updateElement(selectedElementId, { [colorProperty]: resolvedColor });
    }
  };
  

  
  // Check if current selection can be grouped/ungrouped
  const canGroup = selectedElementIds.size >= 2;
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
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[999999] flex justify-center">
      <div className="pointer-events-auto flex max-w-[95vw] items-center justify-center gap-3 overflow-visible"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-card)'
        }}>
        {/* Basic Tools */}
        <div className="flex items-center gap-1">
          {basicTools.map(tool => {
            const IconComponent = tool.icon;
            const isActive = selectedTool === tool.id;
            return (
              <div key={tool.id} className="relative">
                <Button
                  variant={isActive ? "primary" : "ghost"}
                  size="icon"
                  onClick={() => handleToolClick(tool.id)}
                  className="size-9"
                  title={tool.name}
                  aria-label={tool.name}
                >
                  <IconComponent size={16} />
                </Button>
                {isActive && (
                  <div
                    className="absolute left-1/2 -bottom-1 h-0.5 w-4 -translate-x-1/2 rounded"
                    style={{ background: 'var(--accent-primary)' }}
                    aria-hidden="true"
                  />
                )}
              </div>
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
                  className="size-9"
                  title={tool.name}
                  aria-label={tool.name}
                >
                  <IconComponent size={16} />
                </Button>
                {isActive && (
                  <div
                    className="absolute left-1/2 -bottom-1 h-0.5 w-4 -translate-x-1/2 rounded"
                    style={{ background: 'var(--accent-primary)' }}
                    aria-hidden="true"
                  />
                )}
                
              </div>
            );
          })}
        </div>

        {/* Portal color picker rendered outside canvas */}
        {(selectedTool === 'sticky-note' || selectedElement?.type === 'sticky-note') && createPortal(
          <div 
            style={{
              position: 'fixed',
              bottom: '120px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2147483647,
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {['#FEF3C7','#FEE2E2','#FED7AA','#FEF08A','#D1FAE5','#DBEAFE','#E9D5FF','#FCE7F3'].map((color) => {
              const store = useUnifiedCanvasStore.getState();
              const currentColor = selectedElement?.type === 'sticky-note' 
                ? selectedElement.backgroundColor 
                : (store as any).selectedStickyNoteColor || '#FEF3C7';
              const isSelected = currentColor === color;
              
              return (
                <button
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorChange(color);
                  }}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '14px',
                    border: isSelected ? '3px solid var(--accent-primary)' : '2px solid var(--border-default)',
                    backgroundColor: color,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                  }}
                  title={color}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                    }
                  }}
                />
              );
            })}
          </div>,
          document.body
        )}

        {/* Shapes & Drawing Tools - Combined cluster */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <ShapesDropdown onToolSelect={handleToolClick} />
          </div>
          
          {drawingTools.map(tool => {
            const IconComponent = tool.icon;
            const isActive = selectedTool === tool.id;
            return (
              <div key={tool.id} className="relative">
                <Button
                  variant={isActive ? "primary" : "ghost"}
                  size="icon"
                  onClick={() => handleToolClick(tool.id)}
                  className="size-9"
                  title={tool.name}
                  aria-label={tool.name}
                >
                  <IconComponent size={16} />
                </Button>
                {isActive && (
                  <div
                    className="absolute left-1/2 -bottom-1 h-0.5 w-4 -translate-x-1/2 rounded"
                    style={{ background: 'var(--accent-primary)' }}
                    aria-hidden="true"
                  />
                )}
              </div>
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
            className="size-9"
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
            className="size-9"
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

          <Button
            variant="ghost"
            size="icon"
            onClick={zoomToFit}
            title="Zoom to Fit"
            aria-label="Zoom to Fit"
            className="size-9"
          >
            <Maximize2 size={16} />
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