/**
 * Canvas Export Utilities
 * Provides functionality to export canvas as PDF or JPEG files
 */

import Konva from 'konva';
import { invoke } from '@tauri-apps/api/core';
import { canvasLog } from './canvasLogger';

export interface ExportOptions {
  quality?: number; // 0.0 to 1.0 for JPEG quality
  scale?: number; // Scale factor for export resolution
  padding?: number; // Padding around the content
  backgroundColor?: string; // Background color for exports
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  size?: { width: number; height: number };
}

/**
 * Export canvas as JPEG image
 */
export const exportCanvasAsJPEG = async (
  stage: Konva.Stage,
  filename: string,
  options: ExportOptions = {}
): Promise<ExportResult> => {
  try {
    const {
      quality = 0.9,
      scale = 2, // Higher resolution for better quality
      padding = 20,
      backgroundColor = '#ffffff'
    } = options;

    if (!stage) {
      throw new Error('Stage not available for export');
    }

    // Get the actual content bounds
    const contentBounds = getCanvasContentBounds(stage);
    if (!contentBounds) {
      throw new Error('No content to export');
    }

    // Calculate export dimensions with padding
    const exportWidth = (contentBounds.width + padding * 2) * scale;
    const exportHeight = (contentBounds.height + padding * 2) * scale;

    // Create a temporary stage for export
    const exportStage = stage.clone();
    exportStage.size({ width: exportWidth, height: exportHeight });
    exportStage.scale({ x: scale, y: scale });
    
    // Position content with padding
    exportStage.position({
      x: (padding - contentBounds.x) * scale,
      y: (padding - contentBounds.y) * scale
    });

    // Generate the image data
    const dataURL = exportStage.toDataURL({
      mimeType: 'image/jpeg',
      quality: quality,
      pixelRatio: 1 // We're already scaling manually
    });

    // Clean up temporary stage
    exportStage.destroy();

    // Convert dataURL to blob for saving
    const response = await fetch(dataURL);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Save using Tauri
    const sanitizedFilename = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;
    await invoke('save_canvas_image', { 
      filename: sanitizedFilename, 
      imageData: Array.from(uint8Array),
      mimeType: 'image/jpeg'
    });

    canvasLog.log(`Canvas exported as JPEG: ${sanitizedFilename}`);
    
    return {
      success: true,
      filename: sanitizedFilename,
      size: { width: exportWidth, height: exportHeight }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    canvasLog.error('JPEG export failed:', errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Export canvas as PDF document
 */
export const exportCanvasAsPDF = async (
  stage: Konva.Stage,
  filename: string,
  options: ExportOptions = {}
): Promise<ExportResult> => {
  try {
    const {
      scale = 2,
      padding = 20,
      backgroundColor = '#ffffff'
    } = options;

    if (!stage) {
      throw new Error('Stage not available for export');
    }

    // Get the actual content bounds
    const contentBounds = getCanvasContentBounds(stage);
    if (!contentBounds) {
      throw new Error('No content to export');
    }

    // Calculate dimensions in points (PDF unit)
    const pageWidth = contentBounds.width + padding * 2;
    const pageHeight = contentBounds.height + padding * 2;

    // Create high-resolution image for PDF
    const exportStage = stage.clone();
    const exportScale = scale;
    const exportWidth = pageWidth * exportScale;
    const exportHeight = pageHeight * exportScale;

    exportStage.size({ width: exportWidth, height: exportHeight });
    exportStage.scale({ x: exportScale, y: exportScale });
    exportStage.position({
      x: (padding - contentBounds.x) * exportScale,
      y: (padding - contentBounds.y) * exportScale
    });

    // Generate high-quality PNG for PDF embedding
    const dataURL = exportStage.toDataURL({
      mimeType: 'image/png',
      pixelRatio: 1
    });

    // Clean up temporary stage
    exportStage.destroy();

    // Create PDF using canvas image and invoke Tauri command
    const sanitizedFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    
    // Send the image data and dimensions to Tauri for PDF creation
    await invoke('save_canvas_pdf', {
      filename: sanitizedFilename,
      imageDataUrl: dataURL,
      width: pageWidth,
      height: pageHeight,
      backgroundColor
    });

    canvasLog.log(`Canvas exported as PDF: ${sanitizedFilename}`);
    
    return {
      success: true,
      filename: sanitizedFilename,
      size: { width: pageWidth, height: pageHeight }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    canvasLog.error('PDF export failed:', errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Get the bounding box of all content on the canvas
 */
const getCanvasContentBounds = (stage: Konva.Stage): { x: number; y: number; width: number; height: number } | null => {
  const children = stage.find('*').filter(node => 
    node.visible() && 
    typeof node.getClientRect === 'function' && 
    node !== stage &&
    node.getType() !== 'Layer'
  );

  if (children.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  children.forEach(child => {
    try {
      const rect = child.getClientRect();
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    } catch (error) {
      // Skip nodes that can't provide client rect
    }
  });

  if (minX === Infinity) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * Get suggested filename for export based on canvas name and timestamp
 */
export const getSuggestedFilename = (canvasName: string, extension: 'jpg' | 'pdf'): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '');
  const cleanName = canvasName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  return `${cleanName}_${timestamp}.${extension}`;
};

/**
 * Validate export options
 */
export const validateExportOptions = (options: ExportOptions): ExportOptions => {
  return {
    quality: Math.max(0.1, Math.min(1.0, options.quality || 0.9)),
    scale: Math.max(0.5, Math.min(4.0, options.scale || 2)),
    padding: Math.max(0, Math.min(100, options.padding || 20)),
    backgroundColor: options.backgroundColor || '#ffffff'
  };
}; 