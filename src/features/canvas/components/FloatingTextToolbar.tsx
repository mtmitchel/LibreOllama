// Canvas Floating Text Toolbar Component
// Migrated from src/components/canvas/FloatingTextToolbar.tsx to feature-based structure
import React, { useEffect, useState, useRef, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../../design-system';
import { debug } from '../utils/debug';

// Basic toolbar button component
const ToolbarButton: React.FC<{
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ title, active, onClick, children }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      padding: '4px 8px',
      border: 'none',
      borderRadius: '4px',
      background: active ? designSystem.colors.primary[100] : 'transparent',
      color: active ? designSystem.colors.primary[700] : designSystem.colors.secondary[600],
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: active ? 'bold' : 'normal',
      transition: 'all 0.2s'
    }}
  >
    {children}
  </button>
);

// Toolbar separator
const ToolbarSeparator: React.FC = () => (
  <div 
    style={{
      width: '1px',
      height: '20px',
      background: designSystem.colors.secondary[300],
      margin: '0 4px'
    }} 
  />
);

// Simple dropdown for font sizes
const FontSizeDropdown: React.FC<{
  value: number;
  onChange: (size: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ value, onChange, isOpen, onToggle }) => {
  const sizes = [10, 12, 14, 16, 18, 20, 24, 28, 32];
  
  return (
    <div style={{ position: 'relative' }}>
      <button
        data-dropdown-button="true"
        onClick={onToggle}
        style={{
          padding: '4px 8px',
          border: `1px solid ${designSystem.colors.secondary[300]}`,
          borderRadius: '4px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        {value}px ▼
      </button>
      
      {isOpen && (
        <div
          data-dropdown-content="true"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'white',
            border: `1px solid ${designSystem.colors.secondary[300]}`,
            borderRadius: '4px',
            boxShadow: designSystem.shadows.md,
            zIndex: 10000,
            minWidth: '60px'
          }}
        >
          {sizes.map(size => (
            <button
              key={size}
              onClick={() => onChange(size)}
              style={{
                display: 'block',
                width: '100%',
                padding: '4px 8px',
                border: 'none',
                background: size === value ? designSystem.colors.primary[100] : 'transparent',
                cursor: 'pointer',
                fontSize: '12px',
                textAlign: 'left'
              }}
            >
              {size}px
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple color picker
const ColorPicker: React.FC<{
  title: string;
  value: string;
  onChange: (color: string) => void;
}> = ({ title, value, onChange: _onChange }) => {
  // const _colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
  
  return (
    <div style={{ position: 'relative' }}>
      <button
        title={title}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          border: `1px solid ${designSystem.colors.secondary[300]}`,
          background: value,
          cursor: 'pointer'
        }}
      />
      {/* Simple color picker - can be enhanced */}
    </div>
  );
};

// Text alignment dropdown
const TextAlignmentDropdown: React.FC<{
  value: string;
  onChange: (align: 'left' | 'center' | 'right') => void;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ value, onChange, isOpen, onToggle }) => {
  const alignments = [
    { value: 'left', label: '⬅' },
    { value: 'center', label: '↔' },
    { value: 'right', label: '➡' }
  ];
  
  return (
    <div style={{ position: 'relative' }}>
      <button
        data-dropdown-button="true"
        onClick={onToggle}
        style={{
          padding: '4px 8px',
          border: `1px solid ${designSystem.colors.secondary[300]}`,
          borderRadius: '4px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        {alignments.find(a => a.value === value)?.label || '⬅'} ▼
      </button>
      
      {isOpen && (
        <div
          data-dropdown-content="true"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'white',
            border: `1px solid ${designSystem.colors.secondary[300]}`,
            borderRadius: '4px',
            boxShadow: designSystem.shadows.md,
            zIndex: 10000,
            minWidth: '80px'
          }}
        >
          {alignments.map(alignment => (
            <button
              key={alignment.value}
              onClick={() => onChange(alignment.value as 'left' | 'center' | 'right')}
              style={{
                display: 'block',
                width: '100%',
                padding: '4px 8px',
                border: 'none',
                background: alignment.value === value ? designSystem.colors.primary[100] : 'transparent',
                cursor: 'pointer',
                fontSize: '12px',
                textAlign: 'left'
              }}
            >
              {alignment.label} {alignment.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Basic format interface (simplified for migration)
interface TextFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  textStyle?: 'default' | 'heading' | 'subheading';
  listType?: 'none' | 'bullet' | 'numbered';
}

export interface FloatingTextToolbarProps {
  targetRef: RefObject<HTMLElement | null>;
  onCommand: (command: string, value?: any) => void;
  currentFormat: Partial<TextFormat>;
  style?: React.CSSProperties;
}

/**
 * FloatingTextToolbar - Rich text formatting toolbar
 * 
 * Features:
 * - Floating positioning relative to target element
 * - Complete text formatting controls
 * - Dropdown-based style selections
 * - Portal rendering for z-index control
 * - Click-outside detection for dropdowns
 */
export const FloatingTextToolbar: React.FC<FloatingTextToolbarProps> = ({
  targetRef,
  onCommand,
  currentFormat,
  style,
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Click-outside detection for dropdowns only
  useEffect(() => {
    const handleClickOutsideDropdown = (event: MouseEvent) => {
      const target = event.target as Element;
      const isClickInDropdownContent = target.closest('[data-dropdown-content]') !== null;
      const isDropdownButton = target.closest('[data-dropdown-button]') !== null;

      if (openDropdown && !isClickInDropdownContent && !isDropdownButton) {
        setOpenDropdown(null);
        debug.canvas.konvaEvent('floating-toolbar-dropdown-close', openDropdown);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutsideDropdown);
      return () => document.removeEventListener('mousedown', handleClickOutsideDropdown);
    }
    
    return undefined;
  }, [openDropdown]);
  
  // Handler for commands, directly calls onCommand from props
  const handleCommand = (command: string, value?: any) => {
    debug.canvas.elementOperation('text-format', command, value);
    onCommand(command, value);
    setOpenDropdown(null); // Close any open dropdown after a command
  };

  // If no target to anchor to, don't render
  if (!targetRef.current) {
    return null;
  }

  return createPortal(
    <div
      ref={toolbarRef}
      data-floating-toolbar="true"
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        padding: designSystem.spacing.sm,
        backgroundColor: '#FFFFFF',
        border: `2px solid ${designSystem.colors.primary[500]}`,
        borderRadius: designSystem.borderRadius.md,
        boxShadow: designSystem.shadows.xl,
        zIndex: 9999,
        gap: designSystem.spacing.xs,
        minHeight: '40px',
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Bold Button */}
      <ToolbarButton
        title="Bold (Ctrl+B)"
        active={!!currentFormat.bold}
        onClick={() => handleCommand('bold')}
      >
        <strong>B</strong>
      </ToolbarButton>

      {/* Italic Button */}
      <ToolbarButton
        title="Italic (Ctrl+I)"
        active={!!currentFormat.italic}
        onClick={() => handleCommand('italic')}
      >
        <em>I</em>
      </ToolbarButton>

      {/* Underline Button */}
      <ToolbarButton
        title="Underline (Ctrl+U)"
        active={!!currentFormat.underline}
        onClick={() => handleCommand('underline')}
      >
        <u>U</u>
      </ToolbarButton>

      {/* Strikethrough Button */}
      <ToolbarButton
        title="Strikethrough (Ctrl+Shift+S)"
        active={!!currentFormat.strikethrough}
        onClick={() => handleCommand('strikethrough')}
      >
        <s>S</s>
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Font Size Dropdown */}
      <FontSizeDropdown
        value={currentFormat.fontSize || 14}
        onChange={(size: number) => handleCommand('fontSize', size)}
        isOpen={openDropdown === 'fontSize'}
        onToggle={() => setOpenDropdown(openDropdown === 'fontSize' ? null : 'fontSize')}
      />
      
      <ToolbarSeparator />

      {/* Text Color Picker */}
      <ColorPicker
        title="Text Color"
        value={currentFormat.textColor || '#000000'}
        onChange={(color: string) => handleCommand('textColor', color)}
      />
      
      <ToolbarSeparator />

      {/* Text Alignment Dropdown */}
      <TextAlignmentDropdown
        value={currentFormat.textAlign || 'left'} 
        onChange={(align: 'left' | 'center' | 'right') => handleCommand('textAlign', align)}
        isOpen={openDropdown === 'textAlign'}
        onToggle={() => setOpenDropdown(openDropdown === 'textAlign' ? null : 'textAlign')}
      />

    </div>,
    document.body
  );
};

export default FloatingTextToolbar;

