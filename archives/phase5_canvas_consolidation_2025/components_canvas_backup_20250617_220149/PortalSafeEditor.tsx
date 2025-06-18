// src/components/canvas/PortalSafeEditor.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PortalSafeEditorProps {
  children: React.ReactNode;
  isActive: boolean;
  onMount?: () => void;
  onUnmount?: () => void;
}

/**
 * A portal wrapper specifically designed to safely render text editors
 * outside the React-Konva tree to prevent reconciler conflicts.
 */
export const PortalSafeEditor: React.FC<PortalSafeEditorProps> = ({
  children,
  isActive,
  onMount,
  onUnmount
}) => {
  const portalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isActive) {
      // Create a dedicated portal container
      const container = document.createElement('div');
      container.id = `portal-editor-${Date.now()}`;
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '1000';
      container.dataset.portalEditor = 'true';
      
      document.body.appendChild(container);
      portalContainerRef.current = container;
      
      onMount?.();
      
      return () => {
        if (portalContainerRef.current) {
          document.body.removeChild(portalContainerRef.current);
          portalContainerRef.current = null;
        }
        onUnmount?.();
      };
    }
  }, [isActive, onMount, onUnmount]);

  if (!isActive || !portalContainerRef.current) {
    return null;
  }

  try {
    return createPortal(
      <div style={{ pointerEvents: 'auto' }}>
        {children}
      </div>,
      portalContainerRef.current
    );
  } catch (error) {
    console.warn('PortalSafeEditor: Failed to create portal:', error);
    return null;
  }
};

export default PortalSafeEditor;
