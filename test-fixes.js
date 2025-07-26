// Simple test to verify task system fixes
console.log('🧪 Testing Task System Fixes...');

// Test 1: Check if the sync service changes are applied
const fs = require('fs');
const path = require('path');

const syncFile = path.join(__dirname, 'src', 'services', 'kanbanGoogleTasksSync.ts');
const backendFile = path.join(__dirname, 'src-tauri', 'src', 'commands', 'tasks', 'api.rs');

console.log('\n1. Checking sync service fixes...');
if (fs.existsSync(syncFile)) {
  const syncContent = fs.readFileSync(syncFile, 'utf8');
  
  // Check for the key fixes
  const hasLessAggressiveClearing = syncContent.includes('shouldClearData = allowClear && kanbanStore.columns.length === 0');
  const hasProperMethodName = syncContent.includes('await kanbanStore.deleteTask(column.id, taskToRemove.id)');
  const hasSyncProtection = syncContent.includes('if (this.isSyncing) {');
  
  console.log('✅ Less aggressive data clearing:', hasLessAggressiveClearing);
  console.log('✅ Proper method name (deleteTask):', hasProperMethodName);
  console.log('✅ Sync protection added:', hasSyncProtection);
} else {
  console.log('❌ Sync file not found');
}

console.log('\n2. Checking backend fixes...');
if (fs.existsSync(backendFile)) {
  const backendContent = fs.readFileSync(backendFile, 'utf8');
  
  // Check for metadata preservation fix
  const hasMetadataPreservation = backendContent.includes('Preserve existing metadata when none is provided');
  const hasMetadataQuery = backendContent.includes('SELECT priority, labels FROM task_metadata WHERE google_task_id = ?');
  
  console.log('✅ Metadata preservation logic:', hasMetadataPreservation);
  console.log('✅ Metadata query added:', hasMetadataQuery);
} else {
  console.log('❌ Backend file not found');
}

console.log('\n3. Checking debug utilities...');
const debugFile = path.join(__dirname, 'src', 'utils', 'debugState.ts');
const testFile = path.join(__dirname, 'src', 'utils', 'taskSystemTest.ts');

if (fs.existsSync(debugFile)) {
  console.log('✅ Debug state utility exists');
} else {
  console.log('❌ Debug state utility missing');
}

if (fs.existsSync(testFile)) {
  console.log('✅ Task system test utility exists');
} else {
  console.log('❌ Task system test utility missing');
}

console.log('\n🎉 Fix verification complete!');
console.log('\nTo test the actual functionality:');
console.log('1. Open the app in browser');
console.log('2. Go to Tasks page');
console.log('3. Open browser console');
console.log('4. Run: debugTaskState()');
console.log('5. Run: runTaskSystemTest()'); 