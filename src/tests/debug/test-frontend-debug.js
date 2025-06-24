// Quick frontend debug test
import { createCanvasStore } from './src/features/canvas/stores/canvasStore.enhanced.js';
import { ElementId, SectionId } from './src/features/canvas/types/enhanced.types.js';

console.log('🔍 Testing frontend element capture...');

// Create store
const store = createCanvasStore();
const state = store.getState();

console.log('Store methods available:', Object.keys(state));

// Create test elements
const element1 = {
  id: ElementId('test-element-1'),
  type: 'rectangle',
  x: 50,  // Should be inside section (100, 100, 200, 150)
  y: 100,
  width: 50,
  height: 25,
  fill: '#ff0000',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const element2 = {
  id: ElementId('test-element-2'),
  type: 'circle',
  x: 120,  // Should be inside section
  y: 120,
  radius: 15,
  fill: '#00ff00',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

console.log('🔹 Adding elements to store...');
state.addElement(element1);
state.addElement(element2);

const elementsAfterAdd = store.getState().elements;
console.log('Elements after add:', elementsAfterAdd.size);
console.log('Element 1:', elementsAfterAdd.get(element1.id));
console.log('Element 2:', elementsAfterAdd.get(element2.id));

console.log('🔹 Creating section that should capture elements...');
// Create section that should capture both elements
const sectionId = state.createSection(100, 100, 200, 150, 'Test Section');

const finalState = store.getState();
const finalSection = finalState.sections.get(sectionId);
const finalElement1 = finalState.elements.get(element1.id);
const finalElement2 = finalState.elements.get(element2.id);

console.log('🔍 Results:');
console.log('Section:', finalSection);
console.log('Element 1 after section creation:', finalElement1);
console.log('Element 2 after section creation:', finalElement2);
console.log('Section childElementIds:', finalSection?.childElementIds);
