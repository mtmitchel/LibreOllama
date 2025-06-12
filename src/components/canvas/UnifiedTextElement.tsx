// src/components/Canvas/UnifiedTextElement.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Text, Group, Rect } from 'react-konva';
import { Html } from 'react-konva-utils';
import { designSystem } from '../../styles/designSystem';

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
  const [textareaPosition, setTextareaPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [appliedFormats, setAppliedFormats] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef<any>(null);

  const [previewFormat, setPreviewFormat] = useState<TextFormat>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    fontSize: element.fontSize || 16,
    color: element.fill || element.textColor || '#000000',
    fontFamily: element.fontFamily || 'Inter, sans-serif',
    listType: 'none',
    isHyperlink: false,
    hyperlinkUrl: ''
  });

  const resetFormatPreview = useCallback(() => {
    const fontStyle = element.fontStyle || 'normal';
    const textDecoration = element.textDecoration || 'none';
    
    const bold = fontStyle.includes('bold');
    const italic = fontStyle.includes('italic');
    const underline = textDecoration.includes('underline');
    const strikethrough = textDecoration.includes('line-through');
    
    setPreviewFormat({
      bold,
      italic,
      underline,
      strikethrough,
      fontSize: element.fontSize || 16,
      color: element.fill || element.textColor || '#000000',
      fontFamily: element.fontFamily || 'Inter, sans-serif',
      listType: (element as any).listType || 'none',
      isHyperlink: (element as any).isHyperlink || false,
      hyperlinkUrl: (element as any).hyperlinkUrl || ''
    });
    
    const appliedFormats = new Set<string>();
    if (bold) appliedFormats.add('bold');
    if (italic) appliedFormats.add('italic');
    if (underline) appliedFormats.add('underline');
    if (strikethrough) appliedFormats.add('strikethrough');
    setAppliedFormats(appliedFormats);
  }, [element.fontSize, element.fill, element.textColor, element.fontFamily, element.fontStyle, element.textDecoration]);

  const applyFormatting = useCallback((type: string, value?: any) => {
    setPreviewFormat(prev => {
      const newFormat = { ...prev };
      
      if (type === 'fontSize') {
        newFormat.fontSize = Math.max(8, Math.min(72, value || 16));
      } else if (type === 'color') {
        newFormat.color = value || '#000000';
      } else if (type === 'listType') {
        newFormat.listType = value || 'none';
      } else if (type === 'hyperlinkUrl') {
        newFormat.hyperlinkUrl = value || '';
        newFormat.isHyperlink = Boolean(value && value.trim());
      } else if (type === 'isHyperlink') {
        newFormat.isHyperlink = !prev.isHyperlink;
        if (!newFormat.isHyperlink) {
          newFormat.hyperlinkUrl = '';
        }
      } else {
        newFormat[type as keyof TextFormat] = !prev[type as keyof TextFormat];
      }
      
      return newFormat;
    });

    setAppliedFormats(prev => {
      const newFormats = new Set(prev);
      if (type === 'fontSize' || type === 'color' || type === 'listType' || type === 'hyperlinkUrl') {
        newFormats.add(type);
      } else {
        if (newFormats.has(type)) {
          newFormats.delete(type);
        } else {
          newFormats.add(type);
        }
      }
      return newFormats;
    });
  }, []);

  const handleDoubleClick = useCallback(() => {
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
      
      // Position menu directly above textarea with connected styling
      const menuHeight = 320; // Increased height to accommodate list and hyperlink options
      const menuY = y - menuHeight - 5; // 5px gap between menu and textarea
      
      setTextareaPosition({ x, y, width, height });
      setMenuPosition({ x, y: menuY });
      setIsEditing(true);
      setShowFormatMenu(true);
      setEditText(element.text || '');
      resetFormatPreview();
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 10);
    }
  }, [element.text, element.width, element.height, resetFormatPreview]);

  const handleDone = useCallback(() => {
    const updates: any = {
      text: editText,
      fontSize: previewFormat.fontSize,
      fill: previewFormat.color,
      fontFamily: previewFormat.fontFamily,
      fontStyle: previewFormat.bold && previewFormat.italic ? 'bold italic' :
                 previewFormat.bold ? 'bold' :
                 previewFormat.italic ? 'italic' : 'normal',
      textDecoration: [
        previewFormat.underline ? 'underline' : '',
        previewFormat.strikethrough ? 'line-through' : ''
      ].filter(Boolean).join(' ') || 'none',
      listType: previewFormat.listType,
      isHyperlink: previewFormat.isHyperlink,
      hyperlinkUrl: previewFormat.hyperlinkUrl
    };

    if (element.type === 'sticky-note') {
      updates.textColor = previewFormat.color;
    }

    onUpdate(element.id, updates);
    setIsEditing(false);
    setShowFormatMenu(false);
    setTextareaPosition(null);
    setMenuPosition(null);
    resetFormatPreview();
  }, [editText, previewFormat, element.id, element.type, onUpdate, resetFormatPreview]);

  const processTextForDisplay = useCallback((text: string, listType: string) => {
    if (!text || listType === 'none') return text;
    
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.trim() === '') return line;
      
      if (listType === 'bullet') {
        return line.startsWith('• ') ? line : `• ${line}`;
      } else if (listType === 'numbered') {
        const numberPrefix = `${index + 1}. `;
        return line.match(/^\d+\. /) ? line : `${numberPrefix}${line}`;
      }
      
      return line;
    }).join('\n');
  }, []);

  const handleTextClick = useCallback((e: any) => {
    // Prevent hyperlink navigation during editing
    if (isEditing) {
      e.cancelBubble = true;
      return;
    }
    
    // Handle hyperlink click when not editing
    if ((element as any).isHyperlink && (element as any).hyperlinkUrl) {
      window.open((element as any).hyperlinkUrl, '_blank');
    }
  }, [isEditing, element]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setShowFormatMenu(false);
    setTextareaPosition(null);
    setMenuPosition(null);
    setEditText(element.text || '');
    resetFormatPreview();
  }, [element.text, resetFormatPreview]);

  const currentListType = isEditing ? previewFormat.listType : ((element as any).listType || 'none');
  const currentIsHyperlink = isEditing ? previewFormat.isHyperlink : ((element as any).isHyperlink || false);
  const displayText = isEditing ? 
    processTextForDisplay(editText, previewFormat.listType) : 
    processTextForDisplay(element.text || 'Double-click to edit', currentListType);

  const textDisplayProps = {
    text: displayText,
    fontSize: isEditing ? previewFormat.fontSize : (element.fontSize || 16),
    fontFamily: isEditing ? previewFormat.fontFamily : (element.fontFamily || 'Inter, sans-serif'),
    fill: isEditing ? previewFormat.color : 
          currentIsHyperlink ? '#2196F3' : (element.fill || element.textColor || '#000000'),
    fontStyle: isEditing ? (
      previewFormat.bold && previewFormat.italic ? 'bold italic' :
      previewFormat.bold ? 'bold' :
      previewFormat.italic ? 'italic' : 'normal'
    ) : (element.fontStyle || 'normal'),
    textDecoration: isEditing ? [
      previewFormat.underline ? 'underline' : '',
      previewFormat.strikethrough ? 'line-through' : ''
    ].filter(Boolean).join(' ') || 'none' : 
    currentIsHyperlink ? 'underline' : (element.textDecoration || 'none')
  };

  if (element.type === 'sticky-note') {
    return (
      <>
        <Group
          x={element.x}
          y={element.y}
          onClick={() => onSelect(element.id)}
          onDblClick={handleDoubleClick}
          {...konvaProps}
        >
          <Rect
            width={element.width || 200}
            height={element.height || 150}
            fill={element.backgroundColor || designSystem.colors.accent.yellow}
            stroke={isSelected ? designSystem.colors.primary.blue : 'transparent'}
            strokeWidth={isSelected ? 2 : 0}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={4}
            shadowOffset={{ x: 2, y: 2 }}
            shadowOpacity={0.3}
            cornerRadius={8}
          />
          <Text
            ref={textRef}
            x={10}
            y={10}
            width={(element.width || 200) - 20}
            height={(element.height || 150) - 20}
            {...textDisplayProps}
            align="left"
            verticalAlign="top"
            opacity={isEditing ? 0.5 : 1}
            onClick={handleTextClick}
            onTap={handleTextClick}
          />
        </Group>

        {/* Textarea for editing */}
        {isEditing && textareaPosition && (
          <Html
            groupProps={{
              x: 0,
              y: 0
            }}
          >
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                // Prevent global canvas keydown handler from interfering with text editing
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
                listStyleType: previewFormat.listType === 'bullet' ? 'disc' : 
                              previewFormat.listType === 'numbered' ? 'decimal' : 'none'
              }}
            />
          </Html>
        )}

        {/* Formatting Menu */}
        {showFormatMenu && menuPosition && textareaPosition && (
          <Html
            groupProps={{
              x: 0,
              y: 0
            }}
          >
            <div
              style={{
                position: 'fixed',
                left: textareaPosition.x + 'px',
                top: menuPosition.y + 'px',
                width: textareaPosition.width + 'px',
                backgroundColor: 'white',
                border: '2px solid #2196F3',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                borderBottomLeftRadius: '0px',
                borderBottomRightRadius: '0px',
                borderBottom: 'none',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                marginBottom: '12px', 
                color: '#333',
                borderBottom: '1px solid #eee',
                paddingBottom: '8px'
              }}>
                Text Formatting
              </div>

              {/* Style Buttons */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#666' }}>
                  STYLE
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => applyFormatting('bold')}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: appliedFormats.has('bold') ? '#2196F3' : 'white',
                      color: appliedFormats.has('bold') ? 'white' : '#333',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    B
                  </button>
                  <button
                    onClick={() => applyFormatting('italic')}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: appliedFormats.has('italic') ? '#2196F3' : 'white',
                      color: appliedFormats.has('italic') ? 'white' : '#333',
                      fontStyle: 'italic',
                      cursor: 'pointer'
                    }}
                  >
                    I
                  </button>
                  <button
                    onClick={() => applyFormatting('underline')}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: appliedFormats.has('underline') ? '#2196F3' : 'white',
                      color: appliedFormats.has('underline') ? 'white' : '#333',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    U
                  </button>
                  <button
                    onClick={() => applyFormatting('strikethrough')}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: appliedFormats.has('strikethrough') ? '#2196F3' : 'white',
                      color: appliedFormats.has('strikethrough') ? 'white' : '#333',
                      textDecoration: 'line-through',
                      cursor: 'pointer'
                    }}
                  >
                    S
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#666' }}>
                  SIZE
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    onClick={() => applyFormatting('fontSize', Math.max(8, previewFormat.fontSize - 2))}
                    style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    A-
                  </button>
                  <input
                    type="number"
                    value={previewFormat.fontSize}
                    onChange={(e) => applyFormatting('fontSize', parseInt(e.target.value) || 16)}
                    style={{ width: '60px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}
                  />
                  <button
                    onClick={() => applyFormatting('fontSize', Math.min(72, previewFormat.fontSize + 2))}
                    style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Color Picker */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#666' }}>
                  COLOR
                </div>
                <div>
                  <input
                    type="color"
                    value={previewFormat.color}
                    onChange={(e) => applyFormatting('color', e.target.value)}
                    style={{ width: '40px', height: '32px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* List Type */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#666' }}>
                  LIST
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => applyFormatting('listType', 'none')}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: previewFormat.listType === 'none' ? '#2196F3' : 'white',
                      color: previewFormat.listType === 'none' ? 'white' : '#333',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    None
                  </button>
                  <button
                    onClick={() => applyFormatting('listType', 'bullet')}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: previewFormat.listType === 'bullet' ? '#2196F3' : 'white',
                      color: previewFormat.listType === 'bullet' ? 'white' : '#333',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    • Bullet
                  </button>
                  <button
                    onClick={() => applyFormatting('listType', 'numbered')}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: previewFormat.listType === 'numbered' ? '#2196F3' : 'white',
                      color: previewFormat.listType === 'numbered' ? 'white' : '#333',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    1. Numbered
                  </button>
                </div>
              </div>

              {/* Hyperlink */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#666' }}>
                  HYPERLINK
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    onClick={() => applyFormatting('isHyperlink')}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: previewFormat.isHyperlink ? '#2196F3' : 'white',
                      color: previewFormat.isHyperlink ? 'white' : '#333',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🔗 Link
                  </button>
                  {previewFormat.isHyperlink && (
                    <input
                      type="url"
                      placeholder="Enter URL..."
                      value={previewFormat.hyperlinkUrl}
                      onChange={(e) => applyFormatting('hyperlinkUrl', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#666',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDone}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #2196F3',
                    borderRadius: '4px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </Html>
        )}
      </>
    );
  }

  // Plain text element
  return (
    <>
      <Text
        ref={textRef}
        x={element.x}
        y={element.y}
        width={element.width || 200}
        {...textDisplayProps}
        align="left"
        stroke={isSelected ? designSystem.colors.primary.blue : 'transparent'}
        strokeWidth={isSelected ? 1 : 0}
        opacity={isEditing ? 0.5 : 1}
        onClick={(e) => {
          if (!isEditing && currentIsHyperlink && (element as any).hyperlinkUrl) {
            handleTextClick(e);
          } else {
            onSelect(element.id);
          }
        }}
        onTap={(e) => {
          if (!isEditing && currentIsHyperlink && (element as any).hyperlinkUrl) {
            handleTextClick(e);
          }
        }}
        onDblClick={handleDoubleClick}
        {...konvaProps}
      />

      {/* Textarea for editing */}
      {isEditing && textareaPosition && (
        <Html
          groupProps={{
            x: 0,
            y: 0
          }}
        >
          <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                // Prevent global canvas keydown handler from interfering with text editing
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
              listStyleType: previewFormat.listType === 'bullet' ? 'disc' : 
                            previewFormat.listType === 'numbered' ? 'decimal' : 'none'
            }}
          />
        </Html>
      )}

      {/* Formatting Menu */}
      {showFormatMenu && menuPosition && textareaPosition && (
        <Html
          groupProps={{
            x: 0,
            y: 0
          }}
        >
          <div
            style={{
              position: 'fixed',
              left: textareaPosition.x + 'px',
              top: menuPosition.y + 'px',
              width: textareaPosition.width + 'px',
              backgroundColor: 'white',
              border: '2px solid #2196F3',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              borderBottomLeftRadius: '0px',
              borderBottomRightRadius: '0px',
              borderBottom: 'none',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              marginBottom: '12px', 
              color: '#333',
              borderBottom: '1px solid #eee',
              paddingBottom: '8px'
            }}>
              Text Formatting
            </div>

            {/* Style Buttons */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#666' }}>
                STYLE
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => applyFormatting('bold')}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: appliedFormats.has('bold') ? '#2196F3' : 'white',
                    color: appliedFormats.has('bold') ? 'white' : '#333',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  B
                </button>
                <button
                  onClick={() => applyFormatting('italic')}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: appliedFormats.has('italic') ? '#2196F3' : 'white',
                    color: appliedFormats.has('italic') ? 'white' : '#333',
                    fontStyle: 'italic',
                    cursor: 'pointer'
                  }}
                >
                  I
                </button>
                <button
                  onClick={() => applyFormatting('underline')}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: appliedFormats.has('underline') ? '#2196F3' : 'white',
                    color: appliedFormats.has('underline') ? 'white' : '#333',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  U
                </button>
                <button
                  onClick={() => applyFormatting('strikethrough')}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: appliedFormats.has('strikethrough') ? '#2196F3' : 'white',
                    color: appliedFormats.has('strikethrough') ? 'white' : '#333',
                    textDecoration: 'line-through',
                    cursor: 'pointer'
                  }}
                >
                  S
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#666' }}>
                SIZE
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => applyFormatting('fontSize', Math.max(8, previewFormat.fontSize - 2))}
                  style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                >
                  A-
                </button>
                <input
                  type="number"
                  value={previewFormat.fontSize}
                  onChange={(e) => applyFormatting('fontSize', parseInt(e.target.value) || 16)}
                  style={{ width: '60px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}
                />
                <button
                  onClick={() => applyFormatting('fontSize', Math.min(72, previewFormat.fontSize + 2))}
                  style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Color Picker */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#666' }}>
                COLOR
              </div>
              <div>
                <input
                  type="color"
                  value={previewFormat.color}
                  onChange={(e) => applyFormatting('color', e.target.value)}
                  style={{ width: '40px', height: '32px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* List Type */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#666' }}>
                LIST
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => applyFormatting('listType', 'none')}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: previewFormat.listType === 'none' ? '#2196F3' : 'white',
                    color: previewFormat.listType === 'none' ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  None
                </button>
                <button
                  onClick={() => applyFormatting('listType', 'bullet')}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: previewFormat.listType === 'bullet' ? '#2196F3' : 'white',
                    color: previewFormat.listType === 'bullet' ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  • Bullet
                </button>
                <button
                  onClick={() => applyFormatting('listType', 'numbered')}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: previewFormat.listType === 'numbered' ? '#2196F3' : 'white',
                    color: previewFormat.listType === 'numbered' ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  1. Numbered
                </button>
              </div>
            </div>

            {/* Hyperlink */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#666' }}>
                HYPERLINK
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => applyFormatting('isHyperlink')}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: previewFormat.isHyperlink ? '#2196F3' : 'white',
                    color: previewFormat.isHyperlink ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🔗 Link
                </button>
                {previewFormat.isHyperlink && (
                  <input
                    type="url"
                    placeholder="Enter URL..."
                    value={previewFormat.hyperlinkUrl}
                    onChange={(e) => applyFormatting('hyperlinkUrl', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #2196F3',
                  borderRadius: '4px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </Html>
      )}
    </>
  );
};

export default UnifiedTextElement;
