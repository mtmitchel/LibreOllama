/**
 * ToolLayer - Manages all interactive drawing and selection tools
 * This layer sits on top of the canvas and handles tool-specific interactions
 */

import React from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { MarkerTool } from '../components/tools/drawing/MarkerTool';
import { HighlighterTool } from '../components/tools/drawing/HighlighterTool';
import { WashiTapeTool } from '../components/tools/drawing/WashiTapeTool';
import { EraserTool } from '../components/tools/drawing/EraserTool';
import { LassoTool } from '../components/tools/selection/LassoTool';
import { TextTool } from '../components/tools/creation/TextTool';
import { TableTool } from '../components/tools/creation/TableTool';
import { ImageTool } from '../components/tools/creation/ImageTool';
import { SectionTool } from '../components/tools/creation/SectionTool';
import { PenTool } from '../components/tools/drawing/PenTool';
import { PanTool } from '../components/tools/core/PanTool';
import { ConnectorTool } from '../components/tools/creation/ConnectorTool';
import { SHAPE_CREATORS, ShapeType } from '../utils/shapeCreators';

interface ToolLayerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const ToolLayer: React.FC<ToolLayerProps> = ({ stageRef }) => {
  // Get current tool and configurations
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  const strokeConfig = useUnifiedCanvasStore(state => state.strokeConfig);
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  
  // Handle canvas clicks for shape creation
  const handleCanvasClick = React.useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only handle if clicking on the stage (not on an element)
    if (e.target !== stageRef.current) return;
    
    // Check if current tool is a shape creation tool (excluding text which has its own tool)
    if (selectedTool in SHAPE_CREATORS && selectedTool !== 'text') {
      const stage = stageRef.current!;
      const pointer = stage.getPointerPosition()!;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const pos = transform.point(pointer);
      
      // Create shape at click position
      const shape = SHAPE_CREATORS[selectedTool as ShapeType](pos.x, pos.y);
      addElement(shape);
      console.log('🎨 [ToolLayer] Created shape via canvas click:', selectedTool, shape.id);
      
      // Switch back to select tool
      setSelectedTool('select');
    }
  }, [selectedTool, addElement, setSelectedTool, stageRef]);
  
  // Attach click handler when a shape tool is selected
  React.useEffect(() => {
    if (!stageRef.current || !(selectedTool in SHAPE_CREATORS) || selectedTool === 'text') return;
    
    const stage = stageRef.current;
    stage.on('click', handleCanvasClick);
    
    // Change cursor to indicate shape creation mode
    stage.container().style.cursor = 'crosshair';
    
    return () => {
      stage.off('click', handleCanvasClick);
      stage.container().style.cursor = 'default';
    };
  }, [selectedTool, handleCanvasClick]);
  
  // Default tool configurations
  const markerConfig = strokeConfig?.marker || {
    color: '#000000',
    width: 8,
    minWidth: 2,
    maxWidth: 20,
    opacity: 1,
    smoothness: 0.5,
    widthVariation: true,
    pressureSensitive: true,
    lineCap: 'round' as const,
    lineJoin: 'round' as const
  };
  
  const highlighterConfig = strokeConfig?.highlighter || {
    color: '#FFFF00',
    width: 16,
    opacity: 0.4,
    blendMode: 'multiply' as const,
    lockToElements: false
  };
  
  const washiTapeConfig = strokeConfig?.washiTape || {
    primaryColor: '#FFB3BA',
    secondaryColor: '#A8DAFF',
    width: 20,
    opacity: 0.8,
    pattern: {
      type: 'dots' as const,
      radius: 2
    }
  };
  
  const eraserConfig = strokeConfig?.eraser || {
    size: 30,
    mode: 'stroke' as const
  };
  
  return (
    <Layer listening={true}>
      {/* Core Tools */}
      <PanTool
        stageRef={stageRef}
        isActive={selectedTool === 'pan'}
      />
      
      {/* Basic Drawing Tools */}
      <PenTool
        stageRef={stageRef}
        isActive={selectedTool === 'pen'}
      />
      
      {/* Advanced Drawing Tools */}
      <MarkerTool
        stageRef={stageRef}
        isActive={selectedTool === 'marker'}
        strokeStyle={markerConfig}
      />
      
      <HighlighterTool
        stageRef={stageRef}
        isActive={selectedTool === 'highlighter'}
        strokeStyle={highlighterConfig}
      />
      
      <WashiTapeTool
        stageRef={stageRef}
        isActive={selectedTool === 'washi-tape'}
        strokeStyle={washiTapeConfig}
      />
      
      <EraserTool
        stageRef={stageRef}
        isActive={selectedTool === 'eraser'}
        eraserConfig={eraserConfig}
      />
      
      {/* Selection Tools */}
      <LassoTool
        stageRef={stageRef}
        isActive={selectedTool === 'lasso'}
        mode="intersect"
        threshold={0.1}
      />
      
      {/* Creation Tools */}
      <TextTool
        stageRef={stageRef}
        isActive={selectedTool === 'text'}
      />
      
      <TableTool
        stageRef={stageRef}
        isActive={selectedTool === 'table'}
      />
      
      <ImageTool
        stageRef={stageRef}
        isActive={selectedTool === 'image'}
      />
      
      <SectionTool
        stageRef={stageRef}
        isActive={selectedTool === 'section'}
      />
      
      <ConnectorTool
        stageRef={stageRef}
        isActive={selectedTool === 'connector'}
      />
    </Layer>
  );
};

export default ToolLayer; 