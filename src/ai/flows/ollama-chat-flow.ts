'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ollama } from 'genkitx-ollama';
import { VALID_MODELS, type ValidModel } from '@/ai/types';

// Define schemas
const ChatInputSchema = z.object({
  message: z.string().describe('The user message to respond to.'),
  model: z.enum(VALID_MODELS).default('mistral-nemo:latest').describe('The model to use for chat.'),
  systemPrompt: z.string().optional().describe('Optional system prompt to control the model behavior.'),
  temperature: z.number().min(0).max(2).optional().describe('Temperature for response generation (0-2). Default is 0.7.'),
  maxTokens: z.number().min(1).optional().describe('Maximum tokens to generate. Default determined by model.'),
});

const ChatOutputSchema = z.object({
  response: z.string().describe('The model response to the user message.'),
  modelUsed: z.string().describe('The model that generated the response.'),
});

// Define the chat function
export async function generateChatResponse(input: z.infer<typeof ChatInputSchema>): Promise<z.infer<typeof ChatOutputSchema>> {
  try {
    // Initialize Ollama client with the selected model
    const ollamaClient = ollama({
      models: [
        { 
          name: input.model, 
          type: input.model.includes('llama') ? 'generate' as const : 'chat' as const 
        }
      ],
      serverAddress: 'http://127.0.0.1:11434',
    });

    // @ts-expect-error: chat method exists but TypeScript doesn't recognize it
    const stream = await ollamaClient.chat({
      model: input.model,
      messages: [
        ...(input.systemPrompt ? [{ role: 'system', content: input.systemPrompt }] : []),
        { role: 'user', content: input.message }
      ],
      stream: true,
      ...(input.temperature && { temperature: input.temperature }),
      ...(input.maxTokens && { max_tokens: input.maxTokens }),
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullResponse += chunk;

      // Log progress for debugging
      console.log('Response chunk:', chunk);
    }

    if (!fullResponse) {
      throw new Error('No response received from Ollama');
    }

    // Return the complete response
    return {
      response: fullResponse.trim(),
      modelUsed: input.model,
    };
  } catch (error) {
    console.error('Error in generateChatResponse:', error);
    throw new Error(`Chat flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}