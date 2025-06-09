import React, { useEffect } from 'react';
import { useCanvasState } from '../hooks/canvas/useCanvasState';
import { useCanvasEvents } from '../hooks/canvas/useCanvasEvents';
import { useViewportCulling } from '../hooks/useViewportCulling';
import CanvasElement from '../components/canvas/CanvasElement';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import CanvasGrid from '../components/canvas/CanvasGrid';
import { Trash2 } from 'lucide-react';

const Canvas: React.FC = () => {
  const canvasState = useCanvasState();
  const {
    elements,
    activeTool,
    zoomLevel,
    selectedElement,
    setActiveTool,
    panOffset,
  } = canvasState;

  const canvasEvents = useCanvasEvents({ canvasState });
  const {
    canvasRef,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleMouseUp,
    handleElementMouseDown,
    handleTextFormatting,
    handleTextChange,
    handleTextFormatPropertyChange,
    handleDeleteElement,
    getTextStyles,
    commitToHistory
  } = canvasEvents;

  // Wrapper for delete button click
  const handleDeleteButtonClick = () => {
    handleDeleteElement();
  };

  const { visibleElements } = useViewportCulling({
    elements,
    canvasSize: canvasRef.current ? {
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight
    } : { width: 0, height: 0 },
    zoomLevel,
    panOffset,
  });

  // Add keyboard event listener for delete functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement && !document.querySelector('input:focus, textarea:focus')) {
          e.preventDefault();
          handleDeleteElement();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, handleDeleteElement]);

  // Direct element creation function - creates elements at center of visible canvas area
  const createElementDirectly = (elementType: string) => {
    if (!canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const centerX = (canvasRect.width / 2 - panOffset.x) / zoomLevel;
    const centerY = (canvasRect.height / 2 - panOffset.y) / zoomLevel;
    
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let newElement;
    
    switch (elementType) {
      case 'rectangle':
        newElement = {
          id: generateId(),
          type: 'rectangle' as const,
          x: centerX - 60, // Center the element
          y: centerY - 40,
          width: 120,
          height: 80,
          color: '#bfdbfe' // Light blue default color
        };
        break;
        
      case 'text':
        newElement = {
          id: generateId(),
          type: 'text' as const,
          x: centerX - 75,
          y: centerY - 25,
          width: 150,
          height: 50,
          content: 'New Text',
          fontSize: 'medium' as const,
          color: '#000000'
        };
        break;
        
      case 'line':
        newElement = {
          id: generateId(),
          type: 'line' as const,
          x: centerX - 50,
          y: centerY,
          x2: centerX + 50,
          y2: centerY,
          color: '#3b82f6' // Blue default color
        };
        break;
        
      case 'sticky-note':
        newElement = {
          id: generateId(),
          type: 'sticky-note' as const,
          x: centerX - 75,
          y: centerY - 75,
          width: 150,
          height: 150,
          content: '',
          color: '#fef08a' // Yellow default color
        };
        break;
        
      default:
        return;
    }
    
    const newElements = [...elements, newElement];
    canvasState.setElements(newElements);
    
    // Add to history for undo/redo functionality
    commitToHistory(newElements);
    
    canvasState.setSelectedElement(newElement.id);
    setActiveTool('select'); // Switch to select for immediate editing
    
    console.log(`✅ DIRECT CREATION: ${elementType} created immediately:`, newElement);
  };

  return (
    <div className="canvas-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Direct creation toolbar - single click creates elements */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 bg-white p-2 rounded-lg shadow-lg">
        <button
          onClick={() => setActiveTool('select')}
          className={`p-2 rounded transition-colors ${activeTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Select
        </button>
        <button
          onClick={() => createElementDirectly('text')}
          className="p-2 rounded bg-gray-200 hover:bg-blue-100 transition-colors active:bg-blue-200"
        >
          Add Text
        </button>
        <button
          onClick={() => createElementDirectly('sticky-note')}
          className="p-2 rounded bg-gray-200 hover:bg-yellow-100 transition-colors active:bg-yellow-200"
        >
          Add Note
        </button>
        <button
          onClick={() => createElementDirectly('rectangle')}
          className="p-2 rounded bg-gray-200 hover:bg-blue-100 transition-colors active:bg-blue-200"
        >
          Add Rectangle
        </button>
        <button
          onClick={() => createElementDirectly('line')}
          className="p-2 rounded bg-gray-200 hover:bg-blue-100 transition-colors active:bg-blue-200"
        >
          Add Line
        </button>
        <button
          onClick={() => setActiveTool('pen')}
          className={`p-2 rounded transition-colors ${activeTool === 'pen' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Pen
        </button>
        <button
          onClick={handleDeleteButtonClick}
          disabled={!selectedElement}
          className={`p-2 rounded flex items-center gap-1 transition-colors ${
            selectedElement
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Delete selected element (Delete key)"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="canvas-workspace" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          className="canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: activeTool === 'select' ? 'grab' : 'crosshair',
            touchAction: 'none' // Prevent touch scrolling for better mobile performance
          }}
          onMouseDown={handleCanvasMouseDown}
        />
        <CanvasGrid zoomLevel={zoomLevel} panOffset={panOffset} />
        <div className="canvas-elements" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}>
          {visibleElements.map((element) => (
            <div
              key={element.id}
              style={{
                pointerEvents: 'auto',
                willChange: selectedElement === element.id ? 'transform' : 'auto' // GPU acceleration for selected elements
              }}
            >
                <CanvasElement
                  element={element}
                  isSelected={selectedElement === element.id}
                  onMouseDown={handleElementMouseDown}
                  onTextChange={handleTextChange}
                  onTextFormatting={handleTextFormatting}
                  onTextFormatPropertyChange={handleTextFormatPropertyChange}
                  onDelete={handleDeleteElement}
                  getTextStyles={getTextStyles}
                />
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Canvas;
