// Focus State Audit Script
// This script checks all interactive elements for proper focus states

console.log('🔍 Starting Focus State Audit...');

// Function to check if element has visible focus styles
function hasVisibleFocus(element) {
  const computedStyle = window.getComputedStyle(element, ':focus-visible');
  const focusStyle = window.getComputedStyle(element, ':focus');
  
  return {
    hasOutline: computedStyle.outline !== 'none' || focusStyle.outline !== 'none',
    hasRing: computedStyle.boxShadow !== 'none' || focusStyle.boxShadow !== 'none',
    hasBorder: computedStyle.borderColor !== focusStyle.borderColor,
    hasBackground: computedStyle.backgroundColor !== focusStyle.backgroundColor
  };
}

// Get all interactive elements
const interactiveSelectors = [
  'button',
  'input',
  'select',
  'textarea',
  'a[href]',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[tabindex]:not([tabindex="-1"])'
];

const allInteractiveElements = document.querySelectorAll(interactiveSelectors.join(', '));

console.log(`📊 Found ${allInteractiveElements.length} interactive elements`);

// Audit results
const auditResults = {
  total: allInteractiveElements.length,
  withFocus: 0,
  withoutFocus: 0,
  issues: []
};

// Check each element
allInteractiveElements.forEach((element, index) => {
  const focusState = hasVisibleFocus(element);
  const hasAnyFocus = focusState.hasOutline || focusState.hasRing || focusState.hasBorder || focusState.hasBackground;
  
  if (hasAnyFocus) {
    auditResults.withFocus++;
  } else {
    auditResults.withoutFocus++;
    auditResults.issues.push({
      element: element.tagName.toLowerCase(),
      classes: element.className,
      id: element.id,
      text: element.textContent?.slice(0, 50) || '',
      selector: getElementSelector(element)
    });
  }
});

// Generate unique selector for element
function getElementSelector(element) {
  if (element.id) return `#${element.id}`;
  if (element.className) return `${element.tagName.toLowerCase()}.${element.className.split(' ')[0]}`;
  return element.tagName.toLowerCase();
}

// Print results
console.log('\n📋 Focus State Audit Results:');
console.log(`✅ Elements with focus states: ${auditResults.withFocus}`);
console.log(`❌ Elements without focus states: ${auditResults.withoutFocus}`);
console.log(`📈 Coverage: ${Math.round((auditResults.withFocus / auditResults.total) * 100)}%`);

if (auditResults.issues.length > 0) {
  console.log('\n⚠️  Elements needing focus states:');
  auditResults.issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.selector} - "${issue.text}"`);
  });
}

// Test keyboard navigation
console.log('\n⌨️  Testing keyboard navigation...');
console.log('Use Tab key to navigate through elements and verify focus rings are visible');

// Highlight current focused element
let currentFocusedElement = null;

document.addEventListener('focusin', (e) => {
  if (currentFocusedElement) {
    currentFocusedElement.style.boxShadow = '';
  }
  
  currentFocusedElement = e.target;
  const focusState = hasVisibleFocus(e.target);
  
  if (!focusState.hasOutline && !focusState.hasRing) {
    // Temporarily add visible focus for testing
    e.target.style.boxShadow = '0 0 0 2px red';
    console.warn('⚠️  Focus state missing on:', getElementSelector(e.target));
  }
});

console.log('\n🎯 Focus audit complete! Check console for detailed results.');
console.log('💡 Red outline indicates missing focus states during tab navigation.');

// Export results for further analysis
window.focusAuditResults = auditResults; 