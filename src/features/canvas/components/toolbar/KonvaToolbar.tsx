// src/features/canvas/components/toolbar/KonvaToolbar.tsx
import React from 'react';
import { useCanvasStore } from '../../../../stores';
import { useTauriCanvas } from '../../hooks/useTauriCanvas';
import { ElementId } from '../../types/enhanced.types';
import { 
  MousePointer2, 
  Type, 
  StickyNote, 
  Pen, 
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Save,
  FolderOpen,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Image,
  Hand,
  Layout,
  Table,
  ChevronLeft,
  ChevronRight,
  Group,
  Ungroup,
  Layers
} from 'lucide-react';
import '../../../../design-system/globals.css';
import ColorPicker from '../ColorPicker';
import ShapesDropdown from './ShapesDropdown';

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

interface KonvaToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onZoomToFit: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const KonvaToolbar: React.FC<KonvaToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onZoomToFit,
  sidebarOpen,
  onToggleSidebar
}) => {
  // Use enhanced store as single source of truth - split selectors to prevent infinite loop
  const elements = useCanvasStore((state) => state.elements);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const deleteElement = useCanvasStore((state) => state.deleteElement);
  const addElement = useCanvasStore((state) => state.addElement);
  const clearAllElements = useCanvasStore((state) => state.clearAllElements);
  const exportElements = useCanvasStore((state) => state.exportElements);
  const importElements = useCanvasStore((state) => state.importElements);
  const selectedTool = useCanvasStore((state) => state.selectedTool);
  const setSelectedTool = useCanvasStore((state) => state.setSelectedTool);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => state.canUndo);
  const canRedo = useCanvasStore((state) => state.canRedo);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const pan = useCanvasStore((state) => state.pan);
  const zoom = useCanvasStore((state) => state.zoom);
  const findSectionAtPoint = useCanvasStore((state) => state.findSectionAtPoint);
  const sections = useCanvasStore((state) => state.sections);
  const addElementToSection = useCanvasStore((state) => state.addElementToSection);
  const createSection = useCanvasStore((state) => state.createSection);
  const groupElements = useCanvasStore((state) => state.groupElements);
  const ungroupElements = useCanvasStore((state) => state.ungroupElements);
  const isElementInGroup = useCanvasStore((state) => state.isElementInGroup);
  const toggleLayersPanel = useCanvasStore((state) => state.toggleLayersPanel);
  
  const selectedElementId = selectedElementIds.size > 0 ? Array.from(selectedElementIds)[0] : null;
  const selectedElement = selectedElementId ? elements.get(selectedElementId) : null;
  const { saveToFile, loadFromFile } = useTauriCanvas();

  const handleDeleteSelected = () => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
    }
  };

  const handleZoomIn = () => onZoomIn();
  const handleZoomOut = () => onZoomOut();
  const handleResetZoom = () => onResetZoom();
  const handleZoomToFit = () => onZoomToFit();

  const exportCanvasData = () => {
    const elements = exportElements();
    const dataStr = JSON.stringify(elements, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'canvas-export.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  const importCanvasData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const elements = JSON.parse(e.target?.result as string);
          importElements(elements);
        } catch (error) {
          console.error('Error importing canvas:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleGroupElements = () => {
    const selectedIds = Array.from(selectedElementIds);
    if (selectedIds.length >= 2) {
      const groupId = groupElements(selectedIds);
      if (groupId) {
        // Select the newly created group
        selectElement(groupId);
      }
    }
  };

  const handleUngroupElements = () => {
    if (selectedElementId) {
      const groupId = isElementInGroup(selectedElementId);
      if (groupId) {
        const ungroupedIds = ungroupElements(groupId);
        // Select the ungrouped elements
        if (ungroupedIds.length > 0) {
          ungroupedIds.forEach((id, index) => {
            selectElement(id, index > 0); // Add to selection for all except first
          });
        }
      }
    }
  };

  // Check if current selection can be grouped/ungrouped
  const canGroup = selectedElementIds.size >= 2;
  const canUngroup = selectedElementId ? !!isElementInGroup(selectedElementId) : false;

  const handleToolClick = (toolId: string) => {
    // All tools now use drawing mode - click tool, then click canvas to create
    console.log('🔧 [TOOLBAR] Tool selected:', toolId);
    setSelectedTool(toolId);
    console.log('🔧 [TOOLBAR] setSelectedTool called with:', toolId);
    
    // Note: Removed immediate sticky note creation to use consistent click-to-place behavior
    // All elements are now created via CanvasEventHandler when user clicks on canvas
  };

  const handleColorChange = (color: string) => {
    if (!selectedElementId) return;
    
    const colorProperty = selectedElement?.type === 'sticky-note' ? 'backgroundColor' : 'fill';
    updateElement(selectedElementId, { [colorProperty]: color });
  };
  
  const canShowColorPicker = selectedElement && 
    ['rectangle', 'circle', 'triangle', 'star', 'sticky-note'].includes(selectedElement.type);
  
  return (
    <div className="konva-toolbar">
      {/* Sidebar Toggle Button */}
      <div className="konva-toolbar-group">
        <button
          onClick={onToggleSidebar}
          className="konva-toolbar-tool-btn"
          title={sidebarOpen ? "Collapse canvas list" : "Expand canvas list"}
          aria-label={sidebarOpen ? "Collapse canvas list" : "Expand canvas list"}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      
      {/* Basic Tools */}
      <div className="konva-toolbar-group">
        {basicTools.map(tool => {
          const IconComponent = tool.icon;
          const isActive = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`konva-toolbar-tool-btn ${isActive ? 'active' : ''}`}
              title={tool.name}
            >
              <IconComponent size={16} />
            </button>
          );
        })}
      </div>
      
      {/* Content Tools */}
      <div className="konva-toolbar-group">
        {contentTools.map(tool => {
          const IconComponent = tool.icon;
          const isActive = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`konva-toolbar-tool-btn ${isActive ? 'active' : ''}`}
              title={tool.name}
            >
              <IconComponent size={16} />
            </button>
          );
        })}
      </div>
      
      {/* Shapes Dropdown */}
      <div className="konva-toolbar-group">
        <ShapesDropdown onToolSelect={handleToolClick} />
      </div>
      
      {/* Drawing Tools */}
      <div className="konva-toolbar-group">
        {drawingTools.map(tool => {
          const IconComponent = tool.icon;
          const isActive = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`konva-toolbar-tool-btn ${isActive ? 'active' : ''}`}
              title={tool.name}
            >
              <IconComponent size={16} />
            </button>
          );
        })}
      </div>

      {/* Color Picker for Selected Elements */}
      {canShowColorPicker && (
        <div className="konva-toolbar-group">
          <ColorPicker
            {...((selectedElement && (
              ('fill' in selectedElement && selectedElement.fill) || 
              ('backgroundColor' in selectedElement && selectedElement.backgroundColor)
            ) && { 
              selectedColor: ('fill' in selectedElement && selectedElement.fill) || 
                           ('backgroundColor' in selectedElement && selectedElement.backgroundColor) || '#000000'
            }) || {})}
            onColorChange={handleColorChange}
            type={selectedElement?.type === 'sticky-note' ? 'sticky' : 'fill'}
          />
        </div>
      )}

      {/* Zoom Controls */}
      <div className="konva-toolbar-group konva-toolbar-zoom-controls">
        <button
          onClick={handleZoomIn}
          className="konva-toolbar-action-btn"
          title="Zoom In (+)"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          className="konva-toolbar-action-btn"
          title="Zoom Out (-)"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleResetZoom}
          className="konva-toolbar-action-btn"
          title="Reset Zoom (0)"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={handleZoomToFit}
          className="konva-toolbar-action-btn"
          title="Zoom to Fit Content (F)"
        >
          <Maximize size={16} />
        </button>
      </div>

      {/* Undo/Redo */}
      <div className="konva-toolbar-group">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className={`konva-toolbar-action-btn ${!canUndo() ? 'disabled' : ''}`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className={`konva-toolbar-action-btn ${!canRedo() ? 'disabled' : ''}`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="konva-toolbar-action-group">
        {/* Delete Selected */}
        <button
          onClick={handleDeleteSelected}
          disabled={!selectedElementId}
          className={`konva-toolbar-action-btn danger ${!selectedElementId ? 'disabled' : ''}`}
          title="Delete Selected (Del)"
        >
          <Trash2 size={16} />
        </button>
        
        {/* Group Elements */}
        <button
          onClick={handleGroupElements}
          disabled={!canGroup}
          className={`konva-toolbar-action-btn ${!canGroup ? 'disabled' : ''}`}
          title="Group Selected Elements (Ctrl+G)"
        >
          <Group size={16} />
        </button>
        
        {/* Ungroup Elements */}
        <button
          onClick={handleUngroupElements}
          disabled={!canUngroup}
          className={`konva-toolbar-action-btn ${!canUngroup ? 'disabled' : ''}`}
          title="Ungroup Selected Elements (Ctrl+Shift+G)"
        >
          <Ungroup size={16} />
        </button>
        
        {/* Clear Canvas */}
        <button
          onClick={clearAllElements}
          className="konva-toolbar-action-btn danger"
          title="Clear all elements from canvas"
        >
          <RotateCcw size={16} />
        </button>
        
        {/* Export */}
        <button
          onClick={exportCanvasData}
          className="konva-toolbar-action-btn primary"
          title="Export canvas as JSON"
        >
          <Download size={16} />
        </button>
        
        {/* Save to File */}
        <button
          onClick={() => saveToFile('canvas-save.json')}
          className="konva-toolbar-action-btn secondary"
          title="Save canvas to file"
        >
          <Save size={16} />
        </button>
        
        {/* Load from File */}
        <button
          onClick={() => loadFromFile('canvas-save.json')}
          className="konva-toolbar-action-btn secondary"
          title="Load canvas from file"
        >
          <FolderOpen size={16} />
        </button>
        
        {/* Import */}
        <label
          className="konva-toolbar-action-btn secondary"
          title="Import canvas from JSON file"
          style={{ cursor: 'pointer' }}
        >
          <Upload size={16} />
          <input
            type="file"
            accept=".json"
            onChange={importCanvasData}
            style={{ display: 'none' }}
          />
        </label>

        {/* Layers Panel Toggle */}
        <button
          onClick={toggleLayersPanel}
          className="konva-toolbar-action-btn"
          title="Toggle Layers Panel"
        >
          <Layers size={16} />
        </button>
      </div>
    </div>
  );
};

export default KonvaToolbar;
