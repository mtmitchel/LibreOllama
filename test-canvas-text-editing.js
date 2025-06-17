// Test script for Canvas Text Editing Fixes
// Run this in browser console on the canvas page to test the fixes

console.log('🧪 Starting Canvas Text Editing Tests...');

// Test utilities
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: Double-click table cells and verify textarea appears at correct position
async function testTableCellEditing() {
  console.log('📊 Test 1: Table Cell Editing Position');
  
  // Look for table cells
  const tableCells = document.querySelectorAll('[data-table-cell]');
  if (tableCells.length === 0) {
    console.log('⚠️ No table cells found, skipping table test');
    return;
  }
  
  const firstCell = tableCells[0];
  const cellRect = firstCell.getBoundingClientRect();
  
  // Simulate double-click
  const dblClickEvent = new MouseEvent('dblclick', {
    bubbles: true,
    cancelable: true,
    clientX: cellRect.left + cellRect.width / 2,
    clientY: cellRect.top + cellRect.height / 2
  });
  
  firstCell.dispatchEvent(dblClickEvent);
  
  await delay(100);
  
  // Check if textarea appeared
  const textarea = document.querySelector('textarea');
  if (textarea) {
    const textareaRect = textarea.getBoundingClientRect();
    const positionDiff = {
      x: Math.abs(textareaRect.left - cellRect.left),
      y: Math.abs(textareaRect.top - cellRect.top)
    };
    
    console.log('✅ Textarea appeared at position:', {
      cell: { x: cellRect.left, y: cellRect.top },
      textarea: { x: textareaRect.left, y: textareaRect.top },
      difference: positionDiff
    });
    
    // Close editor
    textarea.blur();
  } else {
    console.log('❌ Textarea did not appear');
  }
}

// Test 2: Type text in table cells and confirm it persists
async function testTableCellPersistence() {
  console.log('💾 Test 2: Table Cell Text Persistence');
  
  const tableCells = document.querySelectorAll('[data-table-cell]');
  if (tableCells.length === 0) {
    console.log('⚠️ No table cells found, skipping persistence test');
    return;
  }
  
  const testCell = tableCells[0];
  const testText = 'Test persistence ' + Date.now();
  
  // Double-click to edit
  testCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  await delay(100);
  
  const textarea = document.querySelector('textarea');
  if (textarea) {
    // Type text
    textarea.value = testText;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Press Enter to save
    textarea.dispatchEvent(new KeyboardEvent('keydown', { 
      key: 'Enter', 
      bubbles: true 
    }));
    
    await delay(200);
    
    // Check if text persisted
    const cellText = testCell.textContent || testCell.innerText;
    if (cellText.includes(testText)) {
      console.log('✅ Text persisted in cell:', testText);
    } else {
      console.log('❌ Text did not persist. Expected:', testText, 'Got:', cellText);
    }
  }
}

// Test 3: Double-click sticky notes and ensure text editor remains visible
async function testStickyNoteEditing() {
  console.log('🗒️ Test 3: Sticky Note Text Editing');
  
  const stickyNotes = document.querySelectorAll('[data-sticky-note]');
  if (stickyNotes.length === 0) {
    console.log('⚠️ No sticky notes found, skipping sticky note test');
    return;
  }
  
  const stickyNote = stickyNotes[0];
  stickyNote.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  
  await delay(100);
  
  const editor = document.querySelector('textarea, [contenteditable="true"]');
  if (editor) {
    console.log('✅ Sticky note editor appeared');
    
    // Test that editor stays visible
    await delay(500);
    const isStillVisible = editor.offsetParent !== null;
    if (isStillVisible) {
      console.log('✅ Editor remained visible');
    } else {
      console.log('❌ Editor disappeared');
    }
    
    // Close editor
    if (editor.blur) editor.blur();
  } else {
    console.log('❌ Sticky note editor did not appear');
  }
}

// Test 4: Test escape and enter key handling
async function testKeyboardHandling() {
  console.log('⌨️ Test 4: Keyboard Event Handling');
  
  // Find any editable element
  const editableElements = document.querySelectorAll('[data-table-cell], [data-sticky-note]');
  if (editableElements.length === 0) {
    console.log('⚠️ No editable elements found, skipping keyboard test');
    return;
  }
  
  const element = editableElements[0];
  element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  
  await delay(100);
  
  const editor = document.querySelector('textarea, [contenteditable="true"]');
  if (editor) {
    // Test Escape key
    console.log('🔄 Testing Escape key...');
    editor.dispatchEvent(new KeyboardEvent('keydown', { 
      key: 'Escape', 
      bubbles: true 
    }));
    
    await delay(100);
    
    const escapedEditor = document.querySelector('textarea, [contenteditable="true"]');
    if (!escapedEditor || escapedEditor.offsetParent === null) {
      console.log('✅ Escape key closed editor');
    } else {
      console.log('❌ Escape key did not close editor');
    }
    
    // Test Enter key
    element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await delay(100);
    
    const newEditor = document.querySelector('textarea, [contenteditable="true"]');
    if (newEditor) {
      console.log('🔄 Testing Enter key...');
      newEditor.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter', 
        bubbles: true 
      }));
      
      await delay(100);
      
      const enterEditor = document.querySelector('textarea, [contenteditable="true"]');
      if (!enterEditor || enterEditor.offsetParent === null) {
        console.log('✅ Enter key closed editor');
      } else {
        console.log('❌ Enter key did not close editor');
      }
    }
  }
}

// Test 5: Test text selection conflicts prevention
function testTextSelectionPrevention() {
  console.log('🚫 Test 5: Text Selection Prevention');
  
  const canvasContainer = document.querySelector('.konva-canvas-container, canvas');
  if (canvasContainer) {
    const style = window.getComputedStyle(canvasContainer);
    const userSelect = style.userSelect || style.webkitUserSelect;
    
    if (userSelect === 'none') {
      console.log('✅ Text selection prevented on canvas');
    } else {
      console.log('❌ Text selection not prevented. userSelect:', userSelect);
    }
  } else {
    console.log('⚠️ Canvas container not found');
  }
}

// Test 6: Test empty text cleanup debouncing
async function testEmptyTextDebouncing() {
  console.log('⏱️ Test 6: Empty Text Cleanup Debouncing');
  
  const editableElements = document.querySelectorAll('[data-table-cell], [data-sticky-note]');
  if (editableElements.length === 0) {
    console.log('⚠️ No editable elements found, skipping debouncing test');
    return;
  }
  
  const element = editableElements[0];
  element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  
  await delay(100);
  
  const editor = document.querySelector('textarea, [contenteditable="true"]');
  if (editor) {
    // Clear the text
    if (editor.value !== undefined) {
      editor.value = '';
    } else {
      editor.textContent = '';
    }
    
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Blur the editor (should trigger debounced cleanup)
    editor.blur();
    
    // Check immediately (should still exist due to debouncing)
    const immediateCheck = document.querySelector('textarea, [contenteditable="true"]');
    if (immediateCheck) {
      console.log('✅ Editor still exists immediately after blur (debounced)');
      
      // Check after delay
      setTimeout(() => {
        const delayedCheck = document.querySelector('textarea, [contenteditable="true"]');
        if (!delayedCheck || delayedCheck.offsetParent === null) {
          console.log('✅ Editor removed after debounce delay');
        } else {
          console.log('❌ Editor not removed after debounce delay');
        }
      }, 1200);
    } else {
      console.log('❌ Editor removed immediately (no debouncing)');
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Running Canvas Text Editing Tests...\n');
  
  try {
    await testTableCellEditing();
    await delay(500);
    
    await testTableCellPersistence();
    await delay(500);
    
    await testStickyNoteEditing();
    await delay(500);
    
    await testKeyboardHandling();
    await delay(500);
    
    testTextSelectionPrevention();
    await delay(500);
    
    await testEmptyTextDebouncing();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export for manual testing
window.canvasTextEditingTests = {
  runAllTests,
  testTableCellEditing,
  testTableCellPersistence,
  testStickyNoteEditing,
  testKeyboardHandling,
  testTextSelectionPrevention,
  testEmptyTextDebouncing
};

console.log('🎯 Canvas text editing tests loaded!');
console.log('💡 Run: canvasTextEditingTests.runAllTests() to test all fixes');
console.log('💡 Or run individual tests like: canvasTextEditingTests.testTableCellEditing()');
