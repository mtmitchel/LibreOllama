/**
 * Simple Section Detection Test
 * Run this in browser console after loading the app to test section detection
 */

function testSectionDetection() {
  console.log('🧪 TESTING SECTION DETECTION');
  console.log('==============================');
  
  // Get the enhanced store (you might need to adjust this based on how the store is exposed)
  const store = window.useCanvasStore?.getState?.();
  
  if (!store) {
    console.error('❌ Cannot access canvas store. Try: window.useCanvasStore = useCanvasStore');
    return;
  }
  
  const { sections, findSectionAtPoint } = store;
  
  console.log('📊 Available sections:', Object.keys(sections).length);
  Object.entries(sections).forEach(([id, section]) => {
    console.log(`  - ${id}: (${section.x}, ${section.y}) ${section.width}x${section.height}`);
  });
  
  // Test some points
  const testPoints = [
    { x: 100, y: 100, description: 'Top-left canvas area' },
    { x: 400, y: 300, description: 'Center canvas area' },
    { x: 50, y: 50, description: 'Near origin' },
  ];
  
  // Also test points inside known sections
  Object.entries(sections).forEach(([id, section]) => {
    testPoints.push({
      x: section.x + section.width / 2,
      y: section.y + section.height / 2,
      description: `Center of section ${id}`
    });
    
    testPoints.push({
      x: section.x + 10,
      y: section.y + 10,
      description: `Near top-left of section ${id}`
    });
  });
  
  console.log('\n🎯 Testing point detection:');
  testPoints.forEach(point => {
    const result = findSectionAtPoint({ x: point.x, y: point.y });
    console.log(`  Point (${point.x}, ${point.y}) [${point.description}]: ${result || 'No section'}`);
  });
  
  console.log('\n==============================');
  console.log('🧪 Section detection test complete');
}

// Make it available globally
window.testSectionDetection = testSectionDetection;

console.log('🧪 Section detection test loaded. Run: testSectionDetection()');
