/**
 * ImageUploadInput - HTML file input for ImageTool
 * This component renders outside the Konva canvas to handle file uploads
 */

import React, { useRef, useEffect } from 'react';
import { useUnifiedCanvasStore } from '../../stores/unifiedCanvasStore';

export const ImageUploadInput: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  
  // Handle image tool click events
  useEffect(() => {
    const handleImageToolClick = () => {
      if (selectedTool === 'image' && fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Dispatch file selection event
        window.dispatchEvent(new CustomEvent('canvas-image-file-selected', { 
          detail: { file } 
        }));
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    // Listen for canvas click events
    window.addEventListener('canvas-image-tool-click', handleImageToolClick);
    
    return () => {
      window.removeEventListener('canvas-image-tool-click', handleImageToolClick);
    };
  }, [selectedTool]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dispatch file selection event
      window.dispatchEvent(new CustomEvent('canvas-image-file-selected', { 
        detail: { file } 
      }));
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Only render when image tool is active
  if (selectedTool !== 'image') {
    return null;
  }
  
  return (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={handleFileChange}
    />
  );
}; 