// src/components/canvas/FloatingTextToolbar.tsx
import React, { useEffect, useRef, useState, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../styles/designSystem';
import {
  ToolbarButton,
  ToolbarSeparator,
  ToolbarColorPicker,
  FontSizeDropdown,
  TextAlignmentDropdown,
} from './ToolbarComponents';
import type { StandardTextFormat } from '../../types/richText';

// Define and export the props for FloatingTextToolbar
export interface FloatingTextToolbarProps {
  targetRef: RefObject<HTMLElement | null>; // Ref to the element the toolbar is anchored to (e.g., textarea)
  onCommand: (command: string, value?: any) => void; // Callback for when a toolbar button is clicked
  currentFormat: Partial<StandardTextFormat>; // The current formatting state from the editor
  style?: React.CSSProperties; // Optional style for positioning
}

const FloatingTextToolbar: React.FC<FloatingTextToolbarProps> = ({
  targetRef,
  onCommand,
  currentFormat,
  style, // Accept style prop for positioning by parent
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
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutsideDropdown);
      return () => document.removeEventListener('mousedown', handleClickOutsideDropdown);
    }
  }, [openDropdown]);
  
  // Handler for commands, directly calls onCommand from props
  const handleCommand = (command: string, value?: any) => {
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
      data-floating-toolbar="true" // For click-outside detection in parent
      style={{
        position: 'absolute', // Will be positioned by parent via `style` prop
        display: 'flex',
        alignItems: 'center',
        padding: designSystem.spacing.sm,
        backgroundColor: '#FFFFFF', // Pure white background for maximum visibility
        border: `2px solid ${designSystem.colors.primary[500]}`, // Stronger blue border
        borderRadius: designSystem.borderRadius.md,
        boxShadow: designSystem.shadows.xl, // Much stronger shadow
        zIndex: 9999, // Very high z-index to ensure it's on top of everything
        gap: designSystem.spacing.xs,
        minHeight: '40px', // Ensure minimum height for visibility
        ...style, // Apply positioning styles from props
      }}
      onClick={(e) => e.stopPropagation()} // Prevent clicks inside toolbar from propagating
      onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown from blurring textarea
    >
      {/* Bold Button */}
      <ToolbarButton
        title="Bold (Ctrl+B)"
        active={!!currentFormat.bold}
        onClick={() => handleCommand('bold')}
      >
        B {/* Simple text icon */}
      </ToolbarButton>
      {/* Italic Button */}
      <ToolbarButton
        title="Italic (Ctrl+I)"
        active={!!currentFormat.italic}
        onClick={() => handleCommand('italic')}
      >
        I {/* Simple text icon */}
      </ToolbarButton>
      {/* Underline Button */}
      <ToolbarButton
        title="Underline (Ctrl+U)"
        active={!!currentFormat.underline}
        onClick={() => handleCommand('underline')}
      >
        U {/* Simple text icon */}
      </ToolbarButton>
      {/* Strikethrough Button */}
      <ToolbarButton
        title="Strikethrough (Ctrl+Shift+S)"
        active={!!currentFormat.strikethrough}
        onClick={() => handleCommand('strikethrough')}
      >
        S {/* Simple text icon, consider a better icon */}
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Font Size Dropdown */}
      <FontSizeDropdown
        value={currentFormat.fontSize || 14}
        onChange={(size: number) => handleCommand('fontSize', size)} // Explicitly type size
        isOpen={openDropdown === 'fontSize'}
        onToggle={() => setOpenDropdown(openDropdown === 'fontSize' ? null : 'fontSize')}
      />
      
      <ToolbarSeparator />

      {/* Text Color Picker */}
      <ToolbarColorPicker
        title="Text Color"
        value={currentFormat.textColor || '#000000'} // ToolbarColorPicker expects `value` for color
        onChange={(color: string) => handleCommand('textColor', color)} // Explicitly type color
        // Assuming ToolbarColorPicker handles its own open/close state or doesn't need it from here
      />
      
      <ToolbarSeparator />

      {/* Text Alignment Dropdown */}
      <TextAlignmentDropdown
        value={currentFormat.textAlign || 'left'} 
        onChange={(align: string) => handleCommand('textAlign', align as 'left' | 'center' | 'right')} // Cast align to specific type
        isOpen={openDropdown === 'textAlign'}
        onToggle={() => setOpenDropdown(openDropdown === 'textAlign' ? null : 'textAlign')}
      />

    </div>,
    document.body // Portal to body to ensure it's on top
  );
};

export default FloatingTextToolbar;