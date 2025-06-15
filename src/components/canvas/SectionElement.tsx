import React, { useState, useEffect, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { SectionElement as SectionType } from '../../types/section';
import { designSystem } from '../../styles/designSystem';

interface SectionElementProps {
  section: SectionType;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<SectionType>) => void;
  onSelect: (id: string) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, id: string) => void;
  isDraggable: boolean;
  // Add these props for proper element rendering
  elements: Record<string, any>;
  renderElement: (element: any) => React.ReactNode;
}

const SectionElement: React.FC<SectionElementProps> = ({
  section,
  isSelected,
  onUpdate,
  onSelect,
  onDragEnd,
  isDraggable,
  elements,
  renderElement
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title || '');
  const titleTextRef = useRef<Konva.Text>(null);
  const groupRef = useRef<Konva.Group>(null);

  const titleFontSize = section.titleFontSize || 13;
  const titleColor = section.titleColor || '#FFFFFF';
  
  // Modern section design values
  const sectionBorderColor = '#2563EB'; // Blue-600
  const sectionBackgroundColor = '#FFFFFF';
  const titlePillColor = '#2563EB'; // Blue-600
  const titlePillHeight = 24;
  const titlePillPadding = 12;

  // Handle double-click on title to edit
  const handleTitleDoubleClick = () => {
    setIsEditingTitle(true);
    setEditTitle(section.title || '');
  };

  // Handle title edit completion
  const handleTitleSubmit = () => {
    if (editTitle.trim() !== section.title) {
      onUpdate(section.id, { title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  // Create HTML input overlay for title editing
  useEffect(() => {
    if (isEditingTitle && titleTextRef.current) {
      const textNode = titleTextRef.current;
      const stage = textNode.getStage();
      if (!stage) return;

      const textPosition = textNode.getAbsolutePosition();
      const stageContainer = stage.container();
      const containerRect = stageContainer.getBoundingClientRect();

      // Create input element
      const input = document.createElement('input');
      input.type = 'text';
      input.value = editTitle;
      input.style.position = 'fixed';
      input.style.left = `${containerRect.left + textPosition.x}px`;
      input.style.top = `${containerRect.top + textPosition.y}px`;
      input.style.width = `${Math.max(120, section.title ? section.title.length * (titleFontSize * 0.6) : 80)}px`;
      input.style.fontSize = `${titleFontSize}px`;
      input.style.fontFamily = designSystem.typography.fontFamily.sans;
      input.style.fontWeight = '600';
      input.style.color = titleColor;
      input.style.background = titlePillColor;
      input.style.border = 'none';
      input.style.borderRadius = `${titlePillHeight / 2}px`;
      input.style.padding = `${(titlePillHeight - titleFontSize) / 2}px ${titlePillPadding}px`;
      input.style.outline = 'none';
      input.style.zIndex = '1000';

      // Handle input events
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const currentValue = (e.target as HTMLInputElement).value;
          setEditTitle(currentValue);
          if (currentValue.trim() !== section.title) {
            onUpdate(section.id, { title: currentValue.trim() });
          }
          setIsEditingTitle(false);
        } else if (e.key === 'Escape') {
          setEditTitle(section.title || '');
          setIsEditingTitle(false);
        }
      };

      const handleBlur = () => {
        handleTitleSubmit();
      };

      input.addEventListener('keydown', handleKeyDown);
      input.addEventListener('blur', handleBlur);
      input.addEventListener('input', (e) => {
        const val = (e.target as HTMLInputElement).value;
        setEditTitle(val);
      });

      document.body.appendChild(input);
      input.focus();
      input.select();

      // Cleanup
      return () => {
        input.removeEventListener('keydown', handleKeyDown);
        input.removeEventListener('blur', handleBlur);
        document.body.removeChild(input);
      };
    }
  }, [isEditingTitle, titleFontSize, titleColor, section]);

  // Handle section drag
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Optionally show visual feedback during drag
    const node = e.target;
    node.opacity(0.8);
  };

  const handleDragEndInternal = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    node.opacity(section.opacity || 1);
    
    // Call the drag end handler with the section ID
    onDragEnd(e, section.id);
  };

  // Handle section selection - FIXED: Always select section on any click
  const handleSectionClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Check what we're clicking on
    const targetType = e.target.getType?.();
    const targetName = e.target.name?.() || '';
    
    // If clicking on child canvas elements (Circle, Line, etc.), use double-click to select section
    const isChildCanvasElement = ['Circle', 'Line', 'Star', 'Shape'].includes(targetType) &&
                                !targetName.includes('section');
    
    if (isChildCanvasElement) {
      // Double-click to select section when clicking on child elements
      if (e.evt && e.evt.detail === 2) {
        e.cancelBubble = true;
        onSelect(section.id);
      }
      // Single click on child elements - let them handle selection
      return;
    }
    
    // For all other clicks (section background, title, etc.) - select section
    e.cancelBubble = true;
    onSelect(section.id);
  };

  // Don't render if hidden
  if (section.isHidden) {
    return null;
  }

  return (
    <Group
      ref={groupRef}
      id={section.id}
      x={section.x}
      y={section.y}
      draggable={isDraggable && !section.isLocked}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEndInternal}
      opacity={section.opacity || 1}
    >
      {/* Invisible clickable area for easier section selection */}
      <Rect
        x={-10}
        y={-10}
        width={section.width + 20}
        height={section.height + 20}
        fill="transparent"
        listening={true}
        name="section-clickable-area"
        onClick={handleSectionClick}
      />

      {/* Section Background - Modern white with blue border */}
      <Rect
        x={0}
        y={0}
        width={section.width}
        height={section.height}
        fill={sectionBackgroundColor}
        stroke={sectionBorderColor}
        strokeWidth={2}
        cornerRadius={8}
        listening={true}
        name="section-background"
        // Add shadow for selected sections
        shadowColor={isSelected ? sectionBorderColor : 'rgba(0, 0, 0, 0.1)'}
        shadowBlur={isSelected ? 12 : 4}
        shadowOpacity={isSelected ? 0.4 : 0.1}
        shadowOffsetX={0}
        shadowOffsetY={isSelected ? 4 : 2}
      />

      {/* Title Pill Badge */}
      <Group x={16} y={16}>
        <Rect
          x={0}
          y={0}
          width={section.title ? (section.title.length * (titleFontSize * 0.6)) + (titlePillPadding * 2) : 80}
          height={titlePillHeight}
          fill={titlePillColor}
          cornerRadius={titlePillHeight / 2} // Perfect pill shape
          shadowColor="rgba(0, 0, 0, 0.1)"
          shadowBlur={2}
          shadowOpacity={0.3}
          shadowOffsetX={0}
          shadowOffsetY={1}
        />
        
        {/* Section Title */}
        <Text
          ref={titleTextRef}
          x={titlePillPadding}
          y={(titlePillHeight - titleFontSize) / 2 + 1} // Center vertically
          text={section.title || 'Section'}
          fontSize={titleFontSize}
          fontFamily={designSystem.typography.fontFamily.sans}
          fill={titleColor}
          fontStyle="600" // Semi-bold
          onDblClick={handleTitleDoubleClick}
          listening={true}
          opacity={isEditingTitle ? 0 : 1}
        />
      </Group>

      {/* Section Controls (visible when selected) - positioned in top-right */}
      {isSelected && (
        <Group x={section.width - 80} y={12}>
          {/* Lock/Unlock Button */}
          <Group
            x={0}
            y={0}
            onClick={(e) => {
              e.cancelBubble = true;
              onUpdate(section.id, { isLocked: !section.isLocked });
            }}
          >
            <Rect
              x={0}
              y={0}
              width={28}
              height={28}
              fill="rgba(255, 255, 255, 0.95)"
              cornerRadius={6}
              stroke={sectionBorderColor}
              strokeWidth={1}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={2}
              shadowOpacity={0.3}
              shadowOffsetX={0}
              shadowOffsetY={1}
            />
            <Text
              x={6}
              y={8}
              text={section.isLocked ? '🔒' : '🔓'}
              fontSize={12}
              align="center"
              width={16}
            />
          </Group>

          {/* Hide/Show Button */}
          <Group
            x={36}
            y={0}
            onClick={(e) => {
              e.cancelBubble = true;
              onUpdate(section.id, { isHidden: !section.isHidden });
            }}
          >
            <Rect
              x={0}
              y={0}
              width={28}
              height={28}
              fill="rgba(255, 255, 255, 0.95)"
              cornerRadius={6}
              stroke={sectionBorderColor}
              strokeWidth={1}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={2}
              shadowOpacity={0.3}
              shadowOffsetX={0}
              shadowOffsetY={1}
            />
            <Text
              x={6}
              y={8}
              text="👁"
              fontSize={12}
              align="center"
              width={16}
            />
          </Group>
        </Group>
      )}

      {/* Content area - subtle visual guide for empty sections */}
      {section.containedElementIds.length === 0 && (
        <Group x={24} y={56}>
          <Text
            x={0}
            y={0}
            text="Drop content here..."
            fontSize={12}
            fontFamily={designSystem.typography.fontFamily.sans}
            fill="#94A3B8" // Gray-400
            fontStyle="italic"
            opacity={0.6}
            listening={false}
          />
        </Group>
      )}

      {/* Render contained elements as direct Group children */}
      {section.containedElementIds.map(elementId => {
        const element = elements[elementId];
        if (!element) {
          console.log('🔍 [SECTION DEBUG] Missing element in section:', elementId, 'from section:', section.id);
          return null;
        }
        
        console.log('🔍 [SECTION DEBUG] Rendering child element:', {
          elementId,
          elementType: element.type,
          elementPosition: { x: element.x, y: element.y },
          elementSectionId: element.sectionId,
          sectionId: section.id
        });
        
        // With the new coordinate system, elements with sectionId already use relative coordinates
        // No conversion needed - just render them directly
        return renderElement(element);
      })}
    </Group>
  );
};

export default SectionElement;
