/**
 * TriangleTool - FigJam-style triangle placement tool
 * Now using BaseShapeTool for consistent behavior
 */

import React from 'react';
import Konva from 'konva';
import { BaseShapeTool, TrianglePreview, createTriangleElement } from '../base';

interface TriangleToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const TriangleTool: React.FC<TriangleToolProps> = ({ stageRef, isActive }) => {
  return (
    <BaseShapeTool
      stageRef={stageRef}
      isActive={isActive}
      type="triangle"
      createShape={createTriangleElement}
      renderPreview={(position) => <TrianglePreview position={position} />}
      shouldStartTextEdit={true}
    />
  );
};
// Archived (2025-09-01): Legacy react-konva triangle tool.
