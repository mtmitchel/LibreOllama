// src/components/Canvas/UnifiedTextElement.tsx
import React, { useRef, useCallback } from 'react';
import { Text, Group, Rect } from 'react-konva';
import { designSystem } from '../../styles/designSystem';

interface UnifiedTextElementProps {
  element: {
    id: string;
    x: number;
    y: number;
    text: string;
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    type: 'text' | 'sticky-note';
    backgroundColor?: string;
    textColor?: string;
    stroke?: string;
    strokeWidth?: number;
    fontStyle?: string;
    textDecoration?: string;
    listType?: string;
    isHyperlink?: boolean;
    hyperlinkUrl?: string;
  };
  isSelected: boolean;
  isEditing?: boolean; // Add editing state prop
  onUpdate: (elementId: string, updates: any) => void;
  onSelect: (elementId: string) => void;
  onStartEdit: (elementId: string) => void;
  konvaProps?: any;
}

const UnifiedTextElement: React.FC<UnifiedTextElementProps> = ({
  element,
  isSelected,
  isEditing = false, // Default to false if not provided
  onUpdate,
  onSelect,
  onStartEdit,
  konvaProps
}) => {
  const textRef = useRef<any>(null);

  // Handle double click - ALWAYS prioritize edit mode over hyperlink navigation
  const handleDoubleClick = useCallback((e: any) => {
    e.cancelBubble = true;
    // Note: Konva events don't have preventDefault, but cancelBubble prevents event propagation
    console.log(`[UnifiedTextElement] Double-click detected for ${element.type} element:`, element.id);
    onStartEdit(element.id);
  }, [onStartEdit, element.id, element.type]);

  // Handle text click for hyperlinks - only in view mode with delay
  const handleTextClick = useCallback((e: any) => {
    // Prevent hyperlink navigation if this is part of a double-click
    if (e.evt?.detail > 1) {
      e.cancelBubble = true;
      return;
    }
    
    // Only handle hyperlink clicks if not currently editing
    if (!isEditing && element.isHyperlink && element.hyperlinkUrl) {
      e.cancelBubble = true;
      
      // Add a small delay to ensure this isn't part of a double-click
      setTimeout(() => {
        // Ensure URL has proper protocol
        let url = element.hyperlinkUrl;
        if (url && !url.match(/^https?:\/\//)) {
          url = 'https://' + url;
        }
        window.open(url, '_blank');
      }, 200);
    }
  }, [isEditing, element.isHyperlink, element.hyperlinkUrl]);

  // Fix 4: Implement list rendering logic
  const formatTextForDisplay = (text: string, listType?: string) => {
    if (!listType || listType === 'none' || !text) return text;
    
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (listType === 'bullet') return `• ${line}`;
      if (listType === 'numbered') return `${index + 1}. ${line}`;
      return line;
    }).join('\n');
  };

  // Apply list formatting to displayed text
  const formattedText = formatTextForDisplay(element.text, element.listType);
  
  // Fix 1: Ensure only one text layer is visible at any time
  const shouldShowPlaceholder = !element.text || element.text.trim() === '';
  const shouldShowMainText = !shouldShowPlaceholder && !isEditing;
  
  // Display text with proper logic
  const displayText = shouldShowMainText ? formattedText : 'Double-click to edit';
  
  // Text display properties
  const textDisplayProps = {
    text: displayText,
    fontSize: element.fontSize || 16,
    fontFamily: element.fontFamily || 'Inter, sans-serif',
    fill: element.isHyperlink ? '#2196F3' : (element.fill || element.textColor || '#3b82f6'),
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.isHyperlink ? 'underline' : (element.textDecoration || 'none')
  };

  // Render Konva elements only
  const renderKonvaElements = () => {
    if (element.type === 'sticky-note') {
      return (
        <Group
          x={element.x}
          y={element.y}
          draggable={true} // Always draggable when not editing
          onDragEnd={(e) => {
            onUpdate(element.id, {
              x: e.target.x(),
              y: e.target.y()
            });
          }}
          onClick={(e) => {
            e.cancelBubble = true;
            onSelect(element.id);
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            onSelect(element.id);
          }}
          onDblClick={handleDoubleClick}
          onDblTap={handleDoubleClick}
          {...konvaProps}
        >
          <Rect
            ref={textRef}
            width={element.width || 200}
            height={element.height || 100}
            fill={element.backgroundColor || designSystem.colors.primary[50]}
            stroke={isSelected ? designSystem.colors.primary[400] : 'transparent'}
            strokeWidth={isSelected ? 2 : 0}
            cornerRadius={8}
            shadowColor="rgba(0,0,0,0.1)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
            shadowOpacity={0.8}
          />
          {/* Fix 1: Only render one text component based on state */}
          {shouldShowMainText && (
            <Text
              x={12}
              y={12}
              width={(element.width || 200) - 24}
              height={(element.height || 100) - 24}
              text={formattedText}
              fontSize={element.fontSize || 16}
              fontFamily={element.fontFamily || 'Inter, sans-serif'}
              fill={element.isHyperlink ? '#2196F3' : (element.fill || element.textColor || '#3b82f6')}
              fontStyle={element.fontStyle || 'normal'}
              textDecoration={element.isHyperlink ? 'underline' : (element.textDecoration || 'none')}
              align="left"
              verticalAlign="top"
              wrap="word"
              onClick={handleTextClick}
              onTap={handleTextClick}
            />
          )}
          {shouldShowPlaceholder && (
            <Text
              x={12}
              y={12}
              width={(element.width || 200) - 24}
              height={(element.height || 100) - 24}
              text="Double-click to add text"
              fontSize={14}
              fontFamily="Inter, sans-serif"
              fill="#666666"
              align="left"
              verticalAlign="top"
              fontStyle="italic"
              opacity={0.8}
            />
          )}
        </Group>
      );
    } else {
      // Regular text element
      return (
        <Group
          x={element.x}
          y={element.y}
          draggable={true} // Always draggable when not editing
          onDragEnd={(e) => {
            onUpdate(element.id, {
              x: e.target.x(),
              y: e.target.y()
            });
          }}
          onClick={(e) => {
            e.cancelBubble = true;
            onSelect(element.id);
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            onSelect(element.id);
          }}
          onDblClick={handleDoubleClick}
          onDblTap={handleDoubleClick}
          {...konvaProps}
        >
          {/* Fix 1: Only render one text component based on state */}
          {shouldShowMainText && (
            <Text
              ref={textRef}
              width={element.width || 200}
              height={element.height}
              text={formattedText}
              fontSize={element.fontSize || 16}
              fontFamily={element.fontFamily || 'Inter, sans-serif'}
              fill={element.isHyperlink ? '#2196F3' : (element.fill || element.textColor || '#3b82f6')}
              fontStyle={element.fontStyle || 'normal'}
              textDecoration={element.isHyperlink ? 'underline' : (element.textDecoration || 'none')}
              align="left"
              verticalAlign="top"
              wrap="word"
              onClick={handleTextClick}
              onTap={handleTextClick}
            />
          )}
          {shouldShowPlaceholder && (
            <Text
              width={element.width || 200}
              height={element.height}
              text="Double-click to add text"
              fontSize={14}
              fontFamily="Inter, sans-serif"
              fill="#666666"
              align="left"
              verticalAlign="top"
              fontStyle="italic"
              opacity={0.8}
            />
          )}
        </Group>
      );
    }
  };

  // Return ONLY Konva components - no HTML elements
  return renderKonvaElements();
};

export default UnifiedTextElement;
