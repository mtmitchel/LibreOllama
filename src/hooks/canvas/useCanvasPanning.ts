import { useEffect, useRef } from 'react';
import { Canvas } from 'fabric';
type FabricCanvasInstance = Canvas;

export const useCanvasPanning = (canvas: FabricCanvasInstance | null) => {
  const isPanningRef = useRef(false);
  const lastPosXRef = useRef(0);
  const lastPosYRef = useRef(0);

  useEffect(() => {
    if (!canvas) {
      return;
    }

    const onMouseDown = (opt: any) => {
      if (!(opt.e instanceof MouseEvent)) return;
      const e = opt.e as MouseEvent;
      // Middle mouse button (usually button 1) or Alt key + Left mouse button (button 0)
      if (e.altKey || e.button === 1) {
        isPanningRef.current = true;
        canvas.selection = false; // Disable selection during pan
        lastPosXRef.current = e.clientX;
        lastPosYRef.current = e.clientY;
        canvas.defaultCursor = 'grabbing';
        canvas.requestRenderAll();
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onMouseMove = (opt: any) => {
      if (!(opt.e instanceof MouseEvent)) return;
      const e = opt.e as MouseEvent;
      // Check if panning is active and if Alt key is pressed or middle mouse button is held
      if (isPanningRef.current && (e.altKey || (e.buttons & 4) === 4)) { // e.buttons & 4 for middle mouse button
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPosXRef.current;
          vpt[5] += e.clientY - lastPosYRef.current;
          canvas.requestRenderAll();
          lastPosXRef.current = e.clientX;
          lastPosYRef.current = e.clientY;
        }
      } else if (isPanningRef.current) {
        // If altKey or middle mouse button is released during move, stop panning
        isPanningRef.current = false;
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.requestRenderAll();
      }
    };

    const onMouseUp = (opt: any) => {
      if (!(opt.e instanceof MouseEvent)) return;
      if (isPanningRef.current) {
        canvas.setViewportTransform(canvas.viewportTransform || [1, 0, 0, 1, 0, 0]);
        isPanningRef.current = false;
        canvas.selection = true; // Re-enable selection
        canvas.defaultCursor = 'default';
        canvas.requestRenderAll();
        
        const e = opt.e as MouseEvent;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onMouseOut = (_opt: any) => {
      // For mouseout, we might not need to check instance if we're just resetting state
      // However, if any opt.e properties were used, a check would be needed.
      // In this specific onMouseOut, opt.e is not used, so the check is less critical
      // but good for consistency if it were to evolve.
      // if (!(opt.e instanceof MouseEvent)) return; // Example if opt.e was used
        if (isPanningRef.current) {
            canvas.setViewportTransform(canvas.viewportTransform || [1, 0, 0, 1, 0, 0]);
            isPanningRef.current = false;
            canvas.selection = true;
            canvas.defaultCursor = 'default';
            canvas.requestRenderAll();
        }
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);
    canvas.on('mouse:out', onMouseOut);

    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
      canvas.off('mouse:out', onMouseOut);
      if (canvas.defaultCursor === 'grabbing') {
        canvas.defaultCursor = 'default';
      }
    };
  }, [canvas]);
};
