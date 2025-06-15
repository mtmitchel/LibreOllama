// src/components/Toolbar/KonvaToolbar.tsx
import React from 'react';
import Konva from 'konva'; // Import Konva for Stage type if needed by zoom functions
import { useKonvaCanvasStore } from '../../stores/konvaCanvasStore';
import { useTauriCanvas } from '../../hooks/useTauriCanvas';
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
  Zap,
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
  ChevronRight
} from 'lucide-react';
import './KonvaToolbar.css';
import ColorPicker from '../canvas/ColorPicker';
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

// Shape tools are now handled by ShapesDropdown component
const shapeToolIds = ['rectangle', 'circle', 'connector-line', 'connector-arrow', 'triangle', 'star'];

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
  const { 
    selectedTool, 
    setSelectedTool, 
    clearCanvas, 
    exportCanvas, 
    importCanvas, 
    selectedElementId, 
    deleteElement,
    undo,
    redo,
    canUndo,
    canRedo,
    elements,
    updateElement
  } = useKonvaCanvasStore();
  
  const selectedElement = selectedElementId ? elements[selectedElementId] : null;
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
    const elements = exportCanvas();
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
          importCanvas(elements);
        } catch (error) {
          console.error('Error importing canvas:', error);
        }
      };
      reader.readAsText(file);
    }
  };  const handleToolClick = (toolId: string) => {
    console.log('🔧 Tool selected:', toolId);
    setSelectedTool(toolId);
    
    // For drawing tools (not select/connect), create element immediately
    if (toolId !== 'select' && toolId !== 'connect' && toolId !== 'pan') {
      createElementForTool(toolId);
    }
  };
  
  const createElementForTool = (toolId: string) => {
    const { addElement, setSelectedElement } = useKonvaCanvasStore.getState();
    const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate center position of visible canvas area
    const centerX = 400;
    const centerY = 300;
    
    let newElement: any = null;
    
    switch (toolId) {
      case 'text':
        newElement = {
          id: generateId(),
          type: 'text',
          x: centerX,
          y: centerY,
          text: '', // Empty text for FigJam-style placeholder behavior
          fontSize: 18,
          fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
          fill: '#1E293B',
          width: 200
        };
        break;
          
        case 'sticky-note':
          newElement = {
            id: generateId(),
            type: 'sticky-note',
            x: centerX - 75,
            y: centerY - 50,
            width: 150,
            height: 100,
            text: 'New note',
            backgroundColor: '#FFEB3B',
            textColor: '#1E293B',
            fontSize: 14,
            fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif"
          };
          break;
          
        case 'rectangle':
          newElement = {
            id: generateId(),
            type: 'rectangle',
            x: centerX - 75,
            y: centerY - 50,
            width: 150,
            height: 100,
            fill: '#DBEAFE',
            stroke: '#3B82F6',
            strokeWidth: 2
          };
          break;
          
        case 'circle':
          newElement = {
            id: generateId(),
            type: 'circle',
            x: centerX,
            y: centerY,
            radius: 60,
            fill: '#DCFCE7',
            stroke: '#22C55E',
            strokeWidth: 2
          };
          break;
          
        case 'connector-line':
        case 'connector-arrow':
          // Connector tools don't create elements immediately
          // They activate the drawing mode instead
          return;
          
        case 'image':
          // For image tool, trigger file input
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                const img = new window.Image();
                img.onload = () => {
                  const imageElement = {
                    id: generateId(),
                    type: 'image' as const,
                    x: centerX - img.width / 4,
                    y: centerY - img.height / 4,
                    width: img.width / 2,
                    height: img.height / 2,
                    imageUrl
                  };
                  addElement(imageElement);
                  setSelectedElement(imageElement.id);
                  setTimeout(() => setSelectedTool('select'), 100);
                };
                img.src = imageUrl;
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
          return; // Don't continue with normal element creation
          break;
          
        case 'triangle':
          newElement = {
            id: generateId(),
            type: 'triangle',
            x: centerX,
            y: centerY,
            width: 100,
            height: 80,
            fill: '#FEF3C7',
            stroke: '#F59E0B',
            strokeWidth: 2
          };
          break;
          
        case 'star':
          newElement = {
            id: generateId(),
            type: 'star',
            x: centerX,
            y: centerY,
            numPoints: 5,
            innerRadius: 30,
            radius: 60,
            fill: '#E1BEE7',
            stroke: '#9C27B0',
            strokeWidth: 2
          };
          break;
          
        case 'section':
          // Section tool activates drawing mode, doesn't create element immediately
          return;
          
        case 'table':
          // Use the enhanced table creation method
          const { createEnhancedTable } = useKonvaCanvasStore.getState();
          const tableId = createEnhancedTable(centerX - 180, centerY - 75, 3, 3);
          setSelectedElement(tableId);
          return;
      }
      
      if (newElement) {
        addElement(newElement);
        setSelectedElement(newElement.id);
        
        // For text elements, immediately enter edit mode for FigJam-style behavior
        if (newElement.type === 'text') {
          const { setEditingTextId } = useKonvaCanvasStore.getState();
          setEditingTextId(newElement.id);
        }
        
        // After creating element, switch to select tool immediately
        setTimeout(() => setSelectedTool('select'), 100);
      }
  };
  
  const handleColorChange = (color: string, type: 'fill' | 'stroke' | 'backgroundColor') => {
    if (!selectedElementId) return;
    
    updateElement(selectedElementId, { [type]: color });
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
            selectedColor={selectedElement?.fill || selectedElement?.backgroundColor}
            onColorChange={(color) => handleColorChange(color, 
              selectedElement?.type === 'sticky-note' ? 'backgroundColor' : 'fill'
            )}
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
        
        {/* Clear Canvas */}
        <button
          onClick={clearCanvas}
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
      </div>
    </div>
  );
};

export default KonvaToolbar;
