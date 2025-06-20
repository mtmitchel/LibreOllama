// src/components/Toolbar/KonvaToolbar.tsx
import React, { useRef } from 'react';
import { useCanvasStore } from '../../features/canvas/stores/canvasStore.enhanced';
import { useTauriCanvas } from '../../features/canvas/hooks/useTauriCanvas';
import { 
  MousePointer2, 
  Type, 
  StickyNote, 
  Pen, 
  Trash2,
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
  RotateCcw
} from 'lucide-react';
import './KonvaToolbar.css';
import ColorPicker from '../../features/canvas/components/ColorPicker';
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
  panZoomState?: {
    scale: number;
    position: { x: number; y: number };
  };
  canvasSize?: { width: number; height: number };
}

const KonvaToolbar: React.FC<KonvaToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onZoomToFit,
  sidebarOpen,
  onToggleSidebar,
  panZoomState,
  canvasSize
}) => {
  const tableCreationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use unified canvas store with selectors
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
  
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);
  
  const sections = useCanvasStore((state) => state.sections);
  const addElementToSection = useCanvasStore((state) => state.addElementToSection);
  
  const selectedElementId = selectedElementIds.length > 0 ? selectedElementIds[0] : null;
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
    console.log('🔧 Tool selected:', toolId);
    setSelectedTool(toolId);
    
    // Tools that activate drawing/interaction modes instead of creating elements immediately
    const drawingModeTools = [
      'select', 'pan', 'section', 
      'pen', 'connector-line', 'connector-arrow'
    ];
    
    // For most tools, create element immediately
    // Drawing mode tools just change the active tool state
    if (!drawingModeTools.includes(toolId)) {
      createElementForTool(toolId);
    } else {
      console.log(`🎨 [TOOLBAR] ${toolId} tool activated - drawing/interaction mode enabled`);
    }
  };
  
  const createElementForTool = (toolId: string) => {
    console.log('🔧 [TOOLBAR] Creating element for tool:', toolId);
    const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate center position of visible canvas area accounting for pan/zoom
    // This fixes the "element jumps out of section on first add" issue
    let centerX = 400;
    let centerY = 300;
    
    // Convert screen coordinates to canvas world coordinates
    if (panZoomState && canvasSize) {
      // Get the center of the visible canvas area
      const screenCenterX = canvasSize.width / 2;
      const screenCenterY = canvasSize.height / 2;
      
      // Convert to world coordinates accounting for pan and zoom
      centerX = (screenCenterX - panZoomState.position.x) / panZoomState.scale;
      centerY = (screenCenterY - panZoomState.position.y) / panZoomState.scale;
      
      console.log('📍 [TOOLBAR] Viewport-aware positioning:', {
        screenCenter: { x: screenCenterX, y: screenCenterY },
        worldCenter: { x: centerX, y: centerY },
        panZoom: panZoomState
      });
    } else {
      console.warn('⚠️ [TOOLBAR] No viewport state available, using fallback coordinates');
    }
    
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
          width: 200,
          sectionId: null as string | null // Initialize as null, will be set if in a section
        };
        console.log('📝 [TOOLBAR] Created text element:', newElement);
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
            fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
            sectionId: null as string | null // Initialize as null, will be set if in a section
          };
          console.log('📝 [TOOLBAR] Created sticky note element:', newElement);
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
            strokeWidth: 2,
            sectionId: null as string | null // Initialize as null, will be set if in a section
          };
          console.log('🟦 [TOOLBAR] Created rectangle element:', newElement);
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
            strokeWidth: 2,
            sectionId: null as string | null // Initialize as null, will be set if in a section
          };
          console.log('🟢 [TOOLBAR] Created circle element:', newElement);
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
                    imageUrl,
                    sectionId: null as string | null // Initialize as null, will be set if in a section
                  };
                  
                  // Check if the image should be placed in a section
                  const targetSectionId = useCanvasStore.getState().findSectionAtPoint({ x: imageElement.x, y: imageElement.y });
                  const targetSection = targetSectionId ? sections[targetSectionId] : null;
                  
                  if (targetSection) {
                    // Convert world coordinates to section-relative coordinates
                    const relativeX = imageElement.x - targetSection.x;
                    const relativeY = imageElement.y - targetSection.y;
                    
                    // Update element with relative coordinates and section ID
                    imageElement.x = relativeX;
                    imageElement.y = relativeY;
                    imageElement.sectionId = targetSection.id;
                  }
                  
                  addElement(imageElement);
                  
                  // If image is in a section, also add it to the section's element list
                  if (targetSection) {
                    addElementToSection(imageElement.id, targetSection.id);
                  }
                  
                  selectElement(imageElement.id);
                  setTimeout(() => setSelectedTool('select'), 100);
                };
                img.src = imageUrl;
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
          return; // Don't continue with normal element creation
          
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
            strokeWidth: 2,
            sectionId: null as string | null // Initialize as null, will be set if in a section
          };
          console.log('🔺 [TOOLBAR] Created triangle element:', newElement);
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
            strokeWidth: 2,
            sectionId: null as string | null // Initialize as null, will be set if in a section
          };
          console.log('⭐ [TOOLBAR] Created star element:', newElement);
          break;
          
        case 'pen':
          // Pen tool activates drawing mode, doesn't create element immediately
          // The actual pen path will be created during drawing interaction
          console.log('✏️ [TOOLBAR] Pen tool activated - drawing mode enabled');
          return;
          
        case 'section':
          // Section tool activates drawing mode, doesn't create element immediately
          console.log('📦 [TOOLBAR] Section tool activated - drawing mode enabled');
          return;
          
        case 'table':
          // Debounce table creation to prevent duplicates
          if (tableCreationTimeoutRef.current) {
            clearTimeout(tableCreationTimeoutRef.current);
          }
          
          tableCreationTimeoutRef.current = setTimeout(() => {
            // Create a table element with proper enhanced table data structure
            const rows = 3;
            const cols = 3;
            const cellWidth = 120;
            const cellHeight = 50;
            
            // Create enhanced table data structure
            const enhancedTableData = {
              rows: Array(rows).fill(0).map((_, rowIndex) => ({
                id: `row-${rowIndex}`,
                height: cellHeight,
                minHeight: 30,
                maxHeight: 200,
                isResizable: true,
                isHeader: rowIndex === 0
              })),
              columns: Array(cols).fill(0).map((_, colIndex) => ({
                id: `col-${colIndex}`,
                width: cellWidth,
                minWidth: 60,
                maxWidth: 300,
                isResizable: true,
                textAlign: 'left' as const
              })),
              cells: Array(rows).fill(0).map(() => 
                Array(cols).fill(0).map(() => ({
                  id: generateId(),
                  text: '',
                  segments: [],
                  backgroundColor: '#ffffff',
                  textColor: '#000000',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 'normal',
                  fontStyle: 'normal',
                  textAlign: 'left' as const,
                  textDecoration: 'none',
                  borderColor: '#e0e0e0',
                  borderWidth: 1,
                  padding: 8,
                  isHeader: false,
                  isSelected: false,
                  containedElementIds: [],
                  rowSpan: 1,
                  colSpan: 1
                }))
              )
            };
            
            const tableElement: any = {
              id: generateId(),
              type: 'table' as const,
              x: centerX - 180,
              y: centerY - 75,
              width: cellWidth * cols,
              height: cellHeight * rows,
              enhancedTableData,
              sectionId: null as string | null // Initialize as null, will be set if in a section
            };
            
            // Check if the table should be placed in a section
            const targetSectionId = useCanvasStore.getState().findSectionAtPoint({ x: tableElement.x, y: tableElement.y });
            const targetSection = targetSectionId ? sections[targetSectionId] : null;
            
            if (targetSection) {
              // Convert world coordinates to section-relative coordinates
              const relativeX = tableElement.x - targetSection.x;
              const relativeY = tableElement.y - targetSection.y;
              
              // Update element with relative coordinates and section ID
              tableElement.x = relativeX;
              tableElement.y = relativeY;
              tableElement.sectionId = targetSection.id;
              
              console.log('� [TOOLBAR] Table will be placed in section:', targetSection.id);
            }
            
            console.log('�🔧 [TOOLBAR] Creating table element:', tableElement);
            addElement(tableElement);
            
            // If table is in a section, also add it to the section's element list
            if (targetSection) {
              addElementToSection(tableElement.id, targetSection.id);
            }
            
            selectElement(tableElement.id);
            tableCreationTimeoutRef.current = null;
          }, 100);
          return;
      }
      
      if (newElement) {
        console.log('✅ [TOOLBAR] Creating element:', newElement);
        
        // Check if the element should be placed in a section BEFORE adding to store
        const targetSectionId = useCanvasStore.getState().findSectionAtPoint({ x: newElement.x, y: newElement.y });
        const targetSection = targetSectionId ? sections[targetSectionId] : null;
        
        if (targetSection) {
          // Convert world coordinates to section-relative coordinates
          const relativeX = newElement.x - targetSection.x;
          const relativeY = newElement.y - targetSection.y;
          
          // Update element with relative coordinates and section ID before storing
          newElement.x = relativeX;
          newElement.y = relativeY;
          newElement.sectionId = targetSection.id;
          
          console.log('📦 [TOOLBAR] Element will be placed in section:', targetSection.id);
          console.log('📦 [TOOLBAR] Converted to relative coordinates:', { x: relativeX, y: relativeY });
        }
        
        // Add element to store with correct coordinates from the start
        addElement(newElement);
        
        // AFTER adding to store, add to section if needed
        if (targetSection) {
          addElementToSection(newElement.id, targetSection.id);
        }
        
        console.log('📌 [TOOLBAR] Selecting element:', newElement.id);
        selectElement(newElement.id);
        
        // For text elements, immediately enter edit mode for FigJam-style behavior
        if (newElement.type === 'text') {
          setEditingTextId(newElement.id);
        }
        
        // After creating element, switch to select tool immediately
        setTimeout(() => setSelectedTool('select'), 100);
      } else {
        console.warn('⚠️ [TOOLBAR] No element created for tool:', toolId);
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
            {...(((selectedElement?.fill || selectedElement?.backgroundColor) && { 
              selectedColor: selectedElement?.fill || selectedElement?.backgroundColor 
            }) || {})}
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
