import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Link, X, Type, Palette, List } from 'lucide-react';
import { designSystem } from '../../styles/designSystem';

interface TextFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  listType?: 'none' | 'bullet' | 'numbered';
  isHyperlink?: boolean;
  hyperlinkUrl?: string;
}

interface StandardTextFormattingMenuProps {
  position: { x: number; y: number };
  width?: number;
  format: TextFormat;
  onFormatChange: (format: Partial<TextFormat>) => void;
  onClose: () => void;
  onDone?: () => void;
  title?: string;
  showDoneButton?: boolean;
}

export const StandardTextFormattingMenu: React.FC<StandardTextFormattingMenuProps> = ({
  position,
  width = 320,
  format,
  onFormatChange,
  onClose,
  onDone,
  title = "Text Formatting",
  showDoneButton = false
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        // Don't close if clicking on textarea or other canvas elements
        if (!target.closest('textarea') && !target.closest('.konva-content')) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleFormatClick = (formatType: string, value?: any) => {
    if (formatType === 'bold') {
      onFormatChange({ bold: !format.bold });
    } else if (formatType === 'italic') {
      onFormatChange({ italic: !format.italic });
    } else if (formatType === 'underline') {
      onFormatChange({ underline: !format.underline });
    } else if (formatType === 'strikethrough') {
      onFormatChange({ strikethrough: !format.strikethrough });
    } else if (formatType === 'fontSize') {
      onFormatChange({ fontSize: value });
    } else if (formatType === 'color') {
      onFormatChange({ color: value });
    } else if (formatType === 'fontFamily') {
      onFormatChange({ fontFamily: value });
    } else if (formatType === 'listType') {
      // DIAGNOSTIC: Log list type changes
      console.log('🔍 [LIST DEBUG] List type change requested:', {
        currentListType: format.listType,
        newListType: value,
        formatObject: format
      });
      onFormatChange({ listType: value });
    } else if (formatType === 'isHyperlink') {
      onFormatChange({ isHyperlink: !format.isHyperlink });
    } else if (formatType === 'hyperlinkUrl') {
      onFormatChange({ hyperlinkUrl: value });
    }
  };

  const buttonStyle = (isActive: boolean = false) => ({
    padding: '8px',
    border: `1px solid ${isActive ? designSystem.colors.primary[400] : designSystem.colors.secondary[200]}`,
    borderRadius: '6px',
    background: isActive ? designSystem.colors.primary[50] : 'white',
    cursor: 'pointer',
    fontSize: '14px',
    color: isActive ? designSystem.colors.primary[700] : designSystem.colors.secondary[700],
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    height: '36px'
  });

  const sectionStyle = {
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${designSystem.colors.secondary[100]}`,
  };

  const sectionHeaderStyle = {
    fontSize: '11px',
    fontWeight: '600' as const,
    color: designSystem.colors.secondary[500],
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  // Color presets
  const colorPresets = [
    '#000000', // Black
    '#64748B', // Gray
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
  ];

  // Font presets
  const fontPresets = [
    { name: 'Sans', value: 'Inter, system-ui, sans-serif' },
    { name: 'Serif', value: 'Georgia, serif' },
    { name: 'Mono', value: 'Consolas, monospace' },
  ];

  console.log('🔍 [MENU DEBUG] StandardTextFormattingMenu rendering with:', {
    position,
    width,
    format,
    showDoneButton,
    title
  });

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x + 'px',
        top: position.y + 'px',
        width: width + 'px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${designSystem.colors.secondary[200]}`,
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
        fontFamily: designSystem.typography.fontFamily.sans,
        boxSizing: 'border-box',
        zIndex: 10000,
        maxHeight: '80vh',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
      className="text-formatting-menu"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: `1px solid ${designSystem.colors.secondary[100]}`,
        position: 'sticky',
        top: 0,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '12px 12px 0 0',
        zIndex: 1
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: designSystem.colors.secondary[800],
        }}>{title}</span>
        <button
          onClick={onClose}
          style={{
            padding: '6px',
            border: 'none',
            borderRadius: '6px',
            background: 'transparent',
            cursor: 'pointer',
            color: designSystem.colors.secondary[500],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = designSystem.colors.secondary[100];
            e.currentTarget.style.color = designSystem.colors.secondary[700];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = designSystem.colors.secondary[500];
          }}
          title="Close (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Text Style Section */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <Type size={12} />
            Text Style
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleFormatClick('bold')}
              style={buttonStyle(format.bold)}
              onMouseEnter={(e) => {
                if (!format.bold) {
                  e.currentTarget.style.background = designSystem.colors.secondary[50];
                  e.currentTarget.style.borderColor = designSystem.colors.secondary[300];
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = format.bold ? designSystem.colors.primary[50] : 'white';
                e.currentTarget.style.borderColor = format.bold ? designSystem.colors.primary[400] : designSystem.colors.secondary[200];
              }}
              title="Bold (Ctrl+B)"
            >
              <Bold size={18} />
            </button>
            <button
              onClick={() => handleFormatClick('italic')}
              style={buttonStyle(format.italic)}
              onMouseEnter={(e) => {
                if (!format.italic) {
                  e.currentTarget.style.background = designSystem.colors.secondary[50];
                  e.currentTarget.style.borderColor = designSystem.colors.secondary[300];
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = format.italic ? designSystem.colors.primary[50] : 'white';
                e.currentTarget.style.borderColor = format.italic ? designSystem.colors.primary[400] : designSystem.colors.secondary[200];
              }}
              title="Italic (Ctrl+I)"
            >
              <Italic size={18} />
            </button>
            <button
              onClick={() => handleFormatClick('underline')}
              style={buttonStyle(format.underline)}
              onMouseEnter={(e) => {
                if (!format.underline) {
                  e.currentTarget.style.background = designSystem.colors.secondary[50];
                  e.currentTarget.style.borderColor = designSystem.colors.secondary[300];
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = format.underline ? designSystem.colors.primary[50] : 'white';
                e.currentTarget.style.borderColor = format.underline ? designSystem.colors.primary[400] : designSystem.colors.secondary[200];
              }}
              title="Underline (Ctrl+U)"
            >
              <Underline size={18} />
            </button>
            <button
              onClick={() => handleFormatClick('strikethrough')}
              style={{
                ...buttonStyle(format.strikethrough),
                fontSize: '16px',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                if (!format.strikethrough) {
                  e.currentTarget.style.background = designSystem.colors.secondary[50];
                  e.currentTarget.style.borderColor = designSystem.colors.secondary[300];
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = format.strikethrough ? designSystem.colors.primary[50] : 'white';
                e.currentTarget.style.borderColor = format.strikethrough ? designSystem.colors.primary[400] : designSystem.colors.secondary[200];
              }}
              title="Strikethrough"
            >
              <span style={{ textDecoration: 'line-through' }}>S</span>
            </button>
          </div>
        </div>

        {/* Font & Size Section */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Font & Size</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {fontPresets.map(font => (
              <button
                key={font.value}
                onClick={() => handleFormatClick('fontFamily', font.value)}
                style={{
                  ...buttonStyle(format.fontFamily === font.value),
                  minWidth: '60px',
                  fontSize: '12px',
                  fontFamily: font.value
                }}
                onMouseEnter={(e) => {
                  if (format.fontFamily !== font.value) {
                    e.currentTarget.style.background = designSystem.colors.secondary[50];
                    e.currentTarget.style.borderColor = designSystem.colors.secondary[300];
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = format.fontFamily === font.value ? designSystem.colors.primary[50] : 'white';
                  e.currentTarget.style.borderColor = format.fontFamily === font.value ? designSystem.colors.primary[400] : designSystem.colors.secondary[200];
                }}
              >
                {font.name}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => handleFormatClick('fontSize', Math.max(8, (format.fontSize || 16) - 2))}
              style={{
                ...buttonStyle(false),
                fontSize: '18px',
                fontWeight: '600'
              }}
              title="Decrease Font Size"
            >
              -
            </button>
            <div style={{
              padding: '6px 16px',
              background: designSystem.colors.secondary[50],
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: designSystem.colors.secondary[700],
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {format.fontSize || 16}px
            </div>
            <button
              onClick={() => handleFormatClick('fontSize', Math.min(72, (format.fontSize || 16) + 2))}
              style={{
                ...buttonStyle(false),
                fontSize: '18px',
                fontWeight: '600'
              }}
              title="Increase Font Size"
            >
              +
            </button>
          </div>
        </div>

        {/* Color Section */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <Palette size={12} />
            Color
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {colorPresets.map(color => (
              <button
                key={color}
                onClick={() => handleFormatClick('color', color)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: format.color === color ? '2px solid ' + designSystem.colors.primary[400] : '1px solid ' + designSystem.colors.secondary[200],
                  background: color,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative' as const
                }}
                onMouseEnter={(e) => {
                  if (format.color !== color) {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title={color}
              >
                {format.color === color && (
                  <div style={{
                    position: 'absolute',
                    inset: '4px',
                    border: '2px solid white',
                    borderRadius: '3px'
                  }} />
                )}
              </button>
            ))}
            <label style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid ' + designSystem.colors.secondary[200],
              background: `linear-gradient(45deg, ${designSystem.colors.secondary[100]} 25%, transparent 25%, transparent 75%, ${designSystem.colors.secondary[100]} 75%, ${designSystem.colors.secondary[100]}), linear-gradient(45deg, ${designSystem.colors.secondary[100]} 25%, white 25%, white 75%, ${designSystem.colors.secondary[100]} 75%)`,
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 4px 4px',
              cursor: 'pointer',
              position: 'relative' as const,
              overflow: 'hidden'
            }}>
              <input
                type="color"
                value={format.color || '#000000'}
                onChange={(e) => handleFormatClick('color', e.target.value)}
                style={{
                  position: 'absolute',
                  inset: '-2px',
                  opacity: 0,
                  cursor: 'pointer'
                }}
                title="Custom Color"
              />
              <div style={{
                position: 'absolute',
                inset: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: designSystem.colors.secondary[600]
              }}>
                +
              </div>
            </label>
          </div>
        </div>

        {/* List Type Section */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <List size={12} />
            List Type
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleFormatClick('listType', 'none')}
              style={{
                ...buttonStyle(format.listType === 'none'),
                fontSize: '12px',
                fontWeight: '500',
                minWidth: '60px'
              }}
            >
              None
            </button>
            <button
              onClick={() => handleFormatClick('listType', 'bullet')}
              style={{
                ...buttonStyle(format.listType === 'bullet'),
                fontSize: '12px',
                fontWeight: '500',
                minWidth: '60px'
              }}
            >
              • Bullet
            </button>
            <button
              onClick={() => handleFormatClick('listType', 'numbered')}
              style={{
                ...buttonStyle(format.listType === 'numbered'),
                fontSize: '12px',
                fontWeight: '500',
                minWidth: '70px'
              }}
            >
              1. Number
            </button>
          </div>
        </div>

        {/* Hyperlink Section */}
        <div style={{ marginBottom: showDoneButton ? '12px' : '0' }}>
          <div style={sectionHeaderStyle}>
            <Link size={12} />
            Hyperlink
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => handleFormatClick('isHyperlink')}
              style={{
                ...buttonStyle(format.isHyperlink),
                minWidth: '80px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {format.isHyperlink ? 'Remove Link' : 'Add Link'}
            </button>
            {format.isHyperlink && (
              <input
                type="url"
                placeholder="https://example.com"
                value={format.hyperlinkUrl || ''}
                onChange={(e) => handleFormatClick('hyperlinkUrl', e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: `1px solid ${designSystem.colors.secondary[200]}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = designSystem.colors.primary[400];
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = designSystem.colors.secondary[200];
                }}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showDoneButton && onDone && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            justifyContent: 'flex-end',
            paddingTop: '12px',
            borderTop: `1px solid ${designSystem.colors.secondary[100]}`
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 20px',
                border: `1px solid ${designSystem.colors.secondary[300]}`,
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                color: designSystem.colors.secondary[700],
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = designSystem.colors.secondary[50];
                e.currentTarget.style.borderColor = designSystem.colors.secondary[400];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = designSystem.colors.secondary[300];
              }}
            >
              Cancel
            </button>
            <button
              onClick={onDone}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: '8px',
                background: designSystem.colors.primary[500],
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: 'white',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = designSystem.colors.primary[600];
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = designSystem.colors.primary[500];
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
