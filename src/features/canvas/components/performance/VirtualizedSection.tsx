import React, { useMemo } from 'react';
import { Text } from 'react-konva';
import { SectionElement, CanvasElement, isPenElement } from '../../types/enhanced.types';
import { useCanvasStore } from '../../stores/canvasStore.enhanced';

interface VirtualizedSectionProps {
  section: SectionElement;
  children: CanvasElement[];
  forceRender?: boolean;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const VIRTUALIZATION_THRESHOLD = 100;
const OVERSCAN = 20;

// Check if two bounds intersect
const intersects = (a: Bounds, b: Bounds): boolean => {
  return !(
    a.x > b.x + b.width ||
    a.x + a.width < b.x ||
    a.y > b.y + b.height ||
    a.y + a.height < b.y
  );
};

// Get element bounds for intersection testing
const getElementBounds = (element: CanvasElement): Bounds => {
  const bounds: Bounds = {
    x: element.x,
    y: element.y,
    width: 0,
    height: 0
  };

  switch (element.type) {
    case 'rectangle':
    case 'section':
    case 'table':
      bounds.width = element.width || 100;
      bounds.height = element.height || 100;
      break;
    case 'circle':
      const radius = element.radius || 50;
      bounds.width = radius * 2;
      bounds.height = radius * 2;
      bounds.x -= radius;
      bounds.y -= radius;
      break;
    case 'text':
    case 'sticky-note':
      bounds.width = element.width || 200;
      bounds.height = element.height || 50;
      break;
    case 'connector':
      // For connectors, use startPoint and endPoint
      if (element.startPoint && element.endPoint) {
        const minX = Math.min(element.startPoint.x, element.endPoint.x);
        const maxX = Math.max(element.startPoint.x, element.endPoint.x);
        const minY = Math.min(element.startPoint.y, element.endPoint.y);
        const maxY = Math.max(element.startPoint.y, element.endPoint.y);
        bounds.x = minX;
        bounds.y = minY;
        bounds.width = maxX - minX;
        bounds.height = maxY - minY;
      } else {
        bounds.width = 100;
        bounds.height = 100;
      }
      break;
    case 'pen':
      // For pen elements, use points array
      if (isPenElement(element) && element.points && element.points.length >= 2) {
        const xs = element.points.filter((_, i: number) => i % 2 === 0);
        const ys = element.points.filter((_, i: number) => i % 2 === 1);
        bounds.x = Math.min(...xs);
        bounds.y = Math.min(...ys);
        bounds.width = Math.max(...xs) - bounds.x;
        bounds.height = Math.max(...ys) - bounds.y;
      } else {
        bounds.width = 50;
        bounds.height = 50;
      }
      break;
    case 'triangle':
    case 'star':
      // For these elements, we'll need to check their specific properties
      bounds.width = 100;
      bounds.height = 100;
      break;
    default:
      bounds.width = 100;
      bounds.height = 100;
  }

  return bounds;
};

/**
 * VirtualizedSection - Optimizes rendering of sections with many children
 * Only renders elements that are visible in the current viewport
 */
export const VirtualizedSection: React.FC<VirtualizedSectionProps> = ({
  section,
  children,
  forceRender = false
}) => {
  const viewportBounds = useCanvasStore(state => state.viewportBounds);

  // If below threshold or forced, render all children normally
  if (children.length <= VIRTUALIZATION_THRESHOLD || forceRender) {
    return (
      <>
        {children.map(child => {
          // Create a simple renderer component for virtualized section
          const SimpleElementRenderer: React.FC<{ element: CanvasElement }> = ({ element }) => {
            // For now, use a basic implementation - this would need to be expanded
            // to use the full renderElement function with proper props
            return (
              <Text
                key={element.id}
                x={element.x}
                y={element.y}
                text={`${element.type}:${element.id.slice(0, 8)}`}
                fontSize={12}
                fill="#666"
              />
            );
          };
          
          return <SimpleElementRenderer key={child.id} element={child} />;
        })}
      </>
    );
  }

  // Calculate section bounds with overscan for better UX
  const sectionBounds = useMemo((): Bounds => ({
    x: section.x - OVERSCAN,
    y: section.y - OVERSCAN,
    width: section.width + OVERSCAN * 2,
    height: section.height + OVERSCAN * 2
  }), [section.x, section.y, section.width, section.height]);

  // Filter visible children based on viewport intersection
  const visibleChildren = useMemo(() => {
    if (!viewportBounds) return children;

    // Convert viewport bounds to our Bounds interface
    const viewport: Bounds = {
      x: viewportBounds.left,
      y: viewportBounds.top,
      width: viewportBounds.right - viewportBounds.left,
      height: viewportBounds.bottom - viewportBounds.top
    };

    // Combine section bounds with viewport for intersection testing
    const effectiveBounds: Bounds = {
      x: Math.max(sectionBounds.x, viewport.x),
      y: Math.max(sectionBounds.y, viewport.y),
      width: Math.min(
        sectionBounds.x + sectionBounds.width,
        viewport.x + viewport.width
      ) - Math.max(sectionBounds.x, viewport.x),
      height: Math.min(
        sectionBounds.y + sectionBounds.height,
        viewport.y + viewport.height
      ) - Math.max(sectionBounds.y, viewport.y)
    };

    return children.filter(child => {
      const childBounds = getElementBounds(child);
      
      // Adjust child bounds to absolute coordinates
      const absoluteChildBounds: Bounds = {
        x: childBounds.x + section.x,
        y: childBounds.y + section.y,
        width: childBounds.width,
        height: childBounds.height
      };

      return intersects(absoluteChildBounds, effectiveBounds);
    });
  }, [children, sectionBounds, viewportBounds]);

  // Performance monitoring (only in development)
  if (process.env.NODE_ENV === 'development') {
    const renderRatio = visibleChildren.length / children.length;
    if (renderRatio < 0.5) {
      console.debug(
        `VirtualizedSection: Rendering ${visibleChildren.length}/${children.length} elements (${Math.round(renderRatio * 100)}%)`
      );
    }
  }

  return (
    <>
      {visibleChildren.map(child => {
        // Create a simple renderer component for virtualized section
        const SimpleElementRenderer: React.FC<{ element: CanvasElement }> = ({ element }) => {
          // For now, use a basic implementation - this would need to be expanded
          // to use the full renderElement function with proper props
          return (
            <Text
              key={element.id}
              x={element.x}
              y={element.y}
              text={`${element.type}:${element.id.slice(0, 8)}`}
              fontSize={12}
              fill="#666"
            />
          );
        };
        
        return <SimpleElementRenderer key={child.id} element={child} />;
      })}
      
      {/* Show virtualization indicator in development */}
      {process.env.NODE_ENV === 'development' && children.length > VIRTUALIZATION_THRESHOLD && (
        <Text
          x={5}
          y={section.height - 20}
          text={`Virtualized: ${visibleChildren.length}/${children.length} visible`}
          fontSize={10}
          fill="#999"
          opacity={0.7}
          listening={false}
        />
      )}    </>
  );
};

export default VirtualizedSection;
