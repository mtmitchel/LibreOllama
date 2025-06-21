// Quick test to see what's exported from canvasElementsStore
import * as CanvasElementsStore from './src/features/canvas/stores/slices/canvasElementsStore';

console.log('CanvasElementsStore keys:', Object.keys(CanvasElementsStore));
console.log('createCanvasElementsStore:', typeof CanvasElementsStore.createCanvasElementsStore);
