// src/components/canvas/FloatingTextToolbar.tsx
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../styles/designSystem';
import {
  ToolbarButton,
  ToolbarSeparator,
  ToolbarNumberInput,
  ToolbarColorPicker,
  ToolbarSpacer,
  FontSizeDropdown,
  StylePresetDropdown,
  TextAlignmentDropdown,
  STYLE_PRESETS,
  FONT_SIZE_OPTIONS,
  ALIGNMENT_OPTIONS
} from './ToolbarComponents';
import { richTextManager } from './RichTextSystem';
import type { StandardTextFormat } from '../../types/richText';

// Legacy interface for backward compatibility - maps to StandardTextFormat
interface TextFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  fontSize: number;
  color: string; // Maps to textColor in StandardTextFormat
  fontFamily: string;
  listType: 'none' | 'bullet' | 'numbered';
  isHyperlink: boolean;
  hyperlinkUrl: string;
}

interface FloatingTextToolbarProps {
  element: {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  isVisible: boolean;
  format: TextFormat;
  onFormatChange: (formatType: string, value?: any) => void;
  onDone: () => void;
  onCancel: () => void;
  stageRef: React.RefObject<any>;
}

const FloatingTextToolbar: React.FC<FloatingTextToolbarProps> = ({
  element,
  isVisible,
  format,
  onFormatChange,
  onDone,
  onCancel,
  stageRef
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Enhanced format change handler with command translation
  const handleFormatChange = (command: string, value?: any) => {
    // Translate legacy commands to standardized commands
    const translatedCommand = richTextManager.translateCommand(command);
    if (translatedCommand) {
      onFormatChange(translatedCommand, value);
    } else {
      onFormatChange(command, value);
    }
  };

  // Click-outside detection to auto-save and close toolbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is inside any dropdown (including content and buttons)
      const isClickInDropdown = target.closest('[data-dropdown-container]') !== null;
      const dropdownButton = target.closest('[data-dropdown-button]');
      
      // Check if click is inside toolbar (including by our data attributes)
      const isClickInToolbar = toolbarRef.current?.contains(target) ||
                              target.closest('[data-floating-toolbar="true"]') !== null ||
                              target.closest('[data-text-toolbar="floating"]') !== null;
      
      // Check if click is on the text element being edited
      const isClickOnTextElement = target.closest(`[id="${element.id}"]`) !== null;
      
      // Check if click is on table cell editing area
      const isClickOnTableEditor = target.closest('[data-testid="rich-text-cell-editor"]') !== null ||
                                   target.closest('[data-table-cell-editor="true"]') !== null;
      
      // Check if click is on the stage/canvas
      const isClickOnStage = target.closest('.konva-canvas-container') !== null;
      
      // If clicking on a dropdown button, don't close anything - let the button handle it
      if (dropdownButton) {
        return;
      }
      
      // Add small delay to allow dropdown content to render before checking if we should close
      setTimeout(() => {
        // Re-check dropdown container after delay (dropdown content may have rendered)
        const updatedIsClickInDropdown = target.closest('[data-dropdown-container]') !== null;
        
        // Close any open dropdowns if clicking outside them (but not on dropdown buttons)
        if (!updatedIsClickInDropdown && !dropdownButton && openDropdown) {
          setOpenDropdown(null);
        }
        
        // Only close toolbar if clicking completely outside toolbar, dropdowns, text element, and table editor
        if (!isClickInToolbar && !updatedIsClickInDropdown && !isClickOnTextElement && !isClickOnTableEditor &&
            (isClickOnStage || !target.closest('.konva-canvas-container'))) {
          onDone(); // Auto-save instead of cancel
        }
      }, 50); // Small delay to allow React state updates and DOM changes
    };

    if (isVisible) {
      // Use click events instead of mousedown to allow dropdown content to render first
      // Add delay to prevent immediate closing when toolbar appears
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true); // Use capture phase
      }, 150); // Increased delay to ensure dropdown content renders
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside, true);
      };
    }
  }, [isVisible, onDone, element.id, openDropdown]);
  // Calculate toolbar position directly above text element
  const toolbarPosition = useMemo(() => {
    if (!isVisible) return { x: 0, y: 0 };
    
    // More reliable stage detection - prioritize stageRef
    let stage = null;
    if (stageRef?.current) {
      stage = stageRef.current;
    } else {
      // Improved fallback: search for stage through Konva's API
      const canvasContainer = document.querySelector('.konva-canvas-container canvas');
      if (canvasContainer) {
        // Try multiple methods to get the stage
        const konvaStage = (canvasContainer as any).stage ||
                          (canvasContainer as any).__konvaStage ||
                          (canvasContainer as any)._konvaStage;
        if (konvaStage) stage = konvaStage;
      }
    }
    
    if (!stage) {
      // Enhanced fallback positioning with viewport awareness
      console.warn('[FloatingTextToolbar] Stage not found, using fallback positioning');
      return {
        x: Math.max(20, Math.min(element.x, window.innerWidth - 570)),
        y: Math.max(60, element.y - 60),
        width: 550,
        height: 48
      };
    }
    
    const stageContainer = stage.container();
    if (!stageContainer) {
      console.warn('[FloatingTextToolbar] Stage container not found');
      return { x: 20, y: 60, width: 550, height: 48 };
    }
    
    const stageBox = stageContainer.getBoundingClientRect();
    const stageTransform = stage.getAbsoluteTransform();
    
    // Account for page scroll offset
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // Convert element position to screen coordinates
    const elementScreenPos = stageTransform.point({
      x: element.x,
      y: element.y
    });
    
    // Calculate toolbar dimensions
    const toolbarWidth = Math.min(650, Math.max(550, (element.width || 200) * 2));
    const toolbarHeight = 48;
    
    // Unified positioning logic for all element types
    const gap = element.id === 'table-cell' ? 8 : 20;
    
    // Calculate base position
    const baseX = stageBox.left + elementScreenPos.x + ((element.width || 200) / 2) - (toolbarWidth / 2);
    const baseY = stageBox.top + elementScreenPos.y - toolbarHeight - gap;
    
    // Apply scroll compensation for fixed positioning
    const toolbarX = baseX + scrollX;
    const toolbarY = baseY + scrollY;
    
    // Enhanced viewport clamping with margin for safety
    const margin = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const clampedX = Math.max(margin, Math.min(toolbarX, viewportWidth - toolbarWidth - margin));
    const clampedY = Math.max(margin, Math.min(toolbarY, viewportHeight - toolbarHeight - margin));
    
    console.debug('[FloatingTextToolbar] Position calculated:', {
      element: { x: element.x, y: element.y, width: element.width, height: element.height },
      elementScreenPos,
      stageBox: { left: stageBox.left, top: stageBox.top },
      scroll: { x: scrollX, y: scrollY },
      base: { x: baseX, y: baseY },
      final: { x: clampedX, y: clampedY }
    });
    
    return {
      x: clampedX,
      y: clampedY,
      width: toolbarWidth,
      height: toolbarHeight
    };
  }, [element, isVisible, stageRef]);

  if (!isVisible) return null;

  const pillStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${toolbarPosition.x}px`,
    top: `${toolbarPosition.y}px`,
    width: `${toolbarPosition.width}px`,
    height: `${toolbarPosition.height}px`,
    borderRadius: '24px', // Pill shape
    backgroundColor: element.id === 'table-cell' ? '#1a1a1a' : '#1a1a1a', // Slightly different bg for table cells
    border: element.id === 'table-cell' ? '1px solid #444' : '1px solid #333', // Slightly more prominent border for table cells
    boxShadow: element.id === 'table-cell' 
      ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3)' // Enhanced shadow for table cells
      : '0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '8px 20px', // Increased padding to ensure buttons don't hit edges
    gap: '6px', // Reduced gap for tighter, more consistent spacing
    zIndex: 10000,
    backdropFilter: 'blur(12px)',
    fontFamily: designSystem.typography.fontFamily.sans,
    // Allow dropdown content to overflow the toolbar container
    overflow: 'visible',
    whiteSpace: 'nowrap',
    flexWrap: 'nowrap'
  };

  return createPortal(
    <div
      ref={toolbarRef}
      style={pillStyle}
      data-floating-toolbar="true"
      data-text-toolbar="floating"
      data-toolbar-type="text-formatting"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const isDropdownButton = target.closest('[data-dropdown-button]');
        const isInteractiveElement = target.closest('button, input, select');
        
        // Only stop propagation for non-interactive elements
        if (!isDropdownButton && !isInteractiveElement) {
          e.stopPropagation();
        }
      }}
    >
      {/* Style Preset Dropdown */}
      <StylePresetDropdown
        value="default"
        onChange={(preset) => {
          if (preset === 'heading') {
            handleFormatChange('fontSize', 24);
            handleFormatChange('bold', true);
          } else if (preset === 'subheading') {
            handleFormatChange('fontSize', 18);
            handleFormatChange('bold', true);
          }
        }}
        isOpen={openDropdown === 'style'}
        onToggle={() => {
          setOpenDropdown(openDropdown === 'style' ? null : 'style');
        }}
      />

      <ToolbarSeparator />

      {/* Font Size Dropdown */}
      <FontSizeDropdown
        value={format.fontSize}
        onChange={(size) => handleFormatChange('fontSize', size)}
        isOpen={openDropdown === 'fontSize'}
        onToggle={() => {
          setOpenDropdown(openDropdown === 'fontSize' ? null : 'fontSize');
        }}
      />

      <ToolbarSeparator />

      {/* Text Formatting */}
      <ToolbarButton
        active={format.bold}
        onClick={() => handleFormatChange('bold')}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        active={format.italic}
        onClick={() => handleFormatChange('italic')}
        title="Italic"
        style={{ fontStyle: 'italic' }}
      >
        I
      </ToolbarButton>
      <ToolbarButton
        active={format.underline}
        onClick={() => handleFormatChange('underline')}
        title="Underline"
        style={{ textDecoration: 'underline' }}
      >
        U
      </ToolbarButton>
      <ToolbarButton
        active={format.strikethrough}
        onClick={() => handleFormatChange('strikethrough')}
        title="Strikethrough"
        style={{ textDecoration: 'line-through' }}
      >
        S
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Link Button */}
      <ToolbarButton
        active={format.isHyperlink}
        onClick={() => {
          if (format.isHyperlink) {
            // Remove hyperlink
            handleFormatChange('isHyperlink', false);
            handleFormatChange('hyperlinkUrl', '');
          } else {
            // Add hyperlink - prompt for URL
            const url = prompt('Enter URL:');
            if (url !== null) { // Allow empty string to clear URL
              handleFormatChange('hyperlinkUrl', url);
              handleFormatChange('isHyperlink', !!url);
            }
          }
        }}
        title="Add/Remove Link"
      >
        🔗
      </ToolbarButton>

      {/* Bullet List Button - using better icon */}
      <ToolbarButton
        active={format.listType === 'bullet'}
        onClick={() => handleFormatChange('listType', format.listType === 'bullet' ? 'none' : 'bullet')}
        title="Bullet List"
      >
        ⦿
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Color Picker with circle icon and dropdown */}
      <ToolbarColorPicker
        value={format.color}
        onChange={(color) => {
          handleFormatChange('textColor', color);
        }}
      />

      <ToolbarSeparator />

      {/* Text Alignment Dropdown */}
      <TextAlignmentDropdown
        value="left"
        onChange={(align: string) => {
          handleFormatChange('textAlign', align);
        }}
        isOpen={openDropdown === 'alignment'}
        onToggle={() => {
          setOpenDropdown(openDropdown === 'alignment' ? null : 'alignment');
        }}
        toolbarRef={toolbarRef}
      />

      {/* Action buttons removed - auto-save on Enter or click outside */}
    </div>,
    document.body
  );
};

export default FloatingTextToolbar;