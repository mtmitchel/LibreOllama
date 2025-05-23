// AI Model Types and Configurations

export const VALID_MODELS = [
  // Models you have installed
  'mistral-nemo:latest',
  'granite3.2:2b-instruct-q8_0',
  'granite3.2:8b-instruct-q4_K_M',
  'qwen3:4b',
  'cogito:8b',
  'llama3.2:3b',
  'llama3-groq-tool-use:8b',
  'granite3.3:latest',
  'phi4-mini:latest',
  'qwen3:8b',
  'qwen3:latest',
  'mistral:7b',
  'gemma3:latest',
  'gemma3:4b',
  // Original models kept for compatibility
  'llama3.2:latest',
  'llama3.1:latest',
  'codellama:latest',
  'gemma2:latest',
  'qwen2.5:latest',
  'phi3:latest',
  'deepseek-coder:latest',
] as const;

export type ValidModel = typeof VALID_MODELS[number];

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  expires_at: string;
  size_vram: number;
}

export interface OllamaResponse {
  models: OllamaModel[];
}

export interface ChatRequest {
  message: string;
  userId: string;
  model: ValidModel;
  systemPrompt?: string;
  sessionId?: string;
}

export interface ChatResponse {
  response: string;
  model: string;
  created_at: string;
  done: boolean;
}

export interface ModelInfo {
  name: string;
  displayName: string;
  description: string;
  size?: string;
  capabilities: string[];
}

export const MODEL_INFO: Record<ValidModel, ModelInfo> = {
  // Your installed models
  'mistral-nemo:latest': {
    name: 'mistral-nemo:latest',
    displayName: 'Mistral Nemo',
    description: 'Fast and efficient model for general conversations',
    size: '7.1 GB',
    capabilities: ['chat', 'reasoning', 'code'],
  },
  'granite3.2:2b-instruct-q8_0': {
    name: 'granite3.2:2b-instruct-q8_0',
    displayName: 'Granite 3.2 2B (Q8)',
    description: 'IBM\'s efficient instruction-tuned model',
    size: '2.7 GB',
    capabilities: ['chat', 'reasoning', 'instructions'],
  },
  'granite3.2:8b-instruct-q4_K_M': {
    name: 'granite3.2:8b-instruct-q4_K_M',
    displayName: 'Granite 3.2 8B (Q4)',
    description: 'IBM\'s larger instruction-tuned model',
    size: '4.9 GB',
    capabilities: ['chat', 'reasoning', 'analysis', 'code'],
  },
  'qwen3:4b': {
    name: 'qwen3:4b',
    displayName: 'Qwen 3 4B',
    description: 'Alibaba\'s compact multilingual model',
    size: '2.6 GB',
    capabilities: ['chat', 'multilingual', 'reasoning'],
  },
  'cogito:8b': {
    name: 'cogito:8b',
    displayName: 'Cogito 8B',
    description: 'Advanced reasoning and analysis model',
    size: '4.9 GB',
    capabilities: ['reasoning', 'analysis', 'chat'],
  },
  'llama3.2:3b': {
    name: 'llama3.2:3b',
    displayName: 'Llama 3.2 3B',
    description: 'Meta\'s efficient language model',
    size: '2.0 GB',
    capabilities: ['chat', 'reasoning', 'writing'],
  },
  'llama3-groq-tool-use:8b': {
    name: 'llama3-groq-tool-use:8b',
    displayName: 'Llama 3 Tool Use',
    description: 'Specialized for function calling and tool use',
    size: '4.7 GB',
    capabilities: ['tools', 'functions', 'chat', 'reasoning'],
  },
  'granite3.3:latest': {
    name: 'granite3.3:latest',
    displayName: 'Granite 3.3',
    description: 'IBM\'s latest Granite model with improvements',
    size: '4.9 GB',
    capabilities: ['chat', 'reasoning', 'analysis', 'code'],
  },
  'phi4-mini:latest': {
    name: 'phi4-mini:latest',
    displayName: 'Phi-4 Mini',
    description: 'Microsoft\'s latest small but capable model',
    size: '2.5 GB',
    capabilities: ['chat', 'reasoning', 'efficiency'],
  },
  'qwen3:8b': {
    name: 'qwen3:8b',
    displayName: 'Qwen 3 8B',
    description: 'Alibaba\'s larger multilingual model',
    size: '5.2 GB',
    capabilities: ['chat', 'multilingual', 'reasoning', 'analysis'],
  },
  'qwen3:latest': {
    name: 'qwen3:latest',
    displayName: 'Qwen 3 Latest',
    description: 'Alibaba\'s latest Qwen model',
    size: '5.2 GB',
    capabilities: ['chat', 'multilingual', 'reasoning', 'analysis'],
  },
  'mistral:7b': {
    name: 'mistral:7b',
    displayName: 'Mistral 7B',
    description: 'Original Mistral model',
    size: '4.1 GB',
    capabilities: ['chat', 'reasoning', 'code'],
  },
  'gemma3:latest': {
    name: 'gemma3:latest',
    displayName: 'Gemma 3',
    description: 'Google\'s latest Gemma model',
    size: '3.3 GB',
    capabilities: ['chat', 'reasoning', 'analysis'],
  },
  'gemma3:4b': {
    name: 'gemma3:4b',
    displayName: 'Gemma 3 4B',
    description: 'Google\'s efficient language model',
    size: '3.3 GB',
    capabilities: ['chat', 'reasoning', 'analysis'],
  },
  // Keep original models for compatibility
  'llama3.2:latest': {
    name: 'llama3.2:latest',
    displayName: 'Llama 3.2',
    description: 'Latest Llama model with improved performance',
    capabilities: ['chat', 'reasoning', 'analysis'],
  },
  'llama3.1:latest': {
    name: 'llama3.1:latest',
    displayName: 'Llama 3.1',
    description: 'Powerful general-purpose language model',
    capabilities: ['chat', 'reasoning', 'writing'],
  },
  'codellama:latest': {
    name: 'codellama:latest',
    displayName: 'Code Llama',
    description: 'Specialized for code generation and programming tasks',
    capabilities: ['code', 'programming', 'debugging'],
  },
  'gemma2:latest': {
    name: 'gemma2:latest',
    displayName: 'Gemma 2',
    description: 'Google\'s efficient language model',
    capabilities: ['chat', 'reasoning', 'analysis'],
  },
  'qwen2.5:latest': {
    name: 'qwen2.5:latest',
    displayName: 'Qwen 2.5',
    description: 'Alibaba\'s multilingual model',
    capabilities: ['chat', 'multilingual', 'reasoning'],
  },
  'phi3:latest': {
    name: 'phi3:latest',
    displayName: 'Phi-3',
    description: 'Microsoft\'s small but capable model',
    capabilities: ['chat', 'reasoning', 'efficiency'],
  },
  'deepseek-coder:latest': {
    name: 'deepseek-coder:latest',
    displayName: 'DeepSeek Coder',
    description: 'Advanced coding assistant',
    capabilities: ['code', 'programming', 'debugging', 'architecture'],
  },
};