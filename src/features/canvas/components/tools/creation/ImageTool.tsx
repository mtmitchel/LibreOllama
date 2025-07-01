/**
 * ImageTool - Image upload and placement tool
 * Provides image upload functionality with drag-and-drop placement
 */

import React, { useRef, useCallback, useState } from 'react';
import { Rect, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { ImageElement } from '../../../types/enhanced.types';
import { nanoid } from 'nanoid';

interface ImageToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const ImageTool: React.FC<ImageToolProps> = ({ stageRef, isActive }) => {
  const [placeholderPosition, setPlaceholderPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  const findStickyNoteAtPoint = useUnifiedCanvasStore(state => state.findStickyNoteAtPoint);
  const addElementToStickyNote = useUnifiedCanvasStore(state => state.addElementToStickyNote);
  
  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file || !placeholderPosition) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create image element
        const imageElement: ImageElement = {
          id: nanoid() as any,
          type: 'image',
          x: placeholderPosition.x - 100, // Center the image
          y: placeholderPosition.y - 75,
          width: 200,
          height: 150,
          imageUrl: event.target?.result as string,
          opacity: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false
        };
        
        addElement(imageElement);
        
        // Check if the image was created within a sticky note container
        const stickyNoteId = findStickyNoteAtPoint(placeholderPosition);
        
        if (stickyNoteId) {
          console.log('🖼️ [ImageTool] Adding image to sticky note container:', stickyNoteId);
          addElementToStickyNote(imageElement.id, stickyNoteId);
        }
        
        setSelectedTool('select');
        setPlaceholderPosition(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [placeholderPosition, addElement, setSelectedTool]);
  
  // Handle click on canvas
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    setPlaceholderPosition({ x: pointer.x, y: pointer.y });
    
    // Trigger file input via custom event
    window.dispatchEvent(new CustomEvent('canvas-image-tool-click', { 
      detail: { position: { x: pointer.x, y: pointer.y } } 
    }));
  }, [isActive, stageRef]);
  
  // Handle pointer move for hover effect
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    setHoverPosition({ x: pointer.x, y: pointer.y });
  }, [isActive, stageRef]);
  
  const handlePointerLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);
  
  // Event listeners
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    
    stage.on('pointerdown', handlePointerDown);
    stage.on('pointermove', handlePointerMove);
    stage.on('pointerleave', handlePointerLeave);
    
    return () => {
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerleave', handlePointerLeave);
    };
  }, [isActive, handlePointerDown, handlePointerMove, handlePointerLeave]);
  
  // Reset when tool becomes inactive
  React.useEffect(() => {
    if (!isActive) {
      setPlaceholderPosition(null);
      setHoverPosition(null);
    }
  }, [isActive]);
  
  // Expose file selection function for external HTML input
  React.useEffect(() => {
    const handleFileSelect = (event: CustomEvent) => {
      const file = event.detail.file;
      if (file) {
        handleFileSelect(file);
      }
    };

    window.addEventListener('canvas-image-file-selected', handleFileSelect as EventListener);
    
    return () => {
      window.removeEventListener('canvas-image-file-selected', handleFileSelect as EventListener);
    };
  }, [handleFileSelect]);
  
  return (
    <>
      {/* Hover indicator - ONLY Konva components here */}
      {isActive && hoverPosition && (
        <Group listening={false}>
          <Rect
            x={hoverPosition.x - 100}
            y={hoverPosition.y - 75}
            width={200}
            height={150}
            fill="#3B82F6"
            fillOpacity={0.1}
            stroke="#3B82F6"
            strokeWidth={2}
            dash={[5, 5]}
            cornerRadius={4}
          />
          <Text
            x={hoverPosition.x - 100}
            y={hoverPosition.y - 20}
            width={200}
            text="Click to upload image"
            fontSize={14}
            fill="#3B82F6"
            align="center"
          />
        </Group>
      )}
    </>
  );
}; 