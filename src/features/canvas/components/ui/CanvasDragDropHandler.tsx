/**
 * CanvasDragDropHandler - Handles drag-and-drop and paste functionality for images
 * Allows users to drop image files or paste images directly onto the canvas
 */

import React, { useEffect, useRef } from 'react';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../stores/unifiedCanvasStore';
import { ImageElement } from '../../types/enhanced.types';
import { nanoid } from 'nanoid';

interface CanvasDragDropHandlerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  children?: React.ReactNode;
}

export const CanvasDragDropHandler: React.FC<CanvasDragDropHandlerProps> = ({ stageRef, children }) => {
  // Use refs to avoid dependency issues with store functions
  const storeRef = useRef(useUnifiedCanvasStore.getState());
  
  // Update store ref when needed (but don't trigger re-renders)
  useEffect(() => {
    storeRef.current = useUnifiedCanvasStore.getState();
  });

  // Stable image creation function that doesn't change
  const createImageFromFile = useRef((file: File, x: number, y: number) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio
        const maxWidth = 300;
        const maxHeight = 300;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
          } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          }
        }

        // Create image element
        const imageElement: ImageElement = {
          id: nanoid() as any,
          type: 'image',
          x: x - width / 2,
          y: y - height / 2,
          width,
          height,
          imageUrl: event.target?.result as string,
          opacity: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false
        };
        
        const store = storeRef.current;
        store.addElement(imageElement);
        
        // Check for sticky note container
        const stickyNoteId = store.findStickyNoteAtPoint({ x, y });
        if (stickyNoteId) {
          console.log('🖼️ [CanvasDragDrop] Adding image to sticky note container:', stickyNoteId);
          store.addElementToStickyNote(imageElement.id, stickyNoteId);
        }
        
        // Switch to select tool and select the new image
        store.setSelectedTool('select');
        setTimeout(() => {
          store.selectElement(imageElement.id, false);
        }, 10);
        
        console.log('🖼️ [CanvasDragDrop] Image added and selected:', imageElement.id);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }).current;

  // Handle drag and drop - stable handlers
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const canvasContainer = stage.container().closest('.canvas-container') as HTMLElement;
    if (!canvasContainer) {
      return;
    }

    // Stable event handlers - kept for environments where drag works
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      canvasContainer.style.border = '2px dashed #3B82F6';
      canvasContainer.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      canvasContainer.style.border = '2px dashed #3B82F6';
      canvasContainer.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
    };

    const handleDragLeave = (e: DragEvent) => {
      if (!canvasContainer.contains(e.relatedTarget as Node)) {
        canvasContainer.style.border = '';
        canvasContainer.style.backgroundColor = '';
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove visual feedback
      canvasContainer.style.border = '';
      canvasContainer.style.backgroundColor = '';
      
      // Get current stage (in case it changed)
      const currentStage = stageRef.current;
      if (!currentStage) return;
      
      // Set pointer position for Konva
      currentStage.setPointersPositions(e);
      const dropPosition = currentStage.getPointerPosition();
      
      const files = Array.from(e.dataTransfer?.files || []);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length > 0 && dropPosition) {
        // Convert to canvas coordinates
        const transform = currentStage.getAbsoluteTransform().copy().invert();
        const canvasPos = transform.point(dropPosition);
        
        // Process each image file
        imageFiles.forEach((file, index) => {
          const offsetX = index * 20;
          const offsetY = index * 20;
          createImageFromFile(file, canvasPos.x + offsetX, canvasPos.y + offsetY);
        });
      }
    };

    // Attach canvas container listeners
    canvasContainer.addEventListener('dragenter', handleDragEnter);
    canvasContainer.addEventListener('dragover', handleDragOver);
    canvasContainer.addEventListener('dragleave', handleDragLeave);
    canvasContainer.addEventListener('drop', handleDrop);

    return () => {
      if (canvasContainer) {
        canvasContainer.removeEventListener('dragenter', handleDragEnter);
        canvasContainer.removeEventListener('dragover', handleDragOver);
        canvasContainer.removeEventListener('dragleave', handleDragLeave);
        canvasContainer.removeEventListener('drop', handleDrop);
      }
    };
  }, []); // No dependencies - completely stable

  // Handle paste functionality - also made stable
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeElement = document.activeElement;
      const isCanvasFocused = !activeElement || 
        activeElement === document.body || 
        activeElement.closest('.canvas-container') !== null;
      
      if (!isCanvasFocused || !e.clipboardData) return;
      
      const stage = stageRef.current;
      if (!stage) return;
      
      // Get position for paste
      const pointer = stage.getPointerPosition();
      let pos;
      
      if (pointer) {
        const rect = stage.container().getBoundingClientRect();
        const fakeEvent = {
          clientX: pointer.x + rect.left,
          clientY: pointer.y + rect.top,
          preventDefault: () => {},
          stopPropagation: () => {}
        } as any;
        
        stage.setPointersPositions(fakeEvent);
        const stagePos = stage.getPointerPosition();
        
        if (stagePos) {
          const transform = stage.getAbsoluteTransform().copy().invert();
          pos = transform.point(stagePos);
          
          console.log('🖼️ [DragDrop] Position calculation (paste):', {
            client: { x: fakeEvent.clientX, y: fakeEvent.clientY },
            stage: stagePos,
            canvas: pos
          });
        }
      }
      
      if (!pos) {
        // Fallback to canvas center
        const viewport = { x: stage.x(), y: stage.y(), scale: stage.scaleX() };
        pos = {
          x: (-viewport.x + stage.width() / 2) / viewport.scale,
          y: (-viewport.y + stage.height() / 2) / viewport.scale
        };
      }
      
      // Check for image in clipboard
      const items = Array.from(e.clipboardData.items);
      let hasImage = false;
      
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            createImageFromFile(file, pos.x, pos.y);
            hasImage = true;
            break;
          }
        }
      }
      
      if (hasImage) {
        e.preventDefault();
        console.log('🖼️ [CanvasDragDrop] Image pasted from clipboard');
      }
    };

    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []); // No dependencies - completely stable

  return <>{children}</>;
}; 