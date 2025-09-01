// src/features/canvas/components/tools/base/types.ts
/**
 * Base types and interfaces for shape creation tools
 * Provides common type definitions for all shape tools
 */

import React from 'react';
import Konva from 'konva';
import { CanvasElement, ElementId, SectionElement } from '../../../types/enhanced.types';

export interface Vector2d {
  x: number;
  y: number;
}

export interface BaseShapeToolProps<T extends Exclude<CanvasElement, SectionElement>> {
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

// BaseCreationTool types for heavy creation tools
export interface BaseCreationToolProps<T extends CanvasElement> {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  type: T['type'];
  // Creation methods
  onCreate: (position: Vector2d, ...args: any[]) => T;
  onCreated?: (element: T) => void;
  // Preview and UI
  renderPreview: (position: Vector2d, showGuide: boolean, startPos?: Vector2d, endPos?: Vector2d) => React.JSX.Element | null;
  renderCursor?: (position: Vector2d) => React.JSX.Element;
  // Behavior customization
  requiresDrag?: boolean;
  minDragDistance?: number;
  shouldSwitchToSelect?: boolean;
  shouldStartTextEdit?: boolean;
  // Event customization
  onPointerMove?: (e: Konva.KonvaEventObject<PointerEvent>, position: Vector2d) => void;
  onPointerDown?: (e: Konva.KonvaEventObject<PointerEvent>, position: Vector2d) => boolean; // Return true to prevent default
  onPointerUp?: (e: Konva.KonvaEventObject<PointerEvent>, position: Vector2d) => void;
}

export interface CreationToolState {
  showPlacementGuide: boolean;
  cursorPosition: Vector2d | null;
  isCreating: boolean;
  startPosition: Vector2d | null;
  currentEndPosition: Vector2d | null;
}
// Archived (2025-09-01)
