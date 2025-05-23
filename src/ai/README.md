
# AI Backend (`src/ai/`)

This directory contains all the backend logic related to Artificial Intelligence features, primarily powered by [Genkit](https://firebase.google.com/docs/genkit).

## Overview

The AI backend is responsible for:
- Defining AI flows (sequences of operations, often involving LLM calls).
- Creating tools that AI models can use to interact with external systems or perform specific tasks.
- Configuring the AI models and plugins used by Genkit.

This part of the application is designed to be used by Next.js Server Actions or API routes to provide AI capabilities to the frontend.

## Key Technologies

- **[Genkit](https://firebase.google.com/docs/genkit)**: An open-source framework from Google for building AI-powered applications. It simplifies orchestrating calls to language models, managing prompts, defining tools, and deploying AI features.
- **[Google AI (Gemini Models)](https://ai.google.dev/)**: Used as the primary provider for Large Language Models (LLMs) via the `@genkit-ai/googleai` plugin.
- **[Zod](https://zod.dev/)**: Used for defining and validating input and output schemas for AI flows and tools, ensuring type safety and clear data contracts.

## Directory Structure

```
src/ai/
├── flows/                # Contains all Genkit flow definitions
│   └── research-assistant-flow.ts
├── tools/                # Contains all Genkit tool definitions
│   └── web-search-tool.ts
├── genkit.ts             # Genkit global configuration (plugins, models)
├── dev.ts                # Entry point for Genkit development server (imports flows/tools)
└── README.md             # This file
```

- **`flows/`**: Each file in this directory typically defines a single, self-contained AI flow. Flows orchestrate calls to models, tools, and other logic.
- **`tools/`**: Each file here usually defines a specific tool that can be used by Genkit flows (and thus by the LLMs).
- **`genkit.ts`**: This file initializes and configures the global Genkit instance, including plugins (like `googleAI`) and default model settings.
- **`dev.ts`**: This file is used by the Genkit development server (`genkit start`). It imports all the defined flows and tools so that Genkit can discover them and make them available in its developer UI.

## Genkit Flows

Flows are the core building blocks for AI logic.

### Defining a Flow
Flows are defined using `ai.defineFlow()` from the global `ai` object (initialized in `genkit.ts`).

- **Example (`src/ai/flows/research-assistant-flow.ts`)**:
  ```typescript
  'use server'; // Important for Next.js server-side modules

  import { ai } from '@/ai/genkit';
  import { z } from 'genkit';
  // ... import tools, schemas ...

  export const ResearchAssistantInputSchema = z.object({ /* ... */ });
  export type ResearchAssistantInput = z.infer<typeof ResearchAssistantInputSchema>;

  export const ResearchAssistantOutputSchema = z.object({ /* ... */ });
  export type ResearchAssistantOutput = z.infer<typeof ResearchAssistantOutputSchema>;

  const researchPrompt = ai.definePrompt({ /* ... */ });

  const researchAssistantFlow = ai.defineFlow(
    {
      name: 'researchAssistantFlow',
      inputSchema: ResearchAssistantInputSchema,
      outputSchema: ResearchAssistantOutputSchema,
    },
    async (input) => {
      const { output } = await researchPrompt(input);
      return output!;
    }
  );

  export async function askResearchAssistant(input: ResearchAssistantInput): Promise<ResearchAssistantOutput> {
    return researchAssistantFlow(input);
  }
  ```

### Key Aspects of Flows:
- **`'use server';` Directive**: Essential at the top of flow files when they are intended to be used by Next.js Server Components or Server Actions.
- **Input/Output Schemas**: Defined using Zod (`z.object(...)`). This provides runtime validation and type safety. Types are inferred using `z.infer<typeof SchemaName>`.
- **Prompts**: Defined using `ai.definePrompt()`. Prompts can take input schemas, define output schemas (for structured output), and specify tools the LLM can use. The prompt text itself uses Handlebars templating (`{{{input_field}}}`).
- **Flow Logic**: The second argument to `ai.defineFlow()` is an async function that receives the validated input and should return a promise resolving to the validated output.
- **Exported Wrapper Function**: It's a common pattern to export a simple async wrapper function (e.g., `askResearchAssistant`) that calls the defined flow. This wrapper is what Next.js Server Actions will typically import and use.

## Genkit Tools

Tools allow LLMs to interact with external systems or perform actions beyond text generation.

### Defining a Tool
Tools are defined using `ai.defineTool()`.

- **Example (`src/ai/tools/web-search-tool.ts`)**:
  ```typescript
  'use server';

  import { ai } from '@/ai/genkit';
  import { z } from 'genkit';

  export const WebSearchToolInputSchema = z.object({ /* ... */ });
  export const WebSearchToolOutputSchema = z.object({ /* ... */ });

  export const webSearchTool = ai.defineTool(
    {
      name: 'webSearchTool',
      description: 'Performs a web search...',
      inputSchema: WebSearchToolInputSchema,
      outputSchema: WebSearchToolOutputSchema,
    },
    async (input) => {
      // Tool logic here (e.g., call a search API)
      // For this mock, it returns a predefined string.
      return { searchResults: `Mock search results for "${input.searchQuery}"...` };
    }
  );
  ```

### Key Aspects of Tools:
- **`name` and `description`**: Critical for the LLM to understand what the tool does and when to use it.
- **Input/Output Schemas**: Defined with Zod, just like flows.
- **Tool Logic**: The second argument to `ai.defineTool()` is an async function that receives the input (from the LLM) and performs the tool's action, returning the output.

## Configuration (`genkit.ts`)

This file contains the global Genkit setup.
```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()], // Configures the Google AI plugin for Gemini models
  model: 'googleai/gemini-2.0-flash', // Sets a default model
});
```
- **`plugins`**: An array of Genkit plugins. `googleAI()` enables access to Google's Gemini models.
- **`model`**: Optionally sets a default model to be used if not specified elsewhere.

## Development Server (`dev.ts`)

The `src/ai/dev.ts` file is the entry point for the Genkit development server. Its primary role is to import all defined flows and tools so that Genkit can discover them.

```typescript
// Example: src/ai/dev.ts
// Flows will be imported for their side effects in this file.
import './flows/research-assistant-flow';
// Import tools if they are not directly imported by flows but should be discoverable
// import './tools/web-search-tool'; // Often tools are imported by the flows that use them
```
Simply importing the flow/tool files is usually enough for Genkit to register them.

## Running the Genkit Development Server

Your `package.json` should contain scripts to start the Genkit development server:
- `npm run genkit:dev` or `yarn genkit:dev`: Starts the Genkit server.
- `npm run genkit:watch` or `yarn genkit:watch`: Starts the Genkit server and watches for file changes.

The Genkit developer UI is typically available at `http://localhost:4000` when the server is running. This UI allows you to inspect flows, view traces, and test your AI logic.

## Adding New Flows or Tools

1.  **Create the File**: Add a new `.ts` file in the appropriate directory (`flows/` or `tools/`).
2.  **Define the Flow/Tool**: Use `ai.defineFlow()` or `ai.defineTool()`, including Zod schemas.
3.  **Export Wrapper (for flows)**: Create and export an async wrapper function for your flow.
4.  **Update `dev.ts`**: Import your new flow/tool file into `src/ai/dev.ts` to ensure Genkit discovers it.
    ```typescript
    // In src/ai/dev.ts
    import './flows/new-amazing-flow';
    import './tools/new-powerful-tool';
    ```
5.  **Use in Application**: Import the flow's wrapper function into your Next.js Server Actions or API routes to integrate it with the frontend.

## Best Practices

- Always include the `'use server';` directive at the top of flow and tool files if they are directly or indirectly used by Next.js server-side code.
- Provide clear and concise descriptions for tools and prompts. The LLM relies on these descriptions to decide when and how to use them.
- Use Zod schemas for all inputs and outputs to ensure data integrity and leverage Genkit's validation.
- Keep flows and tools focused on specific tasks for better modularity and reusability.
- Document your flows and tools with JSDoc comments, explaining their purpose, inputs, and outputs.
- Regularly test your flows using the Genkit developer UI or by writing unit/integration tests.
      