// src/components/Canvas/UnifiedTextElement_working.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Text, Group, Rect } from 'react-konva';
import { designSystem } from '../../styles/designSystem';
import { StandardTextFormattingMenu } from './StandardTextFormattingMenu';
import { createPortal } from 'react-dom';

interface TextFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  fontSize: number;
  color: string;
  fontFamily: string;
  listType: 'none' | 'bullet' | 'numbered';
  isHyperlink: boolean;
  hyperlinkUrl: string;
}

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
  onUpdate: (elementId: string, updates: any) => void;
  onSelect: (elementId: string) => void;
  konvaProps?: any;
}

const UnifiedTextElement: React.FC<UnifiedTextElementProps> = ({
  element,
  isSelected,
  onUpdate,
  onSelect,
  konvaProps
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(element.text || '');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  
  const textRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State for portal positioning
  const [textareaPosition, setTextareaPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [menuPosition, setMenuPosition] = useState<{
    y: number;
  } | null>(null);

  // Text formatting state
  const [previewFormat, setPreviewFormat] = useState<TextFormat>({
    bold: element.fontStyle?.includes('bold') || false,
    italic: element.fontStyle?.includes('italic') || false,
    underline: element.textDecoration?.includes('underline') || false,
    strikethrough: element.textDecoration?.includes('line-through') || false,
    fontSize: element.fontSize || 16,
    color: element.fill || element.textColor || '#000000',
    fontFamily: element.fontFamily || 'Inter, sans-serif',
    listType: (element.listType as 'none' | 'bullet' | 'numbered') || 'none',
    isHyperlink: element.isHyperlink || false,
    hyperlinkUrl: element.hyperlinkUrl || ''
  });

  // Calculate positions when editing starts
  const calculatePositions = useCallback(() => {
    console.log(`[UnifiedTextElement] calculatePositions called`);
    if (textRef.current) {
      const textNode = textRef.current;
      const stage = textNode.getStage();
      const container = stage.container();
      const containerRect = container.getBoundingClientRect();
      
      const textPosition = textNode.getAbsolutePosition();
      const stageScale = stage.scaleX();
      
      const x = containerRect.left + textPosition.x * stageScale;
      const y = containerRect.top + textPosition.y * stageScale;
      const width = Math.max(200, (element.width || 200) * stageScale);
      const height = Math.max(100, (element.height || 100) * stageScale);
      
      // Smart menu positioning to prevent cutoff
      const menuHeight = 380;
      const viewportHeight = window.innerHeight;
      
      // Calculate optimal menu position
      let menuY = y - menuHeight - 8; // 8px gap between menu and textarea
      
      // If menu would be cut off at top, position it below the textarea
      if (menuY < 20) {
        menuY = y + height + 8; // Position below with 8px gap
      }
      
      // Final check if menu would be cut off at bottom when positioned below
      if (menuY + menuHeight > viewportHeight - 20) {
        // If both above and below positions are problematic, use the one with more space
        const spaceAbove = y - 20;
        const spaceBelow = viewportHeight - (y + height) - 20;
        
        if (spaceAbove > spaceBelow) {
          menuY = Math.max(20, y - menuHeight - 8);
        } else {
          menuY = Math.min(viewportHeight - menuHeight - 20, y + height + 8);
        }
      }
      
      console.log(`[UnifiedTextElement] Setting positions:`, {
        textareaPosition: { x, y, width, height },
        menuPosition: { y: menuY }
      });
      
      setTextareaPosition({ x, y, width, height });
      setMenuPosition({ y: menuY });
    } else {
      console.log(`[UnifiedTextElement] textRef.current is null, using fallback positioning`);
      // Fallback positioning if textRef is not available
      const fallbackX = element.x || 100;
      const fallbackY = element.y || 100;
      const fallbackWidth = element.width || 200;
      const fallbackHeight = element.height || 100;
      
      setTextareaPosition({ 
        x: fallbackX, 
        y: fallbackY, 
        width: fallbackWidth, 
        height: fallbackHeight 
      });
      setMenuPosition({ y: Math.max(20, fallbackY - 380) });
    }
  }, [element.width, element.height, element.x, element.y]);

  // Start editing function
  const startEditing = useCallback(() => {
    console.log(`[UnifiedTextElement] Starting edit mode for ${element.type} element:`, element.id);
    setIsEditing(true);
    setEditText(element.text || '');
    setShowFormatMenu(true);
    
    // Calculate positions after state updates
    setTimeout(() => {
      calculatePositions();
      
      // Focus textarea after positioning
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 50);
    }, 10);
  }, [element.text, element.id, element.type, calculatePositions]);

  // Handle double click
  const handleDoubleClick = useCallback((e: any) => {
    e.cancelBubble = true;
    console.log(`[UnifiedTextElement] Double-click detected for ${element.type} element:`, element.id);
    startEditing();
  }, [startEditing, element.type, element.id]);

  // Handle text click for hyperlinks
  const handleTextClick = useCallback((e: any) => {
    if (element.isHyperlink && element.hyperlinkUrl && !isEditing) {
      e.cancelBubble = true;
      window.open(element.hyperlinkUrl, '_blank');
    }
  }, [element.isHyperlink, element.hyperlinkUrl, isEditing]);

  // Apply formatting
  const applyFormatting = useCallback((formatType: string, value?: any) => {
    setPreviewFormat(prev => {
      const newFormat = { ...prev };
      
      switch (formatType) {
        case 'bold':
          newFormat.bold = !prev.bold;
          break;
        case 'italic':
          newFormat.italic = !prev.italic;
          break;
        case 'underline':
          newFormat.underline = !prev.underline;
          break;
        case 'strikethrough':
          newFormat.strikethrough = !prev.strikethrough;
          break;
        case 'fontSize':
          newFormat.fontSize = parseInt(value) || 16;
          break;
        case 'color':
          newFormat.color = value || '#000000';
          break;
        case 'fontFamily':
          newFormat.fontFamily = value || 'Inter, sans-serif';
          break;
        case 'listType':
          newFormat.listType = value || 'none';
          break;
        case 'isHyperlink':
          newFormat.isHyperlink = !prev.isHyperlink;
          if (!newFormat.isHyperlink) {
            newFormat.hyperlinkUrl = '';
          }
          break;
        case 'hyperlinkUrl':
          newFormat.hyperlinkUrl = value || '';
          if (value) {
            newFormat.isHyperlink = true;
          }
          break;
      }
      
      return newFormat;
    });
  }, []);

  // Handle done editing
  const handleDone = useCallback(() => {
    console.log(`[UnifiedTextElement] Finishing edit mode for ${element.type} element:`, element.id);
    
    // Build the font style string
    let fontStyle = 'normal';
    if (previewFormat.bold && previewFormat.italic) {
      fontStyle = 'bold italic';
    } else if (previewFormat.bold) {
      fontStyle = 'bold';
    } else if (previewFormat.italic) {
      fontStyle = 'italic';
    }
    
    // Build the text decoration string
    const decorations = [];
    if (previewFormat.underline) decorations.push('underline');
    if (previewFormat.strikethrough) decorations.push('line-through');
    const textDecoration = decorations.length > 0 ? decorations.join(' ') : 'none';
    
    onUpdate(element.id, {
      text: editText,
      fontSize: previewFormat.fontSize,
      fontFamily: previewFormat.fontFamily,
      [element.type === 'sticky-note' ? 'textColor' : 'fill']: previewFormat.color,
      fontStyle,
      textDecoration,
      listType: previewFormat.listType,
      isHyperlink: previewFormat.isHyperlink,
      hyperlinkUrl: previewFormat.hyperlinkUrl
    });
    
    setIsEditing(false);
    setShowFormatMenu(false);
    setTextareaPosition(null);
    setMenuPosition(null);
  }, [editText, previewFormat, onUpdate, element.id, element.type]);

  // Handle cancel editing
  const handleCancel = useCallback(() => {
    console.log(`[UnifiedTextElement] Canceling edit mode for ${element.type} element:`, element.id);
    setIsEditing(false);
    setShowFormatMenu(false);
    setEditText(element.text || '');
    setTextareaPosition(null);
    setMenuPosition(null);
    
    // Reset preview format to current element state
    setPreviewFormat({
      bold: element.fontStyle?.includes('bold') || false,
      italic: element.fontStyle?.includes('italic') || false,
      underline: element.textDecoration?.includes('underline') || false,
      strikethrough: element.textDecoration?.includes('line-through') || false,
      fontSize: element.fontSize || 16,
      color: element.fill || element.textColor || '#000000',
      fontFamily: element.fontFamily || 'Inter, sans-serif',
      listType: (element.listType as 'none' | 'bullet' | 'numbered') || 'none',
      isHyperlink: element.isHyperlink || false,
      hyperlinkUrl: element.hyperlinkUrl || ''
    });
  }, [element]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isEditing) {
        calculatePositions();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isEditing, calculatePositions]);

  // Display text with proper formatting for preview
  const displayText = editText || element.text || 'Double-click to edit';
  
  // Text display properties
  const textDisplayProps = {
    text: displayText,
    fontSize: isEditing ? previewFormat.fontSize : (element.fontSize || 16),
    fontFamily: isEditing ? previewFormat.fontFamily : (element.fontFamily || 'Inter, sans-serif'),
    fill: isEditing ? previewFormat.color : 
          element.isHyperlink ? '#2196F3' : (element.fill || element.textColor || '#000000'),
    fontStyle: isEditing ? (
      previewFormat.bold && previewFormat.italic ? 'bold italic' :
      previewFormat.bold ? 'bold' :
      previewFormat.italic ? 'italic' : 'normal'
    ) : (element.fontStyle || 'normal'),
    textDecoration: isEditing ? [
      previewFormat.underline ? 'underline' : '',
      previewFormat.strikethrough ? 'line-through' : ''
    ].filter(Boolean).join(' ') || 'none' : 
    element.isHyperlink ? 'underline' : (element.textDecoration || 'none')
  };

  // Render Konva elements only
  const renderKonvaElements = () => {
    if (element.type === 'sticky-note') {
      return (
        <Group
          x={element.x}
          y={element.y}
          draggable={!isEditing}
          onDragEnd={(e) => {
            onUpdate(element.id, {
              x: e.target.x(),
              y: e.target.y()
            });
          }}
          onClick={(e) => {
            e.cancelBubble = true;
            if (!isEditing) {
              onSelect(element.id);
            }
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            if (!isEditing) {
              onSelect(element.id);
            }
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
          <Text
            x={12}
            y={12}
            width={(element.width || 200) - 24}
            height={(element.height || 100) - 24}
            {...textDisplayProps}
            align="left"
            verticalAlign="top"
            wrap="word"
            onClick={handleTextClick}
            onTap={handleTextClick}
          />
          {!element.text && !isEditing && (
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
          draggable={!isEditing}
          onDragEnd={(e) => {
            onUpdate(element.id, {
              x: e.target.x(),
              y: e.target.y()
            });
          }}
          onClick={(e) => {
            e.cancelBubble = true;
            if (!isEditing) {
              onSelect(element.id);
            }
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            if (!isEditing) {
              onSelect(element.id);
            }
          }}
          onDblClick={handleDoubleClick}
          onDblTap={handleDoubleClick}
          {...konvaProps}
        >
          <Text
            ref={textRef}
            width={element.width || 200}
            height={element.height}
            {...textDisplayProps}
            align="left"
            verticalAlign="top"
            wrap="word"
            onClick={handleTextClick}
            onTap={handleTextClick}
          />
          {!element.text && !isEditing && (
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

  return (
    <>
      {/* Konva elements only */}
      {renderKonvaElements()}
      
      {/* DOM elements rendered via portals - OUTSIDE component return */}
      {typeof window !== 'undefined' && isEditing && textareaPosition && createPortal(
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Add text"
          onKeyDown={(e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
              e.stopPropagation();
            }
            if (e.key === 'Escape') {
              e.stopPropagation();
              handleCancel();
            }
          }}
          style={{
            position: 'fixed',
            left: textareaPosition.x + 'px',
            top: textareaPosition.y + 'px',
            width: textareaPosition.width + 'px',
            height: textareaPosition.height + 'px',
            fontSize: previewFormat.fontSize + 'px',
            fontFamily: previewFormat.fontFamily,
            color: previewFormat.isHyperlink ? '#2196F3' : previewFormat.color,
            fontWeight: previewFormat.bold ? 'bold' : 'normal',
            fontStyle: previewFormat.italic ? 'italic' : 'normal',
            textDecoration: [
              previewFormat.underline || previewFormat.isHyperlink ? 'underline' : '',
              previewFormat.strikethrough ? 'line-through' : ''
            ].filter(Boolean).join(' ') || 'none',
            border: '2px solid #2196F3',
            borderTopLeftRadius: '0px',
            borderTopRightRadius: '0px',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            borderTop: 'none',
            padding: '8px',
            resize: 'none',
            outline: 'none',
            backgroundColor: 'white',
            boxSizing: 'border-box',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 9999
          }}
        />,
        document.body
      )}

      {/* Formatting Menu portal */}
      {typeof window !== 'undefined' && showFormatMenu && createPortal(
        <StandardTextFormattingMenu
          position={{ 
            x: textareaPosition?.x || 100, 
            y: menuPosition?.y || 100 
          }}
          width={Math.max(320, textareaPosition?.width || 320)}
          format={{
            bold: previewFormat.bold,
            italic: previewFormat.italic,
            underline: previewFormat.underline,
            strikethrough: previewFormat.strikethrough,
            fontSize: previewFormat.fontSize,
            color: previewFormat.color,
            fontFamily: previewFormat.fontFamily,
            listType: previewFormat.listType,
            isHyperlink: previewFormat.isHyperlink,
            hyperlinkUrl: previewFormat.hyperlinkUrl
          }}
          onFormatChange={(formatUpdates) => {
            Object.entries(formatUpdates).forEach(([key, value]) => {
              if (key === 'bold' || key === 'italic' || key === 'underline' || key === 'strikethrough' || key === 'isHyperlink') {
                applyFormatting(key);
              } else {
                applyFormatting(key, value);
              }
            });
          }}
          onClose={handleCancel}
          onDone={handleDone}
          showDoneButton={true}
        />,
        document.body
      )}
    </>
  );
};

export default UnifiedTextElement;
