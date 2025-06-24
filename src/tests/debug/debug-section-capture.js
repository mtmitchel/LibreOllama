// Debug script to test section capture logic
console.log('🔍 DEBUGGING SECTION CAPTURE LOGIC');

// Test coordinates from the failing test
const element1 = { x: 150, y: 150, width: 50, height: 50 };  // Default dimensions
const element2 = { x: 200, y: 180, width: 50, height: 50 };
const section = { x: 100, y: 100, width: 300, height: 200 }; // bounds: (100,100) to (400,300)

console.log('📍 Element 1:');
console.log('  Position:', element1.x, element1.y);
console.log('  Center:', element1.x + element1.width/2, element1.y + element1.height/2);
console.log('  Center:', 175, 175);

console.log('📍 Element 2:');
console.log('  Position:', element2.x, element2.y);
console.log('  Center:', element2.x + element2.width/2, element2.y + element2.height/2);
console.log('  Center:', 225, 205);

console.log('📍 Section bounds:');
console.log('  Top-left:', section.x, section.y);
console.log('  Bottom-right:', section.x + section.width, section.y + section.height);
console.log('  Bounds: (100,100) to (400,300)');

console.log('🧪 Containment tests:');
console.log('Element 1 center (175, 175) in section bounds?');
console.log('  X: 175 >= 100 && 175 <= 400?', 175 >= 100 && 175 <= 400);
console.log('  Y: 175 >= 100 && 175 <= 300?', 175 >= 100 && 175 <= 300);
console.log('  WITHIN SECTION:', 175 >= 100 && 175 <= 400 && 175 >= 100 && 175 <= 300);

console.log('Element 2 center (225, 205) in section bounds?');
console.log('  X: 225 >= 100 && 225 <= 400?', 225 >= 100 && 225 <= 400);
console.log('  Y: 205 >= 100 && 205 <= 300?', 205 >= 100 && 205 <= 300);
console.log('  WITHIN SECTION:', 225 >= 100 && 225 <= 400 && 205 >= 100 && 205 <= 300);
