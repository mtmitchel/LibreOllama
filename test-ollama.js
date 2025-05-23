// Test script to verify Ollama connection and available models
// Run this with: node test-ollama.js

async function testOllama() {
  console.log('Testing Ollama connection...\n');
  
  // Test 1: Check if Ollama is running
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Ollama is running!');
    console.log(`\n📦 Available models (${data.models?.length || 0}):`);
    
    if (data.models && data.models.length > 0) {
      data.models.forEach((model) => {
        console.log(`  - ${model.name} (${formatBytes(model.size)})`);
      });
    } else {
      console.log('  ❌ No models found. Please pull a model first:');
      console.log('     Example: ollama pull mistral-nemo:latest');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Ollama:', error.message);
    console.log('\n💡 Make sure Ollama is running:');
    console.log('   1. Install Ollama from https://ollama.ai');
    console.log('   2. Run: ollama serve');
    console.log('   3. Pull a model: ollama pull mistral-nemo:latest');
  }
  
  // Test 2: Test a simple generation if models are available
  console.log('\n🧪 Testing model generation...');
  try {
    const testModel = 'mistral-nemo:latest'; // Change this to match your installed model
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: testModel,
        prompt: 'Say "Hello, Ollama is working!" in exactly 5 words.',
        stream: false
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    console.log(`✅ Model ${testModel} responded:`, data.response?.trim());
  } catch (error) {
    console.error('❌ Generation test failed:', error.message);
    if (error.message.includes('model') && error.message.includes('not found')) {
      console.log('\n💡 The test model is not installed. Try pulling it:');
      console.log('   ollama pull mistral-nemo:latest');
    }
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

// Run the test
testOllama();
