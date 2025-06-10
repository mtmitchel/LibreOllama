import * as fabric from 'fabric';

console.log('🔍 FABRIC VALIDATION:', {
  fabricAvailable: typeof fabric !== 'undefined',
  canvasConstructor: typeof fabric?.Canvas,
  iTextConstructor: typeof fabric?.IText,
  rectConstructor: typeof fabric?.Rect,
  pointConstructor: typeof fabric?.Point,
  version: fabric?.version
});

// ...existing code...
// CURRENT (STILL WRONG)
// import { fabric } from 'fabric';
// type FabricCanvas = fabric.Canvas;
// fabricCanvasRef.current = new FabricCanvas(node, mergedOptions);

// SHOULD BE
// import { fabric } from 'fabric';
fabricCanvasRef.current = new fabric.Canvas(node, mergedOptions);
// ...existing code...