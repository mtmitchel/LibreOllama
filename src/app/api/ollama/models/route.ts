import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MODEL_COMPATIBILITY, getModelCompatibility } from '@/ai/model-compatibility';

// Type definitions for Ollama API responses
interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  digest?: string;
  details?: {
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level?: string;
  };
}

interface OllamaModelsResponse {
  models: OllamaModel[];
}

export async function GET(request: NextRequest) {
  try {
    // Try to get the Ollama URL from environment vars or use default
    let ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    
    // Make sure URL doesn't end with a slash
    if (ollamaUrl.endsWith('/')) {
      ollamaUrl = ollamaUrl.slice(0, -1);
    }
    
    // Fetch models from Ollama API
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Don't cache results to always get the latest installed models
      cache: 'no-store',
    });
    
    if (!response.ok) {
      // Try to get error details
      let errorMessage = "Failed to fetch Ollama models";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (_) {}
      
      console.error(`Ollama API error: ${response.status} - ${errorMessage}`);
      
      // Return a friendly error
      return NextResponse.json(
        { 
          error: "Could not connect to Ollama API. Please ensure Ollama is running and try again.",
          detail: errorMessage,
          status: response.status 
        }, 
        { status: 502 } // Bad Gateway
      );
    }
    
    // Parse the Ollama API response
    const data = await response.json() as OllamaModelsResponse;
    
    // Transform to our format with 'ollama/' prefix
    const models = data.models.map(model => {
      // Get the compatibility level
      const fullModelId = `ollama/${model.name}`;
      const compatibilityLevel = getModelCompatibility(fullModelId);
      
      return {
        id: fullModelId,
        name: model.name,
        displayName: formatDisplayName(model.name),
        modified: model.modified_at,
        size: model.size,
        details: model.details,
        // Mark all models as compatible by default, with the correct compatibility level
        toolCompatible: compatibilityLevel !== 'none',
        compatibilityLevel, // 'full', 'partial', or 'none'
      };
    });
    
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch models from Ollama API",
        detail: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}

// Format the model name for display (e.g., "qwen3:8b" -> "Qwen3 8B")
function formatDisplayName(name: string): string {
  if (!name.includes(':')) return capitalizeFirstLetter(name);
  
  const [baseName, variant] = name.split(':');
  return capitalizeFirstLetter(baseName) + ' ' + variant.toUpperCase();
}

// Helper to capitalize the first letter of a string
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
} 