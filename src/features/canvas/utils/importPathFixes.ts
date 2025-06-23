// Import Path Migration Script for Canvas Consolidation
// This script contains the systematic import fixes needed to resolve the 939 TypeScript errors

// Legacy import path fixes - retained for potential future refactoring
// import fs from 'fs';
// import path from 'path';

interface ImportFix {
  file: string;
  oldImport: string;
  newImport: string;
  description: string;
}

// Define all the import fixes needed
const IMPORT_FIXES: ImportFix[] = [
  // Store imports
  {
    file: 'src/components/canvas/**/*.tsx',
    oldImport: "from '../stores/konvaCanvasStore'",
    newImport: "from '../../features/canvas/stores'",
    description: 'Update konvaCanvasStore import path'
  },
  {
    file: 'src/components/canvas/**/*.tsx',
    oldImport: "from '../../stores'",
    newImport: "from '../../features/canvas/stores'",
    description: 'Update generic stores import path'
  },
  
  // Types imports
  {
    file: 'src/components/canvas/**/*.tsx',
    oldImport: "from './types'",
    newImport: "from '../../../features/canvas/layers/types'",
    description: 'Update layer types import path'
  },
  {
    file: 'src/components/canvas/**/*.tsx',
    oldImport: "from '../components/ConnectorRenderer'",
    newImport: "from '../../../features/canvas/components/ConnectorRenderer'",
    description: 'Update ConnectorRenderer import path'
  },
  {
    file: 'src/components/canvas/**/*.tsx',
    oldImport: "from '../../types/konva.types'",
    newImport: "from '../../../features/canvas/types/konva.types'",
    description: 'Update konva types import path'
  },

  // Component imports that need to be updated to use the migrated components
  {
    file: 'src/**/*.tsx',
    oldImport: "from '@/components/canvas/ColorPicker'",
    newImport: "from '@/features/canvas/components/ColorPicker'",
    description: 'Update ColorPicker import path'
  },
  {
    file: 'src/**/*.tsx',
    oldImport: "from '@/components/canvas/ConnectorTool'",
    newImport: "from '@/features/canvas/components/ConnectorTool'",
    description: 'Update ConnectorTool import path'
  },
  {
    file: 'src/**/*.tsx',
    oldImport: "from '@/components/canvas/FloatingTextToolbar'",
    newImport: "from '@/features/canvas/components/FloatingTextToolbar'",
    description: 'Update FloatingTextToolbar import path'
  }
];

// Export the fixes for use by the actual migration process
export { IMPORT_FIXES, type ImportFix };
