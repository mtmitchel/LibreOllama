import * as React from 'react';
import { useCanvasStore } from '../../../stores';
import { useShallow } from 'zustand/react/shallow';

export const DebugOverlay: React.FC = () => {
  const { 
    selectedTool, 
    isDrawing, 
    isDrawingSection, 
    drawingStartPoint, 
    currentPath 
  } = useCanvasStore(
    useShallow(state => ({
      selectedTool: state.selectedTool,
      isDrawing: state.isDrawing,
      isDrawingSection: state.isDrawingSection,
      drawingStartPoint: state.drawingStartPoint,
      currentPath: state.currentPath,
    }))
  );
  
  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div>Tool: <strong>{selectedTool}</strong></div>
      <div>isDrawing: {String(isDrawing)}</div>
      <div>isDrawingSection: {String(isDrawingSection)}</div>
      <div>Start Point: {drawingStartPoint ? `(${Math.round(drawingStartPoint.x)}, ${Math.round(drawingStartPoint.y)})` : 'null'}</div>
      <div>Path Length: {currentPath ? currentPath.length : 'null'}</div>
    </div>
  );
};

export default DebugOverlay;
