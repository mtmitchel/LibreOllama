/**
 * useCanvasSetup Hook
 * Part of LibreOllama Canvas Refactoring - Phase 4
 * 
 * Handles canvas initialization and setup logic
 */

import { useEffect, useState, useRef } from 'react';
import Konva from 'konva';

interface UseCanvasSetupProps {
  width: number;
  height: number;
  stageRef: React.RefObject<Konva.Stage>;
}

export const useCanvasSetup = ({ width, height, stageRef }: UseCanvasSetupProps) => {
  const [isReady, setIsReady] = useState(false);
  const initializationRef = useRef(false);

  // Viewport state (simplified for now)
  const viewport = {
    width,
    height,
    bounds: {
      left: 0,
      top: 0,
      right: width,
      bottom: height
    }
  };

  useEffect(() => {
    if (initializationRef.current) return;
    
    // Perform canvas initialization
    const initializeCanvas = async () => {
      try {
        // Wait for next tick to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Mark as initialized
        initializationRef.current = true;
        setIsReady(true);
      } catch (error) {
        console.error('Canvas initialization failed:', error);
        setIsReady(false);
      }
    };

    initializeCanvas();
  }, []);

  // Update viewport when dimensions change
  useEffect(() => {
    if (isReady && stageRef.current) {
      stageRef.current.size({ width, height });
      stageRef.current.batchDraw();
    }
  }, [width, height, isReady, stageRef]);

  return {
    viewport,
    isReady
  };
};
