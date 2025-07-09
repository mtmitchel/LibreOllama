#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// High-impact, low-risk cleanup items
const CLEANUP_CONFIG = {
  // Directories that can be safely deleted (already archived/consolidated)
  dirsToDelete: [
    '_archived_scripts',
    '_archived_commands'
  ],
  
  // Legacy documentation that's outdated
  legacyDocs: [
    'docs/_archive/1_CANVAS_DEVELOPER_GUIDE_LEGACY.md',
    'docs/_archive/2_PROJECT_ROADMAP_AND_ACTION_PLAN_LEGACY.md',
    'docs/_archive/CANVAS_DEVELOPMENT_ROADMAP_LEGACY.md',
    'docs/_archive/CANVAS_DEVELOPMENT_ROADMAP_REVISED.md',
    'docs/_archive/CANVAS_CLEANUP_ACTION_PLAN.md',
    'docs/_archive/REFACTOR FINAL PLAN.md',
    'docs/_archive/MIGRATION_PLAN.md',
    'docs/_archive/CANVAS_STORE_MIGRATION_PLAN_LEGACY.md',
    'docs/_archive/legacy-tasks' // entire directory
  ],

  // Files with deprecated/legacy code that can be cleaned up
  deprecatedFiles: [
    'docs/_archive/legacy-tasks/useTaskStore.ts',
    'src/tests/helpers/createUnifiedTestStore.ts' // has deprecated exports
  ],

  // Empty or near-empty index files that serve no purpose
  emptyIndexFiles: [
    'src/components/index.ts',
    'src/components/layout/index.tsx', 
    'src/components/navigation/index.tsx',
    'src/core/hooks/index.ts',
    'src/core/lib/index.ts',
    'src/features/canvas/components/ui/index.ts',
    'src/features/canvas/elements/index.ts',
    'src/features/canvas/index.ts',
    'src/features/canvas/layers/index.ts',
    'src/features/canvas/renderers/index.ts',
    'src/features/canvas/shapes/index.ts',
    'src/features/canvas/utils/index.ts',
    'src/stores/index.ts',
    'src/utils/index.ts'
  ]
};

let totalSaved = 0;
let filesProcessed = 0;
let directoriesProcessed = 0;

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += getDirSize(fullPath);
      } else {
        size += getFileSize(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function deleteDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      const size = getDirSize(dirPath);
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Deleted directory: ${dirPath} (${formatBytes(size)})`);
      totalSaved += size;
      directoriesProcessed++;
      return true;
    } else {
      console.log(`⚠️  Directory not found: ${dirPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting directory ${dirPath}:`, error.message);
    return false;
  }
}

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const size = getFileSize(filePath);
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted file: ${filePath} (${formatBytes(size)})`);
      totalSaved += size;
      filesProcessed++;
      return true;
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting file ${filePath}:`, error.message);
    return false;
  }
}

function checkIfEmpty(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8').trim();
    // Consider file empty if it's just exports, comments, or very minimal
    const lines = content.split('\n').filter(line => {
      line = line.trim();
      return line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*');
    });
    
    // If less than 3 meaningful lines, probably safe to remove
    return lines.length < 3 && !content.includes('export');
  } catch {
    return false;
  }
}

async function main() {
  console.log('🧹 Starting dead weight cleanup...\n');

  // Phase 1: Delete archived directories
  console.log('📁 Phase 1: Removing archived directories...');
  for (const dir of CLEANUP_CONFIG.dirsToDelete) {
    deleteDirectory(dir);
  }
  console.log('');

  // Phase 2: Remove legacy documentation
  console.log('📚 Phase 2: Removing legacy documentation...');
  for (const docPath of CLEANUP_CONFIG.legacyDocs) {
    if (fs.existsSync(docPath) && fs.statSync(docPath).isDirectory()) {
      deleteDirectory(docPath);
    } else {
      deleteFile(docPath);
    }
  }
  console.log('');

  // Phase 3: Clean up deprecated files
  console.log('🗑️  Phase 3: Removing deprecated files...');
  for (const filePath of CLEANUP_CONFIG.deprecatedFiles) {
    deleteFile(filePath);
  }
  console.log('');

  // Phase 4: Check and remove empty index files (with verification)
  console.log('📋 Phase 4: Checking empty index files...');
  for (const indexPath of CLEANUP_CONFIG.emptyIndexFiles) {
    if (fs.existsSync(indexPath)) {
      if (checkIfEmpty(indexPath)) {
        deleteFile(indexPath);
      } else {
        console.log(`⚠️  Skipping ${indexPath} - contains meaningful exports`);
      }
    }
  }
  console.log('');

  // Summary
  console.log('📊 Cleanup Summary:');
  console.log(`   Directories processed: ${directoriesProcessed}`);
  console.log(`   Files processed: ${filesProcessed}`);
  console.log(`   Total space saved: ${formatBytes(totalSaved)}`);
  console.log('');

  console.log('🎉 Dead weight cleanup complete!');
  console.log('');
  console.log('📋 Recommended next steps:');
  console.log('   1. Run tests to ensure no critical files were removed');
  console.log('   2. Check for any broken imports and fix them');
  console.log('   3. Update TODO comments that reference removed files');
  console.log('   4. Consider cleaning up console.log statements manually');
  console.log('   5. Remove any remaining @deprecated code');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CLEANUP_CONFIG, deleteFile, deleteDirectory }; 