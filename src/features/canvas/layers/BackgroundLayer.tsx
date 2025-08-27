import React, { useMemo } from 'react';
import { Group, Rect, Circle, Layer } from 'react-konva';
import Konva from 'konva';
import { CanvasElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { CanvasErrorBoundary } from '../components/CanvasErrorBoundary';

interface BackgroundLayerProps {
  width: number;
  height: number;
  elements?: CanvasElement[];
  onBackgroundClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

/**
 * BackgroundLayer - Renders FigJam-style dot grid background
 * - Clean background with subtle dot grid pattern
 * - Non-interactive grid elements (listening={false} for performance)
 * - Includes invisible background rect for deselection
 * - Uses design system colors and spacing
 */
export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  width,
  height,
  elements: _elements,
  onBackgroundClick
}) => {
  // Access viewport information for scale-aware rendering
  const viewport = useUnifiedCanvasStore(state => state.viewport);
  const scale = viewport.scale || 1;
  
  // Grid configuration using design system tokens
  const GRID_SIZE = 16; // Distance between dots in pixels - aligned with design system spacing
  const DOT_SIZE = 1; // Base dot radius in pixels
  const DOT_COLOR = 'var(--border-subtle, rgba(0, 0, 0, 0.08))'; // Use design system border color
  
  // Use default size if width/height are not available yet
  const canvasWidth = width || 1920;
  const canvasHeight = height || 1080;
  
  // Performance optimization: Hide dots when zoomed out too far
  const MIN_SCALE_FOR_DOTS = 0.3; // Hide dots below 30% zoom
  const shouldShowDots = scale >= MIN_SCALE_FOR_DOTS;
  
  // Calculate viewport bounds accounting for current pan/zoom
  const PADDING = GRID_SIZE * 10;
  
  // Calculate visible area in world coordinates
  const worldBounds = {
    left: (-viewport.x / scale) - PADDING,
    top: (-viewport.y / scale) - PADDING,
    right: (-viewport.x + canvasWidth) / scale + PADDING,
    bottom: (-viewport.y + canvasHeight) / scale + PADDING
  };
  
  // Generate dot grid positions optimized for current viewport
  const dots = useMemo(() => {
    if (!shouldShowDots) return []; // Skip generation if hidden
    
    const dotPositions = [];
    
    // Calculate grid start positions to align dots properly
    const gridStartX = Math.floor(worldBounds.left / GRID_SIZE) * GRID_SIZE;
    const gridStartY = Math.floor(worldBounds.top / GRID_SIZE) * GRID_SIZE;
    
    // Generate dots in a grid pattern (only in visible area)
    for (let x = gridStartX; x <= worldBounds.right; x += GRID_SIZE) {
      for (let y = gridStartY; y <= worldBounds.bottom; y += GRID_SIZE) {
        dotPositions.push({ x, y });
      }
    }
    
    return dotPositions;
  }, [shouldShowDots, worldBounds.left, worldBounds.top, worldBounds.right, worldBounds.bottom]);

  return (
    <CanvasErrorBoundary
      fallback={
        <Group name="background-error">
          <Rect
            x={0}
            y={0}
            width={canvasWidth || 1920}
            height={canvasHeight || 1080}
            fill="#f8f9fa"
          />
        </Group>
      }
      onError={(error) => {
        console.error('🛑 [BackgroundLayer] Grid rendering error:', error.message);
      }}
    >
      <Layer name="background-layer" listening={false}>
        {/* Design system aligned dot grid pattern - optimized with non-listening Layer */}
        {shouldShowDots && (
          <Group name="dot-grid" listening={false}>
            {dots.map((dot, index) => (
              <Circle
                key={`dot-${index}`}
                x={dot.x}
                y={dot.y}
                radius={DOT_SIZE}
                fill={DOT_COLOR}
                perfectDrawEnabled={false}
                listening={false}
                opacity={0.4}
              />
            ))}
          </Group>
        )}
      </Layer>
      
      {/* Interactive background rect stays in regular layer for event handling */}
      {onBackgroundClick && (
        <Group name="background-interactive">
          <Rect
            x={-10000}
            y={-10000}
            width={20000}
            height={20000}
            fill="transparent"
            name="background-rect"
            onClick={onBackgroundClick}
            listening={true}
          />
        </Group>
      )}
    </CanvasErrorBoundary>
  );
};
