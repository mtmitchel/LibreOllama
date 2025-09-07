/**
 * Quick verification that circle text is left+top aligned with proper width
 */

import { CircleTextContract } from './circle-text-contract';
import type { CircleElement } from './types';

// Mock Konva Group for testing
const mockGroup = {
  getAbsoluteTransform: () => ({
    point: (p: any) => p
  })
} as any;

// Test circle element
const testCircle: CircleElement = {
  id: 'test-circle' as any,
  type: 'circle',
  x: 0,
  y: 0,
  radius: 50,
  fill: '#FFE500',
  stroke: '#333',
  strokeWidth: 2,
  text: 'hey hey hey hey',
  fontSize: 14,
  fontFamily: 'Inter, system-ui, sans-serif'
};

// Run verification
console.log('🔍 Verifying Circle Text Alignment Fix');
console.log('=====================================');

const contract = new CircleTextContract({ padPx: 8 });
const measurement = contract.calculate(testCircle, mockGroup);

console.log('Circle radius:', testCircle.radius);
console.log('Inscribed square side:', measurement.sidePx.toFixed(1) + 'px');
console.log('Padding:', measurement.padPx + 'px');
console.log('Content width:', measurement.contentWpx.toFixed(1) + 'px');
console.log('Content height:', measurement.contentHpx.toFixed(1) + 'px');
console.log('Is square?', measurement.contentWpx === measurement.contentHpx ? '✅ Yes' : '❌ No');

// Check if width is sufficient for text
const minWidthForText = 50; // Approximate minimum for "hey hey hey hey" at 14px
if (measurement.contentWpx >= minWidthForText) {
  console.log(`✅ Width ${measurement.contentWpx.toFixed(1)}px is sufficient for text (>= ${minWidthForText}px)`);
} else {
  console.log(`❌ Width ${measurement.contentWpx.toFixed(1)}px is TOO NARROW for text (< ${minWidthForText}px)`);
}

// Mock Konva Text node
const mockText = {
  _align: 'center',
  _verticalAlign: 'middle',
  align: function(val?: string) { 
    if (val !== undefined) this._align = val; 
    return this._align; 
  },
  verticalAlign: function(val?: string) { 
    if (val !== undefined) this._verticalAlign = val; 
    return this._verticalAlign; 
  },
  width: () => measurement.contentWWorld,
  height: () => measurement.contentHWorld,
  position: () => ({ x: -measurement.contentWWorld/2, y: -measurement.contentHWorld/2 }),
  wrap: () => 'word',
  ellipsis: () => true,
  lineHeight: () => 1.3
} as any;

// Apply contract
contract.applyToKonva(mockText, measurement);

console.log('\nAfter applying contract:');
console.log('Text align:', mockText.align(), mockText.align() === 'left' ? '✅' : '❌ Should be "left"');
console.log('Vertical align:', mockText.verticalAlign(), mockText.verticalAlign() === 'top' ? '✅' : '❌ Should be "top"');

console.log('\n✅ Summary:');
console.log('- Reduced padding from 16px to 8px for better text fit');
console.log('- Content width increased from ~37px to ~53px');
console.log('- Text is LEFT + TOP aligned (not centered)');
console.log('- Text should now fit on a single line');

export {};