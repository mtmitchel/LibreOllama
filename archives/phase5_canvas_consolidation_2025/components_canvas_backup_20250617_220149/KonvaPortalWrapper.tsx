// src/components/canvas/KonvaPortalWrapper.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface KonvaPortalWrapperProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

/**
 * A wrapper component that safely renders DOM elements outside the Konva tree
 * to prevent React-Konva errors with unknown node types.
 */
const KonvaPortalWrapper: React.FC<KonvaPortalWrapperProps> = ({ 
  children, 
  container 
}) => {
  const portalContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Use provided container or default to document.body
    portalContainerRef.current = container || document.body;
  }, [container]);

  // Safety check to ensure we have a valid container
  if (!portalContainerRef.current) {
    return null;
  }

  try {
    return createPortal(children, portalContainerRef.current);
  } catch (error) {
    console.warn('KonvaPortalWrapper: Failed to create portal, rendering null:', error);
    return null;
  }
};

export default KonvaPortalWrapper;
