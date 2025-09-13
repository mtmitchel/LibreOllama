import React from 'react';
import Konva from 'konva';

export interface ToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  connectorType?: 'line' | 'arrow'; // For ConnectorTool
}