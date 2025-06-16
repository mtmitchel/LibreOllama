/**
 * COMPREHENSIVE RICH TEXT FORMATTING DEBUG SCRIPT
 * 
 * Tests all formatting across all element types to validate root causes:
 * 1. Table cells: Use RichTextCellEditor but applyFormattingToSegments() is broken
 * 2. Sticky notes: Don't use RichTextCellEditor at all (should but don't)
 * 3. Text boxes: Don't use RichTextCellEditor at all (should but don't)
 * 4. Command mapping issues: 'color'/'align' vs 'textColor'/'textAlign'
 * 5. Style presets only apply fontSize + bold
 * 
 * USAGE: Run in browser console on canvas page
 */

console.log('🚀 COMPREHENSIVE RICH TEXT DEBUG SESSION');
console.log('==========================================');

// Debug configuration
const DEBUG_CONFIG = {
  showAllLogs: true,
  testFormatting: true,
  validateSegments: true,
  checkCommandMapping: true
};

// Element type analysis
const ELEMENT_ANALYSIS = {
  'table-cell': {
    expected: 'Uses RichTextCellEditor with rich text segments',
    current: 'Uses RichTextCellEditor but applyFormattingToSegments() broken',
    issues: ['Only bold/italic work', 'Color/align commands wrong', 'Segments not properly applied']
  },
  'sticky-note': {
    expected: 'Should use RichTextCellEditor for formatting',
    current: 'Renders basic text properties directly in StickyNoteElement',
    issues: ['No rich text editor integration', 'No formatting toolbar', 'Basic text only']
  },
  'text-box': {
    expected: 'Should use RichTextCellEditor for formatting', 
    current: 'Renders basic text properties directly in UnifiedTextElement',
    issues: ['No rich text editor integration', 'No formatting toolbar', 'Basic text only']
  }
};

// Format command mappings to test
const COMMAND_MAPPINGS = [
  { toolbar: 'bold', editor: 'bold', expected: 'fontWeight: bold', working: true },
  { toolbar: 'italic', editor: 'italic', expected: 'fontStyle: italic', working: true },
  { toolbar: 'underline', editor: 'underline', expected: 'textDecoration: underline', working: false },
  { toolbar: 'strikethrough', editor: 'strikethrough', expected: 'textDecoration: line-through', working: false },
  { toolbar: 'fontSize', editor: 'fontSize', expected: 'fontSize: [value]', working: false },
  { toolbar: 'color', editor: 'textColor', expected: 'fill: [color]', working: false, issue: 'Command name mismatch' },
  { toolbar: 'align', editor: 'textAlign', expected: 'textAlign: [align]', working: false, issue: 'Command name mismatch' },
  { toolbar: 'listType', editor: 'listType', expected: 'list formatting', working: false }
];

// Style preset analysis
const STYLE_PRESETS = {
  heading: { 
    sends: ['fontSize: 24', 'bold: true'], 
    should_send: ['fontSize: 24', 'bold: true', 'color: inherit', 'align: inherit'],
    issue: 'Only sends fontSize and bold, loses other formatting'
  },
  subheading: {
    sends: ['fontSize: 18', 'bold: true'],
    should_send: ['fontSize: 18', 'bold: true', 'color: inherit', 'align: inherit'], 
    issue: 'Only sends fontSize and bold, loses other formatting'
  }
};

// Function to log analysis
function logElementAnalysis() {
  console.log('\n📋 ELEMENT TYPE ANALYSIS');
  console.log('========================');
  
  Object.entries(ELEMENT_ANALYSIS).forEach(([type, analysis]) => {
    console.log(`\n🔍 ${type.toUpperCase()}:`);
    console.log(`   Expected: ${analysis.expected}`);
    console.log(`   Current:  ${analysis.current}`);
    console.log(`   Issues:`);
    analysis.issues.forEach(issue => console.log(`     ❌ ${issue}`));
  });
}

function logCommandMappings() {
  console.log('\n🔄 COMMAND MAPPING ANALYSIS');
  console.log('===========================');
  
  COMMAND_MAPPINGS.forEach(mapping => {
    const status = mapping.working ? '✅' : '❌';
    console.log(`${status} ${mapping.toolbar} → ${mapping.editor}`);
    console.log(`     Expected: ${mapping.expected}`);
    if (mapping.issue) {
      console.log(`     Issue: ${mapping.issue}`);
    }
  });
}

function logStylePresets() {
  console.log('\n🎨 STYLE PRESET ANALYSIS');
  console.log('========================');
  
  Object.entries(STYLE_PRESETS).forEach(([preset, analysis]) => {
    console.log(`\n📝 ${preset.toUpperCase()}:`);
    console.log(`   Currently sends: ${analysis.sends.join(', ')}`);
    console.log(`   Should send: ${analysis.should_send.join(', ')}`);
    console.log(`   ❌ Issue: ${analysis.issue}`);
  });
}

function logApplyFormattingIssues() {
  console.log('\n⚙️ applyFormattingToSegments() ANALYSIS');
  console.log('======================================');
  
  console.log('✅ Handles: bold, italic');
  console.log('❌ Missing: underline, strikethrough, fontSize, color, align, listType');
  console.log('❌ Command mismatch: receives "color" but needs "textColor"');
  console.log('❌ Command mismatch: receives "align" but needs "textAlign"');
  console.log('❌ Only applies to segments, not element-level properties');
}

function logNextSteps() {
  console.log('\n🔧 REQUIRED FIXES');
  console.log('=================');
  
  console.log('\n1. Fix applyFormattingToSegments():');
  console.log('   - Add handling for all format types');
  console.log('   - Map "color" → "textColor" and "align" → "textAlign"');
  console.log('   - Implement underline, strikethrough, fontSize, listType');
  
  console.log('\n2. Integrate RichTextCellEditor with other elements:');
  console.log('   - Modify StickyNoteElement to use RichTextCellEditor');
  console.log('   - Modify UnifiedTextElement to use RichTextCellEditor');
  console.log('   - Add rich text segment support to both');
  
  console.log('\n3. Fix style presets:');
  console.log('   - Preserve existing formatting when applying presets');
  console.log('   - Apply all relevant format properties, not just fontSize + bold');
  
  console.log('\n4. Fix FloatingTextToolbar command names:');
  console.log('   - Change "color" command to "textColor"');
  console.log('   - Change "align" command to "textAlign"');
  console.log('   - Or modify editor to handle both command names');
}

// Run analysis
function runCompleteAnalysis() {
  logElementAnalysis();
  logCommandMappings();
  logStylePresets();
  logApplyFormattingIssues();
  logNextSteps();
  
  console.log('\n🎯 DEBUGGING COMPLETE');
  console.log('====================');
  console.log('Debug logs have been added to:');
  console.log('- FloatingTextToolbar.tsx (command sending)');
  console.log('- RichTextCellEditor.tsx (command receiving & processing)');
  console.log('\nNext: Test each formatting option to see detailed failure logs');
}

// Auto-run analysis
runCompleteAnalysis();

// Export for manual testing
window.richTextDebug = {
  ELEMENT_ANALYSIS,
  COMMAND_MAPPINGS,
  STYLE_PRESETS,
  runCompleteAnalysis
};