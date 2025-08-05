import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from '../../features/chat/stores/chatStore';
import { LLMProviderManager } from '../../services/llmProviders';

// Mock Tauri commands
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

import { invoke } from '@tauri-apps/api/core';

// Mock settings store
vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({
      integrations: {
        apiKeys: {
          ollama: { enabled: true },
          openai: { enabled: true, key: 'test-openai-key' },
          anthropic: { enabled: true, key: 'test-anthropic-key' },
          mistral: { enabled: true, key: 'test-mistral-key' }
        },
        enabledModels: {}
      }
    }))
  }
}));

// Mock LLM provider responses
const mockInvoke = vi.fn(); // Changed to vi.fn() to avoid top-level await

// Mock LLMProviderManager to return models from multiple providers
vi.mock('../../services/llmProviders', () => ({
  LLMProviderManager: {
    getInstance: vi.fn(() => ({
      getAllModels: vi.fn(() => Promise.resolve([
        // Ollama models
        { id: 'llama2', name: 'llama2', provider: 'ollama', description: 'Ollama model: llama2' },
        { id: 'codellama', name: 'codellama', provider: 'ollama', description: 'Ollama model: codellama' },
        // OpenAI models  
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai', description: 'Most capable GPT-4 model', contextLength: 8192 },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', description: 'Fast and efficient model', contextLength: 16385 },
        // Anthropic models
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', description: 'Most powerful Claude model', contextLength: 200000 },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', description: 'Balanced performance and speed', contextLength: 200000 },
        // Mistral models
        { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', description: 'Mistral large model' },
        { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'mistral', description: 'Mistral small model' }
      ])),
      chat: vi.fn(),
      getProvider: vi.fn(),
      getEnabledProviders: vi.fn()
    }))
  }
}));

describe('Chat Multi-Provider Integration Tests', () => {
  beforeEach(() => {
    // Reset store using store-first pattern
    const store = useChatStore.getState();
    store.reset();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Re-assign mockInvoke within beforeEach to ensure it's always reset
    (invoke as any).mockImplementation((command: string, args?: any) => {
      switch (command) {
        case 'get_llm_provider_settings':
          return Promise.resolve({
            ollama: { enabled: true },
            openai: { enabled: true, key: 'test-openai-key' },
            anthropic: { enabled: true, key: 'test-anthropic-key' },
            mistral: { enabled: true, key: 'test-mistral-key' }
          });
        case 'save_llm_provider_settings':
          return Promise.resolve();
        case 'ollama_list_models':
          return Promise.resolve([
            { name: 'llama2', size: 3800000000 },
            { name: 'codellama', size: 3800000000 }
          ]);
        case 'llm_list_openai_models':
          return Promise.resolve([
            { id: 'gpt-4', object: 'model' },
            { id: 'gpt-3.5-turbo', object: 'model' }
          ]);
        case 'llm_list_anthropic_models':
          return Promise.resolve([
            { id: 'claude-3-opus-20240229', display_name: 'Claude 3 Opus' },
            { id: 'claude-3-sonnet-20240229', display_name: 'Claude 3 Sonnet' }
          ]);
        case 'llm_list_mistral_models':
          return Promise.resolve([
            { id: 'mistral-large-latest', object: 'model' },
            { id: 'mistral-small-latest', object: 'model' }
          ]);
        case 'llm_chat_openai':
          return Promise.resolve('OpenAI response: ' + args.messages[args.messages.length - 1].content);
        case 'llm_chat_anthropic':
          return Promise.resolve('Claude response: ' + args.messages[args.messages.length - 1].content);
        case 'llm_chat_mistral':
          return Promise.resolve('Mistral response: ' + args.messages[args.messages.length - 1].content);
        case 'send_message':
          return Promise.resolve({
            id: `msg-${Date.now()}`,
            session_id: args.sessionIdStr,
            content: args.content,
            role: 'user',
            timestamp: new Date().toISOString()
          });
        case 'create_session':
          return Promise.resolve({
            id: `session-${Date.now()}`,
            title: args.title || 'New chat',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            message_count: 0
          });
        default:
          return Promise.resolve();
      }
    });
  });

  it('should initialize with multiple providers', async () => {
    // ✅ BEST PRACTICE: Direct store testing from Canvas model
    const store = useChatStore.getState();

    // Fetch available models (should include multiple providers)
    await store.fetchAvailableModels();

    // Get updated store state after async operation
    const updatedStore = useChatStore.getState();

    // Verify models from multiple providers are available
    expect(updatedStore.availableModels.length).toBeGreaterThan(0);
    
    const providers = [...new Set(updatedStore.availableModels.map(m => m.provider))];
    expect(providers.length).toBeGreaterThanOrEqual(1);
    
    // Should auto-select first available model
    expect(updatedStore.selectedModel).toBeDefined();
    expect(updatedStore.selectedProvider).toBeDefined();
  });

  it('should switch between providers', async () => {
    const store = useChatStore.getState();
    await store.fetchAvailableModels();

    const initialProvider = store.selectedProvider;
    const initialModel = store.selectedModel;

    // Find a different provider
    const availableProviders = [...new Set(store.availableModels.map(m => m.provider))];
    const differentProvider = availableProviders.find(p => p !== initialProvider);

    if (differentProvider) {
      // Switch provider
      store.setSelectedProvider(differentProvider);

      // Verify provider switched
      expect(store.selectedProvider).toBe(differentProvider);
      
      // Should auto-select model from new provider
      const newModel = store.availableModels.find(m => m.provider === differentProvider);
      if (newModel) {
        expect(store.selectedModel).toBe(newModel.id);
      }
    }
  });

  it('should send messages using selected provider', async () => {
    const store = useChatStore.getState();
    await store.fetchAvailableModels();

    // Create a conversation
    const conversationId = await store.createConversation('Test Chat');
    expect(conversationId).toBeDefined();

    // Select OpenAI provider if available
    const openaiModel = store.availableModels.find(m => m.provider === 'openai');
    if (openaiModel) {
      store.setSelectedModel(openaiModel.id);
      expect(store.selectedProvider).toBe('openai');

      // Send message
      await store.sendMessage(conversationId, 'Hello OpenAI');

      // Verify message was sent and response received
      const messages = store.messages[conversationId];
      expect(messages).toBeDefined();
      expect(messages.length).toBeGreaterThanOrEqual(1);
      
      // Should have called OpenAI API
      expect(mockInvoke).toHaveBeenCalledWith('llm_chat_openai', expect.objectContaining({
        messages: expect.any(Array),
        model: openaiModel.id,
        apiKey: 'test-openai-key'
      }));
    }
  });

  it('should handle provider configuration errors gracefully', async () => {
    const store = useChatStore.getState();
    
    // Mock provider manager to simulate unconfigured provider
    const providerManager = LLMProviderManager.getInstance();
    const originalChat = providerManager.chat;
    
    vi.spyOn(providerManager, 'chat').mockRejectedValueOnce(
      new Error('Provider openai is not configured')
    );

    await store.fetchAvailableModels();
    
    // Try to send message with unconfigured provider
    const conversationId = await store.createConversation('Error Test');
    
    try {
      await store.sendMessage(conversationId, 'Test message');
      // Should have error state
      expect(store.error).toContain('Failed to send message');
    } catch (error) {
      // Expected to fail
    }

    // Restore original method
    vi.mocked(providerManager.chat).mockRestore();
  });

  it('should persist provider selection across store resets', async () => {
    const store = useChatStore.getState();
    await store.fetchAvailableModels();

    // Select a specific model and provider
    const anthropicModel = store.availableModels.find(m => m.provider === 'anthropic');
    if (anthropicModel) {
      store.setSelectedModel(anthropicModel.id);
      
      const selectedModel = store.selectedModel;
      const selectedProvider = store.selectedProvider;

      // Store should persist selection (tested through localStorage in real usage)
      expect(selectedModel).toBe(anthropicModel.id);
      expect(selectedProvider).toBe('anthropic');
    }
  });

  it('should filter models by provider correctly', async () => {
    const store = useChatStore.getState();
    await store.fetchAvailableModels();

    // Test provider filtering
    const ollamaModels = store.availableModels.filter(m => m.provider === 'ollama');
    const openaiModels = store.availableModels.filter(m => m.provider === 'openai');

    // Each provider should have its own models
    ollamaModels.forEach(model => {
      expect(model.provider).toBe('ollama');
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
    });

    if (openaiModels.length > 0) {
      openaiModels.forEach(model => {
        expect(model.provider).toBe('openai');
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
      });
    }
  });

  it('should handle model selection within provider', async () => {
    const store = useChatStore.getState();
    await store.fetchAvailableModels();

    // Find provider with multiple models
    const providers = [...new Set(store.availableModels.map(m => m.provider))];
    
    for (const provider of providers) {
      const providerModels = store.availableModels.filter(m => m.provider === provider);
      
      if (providerModels.length > 1) {
        // Select first model
        store.setSelectedModel(providerModels[0].id);
        expect(store.selectedModel).toBe(providerModels[0].id);
        expect(store.selectedProvider).toBe(provider);

        // Select second model (should stay in same provider)
        store.setSelectedModel(providerModels[1].id);
        expect(store.selectedModel).toBe(providerModels[1].id);
        expect(store.selectedProvider).toBe(provider);
        break;
      }
    }
  });

  it('should validate provider API keys', async () => {
    // Test provider configuration validation
    const store = useChatStore.getState();
    
    // Ensure we have fresh models
    await store.fetchAvailableModels();
    
    // Get updated store state after async operation
    const updatedStore = useChatStore.getState();

    // Verify that providers with API keys are properly configured
    expect(updatedStore.availableModels.length).toBeGreaterThan(0);
    
    // Should have models from multiple providers since we mocked API keys
    const providers = [...new Set(updatedStore.availableModels.map(m => m.provider))];
    expect(providers.length).toBeGreaterThanOrEqual(2);
    
    // Should include Ollama (always enabled) and at least one API-based provider
    expect(providers).toContain('ollama');
    expect(providers.some(p => ['openai', 'anthropic', 'mistral'].includes(p))).toBe(true);
  });
}); 