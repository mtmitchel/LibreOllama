import React, { useState, useEffect, useCallback } from 'react';
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
  Check,
  X,
  Sparkles,
  CheckCircle,
  UserMinus,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../../components/ui/design-system/Button';
import { Card } from '../../components/ui/design-system/Card';
import { Input, Heading, Text, Checkbox } from '../../components/ui';
import { SimpleDialog as ConfirmationModal } from '../../components/ui/design-system';
import { useHeader } from '../contexts/HeaderContext';
import { GoogleAuthModal } from '../../features/google/components/GoogleAuthModal';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
// Google Tasks now managed through unified task store
import { useMailStore } from '../../features/mail/stores/mailStore';
import { Page, PageContent, PageCard, PageBody } from '../../components/ui/design-system/Page';
import { ToggleRow } from '../../components/ui/design-system/Toggle';
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
import { useSearchParams } from 'react-router-dom';
import { ollamaService, type ModelInfo } from '../../services/ollamaService';

// Removed custom ToggleSwitch in favor of design-system ToggleRow

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
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('general');
  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState<{ id: string; email: string } | null>(null);
  
  // Handle URL parameters for direct navigation
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'account') {
      setActiveSection('account');
    }
  }, [searchParams]);
  
  // Settings from global store
  const generalSettings = useGeneralSettings();
  const appearanceSettings = useAppearanceSettings();
  const ollamaSettings = useOllamaSettings();
  const integrationSettings = useIntegrationSettings();
  const aiWritingSettings = useSettingsStore(state => state.aiWriting);
  const chatStore = useChatStore();
  const isTauri = typeof window !== 'undefined' && (
    // Tauri v2 global
    (window as any).__TAURI__ ||
    // Some builds expose internals
    (window as any).__TAURI_INTERNALS__ ||
    // Env flag injected by Vite when bundled for Tauri
    (import.meta as any)?.env?.TAURI_PLATFORM ||
    // UA fallback
    (navigator?.userAgent || '').toLowerCase().includes('tauri')
  );
  const [sectionsOpen, setSectionsOpen] = useState({ server: true, local: true, writing: true, cloud: true });
  const toggleSection = (key: 'server' | 'local' | 'writing' | 'cloud') => setSectionsOpen((s) => ({ ...s, [key]: !s[key] }));
  
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
  
  // Debug function to check database and clean test accounts
  const debugAndCleanDatabase = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      
      // Check database state
      const dbState = await invoke('debug_gmail_secure_table');
      console.log('[DEBUG] Database state:', dbState);
      
      // List all accounts in database
      const allAccounts = await invoke('debug_list_all_gmail_accounts');
      console.log('[DEBUG] All accounts in database:', allAccounts);
      
      // Check token expiration
      const tokenInfo = await invoke('debug_gmail_token_expiration');
      console.log('[DEBUG] Token expiration:', tokenInfo);
      
      // Remove test user if found
      const testAccount = accounts.find(acc => acc.email === 'test@gmail.com' || acc.name === 'Test User');
      if (testAccount) {
        console.log('[DEBUG] Found test account, removing:', testAccount);
        await removeGoogleAccount(testAccount.id);
        
        // Also clean from Gmail store
        const testGmailAccount = Object.values(gmailAccounts).find((acc) => acc.email === 'test@gmail.com');
        if (testGmailAccount) {
          await removeGmailAccount(testGmailAccount.id);
        }
      }
      
      // Refresh remaining accounts
      for (const account of accounts) {
        if (account.email !== 'test@gmail.com') {
          console.log('[DEBUG] Refreshing account:', account.email);
          await refreshGoogleAccount(account.id);
        }
      }
    } catch (error) {
      console.error('[DEBUG] Failed to check/clean database:', error);
    }
  };

  // Handler to set active account with confirmation
  const handleSetActiveAccount = async (accountId: string) => {
    try {
      await setActiveGoogleAccount(accountId);
      console.log('[Settings] Account set as active:', accountId);
    } catch (error) {
      console.error('[Settings] Failed to set active account:', error);
    }
  };

  // Handler to show remove account confirmation
  const handleRemoveAccount = (accountId: string, email: string) => {
    setAccountToRemove({ id: accountId, email });
  };

  // Handler to confirm account removal
  const confirmRemoveAccount = async () => {
    if (!accountToRemove) return;
    
    try {
      await removeGoogleAccount(accountToRemove.id);
      console.log('[Settings] Account removed:', accountToRemove.email);
      // Close dialog after successful removal
      setAccountToRemove(null);
    } catch (error) {
      console.error('[Settings] Failed to remove account:', error);
      const message = typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Unknown error');
      alert(`Failed to remove account: ${message}`);
    }
  };

  const [providerModels, setProviderModels] = useState<Record<string, { id: string, name: string, description?: string }[]>>({});
  const [selectedModels, setSelectedModels] = useState<Record<string, string[]>>({});
  const [apiOperations, setApiOperations] = useState<Record<string, { saving: boolean; success: boolean; error: string | null }>>({});
  const [modelOperations, setModelOperations] = useState<Record<string, { fetching: boolean; error: string | null }>>({});
  
  // Model management hooks
  const { fetchAvailableModels: fetchProviderModels, setEnabledModels, getEnabledModels } = useSettingsStore();
  
  // Google service stores for authentication
  const { authenticate: authenticateCalendar } = useGoogleCalendarStore();
  // Tasks authentication is now handled through settings store
  const authenticateTasks = async () => {
    console.log('[Settings] Tasks auth handled through Google account management');
  };
  const { addAccount: addGmailAccount, accounts: gmailAccounts, removeAccount: removeGmailAccount } = useMailStore();
  
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

  // Fetch available models when accessing agents-and-models section or agents-and-models-2 (AI Writing)
  useEffect(() => {
    if (activeSection === 'agents-and-models' || activeSection === 'agents-and-models-2') {
      // Always fetch all models when entering these sections
      fetchAvailableModels();
    }
  }, [activeSection, fetchAvailableModels]);

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
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security-and-privacy', label: 'Security and privacy', icon: Shield },
    { id: 'account', label: 'Account', icon: User },
    { id: 'about', label: 'About', icon: Info },
  ];

  // Local models state (Ollama)
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [localModels, setLocalModels] = useState<ModelInfo[]>([]);
  const [pullStatus, setPullStatus] = useState<string | null>(null);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [isPullDialogOpen, setIsPullDialogOpen] = useState(false);
  const [pullModelName, setPullModelName] = useState('');
  const [isPulling, setIsPulling] = useState(false);

  const fetchLocalModels = useCallback(async () => {
    try {
      setModelsLoading(true);
      setModelsError(null);
      let models = await ollamaService.listModels();
      if (!models || models.length === 0) {
        // Fallback to the same discovery path used by Chat model selector
        try {
          await chatStore.fetchAvailableModels();
          const chatModels = useChatStore.getState().availableModels
            .filter((m: any) => m.provider === 'ollama');
          if (chatModels.length > 0) {
            models = chatModels.map((m: any) => ({ name: m.name || m.id })) as ModelInfo[];
          }
        } catch {}
      }
      setLocalModels(models || []);
    } catch (err: any) {
      // If invoke failed (e.g., not a Tauri build), show a neutral message
      const msg = String(err?.message || err || '')
        .replace(/InvokeError:\s*/i, '')
        .trim();
      setModelsError(msg || 'Failed to load local models');
      setLocalModels([]);
    } finally {
      setModelsLoading(false);
    }
  }, [chatStore]);

  const handleConfirmDeleteModel = useCallback(async () => {
    if (!modelToDelete) return;
    try {
      await ollamaService.deleteModel(modelToDelete);
      await fetchLocalModels();
    } catch (e) {
      console.error('Failed to delete model', e);
    } finally {
      setModelToDelete(null);
    }
  }, [modelToDelete, fetchLocalModels]);

  const startPullModel = useCallback(async () => {
    if (!isTauri || !pullModelName.trim()) return;
    setIsPulling(true);
    setPullStatus('Starting pull...');
    try {
      await ollamaService.pullModel(pullModelName.trim(), (p) => {
        if (p.total && p.completed) {
          const pct = Math.floor((p.completed / p.total) * 100);
          setPullStatus(`${p.status || 'Pulling'} ${pct}%`);
        } else {
          setPullStatus(p.status || 'Pulling...');
        }
      });
      setPullStatus('Pull complete');
      await fetchLocalModels();
      setTimeout(() => setPullStatus(null), 1200);
      setIsPullDialogOpen(false);
      setPullModelName('');
    } catch (e: any) {
      setPullStatus(`Failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setIsPulling(false);
    }
  }, [isTauri, pullModelName, fetchLocalModels]);

  useEffect(() => {
    // Load on first mount and whenever the section becomes active
    if (activeSection === 'agents-and-models') {
      fetchLocalModels();
    }
  }, [activeSection, fetchLocalModels]);

  

  const handleDeleteModel = useCallback((name: string) => {
    setModelToDelete(name);
  }, []);

  const formatBytes = (bytes?: number | string): string => {
    if (bytes == null) return '—';
    if (typeof bytes === 'string') return bytes;
    const thresh = 1024;
    if (Math.abs(bytes) < thresh) return `${bytes} B`;
    const units = ['KB','MB','GB','TB'];
    let u = -1;
    let b = bytes;
    do { b /= thresh; ++u; } while (Math.abs(b) >= thresh && u < units.length - 1);
    return `${b.toFixed(1)} ${units[u]}`;
  };

  const formatWhen = (iso?: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <PageCard>
            <PageBody>
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
                  <ToggleRow
                    label="Check for updates on startup"
                    description="Automatically check for new versions when the application launches."
                    checked={generalSettings.checkForUpdates}
                    onChange={(enabled) => updateGeneralSettings({ checkForUpdates: enabled })}
                  />
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
            </PageBody>
          </PageCard>
        );
      case 'agents-and-models':
        return (
          <PageCard>
            <PageBody>
            <div className="mb-6">
              <Heading level={1}>Agents and models</Heading>
              <Text variant="muted">Manage your local AI models and agent configurations.</Text>
            </div>
            <div className="flex flex-col gap-8">
              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-expanded={sectionsOpen.server}
                      onClick={() => toggleSection('server')}
                      className={`transition-transform text-secondary p-1 rounded hover:bg-secondary ${sectionsOpen.server ? '' : '-rotate-90'}`}
                      title={sectionsOpen.server ? 'Collapse' : 'Expand'}
                    >
                      <ChevronDown size={20} />
                    </button>
                    <Heading level={2}>Ollama Server</Heading>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-success">
                    <span className="size-2.5 rounded-full bg-success" />
                    Connected
                  </div>
                </div>
                {sectionsOpen.server && (
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
                )}
              </Card>

              {/* Delete Local Model Confirmation */}
              <ConfirmationModal
                open={!!modelToDelete}
                onOpenChange={(open) => { if (!open) setModelToDelete(null); }}
                title="Delete local model"
                description={modelToDelete ? `Delete model "${modelToDelete}" from local storage? This cannot be undone.` : ''}
                footer={(
                  <div className="flex items-center justify-end gap-2 w-full">
                    <Button variant="ghost" onClick={() => setModelToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleConfirmDeleteModel}>Delete</Button>
                  </div>
                )}
                size="sm"
              />

              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-expanded={sectionsOpen.local}
                      onClick={() => toggleSection('local')}
                      className={`transition-transform text-secondary p-1 rounded hover:bg-secondary ${sectionsOpen.local ? '' : '-rotate-90'}`}
                      title={sectionsOpen.local ? 'Collapse' : 'Expand'}
                    >
                      <ChevronDown size={20} />
                    </button>
                    <Heading level={2}>Local models</Heading>
                  </div>
                  <div className="flex items-center gap-2">
                    {pullStatus && <Text size="sm" className="text-secondary">{pullStatus}</Text>}
                    <Button onClick={() => setIsPullDialogOpen(true)} variant="outline" size="sm" className="gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2">
                      <Download size={16} /> Pull a new model
                    </Button>
                  </div>
                </div>
                {sectionsOpen.local && (modelsError ? (
                  <Text size="sm" className="text-error">{modelsError}</Text>
                ) : modelsLoading ? (
                  <Text size="sm" className="text-secondary">Loading models…</Text>
                ) : localModels.length === 0 ? (
                  <Text size="sm" className="text-secondary">No local models found</Text>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-muted">
                        <tr>
                          <th className="border-border-default border-b p-2 font-medium">Model</th>
                          <th className="border-border-default border-b p-2 font-medium">Size</th>
                          <th className="border-border-default border-b p-2 font-medium">Last modified</th>
                          <th className="border-border-default border-b p-2 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {localModels.map(model => (
                          <tr key={model.name} className="border-border-subtle border-b">
                            <td className="whitespace-nowrap p-2 font-medium text-primary">{model.name}</td>
                            <td className="whitespace-nowrap p-2 text-muted">{formatBytes(model.size)}</td>
                            <td className="whitespace-nowrap p-2 text-muted">{formatWhen(model.modified_at)}</td>
                            <td className="whitespace-nowrap p-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-8 text-muted hover:bg-error-ghost hover:text-error focus:ring-2 focus:ring-error focus:ring-offset-2"
                                  title="Remove model"
                                  onClick={() => handleDeleteModel(model.name)}
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
                ))}
              </Card>

              {/* Delete Local Model Confirmation */}
              <ConfirmationModal
                open={!!modelToDelete}
                onOpenChange={(open) => { if (!open) setModelToDelete(null); }}
                title="Delete local model"
                description={modelToDelete ? `Delete model "${modelToDelete}" from local storage? This cannot be undone.` : ''}
                footer={(
                  <div className="flex items-center justify-end gap-2 w-full">
                    <Button variant="ghost" onClick={() => setModelToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleConfirmDeleteModel}>Delete</Button>
                  </div>
                )}
                size="sm"
              />

              {/* Pull Model Dialog (Design System) */}
              <ConfirmationModal
                open={isPullDialogOpen}
                onOpenChange={(open) => { setIsPullDialogOpen(open); if (!open) { setPullModelName(''); setPullStatus(null); setIsPulling(false); } }}
                title="Pull a model"
                description="Enter an Ollama model name to download (e.g., llama3:8b)."
                footer={(
                  <div className="flex items-center justify-end gap-2 w-full">
                    <Button variant="ghost" onClick={() => setIsPullDialogOpen(false)} disabled={isPulling}>Cancel</Button>
                    <Button onClick={startPullModel} disabled={isPulling || !pullModelName.trim()}>
                      {isPulling ? 'Pulling…' : 'Pull model'}
                    </Button>
                  </div>
                )}
                size="sm"
              >
                <div className="space-y-2">
                  <label htmlFor="pull-model-input" className="text-sm font-medium">Model name</label>
                  <Input
                    id="pull-model-input"
                    value={pullModelName}
                    onChange={(e) => setPullModelName(e.target.value)}
                    placeholder="llama3:8b"
                    disabled={isPulling}
                  />
                  {pullStatus && (
                    <Text size="sm" className="text-secondary">{pullStatus}</Text>
                  )}
                </div>
              </ConfirmationModal>

              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-expanded={sectionsOpen.writing}
                      onClick={() => toggleSection('writing')}
                      className={`transition-transform text-secondary p-1 rounded hover:bg-secondary ${sectionsOpen.writing ? '' : '-rotate-90'}`}
                      title={sectionsOpen.writing ? 'Collapse' : 'Expand'}
                    >
                      <ChevronDown size={20} />
                    </button>
                    <Heading level={2}>AI Writing Assistant</Heading>
                  </div>
                  <Text variant="muted" size="sm" className="hidden md:block">Configure default settings for AI-powered writing tools.</Text>
                </div>
                
                {sectionsOpen.writing && (
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
                        onChange={async (e) => {
                          const newProvider = e.target.value as LLMProvider;
                          updateAIWritingSettings({ defaultProvider: newProvider, defaultModel: null });
                          // Fetch all models first, then filter by provider
                          await chatStore.fetchAvailableModels();
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
                    <ToggleRow
                      label="Auto-replace for simple edits"
                      description="Skip the preview modal for simple corrections like grammar fixes."
                      checked={aiWritingSettings.autoReplace}
                      onChange={(enabled) => updateAIWritingSettings({ autoReplace: enabled })}
                    />
                    <ToggleRow
                      label="Show confidence scores"
                      description="Display AI confidence levels for suggestions."
                      checked={aiWritingSettings.showConfidenceScores}
                      onChange={(enabled) => updateAIWritingSettings({ showConfidenceScores: enabled })}
                    />
                    <ToggleRow
                      label="Keep conversation history"
                      description="Maintain context across multiple AI interactions."
                      checked={aiWritingSettings.keepConversationHistory}
                      onChange={(enabled) => updateAIWritingSettings({ keepConversationHistory: enabled })}
                    />
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
                )}
              </Card>

    {/* Cloud providers (API keys and model enablement) */}
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-expanded={sectionsOpen.cloud}
            onClick={() => toggleSection('cloud')}
            className={`transition-transform text-secondary p-1 rounded hover:bg-secondary ${sectionsOpen.cloud ? '' : '-rotate-90'}`}
            title={sectionsOpen.cloud ? 'Collapse' : 'Expand'}
          >
            <ChevronDown size={20} />
          </button>
          <Heading level={2}>Cloud providers</Heading>
        </div>
      </div>

      {sectionsOpen.cloud && (
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
            description: "Access Google's Gemini models",
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
              const form = document.getElementById(`${provider.key}-form`) as HTMLFormElement;
              if (form) {
                const keyInput = form.querySelector(`input[name="${provider.key}-api-key"]`) as HTMLInputElement;
                const urlInput = form.querySelector(`input[name="${provider.key}-base-url"]`) as HTMLInputElement;
                if (keyInput) keyInput.value = '';
                if (urlInput) urlInput.value = '';
              }
              setApiOperations(prev => ({ ...prev, [provider.key]: { saving: false, success: true, error: null } }));
              setTimeout(() => setApiOperations(prev => ({ ...prev, [provider.key]: { saving: false, success: false, error: null } })), 3000);
            } catch (error) {
              setApiOperations(prev => ({ ...prev, [provider.key]: { saving: false, success: false, error: error instanceof Error ? error.message : 'Failed to clear' } }));
            }
          };

          return (
            <Card key={provider.key} className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <Heading level={2}>{provider.label}</Heading>
                  <Text variant="muted" size="sm">{provider.description}</Text>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(provider.website, '_blank')}
                >
                  <LinkIcon size={16} className="mr-2" />
                  Get API key
                </Button>
              </div>

                       <form id={`${provider.key}-form`} onSubmit={handleSave} className="grid gap-4 md:grid-cols-2" aria-labelledby={`${provider.key}-form-title`}>
                <div className="space-y-2">
                  <label htmlFor={`${provider.key}-api-key`} className="text-sm font-medium">API Key</label>
                  <Input
                    id={`${provider.key}-api-key`}
                    name={`${provider.key}-api-key`}
                    type="password"
                    placeholder={provider.placeholder}
                    defaultValue={maskedValue}
                    autoComplete="new-password"
                                    disabled={apiOperations[provider.key]?.saving}
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
                                    disabled={apiOperations[provider.key]?.saving}
                  />
                </div>
                             <div className="flex items-center gap-2 md:col-span-2 md:justify-end">
                               {currentValue && (
                                <Button type="button" variant="ghost" className="text-error hover:text-error" onClick={handleClear} disabled={apiOperations[provider.key]?.saving}>
                                  Clear
                                </Button>
                              )}
                              <Button type="submit" disabled={apiOperations[provider.key]?.saving} aria-label="Save API key">
                                {apiOperations[provider.key]?.saving ? (
                                  <span className="inline-flex items-center gap-2">
                                    <RefreshCw size={14} className="animate-spin" /> Saving…
                                  </span>
                                ) : apiOperations[provider.key]?.success ? (
                                  <span className="inline-flex items-center gap-2">
                                    <Check size={14} /> Saved
                                  </span>
                                ) : (
                                  'Save'
                                )}
                              </Button>
                            </div>
                            <div className="md:col-span-2" aria-live="polite" aria-atomic="true">
                              {apiOperations[provider.key]?.error && (
                                <Text size="sm" className="text-error mt-1">{apiOperations[provider.key]?.error}</Text>
                              )}
                              {apiOperations[provider.key]?.success && (
                                <Text size="sm" className="text-success mt-1 inline-flex items-center gap-1"><Check size={12} /> Settings saved</Text>
                              )}
                            </div>
              </form>

              {currentValue && (
                <div className="border-border-default bg-background-secondary border-t p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Heading level={4}>Model management</Heading>
                      <Text variant="muted" size="sm">Choose which models to make available in chats.</Text>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFetchModels(provider.key)}
                      disabled={modelOperations[provider.key]?.fetching}
                    >
                      {modelOperations[provider.key]?.fetching ? 'Loading...' : 'Load models'}
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
      )}
    </Card>
            </div>
            </PageBody>
          </PageCard>
        );
      case 'integrations':
        return (
          <PageCard>
            <PageBody>
            <div className="mb-6">
              <Heading level={1}>Integrations</Heading>
              <Text variant="muted">Configure API keys for cloud-based language model providers. Some providers require a Base URL.</Text>
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
                      if (form) {
                        const keyInput = form.querySelector(`input[name="${provider.key}-api-key"]`) as HTMLInputElement;
                        const urlInput = form.querySelector(`input[name="${provider.key}-base-url"]`) as HTMLInputElement;
                        if (keyInput) keyInput.value = '';
                        if (urlInput) urlInput.value = '';
                      }
                      setApiOperations(prev => ({ ...prev, [provider.key]: { saving: false, success: true, error: null } }));
                      setTimeout(() => setApiOperations(prev => ({ ...prev, [provider.key]: { saving: false, success: false, error: null } })), 3000);
                    } catch (error) {
                      setApiOperations(prev => ({ ...prev, [provider.key]: { saving: false, success: false, error: error instanceof Error ? error.message : 'Failed to clear' } }));
                    }
                  };

                  return (
                    <Card key={provider.key} className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <Heading level={2}>{provider.label}</Heading>
                          <Text variant="muted" size="sm">{provider.description}</Text>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(provider.website, '_blank')}
                        >
                          <LinkIcon size={16} className="mr-2" />
                          Get API key
                        </Button>
                      </div>
                      
                      <form id={`${provider.key}-form`} onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
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
              
              <div className="border-border-primary bg-background-secondary mt-4 rounded-md border p-4">
                <h4 className="font-semibold">Local Models (Ollama)</h4>
                <p className="text-text-secondary text-sm">
                  Ollama models run locally and don't require API keys. These are managed in the Agents & Models section.
                </p>
              </div>
            </div>
            </PageBody>
          </PageCard>
        );
      case 'account':
        return (
          <PageCard>
            <PageBody>
              <div className="mb-6">
                <Heading level={1}>Account</Heading>
                <Text variant="muted">Manage your Google accounts and authentication settings.</Text>
              </div>
              
              <div className="flex flex-col gap-8">
                <Card className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <Heading level={2}>Google accounts</Heading>
                      <Text variant="muted" size="sm">
                        Manage your Google accounts for Gmail, Calendar, and Tasks integration.
                      </Text>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGoogleAuthModal(true)}
                    >
                      <LinkIcon size={16} className="mr-2" />
                      Add account
                    </Button>
                  </div>
                  
                  {accounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <User size={48} className="mb-4 text-muted opacity-50" />
                      <Heading level={3} className="mb-2">No Google account connected</Heading>
                      <Text variant="muted" className="mb-4">
                        Connect a Google account to sync your Gmail, Calendar, and Tasks.
                      </Text>
                      <Button onClick={() => setShowGoogleAuthModal(true)}>
                        <LinkIcon size={16} className="mr-2" />
                        Connect Google account
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          className={`border-border-default flex items-center justify-between rounded-lg border p-4 transition-all ${
                            account.isActive 
                              ? 'bg-primary/5 border-primary/20 ring-2 ring-primary/10' 
                              : 'bg-background-secondary hover:bg-background-secondary/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar src={account.picture} alt={account.name || account.email} />
                            <div>
                              <Text weight="medium">{account.name || account.email}</Text>
                              <Text variant="muted" size="sm">{account.email}</Text>
                              {account.isActive && (
                                <div className="mt-1 flex items-center gap-2">
                                  <div className="size-2.5 rounded-full bg-primary animate-pulse" />
                                  <Text size="xs" className="text-primary font-medium">Active account</Text>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!account.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetActiveAccount(account.id)}
                              >
                                <CheckCircle size={14} className="mr-1" />
                                Set active
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveAccount(account.id, account.email)}
                              className="text-error hover:text-error hover:border-error"
                            >
                              <UserMinus size={14} className="mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </PageBody>
          </PageCard>
        );
      case 'appearance':
        return (
          <PageCard>
            <PageBody>
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
            </PageBody>
          </PageCard>
        );
      default:
        return (
          <PageCard>
            <PageBody>
              <div className="flex h-full flex-col items-center justify-center text-muted">
                <Cog size={48} className="mb-4 opacity-50" />
                <Heading level={2} className="mb-2 text-xl font-semibold text-primary">
                  {navItems.find(item => item.id === activeSection)?.label}
                </Heading>
                <Text>
                  Settings for this section are not yet implemented.
                </Text>
              </div>
            </PageBody>
          </PageCard>
        );
    }
  };

  // Mail has its own header, so we don't need the unified header
  useEffect(() => {
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  // Auto-cleanup test accounts on mount
  useEffect(() => {
    const cleanupTestAccounts = async () => {
      try {
        // Remove test user if found
        const testAccount = accounts.find(acc => acc.email === 'test@gmail.com' || acc.name === 'Test User');
        if (testAccount) {
          console.log('[Settings] Found test account, removing:', testAccount);
          await removeGoogleAccount(testAccount.id);
          
          // Also clean from Gmail store
          const testGmailAccount = Object.values(gmailAccounts).find((acc) => acc.email === 'test@gmail.com');
          if (testGmailAccount) {
            await removeGmailAccount(testGmailAccount.id);
          }
        }
      } catch (error) {
        console.error('[Settings] Failed to cleanup test accounts:', error);
      }
    };

    if (accounts.length > 0) {
      cleanupTestAccounts();
    }
  }, [accounts, removeGoogleAccount, gmailAccounts, removeGmailAccount]);

  // Auth initialization is now handled by MailStoreProvider

  return (
    <Page>
      <PageContent>
    <div className="grid grid-cols-12 gap-4">
      {/* Left Navigation */}
      <PageCard className="col-span-3 h-[calc(100vh-2rem)] sticky top-4 self-start overflow-y-auto">
        <PageBody>
          <h3 className="asana-text-sm font-semibold text-secondary mb-2">Categories</h3>
          <nav role="tablist" aria-label="Settings categories" className="flex flex-col gap-1">
            {navItems.map(item => {
              const IconComponent = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={isActive}
                  className={`flex items-center gap-2 rounded-md px-2 py-2 text-left transition-colors ${isActive ? 'bg-secondary text-primary' : 'hover:bg-secondary text-secondary'}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <IconComponent size={16} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </PageBody>
      </PageCard>

      {/* Main Content Area */}
      <div className="col-span-9 h-[calc(100vh-2rem)] overflow-y-auto">
        {renderSection()}

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

        {/* Account Removal Confirmation Modal */}
        <ConfirmationModal
          open={!!accountToRemove}
          onOpenChange={(open) => { if (!open) setAccountToRemove(null); }}
          title="Remove Google account"
          description={accountToRemove ? 
            `Are you sure you want to remove ${accountToRemove.email} from LibreOllama?\n\nThis will:\n• Remove the account from this app\n• Revoke LibreOllama's access to Google services\n• Clear all cached data for this account\n\nYou can always reconnect this account later if needed.` 
            : ''
          }
          footer={(
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="ghost" onClick={() => setAccountToRemove(null)}>Keep account</Button>
              <Button variant="destructive" onClick={confirmRemoveAccount}>Remove account</Button>
            </div>
          )}
          size="sm"
        />
      </div>
    </div>
      </PageContent>
    </Page>
  );
};

export default Settings;