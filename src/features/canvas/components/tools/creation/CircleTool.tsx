/**
 * CircleTool - FigJam-style circle placement tool
 * Now using BaseShapeTool for consistent behavior
 */

import React from 'react';
import Konva from 'konva';
import { BaseShapeTool, CirclePreview, createCircleElement } from '../base';

interface CircleToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const CircleTool: React.FC<CircleToolProps> = ({ stageRef, isActive }) => {
  return (
    <BaseShapeTool
      stageRef={stageRef}
      isActive={isActive}
      type="circle"
      createShape={createCircleElement}
      renderPreview={(position) => <CirclePreview position={position} />}
      shouldStartTextEdit={true}
    />
  );
};