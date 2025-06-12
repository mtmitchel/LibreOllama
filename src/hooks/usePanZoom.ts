// src/hooks/usePanZoom.ts
import { useCallback, useRef, useState } from 'react';
import Konva from 'konva';

interface PanZoomState {
  scale: number;
  position: { x: number; y: number };
}

export const usePanZoom = (initialScale = 1) => {
  const [panZoomState, setPanZoomState] = useState<PanZoomState>({
    scale: initialScale,
    position: { x: 0, y: 0 }
  });
  
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef(0);
  const dragStopped = useRef(false);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale
    };
    
    // Determine zoom direction and factor
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.1;
    const newScale = direction > 0 ? oldScale * factor : oldScale / factor;
    
    // Clamp scale between 0.1 and 10
    const clampedScale = Math.max(0.1, Math.min(10, newScale));
    
    stage.scale({ x: clampedScale, y: clampedScale });
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    };
    
    stage.position(newPos);
    stage.batchDraw();
    
    setPanZoomState({
      scale: clampedScale,
      position: newPos
    });
  }, []);

  const handleTouchMove = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    const stage = e.target.getStage();
    
    // Single touch - restore dragging if needed
    if (touch1 && !touch2 && !stage.isDragging() && dragStopped.current) {
      stage.startDrag();
      dragStopped.current = false;
    }
    
    // Multi-touch - pinch zoom
    if (touch1 && touch2) {
      if (stage.isDragging()) {
        dragStopped.current = true;
        stage.stopDrag();
      }
      
      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };
      
      if (!lastCenter.current) {
        lastCenter.current = getCenter(p1, p2);
        return;
      }
      
      const newCenter = getCenter(p1, p2);
      const dist = getDistance(p1, p2);
      
      if (!lastDist.current) {
        lastDist.current = dist;
      }
      
      const pointTo = {
        x: (newCenter.x - stage.x()) / stage.scaleX(),
        y: (newCenter.y - stage.y()) / stage.scaleX()
      };
      
      const scale = stage.scaleX() * (dist / lastDist.current);
      const clampedScale = Math.max(0.1, Math.min(10, scale));
      
      stage.scaleX(clampedScale);
      stage.scaleY(clampedScale);
      
      const dx = newCenter.x - lastCenter.current.x;
      const dy = newCenter.y - lastCenter.current.y;
      
      const newPos = {
        x: newCenter.x - pointTo.x * clampedScale + dx,
        y: newCenter.y - pointTo.y * clampedScale + dy
      };
      
      stage.position(newPos);
      
      lastDist.current = dist;
      lastCenter.current = newCenter;
      
      setPanZoomState({
        scale: clampedScale,
        position: newPos
      });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastDist.current = 0;
    lastCenter.current = null;
  }, []);

  const resetZoom = useCallback((stage: Konva.Stage) => {
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
    
    setPanZoomState({
      scale: 1,
      position: { x: 0, y: 0 }
    });
  }, []);

  const zoomToFit = useCallback((stage: Konva.Stage, elements: any[]) => {
    if (elements.length === 0) return;
    
    // Calculate bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    elements.forEach(element => {
      const x = element.x || 0;
      const y = element.y || 0;
      const width = element.width || element.radius * 2 || 100;
      const height = element.height || element.radius * 2 || 100;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    
    const scaleX = stageWidth / contentWidth;
    const scaleY = stageHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const newPos = {
      x: stageWidth / 2 - centerX * scale,
      y: stageHeight / 2 - centerY * scale
    };
    
    stage.scale({ x: scale, y: scale });
    stage.position(newPos);
    stage.batchDraw();
    
    setPanZoomState({ scale, position: newPos });
  }, []);

  const zoomIn = useCallback((stage: Konva.Stage) => {
    const oldScale = stage.scaleX();
    const newScale = Math.min(10, oldScale * 1.2);
    
    const center = {
      x: stage.width() / 2,
      y: stage.height() / 2
    };
    
    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale
    };
    
    stage.scale({ x: newScale, y: newScale });
    
    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale
    };
    
    stage.position(newPos);
    stage.batchDraw();
    
    setPanZoomState({
      scale: newScale,
      position: newPos
    });
  }, []);

  const zoomOut = useCallback((stage: Konva.Stage) => {
    const oldScale = stage.scaleX();
    const newScale = Math.max(0.1, oldScale / 1.2);
    
    const center = {
      x: stage.width() / 2,
      y: stage.height() / 2
    };
    
    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale
    };
    
    stage.scale({ x: newScale, y: newScale });
    
    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale
    };
    
    stage.position(newPos);
    stage.batchDraw();
    
    setPanZoomState({
      scale: newScale,
      position: newPos
    });
  }, []);

  return {
    panZoomState,
    handleWheel,
    handleTouchMove,
    handleTouchEnd,
    resetZoom,
    zoomToFit,
    zoomIn,
    zoomOut
  };
};

// Helper functions
const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const getCenter = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
};
