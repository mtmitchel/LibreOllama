import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ollama } from 'genkitx-ollama';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs'; // Import fs for checking file existence

const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`[src/ai/genkit.ts] Attempting to load .env file from: ${envPath}`);

if (fs.existsSync(envPath)) {
  console.log(`[src/ai/genkit.ts] .env.local file found at: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.error(`[src/ai/genkit.ts] CRITICAL: .env.local file NOT FOUND at: ${envPath}`);
  // This will likely cause issues if API keys are expected from .env.local
}

// Diagnostic: Check if the API keys are loaded
console.log('[src/ai/genkit.ts] GOOGLE_API_KEY (after dotenv):', process.env.GOOGLE_API_KEY);
console.log('[src/ai/genkit.ts] GEMINI_API_KEY (after dotenv):', process.env.GEMINI_API_KEY);
console.log('[src/ai/genkit.ts] BRAVE_SEARCH_API_KEY (after dotenv):', process.env.BRAVE_SEARCH_API_KEY);

// Create plugins array
const plugins: any[] = [];

// Add Ollama plugin with all available models
plugins.push(
  ollama({
    models: [
      // Your installed models
      { name: 'mistral-nemo:latest', type: 'chat' as const },
      { name: 'granite3.2:2b-instruct-q8_0', type: 'chat' as const },
      { name: 'granite3.2:8b-instruct-q4_K_M', type: 'chat' as const },
      { name: 'qwen3:4b', type: 'chat' as const },
      { name: 'cogito:8b', type: 'chat' as const },
      { name: 'llama3.2:3b', type: 'chat' as const },
      { name: 'llama3-groq-tool-use:8b', type: 'chat' as const },
      { name: 'granite3.3:latest', type: 'chat' as const },
      { name: 'phi4-mini:latest', type: 'chat' as const },
      { name: 'qwen3:8b', type: 'chat' as const },
      { name: 'qwen3:latest', type: 'chat' as const },
      { name: 'mistral:7b', type: 'chat' as const },
      { name: 'gemma3:latest', type: 'chat' as const },
      { name: 'gemma3:4b', type: 'chat' as const },
      // Original models kept for compatibility
      { name: 'llama3.2:latest', type: 'chat' as const },
      { name: 'llama3.1:latest', type: 'chat' as const },
      { name: 'codellama:latest', type: 'chat' as const },
      { name: 'gemma2:latest', type: 'chat' as const },
      { name: 'qwen2.5:latest', type: 'chat' as const },
      { name: 'phi3:latest', type: 'chat' as const },
      { name: 'deepseek-coder:latest', type: 'chat' as const },
    ],
    serverAddress: 'http://127.0.0.1:11434',
  })
);

// Conditionally add Google AI plugin
const geminiApiKey = process.env.GEMINI_API_KEY;
// Check if key is valid (exists and doesn't contain "http")
if (geminiApiKey && typeof geminiApiKey === 'string' && geminiApiKey.indexOf('http') === -1) {
  console.log('[src/ai/genkit.ts] Initializing Google AI plugin with valid GEMINI_API_KEY.');
  plugins.push(googleAI({ apiKey: geminiApiKey }));
} else {
  console.warn('[src/ai/genkit.ts] GEMINI_API_KEY appears malformed or is missing. Google AI plugin will NOT be initialized.');
}

// Initialize Genkit
export const ai = genkit({
  plugins: plugins,
});

// Optional: If you want to set a default model for all ai.generate calls unless overridden
// configure({ defaultModel: 'googleai/gemini-1.5-flash-latest' });
