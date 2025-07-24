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
    if (!this.isConfigured()) {
      throw new Error('OpenAI provider not configured. Please add your API key.');
    }

    try {
      const models = await invoke('llm_list_openai_models', {
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      
      return (models as any[]).map(model => ({
        id: model.id,
        name: model.id,
        provider: 'openai' as const,
        description: `OpenAI model: ${model.id}`,
        contextLength: model.context_length || undefined
      }));
    } catch (error) {
      logger.error('Failed to fetch OpenAI models:', error);
      throw new Error(`Failed to fetch OpenAI models: ${error}`);
    }
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
    if (!this.isConfigured()) {
      throw new Error('Anthropic provider not configured. Please add your API key.');
    }

    try {
      const models = await invoke('llm_list_anthropic_models', {
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      
      return (models as any[]).map(model => ({
        id: model.id,
        name: model.display_name || model.id,
        provider: 'anthropic' as const,
        description: `Anthropic model: ${model.display_name || model.id}`,
        contextLength: model.context_length || 200000
      }));
    } catch (error) {
      logger.error('Failed to fetch Anthropic models:', error);
      throw new Error(`Failed to fetch Anthropic models: ${error}`);
    }
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
    if (!this.isConfigured()) {
      throw new Error('OpenRouter provider not configured. Please add your API key.');
    }

    try {
      const models = await invoke('llm_list_openrouter_models', {
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      
      return (models as any[]).map(model => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'openrouter' as const,
        description: model.description || `OpenRouter model: ${model.name || model.id}`,
        contextLength: model.context_length || model.max_context_length || undefined
      }));
    } catch (error) {
      logger.error('Failed to fetch OpenRouter models:', error);
      throw new Error(`Failed to fetch OpenRouter models: ${error}`);
    }
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
    if (!this.isConfigured()) {
      throw new Error('DeepSeek provider not configured. Please add your API key.');
    }

    try {
      const models = await invoke('llm_list_deepseek_models', {
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      
      return (models as any[]).map(model => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'deepseek' as const,
        description: model.description || `DeepSeek model: ${model.name || model.id}`,
        contextLength: model.context_length || undefined
      }));
    } catch (error) {
      logger.error('Failed to fetch DeepSeek models:', error);
      throw new Error(`Failed to fetch DeepSeek models: ${error}`);
    }
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
      throw new Error(`Failed to fetch Mistral models: ${error}`);
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
    if (!this.isConfigured()) {
      throw new Error('Gemini provider not configured. Please add your API key.');
    }

    try {
      const models = await invoke('llm_list_gemini_models', {
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl
      });
      
      return (models as any[]).map(model => ({
        id: model.name?.replace('models/', '') || model.id,
        name: model.displayName || model.name?.replace('models/', '') || model.id,
        provider: 'gemini' as const,
        description: model.description || `Gemini model: ${model.displayName || model.name || model.id}`,
        contextLength: model.inputTokenLimit || undefined
      }));
    } catch (error) {
      logger.error('Failed to fetch Gemini models:', error);
      throw new Error(`Failed to fetch Gemini models: ${error}`);
    }
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
    const ollamaConfig = { enabled: true, apiKey: settings.ollama?.key, baseUrl: settings.ollama?.base_url };
    this.providers.set('ollama', new OllamaProvider(ollamaConfig as LLMProviderConfig));

    // Initialize OpenAI
    const openaiConfig = { enabled: !!settings.openai?.key, apiKey: settings.openai?.key, baseUrl: settings.openai?.base_url };
    this.providers.set('openai', new OpenAIProvider(openaiConfig as LLMProviderConfig));

    // Initialize Anthropic
    const anthropicConfig = { enabled: !!settings.anthropic?.key, apiKey: settings.anthropic?.key, baseUrl: settings.anthropic?.base_url };
    this.providers.set('anthropic', new AnthropicProvider(anthropicConfig as LLMProviderConfig));

    // Initialize OpenRouter
    const openrouterConfig = { enabled: !!settings.openrouter?.key, apiKey: settings.openrouter?.key, baseUrl: settings.openrouter?.base_url };
    this.providers.set('openrouter', new OpenRouterProvider(openrouterConfig as LLMProviderConfig));

    // Initialize DeepSeek
    const deepseekConfig = { enabled: !!settings.deepseek?.key, apiKey: settings.deepseek?.key, baseUrl: settings.deepseek?.base_url };
    this.providers.set('deepseek', new DeepSeekProvider(deepseekConfig as LLMProviderConfig));

    // Initialize Mistral
    const mistralConfig = { enabled: !!settings.mistral?.key, apiKey: settings.mistral?.key, baseUrl: settings.mistral?.base_url };
    this.providers.set('mistral', new MistralProvider(mistralConfig as LLMProviderConfig));

    // Initialize Gemini
    const geminiConfig = { enabled: !!settings.gemini?.key, apiKey: settings.gemini?.key, baseUrl: settings.gemini?.base_url };
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
    
    // Deduplicate models based on provider + id combination
    const uniqueModels = new Map<string, LLMModel>();
    for (const model of models) {
      const key = `${model.provider}-${model.id}`;
      if (!uniqueModels.has(key)) {
        uniqueModels.set(key, model);
      }
    }
    
    return Array.from(uniqueModels.values());
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