/**
 * Rich Text Multiple Formatting Test
 * Tests the fix for preserving multiple formatting types (bold + italic + color)
 */

import { richTextManager } from './src/components/canvas/RichTextSystem/UnifiedRichTextManager';
import { StandardTextFormat, RichTextSegment } from './src/types/richText';

// Test data
const testSegments: RichTextSegment[] = [
  {
    text: "Hello World",
    fontSize: 14,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "",
    fill: "#000000"
  }
];

const testSelection = { start: 0, end: 5 }; // Select "Hello"

console.log('🧪 Testing Multiple Formatting Preservation...\n');

// Test 1: Apply bold
console.log('1. Applying bold formatting...');
const boldFormat: Partial<StandardTextFormat> = { bold: true };
const afterBold = richTextManager.applyFormattingToSegments(testSegments, boldFormat, testSelection);
console.log('Result:', afterBold.map(s => ({
  text: s.text,
  fontWeight: s.fontWeight,
  fontStyle: s.fontStyle,
  textDecoration: s.textDecoration,
  fill: s.fill
})));

// Test 2: Apply italic to the same selection (should preserve bold)
console.log('\n2. Applying italic formatting (should preserve bold)...');
const italicFormat: Partial<StandardTextFormat> = { italic: true };
const afterItalic = richTextManager.applyFormattingToSegments(afterBold, italicFormat, testSelection);
console.log('Result:', afterItalic.map(s => ({
  text: s.text,
  fontWeight: s.fontWeight,
  fontStyle: s.fontStyle,
  textDecoration: s.textDecoration,
  fill: s.fill
})));

// Test 3: Apply color (should preserve bold + italic)
console.log('\n3. Applying color formatting (should preserve bold + italic)...');
const colorFormat: Partial<StandardTextFormat> = { textColor: '#ff0000' };
const afterColor = richTextManager.applyFormattingToSegments(afterItalic, colorFormat, testSelection);
console.log('Result:', afterColor.map(s => ({
  text: s.text,
  fontWeight: s.fontWeight,
  fontStyle: s.fontStyle,
  textDecoration: s.textDecoration,
  fill: s.fill
})));

// Test 4: Apply underline (should preserve bold + italic + color)
console.log('\n4. Applying underline formatting (should preserve bold + italic + color)...');
const underlineFormat: Partial<StandardTextFormat> = { underline: true };
const afterUnderline = richTextManager.applyFormattingToSegments(afterColor, underlineFormat, testSelection);
console.log('Result:', afterUnderline.map(s => ({
  text: s.text,
  fontWeight: s.fontWeight,
  fontStyle: s.fontStyle,
  textDecoration: s.textDecoration,
  fill: s.fill
})));

// Validate final result
console.log('\n✅ Validation:');
const firstSegment = afterUnderline[0];
const hasAllFormats = 
  firstSegment.fontWeight === 'bold' &&
  firstSegment.fontStyle === 'italic' &&
  firstSegment.fill === '#ff0000' &&
  firstSegment.textDecoration?.includes('underline');

if (hasAllFormats) {
  console.log('✅ SUCCESS: All formatting preserved correctly!');
  console.log('   - Bold: ✓');
  console.log('   - Italic: ✓');
  console.log('   - Color: ✓');
  console.log('   - Underline: ✓');
} else {
  console.log('❌ FAILURE: Some formatting was lost');
  console.log('   - Bold:', firstSegment.fontWeight === 'bold' ? '✓' : '❌');
  console.log('   - Italic:', firstSegment.fontStyle === 'italic' ? '✓' : '❌');
  console.log('   - Color:', firstSegment.fill === '#ff0000' ? '✓' : '❌');
  console.log('   - Underline:', firstSegment.textDecoration?.includes('underline') ? '✓' : '❌');
}

// Test 5: Test with malformed inputs (fallback protection)
console.log('\n5. Testing fallback protection with malformed inputs...');
try {
  const result1 = richTextManager.applyFormattingToSegments(null as any, boldFormat, testSelection);
  console.log('   - Null segments handled:', result1.length === 0 ? '✓' : '❌');
  
  const result2 = richTextManager.applyFormattingToSegments(testSegments, null as any, testSelection);
  console.log('   - Null format handled:', result2.length === testSegments.length ? '✓' : '❌');
  
  const result3 = richTextManager.applyFormattingToSegments(testSegments, boldFormat, null as any);
  console.log('   - Null selection handled:', result3.length === testSegments.length ? '✓' : '❌');
  
  console.log('✅ Fallback protection working correctly!');
} catch (error) {
  console.log('❌ Fallback protection failed:', error);
}

export { };
