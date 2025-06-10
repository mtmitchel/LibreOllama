import { createContext, useContext } from 'react';
import { Canvas } from 'fabric';
type FabricCanvasInstance = Canvas;

interface FabricCanvasContextType {
  fabricCanvas: FabricCanvasInstance | null;
}

const FabricCanvasContext = createContext<FabricCanvasContextType | undefined>(undefined);

export const useFabricCanvasContext = () => {
  const context = useContext(FabricCanvasContext);
  if (context === undefined) {
    throw new Error('useFabricCanvasContext must be used within a FabricCanvasProvider');
  }
  return context;
};

export default FabricCanvasContext;
