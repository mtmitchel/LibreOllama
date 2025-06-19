import React, { useState, useEffect, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { SectionElement as SectionType } from '../../../types/section';
import { designSystem } from '../../../styles/designSystem';

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

const SectionElement = React.forwardRef<Konva.Group, SectionElementProps>(
  ({ section, isSelected, onUpdate, onSelect, onDragEnd, isDraggable, elements, renderElement }, ref) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title || '');
  const titleTextRef = useRef<Konva.Text>(null);

  const titleBarHeight = section.titleBarHeight || 40;
  const titleFontSize = section.titleFontSize || 14;
  const titleColor = section.titleColor || '#FFFFFF';

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
      input.style.width = `${section.width - 20}px`;
      input.style.fontSize = `${titleFontSize}px`;
      input.style.fontFamily = designSystem.typography.fontFamily.sans;
      input.style.color = designSystem.colors.secondary[800];
      input.style.background = designSystem.colors.secondary[100];
      input.style.border = '1px solid ' + designSystem.colors.secondary[300];
      input.style.borderRadius = '4px';
      input.style.padding = '2px 4px';
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
    // Return undefined when not editing title
    return undefined;
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
    
    // Call the drag end handler with the section ID and new position
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
      ref={ref}
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

      {/* Drop shadow for depth */}
      <Rect
        x={0}
        y={4}
        width={section.width}
        height={section.height}
        fill="rgba(0, 0, 0, 0.1)"
        cornerRadius={designSystem.borderRadius.lg}
        shadowBlur={12}
        shadowOffsetX={0}
        shadowOffsetY={4}
        listening={false}
      />

      {/* Main body background - Enhanced styling for better distinction */}
      <Rect
        x={0}
        y={0}
        width={section.width}
        height={section.height}
        fill="rgba(248, 250, 252, 0.6)" // Very subtle background tint (slate-50 with opacity)
        stroke={isSelected ? designSystem.colors.primary[500] : designSystem.colors.secondary[300]}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={designSystem.borderRadius.lg}
        listening={true}
        name="section-background"
        shadowColor={designSystem.colors.secondary[400]}
        shadowBlur={8}
        shadowOffset={{ x: 0, y: 2 }}
        shadowOpacity={0.1}
      />

      {/* Header bar background - More distinct styling */}
      <Rect
        x={0}
        y={0}
        width={section.width}
        height={titleBarHeight}
        fill="rgba(241, 245, 249, 0.8)" // Slightly darker than background (slate-100 with opacity)
        stroke={designSystem.colors.secondary[200]}
        strokeWidth={1}
        cornerRadius={[designSystem.borderRadius.lg, designSystem.borderRadius.lg, 0, 0]}
        listening={true}
        name="section-header"
      />

      {/* Section Title */}
      <Text
        ref={titleTextRef}
        x={10}
        y={(titleBarHeight - titleFontSize) / 2} // Vertically center in 40px header
        text={section.title || 'Section'}
        fontSize={titleFontSize}
        fontFamily={designSystem.typography.fontFamily.sans}
        fill={designSystem.colors.secondary[800]}
        fontStyle="bold"
        onDblClick={handleTitleDoubleClick}
        listening={true}
        width={section.width - 100} // Leave space for controls
        ellipsis={true}
        opacity={isEditingTitle ? 0 : 1}
      />

      {/* Section Controls (visible when selected) */}
      {isSelected && (
        <Group x={section.width - 70} y={8}>
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
              width={24}
              height={24}
              fill={designSystem.colors.secondary[200]}
              cornerRadius={4}
              stroke={designSystem.colors.secondary[300]}
              strokeWidth={1}
            />
            <Text
              x={4}
              y={6}
              text={section.isLocked ? '🔒' : '🔓'}
              fontSize={12}
              align="center"
              width={16}
            />
          </Group>

          {/* Hide/Show Button */}
          <Group
            x={30}
            y={0}
            onClick={(e) => {
              e.cancelBubble = true;
              onUpdate(section.id, { isHidden: !section.isHidden });
            }}
          >
            <Rect
              x={0}
              y={0}
              width={24}
              height={24}
              fill={designSystem.colors.secondary[200]}
              cornerRadius={4}
              stroke={designSystem.colors.secondary[300]}
              strokeWidth={1}
            />
            <Text
              x={4}
              y={6}
              text="👁"
              fontSize={12}
              align="center"
              width={16}
            />
          </Group>
        </Group>
      )}


      {/* Render contained elements as direct Group children */}
      {section.containedElementIds.map((elementId: string) => {
        const element = elements[elementId];
        if (!element) {
          console.warn('🔍 [SECTION DEBUG] Missing element in section:', elementId, 'from section:', section.id);
          console.warn('🔍 [SECTION DEBUG] Available elements:', Object.keys(elements));
          return null;
        }
        
        console.log('🔍 [SECTION DEBUG] Rendering child element:', {
          elementId,
          elementType: element.type,
          elementPosition: { x: element.x, y: element.y },
          elementSectionId: element.sectionId,
          sectionId: section.id,
          sectionPosition: { x: section.x, y: section.y }
        });
        
        // Ensure element has sectionId set correctly
        if (element.sectionId !== section.id) {
          console.warn('🔍 [SECTION DEBUG] Element sectionId mismatch:', {
            elementId,
            elementSectionId: element.sectionId,
            actualSectionId: section.id
          });
        }
        
        // Render element - it should already have relative coordinates
        try {
          return renderElement(element);
        } catch (error) {
          console.error('🔍 [SECTION DEBUG] Error rendering element:', elementId, error);
          return null;
        }
      })}
    </Group>
  );
});

SectionElement.displayName = 'SectionElement';

export default SectionElement;
