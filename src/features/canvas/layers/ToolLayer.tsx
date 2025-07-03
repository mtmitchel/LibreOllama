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

import { EraserTool } from '../components/tools/drawing/EraserTool';
import { LassoTool } from '../components/tools/selection/LassoTool';
import { TextTool } from '../components/tools/creation/TextTool';
import { StickyNoteTool } from '../components/tools/creation/StickyNoteTool';
import { TableTool } from '../components/tools/creation/TableTool';

import { SectionTool } from '../components/tools/creation/SectionTool';
import { PenTool } from '../components/tools/drawing/PenTool';
import { PanTool } from '../components/tools/core/PanTool';
import { ConnectorTool } from '../components/tools/creation/ConnectorTool';
import { RectangleTool } from '../components/tools/creation/RectangleTool';
import { CircleTool } from '../components/tools/creation/CircleTool';
import { TriangleTool } from '../components/tools/creation/TriangleTool';
import { MindmapTool } from '../components/tools/creation/MindmapTool';
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
  
  // Handle canvas clicks for shape creation (excluding interactive tools)
  const handleCanvasClick = React.useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only handle if clicking on the stage (not on an element)
    if (e.target !== stageRef.current) return;
    
    // Check if current tool is a shape creation tool (excluding interactive tools)
    const interactiveTools = ['text', 'sticky-note', 'section', 'table', 'image', 'connector'];
    if (selectedTool in SHAPE_CREATORS && !interactiveTools.includes(selectedTool)) {
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
  
  // Attach click handler when a non-interactive shape tool is selected
  React.useEffect(() => {
    const interactiveTools = ['text', 'sticky-note', 'section', 'table', 'image'];
    if (!stageRef.current || !(selectedTool in SHAPE_CREATORS) || interactiveTools.includes(selectedTool)) return;
    
    const stage = stageRef.current;
    stage.on('click', handleCanvasClick);
    
    // Change cursor to indicate shape creation mode
    stage.container().style.cursor = 'crosshair';
    
    return () => {
      stage.off('click', handleCanvasClick);
      stage.container().style.cursor = 'default';
    };
  }, [selectedTool, handleCanvasClick]);

  // Note: Cursor management is now handled centrally by CursorManager in CanvasStage
  
  // Default tool configurations
  const markerConfig = React.useMemo(() => (strokeConfig?.marker || {
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
  }), [strokeConfig?.marker]);
  
  const highlighterConfig = React.useMemo(() => (strokeConfig?.highlighter || {
    color: '#FFFF00',
    width: 16,
    opacity: 0.4,
    blendMode: 'multiply' as const,
    lockToElements: false
  }), [strokeConfig?.highlighter]);
  
  const eraserConfig = React.useMemo(() => (strokeConfig?.eraser || {
    size: 30,
    mode: 'stroke' as const
  }), [strokeConfig?.eraser]);
  
  return (
    <Layer listening={true}>
      {/* Core Tools */}
      <PanTool
        stageRef={stageRef}
        isActive={selectedTool === 'pan'}
      />
      
      {/* Content creation tools - all now use interactive pattern */}
      <TextTool
        stageRef={stageRef}
        isActive={selectedTool === 'text'}
      />
      
      <StickyNoteTool
        stageRef={stageRef}
        isActive={selectedTool === 'sticky-note'}
      />
      
      {/* Shape tools - now use interactive pattern like sticky notes */}
      <RectangleTool
        stageRef={stageRef}
        isActive={selectedTool === 'rectangle'}
      />
      
      <CircleTool
        stageRef={stageRef}
        isActive={selectedTool === 'circle'}
      />
      
      <TriangleTool
        stageRef={stageRef}
        isActive={selectedTool === 'triangle'}
      />
      
      <MindmapTool
        stageRef={stageRef}
        isActive={selectedTool === 'mindmap'}
      />
      
      <TableTool
        stageRef={stageRef}
        isActive={selectedTool === 'table'}
      />
      
      <SectionTool
        stageRef={stageRef}
        isActive={selectedTool === 'section'}
      />
      
      <ConnectorTool
        stageRef={stageRef}
        isActive={selectedTool === 'connector-line' || selectedTool === 'connector-arrow'}
        connectorType={selectedTool === 'connector-arrow' ? 'arrow' : 'line'}
      />
      


      {/* Drawing tools */}
      <PenTool
        stageRef={stageRef}
        isActive={selectedTool === 'pen'}
        strokeStyle={{ color: '#000000', width: 2 }}
      />
      
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
      

      
      <EraserTool
        stageRef={stageRef}
        isActive={selectedTool === 'eraser'}
        eraserConfig={eraserConfig}
      />

      {/* Selection tools */}
      <LassoTool
        stageRef={stageRef}
        isActive={selectedTool === 'lasso'}
      />
    </Layer>
  );
};

export default ToolLayer; 