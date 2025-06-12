// src/components/canvas/FormattingMenu.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../styles/designSystem'; // Assuming you want to use design system tokens
import { RichTextSegment } from '../../stores/konvaCanvasStore'; // Import for format type

interface FormattingMenuProps {
  position: { x: number; y: number };
  selectedText: string;
  onFormat: (format: Partial<RichTextSegment>) => void;
  onClose: () => void;
}

export const FormattingMenu: React.FC<FormattingMenuProps> = ({ 
  position,
  selectedText,
  onFormat,
  onClose 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Prevent menu from closing when clicking inside
  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add delay to prevent immediate closure
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleFormatClick = useCallback((format: Partial<RichTextSegment>) => {
    // Apply format without closing menu immediately
    onFormat(format);
    
    // Optional: Close menu after a delay
    setTimeout(() => {
      onClose();
    }, 150);
  }, [onFormat, onClose]);
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    backgroundColor: designSystem.colors.secondary[100], // Use a light gray from secondary palette
    border: `1px solid ${designSystem.colors.secondary[300]}`, // Use a light gray for subtle border
    borderRadius: `${designSystem.borderRadius.md}px`,
    padding: `${designSystem.spacing.sm}px`,
    boxShadow: designSystem.shadows.lg,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: `${designSystem.spacing.xs}px`,
    minWidth: '220px', // Adjusted minWidth
    fontFamily: designSystem.typography.fontFamily.sans,
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: `${designSystem.spacing.xs}px`,
  };

  const buttonStyle: React.CSSProperties = {
    border: `1px solid ${designSystem.colors.secondary[400]}`, // Use a slightly darker gray for default border
    borderRadius: `${designSystem.borderRadius.sm}px`,
    padding: `${designSystem.spacing.xs}px ${designSystem.spacing.sm}px`,
    backgroundColor: designSystem.colors.secondary[200], // Use a slightly darker gray for button background
    color: designSystem.colors.secondary[700], // Standard dark gray text color
    cursor: 'pointer',
    fontSize: designSystem.typography.fontSize.sm,
    minWidth: '32px',
    textAlign: 'center',
    lineHeight: '1.2',
  };

  const selectStyle: React.CSSProperties = {
    border: `1px solid ${designSystem.colors.secondary[400]}`, // Use a slightly darker gray for default border
    borderRadius: `${designSystem.borderRadius.sm}px`,
    padding: `${designSystem.spacing.xs}px`,
    fontSize: designSystem.typography.fontSize.xs,
    backgroundColor: designSystem.colors.secondary[200], // Use a slightly darker gray for button background
    color: designSystem.colors.secondary[700], // Standard dark gray text color
    flexGrow: 1,
  };

  const selectedTextStyle: React.CSSProperties = {
    fontSize: designSystem.typography.fontSize.xs,
    color: designSystem.colors.secondary[500], // Lighter gray for secondary text
    padding: `${designSystem.spacing.xs}px`,
    borderBottom: `1px solid ${designSystem.colors.secondary[300]}`, // Use a light gray for subtle border
    marginBottom: `${designSystem.spacing.xs}px`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const closeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    padding: `0 ${designSystem.spacing.xs}px`,
    minWidth: 'auto',
    lineHeight: '1',
    position: 'absolute',
    top: `${designSystem.spacing.xs}px`,
    right: `${designSystem.spacing.xs}px`,
    background: 'transparent',
    border: 'none',
    fontSize: designSystem.typography.fontSize.base, // Use 'base' for close button icon size
  };

  return createPortal(
    <div 
      ref={menuRef}
      style={menuStyle} 
      onMouseDown={handleMenuClick}
      onClick={handleMenuClick}
    >
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }} 
        style={closeButtonStyle} 
        title="Close Menu"
      >
        ✕
      </button>
      {/* Selected text preview */}
      <div style={selectedTextStyle} title={selectedText}>
        Selected: "{selectedText.length > 25 ? selectedText.substring(0, 25) + '...' : selectedText}"
      </div>
      
      {/* Text formatting buttons */}
      <div style={buttonRowStyle}>
        <button 
          style={buttonStyle} 
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFormatClick({ fontStyle: 'bold' });
          }} 
          title="Bold"
        >
          <b>B</b>
        </button>
        <button 
          style={buttonStyle} 
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFormatClick({ fontStyle: 'italic' });
          }} 
          title="Italic"
        >
          <i>I</i>
        </button>
        <button 
          style={buttonStyle} 
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFormatClick({ textDecoration: 'underline' });
          }} 
          title="Underline"
        >
          <u>U</u>
        </button>
        <button 
          style={buttonStyle} 
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFormatClick({ textDecoration: 'line-through' });
          }} 
          title="Strikethrough"
        >
          <s>S</s>
        </button>
      </div>
      
      {/* Font size and color */}
      <div style={buttonRowStyle}>
        <select 
          style={selectStyle} 
          onChange={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFormatClick({ fontSize: parseInt(e.target.value) });
          }} 
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          defaultValue={16}
          title="Font Size"
        >
          <option value="12">12px</option>
          <option value="14">14px</option>
          <option value="16">16px</option>
          <option value="18">18px</option>
          <option value="24">24px</option>
          <option value="32">32px</option>
        </select>
        <input 
          type="color" 
          onChange={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFormatClick({ fill: e.target.value });
          }} 
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          style={{ ...buttonStyle, width: '40px', height: 'auto', padding: '2px' }} 
          title="Text Color"
          defaultValue={designSystem.colors.secondary[700]} // Default to standard dark gray text color
        />
      </div>
    </div>,
    document.body
  );
};
