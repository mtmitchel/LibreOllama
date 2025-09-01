

import React, { useLayoutEffect, useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import Konva from 'konva';

interface TextEditOverlayProps {
  element: {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fill?: string;
  };
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  stageRef: React.RefObject<Konva.Stage | null>;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export const TextEditOverlay: React.FC<TextEditOverlayProps> = ({
  element,
  viewport,
  stageRef,
  onSave,
  onCancel
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ 
    width: element.width || 200, 
    height: element.height || 40 
  });
  const [text, setText] = useState(element.text || '');

  // Calculate position relative to stage transform
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const stageContainer = stage.container();
    const stageRect = stageContainer.getBoundingClientRect();
    
    // Transform element coordinates to screen coordinates
    const transform = stage.getAbsoluteTransform();
    const screenPos = transform.point({ x: element.x, y: element.y });
    
    // Account for stage position and viewport
    const finalX = stageRect.left + screenPos.x;
    const finalY = stageRect.top + screenPos.y;
    
    setPosition({ x: finalX, y: finalY });
  }, [element.x, element.y, viewport, stageRef]);

  // Auto-focus and select all text
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(text);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onSave(text);
    }
  };

  // Handle blur (save)
  const handleBlur = () => {
    onSave(text);
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get scroll height
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    
    // Set height to content height (minimum 40px)
    const newHeight = Math.max(40, scrollHeight + 4);
    textarea.style.height = `${newHeight}px`;
    
    // Calculate width based on content (with some padding)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
      const textWidth = ctx.measureText(text || 'A').width;
      const newWidth = Math.max(200, textWidth + 40); // Add padding
      
      setDimensions({ 
        width: Math.min(newWidth, 400), // Max width 400px
        height: newHeight 
      });
    }
  }, [text, element.fontSize, element.fontFamily]);

  // Create portal container if it doesn't exist
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.id = `text-edit-overlay-${element.id}`;
    container.style.position = 'fixed';
    container.style.pointerEvents = 'auto';
    container.style.zIndex = '10000';
    document.body.appendChild(container);
    
    setPortalContainer(container);

    return () => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, [element.id]);

  if (!portalContainer) return null;

  return createPortal(
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        fontSize: `${(element.fontSize || 16) * viewport.scale}px`,
        fontFamily: element.fontFamily || 'Arial',
        fontWeight: element.fontWeight || 'normal',
        color: element.fill || '#000000',
        backgroundColor: '#ffffff',
        border: '2px solid #3b82f6',
        borderRadius: '4px',
        padding: '8px',
        resize: 'none',
        outline: 'none',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transform: `scale(${viewport.scale})`,
        transformOrigin: 'top left',
        zIndex: 10000,
        
        // Typography
        lineHeight: '1.4',
        letterSpacing: 'normal',
        
        // Behavior
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        
        // Animation
        transition: 'all 0.1s ease-out'
      }}
      placeholder="Enter text..."
      autoFocus
    />,
    portalContainer
  );
};

/**
 * Hook for managing text editing state with the new overlay system
 */
export const useTextEditOverlay = () => {
  const [editingElement, setEditingElement] = useState<{
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fill?: string;
  } | null>(null);

  const startTextEdit = (element: Parameters<typeof setEditingElement>[0]) => {
    setEditingElement(element);
  };

  const stopTextEdit = () => {
    setEditingElement(null);
  };

  const isEditing = editingElement !== null;

  return {
    editingElement,
    isEditing,
    startTextEdit,
    stopTextEdit
  };
};
// Archived (2025-09-01): Legacy react-konva text overlay.
