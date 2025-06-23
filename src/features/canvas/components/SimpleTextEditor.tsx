// src/features/canvas/components/SimpleTextEditor.tsx
// Force module refresh - Portal-based text editing overlay
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Konva from 'konva';
import { useCanvasStore } from '../stores/canvasStore.enhanced';
import { ElementId, isTextElement, isRichTextElement } from '../types/enhanced.types';

interface SimpleTextEditorProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

/**
 * SimpleTextEditor - Portal-based text editing overlay with real-time positioning
 * Renders outside Konva tree to avoid React-Konva conflicts
 * Uses real-time position tracking for perfect alignment during canvas transformations
 */
const SimpleTextEditor: React.FC<SimpleTextEditorProps> = ({ stageRef }) => {
  // Use individual primitive selectors to prevent infinite render loops
  const editingTextId = useCanvasStore(state => state.editingTextId);
  const elements = useCanvasStore(state => state.elements);
  const updateElement = useCanvasStore(state => state.updateElement);
  const setEditingTextId = useCanvasStore(state => state.setEditingTextId);
  const [text, setText] = useState('');
  const [editorPosition, setEditorPosition] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editingElement = editingTextId ? elements.get(editingTextId) : null;

  // Only proceed if we have a text element
  if (!editingElement || (!isTextElement(editingElement) && !isRichTextElement(editingElement))) {
    return null;
  }

  // Real-time position tracking effect
  useEffect(() => {
    if (!editingElement || !stageRef?.current) {
      setEditorPosition(null);
      return;
    }

    setText(editingElement.text || '');

    const updatePosition = () => {
      // Clear any pending updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Schedule update for next frame
      updateTimeoutRef.current = setTimeout(() => {
        const stage = stageRef.current;
        if (!stage) return;

        // Get the text element by ID to get its absolute position
        const textNode = stage.findOne(`#${editingElement.id}`);
        if (!textNode) return;

        const textPos = textNode.getAbsolutePosition();
        const stageContainer = stage.container();
        if (!stageContainer) return;

        const containerRect = stageContainer.getBoundingClientRect();
        const transform = stage.getAbsoluteTransform();
        
        // Get stage scale
        const scale = stage.scaleX(); // Assuming uniform scaling
        
        // Calculate screen coordinates using the transform matrix
        const point = transform.point({
          x: textPos.x,
          y: textPos.y
        });
        
        const screenX = containerRect.left + point.x;
        const screenY = containerRect.top + point.y;
        const screenWidth = Math.max((editingElement.width || 200) * scale, 150);
        const screenHeight = Math.max(60 * scale, 40); // Minimum height for text editor

        setEditorPosition({
          left: Math.round(screenX),
          top: Math.round(screenY),
          width: Math.round(screenWidth),
          height: Math.round(screenHeight),
        });
      }, 0);
    };

    // Initial position calculation
    updatePosition();

    // Listen for canvas transformations
    const stage = stageRef.current;
    const handleTransform = () => updatePosition();
    
    // Add event listeners for all transform events
    stage.on('transform', handleTransform);
    stage.on('dragmove', handleTransform);
    stage.on('wheel', handleTransform);
    stage.on('scalechange', handleTransform);
    stage.on('dragend', handleTransform);
    stage.on('transformend', handleTransform);
    
    // Listen for layer transformations as well
    const layer = stage.getLayers()[0];
    if (layer) {
      layer.on('transform', handleTransform);
      layer.on('dragmove', handleTransform);
      layer.on('dragend', handleTransform);
    }
    
    // Also listen for window resize/scroll
    const handleWindowChange = () => updatePosition();
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange);

    // Focus and select text after position is set
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    });

    // Cleanup function
    return () => {
      // Clear any pending timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      stage.off('transform', handleTransform);
      stage.off('dragmove', handleTransform);
      stage.off('wheel', handleTransform);
      stage.off('scalechange', handleTransform);
      stage.off('dragend', handleTransform);
      stage.off('transformend', handleTransform);
      
      // Clean up layer listeners
      const layer = stage.getLayers()[0];
      if (layer) {
        layer.off('transform', handleTransform);
        layer.off('dragmove', handleTransform);
        layer.off('dragend', handleTransform);
      }
      
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange);
    };
  }, [editingElement, stageRef]);
  const handleComplete = () => {
    if (editingTextId && editingElement) {
      updateElement(ElementId(editingTextId), { text });
    }
    setEditingTextId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      // Ctrl+Enter to finish editing
      handleComplete();
    } else if (e.key === 'Escape') {
      // Escape to cancel
      setEditingTextId(null);
    }
  };

  if (!editingElement || !editorPosition) {
    return null;
  }

  const overlay = (
    <div
      style={{
        position: 'fixed',
        left: editorPosition.left,
        top: editorPosition.top,
        zIndex: 10000,
        backgroundColor: 'white',
        border: '2px solid #3B82F6',
        borderRadius: '4px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '4px'
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleComplete}
        onKeyDown={handleKeyDown}
        style={{
          width: editorPosition.width,
          height: editorPosition.height,
          border: 'none',
          outline: 'none',
          resize: 'both',
          fontFamily: editingElement.fontFamily || 'Inter, sans-serif',
          fontSize: editingElement.fontSize || 18,
          backgroundColor: 'transparent'
        }}
        placeholder="Enter text..."
      />
      <div style={{
        fontSize: '12px',
        color: '#666',
        marginTop: '4px',
        padding: '2px 4px'
      }}>
        Ctrl+Enter to save, Esc to cancel
      </div>
    </div>
  );
  // Render to document.body to avoid Konva conflicts
  return ReactDOM.createPortal(overlay, document.body);
};

export { SimpleTextEditor };
export default SimpleTextEditor;
