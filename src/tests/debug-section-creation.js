// Quick debug script to test section creation
const { createCanvasStore } = require('./src/features/canvas/stores/canvasStore.enhanced.ts');

console.log('Testing section creation...');

const store = createCanvasStore();
const sectionId = store.getState().createSection(100, 100, 300, 200, 'Debug Section');

console.log('Section ID:', sectionId);
console.log('Sections map:', store.getState().sections);
console.log('Elements map:', store.getState().elements);

const section = store.getState().sections.get(sectionId);
console.log('Section data:', section);

const element = store.getState().elements.get(sectionId);
console.log('Element data:', element);
