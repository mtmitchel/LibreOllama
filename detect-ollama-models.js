// Script to detect Ollama models and generate configuration
// Run with: node detect-ollama-models.js

async function detectOllamaModels() {
  console.log('🔍 Detecting Ollama models...\n');
  
  try {
    // Fetch available models from Ollama
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    if (models.length === 0) {
      console.log('❌ No models found. Please pull some models first.');
      return;
    }
    
    console.log(`✅ Found ${models.length} models:\n`);
    
    // Generate VALID_MODELS array
    console.log('// Add this to src/ai/types.ts:');
    console.log('export const VALID_MODELS = [');
    models.forEach(model => {
      console.log(`  '${model.name}',`);
    });
    console.log('] as const;\n');
    
    // Generate model registration for genkit.ts
    console.log('// Add this to src/ai/genkit.ts in the ollama plugin:');
    console.log('models: [');
    models.forEach(model => {
      // Determine type based on model name
      const type = model.name.includes('embed') ? 'generate' : 'chat';
      console.log(`  { name: '${model.name}', type: '${type}' as const },`);
    });
    console.log(']\n');
    
    // Generate MODEL_INFO entries
    console.log('// Add this to MODEL_INFO in src/ai/types.ts:');
    models.forEach(model => {
      const displayName = formatDisplayName(model.name);
      const size = formatBytes(model.size);
      const capabilities = inferCapabilities(model.name);
      
      console.log(`  '${model.name}': {`);
      console.log(`    name: '${model.name}',`);
      console.log(`    displayName: '${displayName}',`);
      console.log(`    description: 'Auto-detected model',`);
      console.log(`    size: '${size}',`);
      console.log(`    capabilities: [${capabilities.map(c => `'${c}'`).join(', ')}],`);
      console.log(`  },`);
    });
    
  } catch (error) {
    console.error('❌ Failed to detect models:', error.message);
    console.log('\n💡 Make sure Ollama is running: ollama serve');
  }
}

function formatDisplayName(modelName) {
  // Remove version tags and format nicely
  let name = modelName.replace(/:latest$/, '').replace(/:[\w.-]+$/, '');
  
  // Split by common delimiters and capitalize
  name = name.split(/[-_]/).map(part => {
    // Handle special cases
    if (part.toLowerCase() === 'llama') return 'Llama';
    if (part.toLowerCase() === 'mistral') return 'Mistral';
    if (part.toLowerCase() === 'qwen') return 'Qwen';
    if (part.toLowerCase() === 'gemma') return 'Gemma';
    if (part.toLowerCase() === 'granite') return 'Granite';
    if (part.toLowerCase() === 'phi') return 'Phi';
    if (part.toLowerCase() === 'cogito') return 'Cogito';
    
    // Handle version numbers
    if (/^\d/.test(part)) return part.toUpperCase();
    
    // Default: capitalize first letter
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(' ');
  
  // Add version info if present
  const versionMatch = modelName.match(/:(.+)$/);
  if (versionMatch && versionMatch[1] !== 'latest') {
    name += ` (${versionMatch[1]})`;
  }
  
  return name;
}

function inferCapabilities(modelName) {
  const capabilities = ['chat']; // Default capability
  
  const nameLower = modelName.toLowerCase();
  
  // Infer based on model name patterns
  if (nameLower.includes('code') || nameLower.includes('coder')) {
    capabilities.push('code', 'programming', 'debugging');
  }
  if (nameLower.includes('instruct')) {
    capabilities.push('instructions', 'reasoning');
  }
  if (nameLower.includes('tool')) {
    capabilities.push('tools', 'functions');
  }
  if (nameLower.includes('embed')) {
    return ['embeddings']; // Replace default
  }
  if (nameLower.includes('vision') || nameLower.includes('vl')) {
    capabilities.push('vision', 'image-analysis');
  }
  if (nameLower.includes('qwen') || nameLower.includes('yi')) {
    capabilities.push('multilingual');
  }
  if (nameLower.includes('cogito') || nameLower.includes('reason')) {
    capabilities.push('reasoning', 'analysis');
  }
  
  // Add general capabilities for larger models
  if (nameLower.includes('7b') || nameLower.includes('8b') || 
      nameLower.includes('13b') || nameLower.includes('70b')) {
    if (!capabilities.includes('reasoning')) capabilities.push('reasoning');
    if (!capabilities.includes('analysis')) capabilities.push('analysis');
  }
  
  return capabilities;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

// Run the detection
detectOllamaModels();
