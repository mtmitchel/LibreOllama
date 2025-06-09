// Simple test to check for React warnings in the console
console.log('Testing Canvas page for React warnings...');

// Navigate to canvas page and check console
setTimeout(() => {
  console.log('Canvas page should be loaded. Check browser console for:');
  console.log('1. "Invalid value for prop `draw` on <div> tag" - should be ELIMINATED');
  console.log('2. "Received `true` for a non-boolean attribute `interactive`" - should be ELIMINATED');
  console.log('3. "Unknown event handler property `onMount`" - should be ELIMINATED');
  console.log('');
  console.log('If these warnings are gone, the prop filtering is working correctly.');
}, 2000);