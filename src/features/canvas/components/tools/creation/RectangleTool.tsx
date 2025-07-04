/**
 * RectangleTool - FigJam-style rectangle placement tool
 * Now using BaseShapeTool for consistent behavior
 */

import React from 'react';
import Konva from 'konva';
import { BaseShapeTool, RectanglePreview, createRectangleElement } from '../base';

interface RectangleToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const RectangleTool: React.FC<RectangleToolProps> = ({ stageRef, isActive }) => {
  return (
    <BaseShapeTool
      stageRef={stageRef}
      isActive={isActive}
      type="rectangle"
      createShape={createRectangleElement}
      renderPreview={(position) => <RectanglePreview position={position} />}
      shouldStartTextEdit={true}
    />
  );
};
