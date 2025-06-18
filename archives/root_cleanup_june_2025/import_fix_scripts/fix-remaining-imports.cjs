const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('Applying targeted fixes for remaining import issues...');

// Define the fixes with exact file patterns and replacements
const fixes = [
  // Fix design system imports in components/canvas/ - they should be ../../styles/designSystem
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/styles\/designSystem['"]/g,
    replacement: "from '../../styles/designSystem'",
    description: "Fix design system imports in canvas components",
    files: glob.sync('src/components/canvas/**/*.tsx')
  },
  
  // Fix canvas layers trying to import from ../layers/types (should be ../../features/canvas/layers/types)
  {
    pattern: /from ['"]\.\.\/layers\/types['"]/g,
    replacement: "from '../../features/canvas/layers/types'",
    description: "Fix canvas layer types imports",
    files: glob.sync('src/components/canvas/layers/*.tsx')
  },
  
  // Fix old store paths in components
  {
    pattern: /from ['"]\.\.\/stores\/konvaCanvasStore['"]/g,
    replacement: "from '../features/canvas/stores/konvaCanvasStore'",
    description: "Fix store imports in components",
    files: glob.sync('src/components/**/*.tsx')
  },
  
  // Fix rich text imports - many should be from src/types/richText
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/types\/richText['"]/g,
    replacement: "from '../../../types/richText'",
    description: "Fix rich text type imports",
    files: glob.sync('src/components/**/*.tsx')
  },
  
  // Fix utils imports in components/canvas
  {
    pattern: /from ['"]\.\.\/utils\/canvas\/([^'"]+)['"]/g,
    replacement: "from '../features/canvas/utils/canvas/$1'",
    description: "Fix canvas utils imports",
    files: glob.sync('src/components/canvas/**/*.tsx')
  },
  
  // Fix performance import paths
  {
    pattern: /from ['"]\.\.\/\.\.\/features\/canvas\/hooks\/canvas\/useCanvasPerformance['"]/g,
    replacement: "from '../../features/canvas/hooks/canvas/useCanvasPerformance'",
    description: "Fix performance hooks imports",
    files: glob.sync('src/components/**/*.tsx')
  },
  
  // Fix missing KonvaCanvas import
  {
    pattern: /from ['"]\.\/KonvaCanvas['"]/g,
    replacement: "from '../../features/canvas/components/KonvaCanvas'",
    description: "Fix KonvaCanvas import",
    files: ['src/components/canvas/KonvaApp.tsx']
  },
  
  // Fix missing types imports in shapes
  {
    pattern: /from ['"]\.\.\/\.\.\/hooks\/canvas\/useShapeCaching['"]/g,
    replacement: "from '../../features/canvas/hooks/canvas/useShapeCaching'",
    description: "Fix shape caching hook imports",
    files: glob.sync('src/components/canvas/shapes/*.tsx')
  }
];

// Function to apply fixes to a file
function fixFile(filePath, fix) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  content = content.replace(fix.pattern, fix.replacement);
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${filePath} - ${fix.description}`);
    return true;
  }
  return false;
}

// Apply all fixes
let totalFixes = 0;
fixes.forEach(fix => {
  console.log(`\nApplying: ${fix.description}`);
  fix.files.forEach(filePath => {
    if (fixFile(filePath, fix)) {
      totalFixes++;
    }
  });
});

console.log(`\nCompleted! Applied ${totalFixes} fixes.`);

// Special fixes for specific files
console.log('\nApplying special fixes...');

// Fix the KonvaCanvas import specifically
const konvaAppPath = 'src/components/canvas/KonvaApp.tsx';
if (fs.existsSync(konvaAppPath)) {
  let content = fs.readFileSync(konvaAppPath, 'utf8');
  content = content.replace(
    "import KonvaCanvas from './KonvaCanvas';",
    "import KonvaCanvas from '../../features/canvas/components/KonvaCanvas';"
  );
  fs.writeFileSync(konvaAppPath, content);
  console.log('✅ Fixed KonvaCanvas import in KonvaApp.tsx');
}

// Fix KonvaDebugPanel store import
const debugPanelPath = 'src/components/canvas/KonvaDebugPanel.tsx';
if (fs.existsSync(debugPanelPath)) {
  let content = fs.readFileSync(debugPanelPath, 'utf8');
  content = content.replace(
    "import { useKonvaCanvasStore } from '../stores/konvaCanvasStore';",
    "import { useKonvaCanvasStore } from '../../features/canvas/stores/konvaCanvasStore';"
  );
  fs.writeFileSync(debugPanelPath, content);
  console.log('✅ Fixed store import in KonvaDebugPanel.tsx');
}

// Fix Toolbar imports
const toolbarPath = 'src/components/Toolbar/KonvaToolbar.tsx';
if (fs.existsSync(toolbarPath)) {
  let content = fs.readFileSync(toolbarPath, 'utf8');
  content = content.replace(
    "import { useKonvaCanvasStore } from '../stores/konvaCanvasStore';",
    "import { useKonvaCanvasStore } from '../../features/canvas/stores/konvaCanvasStore';"
  );
  content = content.replace(
    "import ColorPicker from '../../components/Toolbar/ColorPicker';",
    "import ColorPicker from './ColorPicker';"
  );
  fs.writeFileSync(toolbarPath, content);
  console.log('✅ Fixed imports in KonvaToolbar.tsx');
}

// Fix ShapesDropdown
const shapesDropdownPath = 'src/components/Toolbar/ShapesDropdown.tsx';
if (fs.existsSync(shapesDropdownPath)) {
  let content = fs.readFileSync(shapesDropdownPath, 'utf8');
  content = content.replace(
    "import { useKonvaCanvasStore } from '../stores/konvaCanvasStore';",
    "import { useKonvaCanvasStore } from '../../features/canvas/stores/konvaCanvasStore';"
  );
  fs.writeFileSync(shapesDropdownPath, content);
  console.log('✅ Fixed store import in ShapesDropdown.tsx');
}

console.log('\nAll targeted fixes completed!');
