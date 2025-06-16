/**
 * Test script to verify Immer MapSet plugin fix
 * This script checks that:
 * 1. The application loads without Immer MapSet errors
 * 2. Canvas store can handle Set operations without errors
 * 3. Canvas elements can be created and manipulated
 */

console.log('🧪 Testing Immer MapSet Fix...');

// Test 1: Check if the development server is running
async function testServerRunning() {
  try {
    const response = await fetch('http://127.0.0.1:1422/');
    if (response.ok) {
      console.log('✅ Development server is running successfully');
      return true;
    }
  } catch (error) {
    console.log('❌ Development server test failed:', error.message);
    return false;
  }
}

// Test 2: Check browser console for Immer errors
function testImmerErrors() {
  console.log('📋 Manual Testing Instructions:');
  console.log('1. Open browser to http://127.0.0.1:1422/');
  console.log('2. Open browser DevTools (F12)');
  console.log('3. Navigate to the Canvas page');
