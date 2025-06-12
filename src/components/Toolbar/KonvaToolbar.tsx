// src/components/Toolbar/KonvaToolbar.tsx
import React from 'react';
import { useKonvaCanvasStore } from '../../stores/konvaCanvasStore';
import { useTauriCanvas } from '../../hooks/useTauriCanvas';
import { designSystem, getStickyNoteColors } from '../../styles/designSystem';

const tools = [
  { id: 'select', name: 'Select', icon: '↖️' },
  { id: 'text', name: 'Text', icon: 'T' },
  { id: 'sticky-note', name: 'Sticky Note', icon: '📝' },
  { id: 'rectangle', name: 'Rectangle', icon: '⬜' },
  { id: 'circle', name: 'Circle', icon: '⭕' },
  { id: 'line', name: 'Line', icon: '📏' },
  { id: 'pen', name: 'Pen', icon: '✏️' },
  { id: 'triangle', name: 'Triangle', icon: '🔺' },
  { id: 'star', name: 'Star', icon: '⭐' }
];

const KonvaToolbar: React.FC = () => {
  const { selectedTool, setSelectedTool, clearCanvas, exportCanvas, importCanvas, selectedElementId, deleteElement } = useKonvaCanvasStore();
  const { saveToFile, loadFromFile } = useTauriCanvas();

  const handleDeleteSelected = () => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
    }
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

  return (
    <div 
      className="konva-toolbar"
      style={{
        background: designSystem.toolbar.background,
        padding: `${designSystem.spacing.md}px`,
        borderBottom: `1px solid ${designSystem.colors.secondary[200]}`,
        boxShadow: designSystem.shadows.md
      }}
    >
      <div style={{ display: 'flex', gap: `${designSystem.spacing.sm}px`, alignItems: 'center' }}>
        {/* Tool Buttons */}        {tools.map(tool => (
          <button
            key={tool.id}            onClick={() => {
              console.log('🔧 Tool selected:', tool.id);
              setSelectedTool(tool.id);
              
              // Create element immediately when non-select tool is clicked
              if (tool.id !== 'select') {
                console.log('🚀 Creating element for tool:', tool.id);
                // Call the store's action to create element directly
                const { addElement, setSelectedElement } = useKonvaCanvasStore.getState();
                
                // Create element at center of canvas
                const centerPosition = { x: 400, y: 300 }; // Default center position
                
                const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                const newElement: any = {
                  id: generateId(),
                  type: tool.id,
                  x: centerPosition.x,
                  y: centerPosition.y,
                  fill: '#3B82F6',
                  stroke: '#1E40AF',
                  strokeWidth: 2
                };

                // Set default properties based on tool type
                switch (tool.id) {
                  case 'text':
                    newElement.text = 'Double-click to edit';
                    newElement.width = 150;
                    newElement.height = 25;
                    break;                  case 'sticky-note':
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
                    newElement.points = [0, -50, -50, 50, 50, 50];
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
            }}
            style={{
              padding: `${designSystem.spacing.xs}px ${designSystem.spacing.sm}px`,
              borderRadius: `${designSystem.borderRadius.md}px`,
              border: `1px solid ${designSystem.toolbar.buttonBorder}`,
              background: selectedTool === tool.id 
                ? designSystem.toolbar.buttonBackgroundActive 
                : designSystem.toolbar.buttonBackground,
              color: designSystem.toolbar.buttonText,
              fontSize: `${designSystem.typography.fontSize.sm}px`,
              fontWeight: designSystem.typography.fontWeight.medium,
              fontFamily: designSystem.typography.fontFamily.sans,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: `${designSystem.spacing.xs}px`,
              boxShadow: selectedTool === tool.id ? designSystem.shadows.sm : 'none',
              transform: selectedTool === tool.id ? 'translateY(-1px)' : 'none',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              if (selectedTool !== tool.id) {
                e.currentTarget.style.background = designSystem.toolbar.buttonBackgroundHover;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTool !== tool.id) {
                e.currentTarget.style.background = designSystem.toolbar.buttonBackground;
                e.currentTarget.style.transform = 'none';
              }
            }}
            title={tool.name}
          >
            <span style={{ fontSize: '16px' }}>{tool.icon}</span>
            <span>{tool.name}</span>
          </button>
        ))}
        
        {/* Action Buttons */}
        <div style={{
          marginLeft: `${designSystem.spacing.md}px`,
          paddingLeft: `${designSystem.spacing.md}px`,
          borderLeft: `1px solid ${designSystem.toolbar.buttonBorder}`,
          display: 'flex',
          gap: `${designSystem.spacing.xs}px`,
          alignItems: 'center'
        }}>
          <button
            onClick={handleDeleteSelected}
            disabled={!selectedElementId}
            style={{
              padding: `${designSystem.spacing.xs}px ${designSystem.spacing.sm}px`,
              borderRadius: `${designSystem.borderRadius.md}px`,
              border: 'none',
              background: selectedElementId 
                ? designSystem.colors.error[500] 
                : designSystem.colors.secondary[400],
              color: '#FFFFFF',
              fontSize: `${designSystem.typography.fontSize.sm}px`,
              fontWeight: designSystem.typography.fontWeight.medium,
              cursor: selectedElementId ? 'pointer' : 'not-allowed',
              opacity: selectedElementId ? 1 : 0.6,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: `${designSystem.spacing.xs}px`
            }}
            title="Delete Selected (Del)"
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>
          
          <button
            onClick={clearCanvas}
            style={{
              padding: `${designSystem.spacing.xs}px ${designSystem.spacing.sm}px`,
              borderRadius: `${designSystem.borderRadius.md}px`,
              border: 'none',
              background: designSystem.colors.error[600],
              color: '#FFFFFF',
              fontSize: `${designSystem.typography.fontSize.sm}px`,
              fontWeight: designSystem.typography.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = designSystem.colors.error[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = designSystem.colors.error[600];
            }}
          >
            Clear Canvas
          </button>
          
          <button
            onClick={exportCanvasData}
            style={{
              padding: `${designSystem.spacing.xs}px ${designSystem.spacing.sm}px`,
              borderRadius: `${designSystem.borderRadius.md}px`,
              border: 'none',
              background: designSystem.colors.success[500],
              color: '#FFFFFF',
              fontSize: `${designSystem.typography.fontSize.sm}px`,
              fontWeight: designSystem.typography.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = designSystem.colors.success[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = designSystem.colors.success[500];
            }}
          >
            Export
          </button>
          
          <button
            onClick={() => saveToFile('canvas-save.json')}
            style={{
              padding: `${designSystem.spacing.xs}px ${designSystem.spacing.sm}px`,
              borderRadius: `${designSystem.borderRadius.md}px`,
              border: 'none',
              background: designSystem.colors.primary[600],
              color: '#FFFFFF',
              fontSize: `${designSystem.typography.fontSize.sm}px`,
              fontWeight: designSystem.typography.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = designSystem.colors.primary[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = designSystem.colors.primary[600];
            }}
          >
            Save to File
          </button>
          
          <button
            onClick={() => loadFromFile('canvas-save.json')}
            style={{
              padding: `${designSystem.spacing.xs}px ${designSystem.spacing.sm}px`,
              borderRadius: `${designSystem.borderRadius.md}px`,
              border: 'none',
              background: designSystem.colors.secondary[600],
              color: '#FFFFFF',
              fontSize: `${designSystem.typography.fontSize.sm}px`,
              fontWeight: designSystem.typography.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = designSystem.colors.secondary[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = designSystem.colors.secondary[600];
            }}
          >
            Load from File
          </button>
          
          <label
            style={{
              padding: `${designSystem.spacing.xs}px ${designSystem.spacing.sm}px`,
              borderRadius: `${designSystem.borderRadius.md}px`,
              border: 'none',
              background: designSystem.colors.primary[500],
              color: '#FFFFFF',
              fontSize: `${designSystem.typography.fontSize.sm}px`,
              fontWeight: designSystem.typography.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = designSystem.colors.primary[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = designSystem.colors.primary[500];
            }}
          >
            Import
            <input
              type="file"
              accept=".json"
              onChange={importCanvasData}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default KonvaToolbar;
