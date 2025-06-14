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
  

  // Click-outside detection to auto-save and close toolbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log('🔍 [CLICK-OUTSIDE DEBUG] Click detected', {
        target: event.target,
        currentOpenDropdown: openDropdown,
        eventType: event.type,
        timeStamp: event.timeStamp
      });
      
      const target = event.target as Element;
      
      // Check if click is inside any dropdown (including content and buttons)
      const isClickInDropdown = target.closest('[data-dropdown-container]') !== null;
      const dropdownContainer = target.closest('[data-dropdown-container]');
      const dropdownButton = target.closest('[data-dropdown-button]');
      
      // Check if click is inside toolbar
      const isClickInToolbar = toolbarRef.current?.contains(target);
      
      // Check if click is on the text element being edited
      const isClickOnTextElement = target.closest(`[id="${element.id}"]`) !== null;
      
      // Check if click is on the stage/canvas
      const isClickOnStage = target.closest('.konva-canvas-container') !== null;
      
      console.log('🔍 [CLICK-OUTSIDE DEBUG] Click analysis', {
        isClickInDropdown,
        dropdownContainer: !!dropdownContainer,
        dropdownButton: !!dropdownButton,
        isClickInToolbar,
        isClickOnTextElement,
        isClickOnStage,
        targetTagName: target.tagName,
        targetId: target.id,
        targetClasses: target.className
      });
      
      // If clicking on a dropdown button, don't close anything - let the button handle it
      if (dropdownButton) {
        console.log('🔍 [CLICK-OUTSIDE DEBUG] Click on dropdown button - allowing button to handle state');
        return;
      }
      
      // Add small delay to allow dropdown content to render before checking if we should close
      setTimeout(() => {
        // Re-check dropdown container after delay (dropdown content may have rendered)
        const updatedIsClickInDropdown = target.closest('[data-dropdown-container]') !== null;
        
        // Close any open dropdowns if clicking outside them (but not on dropdown buttons)
        if (!updatedIsClickInDropdown && !dropdownButton && openDropdown) {
          console.log('🔍 [CLICK-OUTSIDE DEBUG] Closing dropdown due to outside click (delayed check)', {
            wasOpen: openDropdown,
            reason: 'click outside dropdown after delay'
          });
          setOpenDropdown(null);
        }
        
        // Only close toolbar if clicking completely outside toolbar, dropdowns, and text element
        if (!isClickInToolbar && !updatedIsClickInDropdown && !isClickOnTextElement &&
            (isClickOnStage || !target.closest('.konva-canvas-container'))) {
          console.log('🔍 [TOOLBAR DEBUG] Click outside detected - auto-saving (delayed check)');
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
    if (!stageRef.current || !isVisible) return { x: 0, y: 0 };
    
    const stage = stageRef.current;
    const stageBox = stage.container().getBoundingClientRect();
    const stageTransform = stage.getAbsoluteTransform();
    
    // Convert element position to screen coordinates
    const elementScreenPos = stageTransform.point({
      x: element.x,
      y: element.y
    });
    
    // Calculate toolbar dimensions - ensure adequate space for all elements
    // Make toolbar wider to accommodate all buttons without overflow
    const toolbarWidth = Math.min(800, Math.max(700, (element.width || 200) * 2.5));
    const toolbarHeight = 48;
    const gap = 12; // 12px buffer above text box as required
    
    // Center toolbar above element
    const toolbarX = stageBox.left + elementScreenPos.x + ((element.width || 200) / 2) - (toolbarWidth / 2);
    // Ensure 12px buffer above text box - increase gap from element
    const toolbarY = stageBox.top + elementScreenPos.y - toolbarHeight - gap;
    
    // Ensure toolbar stays within viewport
    const clampedX = Math.max(20, Math.min(toolbarX, window.innerWidth - toolbarWidth - 20));
    const clampedY = Math.max(20, toolbarY);
    
    console.log('🔍 [TOOLBAR DEBUG] Toolbar position calculation:', {
      element: {
        x: element.x,
        y: element.y,
        width: element.width || 200
      },
      calculated: {
        toolbarWidth,
        toolbarHeight,
        toolbarX,
        toolbarY
      },
      clamped: {
        x: clampedX,
        y: clampedY
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
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
    backgroundColor: '#1a1a1a', // Consistent dark background
    border: '1px solid #333',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)',
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
      ref={(el) => {
        if (el && toolbarRef.current !== el) {
          toolbarRef.current = el;
          // Log actual toolbar dimensions after render
          const rect = el.getBoundingClientRect();
          console.log('🔍 [TOOLBAR DEBUG] Actual toolbar dimensions after render:', {
            left: rect.left,
            right: rect.right,
            width: rect.width,
            height: rect.height,
            expectedWidth: toolbarPosition.width,
            widthMatch: toolbarPosition.width ? Math.abs(rect.width - toolbarPosition.width) < 1 : false
          });
        }
      }}
      style={pillStyle}
      onClick={(e) => {
        console.log('🔍 [TOOLBAR DEBUG] Toolbar container clicked', {
          target: e.target,
          currentTarget: e.currentTarget,
          eventPhase: e.eventPhase
        });
        
        const target = e.target as HTMLElement;
        const isDropdownButton = target.closest('[data-dropdown-button]');
        const isInteractiveElement = target.closest('button, input, select');
        
        console.log('🔍 [TOOLBAR DEBUG] Click analysis', {
          isDropdownButton: !!isDropdownButton,
          isInteractiveElement: !!isInteractiveElement,
          targetTagName: target.tagName,
          targetClasses: target.className
        });
        
        // Only stop propagation for non-interactive elements
        if (!isDropdownButton && !isInteractiveElement) {
          console.log('🔍 [TOOLBAR DEBUG] Stopping propagation for non-interactive element');
          e.stopPropagation();
        } else {
          console.log('🔍 [TOOLBAR DEBUG] Allowing event to propagate for interactive element');
        }
      }}
    >
      {/* Style Preset Dropdown */}
      <StylePresetDropdown
        value="default"
        onChange={(preset) => {
          if (preset === 'heading') {
            onFormatChange('fontSize', 24);
            onFormatChange('bold');
          } else if (preset === 'subheading') {
            onFormatChange('fontSize', 18);
            onFormatChange('bold');
          }
        }}
        isOpen={openDropdown === 'style'}
        onToggle={() => {
          console.log('🔍 [DROPDOWN DEBUG] StylePresetDropdown toggle clicked', {
            currentState: openDropdown,
            willBecome: openDropdown === 'style' ? null : 'style'
          });
          setOpenDropdown(openDropdown === 'style' ? null : 'style');
        }}
      />

      <ToolbarSeparator />

      {/* Font Size Dropdown */}
      <FontSizeDropdown
        value={format.fontSize}
        onChange={(size) => onFormatChange('fontSize', size)}
        isOpen={openDropdown === 'fontSize'}
        onToggle={() => {
          console.log('🔍 [DROPDOWN DEBUG] FontSize toggle:', openDropdown === 'fontSize' ? 'closing' : 'opening');
          setOpenDropdown(openDropdown === 'fontSize' ? null : 'fontSize');
        }}
      />

      <ToolbarSeparator />

      {/* Text Formatting */}
      <ToolbarButton
        active={format.bold}
        onClick={() => onFormatChange('bold')}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        active={format.italic}
        onClick={() => onFormatChange('italic')}
        title="Italic"
        style={{ fontStyle: 'italic' }}
      >
        I
      </ToolbarButton>
      <ToolbarButton
        active={format.underline}
        onClick={() => onFormatChange('underline')}
        title="Underline"
        style={{ textDecoration: 'underline' }}
      >
        U
      </ToolbarButton>
      <ToolbarButton
        active={format.strikethrough}
        onClick={() => onFormatChange('strikethrough')}
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
            onFormatChange('isHyperlink');
          } else {
            // Add hyperlink - prompt for URL
            const url = prompt('Enter URL:');
            if (url) {
              onFormatChange('hyperlinkUrl', url);
              onFormatChange('isHyperlink');
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
        onClick={() => onFormatChange('listType', format.listType === 'bullet' ? 'none' : 'bullet')}
        title="Bullet List"
      >
        ⦿
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Color Picker with circle icon and dropdown */}
      <ToolbarColorPicker
        value={format.color}
        onChange={(color) => onFormatChange('color', color)}
      />

      <ToolbarSeparator />

      {/* Text Alignment Dropdown */}
      <TextAlignmentDropdown
        value="left"
        onChange={(align: string) => onFormatChange('align', align)}
        isOpen={openDropdown === 'alignment'}
        onToggle={() => {
          console.log('🔍 [DROPDOWN DEBUG] TextAlignment toggle:', openDropdown === 'alignment' ? 'closing' : 'opening');
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