# LibreOllama Troubleshooting Guide

## Common Issues and Solutions

### 1. "ollamaClient.chat is not a function" Error

**Problem**: The API route was trying to use `ollamaClient.chat()` directly, which is not the correct way to use Ollama with Genkit.

**Solution**: The API route has been updated to use Genkit's `ai.generate()` method properly. The corrected code uses:
```typescript
const result = await ai.generate({
  model: `ollama/${input.model}`,
  messages,
  config: { /* options */ }
});
```

### 2. "No active chat session" Error

**Problem**: The chat interface allowed users to send messages without selecting a chat session first.

**Solution**: The chat page now:
- Automatically selects the first available chat session when the page loads
- Creates a new chat session if none exist
- Prevents sending messages without an active session

### 3. Ollama Connection Issues

If you're getting connection errors, follow these steps:

#### Step 1: Verify Ollama is installed and running
```bash
# Check if Ollama is installed
ollama --version

# Start Ollama service
ollama serve
```

#### Step 2: Test Ollama connection
Run the test script included in the project:
```bash
node test-ollama.js
```

This will:
- Check if Ollama is running
- List available models
- Test a simple generation

#### Step 3: Pull required models
The application uses these models by default:
```bash
# Pull the default model
ollama pull mistral-nemo:latest

# Optional: Pull other supported models
ollama pull llama3.2:latest
ollama pull codellama:latest
ollama pull gemma2:latest
```

### 4. Model Compatibility

Make sure the models in your Ollama installation match those defined in `src/ai/types.ts`:
- mistral-nemo:latest
- llama3.2:latest
- llama3.1:latest
- codellama:latest
- gemma2:latest
- qwen2.5:latest
- phi3:latest
- deepseek-coder:latest

### 5. Development Server Issues

If you're having issues with the development server:

1. Clear Next.js cache:
```bash
rm -rf .next
```

2. Restart the development server:
```bash
npm run dev
```

Or use the provided restart scripts:
```bash
# Windows
./restart-dev.bat

# PowerShell
./restart-dev.ps1
```

## Quick Debugging Checklist

- [ ] Ollama is installed (`ollama --version`)
- [ ] Ollama service is running (`ollama serve`)
- [ ] At least one model is pulled (`ollama list`)
- [ ] The model names match those in `src/ai/types.ts`
- [ ] Development server is running on the correct port (9004)
- [ ] No errors in browser console
- [ ] No errors in terminal/server logs

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Check the terminal running `npm run dev` for server-side errors
3. Verify your `.env.local` file exists (though it's not required for basic Ollama functionality)
4. Ensure you're using a compatible Node.js version (16.x or higher)
