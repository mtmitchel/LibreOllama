// Canvas Debug Helper Script
// Run this in your browser console to debug section creation issues

function debugSections() {
  console.log('🔍 Debugging Canvas Sections...\n');
  
  // Try multiple ways to access the store
  let store = null;
  const possibleStores = [
    window.__CANVAS_STORE__,
    window.canvasStore,
    window.useCanvasStore?.getState?.(),
    window.store
  ];
  
  for (const s of possibleStores) {
    if (s && typeof s.getState === 'function') {
      store = s;
      break;
    }
  }
  
  if (!store) {
    console.error('❌ Canvas store not found! Make sure you\'re on the canvas page.');
    return;
  }
  
  const state = store.getState();
  
  console.log('📊 Canvas State:');
  console.log(`  Elements: ${state.elements?.size || 0}`);
  console.log(`  Sections: ${state.sections?.size || 0}`);
  console.log(`  Selected Tool: ${state.selectedTool}`);
  
  // Check if sections exist
  if (state.sections && state.sections.size > 0) {
    console.log('\n✅ Sections found in store:');
    Array.from(state.sections.values()).forEach((section, i) => {
      console.log(`  ${i + 1}. ${section.title || 'Untitled Section'}`);
      console.log(`     ID: ${section.id}`);
      console.log(`     Position: (${section.x}, ${section.y})`);
      console.log(`     Size: ${section.width}x${section.height}`);
      console.log(`     Background: ${section.backgroundColor || 'default'}`);
    });
  } else {
    console.log('\n❌ No sections found in store');
  }
  
  // Check if section tool is working
  console.log('\n🔧 Section Tool Status:');
  console.log(`  Current Tool: ${state.selectedTool}`);
  console.log(`  Is Drawing: ${state.isDrawing}`);
  console.log(`  Is Drawing Section: ${state.isDrawingSection || 'N/A'}`);
  
  // Instructions
  console.log('\n📝 Instructions to test section creation:');
  console.log('1. Run: store.getState().setSelectedTool("section")');
  console.log('2. Click and drag on the canvas (minimum 10x10 pixels)');
  console.log('3. Check console for "Section created successfully" message');
  console.log('4. Run this debug function again to see if section was created');
  
  return state;
}

// Run the debug function
debugSections();

// Helper to manually create a test section
function createTestSection() {
  const store = window.__CANVAS_STORE__ || window.canvasStore || window.useCanvasStore?.getState?.();
  if (!store) {
    console.error('Store not found!');
    return;
  }
  
  const state = store.getState();
  const sectionId = state.createSection(100, 100, 200, 150, 'Test Section');
  console.log('✅ Created test section:', sectionId);
  
  // Check if it was created
  setTimeout(() => {
    const newState = store.getState();
    if (newState.sections.has(sectionId)) {
      console.log('✅ Section exists in store');
    } else {
      console.log('❌ Section not found in store');
    }
  }, 100);
}

console.log('\n💡 Additional helpers:');
console.log('- debugSections() - Run section diagnostics');
console.log('- createTestSection() - Create a test section programmatically');
