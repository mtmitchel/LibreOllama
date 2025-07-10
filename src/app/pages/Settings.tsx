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
  Gem,
  Download,
  RefreshCw,
  Trash2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Card, Button, Input, Checkbox, Heading, Text } from '../../components/ui';
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
      className="relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2"
      style={{
        height: 'var(--space-6)',
        width: 'calc(var(--space-8) + var(--space-3))',
        backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--bg-tertiary)'
      }}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        aria-hidden="true"
        className="inline-block rounded-full shadow transform ring-0 transition ease-in-out duration-200"
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
  const [imgSrc, setImgSrc] = useState(src);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setError(false);
  }, [src]);

  const handleError = () => {
    if (!error) {
      setError(true);
    }
  };

  if (error || !imgSrc) {
    return (
      <div className="w-10 h-10 rounded-full bg-accent-ghost flex items-center justify-center">
        <User size={20} className="text-accent-primary" />
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={alt}
      onError={handleError}
      className="w-10 h-10 rounded-full"
      crossOrigin="anonymous" // Attempt to fix cross-origin issues
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
  const { authenticate: authenticateCalendar, fetchCalendars, fetchEvents } = useGoogleCalendarStore();
  const { authenticate: authenticateTasks } = useGoogleTasksStore();
  const { addAccount: addGmailAccount } = useMailStore();
  
  // Google accounts from settings store
  const accounts = integrationSettings.googleAccounts;
  const activeAccount = accounts.find(acc => acc.isActive) || null;

  const handleGoogleAuth = async (account: any) => {
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
              <Heading level={1} className="text-2xl font-bold mb-1">General</Heading>
              <Text variant="muted">Configure general application preferences and behavior.</Text>
            </div>
            
            <div className="flex flex-col gap-8">
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4">Application Startup</Heading>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between py-3 border-b border-border-default">
                    <div className="flex-1">
                      <label htmlFor="startup-view" className="block mb-1 text-sm font-medium">Startup view</label>
                      <Text variant="muted" size="sm">Choose which module to open when you start the application.</Text>
                    </div>
                    {/* Select component removed */}
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <Text as="label" id="check-updates-label" weight="medium" className="block mb-1">
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
                <Heading level={2} className="text-lg font-semibold mb-4">Regional Settings</Heading>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between py-3 border-b border-border-default">
                    <div className="flex-1">
                      <label htmlFor="language-select" className="block mb-1 text-sm font-medium">
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
                      <label htmlFor="first-day-select" className="block mb-1 text-sm font-medium">
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
              <Heading level={1} className="text-2xl font-bold mb-1">Agents and Models</Heading>
              <Text variant="muted">Manage your local AI models and agent configurations.</Text>
            </div>
            <div className="flex flex-col gap-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <Heading level={2} className="text-lg font-semibold">Ollama Server</Heading>
                  <div className="flex items-center gap-2 text-sm text-success">
                    <span className="w-2.5 h-2.5 rounded-full bg-success" />
                    Connected
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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
                <div className="flex items-center justify-between mb-4">
                  <Heading level={2} className="text-lg font-semibold">Local Models</Heading>
                  <Button variant="outline" size="sm" className="gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <Download size={16} /> Pull a new model
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted">
                      <tr>
                        <th className="p-2 font-medium border-b border-border-default">Model Name</th>
                        <th className="p-2 font-medium border-b border-border-default">Size</th>
                        <th className="p-2 font-medium border-b border-border-default">Last Modified</th>
                        <th className="p-2 font-medium border-b border-border-default text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[ /* Mock data for table */
                        { name: 'llama3:8b', size: '4.7 GB', modified: '2 weeks ago' },
                        { name: 'codellama:7b', size: '3.8 GB', modified: '1 month ago' },
                        { name: 'mixtral:latest', size: '26 GB', modified: '3 days ago' },
                      ].map(model => (
                        <tr key={model.name} className="border-b border-border-subtle">
                          <td className="p-2 whitespace-nowrap text-primary font-medium">{model.name}</td>
                          <td className="p-2 whitespace-nowrap text-muted">{model.size}</td>
                          <td className="p-2 whitespace-nowrap text-muted">{model.modified}</td>
                          <td className="p-2 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 w-8 h-8"
                                title="Update model"
                              >
                                <RefreshCw size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-muted hover:bg-error-ghost hover:text-error focus:ring-2 focus:ring-error focus:ring-offset-2 w-8 h-8"
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
              <Heading level={1} className="text-2xl font-bold mb-1">Integrations</Heading>
              <Text variant="muted">Connect to external services and manage API keys.</Text>
            </div>
            <div className="flex flex-col gap-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Heading level={2} className="text-lg font-semibold">Google Accounts</Heading>
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
                      <div key={account.id} className="flex items-center justify-between p-4 border border-border-default rounded-lg">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={account.picture} alt={account.name} />
                          <div>
                            <Text weight="medium">{account.name || account.email}</Text>
                            <Text variant="muted" size="sm">{account.email}</Text>
                            {account.services && (
                              <div className="flex gap-1 mt-1">
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
                                      styles = 'bg-gray-100 text-gray-700';
                                  }
                                  return (
                                    <span key={service} className={`px-1.5 py-0.5 text-xs rounded ${styles}`}>
                                      {serviceName}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {activeAccount?.id === account.id && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-success-ghost text-success rounded-full">
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
                            className="text-error hover:bg-error-ghost focus:ring-2 focus:ring-error focus:ring-offset-2 w-8 h-8"
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
                <Heading level={2} className="text-lg font-semibold mb-4">Cloud Model API Keys</Heading>
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
                      <div className="flex items-center justify-between py-3 border-b border-border-default">
                        <div className="flex-1">
                          <label htmlFor={apiKey.id} className="block mb-1 text-sm font-medium">
                            {apiKey.label}
                          </label>
                          <Text variant="muted" size="sm">
                            {apiKey.description}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            id={apiKey.id}
                            type="password"
                            className="w-auto max-w-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            placeholder={apiKey.placeholder}
                            defaultValue={apiKey.defaultValue}
                          />
                          <Button variant="outline" size="sm" className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
                            Save
                          </Button>
                        </div>
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
              <Heading level={1} className="text-2xl font-bold mb-1">Appearance</Heading>
              <Text variant="muted">Customize the visual appearance and theme of the application.</Text>
            </div>
            
            <div className="flex flex-col gap-8">
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4">Theme</Heading>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between py-3 border-b border-border-default">
                    <div className="flex-1">
                      <label htmlFor="theme-select" className="block mb-1 text-sm font-medium">
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
                  <div className="flex items-center justify-between py-3 border-b border-border-default">
                    <div className="flex-1">
                      <label htmlFor="font-size-select" className="block mb-1 text-sm font-medium">
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
                      <label htmlFor="density-select" className="block mb-1 text-sm font-medium">
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
              <div className="flex flex-col items-center justify-center h-full text-muted">
                <Cog size={48} className="opacity-50 mb-4" />
                <Heading level={2} className="text-xl font-semibold mb-2 text-primary">
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
    <div className="flex h-full bg-[var(--bg-primary)] p-6 lg:p-8 gap-6 lg:gap-8">
      {/* Left Navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4 h-full">
          <h3 className="text-base font-semibold text-primary mb-3 px-3 pt-1">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-tertiary
                    ${isActive 
                      ? 'bg-accent-ghost text-accent-primary font-semibold' 
                      : 'text-muted hover:bg-bg-tertiary hover:text-primary'
                    }`
                  }
                >
                  <IconComponent size={16} className="flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)] relative">
        <div className="h-full">
          {renderSection()} 
        </div>

        {/* Google Authentication Modal - positioned relative to main content area */}
        {showGoogleAuthModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 rounded-[var(--radius-lg)]">
            <div className="w-full max-w-md">
              <GoogleAuthModal
                isOpen={showGoogleAuthModal}
                onClose={() => setShowGoogleAuthModal(false)}
                onSuccess={handleGoogleAuth}
                title="Connect Google Account" 
                description="Sign in to sync your Gmail, Calendar, and Tasks with Google"
                icon={<LinkIcon size={24} className="text-[var(--accent-primary)]" />}
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