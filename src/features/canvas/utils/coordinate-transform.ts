/**
 * Coordinate Transformation Utilities (standardized filename kebab-case)
 * Provides unified coordinate calculations accounting for pan/zoom/rotation
 */

import Konva from 'konva';

export interface StageTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface ScreenPosition {
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize?: number;
}

/**
 * Calculate screen coordinates for a DOM element positioning
 * Accounts for all stage transformations: pan, zoom, and rotation
 */
export const calculateScreenCoordinates = (
  stage: Konva.Stage,
  node: Konva.Node,
  options?: {
    includeRotation?: boolean;
    baseFontSize?: number;
  }
): ScreenPosition | null => {
  if (!stage || !node) {
    return null;
  }

  const { includeRotation = true, baseFontSize } = options || {};

  try {
    // Get the actual rendered bounds of the node
    const nodeBounds = node.getClientRect();
    
    // Get stage container position in viewport
    const stageContainer = stage.container();
    if (!stageContainer) {
      return null;
    }
    
    const stageBox = stageContainer.getBoundingClientRect();
    
    // Get stage transformation attributes
    const stageAttrs = stage.attrs;
    const stageTransform: StageTransform = {
      x: stageAttrs.x || 0,
      y: stageAttrs.y || 0,
      scaleX: stageAttrs.scaleX || 1,
      scaleY: stageAttrs.scaleY || 1,
      rotation: stageAttrs.rotation || 0
    };

    // Calculate base screen position without rotation
    let screenX = stageBox.left + (nodeBounds.x - stageTransform.x) * stageTransform.scaleX;
    let screenY = stageBox.top + (nodeBounds.y - stageTransform.y) * stageTransform.scaleY;
    
    // Apply rotation if enabled and stage has rotation
    if (includeRotation && stageTransform.rotation !== 0) {
      const centerX = stageBox.left + stageBox.width / 2;
      const centerY = stageBox.top + stageBox.height / 2;
      
      // Rotate coordinates around stage center
      const rotationRad = (stageTransform.rotation * Math.PI) / 180;
      const dx = screenX - centerX;
      const dy = screenY - centerY;
      
      screenX = centerX + dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad);
      screenY = centerY + dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);
    }

    // Calculate scaled dimensions
    const scaledWidth = nodeBounds.width * stageTransform.scaleX;
    const scaledHeight = nodeBounds.height * stageTransform.scaleY;

    // Calculate effective font size if base font size provided
    let effectiveFontSize: number | undefined;
    if (baseFontSize) {
      // Use average scale for font size to maintain readability
      const avgScale = (stageTransform.scaleX + stageTransform.scaleY) / 2;
      effectiveFontSize = baseFontSize * avgScale;
    }

    return {
      left: screenX,
      top: screenY,
      width: scaledWidth,
      height: scaledHeight,
      fontSize: effectiveFontSize
    };

  } catch (error) {
    console.warn('Error calculating screen coordinates:', error);
    return null;
  }
};

/**
 * Transform canvas coordinates to screen coordinates
 * Useful for positioning DOM elements relative to canvas elements
 */
export const canvasToScreen = (
  stage: Konva.Stage,
  canvasX: number,
  canvasY: number
): { x: number; y: number } | null => {
  if (!stage) {
    return null;
  }

  try {
    const stageContainer = stage.container();
    if (!stageContainer) {
      return null;
    }

    const stageBox = stageContainer.getBoundingClientRect();
    const stageAttrs = stage.attrs;
    
    const stageTransform: StageTransform = {
      x: stageAttrs.x || 0,
      y: stageAttrs.y || 0,
      scaleX: stageAttrs.scaleX || 1,
      scaleY: stageAttrs.scaleY || 1,
      rotation: stageAttrs.rotation || 0
    };

    // Apply stage transformations
    let screenX = stageBox.left + (canvasX - stageTransform.x) * stageTransform.scaleX;
    let screenY = stageBox.top + (canvasY - stageTransform.y) * stageTransform.scaleY;

    // Apply rotation if stage has rotation
    if (stageTransform.rotation !== 0) {
      const centerX = stageBox.left + stageBox.width / 2;
      const centerY = stageBox.top + stageBox.height / 2;
      
      const rotationRad = (stageTransform.rotation * Math.PI) / 180;
      const dx = screenX - centerX;
      const dy = screenY - centerY;
      
      screenX = centerX + dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad);
      screenY = centerY + dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);
    }

    return { x: screenX, y: screenY };

  } catch (error) {
    console.warn('Error transforming canvas to screen coordinates:', error);
    return null;
  }
};

/**
 * Transform screen coordinates to canvas coordinates
 * Useful for handling mouse events and positioning canvas elements
 */
export const screenToCanvas = (
  stage: Konva.Stage,
  screenX: number,
  screenY: number
): { x: number; y: number } | null => {
  if (!stage) {
    return null;
  }

  try {
    const stageContainer = stage.container();
    if (!stageContainer) {
      return null;
    }

    const stageBox = stageContainer.getBoundingClientRect();
    const stageAttrs = stage.attrs;
    
    const stageTransform: StageTransform = {
      x: stageAttrs.x || 0,
      y: stageAttrs.y || 0,
      scaleX: stageAttrs.scaleX || 1,
      scaleY: stageAttrs.scaleY || 1,
      rotation: stageAttrs.rotation || 0
    };

    // Convert screen coordinates to stage coordinates
    let relativeX = screenX - stageBox.left;
    let relativeY = screenY - stageBox.top;

    // Apply inverse rotation if stage has rotation
    if (stageTransform.rotation !== 0) {
      const centerX = stageBox.width / 2;
      const centerY = stageBox.height / 2;
      
      const rotationRad = (-stageTransform.rotation * Math.PI) / 180; // Inverse rotation
      const dx = relativeX - centerX;
      const dy = relativeY - centerY;
      
      relativeX = centerX + dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad);
      relativeY = centerY + dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);
    }

    // Apply inverse scale and translation
    const canvasX = (relativeX / stageTransform.scaleX) + stageTransform.x;
    const canvasY = (relativeY / stageTransform.scaleY) + stageTransform.y;

    return { x: canvasX, y: canvasY };

  } catch (error) {
    console.warn('Error transforming screen to canvas coordinates:', error);
    return null;
  }
};
