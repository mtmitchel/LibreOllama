const fs = require('fs');
const glob = require('glob');

console.log('Fixing final import path issues...');

// Fix absolute path imports that should be relative
const finalFixes = [
  // KonvaDebugPanel - wrong path depth
  {
    from: "from '../features/canvas/stores/konvaCanvasStore'",
    to: "from '../../features/canvas/stores/konvaCanvasStore'",
    files: ['src/components/canvas/KonvaDebugPanel.tsx']
  },
  
  // Layer components - wrong path to types
  {
    from: "from '../../features/canvas/layers/types'",
    to: "from '../../../features/canvas/layers/types'",
    files: glob.sync('src/components/canvas/layers/*.tsx')
  },
  
  // RichTextRenderer store import
  {
    from: "from '../features/canvas/stores/konvaCanvasStore'",
    to: "from '../../features/canvas/stores/konvaCanvasStore'",
    files: ['src/components/canvas/RichTextRenderer.tsx']
  },
  
  // konva.types import
  {
    from: "from '../../types/konva.types'",
    to: "from '../../../types/konva.types'",
    files: glob.sync('src/components/canvas/layers/*.tsx')
  },
  
  // Fix utils/events import in MainLayer
  {
    from: "from '../utils/events'",
    to: "from '../../../features/canvas/utils/events'",
    files: ['src/components/canvas/layers/MainLayer.tsx']
  },
  
  // Fix ConnectorRenderer import
  {
    from: "from '../components/ConnectorRenderer'",
    to: "from '../../../features/canvas/components/ConnectorRenderer'",
    files: ['src/components/canvas/layers/ConnectorLayer.tsx']
  },
  
  // Fix rich text types in RichTextSystem
  {
    from: "from '../../types/richText'",
    to: "from '../../../types/richText'",
    files: glob.sync('src/components/canvas/RichTextSystem/*.tsx')
  },
  
  {
    from: "from '../../types/richText'",
    to: "from '../../../types/richText'",
    files: glob.sync('src/components/canvas/RichTextSystem/*.ts')
  }
];

let totalFixed = 0;

finalFixes.forEach(fix => {
  fix.files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const newContent = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log(`✅ Fixed ${filePath}`);
        totalFixed++;
      }
    }
  });
});

console.log(`\nFixed ${totalFixed} files.`);

// Special case: Check if konva.types exists
const konvaTypesPath = 'src/types/konva.types.ts';
if (!fs.existsSync(konvaTypesPath)) {
  console.log('\n⚠️  Creating missing konva.types.ts file...');
  const konvaTypesContent = `// src/types/konva.types.ts
export interface KonvaNode {
  id(): string;
  name(): string;
  visible(): boolean;
  listening(): boolean;
  x(): number;
  y(): number;
  width(): number;
  height(): number;
  absolutePosition(): { x: number; y: number };
  getClientRect(): { x: number; y: number; width: number; height: number };
}

export interface KonvaEventObject<T = Event> {
  type: string;
  target: KonvaNode;
  currentTarget: KonvaNode;
  evt: T;
  pointerId?: number;
}
`;
  fs.writeFileSync(konvaTypesPath, konvaTypesContent);
  console.log('✅ Created src/types/konva.types.ts');
}

console.log('\nFinal import fixes completed!');
