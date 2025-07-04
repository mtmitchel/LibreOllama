// src/features/canvas/components/tools/base/types.ts
/**
 * Base types and interfaces for shape creation tools
 * Provides common type definitions for all shape tools
 */

import React from 'react';
import Konva from 'konva';
import { CanvasElement, ElementId } from '../../../types/enhanced.types';

export interface Vector2d {
  x: number;
  y: number;
}

export interface BaseShapeToolProps<T extends CanvasElement> {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  type: T['type'];
  createShape: (position: Vector2d) => T;
  renderPreview: (position: Vector2d) => React.JSX.Element;
  defaultSize?: { width: number; height: number };
  shouldStartTextEdit?: boolean;
}

export interface ShapeToolState {
  showPlacementGuide: boolean;
  cursorPosition: Vector2d | null;
}

export interface ShapeCreationOptions {
  position: Vector2d;
  autoStartTextEdit?: boolean;
  defaultText?: string;
}
