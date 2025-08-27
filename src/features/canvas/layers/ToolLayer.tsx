/**
 * ToolLayer - Manages all interactive drawing and selection tools
 * This layer sits on top of the canvas and handles tool-specific interactions
 */

import React from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { MarkerTool } from '../components/tools/drawing/MarkerTool';
import { HighlighterTool } from '../components/tools/drawing/HighlighterTool';
import { EraserTool } from '../components/tools/drawing/EraserTool';

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
import { CanvasErrorBoundary } from '../components/CanvasErrorBoundary';

interface ToolLayerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

/**
 * ToolLayer - Renders drawing and selection tool visualizations
 * Delegated from CanvasLayerManager which handles the overall structure.
 * Responsible for rendering tool-specific overlays and interactions.
 */
export const ToolLayer: React.FC<ToolLayerProps> = ({ stageRef }) => {
  // OPTIMIZED: Consolidated store subscriptions using useShallow
  const {
    selectedTool,
    strokeConfig,
    addElement,
    setSelectedTool
  } = useUnifiedCanvasStore(useShallow((state) => ({
    selectedTool: state.selectedTool,
    strokeConfig: state.strokeConfig,
    addElement: state.addElement,
    setSelectedTool: state.setSelectedTool
  })));
  
  const renderToolComponent = () => {
    switch (selectedTool) {
      case 'pen':
        return <PenTool stageRef={stageRef} isActive={true} />;
      case 'marker':
        return <MarkerTool stageRef={stageRef} isActive={true} strokeStyle={{
          color: strokeConfig.marker.color,
          width: strokeConfig.marker.maxWidth || 8,
          opacity: strokeConfig.marker.opacity,
          smoothness: strokeConfig.marker.smoothness,
          lineCap: 'round',
          lineJoin: 'round'
        }} />;
      case 'highlighter':
        return <HighlighterTool stageRef={stageRef} isActive={true} strokeStyle={{
          color: strokeConfig.highlighter.color,
          width: strokeConfig.highlighter.width,
          opacity: strokeConfig.highlighter.opacity,
          blendMode: strokeConfig.highlighter.blendMode || 'multiply'
        }} />;
      case 'eraser':
        return <EraserTool stageRef={stageRef} isActive={true} eraserConfig={strokeConfig.eraser} />;
      
      case 'text':
        return <TextTool stageRef={stageRef} isActive={true} />;
      case 'draw-rectangle':
        return <RectangleTool stageRef={stageRef} isActive={true} />;
      case 'draw-circle':
        return <CircleTool stageRef={stageRef} isActive={true} />;
      case 'draw-triangle':
        return <TriangleTool stageRef={stageRef} isActive={true} />;
      case 'sticky-note':
        return <StickyNoteTool stageRef={stageRef} isActive={true} />;
      case 'section':
        return <SectionTool stageRef={stageRef} isActive={true} />;
      case 'table':
        return <TableTool stageRef={stageRef} isActive={true} />;
      case 'pan':
        return <PanTool stageRef={stageRef} isActive={true} />;
      case 'mindmap':
        return <MindmapTool stageRef={stageRef} isActive={true} />;
      case 'connector-line':
        return <ConnectorTool stageRef={stageRef} isActive={true} connectorType="line" />;
      case 'connector-arrow':
        return <ConnectorTool stageRef={stageRef} isActive={true} connectorType="arrow" />;
      default:
        return null;
    }
  };

  return (
    <CanvasErrorBoundary
      fallback={null} // Tool layer errors are non-critical
      onError={(error) => {
        console.warn('⚠️ [ToolLayer] Tool rendering error:', {
          error: error.message,
          selectedTool
        });
      }}
    >
      <Layer>
        {renderToolComponent()}
      </Layer>
    </CanvasErrorBoundary>
  );
};

ToolLayer.displayName = 'ToolLayer';

export default ToolLayer; 