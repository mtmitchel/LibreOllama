import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ai } from '@/ai/genkit';
import { VALID_MODELS, type ValidModel } from '@/ai/types';

interface ChatRequest {
  message: string;
  userId: string;
  sessionId?: string;
  model: ValidModel;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input: ChatRequest = {
      message: body.message,
      userId: body.userId,
      sessionId: body.sessionId,
      model: body.model || VALID_MODELS[0],
      systemPrompt: body.systemPrompt,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    };

    if (!input.userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!input.message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate model selection
    if (!VALID_MODELS.includes(input.model)) {
      return new Response(
        JSON.stringify({ error: `Invalid model. Must be one of: ${VALID_MODELS.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get chat history if sessionId is provided
    let chatHistory: Array<{ role: string; content: string }> = [];
    
    if (input.sessionId) {
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', input.sessionId)
        .eq('user_id', input.userId)
        .order('created_at', { ascending: true })
        .limit(20); // Limit to last 20 messages for context

      if (messagesError) {
        console.error('Error fetching chat history:', messagesError);
        // Continue without history rather than failing
      } else if (messages) {
        chatHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
    }

    // Prepare messages for Genkit
    const messages = [
      ...(input.systemPrompt ? [{ role: 'system' as const, content: [{ text: input.systemPrompt }] }] : []),
      ...chatHistory.map(msg => ({
        role: msg.role as 'user' | 'model' | 'system',
        content: [{ text: msg.content }]
      })),
      { role: 'user' as const, content: [{ text: input.message }] }
    ];

    console.log(`[Ollama Chat API] Using model ${input.model} with ${messages.length} messages`);

    // Use Genkit's ai.generate method with the ollama/ prefix
    const result = await ai.generate({
      model: `ollama/${input.model}`,
      messages,
      config: {
        ...(input.temperature !== undefined && { temperature: input.temperature }),
        ...(input.maxTokens !== undefined && { maxTokens: input.maxTokens }),
      },
    });

    // Extract the response content
    let aiResponseContent = '';
    
    // Handle different response structures from Genkit
    if (result.message?.content) {
      for (const part of result.message.content) {
        if (part.text) {
          aiResponseContent += part.text;
        }
      }
    } else if ((result as any).candidates && Array.isArray((result as any).candidates)) {
      // Handle candidates structure
      const lastCandidate = (result as any).candidates[(result as any).candidates.length - 1];
      if (lastCandidate?.message?.content) {
        for (const part of lastCandidate.message.content) {
          if (part.text) {
            aiResponseContent += part.text;
          }
        }
      }
    } else if (typeof result === 'string') {
      aiResponseContent = result;
    } else if ((result as any).text) {
      aiResponseContent = (result as any).text;
    }

    if (!aiResponseContent.trim()) {
      console.error('No content extracted from Genkit response:', JSON.stringify(result, null, 2));
      throw new Error('Empty response from Ollama');
    }

    console.log(`[Ollama Chat API] Response generated successfully (${aiResponseContent.length} chars)`);

    // Return the AI response as plain text
    return new Response(aiResponseContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error in Ollama chat API:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
        return new Response(
          JSON.stringify({ 
            error: 'Unable to connect to Ollama. Please make sure Ollama is running on http://127.0.0.1:11434' 
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (error.message.includes('model') && error.message.includes('not found')) {
        return new Response(
          JSON.stringify({ 
            error: `Model not found. Please make sure the model is pulled in Ollama. Run: ollama pull ${error.message.match(/model '([^']+)'/)?.[1] || 'model'}` 
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
