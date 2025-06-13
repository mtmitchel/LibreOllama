// src/components/canvas/FloatingTextToolbar.tsx
import React, { useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../styles/designSystem';
import {
  ToolbarButton,
  ToolbarSeparator,
  ToolbarNumberInput,
  ToolbarSelect,
  ToolbarColorPicker,
  ToolbarSpacer,
  FontSizeDropdown,
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

  // Click-outside detection to auto-save and close toolbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is outside toolbar
      if (!toolbarRef.current?.contains(target)) {
        // Check if click is on the text element being edited
        const isClickOnTextElement = target.closest(`[id="${element.id}"]`) !== null;
        
        // Check if click is on the stage/canvas but not on the text element
        const isClickOnStage = target.closest('.konva-canvas-container') !== null;
        
        // Auto-save and close toolbar if clicking outside toolbar and not on the text element
        if (!isClickOnTextElement && (isClickOnStage || !target.closest('.konva-canvas-container'))) {
          console.log('🔍 [TOOLBAR DEBUG] Click outside detected - auto-saving');
          onDone(); // Auto-save instead of cancel
        }
      }
    };

    if (isVisible) {
      // Add slight delay to prevent immediate closing when toolbar appears
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible, onDone, element.id]);
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
    const toolbarWidth = Math.min(700, Math.max(600, (element.width || 200) * 2.5));
    const toolbarHeight = 48;
    const gap = 12; // 12px buffer above text box as required
    
    // Center toolbar above element
    const toolbarX = stageBox.left + elementScreenPos.x + ((element.width || 200) / 2) - (toolbarWidth / 2);
    // Ensure 12px buffer above text box - increase gap from element
    const toolbarY = stageBox.top + elementScreenPos.y - toolbarHeight - gap;
    
    // Ensure toolbar stays within viewport
    const clampedX = Math.max(20, Math.min(toolbarX, window.innerWidth - toolbarWidth - 20));
    const clampedY = Math.max(20, toolbarY);
    
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
    padding: '8px 16px', // Consistent padding as specified
    gap: '8px', // Consistent gap for better spacing between elements
    zIndex: 10000,
    backdropFilter: 'blur(12px)',
    fontFamily: designSystem.typography.fontFamily.sans,
    // Ensure no overflow issues and prevent wrapping
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    flexWrap: 'nowrap'
  };

  return createPortal(
    <div ref={toolbarRef} style={pillStyle} onClick={(e) => e.stopPropagation()}>
      {/* Style Preset Dropdown */}
      <ToolbarSelect
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
        options={STYLE_PRESETS}
      />

      <ToolbarSeparator />

      {/* Font Size Dropdown */}
      <FontSizeDropdown
        value={format.fontSize}
        onChange={(size) => onFormatChange('fontSize', size)}
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
      <ToolbarSelect
        value="left"
        onChange={(align) => onFormatChange('align', align)}
        options={ALIGNMENT_OPTIONS}
      />

      {/* Action buttons removed - auto-save on Enter or click outside */}
    </div>,
    document.body
  );
};

export default FloatingTextToolbar;