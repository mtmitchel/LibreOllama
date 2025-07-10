import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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

export interface GoogleAccount {
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
  googleAccounts: Array<GoogleAccount>;
  apiKeys: {
    gemini?: string;
    anthropic?: string;
    openai?: string;
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

// Combined settings state
export interface SettingsState {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  ollama: OllamaSettings;
  integrations: IntegrationSettings;
  notifications: NotificationSettings;
  editor: EditorSettings;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Initialization flag
  isInitialized: boolean;
}

// Settings actions
export interface SettingsActions {
  // General actions
  updateGeneralSettings: (updates: Partial<GeneralSettings>) => void;
  updateAppearanceSettings: (updates: Partial<AppearanceSettings>) => void;
  updateOllamaSettings: (updates: Partial<OllamaSettings>) => void;
  updateIntegrationSettings: (updates: Partial<IntegrationSettings>) => void;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  updateEditorSettings: (updates: Partial<EditorSettings>) => void;
  
  // Specific actions
  setTheme: (theme: AppearanceSettings['theme']) => void;
  setOllamaEndpoint: (endpoint: string) => void;
  setStartupView: (view: string) => void;
  addGoogleAccount: (account: GoogleAccount) => void;
  removeGoogleAccount: (accountId: string) => void;
  setActiveGoogleAccount: (accountId: string) => void;
  setApiKey: (service: keyof IntegrationSettings['apiKeys'], key: string) => void;
  
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

        setApiKey: (service, key) => {
          set((state) => {
            state.integrations.apiKeys[service] = key;
          });
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
        integrations: state.integrations,
        notifications: state.notifications,
        editor: state.editor,
      }),
      // Restore loading/error states to defaults after rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.error = null;
          state.isInitialized = true;
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
export const useSetTheme = () => useSettingsStore((state) => state.setTheme);
export const useSetOllamaEndpoint = () => useSettingsStore((state) => state.setOllamaEndpoint);
export const useSetStartupView = () => useSettingsStore((state) => state.setStartupView);
export const useAddGoogleAccount = () => useSettingsStore((state) => state.addGoogleAccount);
export const useRemoveGoogleAccount = () => useSettingsStore((state) => state.removeGoogleAccount);
export const useSetActiveGoogleAccount = () => useSettingsStore((state) => state.setActiveGoogleAccount);
export const useSetApiKey = () => useSettingsStore((state) => state.setApiKey);
export const useResetToDefaults = () => useSettingsStore((state) => state.resetToDefaults);
export const useExportSettings = () => useSettingsStore((state) => state.exportSettings);
export const useImportSettings = () => useSettingsStore((state) => state.importSettings);
export const useClearError = () => useSettingsStore((state) => state.clearError);

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