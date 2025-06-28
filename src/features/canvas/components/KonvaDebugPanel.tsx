// Test component to verify Konva canvas integration
import React from 'react';
import { useUnifiedCanvasStore, canvasSelectors } from '../../../stores';
import { ElementId as ElementIdFactory } from '../types/enhanced.types';
import type { RectangleElement } from '../types/enhanced.types';

export const KonvaDebugPanel: React.FC = () => {
  // Use unified store with selectors
  const elements = useUnifiedCanvasStore(canvasSelectors.elements);
  const selectedTool = useUnifiedCanvasStore(canvasSelectors.selectedTool);
  const selectedElementIds = useUnifiedCanvasStore(canvasSelectors.selectedElementIds);
  const addElement = useUnifiedCanvasStore((state) => state.addElement);
  
  const elementCount = elements.size;
  const selectedElementId = Array.from(selectedElementIds)[0] || null;

  const testCreateElement = () => {
    const testElement: RectangleElement = {
      id: ElementIdFactory(`test-${Date.now()}`),
      type: 'rectangle',
      x: Math.random() * 200 + 50,
      y: Math.random() * 200 + 50,
      width: 100,
      height: 60,
      fill: '#FF6B6B',
      stroke: '#333',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    addElement(testElement);
    console.log('✅ Test element created:', testElement);
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 border border-gray-300 rounded-lg shadow-lg z-50">
      <h3 className="font-bold mb-2">Konva Debug Panel</h3>
      <div className="space-y-1 text-sm">
        <div>Elements: {elementCount}</div>
        <div>Selected Tool: {selectedTool}</div>
        <div>Selected Element: {selectedElementId || 'None'}</div>
        <button 
          onClick={testCreateElement}
          className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Test Create Element
        </button>
      </div>
    </div>
  );
};
