// Test component to verify Konva canvas integration
import React from 'react';
import { useKonvaCanvasStore } from '../../stores/konvaCanvasStore';

export const KonvaDebugPanel: React.FC = () => {
  const { elements, selectedTool, selectedElementId, addElement } = useKonvaCanvasStore();
  const elementCount = Object.keys(elements).length;

  const testCreateElement = () => {
    const testElement = {
      id: `test-${Date.now()}`,
      type: 'rectangle' as const,
      x: Math.random() * 200 + 50,
      y: Math.random() * 200 + 50,
      width: 100,
      height: 60,
      fill: '#FF6B6B',
      stroke: '#333',
      strokeWidth: 2
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
