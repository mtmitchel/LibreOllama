// Debug script to check capture logic
console.log('=== CAPTURE DEBUG ===');

// Test 1 - Element 1
const element1 = { x: 120, y: 120, width: 100, height: 50 };
const centerX1 = element1.x + element1.width / 2; // 170
const centerY1 = element1.y + element1.height / 2; // 145

console.log('Element 1:', { x: element1.x, y: element1.y, centerX: centerX1, centerY: centerY1 });

// Test 2 - Element 2  
const element2 = { x: 200, y: 150, width: 100, height: 50 };
const centerX2 = element2.x + element2.width / 2; // 250
const centerY2 = element2.y + element2.height / 2; // 175

console.log('Element 2:', { x: element2.x, y: element2.y, centerX: centerX2, centerY: centerY2 });

// Section bounds
const section = { x: 100, y: 100, width: 300, height: 200 };
const rightBound = section.x + section.width; // 400
const bottomBound = section.y + section.height; // 300

console.log('Section bounds:', { 
  left: section.x, 
  right: rightBound, 
  top: section.y, 
  bottom: bottomBound 
});

// Check containment
const elem1InSection = centerX1 >= section.x && centerX1 <= rightBound && centerY1 >= section.y && centerY1 <= bottomBound;
const elem2InSection = centerX2 >= section.x && centerX2 <= rightBound && centerY2 >= section.y && centerY2 <= bottomBound;

console.log('Element 1 in section:', elem1InSection, '(170 >= 100 && 170 <= 400 && 145 >= 100 && 145 <= 300)');
console.log('Element 2 in section:', elem2InSection, '(250 >= 100 && 250 <= 400 && 175 >= 100 && 175 <= 300)');