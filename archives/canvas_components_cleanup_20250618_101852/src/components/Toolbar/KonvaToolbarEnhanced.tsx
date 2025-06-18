// src/features/canvas/components/toolbar/KonvaToolbar.tsx
import React from 'react';
import { useKonvaCanvasStore } from '../../features/canvas/stores/konvaCanvasStore';
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
  RotateCw
} from 'lucide-react';
import './KonvaToolbar.css';

const tools = [
  { id: 'select', name: 'Select', icon: MousePointer2 },
  { id: 'text', name: 'Text', icon: Type },
  { id: 'sticky-note', name: 'Sticky Note', icon: StickyNote },
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'line', name: 'Line', icon: Minus },
  { id: 'triangle', name: 'Triangle', icon: Triangle },
  { id: 'star', name: 'Star', icon: Star },
  { id: 'pen', name: 'Pen', icon: Pen },
  { id: 'connect', name: 'Connect', icon: Zap }
];

const KonvaToolbar: React.FC = () => {
  // Fixed: Use specific selectors to prevent infinite re-renders
  const selectedTool = useKonvaCanvasStore(state => state.selectedTool);
  const setSelectedTool = useKonvaCanvasStore(state => state.setSelectedTool);
  const clearCanvas = useKonvaCanvasStore(state => state.clearCanvas);
  const exportCanvas = useKonvaCanvasStore(state => state.exportCanvas);
  const importCanvas = useKonvaCanvasStore(state => state.importCanvas);
  const selectedElementId = useKonvaCanvasStore(state => state.selectedElementId);
  const deleteElement = useKonvaCanvasStore(state => state.deleteElement);
  const undo = useKonvaCanvasStore(state => state.undo);
  const redo = useKonvaCanvasStore(state => state.redo);
  const canUndo = useKonvaCanvasStore(state => state.canUndo);
  const canRedo = useKonvaCanvasStore(state => state.canRedo);
  
  const { saveToFile, loadFromFile } = useTauriCanvas();

  const handleDeleteSelected = () => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
    }
  };

  // Zoom control functions - these will be exposed globally for keyboard shortcuts
  const handleResetZoom = () => {
    (window as any).resetZoom?.();
  };

  const handleZoomToFit = () => {
    (window as any).zoomToFit?.();
  };

  const handleZoomIn = () => {
    (window as any).zoomIn?.();
  };

  const handleZoomOut = () => {
    (window as any).zoomOut?.();
  };

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
  };

  const handleToolClick = (toolId: string) => {
    console.log('🔧 Tool selected:', toolId);
    setSelectedTool(toolId);
    
    // Create element immediately when non-select and non-connect tool is clicked
    if (toolId !== 'select' && toolId !== 'connect') {
      console.log('🚀 Creating element for tool:', toolId);
      const { addElement, setSelectedElement } = useKonvaCanvasStore.getState();
      
      // Create element at center of canvas
      const centerPosition = { x: 400, y: 300 };
      
      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newElement: any = {
        id: generateId(),
        type: toolId,
        x: centerPosition.x,
        y: centerPosition.y,
        fill: '#3B82F6',
        stroke: '#1E40AF',
        strokeWidth: 2
      };

      // Set default properties based on tool type
      switch (toolId) {
        case 'text':
          newElement.text = 'Double-click to edit';
          newElement.width = 150;
          newElement.height = 25;
          break;
        case 'sticky-note':
          const stickyColors = getStickyNoteColors('yellow');
          newElement.text = 'Double-click to edit';
          newElement.width = 150;
          newElement.height = 100;
          newElement.backgroundColor = stickyColors.fill;
          newElement.stroke = stickyColors.stroke;
          newElement.textColor = '#333333';
          break;
        case 'rectangle':
          newElement.width = 100;
          newElement.height = 80;
          break;
        case 'circle':
          newElement.radius = 50;
          break;
        case 'line':
          newElement.points = [0, 0, 100, 0];
          break;
        case 'triangle':
          newElement.radius = 50;
          break;
        case 'star':
          newElement.radius = 50;
          newElement.innerRadius = 25;
          newElement.sides = 5;
          break;
        case 'pen':
          // Pen tool doesn't create immediate elements
          return;
      }
      
      addElement(newElement);
      setSelectedElement(newElement.id);
      console.log('✅ Element created directly from toolbar:', newElement);
    }
  };

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

      {/* History Controls */}
      <div className="konva-toolbar-action-group">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className={`konva-toolbar-action-btn secondary ${!canUndo() ? 'disabled' : ''}`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
          <span>Undo</span>
        </button>
        
        <button
          onClick={redo}
          disabled={!canRedo()}
          className={`konva-toolbar-action-btn secondary ${!canRedo() ? 'disabled' : ''}`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
          <span>Redo</span>
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="konva-toolbar-action-group">
        <button
          onClick={handleZoomIn}
          className="konva-toolbar-action-btn secondary"
          title="Zoom In (Ctrl++)"
        >
          <ZoomIn size={16} />
          <span>Zoom In</span>
        </button>

        <button
          onClick={handleZoomOut}
          className="konva-toolbar-action-btn secondary"
          title="Zoom Out (Ctrl+-)"
        >
          <ZoomOut size={16} />
          <span>Zoom Out</span>
        </button>
        
        <button
          onClick={handleResetZoom}
          className="konva-toolbar-action-btn secondary"
          title="Reset Zoom (Ctrl+0)"
        >
          <RotateCw size={16} />
          <span>Reset</span>
        </button>
        
        <button
          onClick={handleZoomToFit}
          className="konva-toolbar-action-btn secondary"
          title="Fit to Screen (Ctrl+1)"
        >
          <Maximize size={16} />
          <span>Fit</span>
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
