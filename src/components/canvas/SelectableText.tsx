// src/components/Canvas/SelectableText.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Text, Group, Rect } from 'react-konva';
import { Html } from 'react-konva-utils';
import Konva from 'konva';
import { Bold, Italic, Underline, Link, X } from 'lucide-react';
import { designSystem } from '../../styles/designSystem';

interface SelectableTextProps {
  element: {
    id: string;
    type?: 'text' | 'rich-text';
    x: number;
    y: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    width?: number;
    height?: number;
    segments?: Array<{
      text: string;
      fontSize?: number;
      fontFamily?: string;
      fontStyle?: string;
      fontWeight?: string;
      textDecoration?: string;
      fill?: string;
      url?: string;
    }>;
  };
  isEditing: boolean;
  onTextUpdate: (elementId: string, newText: string) => void;
  onEditingCancel: () => void;
  onDblClick: () => void;
  onFormatChange?: (elementId: string, format: any, selection: { start: number; end: number }) => void;
  [key: string]: any; // For other Konva props
}

const SelectableText: React.FC<SelectableTextProps> = ({
  element,
  isEditing,
  onTextUpdate,
  onEditingCancel,
  onDblClick,
  onFormatChange,
  ...konvaProps
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const textRef = useRef<Konva.Text>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Convert rich text segments to plain text for editing
  const getPlainText = () => {
    if (element.type === 'rich-text' && element.segments) {
      return element.segments.map(segment => segment.text).join('');
    }
    return element.text || 'Click to edit';
  };

  // Get formatting at current selection
  const getSelectionFormat = () => {
    if (!selection || element.type !== 'rich-text' || !element.segments) {
      return { bold: false, italic: false, underline: false };
    }

    let currentPos = 0;
    let bold = false;
    let italic = false;
    let underline = false;

    for (const segment of element.segments) {
      const segmentEnd = currentPos + segment.text.length;
      
      // Check if this segment overlaps with selection
      if (currentPos < selection.end && segmentEnd > selection.start) {
        if (segment.fontWeight === 'bold') bold = true;
        if (segment.fontStyle === 'italic') italic = true;
        if (segment.textDecoration === 'underline') underline = true;
      }
      
      currentPos = segmentEnd;
      if (currentPos >= selection.end) break;
    }

    return { bold, italic, underline };
  };

  const currentFormat = selection ? getSelectionFormat() : { bold: false, italic: false, underline: false };

  // Default text properties using design system
  const text = getPlainText();
  const fontSize = element.fontSize || designSystem.typography.fontSize.base;
  const fontFamily = element.fontFamily || designSystem.typography.fontFamily.sans;
  const fill = element.fill || designSystem.colors.secondary[900];
  const width = element.width || 200;
  const height = element.height || Math.max(30, fontSize * 1.5);

  // Calculate textarea position when editing
  const getTextareaPosition = () => {
    if (!textRef.current) return { x: 0, y: 0 };
    
    const textNode = textRef.current;
    const stage = textNode.getStage();
    if (!stage) return { x: 0, y: 0 };

    // Get the text node's position in stage coordinates
    const textPosition = textNode.getAbsolutePosition();
    
    // Transform stage coordinates to screen coordinates
    const stageTransform = stage.getAbsoluteTransform();
    const screenPosition = stageTransform.point(textPosition);
    
    // Get stage container's position on screen
    const stageContainer = stage.container();
    const containerRect = stageContainer.getBoundingClientRect();
    
    return {
      x: containerRect.left + screenPosition.x,
      y: containerRect.top + screenPosition.y
    };
  };

  // Handle context menu
  const handleContextMenu = useCallback((e: any) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    
    const stage = e.target.getStage();
    if (stage && text && text.length > 0) {
      const containerRect = stage.container().getBoundingClientRect();
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        setContextMenuPos({
          x: containerRect.left + pointerPos.x,
          y: containerRect.top + pointerPos.y - 40
        });
        // Select all text on right-click for now
        setSelection({ start: 0, end: text.length });
        setShowContextMenu(true);
      }
    }
  }, [text]);

  // Handle text selection for formatting
  const handleTextSelection = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start !== end) {
      setSelection({ start, end });
      // Show context menu when text is selected in textarea
      const textareaRect = textareaRef.current.getBoundingClientRect();
      setContextMenuPos({
        x: textareaRect.left + textareaRect.width / 2,
        y: textareaRect.top - 10
      });
      setShowContextMenu(true);
    } else {
      setSelection(null);
      setShowContextMenu(false);
    }
  };

  // Apply text formatting
  const applyFormat = (format: any, closeMenu: boolean = false) => {
    if (!selection || !onFormatChange) return;
    
    console.log('🎨 Applying format:', format);
    onFormatChange(element.id, format, selection);
    console.log('✅ Format applied');
    
    // Force textarea to update by updating its key
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Small delay to allow the store to update, then refresh textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = getPlainText();
          textareaRef.current.setSelectionRange(start, end);
          setSelection({ start, end }); // Refresh selection to update button states
        }
      }, 50);
    }
    
    // Only close menu if explicitly requested
    if (closeMenu) {
      setTimeout(() => {
        setShowContextMenu(false);
        setSelection(null);
      }, 150);
    }
  };

  // Add URL to selected text
  const addUrl = () => {
    if (!selection || !onFormatChange) return;
    
    const url = prompt('Enter URL:');
    if (url && url.trim()) {
      onFormatChange(element.id, { url: url.trim() }, selection);
    }
    // Close menu after adding URL since it opens a prompt
    setShowContextMenu(false);
    setSelection(null);
  };

  // Increase font size
  const increaseFontSize = () => {
    const currentSize = fontSize || 16;
    const newSize = Math.min(currentSize + 2, 72); // Max size 72px
    applyFormat({ fontSize: newSize }, false); // Don't close menu
  };

  // Decrease font size
  const decreaseFontSize = () => {
    const currentSize = fontSize || 16;
    const newSize = Math.max(currentSize - 2, 8); // Min size 8px
    applyFormat({ fontSize: newSize }, false); // Don't close menu
  };

  // Add bullet point
  const addBulletPoint = () => {
    if (selection && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      const bulletText = `• ${selectedText}`;
      
      const newText = textarea.value.substring(0, start) + bulletText + textarea.value.substring(end);
      textarea.value = newText;
      onTextUpdate(element.id, newText);
      setShowContextMenu(false);
      setSelection(null);
    }
  };

  // Add numbered list
  const addNumberedList = () => {
    if (selection && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      const numberedText = `1. ${selectedText}`;
      
      const newText = textarea.value.substring(0, start) + numberedText + textarea.value.substring(end);
      textarea.value = newText;
      onTextUpdate(element.id, newText);
      setShowContextMenu(false);
      setSelection(null);
    }
  };

  // Handle clicks outside context menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on the context menu itself
      if (contextMenuRef.current && contextMenuRef.current.contains(event.target as Node)) {
        return;
      }
      
      // Don't close if clicking on the textarea (we want to keep formatting menu open)
      if (textareaRef.current && textareaRef.current.contains(event.target as Node)) {
        return;
      }
      
      // Close menu for any other clicks
      setShowContextMenu(false);
      setSelection(null);
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showContextMenu]);

  return (
    <>
      <Group {...konvaProps}>
        <Text
          ref={textRef}
          text={text}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fill={fill}
          width={width}
          height={height}
          align="left"
          verticalAlign="middle"
          onDblClick={onDblClick}
          onContextMenu={handleContextMenu}
          onMouseDown={(e) => {
            // Prevent default text selection behavior
            e.cancelBubble = true;
          }}
          onMouseUp={(e) => {
            // For now, select all text when clicking on the text element
            // This is a simplified approach - in a full implementation you'd
            // need to calculate character positions based on click coordinates
            if (text && text.length > 0) {
              const stage = e.target.getStage();
              if (stage) {
                const containerRect = stage.container().getBoundingClientRect();
                const pointerPos = stage.getPointerPosition();
                if (pointerPos) {
                  setContextMenuPos({
                    x: containerRect.left + pointerPos.x,
                    y: containerRect.top + pointerPos.y - 40
                  });
                  setSelection({ start: 0, end: text.length });
                  setShowContextMenu(true);
                }
              }
            }
          }}
          visible={!isEditing}
        />
        
        {/* Background rect for text bounds (only when selected) */}
        {konvaProps.draggable && !isEditing && (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="transparent"
            stroke={designSystem.colors.primary[500]}
            strokeWidth={1}
            dash={[2, 2]}
            listening={false}
          />
        )}
        {/* Inline text editor */}
        {isEditing && (
          <Html>
            <textarea
            ref={textareaRef}
            style={{
              position: 'absolute',
              left: '0px',
              top: '0px',
              width: `${width}px`,
              minHeight: `${height}px`,
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              color: fill,
              border: `2px solid ${designSystem.colors.primary[500]}`,
              borderRadius: '4px',
              padding: '4px',
              background: 'white',
              resize: 'both',
              overflow: 'auto',
              zIndex: 1000,
              outline: 'none',
              boxShadow: designSystem.shadows.lg
            }}
            defaultValue={text}
            key={`${element.id}-${JSON.stringify(element.segments || element.text)}`} // Force re-render when content changes
            autoFocus
            onBlur={(e) => {
              onTextUpdate(element.id, e.target.value);
              onEditingCancel();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onEditingCancel();
              } else if (e.key === 'Enter' && e.ctrlKey) {
                onTextUpdate(element.id, e.currentTarget.value);
                onEditingCancel();
              }
            }}
            onSelect={handleTextSelection}
          />
        </Html>
      )}
      </Group>

      {/* Context Menu */}
      {showContextMenu && selection && (
        <Html>
          <div
            ref={contextMenuRef}
            style={{
              position: 'absolute',
              left: contextMenuPos.x,
              top: contextMenuPos.y,
              transform: 'translate(-50%, -100%)',
              background: 'white',
              border: `1px solid ${designSystem.colors.secondary[200]}`,
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
              padding: '12px',
              zIndex: 1001,
              pointerEvents: 'auto',
              minWidth: '280px',
              fontFamily: designSystem.typography.fontFamily.sans
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: `1px solid ${designSystem.colors.secondary[100]}`
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: '600',
                color: designSystem.colors.secondary[700]
              }}>Text Formatting</span>
              <button
                onClick={() => setShowContextMenu(false)}
                style={{
                  padding: '4px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: designSystem.colors.secondary[500],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = designSystem.colors.secondary[100]}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            {/* Text Style Section */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '500',
                color: designSystem.colors.secondary[600],
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Style</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      applyFormat({ fontWeight: currentFormat.bold ? 'normal' : 'bold' }, false);
                    }}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${currentFormat.bold ? designSystem.colors.primary[400] : designSystem.colors.secondary[200]}`,
                    borderRadius: '8px',
                    background: currentFormat.bold ? designSystem.colors.primary[100] : 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: currentFormat.bold ? designSystem.colors.primary[700] : designSystem.colors.secondary[700],
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!currentFormat.bold) {
                      e.currentTarget.style.background = designSystem.colors.primary[50];
                      e.currentTarget.style.borderColor = designSystem.colors.primary[300];
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = currentFormat.bold ? designSystem.colors.primary[100] : 'white';
                    e.currentTarget.style.borderColor = currentFormat.bold ? designSystem.colors.primary[400] : designSystem.colors.secondary[200];
                  }}
                  title={currentFormat.bold ? "Remove Bold" : "Bold"}
                >
                  <Bold size={16} />
                </button>
                <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      applyFormat({ fontStyle: currentFormat.italic ? 'normal' : 'italic' }, false);
                    }}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${currentFormat.italic ? designSystem.colors.primary[400] : designSystem.colors.secondary[200]}`,
                    borderRadius: '8px',
                    background: currentFormat.italic ? designSystem.colors.primary[100] : 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: currentFormat.italic ? designSystem.colors.primary[700] : designSystem.colors.secondary[700],
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!currentFormat.italic) {
                      e.currentTarget.style.background = designSystem.colors.primary[50];
                      e.currentTarget.style.borderColor = designSystem.colors.primary[300];
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = currentFormat.italic ? designSystem.colors.primary[100] : 'white';
                    e.currentTarget.style.borderColor = currentFormat.italic ? designSystem.colors.primary[400] : designSystem.colors.secondary[200];
                  }}
                  title={currentFormat.italic ? "Remove Italic" : "Italic"}
                >
                  <Italic size={16} />
                </button>
                <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      applyFormat({ textDecoration: currentFormat.underline ? 'none' : 'underline' }, false);
                    }}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${currentFormat.underline ? designSystem.colors.primary[400] : designSystem.colors.secondary[200]}`,
                    borderRadius: '8px',
                    background: currentFormat.underline ? designSystem.colors.primary[100] : 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: currentFormat.underline ? designSystem.colors.primary[700] : designSystem.colors.secondary[700],
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!currentFormat.underline) {
                      e.currentTarget.style.background = designSystem.colors.primary[50];
                      e.currentTarget.style.borderColor = designSystem.colors.primary[300];
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = currentFormat.underline ? designSystem.colors.primary[100] : 'white';
                    e.currentTarget.style.borderColor = currentFormat.underline ? designSystem.colors.primary[400] : designSystem.colors.secondary[200];
                  }}
                  title={currentFormat.underline ? "Remove Underline" : "Underline"}
                >
                  <Underline size={16} />
                </button>
                <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      applyFormat({ textDecoration: 'line-through' }, false); // Don't close menu
                    }}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${designSystem.colors.secondary[200]}`,
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: designSystem.colors.secondary[700],
                    transition: 'all 0.15s ease',
                    textDecoration: 'line-through'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = designSystem.colors.primary[50];
                    e.currentTarget.style.borderColor = designSystem.colors.primary[300];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = designSystem.colors.secondary[200];
                  }}
                  title="Strikethrough"
                >
                  S
                </button>
              </div>
            </div>
            
            {/* Font Size Section */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '500',
                color: designSystem.colors.secondary[600],
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Size</div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={decreaseFontSize}
                  style={{
                    padding: '6px 10px',
                    border: `1px solid ${designSystem.colors.secondary[200]}`,
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: designSystem.colors.secondary[700],
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = designSystem.colors.primary[50];
                    e.currentTarget.style.borderColor = designSystem.colors.primary[300];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = designSystem.colors.secondary[200];
                  }}
                  title="Decrease Font Size"
                >
                  A-
                </button>
                <div style={{
                  padding: '6px 12px',
                  background: designSystem.colors.secondary[50],
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: designSystem.colors.secondary[700],
                  minWidth: '45px',
                  textAlign: 'center'
                }}>
                  {fontSize || 16}px
                </div>
                <button
                  onClick={increaseFontSize}
                  style={{
                    padding: '6px 10px',
                    border: `1px solid ${designSystem.colors.secondary[200]}`,
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: designSystem.colors.secondary[700],
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = designSystem.colors.primary[50];
                    e.currentTarget.style.borderColor = designSystem.colors.primary[300];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = designSystem.colors.secondary[200];
                  }}
                  title="Increase Font Size"
                >
                  A+
                </button>
              </div>
            </div>
            
            {/* Actions Section */}
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: '500',
                color: designSystem.colors.secondary[600],
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Actions</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={addBulletPoint}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${designSystem.colors.secondary[200]}`,
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: designSystem.colors.secondary[700],
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = designSystem.colors.primary[50];
                    e.currentTarget.style.borderColor = designSystem.colors.primary[300];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = designSystem.colors.secondary[200];
                  }}
                  title="Add Bullet Point"
                >
                  •
                </button>
                <button
                  onClick={addNumberedList}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${designSystem.colors.secondary[200]}`,
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: designSystem.colors.secondary[700],
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = designSystem.colors.primary[50];
                    e.currentTarget.style.borderColor = designSystem.colors.primary[300];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = designSystem.colors.secondary[200];
                  }}
                  title="Add Numbered List"
                >
                  1.
                </button>
                <button
                  onClick={addUrl}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${designSystem.colors.secondary[200]}`,
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: designSystem.colors.secondary[700],
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = designSystem.colors.primary[50];
                    e.currentTarget.style.borderColor = designSystem.colors.primary[300];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = designSystem.colors.secondary[200];
                  }}
                  title="Add Link"
                >
                  <Link size={16} />
                </button>
              </div>
            </div>
            
            {/* Done button */}
            <div style={{ 
              marginTop: '12px', 
              paddingTop: '12px', 
              borderTop: `1px solid ${designSystem.colors.secondary[200]}`,
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowContextMenu(false);
                  setSelection(null);
                }}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${designSystem.colors.primary[300]}`,
                  borderRadius: '8px',
                  background: designSystem.colors.primary[500],
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'white',
                  fontWeight: '500',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = designSystem.colors.primary[600];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = designSystem.colors.primary[500];
                }}
                title="Close formatting menu"
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

export default SelectableText;
