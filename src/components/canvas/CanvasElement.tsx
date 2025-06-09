import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import {
  X
} from 'lucide-react';
import { Graphics, Text, Sprite } from '@pixi/react';
import * as PIXI from 'pixi.js';

export interface CanvasElement { // Added export
  id: string;
  type: 'sticky-note' | 'rectangle' | 'circle' | 'text' | 'triangle' | 'square' | 'hexagon' | 'star' | 'drawing' | 'line' | 'arrow' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  backgroundColor?: string;
  url?: string;
  path?: string;
  x2?: number;
  y2?: number;
  imageUrl?: string;
  imageName?: string;
  fontSize?: 'small' | 'medium' | 'large';
  isBold?: boolean;
  isItalic?: boolean;
  isBulletList?: boolean;
  textAlignment?: 'left' | 'center' | 'right';
}

interface CanvasElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, elementId: string) => void;
  onTextFormatting: (elementId: string, rect: DOMRect) => void;
  onTextChange: (elementId: string, content: string) => void;
  onTextFormatPropertyChange: (elementId: string, property: keyof CanvasElement, value: any) => void;
  onDelete?: (elementId: string) => void;
  getTextStyles: (element: CanvasElement) => React.CSSProperties;
}

// Utility functions for Pixi.js
const hexToPixi = (hex: string | undefined): number => {
  if (!hex) return 0x000000;
  const cleaned = hex.replace('#', '');
  return parseInt(cleaned, 16);
};

const getFontSize = (fontSize?: 'small' | 'medium' | 'large'): number => {
  switch (fontSize) {
    case 'small': return 12;
    case 'medium': return 16;
    case 'large': return 20;
    default: return 16;
  }
};

const getTextStyle = (element: CanvasElement): Partial<PIXI.TextStyle> => {
  return {
    fontSize: getFontSize(element.fontSize),
    fontWeight: element.isBold ? 'bold' : 'normal',
    fontStyle: element.isItalic ? 'italic' : 'normal',
    fill: element.color ? hexToPixi(element.color) : 0x000000,
    align: element.textAlignment || 'left',
    wordWrap: true,
    wordWrapWidth: element.width || 200,
  };
};

const CanvasElementComponent: React.FC<CanvasElementProps> = memo(({
  element,
  isSelected,
  onMouseDown,
  onTextFormatting,
  onTextChange,
  onTextFormatPropertyChange,
  onDelete,
  getTextStyles
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState(element.content || '');
  const textInputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const handleMouseDown = useCallback((e: any) => {
    // Convert Pixi.js event to React MouseEvent-like object
    const syntheticEvent = {
      ...e,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as React.MouseEvent;
    onMouseDown(syntheticEvent, element.id);
  }, [onMouseDown, element.id]);

  const handleTextFocus = useCallback((e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onTextFormatting(element.id, rect);
  }, [onTextFormatting, element.id]);

  const handleTextDoubleClick = useCallback(() => {
    if (element.type === 'text' || element.type === 'sticky-note') {
      setIsEditing(true);
      setEditingText(element.content || '');
    }
  }, [element.type, element.content]);

  const handleTextBlur = useCallback(() => {
    setIsEditing(false);
    if (editingText !== element.content) {
      onTextChange(element.id, editingText);
    }
  }, [editingText, element.content, element.id, onTextChange]);

  const handleTextInput = useCallback((e: React.FormEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = (e.target as HTMLTextAreaElement | HTMLInputElement).value;
    onTextFormatPropertyChange(element.id, 'content', value);
  }, [onTextFormatPropertyChange, element.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete) {
      onDelete(element.id);
    }
  }, [onDelete, element.id]);

  // Focus text input when editing starts
  useEffect(() => {
    if (isEditing && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditing]);

  // Render delete button for selected elements (DOM overlay)
  const renderDeleteButton = () => {
    if (!isSelected || !onDelete) return null;
    
    return (
      <button
        onClick={handleDelete}
        className="absolute bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg z-50 transition-colors"
        style={{ 
          left: element.x + (element.width || 60) - 6,
          top: element.y - 6,
          transform: 'translate(50%, -50%)'
        }}
        title="Delete element"
      >
        <X size={12} />
      </button>
    );
  };

  // Render resize handles for selected elements (DOM overlay)
  const renderResizeHandles = () => {
    if (!isSelected || !element.width || !element.height) return null;
    
    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: '#3b82f6',
      border: '1px solid #ffffff',
      borderRadius: '2px',
      zIndex: 40
    };

    return (
      <>
        {/* Corner handles */}
        <div style={{ 
          ...handleStyle, 
          left: element.x - 4, 
          top: element.y - 4, 
          cursor: 'nw-resize' 
        }} />
        <div style={{ 
          ...handleStyle, 
          left: element.x + element.width - 4, 
          top: element.y - 4, 
          cursor: 'ne-resize' 
        }} />
        <div style={{ 
          ...handleStyle, 
          left: element.x - 4, 
          top: element.y + element.height - 4, 
          cursor: 'sw-resize' 
        }} />
        <div style={{ 
          ...handleStyle, 
          left: element.x + element.width - 4, 
          top: element.y + element.height - 4, 
          cursor: 'se-resize' 
        }} />
      </>
    );
  };

  // Render text input overlay for editing
  const renderTextEditOverlay = () => {
    if (!isEditing) return null;

    const InputComponent = element.isBulletList ? 'textarea' : 'input';
    
    return (
      <InputComponent
        ref={textInputRef as any}
        value={editingText}
        onChange={(e: any) => setEditingText(e.target.value)}
        onBlur={handleTextBlur}
        onFocus={handleTextFocus}
        onInput={handleTextInput}
        onKeyDown={(e: any) => {
          if (e.key === 'Enter' && !element.isBulletList) {
            handleTextBlur();
          }
          if (e.key === 'Escape') {
            setIsEditing(false);
          }
        }}
        className="absolute bg-white border border-blue-500 rounded px-2 py-1 z-50 shadow-lg"
        style={{
          ...getTextStyles(element),
          left: element.x,
          top: element.y,
          width: element.width || 200,
          height: element.isBulletList ? (element.height || 100) : 'auto',
          resize: 'none'
        }}
      />
    );
  };

  const renderPixiElement = () => {
    switch (element.type) {
      case 'sticky-note':
        return (
          <>
            {/* Background */}
            <Graphics
              x={element.x}
              y={element.y}
              interactive
              pointerdown={handleMouseDown}
              pointertap={handleTextDoubleClick}
              draw={(g) => {
                g.clear();
                g.beginFill(hexToPixi(element.color || '#facc15'));
                if (isSelected) {
                  g.lineStyle(2, 0x3b82f6);
                }
                g.drawRoundedRect(0, 0, element.width || 200, element.height || 150, 8);
                g.endFill();
              }}
            />
            {/* Text */}
            {!isEditing && element.content && (
              <Text
                x={element.x + 12}
                y={element.y + 12}
                text={element.content}
                style={getTextStyle(element)}
                interactive
                pointertap={handleTextDoubleClick}
              />
            )}
          </>
        );

      case 'rectangle':
      case 'square':
        return (
          <Graphics
            x={element.x}
            y={element.y}
            interactive
            pointerdown={handleMouseDown}
            draw={(g) => {
              g.clear();
              g.beginFill(hexToPixi(element.color || '#3b82f6'));
              if (isSelected) {
                g.lineStyle(2, 0x3b82f6, 0.8);
              }
              g.drawRect(0, 0, element.width || 100, element.height || 100);
              g.endFill();
            }}
          />
        );

      case 'circle':
        return (
          <Graphics
            x={element.x + (element.width || 100) / 2}
            y={element.y + (element.height || 100) / 2}
            interactive
            pointerdown={handleMouseDown}
            draw={(g) => {
              g.clear();
              g.beginFill(hexToPixi(element.color || '#10b981'));
              if (isSelected) {
                g.lineStyle(2, 0x3b82f6, 0.8);
              }
              g.drawCircle(0, 0, Math.min(element.width || 100, element.height || 100) / 2);
              g.endFill();
            }}
          />
        );

      case 'triangle':
        return (
          <Graphics
            x={element.x}
            y={element.y}
            interactive
            pointerdown={handleMouseDown}
            draw={(g) => {
              g.clear();
              g.beginFill(hexToPixi(element.color || '#8b5cf6'));
              if (isSelected) {
                g.lineStyle(2, 0x3b82f6, 0.8);
              }
              const width = element.width || 60;
              const height = element.height || 60;
              g.moveTo(width / 2, 0);
              g.lineTo(width, height);
              g.lineTo(0, height);
              g.closePath();
              g.endFill();
            }}
          />
        );

      case 'star':
        return (
          <Graphics
            x={element.x}
            y={element.y}
            interactive
            pointerdown={handleMouseDown}
            draw={(g) => {
              g.clear();
              g.beginFill(hexToPixi(element.color || '#f59e0b'));
              if (isSelected) {
                g.lineStyle(2, 0x3b82f6, 0.8);
              }
              
              // Star points (scaled to element size)
              const width = element.width || 60;
              const height = element.height || 60;
              const scaleX = width / 60;
              const scaleY = height / 60;
              
              const points = [
                30 * scaleX, 2 * scaleY,
                37 * scaleX, 20 * scaleY,
                57 * scaleX, 20 * scaleY,
                42 * scaleX, 32 * scaleY,
                48 * scaleX, 52 * scaleY,
                30 * scaleX, 40 * scaleY,
                12 * scaleX, 52 * scaleY,
                18 * scaleX, 32 * scaleY,
                3 * scaleX, 20 * scaleY,
                23 * scaleX, 20 * scaleY
              ];
              
              g.drawPolygon(points);
              g.endFill();
            }}
          />
        );

      case 'hexagon':
        return (
          <Graphics
            x={element.x}
            y={element.y}
            interactive
            pointerdown={handleMouseDown}
            draw={(g) => {
              g.clear();
              g.beginFill(hexToPixi(element.color || '#06b6d4'));
              if (isSelected) {
                g.lineStyle(2, 0x3b82f6, 0.8);
              }
              
              // Hexagon points (scaled to element size)
              const width = element.width || 60;
              const height = element.height || 60;
              const scaleX = width / 60;
              const scaleY = height / 60;
              
              const points = [
                30 * scaleX, 2 * scaleY,
                52 * scaleX, 15 * scaleY,
                52 * scaleX, 45 * scaleY,
                30 * scaleX, 58 * scaleY,
                8 * scaleX, 45 * scaleY,
                8 * scaleX, 15 * scaleY
              ];
              
              g.drawPolygon(points);
              g.endFill();
            }}
          />
        );

      case 'drawing':
        return (
          <Graphics
            x={0}
            y={0}
            interactive
            pointerdown={handleMouseDown}
            draw={(g) => {
              g.clear();
              if (element.path) {
                g.lineStyle(2, hexToPixi(element.color || '#000000'), 1);
                // Parse SVG path and draw it
                // This is a simplified implementation - you might need a more robust SVG path parser
                const pathData = element.path;
                const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g);
                
                if (commands) {
                  commands.forEach(command => {
                    const type = command[0];
                    const coords = command.slice(1).trim().split(/[\s,]+/).map(Number);
                    
                    switch (type.toLowerCase()) {
                      case 'm':
                        if (coords.length >= 2) {
                          g.moveTo(coords[0], coords[1]);
                        }
                        break;
                      case 'l':
                        if (coords.length >= 2) {
                          g.lineTo(coords[0], coords[1]);
                        }
                        break;
                      // Add more path commands as needed
                    }
                  });
                }
              }
            }}
          />
        );

      case 'text':
        return (
          <>
            {/* Background if specified */}
            {element.backgroundColor && (
              <Graphics
                x={element.x - 4}
                y={element.y - 4}
                interactive
                pointerdown={handleMouseDown}
                pointertap={handleTextDoubleClick}
                draw={(g) => {
                  g.clear();
                  g.beginFill(hexToPixi(element.backgroundColor));
                  if (isSelected) {
                    g.lineStyle(1, 0x3b82f6);
                  }
                  g.drawRoundedRect(0, 0, (element.width || 200) + 8, (element.height || 30) + 8, 4);
                  g.endFill();
                }}
              />
            )}
            {/* Text */}
            {!isEditing && element.content && (
              <Text
                x={element.x}
                y={element.y}
                text={element.content}
                style={getTextStyle(element)}
                interactive
                pointerdown={handleMouseDown}
                pointertap={handleTextDoubleClick}
              />
            )}
          </>
        );

      case 'line':
        return (
          <Graphics
            x={0}
            y={0}
            interactive
            pointerdown={handleMouseDown}
            draw={(g) => {
              g.clear();
              g.lineStyle(2, hexToPixi(element.color || '#000000'));
              if (isSelected) {
                g.lineStyle(3, 0x3b82f6, 0.8);
              }
              g.moveTo(element.x, element.y);
              g.lineTo(element.x2 || element.x, element.y2 || element.y);
            }}
          />
        );

      case 'arrow':
        return (
          <Graphics
            x={0}
            y={0}
            interactive
            pointerdown={handleMouseDown}
            draw={(g) => {
              g.clear();
              const color = hexToPixi(element.color || '#000000');
              g.lineStyle(2, color);
              if (isSelected) {
                g.lineStyle(3, 0x3b82f6, 0.8);
              }
              
              const x1 = element.x;
              const y1 = element.y;
              const x2 = element.x2 || element.x;
              const y2 = element.y2 || element.y;
              
              // Draw line
              g.moveTo(x1, y1);
              g.lineTo(x2, y2);
              
              // Draw arrowhead
              const angle = Math.atan2(y2 - y1, x2 - x1);
              const arrowLength = 10;
              const arrowAngle = Math.PI / 6;
              
              g.beginFill(color);
              g.moveTo(x2, y2);
              g.lineTo(
                x2 - arrowLength * Math.cos(angle - arrowAngle),
                y2 - arrowLength * Math.sin(angle - arrowAngle)
              );
              g.lineTo(
                x2 - arrowLength * Math.cos(angle + arrowAngle),
                y2 - arrowLength * Math.sin(angle + arrowAngle)
              );
              g.closePath();
              g.endFill();
            }}
          />
        );

      case 'image':
        return element.imageUrl ? (
          <Sprite
            x={element.x}
            y={element.y}
            width={element.width || 100}
            height={element.height || 100}
            image={element.imageUrl}
            interactive
            pointerdown={handleMouseDown}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <>
      {renderPixiElement()}
      {renderDeleteButton()}
      {renderResizeHandles()}
      {renderTextEditOverlay()}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo optimization
  // Only re-render if element properties or selection state change
  return (
    prevProps.element.id === nextProps.element.id &&
    prevProps.isSelected === nextProps.isSelected &&
    JSON.stringify(prevProps.element) === JSON.stringify(nextProps.element)
  );
});

CanvasElementComponent.displayName = 'CanvasElement';

export default CanvasElementComponent;
