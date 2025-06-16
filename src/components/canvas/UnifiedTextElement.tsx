// src/components/Canvas/UnifiedTextElement.tsx
import React, { useRef, useCallback } from 'react';
import { Text, Group, Rect } from 'react-konva';
import { designSystem } from '../../styles/designSystem';
import { richTextManager } from './RichTextSystem/UnifiedRichTextManager';
import type { RichTextSegment } from '../../types/richText';

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
    fontWeight?: string;
    textDecoration?: string;
    listType?: string;
    isHyperlink?: boolean;
    hyperlinkUrl?: string;
    textAlign?: 'left' | 'center' | 'right';
    richTextSegments?: RichTextSegment[]; // Add rich text support
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

  // Rich text support
  const hasRichTextSegments = element.richTextSegments && element.richTextSegments.length > 0;
  const hasBasicText = element.text && element.text.trim() !== '';
  const hasContent = hasRichTextSegments || hasBasicText;
  
  // Get display text - prioritize rich text segments, fallback to basic text
  const getDisplayText = () => {
    if (hasRichTextSegments) {
      return richTextManager.segmentsToPlainText(element.richTextSegments!);
    }
    if (hasBasicText) {
      // Apply list formatting to basic text
      const text = element.text!;
      if (!element.listType || element.listType === 'none') return text;
      
      const lines = text.split('\n');
      return lines.map((line, index) => {
        if (element.listType === 'bullet') return `• ${line}`;
        if (element.listType === 'numbered') return `${index + 1}. ${line}`;
        return line;
      }).join('\n');
    }
    return '';
  };
  
  const displayText = getDisplayText();
  
  // Text display logic
  const shouldShowPlaceholder = !hasContent;
  const shouldShowMainText = hasContent && !isEditing;
  
  // Text display properties with enhanced formatting support
  const textDisplayProps = {
    text: displayText,
    fontSize: element.fontSize || 16,
    fontFamily: element.fontFamily || 'Inter, sans-serif',
    fill: element.isHyperlink ? '#2196F3' : (element.fill || element.textColor || '#3b82f6'),
    fontStyle: (() => {
      let style = element.fontStyle || 'normal';
      // Handle combined bold and italic styles for Konva
      if (element.fontWeight === 'bold' && style === 'italic') {
        return 'bold italic';
      } else if (element.fontWeight === 'bold') {
        return 'bold';
      }
      return style;
    })(),
    textDecoration: (() => {
      if (element.isHyperlink) return 'underline';
      if (element.textDecoration) return element.textDecoration;
      return 'none';
    })(),
    align: element.textAlign || 'left'
  };

  // Render Konva elements only
  const renderKonvaElements = () => {
    if (element.type === 'sticky-note') {
      return (
        <Group
          id={element.id}
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
          
          {/* Rich text segments rendering for sticky notes */}
          {shouldShowMainText && hasRichTextSegments && (
            element.richTextSegments!.map((segment, index) => {
              // Calculate text positioning for each segment
              const segmentY = 12 + (index * (segment.fontSize || 14) * 1.4);
              
              // FIXED: Properly combine fontStyle and fontWeight for Konva
              let konvaFontStyle = segment.fontStyle || 'normal';
              if (segment.fontWeight === 'bold') {
                konvaFontStyle = konvaFontStyle === 'italic' ? 'bold italic' : 'bold';
              }

              console.log(`[UNIFIED TEXT STICKY DEBUG] Rendering segment ${index}:`, {
                text: segment.text,
                fontSize: segment.fontSize || element.fontSize || 14,
                fontStyle: konvaFontStyle,
                fill: segment.fill || element.textColor || designSystem.colors.secondary[900],
                textDecoration: segment.textDecoration || element.textDecoration || 'none'
              });
              
              return (
                <Text
                  key={index}
                  x={12}
                  y={segmentY}
                  width={(element.width || 200) - 24}
                  height={(element.height || 100) - 24}
                  text={segment.text}
                  fontSize={segment.fontSize || element.fontSize || 14}
                  fontFamily={segment.fontFamily || element.fontFamily || 'Inter, sans-serif'}
                  fill={segment.fill || element.textColor || designSystem.colors.secondary[900]}
                  fontStyle={konvaFontStyle}
                  textDecoration={segment.textDecoration || element.textDecoration || 'none'}
                  align={element.textAlign || 'left'}
                  verticalAlign="top"
                  wrap="word"
                  onClick={handleTextClick}
                  onTap={handleTextClick}
                />
              );
            })
          )}

          {/* Fallback to basic text if no rich text segments */}
          {shouldShowMainText && !hasRichTextSegments && (
            <Text
              x={12}
              y={12}
              width={(element.width || 200) - 24}
              height={(element.height || 100) - 24}
              text={displayText}
              fontSize={element.fontSize || 14}
              fontFamily={element.fontFamily || 'Inter, sans-serif'}
              fill={element.textColor || designSystem.colors.secondary[900]}
              fontStyle={element.fontStyle || 'normal'}
              textDecoration={element.textDecoration || 'none'}
              align={element.textAlign || 'left'}
              verticalAlign="top"
              wrap="word"
              onClick={handleTextClick}
              onTap={handleTextClick}
            />
          )}
          
          {/* Placeholder text for sticky notes */}
          {shouldShowPlaceholder && (
            <Text
              x={12}
              y={12}
              width={(element.width || 200) - 24}
              height={(element.height || 100) - 24}
              text="Double-click to add text"
              fontSize={14}
              fontFamily="Inter, sans-serif"
              fill="rgba(0, 0, 0, 0.4)"
              align={element.textAlign || 'left'}
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
          id={element.id}
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
          {/* Rich text segments rendering for regular text elements */}
          {shouldShowMainText && hasRichTextSegments && (
            element.richTextSegments!.map((segment, index) => {
              // Calculate text positioning for each segment
              const segmentY = index * (segment.fontSize || 16) * 1.4;
              
              // FIXED: Properly combine fontStyle and fontWeight for Konva
              let konvaFontStyle = segment.fontStyle || 'normal';
              if (segment.fontWeight === 'bold') {
                konvaFontStyle = konvaFontStyle === 'italic' ? 'bold italic' : 'bold';
              }

              console.log(`[UNIFIED TEXT DEBUG] Rendering segment ${index}:`, {
                text: segment.text,
                fontSize: segment.fontSize || element.fontSize || 16,
                fontStyle: konvaFontStyle,
                fill: segment.fill || element.fill || element.textColor || '#3b82f6',
                textDecoration: segment.textDecoration || element.textDecoration || 'none'
              });
              
              return (
                <Text
                  key={index}
                  ref={index === 0 ? textRef : undefined} // Only attach ref to first segment
                  y={segmentY}
                  width={element.width || 200}
                  height={element.height}
                  text={segment.text}
                  fontSize={segment.fontSize || element.fontSize || 16}
                  fontFamily={segment.fontFamily || element.fontFamily || 'Inter, sans-serif'}
                  fill={segment.fill || element.fill || element.textColor || '#3b82f6'}
                  fontStyle={konvaFontStyle}
                  textDecoration={segment.textDecoration || element.textDecoration || 'none'}
                  align={element.textAlign || 'left'}
                  verticalAlign="top"
                  wrap="word"
                  onClick={handleTextClick}
                  onTap={handleTextClick}
                />
              );
            })
          )}

          {/* Fallback to basic text if no rich text segments */}
          {shouldShowMainText && !hasRichTextSegments && (
            <Text
              ref={textRef}
              width={element.width || 200}
              height={element.height}
              text={displayText}
              fontSize={element.fontSize || 16}
              fontFamily={element.fontFamily || 'Inter, sans-serif'}
              fill={element.isHyperlink ? '#2196F3' : (element.fill || element.textColor || '#3b82f6')}
              fontStyle={element.fontStyle || 'normal'}
              textDecoration={element.isHyperlink ? 'underline' : (element.textDecoration || 'none')}
              align={element.textAlign || 'left'}
              verticalAlign="top"
              wrap="word"
              onClick={handleTextClick}
              onTap={handleTextClick}
            />
          )}
          
          {/* Placeholder text for regular text elements */}
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
