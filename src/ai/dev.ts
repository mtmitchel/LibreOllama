// This file is the entry point for `genkit start -- tsx src/ai/dev.ts`
// Its main purpose is to ensure the centrally configured Genkit 'ai' instance
// from '@/ai/genkit' is initialized, and then to import all flows and tools
// so they register themselves using that instance.

// Importing '@/ai/genkit' executes it and initializes the 'ai' instance.
// Flows and tools will then import this shared 'ai' instance.
import '@/ai/genkit'; // Ensures the ai object in genkit.ts is configured and available

// Flows will be imported for their side effects (i.e., calling ai.defineFlow)
import './flows/research-assistant-flow'; // Uncommented
// import './flows/ollama-chat-flow'; // Stays commented for now

// Tools are also imported for side effects (e.g., ai.defineTool or if they configure something)
import './tools/web-search-tool'; // Uncommented

console.log('[src/ai/dev.ts] Genkit development entry point loaded. researchAssistantFlow and webSearchTool imported.');
