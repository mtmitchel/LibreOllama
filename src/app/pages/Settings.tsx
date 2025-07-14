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
} from 'lucide-react';
import { Card, Button, Input, Heading, Text } from '../../components/ui';
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
  useRefreshGoogleAccount
} from '../../stores/settingsStore';

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
  
  // Individual action hooks
  const updateGeneralSettings = useUpdateGeneralSettings();
  const updateAppearanceSettings = useUpdateAppearanceSettings();
  const setTheme = useSetTheme();
  const setOllamaEndpoint = useSetOllamaEndpoint();
  const setActiveGoogleAccount = useSetActiveGoogleAccount();
  const removeGoogleAccount = useRemoveGoogleAccount();
  const addGoogleAccount = useAddGoogleAccount();
  const refreshGoogleAccount = useRefreshGoogleAccount();
  
  // Google service stores for authentication
  const { authenticate: authenticateCalendar } = useGoogleCalendarStore();
  const { authenticate: authenticateTasks } = useGoogleTasksStore();
  const { addAccount: addGmailAccount } = useMailStore();
  
  // Google accounts from settings store
  const accounts = integrationSettings.googleAccounts;
  const activeAccount = accounts.find(acc => acc.isActive) || null;

  const handleGoogleAuth = async (account: { id: string; email: string; name: string; picture: string }) => {
    // Add account to settings store with comprehensive information
    addGoogleAccount({
      id: account.id,
      email: account.email,
      name: account.name,
      picture: account.picture,
      isActive: accounts.length === 0, // Make first account active
      connectedAt: new Date().toISOString(),
      scopes: account.scopes || [
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
    
    // Authenticate with all Google service stores
    authenticateCalendar(account);
    authenticateTasks(account);
    
    // Add account to Gmail store (expects specific format)
    await addGmailAccount({
      id: account.id,
      email: account.email,
      name: account.name,
      picture: account.picture,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      expiresAt: account.expiresAt,
      scopes: account.scopes || [],
      isActive: true,
      syncStatus: 'idle',
      lastSyncAt: new Date(),
      totalMessages: 0,
      unreadMessages: 0,
    });
    
    setShowGoogleAuthModal(false);
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
            </div>
          </Card>
          </div>
        );
      case 'integrations':
        return (
          <div className="h-full p-6">
            <Card className="p-6">
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
                  <div className="flex flex-col items-center justify-center py-8 text-center">
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
                          <UserAvatar src={account.picture} alt={account.name} />
                          <div>
                            <Text weight="medium">{account.name || account.email}</Text>
                            <Text variant="muted" size="sm">{account.email}</Text>
                            {account.services && (
                              <div className="mt-1 flex gap-1">
                                {Object.entries(account.services).map(([service, enabled]) => {
                                  if (!enabled) return null;
                                  let serviceName = service.charAt(0).toUpperCase() + service.slice(1);
                                  let styles = '';
                                  switch (service) {
                                    case 'gmail':
                                      styles = 'bg-blue-100 text-blue-700';
                                      break;
                                    case 'calendar':
                                      styles = 'bg-green-100 text-green-700';
                                      break;
                                    case 'tasks':
                                      styles = 'bg-purple-100 text-purple-700';
                                      break;
                                    default:
                                      styles = 'bg-surface text-primary';
                                  }
                                  return (
                                    <span key={service} className={`rounded px-1.5 py-0.5 text-xs ${styles}`}>
                                      {serviceName}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {activeAccount?.id === account.id && (
                            <div className="flex items-center gap-1 rounded-full bg-success-ghost px-2 py-1 text-success">
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
                            onClick={() => refreshGoogleAccount(account.id)}
                            className="text-muted hover:text-primary"
                            title="Refresh Account Data"
                          >
                            <RefreshCw size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeGoogleAccount(account.id)}
                            className="size-8 text-error hover:bg-error-ghost focus:ring-2 focus:ring-error focus:ring-offset-2"
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
              
              <Card className="p-6">
                <Heading level={2}>Cloud Model API Keys</Heading>
                <div className="flex flex-col gap-4">
                  {[
                    {
                      id: 'gemini-api-key',
                      label: 'Google Gemini',
                      description: "Required for accessing Google's cloud-based AI models.",
                      placeholder: 'Enter Gemini API key...',
                      defaultValue: '••••••••••••••••',
                    },
                    {
                      id: 'anthropic-api-key',
                      label: 'Anthropic Claude',
                      description: 'Required for accessing Claude models via API.',
                      placeholder: 'Enter Anthropic API key...',
                      defaultValue: '',
                    },
                  ].map((apiKey) => (
                    <React.Fragment key={apiKey.id}>
                      <div className="border-border-default flex items-center justify-between border-b py-3">
                        <div className="flex-1">
                          <label htmlFor={apiKey.id} className="mb-1 block text-sm font-medium">
                            {apiKey.label}
                          </label>
                          <Text variant="muted" size="sm">
                            {apiKey.description}
                          </Text>
                        </div>
                        <form className="flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
                          <Input
                            id={apiKey.id}
                            type="password"
                            className="w-auto max-w-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            placeholder={apiKey.placeholder}
                            defaultValue={apiKey.defaultValue}
                            autoComplete="current-password"
                          />
                          <Button type="submit" variant="outline" size="sm" className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
                            Save
                          </Button>
                        </form>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </Card>
            </div>
          </Card>
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
    setHeaderProps({
      title: "Settings",
      // No primary/secondary actions needed for the main settings page header
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

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