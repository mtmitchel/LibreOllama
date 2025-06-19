/**
 * Debug Script for Containment Issues
 * 
 * Run this in browser console to diagnose state management problems:
 * - Elements not moving with sections
 * - Incorrect section associations
 * - Coordinate system inconsistencies
 */

// Function to inspect canvas state
function debugCanvasState() {
  console.log('🔍 CANVAS STATE DEBUG REPORT');
  console.log('============================');
  
  // Get the canvas store state (assuming it's accessible via window or global)
  const store = window.canvasStore || useCanvasStore?.getState?.();
  
  if (!store) {
    console.error('❌ Cannot access canvas store. Make sure it\'s exposed globally.');
    return;
  }
  
  const { elements, sections } = store;
  
  console.log('\n📊 SECTIONS:', Object.keys(sections).length);
  Object.entries(sections).forEach(([sectionId, section]) => {
    console.log(`\n📦 Section: ${sectionId}`);
    console.log(`   Position: (${section.x}, ${section.y})`);
    console.log(`   Size: ${section.width} x ${section.height}`);
    console.log(`   Contained Elements: ${section.containedElementIds.length}`);
    console.log(`   Element IDs: [${section.containedElementIds.join(', ')}]`);
    
    // Check if contained elements actually reference this section
    section.containedElementIds.forEach(elementId => {
      const element = elements[elementId];
      if (!element) {
        console.error(`   ❌ Element ${elementId} not found in elements map!`);
      } else if (element.sectionId !== sectionId) {
        console.error(`   ❌ Element ${elementId} sectionId mismatch: expected ${sectionId}, got ${element.sectionId}`);
      } else {
        console.log(`   ✅ Element ${elementId}: sectionId=${element.sectionId}, coords=(${element.x}, ${element.y})`);
      }
    });
  });
  
  console.log('\n🔲 ELEMENTS:', Object.keys(elements).length);
  Object.entries(elements).forEach(([elementId, element]) => {
    if (element.sectionId) {
      const section = sections[element.sectionId];
      if (!section) {
        console.error(`❌ Element ${elementId} references non-existent section: ${element.sectionId}`);
      } else if (!section.containedElementIds.includes(elementId)) {
        console.error(`❌ Element ${elementId} not in section's containedElementIds list!`);
        console.log(`   Element sectionId: ${element.sectionId}`);
        console.log(`   Section containedElementIds: [${section.containedElementIds.join(', ')}]`);
      } else {
        // Check if coordinates make sense (should be relative to section)
        const absX = section.x + element.x;
        const absY = section.y + element.y;
        console.log(`✅ Element ${elementId}: relative=(${element.x}, ${element.y}), absolute=(${absX}, ${absY})`);
      }
    } else {
      console.log(`🌐 Element ${elementId}: canvas element at (${element.x}, ${element.y})`);
    }
  });
  
  console.log('\n🔍 ORPHANED ELEMENTS (in sections but not in containedElementIds):');
  let orphanCount = 0;
  Object.entries(elements).forEach(([elementId, element]) => {
    if (element.sectionId) {
      const section = sections[element.sectionId];
      if (section && !section.containedElementIds.includes(elementId)) {
        console.error(`❌ ORPHAN: Element ${elementId} has sectionId=${element.sectionId} but section doesn't contain it`);
        orphanCount++;
      }
    }
  });
  
  if (orphanCount === 0) {
    console.log('✅ No orphaned elements found');
  }
  
  console.log('\n🔍 GHOST REFERENCES (in containedElementIds but element missing/wrong):');
  let ghostCount = 0;
  Object.entries(sections).forEach(([sectionId, section]) => {
    section.containedElementIds.forEach(elementId => {
      const element = elements[elementId];
      if (!element) {
        console.error(`❌ GHOST: Section ${sectionId} references missing element ${elementId}`);
        ghostCount++;
      } else if (element.sectionId !== sectionId) {
        console.error(`❌ GHOST: Section ${sectionId} references element ${elementId} but element.sectionId=${element.sectionId}`);
        ghostCount++;
      }
    });
  });
  
  if (ghostCount === 0) {
    console.log('✅ No ghost references found');
  }
  
  console.log('\n============================');
  console.log('🔍 DEBUG REPORT COMPLETE');
}

// Function to fix orphaned elements
function fixOrphanedElements() {
  console.log('🔧 FIXING ORPHANED ELEMENTS...');
  
  const store = window.canvasStore || useCanvasStore?.getState?.();
  if (!store) {
    console.error('❌ Cannot access canvas store.');
    return;
  }
  
  const { elements, sections, updateElement } = store;
  let fixCount = 0;
  
  Object.entries(elements).forEach(([elementId, element]) => {
    if (element.sectionId) {
      const section = sections[element.sectionId];
      if (section && !section.containedElementIds.includes(elementId)) {
        console.log(`🔧 Adding ${elementId} to section ${element.sectionId} containedElementIds`);
        section.containedElementIds.push(elementId);
        fixCount++;
      }
    }
  });
  
  console.log(`✅ Fixed ${fixCount} orphaned elements`);
}

// Function to validate coordinates
function validateCoordinates() {
  console.log('📐 VALIDATING COORDINATES...');
  
  const store = window.canvasStore || useCanvasStore?.getState?.();
  if (!store) {
    console.error('❌ Cannot access canvas store.');
    return;
  }
  
  const { elements, sections } = store;
  
  Object.entries(elements).forEach(([elementId, element]) => {
    if (element.sectionId) {
      const section = sections[element.sectionId];
      if (section) {
        // Check if relative coordinates make sense
        if (element.x < 0 || element.y < 0) {
          console.warn(`⚠️  Element ${elementId} has negative relative coordinates: (${element.x}, ${element.y})`);
        }
        if (element.x > section.width || element.y > section.height) {
          console.warn(`⚠️  Element ${elementId} relative coordinates exceed section bounds: (${element.x}, ${element.y}) vs section (${section.width}, ${section.height})`);
        }
      }
    }
  });
  
  console.log('📐 Coordinate validation complete');
}

// Make functions available globally for debugging
window.debugCanvasState = debugCanvasState;
window.fixOrphanedElements = fixOrphanedElements;
window.validateCoordinates = validateCoordinates;

console.log('🔧 Debug functions loaded. Available commands:');
console.log('  debugCanvasState() - Full state inspection');
console.log('  fixOrphanedElements() - Fix orphaned elements');
console.log('  validateCoordinates() - Check coordinate consistency');
