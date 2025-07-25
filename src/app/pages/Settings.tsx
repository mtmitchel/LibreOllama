import React, { useState, useEffect } from 'react';
import {
  Cog,
  User,
  Bell,
  Palette,
  Cpu,
  Shield,
  Info,
  SlidersHorizontal,
  Link as LinkIcon,
  Download,
  RefreshCw,
  Trash2,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Card, Button, Input, Heading, Text, Checkbox } from '../../components/ui';
import { useHeader } from '../contexts/HeaderContext';
import { GoogleAuthModal } from '../../features/google/components/GoogleAuthModal';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import { useMailStore } from '../../features/mail/stores/mailStore';
import { 
  useGeneralSettings, 
  useAppearanceSettings, 
  useOllamaSettings, 
  useIntegrationSettings,
  useUpdateGeneralSettings,
  useUpdateAppearanceSettings,
  useSetTheme,
  useSetOllamaEndpoint,
  useSetActiveGoogleAccount,
  useRemoveGoogleAccount,
  useAddGoogleAccount,
  useRefreshGoogleAccount,
  useSetApiKey,
  useSettingsStore,
  useUpdateAIWritingSettings
} from '../../stores/settingsStore';
import { useChatStore } from '../../features/chat/stores/chatStore';
import { type LLMProvider } from '../../services/llmProviders';

// Design system aligned Toggle Switch Component
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  labelId?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, labelId }) => {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-labelledby={labelId}
      onClick={() => onChange(!enabled)}
      className="focus:ring-accent-primary relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        height: 'var(--space-6)',
        width: 'calc(var(--space-8) + var(--space-3))',
        backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--bg-tertiary)'
      }}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        aria-hidden="true"
        className="inline-block rounded-full shadow ring-0 transition duration-200 ease-in-out"
        style={{
          width: 'var(--space-5)',
          height: 'var(--space-5)',
          backgroundColor: 'white',
          transform: enabled ? 'translateX(var(--space-5))' : 'translateX(0)'
        }}
      />
    </button>
  );
};

// New component to handle image fetching with fallback
const UserAvatar = ({ src, alt }: { src?: string, alt: string }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!src) {
      setImgSrc(null);
      setError(false);
      return;
    }

    // Reset state when src changes
    setError(false);
    setLoading(true);
    
    // Use a proxy approach to avoid direct calls to Google's servers
    // This prevents HTTP 429 errors from rate limiting
    const img = new Image();
    img.onload = () => {
      setImgSrc(src);
      setLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setLoading(false);
    };
    
    // Add a small delay to prevent rapid requests
    const timeoutId = setTimeout(() => {
      img.src = src;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (loading) {
    return (
      <div className="flex size-10 animate-pulse items-center justify-center rounded-full bg-accent-ghost">
        <User size={20} className="text-accent-primary opacity-50" />
      </div>
    );
  }

  if (error || !imgSrc) {
    return (
      <div className="flex size-10 items-center justify-center rounded-full bg-accent-ghost">
        <User size={20} className="text-accent-primary" />
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={alt}
      className="size-10 rounded-full"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
};


const Settings: React.FC = () => {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [activeSection, setActiveSection] = useState('general');
  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState(false);
  
  // Settings from global store
  const generalSettings = useGeneralSettings();
  const appearanceSettings = useAppearanceSettings();
  const ollamaSettings = useOllamaSettings();
  const integrationSettings = useIntegrationSettings();
  const aiWritingSettings = useSettingsStore(state => state.aiWriting);
  const chatStore = useChatStore();
  
  // Individual action hooks
  const updateGeneralSettings = useUpdateGeneralSettings();
  const updateAppearanceSettings = useUpdateAppearanceSettings();
  const updateAIWritingSettings = useUpdateAIWritingSettings();
  const setTheme = useSetTheme();
  const setOllamaEndpoint = useSetOllamaEndpoint();
  const setActiveGoogleAccount = useSetActiveGoogleAccount();
  const removeGoogleAccount = useRemoveGoogleAccount();
  const addGoogleAccount = useAddGoogleAccount();
  const refreshGoogleAccount = useRefreshGoogleAccount();
  const setApiKey = useSetApiKey();
  const fetchAvailableModels = useChatStore(state => state.fetchAvailableModels);

  const [providerModels, setProviderModels] = useState<Record<string, { id: string, name: string, description?: string }[]>>({});
  const [selectedModels, setSelectedModels] = useState<Record<string, string[]>>({});
  const [apiOperations, setApiOperations] = useState<Record<string, { saving: boolean; success: boolean; error: string | null }>>({});
  const [modelOperations, setModelOperations] = useState<Record<string, { fetching: boolean; error: string | null }>>({});
  
  // Model management hooks
  const { fetchAvailableModels: fetchProviderModels, setEnabledModels, getEnabledModels } = useSettingsStore();
  
  // Google service stores for authentication
  const { authenticate: authenticateCalendar } = useGoogleCalendarStore();
  const { authenticate: authenticateTasks } = useGoogleTasksStore();
  const { addAccount: addGmailAccount } = useMailStore();
  
  // Google accounts from settings store
  const accounts = integrationSettings.googleAccounts;
  const activeAccount = accounts.find(acc => acc.isActive) || null;

  // Initialize enabled models on component mount
  useEffect(() => {
    // Load currently enabled models for each provider
    const providers: LLMProvider[] = ['openai', 'anthropic', 'openrouter', 'deepseek', 'mistral'];
    providers.forEach(provider => {
      try {
        const enabledModels = getEnabledModels(provider);
        setSelectedModels(prev => ({
          ...prev,
          [provider]: enabledModels
        }));
      } catch (error) {
        console.warn(`Failed to get enabled models for ${provider}:`, error);
        setSelectedModels(prev => ({
          ...prev,
          [provider]: []
        }));
      }
    });
  }, [getEnabledModels]);

  // Fetch available models when accessing agents-and-models section
  useEffect(() => {
    if (activeSection === 'agents-and-models' && chatStore.availableModels.length === 0) {
      fetchAvailableModels();
    }
  }, [activeSection, fetchAvailableModels, chatStore.availableModels.length]);

  const handleGoogleAuth = async (account: { id: string; email: string; name: string; picture: string }) => {
    // Add account to settings store with comprehensive information
    addGoogleAccount({
      id: account.id,
      email: account.email,
      name: account.name,
      picture: account.picture,
      isActive: accounts.length === 0, // Make first account active
      connectedAt: new Date().toISOString(),
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ],
      services: {
        gmail: true,
        calendar: true,
        tasks: true
      }
    });
    
    // Authenticate with all Google service stores would be called here
    // authenticateCalendar(account);
    // authenticateTasks(account);
    
    // Add account to Gmail store (expects specific format)
    await addGmailAccount({
      id: account.id,
      email: account.email,
      displayName: account.name,
      avatar: account.picture,
      accessToken: '', // Will be filled by actual auth flow
      refreshToken: '', // Will be filled by actual auth flow  
      tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      isActive: true,
      syncStatus: 'idle',
      lastSyncAt: new Date(),
    });
    
    setShowGoogleAuthModal(false);
  };

  // Model management functions
  const handleFetchModels = async (providerKey: string) => {
    const provider = providerKey as LLMProvider;
    
    setModelOperations(prev => ({
      ...prev,
      [provider]: { fetching: true, error: null }
    }));

    try {
      console.log(`Fetching models for provider: ${provider}`);
      const models = await fetchProviderModels(provider);
      console.log(`Fetched ${models.length} models for ${provider}:`, models);
      
      setProviderModels(prev => ({
        ...prev,
        [provider]: models
      }));
      
      // Initialize selected models with currently enabled ones
      const enabledModels = getEnabledModels(provider);
      setSelectedModels(prev => ({
        ...prev,
        [provider]: enabledModels
      }));
      
      setModelOperations(prev => ({
        ...prev,
        [provider]: { fetching: false, error: null }
      }));
    } catch (error) {
      console.error(`Error fetching models for ${provider}:`, error);
      setModelOperations(prev => ({
        ...prev,
        [provider]: { 
          fetching: false, 
          error: error instanceof Error ? error.message : 'Failed to fetch models'
        }
      }));
    }
  };

  const handleModelToggle = (providerKey: string, modelId: string) => {
    const provider = providerKey as LLMProvider;
    const currentSelected = selectedModels[provider] || [];
    const newSelected = currentSelected.includes(modelId)
      ? currentSelected.filter(id => id !== modelId)
      : [...currentSelected, modelId];
    
    setSelectedModels(prev => ({
      ...prev,
      [provider]: newSelected
    }));
    
    // Update the settings store
    setEnabledModels(provider, newSelected);
    console.log(`Updated enabled models for ${provider}:`, newSelected);
    
    // Refresh chat store to update available models
    fetchAvailableModels();
  };

  const handleSelectAllModels = (providerKey: string) => {
    const provider = providerKey as LLMProvider;
    const allModels = providerModels[provider] || [];
    const allModelIds = allModels.map(model => model.id);
    
    setSelectedModels(prev => ({
      ...prev,
      [provider]: allModelIds
    }));
    
    setEnabledModels(provider, allModelIds);
    console.log(`Selected all models for ${provider}:`, allModelIds);
    
    // Refresh chat store to update available models
    fetchAvailableModels();
  };

  const handleDeselectAllModels = (providerKey: string) => {
    const provider = providerKey as LLMProvider;
    setSelectedModels(prev => ({
      ...prev,
      [provider]: []
    }));
    
    setEnabledModels(provider, []);
    console.log(`Deselected all models for ${provider}`);
    
    // Refresh chat store to update available models
    fetchAvailableModels();
  };

  const navItems = [
    { id: 'general', label: 'General', icon: SlidersHorizontal },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'agents-and-models', label: 'Agents and models', icon: Cpu },
    { id: 'integrations', label: 'Integrations', icon: LinkIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security-and-privacy', label: 'Security and privacy', icon: Shield },
    { id: 'account', label: 'Account', icon: User },
    { id: 'about', label: 'About', icon: Info },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="h-full p-6">
            <Card className="p-6">
            <div className="mb-6">
              <Heading level={1}>General</Heading>
              <Text variant="muted">Configure general application preferences and behavior.</Text>
            </div>
            
            <div className="flex flex-col gap-8">
              <Card className="p-6">
                <Heading level={2}>Application Startup</Heading>
                <div className="flex flex-col gap-4">
                  <div className="border-border-default flex items-center justify-between border-b py-3">
                    <div className="flex-1">
                      <label htmlFor="startup-view" className="mb-1 block text-sm font-medium">Startup view</label>
                      <Text variant="muted" size="sm">Choose which module to open when you start the application.</Text>
                    </div>
                    {/* Select component removed */}
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <Text as="label" id="check-updates-label" weight="medium" className="mb-1 block">
                        Check for updates on startup
                      </Text>
                      <Text variant="muted" size="sm">
                        Automatically check for new versions when the application launches.
                      </Text>
                    </div>
                    <ToggleSwitch 
                      enabled={generalSettings.checkForUpdates} 
                      onChange={(enabled) => updateGeneralSettings({ checkForUpdates: enabled })} 
                      labelId="check-updates-label" 
                    />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <Heading level={2}>Regional Settings</Heading>
                <div className="flex flex-col gap-4">
                  <div className="border-border-default flex items-center justify-between border-b py-3">
                    <div className="flex-1">
                      <label htmlFor="language-select" className="mb-1 block text-sm font-medium">
                        Language
                      </label>
                      <Text variant="muted" size="sm">
                        Set the display language for the entire application.
                      </Text>
                    </div>
                    {/* Select component removed */}
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <label htmlFor="first-day-select" className="mb-1 block text-sm font-medium">
                        First day of the week
                      </label>
                      <Text variant="muted" size="sm">
                        Set the first day for calendars and date pickers.
                      </Text>
                    </div>
                    {/* Select component removed */}
                  </div>
                </div>
              </Card>
            </div>
          </Card>
          </div>
        );
      case 'agents-and-models':
        return (
          <div className="h-full p-6">
            <Card className="p-6">
            <div className="mb-6">
              <Heading level={1}>Agents and models</Heading>
              <Text variant="muted">Manage your local AI models and agent configurations.</Text>
            </div>
            <div className="flex flex-col gap-8">
              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <Heading level={2}>Ollama Server</Heading>
                  <div className="flex items-center gap-2 text-sm text-success">
                    <span className="size-2.5 rounded-full bg-success" />
                    Connected
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="ollama-endpoint" className="block text-sm font-medium">
                        Server endpoint
                      </label>
                      <Text variant="muted" size="sm">
                        The local URL where your Ollama instance is running.
                      </Text>
                    </div>
                    <div className="space-y-2">
                      <Input 
                        id="ollama-endpoint"
                        type="text" 
                        className="w-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        value={ollamaSettings.endpoint}
                        onChange={(e) => setOllamaEndpoint(e.target.value)}
                      />
                      <Text variant="muted" size="xs" className="text-right">
                        Default: http://localhost:11434
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Heading level={2}>Local Models</Heading>
                  <Button variant="outline" size="sm" className="gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <Download size={16} /> Pull a new model
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted">
                      <tr>
                        <th className="border-border-default border-b p-2 font-medium">Model Name</th>
                        <th className="border-border-default border-b p-2 font-medium">Size</th>
                        <th className="border-border-default border-b p-2 font-medium">Last Modified</th>
                        <th className="border-border-default border-b p-2 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[ /* Mock data for table */
                        { name: 'llama3:8b', size: '4.7 GB', modified: '2 weeks ago' },
                        { name: 'codellama:7b', size: '3.8 GB', modified: '1 month ago' },
                        { name: 'mixtral:latest', size: '26 GB', modified: '3 days ago' },
                      ].map(model => (
                        <tr key={model.name} className="border-border-subtle border-b">
                          <td className="whitespace-nowrap p-2 font-medium text-primary">{model.name}</td>
                          <td className="whitespace-nowrap p-2 text-muted">{model.size}</td>
                          <td className="whitespace-nowrap p-2 text-muted">{model.modified}</td>
                          <td className="whitespace-nowrap p-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-8 text-muted focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                title="Update model"
                              >
                                <RefreshCw size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-8 text-muted hover:bg-error-ghost hover:text-error focus:ring-2 focus:ring-error focus:ring-offset-2"
                                title="Remove model"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-6">
                <div className="mb-4">
                  <Heading level={2}>AI Writing Assistant</Heading>
                  <Text variant="muted" size="sm">Configure default settings for AI-powered writing tools.</Text>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="ai-provider" className="block text-sm font-medium">
                        Default AI Provider
                      </label>
                      <Text variant="muted" size="sm">
                        Choose the default AI provider for writing assistance.
                      </Text>
                    </div>
                    <div className="space-y-2">
                      <select
                        id="ai-provider"
                        value={aiWritingSettings.defaultProvider}
                        onChange={(e) => {
                          const newProvider = e.target.value as LLMProvider;
                          updateAIWritingSettings({ defaultProvider: newProvider });
                          // Fetch models for the new provider
                          chatStore.fetchAvailableModels(newProvider);
                        }}
                        className="w-full px-3 py-2 text-sm bg-surface border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-colors"
                      >
                        <option value="ollama">Ollama</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="mistral">Mistral</option>
                        <option value="gemini">Google Gemini</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="ai-model" className="block text-sm font-medium">
                        Default Model
                      </label>
                      <Text variant="muted" size="sm">
                        Select the default model for the chosen provider.
                      </Text>
                    </div>
                    <div className="space-y-2">
                      <select
                        id="ai-model"
                        value={aiWritingSettings.defaultModel || ''}
                        onChange={(e) => updateAIWritingSettings({ defaultModel: e.target.value || null })}
                        className="w-full px-3 py-2 text-sm bg-surface border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-colors"
                        disabled={chatStore.isLoadingModels}
                      >
                        <option value="">Auto-select</option>
                        {chatStore.isLoadingModels ? (
                          <option disabled>Loading models...</option>
                        ) : (
                          chatStore.availableModels
                            .filter((model: any) => model.provider === aiWritingSettings.defaultProvider)
                            .map((model: any) => (
                              <option key={model.id} value={model.id}>
                                {model.name}
                              </option>
                            ))
                        )}
                        {!chatStore.isLoadingModels && 
                         chatStore.availableModels.filter((model: any) => model.provider === aiWritingSettings.defaultProvider).length === 0 && (
                          <option disabled>No models available for {aiWritingSettings.defaultProvider}</option>
                        )}
                      </select>
                      {!chatStore.isLoadingModels && 
                       aiWritingSettings.defaultProvider === 'ollama' &&
                       chatStore.availableModels.filter((model: any) => model.provider === 'ollama').length === 0 && (
                        <Text variant="muted" size="xs" className="mt-1">
                          Make sure Ollama is running at {ollamaSettings.endpoint}
                        </Text>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="writing-style" className="block text-sm font-medium">
                        Writing Style
                      </label>
                      <Text variant="muted" size="sm">
                        Choose your preferred writing style for AI responses.
                      </Text>
                    </div>
                    <div className="space-y-2">
                      <select
                        id="writing-style"
                        value={aiWritingSettings.preferredStyle}
                        onChange={(e) => updateAIWritingSettings({ preferredStyle: e.target.value as 'concise' | 'detailed' | 'balanced' })}
                        className="w-full px-3 py-2 text-sm bg-surface border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-colors"
                      >
                        <option value="concise">Concise</option>
                        <option value="balanced">Balanced</option>
                        <option value="detailed">Detailed</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border-subtle">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Text as="label" id="auto-replace-label" weight="medium" className="mb-1 block">
                          Auto-replace for simple edits
                        </Text>
                        <Text variant="muted" size="sm">
                          Skip the preview modal for simple corrections like grammar fixes.
                        </Text>
                      </div>
                      <ToggleSwitch 
                        enabled={aiWritingSettings.autoReplace} 
                        onChange={(enabled) => updateAIWritingSettings({ autoReplace: enabled })} 
                        labelId="auto-replace-label" 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Text as="label" id="show-confidence-label" weight="medium" className="mb-1 block">
                          Show confidence scores
                        </Text>
                        <Text variant="muted" size="sm">
                          Display AI confidence levels for suggestions.
                        </Text>
                      </div>
                      <ToggleSwitch 
                        enabled={aiWritingSettings.showConfidenceScores} 
                        onChange={(enabled) => updateAIWritingSettings({ showConfidenceScores: enabled })} 
                        labelId="show-confidence-label" 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Text as="label" id="keep-history-label" weight="medium" className="mb-1 block">
                          Keep conversation history
                        </Text>
                        <Text variant="muted" size="sm">
                          Maintain context across multiple AI interactions.
                        </Text>
                      </div>
                      <ToggleSwitch 
                        enabled={aiWritingSettings.keepConversationHistory} 
                        onChange={(enabled) => updateAIWritingSettings({ keepConversationHistory: enabled })} 
                        labelId="keep-history-label" 
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-subtle">
                    <label htmlFor="max-response-length" className="block text-sm font-medium mb-2">
                      Maximum response length: {aiWritingSettings.maxResponseLength} characters
                    </label>
                    <input
                      id="max-response-length"
                      type="range"
                      min="100"
                      max="2000"
                      step="100"
                      value={aiWritingSettings.maxResponseLength}
                      onChange={(e) => updateAIWritingSettings({ maxResponseLength: parseInt(e.target.value) })}
                      className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-muted mt-1">
                      <span>100</span>
                      <span>2000</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
          </div>
        );
      case 'integrations':
        return (
          <div className="h-full p-6">
            <div className="mb-6">
              <Heading level={1}>Integrations</Heading>
              <Text variant="muted">Connect to external services and manage API keys.</Text>
            </div>
            <div className="flex flex-col gap-8">
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Heading level={2}>Google Accounts</Heading>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={() => setShowGoogleAuthModal(true)}
                  >
                    <LinkIcon size={16} /> Add Account
                  </Button>
                </div>
                <Text variant="muted" size="sm" className="mb-4">
                  Manage your Google accounts for Gmail, Calendar, and Tasks integration.
                </Text>
                
                {accounts.length === 0 ? (
                  <div className="border-border-default flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 text-center">
                    <Text weight="medium" className="mb-2">No Google accounts connected</Text>
                    <Text variant="muted" size="sm">
                      Connect a Google account to sync your Gmail, Calendar, and Tasks.
                    </Text>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((account) => (
                      <div key={account.id} className="border-border-default flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={account.picture} alt={account.name || account.email} />
                          <div>
                            <Text weight="medium">{account.name || account.email}</Text>
                            <Text variant="muted" size="sm">{account.email}</Text>
                          </div>
                          {activeAccount?.id === account.id && (
                            <div className="ml-3 flex items-center gap-1 rounded-full bg-success-ghost px-2 py-1 text-success">
                              <Check size={12} />
                              <Text size="xs">Active</Text>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {activeAccount?.id !== account.id && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setActiveGoogleAccount(account.id)}
                              className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                              Set Active
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeGoogleAccount(account.id)}
                            className="size-8 text-muted hover:bg-error-ghost hover:text-error focus:ring-2 focus:ring-error focus:ring-offset-2"
                            title="Remove Account"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              
              <div className="space-y-4">
                <Heading level={2}>LLM Providers</Heading>
                <Text variant="muted" size="sm">
                  Configure API keys for cloud-based language model providers. Some providers require a Base URL.
                </Text>
              </div>

              <div className="flex flex-col gap-6">
                  {[
                    {
                      key: 'openai' as keyof typeof integrationSettings.apiKeys,
                      label: 'OpenAI',
                      description: 'Access GPT models (GPT-4, GPT-3.5-turbo, etc.)',
                      placeholder: 'sk-...',
                      baseUrlPlaceholder: 'https://api.openai.com/v1',
                      website: 'https://platform.openai.com/api-keys'
                    },
                    {
                      key: 'anthropic' as keyof typeof integrationSettings.apiKeys,
                      label: 'Anthropic',
                      description: 'Access Claude models (Claude-3, Claude-2, etc.)',
                      placeholder: 'sk-ant-...',
                      baseUrlPlaceholder: 'https://api.anthropic.com/v1',
                      website: 'https://console.anthropic.com/'
                    },
                    {
                      key: 'openrouter' as keyof typeof integrationSettings.apiKeys,
                      label: 'OpenRouter',
                      description: 'Access many models through a single API (GPT, Claude, Llama, etc.)',
                      placeholder: 'sk-or-...',
                      baseUrlPlaceholder: 'https://openrouter.ai/api/v1',
                      website: 'https://openrouter.ai/keys'
                    },
                    {
                      key: 'deepseek' as keyof typeof integrationSettings.apiKeys,
                      label: 'DeepSeek',
                      description: 'Access DeepSeek models',
                      placeholder: 'sk-...',
                      baseUrlPlaceholder: 'https://api.deepseek.com/v1',
                      website: 'https://platform.deepseek.com/api_keys'
                    },
                    {
                      key: 'mistral' as keyof typeof integrationSettings.apiKeys,
                      label: 'Mistral AI',
                      description: 'Access Mistral models (Mistral-7B, Mixtral, etc.)',
                      placeholder: 'sk-...',
                      baseUrlPlaceholder: 'https://api.mistral.ai/v1',
                      website: 'https://console.mistral.ai/'
                    },
                    {
                      key: 'gemini' as keyof typeof integrationSettings.apiKeys,
                      label: 'Google Gemini',
                      description: 'Access Google\'s Gemini models',
                      placeholder: 'AIza...',
                      baseUrlPlaceholder: 'https://generativelanguage.googleapis.com/v1beta',
                      website: 'https://makersuite.google.com/app/apikey'
                    }
                  ].map((provider) => {
                    const config = integrationSettings.apiKeys[provider.key];
                    const currentValue = config?.key || '';
                    const baseUrl = config?.baseUrl || '';
                    const maskedValue = currentValue ? '••••••••••••••••' : '';
                    
                    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const newKey = formData.get(`${provider.key}-api-key`) as string;
                      const newBaseUrl = formData.get(`${provider.key}-base-url`) as string;

                      setApiOperations(prev => ({ ...prev, [provider.key]: { saving: true, success: false, error: null } }));
                      try {
                        // If the input is masked and unchanged, keep the existing key; otherwise use the new key
                        const keyToSave = (newKey === maskedValue && currentValue) ? currentValue : newKey;
                        await setApiKey(provider.key, keyToSave, newBaseUrl);
                        setApiOperations(prev => ({ ...prev, [provider.key]: { saving: false, success: true, error: null } }));
                        setTimeout(() => setApiOperations(prev => ({ ...prev, [provider.key]: { saving: false, success: false, error: null } })), 3000);
                      } catch (error) {
                        setApiOperations(prev => ({ ...prev, [provider.key]: { saving: false, success: false, error: error instanceof Error ? error.message : 'Failed to save' } }));
                      }
                    };
                    
                    const handleClear = async () => {
                      setApiOperations(prev => ({ ...prev, [provider.key]: { saving: true, success: false, error: null } }));
                      try {
                        await setApiKey(provider.key, '');
                        // Manually clear inputs
                        const form = document.getElementById(`${provider.key}-form`) as HTMLFormElement;
                        if(form) {
                            (form.elements.namedItem(`${provider.key}-api-key`) as HTMLInputElement).value = '';
                            (form.elements.namedItem(`${provider.key}-base-url`) as HTMLInputElement).value = '';
                        }
                        setProviderModels(prev => ({...prev, [provider.key]: []}));
                        setSelectedModels(prev => ({...prev, [provider.key]: []}));
                        setApiOperations(prev => ({ ...prev, [provider.key]: { saving: false, success: false, error: null } }));
                      } catch (error) {
                        setApiOperations(prev => ({ ...prev, [provider.key]: { saving: false, success: false, error: error instanceof Error ? error.message : 'Failed to clear' } }));
                      }
                    };

                    return (
                      <Card key={provider.key} className="p-0">
                        <div className="p-6">
                           <div className="flex items-start justify-between">
                            <div>
                              <Heading level={3} className="flex items-center gap-2">
                                {provider.label}
                                {currentValue && (
                                  <div className="flex items-center gap-1 rounded-full bg-success-ghost px-2 py-1 text-success">
                                    <Check size={12} />
                                    <Text size="xs">Configured</Text>
                                  </div>
                                )}
                              </Heading>
                              <Text variant="muted" size="sm">{provider.description}</Text>
                            </div>
                            <a 
                              href={provider.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="focus:ring-accent-primary inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border-none bg-transparent px-3 py-2 font-sans text-xs font-medium leading-none text-primary no-underline transition-all duration-150 hover:bg-tertiary hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary active:scale-95 active:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Get API key <LinkIcon size={12} className="ml-1" />
                            </a>
                          </div>
                        
                          <form id={`${provider.key}-form`} onSubmit={handleSave} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor={`${provider.key}-api-key`} className="text-sm font-medium">API Key</label>
                                <Input
                                  id={`${provider.key}-api-key`}
                                  name={`${provider.key}-api-key`}
                                  type="password"
                                  placeholder={provider.placeholder}
                                  defaultValue={maskedValue}
                                  autoComplete="new-password"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor={`${provider.key}-base-url`} className="text-sm font-medium">Base URL (optional)</label>
                                <Input
                                  id={`${provider.key}-base-url`}
                                  name={`${provider.key}-base-url`}
                                  type="text"
                                  placeholder={provider.baseUrlPlaceholder}
                                  defaultValue={baseUrl}
                                />
                            </div>
                            <div className="flex items-center gap-2 md:col-span-2 md:justify-end">
                               {currentValue && (
                                <Button type="button" variant="ghost" className="text-error hover:text-error" onClick={handleClear}>
                                  Clear
                                </Button>
                              )}
                              <Button type="submit" disabled={apiOperations[provider.key]?.saving}>
                                {apiOperations[provider.key]?.saving ? 'Saving...' : apiOperations[provider.key]?.success ? 'Saved!' : 'Save'}
                              </Button>
                            </div>
                          </form>
                        </div>
                        
                        {currentValue && (
                          <div className="border-border-default bg-background-secondary border-t p-6">
                            <div className="flex items-center justify-between">
                               <div>
                                <Heading level={4}>Model Management</Heading>
                                <Text variant="muted" size="sm">Choose which models to make available in chats.</Text>
                               </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleFetchModels(provider.key)}
                                  disabled={modelOperations[provider.key]?.fetching}
                                >
                                  {modelOperations[provider.key]?.fetching ? 'Loading...' : 'Load Models'}
                                </Button>
                            </div>

                            {modelOperations[provider.key]?.error && (
                              <Text size="sm" className="mt-2 text-error">{modelOperations[provider.key]?.error}</Text>
                            )}

                            {(providerModels[provider.key] || []).length > 0 && (
                              <div className="mt-4">
                                <div className="mb-2 flex items-center justify-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => handleSelectAllModels(provider.key)}>Select all</Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeselectAllModels(provider.key)}>Select none</Button>
                                </div>
                                <div className="border-border-default bg-background-primary grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-md border p-2 md:grid-cols-2">
                                  {(providerModels[provider.key] || []).map(model => (
                                    <label key={model.id} className="hover:bg-background-secondary flex items-center gap-3 rounded p-2 text-sm">
                                      <Checkbox
                                        checked={(selectedModels[provider.key] || []).includes(model.id)}
                                        onCheckedChange={() => handleModelToggle(provider.key, model.id)}
                                        id={`model-${provider.key}-${model.id}`}
                                      />
                                      <div className="min-w-0 flex-1">
                                         <span className="block truncate font-medium" title={model.name}>{model.name}</span>
                                         {model.description && <Text variant="muted" size="xs" className="truncate" title={model.description}>{model.description}</Text>}
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
              </div>
              
              <div className="border-border-primary bg-background-secondary mt-4 rounded-md border p-4">
                <h4 className="font-semibold">Local Models (Ollama)</h4>
                <p className="text-text-secondary text-sm">
                  Ollama models run locally and don't require API keys. These are managed in the Agents & Models section.
                </p>
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="h-full p-6">
            <Card className="p-6">
            <div className="mb-6">
              <Heading level={1}>Appearance</Heading>
              <Text variant="muted">Customize the visual appearance and theme of the application.</Text>
            </div>
            
            <div className="flex flex-col gap-8">
              <Card className="p-6">
                <Heading level={2}>Theme</Heading>
                <div className="flex flex-col gap-4">
                  <div className="border-border-default flex items-center justify-between border-b py-3">
                    <div className="flex-1">
                      <label htmlFor="theme-select" className="mb-1 block text-sm font-medium">
                        Color theme
                      </label>
                      <Text variant="muted" size="sm">
                        Choose between light, dark, or system preference.
                      </Text>
                    </div>
                    <div className="flex gap-2">
                      {(['light', 'dark', 'system'] as const).map((themeOption) => (
                        <Button
                          key={themeOption}
                          variant={appearanceSettings.theme === themeOption ? 'primary' : 'outline'}
                          size="sm"
                                                     onClick={() => setTheme(themeOption)}
                          className="capitalize"
                        >
                          {themeOption}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="border-border-default flex items-center justify-between border-b py-3">
                    <div className="flex-1">
                      <label htmlFor="font-size-select" className="mb-1 block text-sm font-medium">
                        Font size
                      </label>
                      <Text variant="muted" size="sm">
                        Adjust the base font size for better readability.
                      </Text>
                    </div>
                    <div className="flex gap-2">
                      {(['small', 'medium', 'large'] as const).map((sizeOption) => (
                        <Button
                          key={sizeOption}
                          variant={appearanceSettings.fontSize === sizeOption ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => updateAppearanceSettings({ fontSize: sizeOption })}
                          className="capitalize"
                        >
                          {sizeOption}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <label htmlFor="density-select" className="mb-1 block text-sm font-medium">
                        Interface density
                      </label>
                      <Text variant="muted" size="sm">
                        Control the spacing and padding throughout the interface.
                      </Text>
                    </div>
                    <div className="flex gap-2">
                      {(['compact', 'comfortable', 'spacious'] as const).map((densityOption) => (
                        <Button
                          key={densityOption}
                          variant={appearanceSettings.density === densityOption ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => updateAppearanceSettings({ density: densityOption })}
                          className="capitalize"
                        >
                          {densityOption}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
          </div>
        );
      default:
        return (
          <div className="h-full p-6">
            <Card className="p-6">
              <div className="flex h-full flex-col items-center justify-center text-muted">
                <Cog size={48} className="mb-4 opacity-50" />
                <Heading level={2} className="mb-2 text-xl font-semibold text-primary">
                  {navItems.find(item => item.id === activeSection)?.label}
                </Heading>
                <Text>
                  Settings for this section are not yet implemented.
                </Text>
              </div>
            </Card>
          </div>
        );
    }
  };

  useEffect(() => {
    // Clear header as Settings doesn't need a contextual header
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  return (
    <div className="flex h-full gap-6 bg-content p-6 lg:gap-8 lg:p-8">
      {/* Left Navigation */}
      <div className="w-64 shrink-0">
        <div className="border-border-default shadow-card h-full rounded-lg border bg-card p-4">
          <h3 className="mb-3 px-3 pt-1 text-base font-semibold text-primary">
            Categories
          </h3>
          <nav className="flex flex-col gap-1">
            {navItems.map(item => {
              const IconComponent = item.icon;
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(item.id);
                  }}
                  className={`focus:ring-offset-bg-tertiary flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    ${isActive 
                      ? 'bg-accent-ghost font-semibold text-accent-primary' 
                      : 'hover:bg-bg-tertiary text-muted hover:text-primary'
                    }`
                  }
                >
                  <IconComponent size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative min-w-0 flex-1 rounded-lg bg-tertiary">
        <div className="h-full">
          {renderSection()} 
        </div>

        {/* Google Authentication Modal - positioned relative to main content area */}
        {showGoogleAuthModal && (
          <div className="bg-bg-overlay absolute inset-0 z-50 flex items-center justify-center rounded-lg p-6">
            <div className="w-full max-w-md">
              <GoogleAuthModal
                isOpen={showGoogleAuthModal}
                onClose={() => setShowGoogleAuthModal(false)}
                onSuccess={handleGoogleAuth}
                title="Connect Google Account" 
                description="Sign in to sync your Gmail, Calendar, and Tasks with Google"
                icon={<LinkIcon size={24} className="text-accent-primary" />}
                scopes={[
          // Calendar permissions
          'https://www.googleapis.com/auth/calendar',
          // Tasks permissions  
          'https://www.googleapis.com/auth/tasks',
          // Gmail permissions
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.compose',
          'https://www.googleapis.com/auth/gmail.labels',
          // User profile permissions
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          // Drive metadata (for Gmail attachments)
          'https://www.googleapis.com/auth/drive.metadata.readonly'
        ]}
                isInlineModal={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;