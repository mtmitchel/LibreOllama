import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useMailStore } from '../features/mail/stores/mailStore';
import { logger } from '../core/lib/logger';
import { useGoogleCalendarStore } from './googleCalendarStore';
// Google Tasks now managed through unified task store
import { LLMProviderManager, type LLMProvider, LLMModel } from '../services/llmProviders';
import { invoke } from '@tauri-apps/api/core';

// Forward declaration for type
interface GoogleAccountSettings {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  isActive: boolean;
  connectedAt: string;
  scopes: string[];
  services: {
    gmail: boolean;
    calendar: boolean;
    tasks: boolean;
  };
}

// Helper function to load Google accounts from secure storage
async function loadGoogleAccountsFromSecureStorage(): Promise<GoogleAccountSettings[]> {
  try {
    // Use a default user ID for now - in production, this should come from user authentication
    const userId = 'default_user';
    const storedAccounts = await invoke('get_gmail_accounts_secure', { userId }) as Array<{
      id: string;
      email: string;
      name: string;
      picture?: string;
      scopes?: string[];
      connected_at?: string;
      is_active?: boolean;
    }>;
    
    return storedAccounts.map(account => ({
      id: account.id,
      email: account.email,
      name: account.name || account.email,
      picture: account.picture,
      isActive: account.is_active || false,
      connectedAt: account.connected_at || new Date().toISOString(),
      scopes: account.scopes || [],
      services: {
        gmail: true,
        calendar: true,
        tasks: true,
      }
    }));
  } catch (error) {
    logger.error('[Settings] Failed to load accounts from secure storage', error);
    return [];
  }
}

// Settings interfaces
export interface GeneralSettings {
  startupView: string;
  checkForUpdates: boolean;
  language: string;
  firstDayOfWeek: 'sunday' | 'monday';
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface OllamaSettings {
  endpoint: string;
  timeout: number;
  maxRetries: number;
  defaultModel: string;
}

export interface GoogleAccountSettings {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  isActive: boolean;
  connectedAt: string;
  scopes: string[];
  services: {
    gmail: boolean;
    calendar: boolean;
    tasks: boolean;
  };
}

export interface IntegrationSettings {
  googleAccounts: Array<GoogleAccountSettings>;
  apiKeys: {
    [key in LLMProvider]?: {
      key: string;
      baseUrl?: string;
    };
  };
  enabledModels: {
    [key in LLMProvider]?: string[];
  };
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  taskReminders: boolean;
  calendarReminders: boolean;
}

export interface EditorSettings {
  autoSave: boolean;
  spellCheck: boolean;
  wordWrap: boolean;
  lineNumbers: boolean;
  tabSize: number;
}

export interface AIWritingSettings {
  defaultProvider: LLMProvider;
  defaultModel: string | null;
  preferredStyle: 'concise' | 'detailed' | 'balanced';
  autoReplace: boolean;
  showConfidenceScores: boolean;
  keepConversationHistory: boolean;
  maxResponseLength: number;
}

// Combined settings state
export interface SettingsState {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  ollama: OllamaSettings;
  integrations: IntegrationSettings;
  notifications: NotificationSettings;
  editor: EditorSettings;
  aiWriting: AIWritingSettings;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Initialization flag
  isInitialized: boolean;
}

// Settings actions
export interface SettingsActions {
  initializeSettings: () => Promise<void>; // Moved here from SettingsState
  // General actions
  updateGeneralSettings: (updates: Partial<GeneralSettings>) => void;
  updateAppearanceSettings: (updates: Partial<AppearanceSettings>) => void;
  updateOllamaSettings: (updates: Partial<OllamaSettings>) => void;
  updateIntegrationSettings: (updates: Partial<IntegrationSettings>) => void;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  updateEditorSettings: (updates: Partial<EditorSettings>) => void;
  updateAIWritingSettings: (updates: Partial<AIWritingSettings>) => void;
  
  // Specific actions
  setTheme: (theme: AppearanceSettings['theme']) => void;
  setOllamaEndpoint: (endpoint: string) => void;
  setStartupView: (view: string) => void;
  addGoogleAccount: (account: GoogleAccountSettings) => void;
  removeGoogleAccount: (accountId: string) => void;
  setActiveGoogleAccount: (accountId: string) => void;
  refreshGoogleAccount: (accountId: string) => Promise<void>;
  setApiKey: (service: keyof IntegrationSettings['apiKeys'], key: string, baseUrl?: string) => Promise<void>;
  
  // Model management actions
  fetchAvailableModels: (provider: LLMProvider) => Promise<LLMModel[]>;
  setEnabledModels: (provider: LLMProvider, modelIds: string[]) => void;
  toggleModelEnabled: (provider: LLMProvider, modelId: string) => void;
  getEnabledModels: (provider: LLMProvider) => string[];
  
  // Utility actions
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => void;
  clearError: () => void;
  
  // Internal actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initialize: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

// Default settings
const defaultSettings: Omit<SettingsState, 'isLoading' | 'error' | 'isInitialized'> = {
  general: {
    startupView: '/',
    checkForUpdates: true,
    language: 'en',
    firstDayOfWeek: 'sunday',
  },
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    density: 'comfortable',
  },
  ollama: {
    endpoint: 'http://localhost:11434',
    timeout: 30000,
    maxRetries: 3,
    defaultModel: 'llama3:8b',
  },
  integrations: {
    googleAccounts: [],
    apiKeys: {},
    enabledModels: {},
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    taskReminders: true,
    calendarReminders: true,
  },
  editor: {
    autoSave: true,
    spellCheck: true,
    wordWrap: true,
    lineNumbers: false,
    tabSize: 2,
  },
  aiWriting: {
    defaultProvider: 'ollama' as LLMProvider,
    defaultModel: null,
    preferredStyle: 'balanced',
    autoReplace: false,
    showConfidenceScores: false,
    keepConversationHistory: false,
    maxResponseLength: 1000,
  },
};

// Create the settings store with persistence
export const useSettingsStore = create<SettingsStore>()(
  persist(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        ...defaultSettings,
        isLoading: false,
        error: null,
        isInitialized: false,

        // General settings actions
        updateGeneralSettings: (updates) => {
          set((state) => {
            Object.assign(state.general, updates);
          });
        },

        updateAppearanceSettings: (updates) => {
          set((state) => {
            Object.assign(state.appearance, updates);
          });
        },

        updateOllamaSettings: (updates) => {
          set((state) => {
            Object.assign(state.ollama, updates);
          });
        },

        updateIntegrationSettings: (updates) => {
          set((state) => {
            Object.assign(state.integrations, updates);
          });
        },

        updateNotificationSettings: (updates) => {
          set((state) => {
            Object.assign(state.notifications, updates);
          });
        },

        updateEditorSettings: (updates) => {
          set((state) => {
            Object.assign(state.editor, updates);
          });
        },

        updateAIWritingSettings: (updates) => {
          set((state) => {
            Object.assign(state.aiWriting, updates);
          });
        },

        // Specific actions
        setTheme: (theme) => {
          set((state) => {
            state.appearance.theme = theme;
          });
        },

        setOllamaEndpoint: (endpoint) => {
          set((state) => {
            state.ollama.endpoint = endpoint;
          });
        },

        setStartupView: (view) => {
          set((state) => {
            state.general.startupView = view;
          });
        },

        addGoogleAccount: (account) => {
          set((state) => {
            // If this is the first account, make it active
            if (state.integrations.googleAccounts.length === 0) {
              account.isActive = true;
            }
            state.integrations.googleAccounts.push(account);
          });
        },

        removeGoogleAccount: (accountId) => {
          set((state) => {
            const index = state.integrations.googleAccounts.findIndex(acc => acc.id === accountId);
            if (index !== -1) {
              const wasActive = state.integrations.googleAccounts[index].isActive;
              state.integrations.googleAccounts.splice(index, 1);
              
              // If we removed the active account, make the first remaining account active
              if (wasActive && state.integrations.googleAccounts.length > 0) {
                state.integrations.googleAccounts[0].isActive = true;
              }
            }
          });
        },

        setActiveGoogleAccount: (accountId) => {
          set((state) => {
            state.integrations.googleAccounts.forEach(account => {
              account.isActive = account.id === accountId;
            });
          });
        },

        refreshGoogleAccount: async (accountId) => {
          logger.debug(`[SETTINGS] Refreshing data for Google account: ${accountId}`);
          set(state => ({ isLoading: true, error: null }));
          try {
            const { refreshAccount } = useMailStore.getState();
            const { fetchCalendars, fetchEvents } = useGoogleCalendarStore.getState();
            // Tasks sync is now handled through unified store and realtime sync
            const fetchTaskLists = async () => {
              console.log('[Settings] Task lists fetched through unified store');
            };
            const syncAllTasks = async () => {
              const { realtimeSync } = await import('../services/realtimeSync');
              await realtimeSync.syncNow();
            };

            // Find the account to ensure it exists
            const account = get().integrations.googleAccounts.find(acc => acc.id === accountId);
            if (!account) {
              throw new Error('Account not found');
            }

            // Perform all refreshes in parallel
            await Promise.all([
              refreshAccount(accountId), // From mailStore
              fetchCalendars(accountId),       // From googleCalendarStore
              fetchEvents(undefined, undefined, accountId), // From googleCalendarStore
              fetchTaskLists(accountId),      // From googleTasksStore
              // syncAllTasks(), // This might be too broad, let's stick to list-based for now
            ]);

            logger.debug(`[SETTINGS] Successfully refreshed data for account: ${accountId}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during refresh';
            console.error(`❌ [SETTINGS] Failed to refresh account ${accountId}:`, errorMessage);
            set({ error: errorMessage });
          } finally {
            set({ isLoading: false });
          }
        },

        setApiKey: async (provider, key, baseUrl) => {
          // Ensure newKey is always a string. If the placeholder is used, retrieve the existing key.
          const newKey = key === '••••••••••••••••' 
            ? get().integrations.apiKeys[provider]?.key || '' // Fallback to empty string if no existing key
            : key;
          
          set(state => {
            // Ensure apiKeys object exists for the provider if not already there
            if (!state.integrations.apiKeys[provider]) {
              state.integrations.apiKeys[provider] = { key: newKey, baseUrl };
            } else {
              state.integrations.apiKeys[provider]!.key = newKey; // Asserting it's not undefined
              state.integrations.apiKeys[provider]!.baseUrl = baseUrl; // Update baseUrl
            }
          });
          
          await invoke('save_llm_provider_settings', { settings: get().integrations.apiKeys });
          
          // Re-initialize the provider manager with new settings
          LLMProviderManager.getInstance().reinitialize(get().integrations.apiKeys);
          logger.debug(`Set API key for ${provider}`);
        },

        // Model management actions
        fetchAvailableModels: async (provider: LLMProvider) => {
          try {
            const providerManager = LLMProviderManager.getInstance(get().integrations.apiKeys);
            const providerInstance = providerManager.getProvider(provider);
            
            if (!providerInstance) throw new Error(`Provider ${provider} not found.`);

            if (!providerInstance.isConfigured()) {
              throw new Error(`${provider} provider not configured. Please add your API key.`);
            }
            
            return await providerInstance.listModels();
          } catch (error) {
            logger.error(`Failed to fetch models for provider ${provider}:`, error);
            throw error;
          }
        },

        setEnabledModels: (provider, modelIds) => {
          set(state => {
            if (!state.integrations.enabledModels) {
              state.integrations.enabledModels = {};
            }
            state.integrations.enabledModels[provider] = modelIds;
          });
          invoke('set_enabled_models', { provider, modelIds });
        },

        toggleModelEnabled: (provider: LLMProvider, modelId: string) => {
          set((state) => {
            if (!state.integrations.enabledModels) {
              state.integrations.enabledModels = {};
            }
            const currentEnabled = state.integrations.enabledModels[provider] || [];
            if (currentEnabled.includes(modelId)) {
              state.integrations.enabledModels[provider] = currentEnabled.filter(id => id !== modelId);
            } else {
              state.integrations.enabledModels[provider] = [...currentEnabled, modelId];
            }
          });
        },

        getEnabledModels: (provider: LLMProvider) => {
          return get().integrations.enabledModels?.[provider] || [];
        },

        // Utility actions
        resetToDefaults: () => {
          set((state) => {
            Object.assign(state, defaultSettings);
          });
        },

        exportSettings: () => {
          const state = get();
          const exportData = {
            general: state.general,
            appearance: state.appearance,
            ollama: state.ollama,
            integrations: state.integrations,
            notifications: state.notifications,
            editor: state.editor,
          };
          return JSON.stringify(exportData, null, 2);
        },

        importSettings: (settingsJson) => {
          try {
            const importedSettings = JSON.parse(settingsJson);
            set((state) => {
              // Validate and merge imported settings
              if (importedSettings.general) Object.assign(state.general, importedSettings.general);
              if (importedSettings.appearance) Object.assign(state.appearance, importedSettings.appearance);
              if (importedSettings.ollama) Object.assign(state.ollama, importedSettings.ollama);
              if (importedSettings.integrations) Object.assign(state.integrations, importedSettings.integrations);
              if (importedSettings.notifications) Object.assign(state.notifications, importedSettings.notifications);
              if (importedSettings.editor) Object.assign(state.editor, importedSettings.editor);
            });
          } catch (error) {
            get().setError('Failed to import settings: Invalid JSON format');
          }
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // Internal actions
        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },

        initialize: () => {
          set((state) => {
            state.isInitialized = true;
          });
        },

        initializeSettings: async () => {
          if (get().isInitialized) return;

          try {
            const apiKeys = await invoke('get_llm_provider_settings') as IntegrationSettings['apiKeys'];
            const enabledModels: IntegrationSettings['enabledModels'] = {};
            const providers: LLMProvider[] = ['ollama', 'openai', 'anthropic', 'openrouter', 'deepseek', 'mistral'];
            
            for (const provider of providers) {
              // Check if the provider has an API key configured before trying to fetch models
              if (apiKeys[provider]?.key) {
                try {
                  const models = await invoke('get_enabled_models', { provider });
                  enabledModels[provider] = models as string[]; // Cast to string[]
                } catch (error) {
                  logger.warn(`Failed to retrieve enabled models for ${provider} during initialization:`, error);
                  // Continue even if fetching models for one provider fails
                }
              }
            }
            
            set(state => {
              state.integrations.apiKeys = apiKeys;
              state.integrations.enabledModels = enabledModels;
              state.isInitialized = true;
            });

            // Initialize manager with loaded settings
            LLMProviderManager.getInstance(get().integrations.apiKeys);

            logger.log('[SETTINGS] Settings initialized successfully.');
          } catch (error) {
            logger.error('[SETTINGS] Failed to initialize settings:', error);
            get().setError(error instanceof Error ? error.message : 'Unknown error during settings initialization');
          }
        },

      }))
    ),
    {
      name: 'libre-ollama-settings',
      version: 1,
      // Only persist the settings data, not loading/error states
      partialize: (state) => ({
        general: state.general,
        appearance: state.appearance,
        ollama: state.ollama,
        integrations: {
          // Don't persist googleAccounts - they contain sensitive data
          // These will be rehydrated from secure storage on startup
          apiKeys: state.integrations.apiKeys,
          enabledModels: state.integrations.enabledModels,
        },
        notifications: state.notifications,
        editor: state.editor,
        aiWriting: state.aiWriting,
      }),
      // Restore loading/error states to defaults after rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.error = null;
          state.isInitialized = true;
          
          // Ensure googleAccounts is initialized as empty array
          if (!state.integrations.googleAccounts) {
            state.integrations.googleAccounts = [];
          }
          
          // Load Google accounts from secure storage after rehydration
          loadGoogleAccountsFromSecureStorage().then(accounts => {
            if (accounts && accounts.length > 0) {
              useSettingsStore.setState(s => ({
                integrations: {
                  ...s.integrations,
                  googleAccounts: accounts
                }
              }));
              logger.info('[Settings] Loaded Google accounts from secure storage', { count: accounts.length });
            }
          }).catch(error => {
            logger.error('[Settings] Failed to load Google accounts from secure storage', error);
          });
        }
      },
    }
  )
);

// Selector hooks for specific settings sections
export const useGeneralSettings = () => useSettingsStore((state) => state.general);
export const useAppearanceSettings = () => useSettingsStore((state) => state.appearance);
export const useOllamaSettings = () => useSettingsStore((state) => state.ollama);
export const useIntegrationSettings = () => useSettingsStore((state) => state.integrations);
export const useNotificationSettings = () => useSettingsStore((state) => state.notifications);
export const useEditorSettings = () => useSettingsStore((state) => state.editor);

// Specific value selectors
export const useTheme = () => useSettingsStore((state) => state.appearance.theme);
export const useOllamaEndpoint = () => useSettingsStore((state) => state.ollama.endpoint);
export const useStartupView = () => useSettingsStore((state) => state.general.startupView);
export const useActiveGoogleAccount = () => 
  useSettingsStore((state) => state.integrations.googleAccounts.find(acc => acc.isActive));

// Action selectors with stable references
export const useUpdateGeneralSettings = () => useSettingsStore((state) => state.updateGeneralSettings);
export const useUpdateAppearanceSettings = () => useSettingsStore((state) => state.updateAppearanceSettings);
export const useUpdateOllamaSettings = () => useSettingsStore((state) => state.updateOllamaSettings);
export const useUpdateIntegrationSettings = () => useSettingsStore((state) => state.updateIntegrationSettings);
export const useUpdateNotificationSettings = () => useSettingsStore((state) => state.updateNotificationSettings);
export const useUpdateEditorSettings = () => useSettingsStore((state) => state.updateEditorSettings);
export const useUpdateAIWritingSettings = () => useSettingsStore((state) => state.updateAIWritingSettings);
export const useSetTheme = () => useSettingsStore((state) => state.setTheme);
export const useSetOllamaEndpoint = () => useSettingsStore((state) => state.setOllamaEndpoint);
export const useSetStartupView = () => useSettingsStore((state) => state.setStartupView);
export const useAddGoogleAccount = () => useSettingsStore((state) => state.addGoogleAccount);
export const useRemoveGoogleAccount = () => useSettingsStore((state) => state.removeGoogleAccount);
export const useSetActiveGoogleAccount = () => useSettingsStore((state) => state.setActiveGoogleAccount);
export const useRefreshGoogleAccount = () => useSettingsStore((state) => state.refreshGoogleAccount);
export const useSetApiKey = () => useSettingsStore((state) => state.setApiKey);
export const useResetToDefaults = () => useSettingsStore((state) => state.resetToDefaults);
export const useExportSettings = () => useSettingsStore((state) => state.exportSettings);
export const useImportSettings = () => useSettingsStore((state) => state.importSettings);
export const useClearError = () => useSettingsStore((state) => state.clearError);
export const useSetEnabledModels = () => useSettingsStore((state) => state.setEnabledModels);
export const useGetEnabledModels = () => useSettingsStore((state) => state.getEnabledModels);
export const useFetchAvailableModels = () => useSettingsStore((state) => state.fetchAvailableModels);
export const useInitializeSettings = () => useSettingsStore((state) => state.initializeSettings);

// Backward compatibility - but this creates new objects on every render, avoid in components
export const useSettingsActions = () => useSettingsStore((state) => ({
  updateGeneralSettings: state.updateGeneralSettings,
  updateAppearanceSettings: state.updateAppearanceSettings,
  updateOllamaSettings: state.updateOllamaSettings,
  updateIntegrationSettings: state.updateIntegrationSettings,
  updateNotificationSettings: state.updateNotificationSettings,
  updateEditorSettings: state.updateEditorSettings,
  setTheme: state.setTheme,
  setOllamaEndpoint: state.setOllamaEndpoint,
  setStartupView: state.setStartupView,
  addGoogleAccount: state.addGoogleAccount,
  removeGoogleAccount: state.removeGoogleAccount,
  setActiveGoogleAccount: state.setActiveGoogleAccount,
  setApiKey: state.setApiKey,
  resetToDefaults: state.resetToDefaults,
  exportSettings: state.exportSettings,
  importSettings: state.importSettings,
  clearError: state.clearError,
})); 