# LibreOllama Quick Fix Guide

## Issues Fixed

### 1. ✅ Fixed "ollamaClient.chat is not a function"
- Updated `/src/app/api/ollama/chat/route.ts` to use Genkit's `ai.generate()` method properly
- The API now correctly interfaces with Ollama through Genkit

### 2. ✅ Fixed "No active chat session"  
- Updated `/src/app/chat/page.tsx` to automatically:
  - Select the first available chat session on load
  - Create a new session if none exist
  - Prevent sending messages without an active session

### 3. ✅ Synchronized Model Names
- Updated `/src/ai/genkit.ts` to match model names in `types.ts`
- Fixed model compatibility checking in `/src/ai/model-compatibility.ts`

## Quick Start

### 1. Ensure Ollama is Running
```bash
# Check if Ollama is installed
ollama --version

# Start Ollama (in a separate terminal)
ollama serve

# Pull at least one model
ollama pull mistral-nemo:latest
```

### 2. Test Ollama Connection
```bash
# Run the Ollama test script
node test-ollama.js
```

### 3. Start the Development Server
```bash
# Clean install (optional but recommended)
npm install

# Start the dev server
npm run dev
```

The server will start on http://localhost:9004

### 4. Test the Chat Feature
1. Navigate to http://localhost:9004/chat
2. A chat session should be automatically created or selected
3. Try sending a message!

### 5. (Optional) Test the API Directly
```bash
# Make sure the dev server is running first!
node test-chat-api.js
```

## Troubleshooting

If you still see errors:

1. **Clear browser cache**: Ctrl+F5 or Cmd+Shift+R
2. **Clear Next.js cache**: `rm -rf .next && npm run dev`
3. **Check console logs**: Both browser console and terminal for detailed errors
4. **Verify model names**: Run `ollama list` and ensure you have models that match those in the dropdown

## Available Models

The following models are configured in the app:
- mistral-nemo:latest (recommended for general chat)
- llama3.2:latest
- llama3.1:latest
- codellama:latest (for coding tasks)
- gemma2:latest
- qwen2.5:latest
- phi3:latest
- deepseek-coder:latest (for advanced coding)

Pull any of these with: `ollama pull [model-name]`

## Need More Help?

Check the detailed `TROUBLESHOOTING.md` file for more comprehensive debugging steps.
