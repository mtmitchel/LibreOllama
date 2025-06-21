// src/features/canvas/components/toolbar/KonvaToolbar.tsx
import React from 'react';
import { useCanvasStore as useEnhancedStore } from '../../stores/canvasStore.enhanced';
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
  ChevronRight
} from 'lucide-react';
import './KonvaToolbar.css';
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
  // Use enhanced store as single source of truth
  const { 
    elements, 
    updateElement, 
    deleteElement, 
    addElement, 
    clearAllElements, 
    exportElements, 
    importElements,
    selectedTool, 
    setSelectedTool,
    undo, 
    redo,    canUndo, 
    canRedo,
    selectedElementIds, 
    selectElement,
    pan, 
    zoom,
    findSectionAtPoint,
    sections,
    addElementToSection
  } = useEnhancedStore();
  
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
  };  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
      // Tools that activate drawing/interaction modes instead of creating elements immediately
    const drawingModeTools = [
      'select', 'pan', 'section', 
      'pen', 'connector-line', 'connector-arrow',
      'rectangle', 'circle', 'triangle', 'star' // Shape tools should activate, not create immediately
    ];
    
    // For most tools, create element immediately
    // Drawing mode tools just change the active tool state
    if (!drawingModeTools.includes(toolId)) {
      createElementForTool(toolId);
    }
  };

  const createElementForTool = (toolId: string) => {
    const generateId = (): ElementId => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ElementId;
    // Calculate center position of visible canvas area considering viewport
    // Calculate positioning for new elements - always use viewport center
    let elementX: number;
    let elementY: number;
    
    // Always use viewport center positioning - let users manually assign to sections
    const canvasElement = document.getElementById('canvas-container');
    const canvasRect = canvasElement?.getBoundingClientRect();
    const canvasWidth = canvasRect?.width || 800;
    const canvasHeight = canvasRect?.height || 600;
    
    // Calculate center of visible area in screen coordinates
    const screenCenterX = canvasWidth / 2;
    const screenCenterY = canvasHeight / 2;
    
    // Convert screen coordinates to world coordinates considering pan/zoom
    elementX = (screenCenterX - (pan?.x || 0)) / (zoom || 1);
    elementY = (screenCenterY - (pan?.y || 0)) / (zoom || 1);

    const targetSectionId = findSectionAtPoint && findSectionAtPoint({ x: elementX, y: elementY });
    const targetSection = targetSectionId && sections ? sections.get(targetSectionId) : null;

    let newElement: any = null;

    switch (toolId) {
      case 'text':
        const textWidth = 200;
        newElement = {
          id: generateId(),
          type: 'text',
          x: targetSection ? elementX - targetSection.x : elementX,
          y: targetSection ? elementY - targetSection.y : elementY,
          text: 'Text', // Non-empty default text to prevent React-Konva rendering issues
          fontSize: 18,
          fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
          fill: '#1E293B',
          width: textWidth,
          sectionId: targetSectionId
        };
        break;

      case 'sticky-note':
        const noteWidth = 150;
        const noteHeight = 100;
        const noteTopLeftX = elementX - noteWidth / 2;
        const noteTopLeftY = elementY - noteHeight / 2;
        newElement = {
          id: generateId(),
          type: 'sticky-note',
          x: targetSection ? noteTopLeftX - targetSection.x : noteTopLeftX,
          y: targetSection ? noteTopLeftY - targetSection.y : noteTopLeftY,
          width: noteWidth,
          height: noteHeight,
          text: 'New note',
          backgroundColor: '#FFEB3B',
          textColor: '#1E293B',
          fontSize: 14,
          fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
          sectionId: targetSectionId
        };
        break;

      case 'rectangle':
        const rectWidth = 150;
        const rectHeight = 100;
        const rectTopLeftX = elementX - rectWidth / 2;
        const rectTopLeftY = elementY - rectHeight / 2;
        newElement = {
          id: generateId(),
          type: 'rectangle',
          x: targetSection ? rectTopLeftX - targetSection.x : rectTopLeftX,
          y: targetSection ? rectTopLeftY - targetSection.y : rectTopLeftY,
          width: rectWidth,
          height: rectHeight,
          fill: '#DBEAFE',
          stroke: '#3B82F6',
          strokeWidth: 2,
          sectionId: targetSectionId
        };
        break;

      case 'circle':
        newElement = {
          id: generateId(),
          type: 'circle',
          x: targetSection ? elementX - targetSection.x : elementX,
          y: targetSection ? elementY - targetSection.y : elementY,
          radius: 60,
          fill: '#DCFCE7',
          stroke: '#22C55E',
          strokeWidth: 2,
          sectionId: targetSectionId
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
              const img = new window.Image();                img.onload = () => {
                const imageElement = {
                  id: generateId(),
                  type: 'image' as const,
                  x: targetSection ? (elementX - img.width / 4) - targetSection.x : elementX - img.width / 4,
                  y: targetSection ? (elementY - img.height / 4) - targetSection.y : elementY - img.height / 4,
                  width: img.width / 2,
                  height: img.height / 2,
                  imageUrl,
                  sectionId: targetSectionId,
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                };

                // **TARGETED FIX**: Toolbar elements default to canvas (not auto-assigned to sections)
                addElement(imageElement);
                if (targetSectionId && addElementToSection) {
                  addElementToSection(imageElement.id, targetSectionId);
                }
                
                selectElement(imageElement.id);
                setTimeout(() => setSelectedTool('select'), 100);
              };
              img.src = imageUrl;
            };
            reader.readAsDataURL(file);
          }
        };          input.click();
        return; // Don't continue with normal element creation
        
      case 'triangle':
        newElement = {
          id: generateId(),
          type: 'triangle',
          x: targetSection ? elementX - targetSection.x : elementX,
          y: targetSection ? elementY - targetSection.y : elementY,
          width: 100,
          height: 80,
          fill: '#FEF3C7',
          stroke: '#F59E0B',
          strokeWidth: 2,
          sectionId: targetSectionId
        };
        break;

      case 'star':
        newElement = {
          id: generateId(),
          type: 'star',
          x: targetSection ? elementX - targetSection.x : elementX,
          y: targetSection ? elementY - targetSection.y : elementY,
          numPoints: 5,
          innerRadius: 30,
          outerRadius: 70,
          fill: '#FFFBEB',
          stroke: '#FBBF24',
          strokeWidth: 2,
          sectionId: targetSectionId
        };
        break;
        
      case 'table':
        const tableWidth = 300;
        const tableHeight = 200;
        const tableTopLeftX = elementX - tableWidth / 2;
        const tableTopLeftY = elementY - tableHeight / 2;
        newElement = {
          id: generateId(),
          type: 'table',
          x: targetSection ? tableTopLeftX - targetSection.x : tableTopLeftX,
          y: targetSection ? tableTopLeftY - targetSection.y : tableTopLeftY,
          width: tableWidth,
          height: tableHeight,
          sectionId: targetSectionId,
          enhancedTableData: {
            rows: [
              { id: 'row-1', height: 40, isResizable: true, isHeader: true },
              { id: 'row-2', height: 40, isResizable: true, isHeader: false },
              { id: 'row-3', height: 40, isResizable: true, isHeader: false }
            ],
            columns: [
              { id: 'col-1', width: 100, isResizable: true, textAlign: 'left' as const },
              { id: 'col-2', width: 100, isResizable: true, textAlign: 'left' as const },
              { id: 'col-3', width: 100, isResizable: true, textAlign: 'left' as const }
            ],
            cells: [
              [
                { id: 'cell-1-1', content: 'Header 1', text: 'Header 1', segments: [], backgroundColor: '#f5f5f5', textColor: '#000000', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left' as const, textDecoration: 'none', borderColor: '#e0e0e0', borderWidth: 1, padding: 8, isHeader: true, isSelected: false, containedElementIds: [], rowSpan: 1, colSpan: 1 },
                { id: 'cell-1-2', content: 'Header 2', text: 'Header 2', segments: [], backgroundColor: '#f5f5f5', textColor: '#000000', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left' as const, textDecoration: 'none', borderColor: '#e0e0e0', borderWidth: 1, padding: 8, isHeader: true, isSelected: false, containedElementIds: [], rowSpan: 1, colSpan: 1 },
                { id: 'cell-1-3', content: 'Header 3', text: 'Header 3', segments: [], backgroundColor: '#f5f5f5', textColor: '#000000', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left' as const, textDecoration: 'none', borderColor: '#e0e0e0', borderWidth: 1, padding: 8, isHeader: true, isSelected: false, containedElementIds: [], rowSpan: 1, colSpan: 1 }
              ],
              [
                { id: 'cell-2-1', content: 'Data 1', text: 'Data 1', segments: [], backgroundColor: '#ffffff', textColor: '#000000', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left' as const, textDecoration: 'none', borderColor: '#e0e0e0', borderWidth: 1, padding: 8, isHeader: false, isSelected: false, containedElementIds: [], rowSpan: 1, colSpan: 1 },
                { id: 'cell-2-2', content: 'Data 2', text: 'Data 2', segments: [], backgroundColor: '#ffffff', textColor: '#000000', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left' as const, textDecoration: 'none', borderColor: '#e0e0e0', borderWidth: 1, padding: 8, isHeader: false, isSelected: false, containedElementIds: [], rowSpan: 1, colSpan: 1 },
                { id: 'cell-2-3', content: 'Data 3', text: 'Data 3', segments: [], backgroundColor: '#ffffff', textColor: '#000000', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left' as const, textDecoration: 'none', borderColor: '#e0e0e0', borderWidth: 1, padding: 8, isHeader: false, isSelected: false, containedElementIds: [], rowSpan: 1, colSpan: 1 }
              ],
              [
                { id: 'cell-3-1', content: 'Data 4', text: 'Data 4', segments: [], backgroundColor: '#ffffff', textColor: '#000000', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left' as const, textDecoration: 'none', borderColor: '#e0e0e0', borderWidth: 1, padding: 8, isHeader: false, isSelected: false, containedElementIds: [], rowSpan: 1, colSpan: 1 },
                { id: 'cell-3-2', content: 'Data 5', text: 'Data 5', segments: [], backgroundColor: '#ffffff', textColor: '#000000', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left' as const, textDecoration: 'none', borderColor: '#e0e0e0', borderWidth: 1, padding: 8, isHeader: false, isSelected: false, containedElementIds: [], rowSpan: 1, colSpan: 1 },
                { id: 'cell-3-3', content: 'Data 6', text: 'Data 6', segments: [], backgroundColor: '#ffffff', textColor: '#000000', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left' as const, textDecoration: 'none', borderColor: '#e0e0e0', borderWidth: 1, padding: 8, isHeader: false, isSelected: false, containedElementIds: [], rowSpan: 1, colSpan: 1 }
              ]
            ]
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        break;
        
      default:
        // Do nothing for tools that don't create elements immediately
        return;
    }

    if (newElement) {
      addElement(newElement);
      if (targetSectionId && addElementToSection) {
        addElementToSection(newElement.id, targetSectionId);
      }
      selectElement(newElement.id);
      setTimeout(() => setSelectedTool('select'), 100);
    }
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
      </div>
    </div>
  );
};

export default KonvaToolbar;
