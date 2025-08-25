import React, { ReactNode, useRef } from 'react';
import Konva from 'konva';
import { StoreApi } from 'zustand';
import { UnifiedCanvasState } from '@/features/canvas/store/useCanvasStore';

// Create a minimal context for testing purposes, as the original might not be exported
// or easily accessible.
export const CanvasContext = React.createContext<{
  store: StoreApi<UnifiedCanvasState>;
  stageRef: React.RefObject<Konva.Stage | null>;
} | null>(null);

export const CanvasTestWrapper = ({
  children,
  store,
}: {
  children: ReactNode;
  store: any; // Use any to avoid complex type issues in tests
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  
  // Create a mock stage object for testing
  React.useEffect(() => {
    if (!stageRef.current) {
      // Create a mock stage object that matches the Konva mock
      const mockStage = new Konva.Stage({
        container: document.createElement('div'),
        width: 800,
        height: 600
      });
      (stageRef as any).current = mockStage;
    }
  }, []);

  return (
    <CanvasContext.Provider value={{ store, stageRef }}>
      {children}
    </CanvasContext.Provider>
  );
};
