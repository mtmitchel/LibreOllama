/**
 * SectionPreview Component - Live preview for section drawing
 * 
 * Updated to use store-based draftSection state for real-time updates.
 * Provides immediate visual feedback during section creation.
 */

import React from 'react';
import { Rect } from 'react-konva';
import { useUnifiedCanvasStore } from '../../stores/unifiedCanvasStore';

interface SectionPreviewProps {
  // Legacy props kept for backward compatibility but not used
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
}

export const SectionPreview: React.FC<SectionPreviewProps> = () => {
  // Use store-based draft section instead of props
  const draftSection = useUnifiedCanvasStore(state => state.draftSection);
  
  if (!draftSection) {
    return null;
  }
  
  return (
    <Rect
      x={draftSection.x}
      y={draftSection.y}
      width={draftSection.width}
      height={draftSection.height}
      fill="rgba(99, 102, 241, 0.1)" // Semi-transparent blue
      stroke="#6366F1" // Blue border
      strokeWidth={2}
      dash={[5, 5]} // Dashed border for preview effect
      opacity={0.7}
      listening={false} // Don't intercept mouse events
    />
  );
};
