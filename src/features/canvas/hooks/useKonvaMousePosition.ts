import { useCallback, useRef, useEffect } from 'react';
import type Konva from 'konva';

export const useKonvaMousePosition = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const transformRef = useRef<Konva.Transform | null>(null);
  
  // Cache the transform calculation for performance
  const updateTransform = useCallback(() => {
    if (!stageRef.current) return;
    
    const stage = stageRef.current;
    transformRef.current = stage.getAbsoluteTransform().copy().invert();
  }, [stageRef]);
  
  // Update transform when stage changes
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    updateTransform();
    
    // Listen for stage transformations
    const handleStageChange = () => {
      updateTransform();
    };
    
    stage.on('dragend', handleStageChange);
    stage.on('wheel', handleStageChange);
    
    return () => {
      stage.off('dragend', handleStageChange);
      stage.off('wheel', handleStageChange);
    };
  }, [updateTransform, stageRef]);
  
  const getCanvasPosition = useCallback((e: Konva.KonvaEventObject<MouseEvent> | MouseEvent) => {
    const stage = stageRef.current;
    if (!stage || !transformRef.current) {
      updateTransform();
      if (!transformRef.current) return null;
    }
    
    const nativeEvent = 'evt' in e ? e.evt : e;
    
    const container = stage.container();
    const containerRect = container.getBoundingClientRect();
    
    // The most robust way to calculate pointer position is to use viewport-relative
    // coordinates from both the event and the container, then transform.
    // Over-correcting for scroll or pixelRatio can introduce errors in embedded environments.
    const mousePos = {
      x: nativeEvent.clientX - containerRect.left,
      y: nativeEvent.clientY - containerRect.top
    };
    
    return transformRef.current.point(mousePos);
  }, [stageRef, updateTransform]);
  
  return { getCanvasPosition, updateTransform };
};
