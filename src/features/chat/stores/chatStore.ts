import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { invoke } from '@tauri-apps/api/core';
import { OllamaService, ModelInfo } from '../../../services/ollamaService';
import { LLMProviderManager, LLMModel, LLMProvider, LLMMessage } from '../../../services/llmProviders';
import { logger } from '../../../core/lib/logger';

// Types that match the UI component interfaces
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isPinned?: boolean;
  participants: number;
}

// Backend API types
interface ChatMessageApi {
  id: string;
  session_id: string;
  content: string;
  role: string; // "user" or "assistant"
  timestamp: string;
}

interface ChatSessionApi {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

// Store state interface
interface ChatState {
  // Data
  conversations: ChatConversation[];
  messages: Record<string, ChatMessage[]>; // sessionId -> messages
  selectedConversationId: string | null;
  
  // Model selection
  availableModels: LLMModel[];
  selectedModel: string | null;
  selectedProvider: LLMProvider;
  isLoadingModels: boolean;
  
  // Conversation settings
  conversationSettings: {
    autoCleanResponses: boolean;
    maxResponseLength: number;
    makeConversational: boolean;
    showProcessingInfo: boolean;
  };
  
  // Per-model default settings
  modelDefaults: Record<string, {
    systemPrompt: string;
    creativity: number;
    maxTokens: number;
    autoCleanResponses: boolean;
    maxResponseLength: number;
    makeConversational: boolean;
    showProcessingInfo: boolean;
  }>;
  
  // Current session settings (can override model defaults)
  currentSessionSettings: {
    systemPrompt: string;
    creativity: number;
    maxTokens: number;
  };
  
  // UI State
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  searchQuery: string;
  
  // Actions
  // Conversations
  fetchConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<string>;
  deleteConversation: (conversationId: string) => Promise<void>;
  selectConversation: (conversationId: string | null) => void;
  togglePinConversation: (conversationId: string) => void;
  setSearchQuery: (query: string) => void;
  
  // Messages
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  regenerateResponse: (conversationId: string, messageId: string) => Promise<void>;
  generateTitle: (conversationId: string, firstMessage: string) => Promise<void>;
  
  // Model management
  fetchAvailableModels: (provider?: LLMProvider) => Promise<void>;
  setSelectedModel: (modelId: string) => Promise<void>;
  setSelectedProvider: (provider: LLMProvider) => void;
  
  // Conversation settings
  updateConversationSettings: (settings: Partial<ChatState['conversationSettings']>) => void;
  
  // Per-model settings
  updateCurrentSessionSettings: (settings: Partial<ChatState['currentSessionSettings']>) => void;
  saveAsModelDefault: (modelId: string) => void;
  loadModelDefaults: (modelId: string) => void;
  resetCurrentSession: () => void;
  resetModelDefaults: (modelId: string) => void;
  
  // Utilities
  clearError: () => void;
  reset: () => void;
}

// Helper functions for type conversion
const convertApiSessionToConversation = (session: ChatSessionApi, lastMessage = ''): ChatConversation => ({
  id: session.id,
  title: session.title,
  lastMessage,
  timestamp: new Date(session.updated_at).toISOString(),
  isPinned: false, // Backend doesn't store this yet, handle in UI state
  participants: 1
});

const convertApiMessageToChatMessage = (message: ChatMessageApi): ChatMessage => ({
  id: message.id,
  sender: message.role === 'user' ? 'user' : 'ai',
  content: message.content,
  timestamp: message.timestamp
});

// Initial state
const initialState = {
  conversations: [],
  messages: {},
  selectedConversationId: null,
  availableModels: [],
  selectedModel: null,
  selectedProvider: 'ollama' as LLMProvider,
  isLoadingModels: false,
  conversationSettings: {
    autoCleanResponses: true,
    maxResponseLength: 2000,
    makeConversational: true,
    showProcessingInfo: false
  },
  modelDefaults: {},
  currentSessionSettings: {
    systemPrompt: 'Respond in plain text only, without any markdown formatting. Do not use asterisks, underscores, or other formatting symbols. Present information in simple sentences and paragraphs.',
    creativity: 0.7,
    maxTokens: 2000
  },
  isLoading: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,
  searchQuery: '',
};

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Conversation actions
        async fetchConversations() {
          set({ isLoading: true, error: null });
          try {
            logger.debug('chatStore: Calling get_sessions...'); 
            const sessions: ChatSessionApi[] = await invoke('get_sessions');
            logger.debug('chatStore: Received sessions:', sessions); 
            
            // Convert API sessions to UI conversations
            const conversations = sessions.map(session => {
              // Get last message for this conversation
              const conversationMessages = get().messages[session.id] || [];
              const lastMessage = conversationMessages.length > 0 
                ? conversationMessages[conversationMessages.length - 1].content 
                : '';
              
              const converted = convertApiSessionToConversation(session, lastMessage); 
              logger.debug('chatStore: Converted session to conversation:', converted); 
              return converted;
            });

            set({ conversations, isLoading: false });
            logger.debug('chatStore: Conversations set in store. Total:', conversations.length); 
          } catch (error) {
            logger.error('chatStore: Failed to fetch conversations:', error); 
            set({ 
              error: 'Failed to load conversations', 
              isLoading: false 
            });
          }
        },

        async createConversation(title = 'New chat') {
          set({ isLoading: true, error: null });
          try {
            logger.debug('chatStore: Calling create_session with title:', title); 
            const sessionId: string = await invoke('create_session', { title });
            logger.debug('chatStore: Received new session ID:', sessionId); 
            
            // Create new conversation object
            const newConversation: ChatConversation = {
              id: sessionId,
              title,
              lastMessage: '',
              timestamp: new Date().toISOString(),
              isPinned: false,
              participants: 1
            };
            logger.debug('chatStore: Created new conversation object:', newConversation); 

            set(state => {
              state.conversations.unshift(newConversation);
              state.messages[sessionId] = [];
              state.isLoading = false;
            });
            logger.debug('chatStore: New conversation added to store.'); 

            return sessionId;
          } catch (error) {
            logger.error('chatStore: Failed to create conversation:', error); 
            set({ 
              error: 'Failed to create conversation', 
              isLoading: false 
            });
            throw error;
          }
        },

        async deleteConversation(conversationId: string) {
          console.log('🏪 chatStore deleteConversation called with ID:', conversationId);
          set({ error: null });
          try {
            const success: boolean = await invoke('delete_session', { sessionId: conversationId });
            console.log('🦀 Rust delete_session returned:', success);
            
            if (success) {
              console.log('✅ chatStore: Delete successful, updating store...');
              set(state => {
                // Remove conversation
                state.conversations = state.conversations.filter(c => c.id !== conversationId);
                // Remove messages
                delete state.messages[conversationId];
                // Clear selection if this conversation was selected
                if (state.selectedConversationId === conversationId) {
                  state.selectedConversationId = null;
                }
              });
            } else {
              console.error('❌ Backend returned false for delete operation');
              set({ error: 'Failed to delete conversation: Backend returned false' });
            }
          } catch (error) {
            console.error('❌ chatStore deleteConversation error:', error);
            set({ error: `Failed to delete conversation: ${error}` });
          }
        },

        selectConversation(conversationId: string | null) {
          set({ selectedConversationId: conversationId });
          
          // Auto-fetch messages if not already loaded
          if (conversationId && !get().messages[conversationId]) {
            get().fetchMessages(conversationId);
          }
        },

        togglePinConversation(conversationId: string) {
          set(state => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
              conversation.isPinned = !conversation.isPinned;
            }
          });
        },

        setSearchQuery(query: string) {
          set({ searchQuery: query });
        },

        // Message actions
        async fetchMessages(conversationId: string) {
          set({ isLoadingMessages: true, error: null });
          try {
            const apiMessages: ChatMessageApi[] = await invoke('get_session_messages', { 
              sessionIdStr: conversationId 
            });
            
            const messages = apiMessages.map(convertApiMessageToChatMessage);
            
            set(state => {
              state.messages[conversationId] = messages;
              state.isLoadingMessages = false;
            });
          } catch (error) {
            logger.error('Failed to fetch messages:', error);
            set({ 
              error: 'Failed to load messages', 
              isLoadingMessages: false 
            });
          }
        },

        async generateTitle(conversationId: string, firstMessage: string): Promise<void> {
          try {
            const providerManager = LLMProviderManager.getInstance();
            let { selectedProvider, selectedModel } = get();
            
            // Double-check provider matches model to avoid mismatches
            const modelInList = get().availableModels.find(m => m.id === selectedModel);
            if (modelInList && modelInList.provider !== selectedProvider) {
              selectedProvider = modelInList.provider;
            }
            
            // Create a prompt to generate a concise title
            const titlePrompt: LLMMessage[] = [
              {
                role: 'system' as const,
                content: 'Generate a concise 3-5 word title for this conversation based on the user\'s first message. Return only the title, no quotes, no punctuation.'
              },
              {
                role: 'user' as const,
                content: firstMessage
              }
            ];
            
            // Generate title using the current LLM
            const rawTitle = await providerManager.chat(selectedProvider, titlePrompt, selectedModel || undefined);
            
            // Clean and truncate the title
            const cleanTitle = rawTitle.trim().replace(/['"]/g, '').substring(0, 50);
            
            // Update the title in the backend
            await invoke('update_session_title', {
              sessionIdStr: conversationId,
              newTitle: cleanTitle
            });
            
            // Update the title in the frontend state
            set(state => {
              const conversation = state.conversations.find(c => c.id === conversationId);
              if (conversation) {
                conversation.title = cleanTitle;
              }
            });
            
            logger.debug('Generated title for conversation:', conversationId, cleanTitle);
          } catch (error) {
            logger.error('Failed to generate title:', error);
            // Don't throw - title generation failure shouldn't break the chat
          }
        },

        async sendMessage(conversationId: string, content: string) {
          if (!content.trim()) return;
          
          set({ isSending: true, error: null });
          
          try {
            // 1. Save user message to backend
            const userMessageApi: ChatMessageApi = await invoke('send_message', {
              sessionIdStr: conversationId,
              content: content.trim(),
              role: 'user'
            });

            const userMessage = convertApiMessageToChatMessage(userMessageApi);

            // 2. Add user message to UI immediately
            set(state => {
              if (!state.messages[conversationId]) {
                state.messages[conversationId] = [];
              }
              state.messages[conversationId].push(userMessage);
              
              // Update conversation's last message
              const conversation = state.conversations.find(c => c.id === conversationId);
              if (conversation) {
                conversation.lastMessage = content.trim();
                conversation.timestamp = new Date().toISOString();
              }
            });

            // 3. Get AI response from selected provider
            const providerManager = LLMProviderManager.getInstance();
            const conversationMessages = get().messages[conversationId] || [];
            
            // Convert to LLM format
            const llmMessages: LLMMessage[] = conversationMessages.map(msg => ({
              role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
              content: msg.content
            }));

            // Use selected provider and model
            let { selectedProvider, selectedModel, conversationSettings } = get();
            
            // Double-check provider matches model to avoid mismatches
            const modelInList = get().availableModels.find(m => m.id === selectedModel);
            if (modelInList && modelInList.provider !== selectedProvider) {
              selectedProvider = modelInList.provider;
              logger.warn('chatStore: Provider mismatch detected. Correcting to:', selectedProvider);
            }
            
            logger.debug('chatStore: Sending message with provider:', selectedProvider, 'model:', selectedModel);
            const rawAiResponse = await providerManager.chat(selectedProvider, llmMessages, selectedModel || undefined);

            // Clean up the AI response using the backend service
            const aiResponse = await invoke('clean_text', { text: rawAiResponse }) as string;
            
            // 4. Save AI response to backend
            const aiMessageApi: ChatMessageApi = await invoke('send_message', {
              sessionIdStr: conversationId,
              content: aiResponse,
              role: 'assistant'
            });

            const aiMessage = convertApiMessageToChatMessage(aiMessageApi);

            // 5. Add AI message to UI
            set(state => {
              state.messages[conversationId].push(aiMessage);
              
              // Update conversation's last message with truncated version
              const conversation = state.conversations.find(c => c.id === conversationId);
              if (conversation) {
                const truncatedLastMessage = aiResponse.length > 50 
                  ? aiResponse.substring(0, 50) + '...' 
                  : aiResponse;
                conversation.lastMessage = truncatedLastMessage;
                conversation.timestamp = new Date().toISOString();
              }
              
              state.isSending = false;
            });

            // 6. Generate title if this is the first message in the conversation
            const conversation = get().conversations.find(c => c.id === conversationId);
            if (conversation && conversation.title === 'New chat') {
              // Generate title asynchronously without blocking
              get().generateTitle(conversationId, content.trim());
            }

          } catch (error) {
            logger.error('Failed to send message:', error);
            set({ 
              error: 'Failed to send message', 
              isSending: false 
            });
          }
        },

        async regenerateResponse(conversationId: string, messageId: string) {
          const conversationMessages = get().messages[conversationId];
          if (!conversationMessages || conversationMessages.length < 2) {
            logger.warn('Cannot regenerate: no conversation history found');
            return;
          }

          // Find the last AI message and the user message before it
          let lastAiMessageIndex = -1;
          let lastUserMessage = '';
          
          for (let i = conversationMessages.length - 1; i >= 0; i--) {
            if (conversationMessages[i].id === messageId) {
              lastAiMessageIndex = i;
            } else if (conversationMessages[i].sender === 'user' && lastAiMessageIndex !== -1) {
              lastUserMessage = conversationMessages[i].content;
              break;
            }
          }

          if (lastAiMessageIndex === -1 || !lastUserMessage) {
            logger.warn('Cannot regenerate: no AI response to regenerate');
            return;
          }

          set({ isSending: true, error: null });

          try {
            // Remove the last AI message from UI
            set(state => {
              state.messages[conversationId].splice(lastAiMessageIndex, 1);
            });

            // Get conversation history up to the user message (excluding the removed AI response)
            const conversationHistory = get().messages[conversationId] || [];
            
            // Convert to LLM format
            const llmMessages: LLMMessage[] = conversationHistory.map(msg => ({
              role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
              content: msg.content
            }));

            // Generate new AI response
            const providerManager = LLMProviderManager.getInstance();
            const { selectedProvider, selectedModel, conversationSettings } = get();
            const rawAiResponse = await providerManager.chat(selectedProvider, llmMessages, selectedModel || undefined);

            // Clean up the AI response using the backend service
            const aiResponse = await invoke('clean_text', { text: rawAiResponse }) as string;
            
            // Save new AI response to backend
            const aiMessageApi: ChatMessageApi = await invoke('send_message', {
              sessionIdStr: conversationId,
              content: aiResponse,
              role: 'assistant'
            });

            const aiMessage = convertApiMessageToChatMessage(aiMessageApi);

            // Add new AI message to UI
            set(state => {
              state.messages[conversationId].push(aiMessage);
              
              // Update conversation's last message with truncated version
              const conversation = state.conversations.find(c => c.id === conversationId);
              if (conversation) {
                const truncatedLastMessage = aiResponse.length > 50 
                  ? aiResponse.substring(0, 50) + '...' 
                  : aiResponse;
                conversation.lastMessage = truncatedLastMessage;
                conversation.timestamp = new Date().toISOString();
              }
              
              state.isSending = false;
            });

          } catch (error) {
            logger.error('Failed to regenerate response:', error);
            set({ 
              error: 'Failed to regenerate response', 
              isSending: false 
            });
          }
        },

        // Model management actions
        async fetchAvailableModels(provider?: LLMProvider) {
          set({ isLoadingModels: true, error: null });
          try {
            // Get settings from settings store
            const { useSettingsStore } = await import('../../../stores/settingsStore');
            const settingsStore = useSettingsStore.getState();
            
            // Initialize provider manager with current settings
            const providerManager = LLMProviderManager.getInstance(settingsStore.integrations.apiKeys);
            const allModels = await providerManager.getAllModels();
            
            // Filter models to only include enabled ones
            const enabledModels = allModels.filter(model => {
              const providerEnabledModels = settingsStore.integrations.enabledModels?.[model.provider] || [];
              // If no models are specifically enabled for a provider, include all models (backward compatibility)
              // If specific models are enabled, only include those
              return providerEnabledModels.length === 0 || providerEnabledModels.includes(model.id);
            });
            
            set(state => {
              state.availableModels = enabledModels;
              state.isLoadingModels = false;
              
              // Auto-select first model if none selected or if current selection is not enabled
              const currentModelEnabled = enabledModels.find(m => m.id === state.selectedModel);
              if (!state.selectedModel || !currentModelEnabled) {
                if (enabledModels.length > 0) {
                  // Prioritize non-Ollama models that the user specifically enabled
                  const userEnabledModel = enabledModels.find(m => {
                    const providerEnabledModels = settingsStore.integrations.enabledModels?.[m.provider] || [];
                    return m.provider !== 'ollama' && providerEnabledModels.length > 0 && providerEnabledModels.includes(m.id);
                  });
                  
                  const modelToSelect = userEnabledModel || enabledModels[0];
                  state.selectedModel = modelToSelect.id;
                  state.selectedProvider = modelToSelect.provider;
                  logger.debug('chatStore: Auto-selected model:', modelToSelect.id, 'provider:', modelToSelect.provider);
                }
              }
            });
            
            logger.debug('chatStore: Fetched available models:', enabledModels);
          } catch (error) {
            logger.error('chatStore: Failed to fetch available models:', error);
            set({ 
              error: 'Failed to load available models', 
              isLoadingModels: false 
            });
          }
        },

        // Add method to refresh available models based on current settings
        refreshEnabledModels() {
          get().fetchAvailableModels();
        },

        async setSelectedModel(modelId: string) {
          // First, ensure we have the latest models
          if (get().availableModels.length === 0) {
            await get().fetchAvailableModels();
          }
          
          const currentState = get();
          set(state => {
            state.selectedModel = modelId;
            // Update provider based on selected model
            const model = state.availableModels.find(m => m.id === modelId);
            if (model) {
              state.selectedProvider = model.provider;
              logger.debug('chatStore: Updated provider to', model.provider, 'for model', modelId);
            } else {
              // Fallback: determine provider from model ID patterns
              let inferredProvider: LLMProvider = 'ollama';
              if (modelId.includes('gpt')) {
                inferredProvider = 'openai';
              } else if (modelId.includes('claude')) {
                inferredProvider = 'anthropic';
              } else if (modelId.includes('mistral') || modelId === 'open-mistral-nemo') {
                inferredProvider = 'mistral';
              } else if (modelId.includes('gemini')) {
                inferredProvider = 'gemini';
              } else if (modelId.includes('deepseek')) {
                inferredProvider = 'deepseek';
              }
              
              state.selectedProvider = inferredProvider;
              logger.warn('chatStore: Model not found in availableModels:', modelId);
              logger.warn('chatStore: Inferred provider:', inferredProvider);
              logger.debug('chatStore: Available models:', state.availableModels.map(m => m.id));
            }
            
            // Load model defaults if they exist
            const modelDefaults = state.modelDefaults[modelId];
            if (modelDefaults) {
              state.currentSessionSettings = {
                systemPrompt: modelDefaults.systemPrompt,
                creativity: modelDefaults.creativity,
                maxTokens: modelDefaults.maxTokens
              };
              state.conversationSettings = {
                autoCleanResponses: modelDefaults.autoCleanResponses,
                maxResponseLength: modelDefaults.maxResponseLength,
                makeConversational: modelDefaults.makeConversational,
                showProcessingInfo: modelDefaults.showProcessingInfo
              };
              logger.debug('chatStore: Loaded model defaults for:', modelId);
            }
          });
          logger.debug('chatStore: Selected model:', modelId);
        },

        setSelectedProvider(provider: LLMProvider) {
          set(state => {
            state.selectedProvider = provider;
            // Clear selected model when switching providers
            state.selectedModel = null;
            // Auto-select first model from new provider
            const providerModels = state.availableModels.filter(m => m.provider === provider);
            if (providerModels.length > 0) {
              state.selectedModel = providerModels[0].id;
            }
          });
          logger.debug('chatStore: Selected provider:', provider);
        },

        // Conversation settings
        updateConversationSettings(settings: Partial<ChatState['conversationSettings']>) {
          set(state => {
            state.conversationSettings = {
              ...state.conversationSettings,
              ...settings
            };
          });
        },

        // Per-model settings
        updateCurrentSessionSettings(settings: Partial<ChatState['currentSessionSettings']>) {
          set(state => {
            state.currentSessionSettings = {
              ...state.currentSessionSettings,
              ...settings
            };
          }),
          logger.debug('chatStore: Updated current session settings:', settings);
        },

        saveAsModelDefault(modelId: string) {
          set(state => {
            const model = state.availableModels.find(m => m.id === modelId);
            if (model) {
              state.modelDefaults[modelId] = {
                systemPrompt: state.currentSessionSettings.systemPrompt,
                creativity: state.currentSessionSettings.creativity,
                maxTokens: state.currentSessionSettings.maxTokens,
                autoCleanResponses: state.conversationSettings.autoCleanResponses,
                maxResponseLength: state.conversationSettings.maxResponseLength,
                makeConversational: state.conversationSettings.makeConversational,
                showProcessingInfo: state.conversationSettings.showProcessingInfo,
              };
              logger.debug('chatStore: Saved model defaults for:', modelId);
            }
          });
        },

        loadModelDefaults(modelId: string) {
          set(state => {
            const modelDefaults = state.modelDefaults[modelId];
            if (modelDefaults) {
              state.currentSessionSettings = modelDefaults;
              logger.debug('chatStore: Loaded model defaults for:', modelId);
            } else {
              logger.warn('chatStore: No model defaults found for:', modelId);
            }
          });
        },

        resetCurrentSession() {
          set(state => {
            state.currentSessionSettings = {
              systemPrompt: '',
              creativity: 0.7,
              maxTokens: 2000
            };
            logger.debug('chatStore: Reset current session settings.');
          });
        },

        resetModelDefaults(modelId: string) {
          set(state => {
            delete state.modelDefaults[modelId];
            logger.debug('chatStore: Reset model defaults for:', modelId);
          });
        },

        // Utility actions
        clearError() {
          set({ error: null });
        },

        reset() {
          set(initialState);
        }
      })),
      {
        name: 'chat-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist data, not loading states
          conversations: state.conversations,
          messages: state.messages,
          selectedConversationId: state.selectedConversationId,
          searchQuery: state.searchQuery,
          selectedModel: state.selectedModel, // Persist selected model
        })
      }
    ),
    { name: 'chat-store' }
  )
); 