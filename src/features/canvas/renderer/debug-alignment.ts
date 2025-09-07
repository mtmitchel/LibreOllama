/**
 * Debug helper for verifying text alignment
 */

export function debugTextAlignment(textNode: any, elementType: string) {
  if (!(window as any).__CANVAS_TEXT_DEBUG__) return;
  
  console.group(`🔍 Text Alignment Debug - ${elementType}`);
  console.log('Text align:', textNode.align());
  console.log('Vertical align:', textNode.verticalAlign());
  console.log('Position:', { x: textNode.x(), y: textNode.y() });
  console.log('Size:', { width: textNode.width(), height: textNode.height() });
  console.log('Text content:', textNode.text().substring(0, 50) + '...');
  
  // Visual verification
  const expectedAlign = elementType === 'circle' ? 'left' : 'varies';
  const expectedVAlign = elementType === 'circle' ? 'top' : 'varies';
  
  if (elementType === 'circle') {
    if (textNode.align() !== 'left' || textNode.verticalAlign() !== 'top') {
      console.error('❌ ALIGNMENT ERROR: Circle text should be LEFT+TOP aligned!');
      console.error(`   Got: align='${textNode.align()}', verticalAlign='${textNode.verticalAlign()}'`);
      console.error(`   Expected: align='left', verticalAlign='top'`);
    } else {
      console.log('✅ Alignment correct: LEFT+TOP');
    }
  }
  
  console.groupEnd();
}

export function enableDebugMode() {
  (window as any).__CANVAS_TEXT_DEBUG__ = true;
  console.log('🔍 Canvas Text Debug Mode ENABLED');
  console.log('Circle text should be LEFT+TOP aligned in inscribed square');
}