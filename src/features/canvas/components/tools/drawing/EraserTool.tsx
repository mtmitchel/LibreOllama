/**
 * EraserTool - Canvas eraser tool implementation
 */

import React, { useCallback } from 'react';
import Konva from 'konva';

interface EraserToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const EraserTool: React.FC<EraserToolProps> = ({ stageRef, isActive }) => {
  // Placeholder implementation for EraserTool
  // TODO: Implement eraser functionality
  
  return null; // No JSX needed for imperative tools
};