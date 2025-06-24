// Debug section capture logic with actual store
import { canvasStore } from './src/features/canvas/stores/canvasStore.enhanced.ts';

const store = canvasStore;

// Clear state
store.getState().clearCanvas();

console.log('=== SECTION CAPTURE DEBUG ===');

// Create elements first
const element1 = {
  id: 'element-1',
  type: 'rectangle',
  x: 120,
  y: 120,
  width: 100,
  height: 50,
  fill: '#3B82F6',
  stroke: '#1E40AF',
  strokeWidth: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const element2 = {
  id: 'element-2', 
  type: 'rectangle',
  x: 200,
  y: 150,
  width: 100,
  height: 50,
  fill: '#3B82F6',
  stroke: '#1E40AF',
  strokeWidth: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

console.log('Adding elements...');
store.getState().addElement(element1);
store.getState().addElement(element2);

console.log('Elements after add:');
console.log('- Element 1:', store.getState().elements.get('element-1'));
console.log('- Element 2:', store.getState().elements.get('element-2'));

// Create section
console.log('Creating section...');
const sectionId = store.getState().createSection(100, 100, 300, 200, 'Capture Section');

console.log('Section ID:', sectionId);
console.log('Section:', store.getState().sections.get(sectionId));

// Check elements after section creation
console.log('Elements after section creation:');
const elem1After = store.getState().elements.get('element-1');
const elem2After = store.getState().elements.get('element-2');
console.log('- Element 1:', elem1After);
console.log('- Element 2:', elem2After);

// Check section children
const section = store.getState().sections.get(sectionId);
console.log('Section childElementIds:', section?.childElementIds);

console.log('=== DEBUG COMPLETE ===');