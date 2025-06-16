import { createContext, useContext } from 'react';
import * as fabric from 'fabric';
type FabricCanvasInstance = fabric.Canvas;

interface FabricCanvasContextType {
  fabricCanvas: fabric.Canvas | null;
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
