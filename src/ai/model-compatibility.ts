/**
 * Model compatibility categorization for LibreOllama
 * This file defines which models work with tools and to what extent
 */

import { ValidModel } from './types';

// Convert model names to include ollama/ prefix for internal use
function withOllamaPrefix(models: readonly string[]): string[] {
  return models.map(model => `ollama/${model}`);
}

// Models with full tool support (can call tools and process their responses correctly)
export const FULL_COMPATIBILITY_MODELS = [
  // From your installed models
  ...withOllamaPrefix([
    'qwen3:4b',
    'qwen3:8b',
    'qwen3:latest',
    'llama3-groq-tool-use:8b', // Specifically designed for tool use
    'granite3.3:latest',
    'granite3.2:8b-instruct-q4_K_M',
    'granite3.2:2b-instruct-q8_0',
  ] as const),
  // Additional models
  ...withOllamaPrefix(['qwen2.5:latest'] as const),
  'ollama/llama3',
  'ollama/llama3.1:8b',
  'ollama/llama3.1:70b',
  'ollama/llama3.2:1b',
  'ollama/qwen2.5:3b',
  'ollama/qwen2.5:7b',
  'ollama/qwen2.5-coder:7b',
  'ollama/nemotron-mini:4b'
];

// Models with partial tool support (can call tools but have issues processing responses)
export const PARTIAL_COMPATIBILITY_MODELS = [
  // From your installed models
  ...withOllamaPrefix([
    'mistral-nemo:latest',
    'mistral:7b',
    'llama3.2:3b',
    'cogito:8b',
    'llama3.2:latest',
    'llama3.1:latest',
    'codellama:latest',
    'deepseek-coder:latest'
  ] as const),
  // Additional known partial models
  'ollama/mistral-small:22b',
  'ollama/mistral-small:24b',
  'ollama/wizardlm-uncensored:13b',
  'ollama/smallthinker:latest',
];

// Models known to have no tool support
export const NO_COMPATIBILITY_MODELS = [
  // From your installed models
  ...withOllamaPrefix([
    'gemma3:latest',
    'gemma3:4b',
    'phi4-mini:latest',
    'gemma2:latest',
    'phi3:latest'
  ] as const),
  // Additional known incompatible models
  'ollama/phi3:mini',
  'ollama/nomic-embed-text:latest' // This is an embedding model, not meant for chat/tools
];

// Default model to use when the selected model doesn't support tools
export const DEFAULT_TOOL_MODEL = 'ollama/granite3.3:latest';

// Exported object for use in components
export const MODEL_COMPATIBILITY = {
  FULL: FULL_COMPATIBILITY_MODELS,
  PARTIAL: PARTIAL_COMPATIBILITY_MODELS,
  NONE: NO_COMPATIBILITY_MODELS
};

// Define a type for the compatibility levels
export type ModelCompatibilityLevel = 'full' | 'partial' | 'none' | 'unknown';

/**
 * Get a model's compatibility level
 * @param modelId The model ID with or without ollama/ prefix
 * @returns Compatibility level: 'full', 'partial', 'none', or 'unknown'
 */
export function getModelCompatibility(modelId: string): ModelCompatibilityLevel {
  // Ensure the model has the ollama/ prefix for checking
  const modelWithPrefix = modelId.startsWith('ollama/') ? modelId : `ollama/${modelId}`;
  
  if (FULL_COMPATIBILITY_MODELS.includes(modelWithPrefix)) {
    return 'full';
  }
  
  if (PARTIAL_COMPATIBILITY_MODELS.includes(modelWithPrefix)) {
    return 'partial';
  }
  
  if (NO_COMPATIBILITY_MODELS.includes(modelWithPrefix)) {
    return 'none';
  }
  
  // If no exact match, try to infer based on name patterns
  const modelLower = modelId.toLowerCase();
  
  // Check for model family patterns
  if (/qwen3|qwen2\.5|llama3.*tool|granite3|neural-chat|openhermes|open-hermes|nous-hermes2|tulu2/.test(modelLower)) {
    return 'full';
  }
  
  if (/mistral|yi|wizard|openchat|orca|smallthinker|mixtral|vicuna|internlm|zephyr|solar|mpt|mosaic|falcon|dolphin2|stable-code|codestral|codellama|baichuan|bloom|deepseek|hermes|cogito/.test(modelLower)) {
    return 'partial';
  }
  
  if (/gemma|phi[0-9]|tinylla|stablelm|embed-text|nomic-embed|clip|glm|speechless|sheared-llama|mamba|qwen\/vl|blip|idefics|haiku|gpt-j|gpt-neo|bert|minigpt|rag|samantha/.test(modelLower)) {
    return 'none';
  }
  
  // Default to partial for unknown models instead of unknown
  // This gives users a chance to try models even if we don't explicitly categorize them
  return 'partial';
}

/**
 * Check if a ValidModel type has tool support
 * @param model A ValidModel from types.ts
 * @returns Compatibility level
 */
export function getValidModelCompatibility(model: ValidModel): ModelCompatibilityLevel {
  return getModelCompatibility(model);
}
