'use server';

import {
  askResearchAssistant,
  type ResearchAssistantInput,
  type ResearchAssistantOutput,
} from '@/ai/flows/research-assistant-flow';
import { z } from 'zod';

const TestAgentSchema = z.object({
  query: z.string().min(1, { message: 'Query cannot be empty.' }),
  agentInstructions: z.string().optional(),
  model: z.string().optional(),
});

interface TestAgentResult {
  success: boolean;
  data?: ResearchAssistantOutput;
  error?: string;
  model?: string;
}

export async function runResearchAssistantTest(data: FormData): Promise<{
  success: boolean;
  data?: ResearchAssistantOutput;
  error?: string;
  model?: string;
}> {
  try {
    const query = data.get('query') as string;
    const agentInstructions = data.get('agentInstructions') as string;
    const model = data.get('model') as string;

    console.log('[runResearchAssistantTest] Starting test with:', {
      query,
      model,
      hasInstructions: Boolean(agentInstructions),
    });

    if (!query || query.trim() === '') {
      return {
        success: false,
        error: 'Please provide a valid query',
      };
    }

    // Prepare the input for the research assistant
    const input: ResearchAssistantInput = {
      query,
      agentInstructions,
      model,
    };

    // Call the research assistant flow
    const result = await askResearchAssistant(input);

    // Return the full result without truncation
    return {
      success: true,
      data: result,
      model: model, // Pass the original model for display
    };
  } catch (error) {
    console.error('[runResearchAssistantTest] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while testing the agent',
    };
  }
}
