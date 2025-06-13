// src/components/canvas/TextFormattingMenu.tsx
import React from 'react';
import { createPortal } from 'react-dom';
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

interface TextFormattingMenuProps {
  x: number;
  y: number;
  width: number;
  previewFormat: TextFormat;
  appliedFormats: Set<string>;
  onFormatting: (type: string, value?: any) => void;
  onCancel: () => void;
  onDone: () => void;
}

export const TextFormattingMenu: React.FC<TextFormattingMenuProps> = ({
  x,
  y,
  width,
  previewFormat,
  appliedFormats,
  onFormatting,
  onCancel,
  onDone
}) => {
  console.log('🐛 [DEBUG] TextFormattingMenu rendered with props:', {
    position: { x, y },
    width,
    appliedFormats: Array.from(appliedFormats)
  });
  
  // Use the calculated position from UnifiedTextElement (no additional positioning logic needed)
  const menuWidth = Math.max(320, width);
  
  const menuStyle = {
    position: 'fixed' as const,
    left: `${x}px`,
    top: `${y}px`,
    width: `${menuWidth}px`,
    backgroundColor: designSystem.colors.secondary[100] || 'rgba(255, 255, 255, 0.98)',
    border: `2px solid ${designSystem.colors.primary[500] || '#2196F3'}`,
    borderRadius: `${designSystem.borderRadius.lg || 12}px`,
    padding: designSystem.spacing?.md || '16px',
    boxShadow: designSystem.shadows?.lg || '0 8px 32px rgba(0, 0, 0, 0.12)',
    fontFamily: designSystem.typography?.fontFamily?.sans || 'Inter, sans-serif',
    boxSizing: 'border-box' as const,
    backdropFilter: 'blur(12px)',
    zIndex: 10000
  };
  
  console.log('🐛 [DEBUG] TextFormattingMenu final style:', menuStyle);

  const buttonBaseStyle = {
    padding: '10px 14px',
    border: '1px solid rgba(0, 0, 0, 0.15)',
    borderRadius: `${designSystem.borderRadius.md || 8}px`,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    color: '#333',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  const buttonActiveStyle = {
    ...buttonBaseStyle,
    border: `1px solid ${designSystem.colors.primary[500] || '#2196F3'}`,
    backgroundColor: designSystem.colors.primary[500] || '#2196F3',
    color: 'white',
    boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
  };

  return createPortal(
    <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: '600', 
        marginBottom: '16px', 
        color: '#1a1a1a',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        paddingBottom: '12px'
      }}>
        Text Formatting
      </div>

      {/* Style Buttons */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#666', letterSpacing: '0.8px' }}>
          STYLE
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onFormatting('bold')}
            style={appliedFormats.has('bold') ? buttonActiveStyle : buttonBaseStyle}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => onFormatting('italic')}
            style={{
              ...(appliedFormats.has('italic') ? buttonActiveStyle : buttonBaseStyle),
              fontStyle: 'italic'
            }}
          >
            I
          </button>
          <button
            onClick={() => onFormatting('underline')}
            style={{
              ...(appliedFormats.has('underline') ? buttonActiveStyle : buttonBaseStyle),
              textDecoration: 'underline'
            }}
          >
            U
          </button>
          <button
            onClick={() => onFormatting('strikethrough')}
            style={{
              ...(appliedFormats.has('strikethrough') ? buttonActiveStyle : buttonBaseStyle),
              textDecoration: 'line-through'
            }}
          >
            S
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#666', letterSpacing: '0.8px' }}>
          SIZE
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => onFormatting('fontSize', Math.max(8, previewFormat.fontSize - 2))}
            style={buttonBaseStyle}
          >
            A-
          </button>
          <input
            type="number"
            value={previewFormat.fontSize}
            onChange={(e) => onFormatting('fontSize', parseInt(e.target.value) || 16)}
            style={{ 
              width: '60px', 
              padding: '8px', 
              border: '1px solid rgba(0, 0, 0, 0.15)', 
              borderRadius: '6px', 
              textAlign: 'center',
              fontSize: '14px'
            }}
            min="8"
            max="72"
          />
          <button
            onClick={() => onFormatting('fontSize', Math.min(72, previewFormat.fontSize + 2))}
            style={buttonBaseStyle}
          >
            A+
          </button>
        </div>
      </div>

      {/* Color Picker */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#666', letterSpacing: '0.8px' }}>
          COLOR
        </div>
        <input
          type="color"
          value={previewFormat.color}
          onChange={(e) => onFormatting('color', e.target.value)}
          style={{ 
            width: '48px', 
            height: '36px', 
            border: '1px solid rgba(0, 0, 0, 0.15)', 
            borderRadius: '8px', 
            cursor: 'pointer'
          }}
        />
      </div>

      {/* List Type */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#666', letterSpacing: '0.8px' }}>
          LIST
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onFormatting('listType', 'none')}
            style={previewFormat.listType === 'none' ? buttonActiveStyle : buttonBaseStyle}
          >
            None
          </button>
          <button
            onClick={() => onFormatting('listType', 'bullet')}
            style={previewFormat.listType === 'bullet' ? buttonActiveStyle : buttonBaseStyle}
          >
            • Bullet
          </button>
          <button
            onClick={() => onFormatting('listType', 'numbered')}
            style={previewFormat.listType === 'numbered' ? buttonActiveStyle : buttonBaseStyle}
          >
            1. Numbered
          </button>
        </div>
      </div>

      {/* Hyperlink */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#666', letterSpacing: '0.8px' }}>
          HYPERLINK
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexDirection: 'column' }}>
          <button
            onClick={() => onFormatting('isHyperlink')}
            style={previewFormat.isHyperlink ? buttonActiveStyle : buttonBaseStyle}
          >
            🔗 {previewFormat.isHyperlink ? 'Remove Link' : 'Add Link'}
          </button>
          {previewFormat.isHyperlink && (
            <input
              type="url"
              placeholder="Enter URL..."
              value={previewFormat.hyperlinkUrl}
              onChange={(e) => onFormatting('hyperlinkUrl', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid rgba(0, 0, 0, 0.15)',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'flex-end', 
        borderTop: '1px solid rgba(0, 0, 0, 0.1)', 
        paddingTop: '16px', 
        marginTop: '4px' 
      }}>
        <button
          onClick={onCancel}
          style={{
            ...buttonBaseStyle,
            backgroundColor: 'rgba(108, 117, 125, 0.1)',
            color: '#6c757d'
          }}
        >
          Cancel
        </button>
        <button
          onClick={onDone}
          style={{
            ...buttonBaseStyle,
            backgroundColor: designSystem.colors.primary[500] || '#2196F3',
            color: 'white',
            border: `1px solid ${designSystem.colors.primary[500] || '#2196F3'}`
          }}
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  );
};

export default TextFormattingMenu;
