// Debug script to test component imports
async function testImports() {
  try {
    console.log('Testing component imports...');
    
    const components = [
      './src/features/canvas/shapes/TextShape.tsx',
      './src/features/canvas/shapes/ImageShape.tsx', 
      './src/features/canvas/shapes/StickyNoteShape.tsx',
      './src/features/canvas/shapes/StarShape.tsx',
      './src/features/canvas/shapes/TriangleShape.tsx',
      './src/features/canvas/shapes/PenShape.tsx',
      './src/features/canvas/shapes/SectionShape.tsx',
      './src/features/canvas/shapes/EditableNode.tsx',
      './src/features/canvas/components/EnhancedTableElement.tsx',
      './src/features/canvas/components/KonvaErrorBoundary.tsx'
    ];
    
    for (const component of components) {
      try {
        const module = await import(component);
        console.log(`✅ ${component}: OK`);
        console.log('   Exports:', Object.keys(module));
      } catch (error) {
        console.log(`❌ ${component}: FAILED`);
        console.error('   Error:', error.message);
      }
    }
  } catch (error) {
    console.error('Script error:', error);
  }
}

testImports();
