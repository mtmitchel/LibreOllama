// src/components/canvas/React19CompatiblePortal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Konva from 'konva';

interface React19CompatiblePortalProps {
  children: React.ReactNode;
  divProps?: React.HTMLAttributes<HTMLDivElement>;
  stage?: Konva.Stage | null;
}

/**
 * A React 19-compatible portal for rendering DOM elements over Konva canvas.
 * This replaces the problematic Html component from react-konva-utils.
 * 
 * The issue with react-konva-utils in React 19 is that the portal mounting order
 * has changed, causing DOM elements to be treated as Konva nodes.
 */
export const React19CompatiblePortal: React.FC<React19CompatiblePortalProps> = ({
  children,
  divProps = {},
  stage
}) => {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create portal container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.pointerEvents = 'none'; // Let canvas handle pointer events by default
    container.style.userSelect = 'none';
    container.style.zIndex = '1000';
    
    // Apply any custom div props
    Object.assign(container.style, divProps?.style || {});
    if (divProps?.className) {
      container.className = divProps.className;
    }

    // Get the canvas container (the parent of the Stage)
    let canvasContainer: HTMLElement | null = null;
    
    if (stage) {
      // Use the stage's container
      canvasContainer = stage.container().parentElement;
    } else {
      // Fallback: find the canvas container by looking for the stage
      const stageElements = document.querySelectorAll('canvas');
      if (stageElements.length > 0) {
        canvasContainer = stageElements[0].parentElement;
      }
    }

    if (!canvasContainer) {
      // Final fallback: use document.body
      canvasContainer = document.body;
    }

    // Add to DOM
    canvasContainer.appendChild(container);
    containerRef.current = container;
    setPortalContainer(container);

    // Cleanup function
    return () => {
      if (container && container.parentElement) {
        container.parentElement.removeChild(container);
      }
      containerRef.current = null;
      setPortalContainer(null);
    };
  }, [stage, divProps?.style, divProps?.className]);

  // Only render portal when container is ready and mounted
  if (!portalContainer) {
    return null;
  }

  return createPortal(children, portalContainer);
};

export default React19CompatiblePortal;
