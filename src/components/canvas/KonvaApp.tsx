// src/components/Canvas/KonvaApp.tsx
import React, { useState, useEffect } from 'react';
import KonvaCanvas from './KonvaCanvas';
import KonvaToolbar from '../Toolbar/KonvaToolbar';
import { useKonvaCanvasStore } from '../../stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';
import '../../styles/konvaCanvas.css';

const KonvaApp: React.FC = () => {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const { selectedElementId } = useKonvaCanvasStore();

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setCanvasSize({
          width: rect.width - 32, // Account for padding
          height: rect.height - 32
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);  return (
    <div 
      className="app h-screen flex flex-col"
      style={{ 
        fontFamily: designSystem.typography.fontFamily.sans,
        backgroundColor: designSystem.colors.secondary[50] 
      }}
    >
      <KonvaToolbar />
      
      <div 
        id="canvas-container" 
        style={{
          flex: 1,
          padding: `${designSystem.spacing.lg}px`,
          background: `linear-gradient(135deg, ${designSystem.colors.secondary[50]} 0%, ${designSystem.colors.secondary[100]} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >        <KonvaCanvas
          width={canvasSize.width}
          height={canvasSize.height}
          onElementSelect={(element) => {
            console.log('Element selected:', element);
          }}
        />
      </div>
      
      {selectedElementId && (
        <div 
          style={{
            background: designSystem.colors.secondary[100],
            padding: `${designSystem.spacing.xs}px ${designSystem.spacing.md}px`,
            fontSize: `${designSystem.typography.fontSize.sm}px`,
            color: designSystem.colors.secondary[700],
            borderTop: `1px solid ${designSystem.colors.secondary[200]}`,
            display: 'flex',
            alignItems: 'center',
            gap: `${designSystem.spacing.xs}px`
          }}
        >
          <span style={{ fontWeight: designSystem.typography.fontWeight.medium }}>
            Selected:
          </span>
          <span style={{ 
            fontFamily: designSystem.typography.fontFamily.mono,
            fontSize: `${designSystem.typography.fontSize.xs}px`,
            background: designSystem.colors.secondary[200],
            padding: '2px 6px',
            borderRadius: `${designSystem.borderRadius.sm}px`
          }}>
            {selectedElementId}
          </span>
        </div>
      )}
    </div>
  );
};

export default KonvaApp;
