// Quick debug script to check import issues
console.log("Starting import debug...");

try {
  // Try to dynamically import the module
  import('./src/features/canvas/stores/slices/canvasElementsStore.ts').then((module) => {
    console.log("Dynamic import successful!");
    console.log("Module keys:", Object.keys(module));
    console.log("createCanvasElementsStore type:", typeof module.createCanvasElementsStore);
    console.log("Module default:", module.default);
  }).catch((error) => {
    console.error("Dynamic import failed:", error);
  });
} catch (error) {
  console.error("Error during import:", error);
}
