// src/features/canvas/shapes/SectionShape.tsx
import React, { useMemo, useRef } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import Konva from 'konva';
import { SectionElement } from '../../../types/section';
import { designSystem } from '../../../styles/designSystem';
// Add performance optimization imports
import { useShapeCaching } from '../hooks/canvas/useShapeCaching';

interface SectionShapeProps {
  element: SectionElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate?: (id: string, updates: Partial<SectionElement>) => void;
  onStartTextEdit?: (elementId: string) => void;
  onSectionResize?: (sectionId: string, newWidth: number, newHeight: number) => void;
  children?: React.ReactNode;
}

/**
 * SectionShape - Simple section container component with performance optimizations
 * - Basic organizational containers with shape caching
 * - Supports titles, background colors, and corner radius
 * - Clean, minimal implementation with Konva optimizations
 */
export const SectionShape: React.FC<SectionShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
  onUpdate,
  onStartTextEdit,
  onSectionResize,
  children,
}) => {
  const titleTextRef = useRef<any>(null);

  // Apply shape caching for large or complex sections
  const { nodeRef } = useShapeCaching({
    element,
    cacheConfig: {
      enabled: true,
      complexityThreshold: 1, // Sections are always complex (container type)
      sizeThreshold: 50000, // Cache large sections
      forceCache: false
    },
    dependencies: [
      element.width, 
      element.height, 
      element.backgroundColor, 
      element.borderColor, 
      element.title,
      isSelected
    ]
  });

  // Calculate derived styles
  const sectionStyles = useMemo(() => ({
    width: element.width || 300,
    height: element.height || 200,
    backgroundColor: element.backgroundColor || 'rgba(59, 130, 246, 0.1)',
    borderColor: element.borderColor || '#3B82F6',
    borderWidth: element.borderWidth || 2,
    cornerRadius: element.cornerRadius || 8,
    titleBarHeight: element.titleBarHeight || 32,
    titleFontSize: element.titleFontSize || 14,
    titleColor: element.titleColor || '#1F2937',
    opacity: element.opacity || 1,
  }), [element]);

  // Selection styling
  const selectionStyle = useMemo(() => {
    const baseStyle = {
      stroke: isSelected ? designSystem.colors.primary[500] : sectionStyles.borderColor,
      strokeWidth: isSelected ? sectionStyles.borderWidth + 1 : sectionStyles.borderWidth,
    };

    if (isSelected) {
      return {
        ...baseStyle,
        shadowColor: designSystem.colors.primary[300],
        shadowBlur: 8,
        shadowOpacity: 0.3,
      };
    }

    return baseStyle;
  }, [isSelected, sectionStyles]);

  // Handle title double-click for editing
  const handleTitleDoubleClick = () => {
    if (onStartTextEdit && !element.isLocked) {
      onStartTextEdit(element.id);
    }
  };  // Handle resize operations
  const handleResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, direction: string) => {
    e.cancelBubble = true;

    const stage = e.target.getStage();
    if (!stage) return;

    const startPos = stage.getPointerPosition();
    if (!startPos) return;    const startWidth = sectionStyles.width;
    const startHeight = sectionStyles.height;

    const handleMouseMove = () => {
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;      let newWidth = startWidth;
      let newHeight = startHeight;

      const deltaX = pos.x - startPos.x;
      const deltaY = pos.y - startPos.y;

      switch (direction) {
        case 'se': // Bottom-right
          newWidth = Math.max(100, startWidth + deltaX);
          newHeight = Math.max(80, startHeight + deltaY);
          break;
        case 'sw': // Bottom-left
          newWidth = Math.max(100, startWidth - deltaX);
          newHeight = Math.max(80, startHeight + deltaY);
          break;
        case 'ne': // Top-right
          newWidth = Math.max(100, startWidth + deltaX);
          newHeight = Math.max(80, startHeight - deltaY);
          break;
        case 'nw': // Top-left
          newWidth = Math.max(100, startWidth - deltaX);
          newHeight = Math.max(80, startHeight - deltaY);
          break;
        case 'e': // Right
          newWidth = Math.max(100, startWidth + deltaX);
          break;
        case 'w': // Left
          newWidth = Math.max(100, startWidth - deltaX);
          break;
        case 's': // Bottom
          newHeight = Math.max(80, startHeight + deltaY);
          break;
        case 'n': // Top
          newHeight = Math.max(80, startHeight - deltaY);
          break;
      }      // ✅ Call onSectionResize directly during drag for real-time scaling
      if (onSectionResize) {
        onSectionResize(element.id, newWidth, newHeight);
      }
    };    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // The final state is already set by the last onSectionResize call during drag
      console.log('🎯 [SECTION RESIZE] Resize operation completed for section:', element.id);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle section controls
  const handleToggleLock = (e: any) => {
    e.cancelBubble = true;
    if (onUpdate) {
      onUpdate(element.id, { isLocked: !element.isLocked });
    }
  };

  const handleToggleVisibility = (e: any) => {
    e.cancelBubble = true;
    if (onUpdate) {
      onUpdate(element.id, { isHidden: !element.isHidden });
    }
  };  return (
    <Group
      ref={nodeRef}
      {...konvaProps}
      id={element.id}
      opacity={sectionStyles.opacity}
      visible={!element.isHidden}
      listening={!element.isLocked}
      clipX={0}
      clipY={0}
      clipWidth={sectionStyles.width}
      clipHeight={sectionStyles.height}
    >      {/* Main section background */}
      <Rect
        x={0}
        y={0}
        width={sectionStyles.width}
        height={sectionStyles.height}
        fill={sectionStyles.backgroundColor}
        cornerRadius={sectionStyles.cornerRadius}
        {...selectionStyle}
        listening={false} // 👈 *** CRITICAL FIX: Allow selection box events to pass through ***
        // Konva performance optimizations
        perfectDrawEnabled={false} // Disable perfect drawing for fill+stroke sections
        shadowForStrokeEnabled={false} // Disable shadow for stroke to prevent extra rendering pass
      />

      {/* Title bar */}
      <Rect
        x={0}
        y={0}
        width={sectionStyles.width}
        height={sectionStyles.titleBarHeight}
        fill="rgba(255, 255, 255, 0.8)"
        cornerRadius={[sectionStyles.cornerRadius, sectionStyles.cornerRadius, 0, 0]}
        stroke={selectionStyle.stroke}
        strokeWidth={0.5}
        // Konva performance optimizations
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        listening={false} // Title bar doesn't need interaction
      />

      {/* Section title */}
      <Text
        ref={titleTextRef}
        x={12}
        y={8}
        width={sectionStyles.width - 80}
        height={sectionStyles.titleBarHeight - 16}
        text={element.title || 'Untitled Section'}
        fontSize={sectionStyles.titleFontSize}
        fontFamily={designSystem.typography.fontFamily.sans}
        fontStyle="500"
        fill={sectionStyles.titleColor}
        align="left"
        verticalAlign="middle"
        ellipsis={true}
        listening={true}
        onDblClick={handleTitleDoubleClick}
        opacity={1}
      />

      {/* Section controls (when selected) */}
      {isSelected && (
        <Group x={sectionStyles.width - 70} y={4}>
          {/* Lock/Unlock Button */}
          <Group onClick={handleToggleLock}>
            <Rect
              x={0}
              y={0}
              width={24}
              height={24}
              fill={element.isLocked ? '#EF4444' : '#10B981'}
              cornerRadius={4}
              stroke={element.isLocked ? '#DC2626' : '#059669'}
              strokeWidth={1}
            />
            <Text
              x={0}
              y={6}
              width={24}
              height={12}
              text={element.isLocked ? '🔒' : '🔓'}
              fontSize={10}
              align="center"
              fill="white"
            />
          </Group>

          {/* Hide/Show Button */}
          <Group x={30} y={0} onClick={handleToggleVisibility}>
            <Rect
              x={0}
              y={0}
              width={24}
              height={24}
              fill={element.isHidden ? '#6B7280' : '#3B82F6'}
              cornerRadius={4}
              stroke={element.isHidden ? '#4B5563' : '#2563EB'}
              strokeWidth={1}
            />
            <Text
              x={0}
              y={6}
              width={24}
              height={12}              text={element.isHidden ? '👁‍🗨' : '👁'}
              fontSize={10}
              align="center"
              fill="white"
            />
          </Group>
        </Group>
      )}

      {/* Lock indicator on title bar */}
      {element.isLocked && (
        <Text
          x={sectionStyles.width - 32}
          y={8}
          width={20}
          height={sectionStyles.titleBarHeight - 16}
          text="🔒"
          fontSize={12}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      )}

      {/* Resize handles (when selected and not locked) */}
      {isSelected && !element.isLocked && (
        <>
          {/* Corner handles */}
          <Circle
            x={-8}
            y={-8}
            radius={6}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={3}
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'nw-resize';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />

          <Circle
            x={sectionStyles.width + 8}
            y={-8}
            radius={6}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={3}
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'ne-resize';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />

          <Circle
            x={-8}
            y={sectionStyles.height + 8}
            radius={6}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={3}
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'sw-resize';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />

          <Circle
            x={sectionStyles.width + 8}
            y={sectionStyles.height + 8}
            radius={6}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={3}
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'se-resize';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />

          {/* Edge handles */}
          <Circle
            x={sectionStyles.width / 2}
            y={-8}
            radius={5}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            onMouseDown={(e) => handleResizeStart(e, 'n')}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'n-resize';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />

          <Circle
            x={sectionStyles.width + 8}
            y={sectionStyles.height / 2}
            radius={5}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'e-resize';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />

          <Circle
            x={sectionStyles.width / 2}
            y={sectionStyles.height + 8}
            radius={5}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            onMouseDown={(e) => handleResizeStart(e, 's')}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 's-resize';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />

          <Circle
            x={-8}
            y={sectionStyles.height / 2}
            radius={5}
            fill={designSystem.colors.primary[500]}
            stroke="white"
            strokeWidth={2}
            onMouseDown={(e) => handleResizeStart(e, 'w')}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'w-resize';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />
        </>
      )}

      {children}
    </Group>
  );
});

SectionShape.displayName = 'SectionShape';
