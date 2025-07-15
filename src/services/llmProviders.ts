import { invoke } from '@tauri-apps/api/core';
import { OllamaService } from './ollamaService';
import { logger } from '../core/lib/logger';

// Provider types
export type LLMProvider = 'ollama' | 'openai' | 'anthropic' | 'openrouter' | 'deepseek' | 'mistral' | 'gemini'; // Added 'gemini'

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  description?: string;
  contextLength?: number;
  parameter_size?: string; // Added missing property
}

export interface LLMProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
}

export interface LLMProviderSettings {
  [key: string]: { key?: string; base_url?: string };
}

// Abstract base class for LLM providers
export abstract class BaseLLMProvider {
  abstract provider: LLMProvider;
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  // Public method to safely get a copy of the configuration
  public getRawConfig(): LLMProviderConfig {
    return { ...this.config };
  }

  abstract chat(messages: LLMMessage[], model?: string): Promise<string>;
  abstract listModels(): Promise<LLMModel[]>;
  abstract isConfigured(): boolean;
}

// Ollama Provider (existing)
export class OllamaProvider extends BaseLLMProvider {
  provider: LLMProvider = 'ollama';
  private ollamaService: OllamaService;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.ollamaService = OllamaService.getInstance();
  }

  async chat(messages: LLMMessage[], model?: string): Promise<string> {
    return await this.ollamaService.chat(messages, model);
  }

  async listModels(): Promise<LLMModel[]> {
    const ollamaModels = await this.ollamaService.listModels();
    return ollamaModels.map(model => ({
      id: model.name,
      name: model.name,
      provider: 'ollama' as const,
      description: `Ollama model: ${model.name}`,
      contextLength: model.parameter_size ? parseInt(model.parameter_size) : undefined // Corrected access
    }));
  }

  isConfigured(): boolean {
    // Ollama doesn't require API key, just needs to be running
    return this.config.enabled;
  }
}

// OpenAI Provider
export class OpenAIProvider extends BaseLLMProvider {
  provider: LLMProvider = 'openai';

  async chat(messages: LLMMessage[], model = 'gpt-3.5-turbo'): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI provider not configured. Please add your API key.');
    }

    try {
      const response = await invoke('llm_chat_openai', {
        messages,
        model,
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      return response as string;
    } catch (error) {
      logger.error('OpenAI chat error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }
  }

  async listModels(): Promise<LLMModel[]> {
    return [
      { id: 'gpt-4', name: 'GPT-4', provider: 'openai', description: 'Most capable GPT-4 model', contextLength: 8192 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'Latest GPT-4 with improved performance', contextLength: 128000 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', description: 'Fast and efficient model', contextLength: 16385 }
    ];
  }

  isConfigured(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }
}

// Anthropic Provider
export class AnthropicProvider extends BaseLLMProvider {
  provider: LLMProvider = 'anthropic';

  async chat(messages: LLMMessage[], model = 'claude-3-sonnet-20240229'): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic provider not configured. Please add your API key.');
    }

    try {
      const response = await invoke('llm_chat_anthropic', {
        messages,
        model,
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      return response as string;
    } catch (error) {
      logger.error('Anthropic chat error:', error);
      throw new Error(`Anthropic API error: ${error}`);
    }
  }

  async listModels(): Promise<LLMModel[]> {
    return [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', description: 'Most powerful Claude model', contextLength: 200000 },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', description: 'Balanced performance and speed', contextLength: 200000 },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', description: 'Fastest Claude model', contextLength: 200000 }
    ];
  }

  isConfigured(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }
}

// OpenRouter Provider
export class OpenRouterProvider extends BaseLLMProvider {
  provider: LLMProvider = 'openrouter';

  async chat(messages: LLMMessage[], model = 'anthropic/claude-3-sonnet'): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter provider not configured. Please add your API key.');
    }

    try {
      const response = await invoke('llm_chat_openrouter', {
        messages,
        model,
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      return response as string;
    } catch (error) {
      logger.error('OpenRouter chat error:', error);
      throw new Error(`OpenRouter API error: ${error}`);
    }
  }

  async listModels(): Promise<LLMModel[]> {
    return [
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus (OpenRouter)', provider: 'openrouter', description: 'Claude 3 Opus via OpenRouter', contextLength: 200000 },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet (OpenRouter)', provider: 'openrouter', description: 'Claude 3 Sonnet via OpenRouter', contextLength: 200000 },
      { id: 'openai/gpt-4', name: 'GPT-4 (OpenRouter)', provider: 'openrouter', description: 'GPT-4 via OpenRouter', contextLength: 8192 },
      { id: 'meta-llama/llama-2-70b-chat', name: 'Llama 2 70B', provider: 'openrouter', description: 'Llama 2 70B via OpenRouter', contextLength: 4096 }
    ];
  }

  isConfigured(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }
}

// DeepSeek Provider
export class DeepSeekProvider extends BaseLLMProvider {
  provider: LLMProvider = 'deepseek';

  async chat(messages: LLMMessage[], model = 'deepseek-chat'): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('DeepSeek provider not configured. Please add your API key.');
    }

    try {
      const response = await invoke('llm_chat_deepseek', {
        messages,
        model,
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      return response as string;
    } catch (error) {
      logger.error('DeepSeek chat error:', error);
      throw new Error(`DeepSeek API error: ${error}`);
    }
  }

  async listModels(): Promise<LLMModel[]> {
    return [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', description: 'DeepSeek conversational model', contextLength: 32768 },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek', description: 'DeepSeek specialized for coding', contextLength: 16384 }
    ];
  }

  isConfigured(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }
}

// Mistral Provider
export class MistralProvider extends BaseLLMProvider {
  provider: LLMProvider = 'mistral';

  async chat(messages: LLMMessage[], model = 'mistral-large-latest'): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Mistral provider not configured. Please add your API key.');
    }

    try {
      const response = await invoke('llm_chat_mistral', {
        messages,
        model,
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      return response as string;
    } catch (error) {
      logger.error('Mistral chat error:', error);
      throw new Error(`Mistral API error: ${error}`);
    }
  }

  async listModels(): Promise<LLMModel[]> {
    if (!this.isConfigured()) {
      throw new Error('Mistral provider not configured. Please add your API key.');
    }

    try {
      const response = await invoke('llm_list_mistral_models', {
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      
      const models = response as any[];
      return models.map(model => ({
        id: model.id || model.model,
        name: model.id || model.model,
        provider: 'mistral' as LLMProvider,
        description: model.description || `Mistral model: ${model.id || model.model}`,
        contextLength: model.max_context_length || 32768
      }));
    } catch (error) {
      logger.error('Failed to fetch Mistral models:', error);
      // Fallback to hardcoded models if API call fails
      return [
        // Premier Models
        { id: 'mistral-large-latest', name: 'Mistral Large 2', provider: 'mistral', description: 'Top-tier reasoning and knowledge', contextLength: 128000 },
        { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'mistral', description: 'Fast and cost-effective for simple tasks', contextLength: 128000 },
        { id: 'mistral-embed', name: 'Mistral Embed', provider: 'mistral', description: 'State-of-the-art embedding model', contextLength: 16384 },
        
        // Open Models
        { id: 'open-mistral-7b', name: 'Mistral 7B Instruct', provider: 'mistral', description: 'High-quality and efficient base model', contextLength: 32768 },
        { id: 'open-mixtral-8x7b', name: 'Mixtral 8x7B Instruct', provider: 'mistral', description: 'High-quality sparse mixture of experts', contextLength: 32768 },
        { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B', provider: 'mistral', description: 'High-performance open-source sparse mixture-of-experts', contextLength: 65536 },
        { id: 'codestral-latest', name: 'Codestral', provider: 'mistral', description: 'State-of-the-art code generation model', contextLength: 32768 },
        { id: 'mathstral-7b-instruct', name: 'Mathstral', provider: 'mistral', description: 'Specialized model for mathematical reasoning', contextLength: 32768 },
      ];
    }
  }

  isConfigured(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }
}

// Gemini Provider (new)
export class GeminiProvider extends BaseLLMProvider {
  provider: LLMProvider = 'gemini';

  constructor(config: LLMProviderConfig) {
    super(config);
  }

  async chat(messages: LLMMessage[], model = 'gemini-pro'): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gemini provider not configured. Please add your API key.');
    }

    try {
      const response = await invoke('llm_chat_gemini', {
        messages,
        model,
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      return response as string;
    } catch (error) {
      logger.error('Gemini chat error:', error);
      throw new Error(`Gemini API error: ${error}`);
    }
  }

  async listModels(): Promise<LLMModel[]> {
    // Mock models for now; replace with actual API call in Phase 3.x
    return [
      { id: 'gemini-pro', name: 'Gemini Pro', provider: 'gemini', description: 'Google\'s Gemini Pro model', contextLength: 32768 },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', provider: 'gemini', description: 'Google\'s Gemini Pro Vision model', contextLength: 16384 }
    ];
  }

  isConfigured(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }
}

// LLM Provider Manager
export class LLMProviderManager {
  private static instance: LLMProviderManager;
  private providers: Map<LLMProvider, BaseLLMProvider> = new Map();

  private constructor(settings: LLMProviderSettings) {
    this.initializeProviders(settings);
  }

  static getInstance(settings?: LLMProviderSettings): LLMProviderManager {
    if (!LLMProviderManager.instance) {
      if (!settings) {
        // Attempt to load settings from local storage if not provided on first initialization
        const storedSettings = localStorage.getItem('settings-store');
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          settings = parsedSettings.state.integrations.apiKeys;
        } else {
          settings = {}; // Default to empty settings
        }
      }
      LLMProviderManager.instance = new LLMProviderManager(settings || {});
    } else if (settings) {
      // Reinitialize if settings are provided to an existing instance
      LLMProviderManager.instance.reinitialize(settings);
    }
    return LLMProviderManager.instance;
  }

  private initializeProviders(settings: LLMProviderSettings): void {
    // Clear existing providers
    this.providers.clear();

    // Initialize Ollama
    const ollamaConfig = { enabled: true, ...settings.ollama }; // Ollama is always considered enabled if present
    this.providers.set('ollama', new OllamaProvider(ollamaConfig as LLMProviderConfig));

    // Initialize OpenAI
    const openaiConfig = { enabled: !!settings.openai?.key, ...settings.openai };
    this.providers.set('openai', new OpenAIProvider(openaiConfig as LLMProviderConfig));

    // Initialize Anthropic
    const anthropicConfig = { enabled: !!settings.anthropic?.key, ...settings.anthropic };
    this.providers.set('anthropic', new AnthropicProvider(anthropicConfig as LLMProviderConfig));

    // Initialize OpenRouter
    const openrouterConfig = { enabled: !!settings.openrouter?.key, ...settings.openrouter };
    this.providers.set('openrouter', new OpenRouterProvider(openrouterConfig as LLMProviderConfig));

    // Initialize DeepSeek
    const deepseekConfig = { enabled: !!settings.deepseek?.key, ...settings.deepseek };
    this.providers.set('deepseek', new DeepSeekProvider(deepseekConfig as LLMProviderConfig));

    // Initialize Mistral
    const mistralConfig = { enabled: !!settings.mistral?.key, ...settings.mistral };
    this.providers.set('mistral', new MistralProvider(mistralConfig as LLMProviderConfig));

    // Initialize Gemini
    const geminiConfig = { enabled: !!settings.gemini?.key, ...settings.gemini };
    this.providers.set('gemini', new GeminiProvider(geminiConfig as LLMProviderConfig));

    logger.log('[LLMProviderManager] Providers initialized:', Array.from(this.providers.keys()));
  }

  public reinitialize(settings: LLMProviderSettings): void {
    logger.log('[LLMProviderManager] Reinitializing providers with new settings.');
    this.initializeProviders(settings);
  }

  getProvider(provider: LLMProvider): BaseLLMProvider | undefined {
    return this.providers.get(provider);
  }

  getEnabledProviders(): BaseLLMProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isConfigured());
  }

  async getAllModels(): Promise<LLMModel[]> {
    const models: LLMModel[] = [];
    for (const provider of this.providers.values()) {
      if (provider.isConfigured()) {
        try {
          const providerModels = await provider.listModels();
          models.push(...providerModels);
        } catch (error) {
          logger.warn(`Failed to list models for ${provider.provider}:`, error);
        }
      }
    }
    return models;
  }

  async chat(provider: LLMProvider, messages: LLMMessage[], model?: string): Promise<string> {
    const llmProvider = this.getProvider(provider);
    if (!llmProvider) {
      throw new Error(`LLM provider ${provider} not found or not initialized.`);
    }
    if (!llmProvider.isConfigured()) {
      throw new Error(`LLM provider ${provider} is not configured.`);
    }
    return await llmProvider.chat(messages, model);
  }

  getProviderSettings(): LLMProviderSettings {
    const settings: LLMProviderSettings = {};
    for (const [key, provider] of this.providers.entries()) {
      const rawConfig = provider.getRawConfig();
      settings[key] = {
        key: rawConfig.apiKey,
        base_url: rawConfig.baseUrl
      };
    }
    return settings;
  }
} 