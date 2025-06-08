import React from 'react';
import { useCanvasState } from '../hooks/canvas/useCanvasState';
import { useCanvasEvents } from '../hooks/canvas/useCanvasEvents';
import { useViewportCulling } from '../hooks/useViewportCulling';
import CanvasElement from '../components/canvas/CanvasElement';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import CanvasGrid from '../components/canvas/CanvasGrid';

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

  const {
    canvasRef,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleMouseUp,
    handleElementMouseDown,
    handleTextFormatting,
    handleTextChange,
    handleTextFormatPropertyChange,
    getTextStyles
  } = useCanvasEvents({ canvasState });

  const { visibleElements } = useViewportCulling({
    elements,
    canvasSize: canvasRef.current ? {
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight
    } : { width: 0, height: 0 },
    zoomLevel,
    panOffset,
  });

  return (
    <div className="canvas-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CanvasToolbar activeTool={activeTool} setActiveTool={setActiveTool} />
      <div className="canvas-workspace" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          className="canvas"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'grab' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleMouseUp}
        />
        <CanvasGrid />
        <div className="canvas-elements" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {visibleElements.map((element) => (
            <div key={element.id} style={{ pointerEvents: 'auto' }}>
                <CanvasElement
                  element={element}
                  isSelected={selectedElement?.id === element.id}
                  onMouseDown={handleElementMouseDown}
                  onTextChange={handleTextChange}
                  onTextFormatting={handleTextFormatting}
                  onTextFormatPropertyChange={handleTextFormatPropertyChange}
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
