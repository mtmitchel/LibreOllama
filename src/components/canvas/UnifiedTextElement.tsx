// src/components/Canvas/UnifiedTextElement.tsx
import React, { useRef, useCallback } from 'react';
import { Text, Group, Rect } from 'react-konva';

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

  // Render Konva elements only
  const renderKonvaElements = () => {
    if (element.type === 'sticky-note') {
      const stickyWidth = element.width || 200;
      const stickyHeight = element.height || 140;
      
      // Softer, more muted sticky note colors - gentler on the eyes
      const stickyColors = {
        yellow: { main: '#F5F0C8', light: '#F8F4D6', dark: '#E8E0B8', shadow: 'rgba(245, 240, 200, 0.3)' },
        blue: { main: '#E3EDF7', light: '#EBF4FD', dark: '#D1E0F0', shadow: 'rgba(227, 237, 247, 0.3)' },
        green: { main: '#E8F5E8', light: '#F0FAF0', dark: '#D8EBD8', shadow: 'rgba(232, 245, 232, 0.3)' },
        pink: { main: '#F5E8F0', light: '#FAF0F5', dark: '#E8D8E3', shadow: 'rgba(245, 232, 240, 0.3)' },
        orange: { main: '#F5F0E8', light: '#FAF5F0', dark: '#E8E0D8', shadow: 'rgba(245, 240, 232, 0.3)' }
      };
      
      const currentColor = stickyColors.yellow; // Default to yellow, could be made configurable
      
      return (
        <Group
          x={element.x}
          y={element.y}
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
          {/* Very soft drop shadow */}
          <Rect
            x={2}
            y={2}
            width={stickyWidth}
            height={stickyHeight}
            fill="rgba(0, 0, 0, 0.08)"
            cornerRadius={3}
            listening={false}
          />
          
          {/* Main sticky note background with very soft styling */}
          <Rect
            ref={textRef}
            width={stickyWidth}
            height={stickyHeight}
            fill={element.backgroundColor || currentColor.main}
            stroke={isSelected ? currentColor.dark : 'rgba(0, 0, 0, 0.05)'}
            strokeWidth={isSelected ? 1.5 : 0.5}
            cornerRadius={3}
            shadowColor={currentColor.shadow}
            shadowBlur={4}
            shadowOffset={{ x: 1, y: 2 }}
            shadowOpacity={0.3}
          />
          
          {/* Very subtle light overlay for paper texture */}
          <Rect
            x={0}
            y={0}
            width={stickyWidth}
            height={stickyHeight * 0.25}
            fill={currentColor.light}
            opacity={0.3}
            cornerRadius={3}
            listening={false}
          />
          
          {/* Minimal corner fold effect */}
          <Group>
            {/* Tiny corner fold shadow */}
            <Rect
              x={stickyWidth - 12}
              y={0}
              width={12}
              height={12}
              fill={currentColor.dark}
              opacity={0.1}
              cornerRadius={[0, 3, 0, 0]} 
              listening={false}
            />
            
            {/* Corner fold highlight line */}
            <Rect
              x={stickyWidth - 10}
              y={1}
              width={8}
              height={0.5}
              fill="rgba(255, 255, 255, 0.5)"
              listening={false}
            />
          </Group>
          
          {/* Barely visible horizontal lines */}
          {Array.from({ length: Math.floor((stickyHeight - 60) / 35) }, (_, i) => (
            <Rect
              key={i}
              x={16}
              y={55 + i * 35}
              width={stickyWidth - 32}
              height={0.3}
              fill="rgba(0, 0, 0, 0.03)"
              listening={false}
            />
          ))}
          
          {/* Text content with softer, warmer color */}
          {shouldShowMainText && (
            <Text
              x={16}
              y={16}
              width={stickyWidth - 32}
              height={stickyHeight - 32}
              text={formattedText}
              fontSize={(element.fontSize || 14)}
              fontFamily={element.fontFamily || "'Inter', 'Helvetica', sans-serif"}
              fill={element.isHyperlink ? '#4A90E2' : (element.textColor || '#4A5568')}
              fontStyle={element.fontStyle || 'normal'}
              textDecoration={element.isHyperlink ? 'underline' : (element.textDecoration || 'none')}
              align="left"
              verticalAlign="top"
              wrap="word"
              onClick={handleTextClick}
              onTap={handleTextClick}
              lineHeight={1.5}
            />
          )}
          {shouldShowPlaceholder && (
            <Text
              x={16}
              y={16}
              width={stickyWidth - 32}
              height={stickyHeight - 32}
              text="Double-click to edit"
              fontSize={13}
              fontFamily="'Inter', 'Helvetica', sans-serif"
              fill="#8B949E"
              align="left"
              verticalAlign="top"
              fontStyle="italic"
              opacity={0.5}
            />
          )}
          
          {/* Soft selection glow effect */}
          {isSelected && (
            <Rect
              x={-1}
              y={-1}
              width={stickyWidth + 2}
              height={stickyHeight + 2}
              stroke={currentColor.dark}
              strokeWidth={2}
              fill="transparent"
              cornerRadius={4}
              opacity={0.7}
              listening={false}
              dash={[6, 3]}
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
