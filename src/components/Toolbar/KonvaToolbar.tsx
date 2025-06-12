// src/components/Toolbar/KonvaToolbar.tsx
import React from 'react';
import Konva from 'konva'; // Import Konva for Stage type if needed by zoom functions
import { useKonvaCanvasStore } from '../../stores/konvaCanvasStore';
import { useTauriCanvas } from '../../hooks/useTauriCanvas';
import { getStickyNoteColors } from '../../styles/designSystem';
import { 
  MousePointer2, 
  Type, 
  StickyNote, 
  Square, 
  Circle, 
  Minus, 
  Pen, 
  Triangle, 
  Star,
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
  RotateCw,
  ArrowRight,
  Image,
  Palette,
  Hand
} from 'lucide-react';
import './KonvaToolbar.css';
import ColorPicker from '../Canvas/ColorPicker';

const tools = [
  { id: 'select', name: 'Select', icon: MousePointer2 },
  { id: 'pan', name: 'Pan', icon: Hand },
  { id: 'text', name: 'Text', icon: Type },
  { id: 'sticky-note', name: 'Sticky Note', icon: StickyNote },
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'line', name: 'Line', icon: Minus },
  { id: 'arrow', name: 'Arrow', icon: ArrowRight },
  { id: 'triangle', name: 'Triangle', icon: Triangle },
  { id: 'star', name: 'Star', icon: Star },
  { id: 'pen', name: 'Pen', icon: Pen },
  { id: 'image', name: 'Image', icon: Image },
  { id: 'connect', name: 'Connect', icon: Zap }
];

interface KonvaToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onZoomToFit: () => void;
  stageRef?: React.RefObject<Konva.Stage>; // Optional: if zoom functions need direct stage access here
  elements?: any[]; // Optional: if zoomToFit needs elements directly here
}

const KonvaToolbar: React.FC<KonvaToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onZoomToFit
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
            text: 'Click to edit',
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
          
        case 'line':
          newElement = {
            id: generateId(),
            type: 'line',
            x: centerX - 75,
            y: centerY,
            points: [0, 0, 150, 0],
            stroke: '#1E293B',
            strokeWidth: 2,
            arrowStart: false,
            arrowEnd: false
          };
          break;
          
        case 'arrow':
          newElement = {
            id: generateId(),
            type: 'arrow',
            x: centerX - 75,
            y: centerY,
            points: [0, 0, 150, 0],
            stroke: '#1E293B',
            strokeWidth: 2,
            arrowStart: false,
            arrowEnd: true
          };
          break;
          
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
      }
      
      if (newElement) {
        addElement(newElement);
        setSelectedElement(newElement.id);
        
        // After creating element, switch to select tool immediately
        setSelectedTool('select');
      }
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
      {/* Drawing Tools */}
      <div className="konva-toolbar-group">
        {tools.map(tool => {
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
              {isActive && (
                <span className="tool-label">{tool.name}</span>
              )}
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
          <span>Zoom In</span>
        </button>
        <button
          onClick={handleZoomOut}
          className="konva-toolbar-action-btn"
          title="Zoom Out (-)"
        >
          <ZoomOut size={16} />
          <span>Zoom Out</span>
        </button>
        <button
          onClick={handleResetZoom}
          className="konva-toolbar-action-btn"
          title="Reset Zoom (0)"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          onClick={handleZoomToFit}
          className="konva-toolbar-action-btn"
          title="Zoom to Fit Content (F)"
        >
          <Maximize size={16} />
          <span>Fit</span>
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
          <span>Undo</span>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className={`konva-toolbar-action-btn ${!canRedo() ? 'disabled' : ''}`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
          <span>Redo</span>
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
          <span>Delete</span>
        </button>
        
        {/* Clear Canvas */}
        <button
          onClick={clearCanvas}
          className="konva-toolbar-action-btn danger"
          title="Clear all elements from canvas"
        >
          <RotateCcw size={16} />
          <span>Clear</span>
        </button>
        
        {/* Export */}
        <button
          onClick={exportCanvasData}
          className="konva-toolbar-action-btn primary"
          title="Export canvas as JSON"
        >
          <Download size={16} />
          <span>Export</span>
        </button>
        
        {/* Save to File */}
        <button
          onClick={() => saveToFile('canvas-save.json')}
          className="konva-toolbar-action-btn secondary"
          title="Save canvas to file"
        >
          <Save size={16} />
          <span>Save</span>
        </button>
        
        {/* Load from File */}
        <button
          onClick={() => loadFromFile('canvas-save.json')}
          className="konva-toolbar-action-btn secondary"
          title="Load canvas from file"
        >
          <FolderOpen size={16} />
          <span>Load</span>
        </button>
        
        {/* Import */}
        <label
          className="konva-toolbar-action-btn secondary"
          title="Import canvas from JSON file"
          style={{ cursor: 'pointer' }}
        >
          <Upload size={16} />
          <span>Import</span>
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
