const fs = require('fs');
const path = require('path');

const fixes = [
  // Canvas layer types fixes
  {
    pattern: /import { ([^}]+) } from '\.\/types'/g,
    replacement: "import { $1 } from './types'",
    files: ['src/features/canvas/layers/*.tsx']
  },
  
  // Canvas shapes types fixes - need to import from layers
  {
    pattern: /import { ([^}]+) } from '\.\/types'/g,
    replacement: "import { $1 } from '../layers/types'",
    files: ['src/features/canvas/shapes/*.tsx']
  },
  
  // Canvas components types fixes
  {
    pattern: /import { ([^}]+) } from '\.\/types'/g,
    replacement: "import { $1 } from '../layers/types'",
    files: ['src/features/canvas/components/*.tsx']
  },
  
  // Store imports - old paths to new paths
  {
    pattern: /import { ([^}]+) } from ['"]\.\.\/stores\/konvaCanvasStore['"]/g,
    replacement: "import { $1 } from '../stores/konvaCanvasStore'",
    files: ['src/components/canvas/*.tsx']
  },
  
  {
    pattern: /import { ([^}]+) } from ['"]\.\.\/\.\.\/stores\/konvaCanvasStore['"]/g,
    replacement: "import { $1 } from '../../features/canvas/stores/konvaCanvasStore'",
    files: ['src/components/**/*.tsx']
  },
  
  // Rich text types
  {
    pattern: /import { ([^}]+) } from ['"]\.\.\/\.\.\/types\/richText['"]/g,
    replacement: "import { $1 } from '../../types/richText'",
    files: ['src/features/canvas/**/*.tsx', 'src/features/canvas/**/*.ts']
  },
  
  // Design system imports
  {
    pattern: /import { ([^}]+) } from ['"]\.\.\/\.\.\/styles\/designSystem['"]/g,
    replacement: "import { $1 } from '../../../styles/designSystem'",
    files: ['src/features/canvas/**/*.tsx']
  },
  
  // Canvas utils imports
  {
    pattern: /import { ([^}]+) } from ['"]\.\.\/utils\/canvas\/([^'"]+)['"]/g,
    replacement: "import { $1 } from '../utils/canvas/$2'",
    files: ['src/components/canvas/*.tsx']
  },
  
  // Performance imports
  {
    pattern: /import { ([^}]+) } from ['"]\.\.\/\.\.\/features\/canvas\/hooks\/canvas\/useCanvasPerformance['"]/g,
    replacement: "import { $1 } from '../../features/canvas/hooks/canvas/useCanvasPerformance'",
    files: ['src/components/**/*.tsx']
  }
];

// Function to recursively get all files matching patterns
function getFiles(pattern) {
  const glob = require('glob');
  return glob.sync(pattern, { cwd: process.cwd() });
}

// Function to apply fixes to a file
function fixFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  fixes.forEach(fix => {
    const newContent = content.replace(fix.pattern, fix.replacement);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${filePath}`);
  }
}

// Apply fixes
console.log('Starting import path fixes...');

// Get all TypeScript and TSX files that might need fixing
const filesToFix = [
  ...getFiles('src/features/canvas/**/*.tsx'),
  ...getFiles('src/features/canvas/**/*.ts'),
  ...getFiles('src/components/canvas/**/*.tsx'),
  ...getFiles('src/components/canvas/**/*.ts'),
  ...getFiles('src/components/Toolbar/**/*.tsx'),
  ...getFiles('src/models/*.ts'),
  ...getFiles('src/lib/*.ts'),
  ...getFiles('src/tests/**/*.ts')
];

filesToFix.forEach(fixFile);

console.log('Import path fixes completed!');
