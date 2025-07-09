import React, { useState, useEffect } from 'react';
import {
  Cog,
  User,
  Bell,
  Palette,
  Cpu,
  NotebookPen,
  Shield,
  Info,
  SlidersHorizontal,
  Link as LinkIcon,
  Github,
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
// Removed legacy googleStore import

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

const Settings: React.FC = () => {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [activeSection, setActiveSection] = useState('general');
  // Example state for toggle switches
  const [checkForUpdates, setCheckForUpdates] = useState(true);
  
  // Mock Google accounts data
  const accounts: any[] = [];
  const activeAccount = null;
  const setActiveAccount = (account: any) => console.log('Mock: setActiveAccount', account);
  const addAccount = (account: any) => console.log('Mock: addAccount', account);
  const removeAccount = (accountId: string) => console.log('Mock: removeAccount', accountId);

  const navItems = [
    { id: 'general', label: 'General', icon: SlidersHorizontal },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'agents-and-models', label: 'Agents and models', icon: Cpu },
    { id: 'integrations', label: 'Integrations', icon: LinkIcon },
    { id: 'notes-and-editor', label: 'Notes and editor', icon: NotebookPen },
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
                      <Text as="label" htmlFor="startup-view" weight="medium" className="block mb-1">Startup view</Text>
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
                    <ToggleSwitch enabled={checkForUpdates} onChange={setCheckForUpdates} labelId="check-updates-label" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4">Regional Settings</Heading>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between py-3 border-b border-border-default">
                    <div className="flex-1">
                      <Text as="label" htmlFor="language-select" weight="medium" className="block mb-1">
                        Language
                      </Text>
                      <Text variant="muted" size="sm">
                        Set the display language for the entire application.
                      </Text>
                    </div>
                    {/* Select component removed */}
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <Text as="label" htmlFor="first-day-select" weight="medium" className="block mb-1">
                        First day of the week
                      </Text>
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
                      <Text as="label" htmlFor="ollama-endpoint" weight="medium" className="block">
                        Server endpoint
                      </Text>
                      <Text variant="muted" size="sm">
                        The local URL where your Ollama instance is running.
                      </Text>
                    </div>
                    <div className="space-y-2">
                      <Input 
                        id="ollama-endpoint"
                        type="text" 
                        className="w-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        defaultValue="http://localhost:11434" 
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
                  <Button variant="outline" size="sm" className="gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <LinkIcon size={16} /> Add Account
                  </Button>
                </div>
                <Text variant="muted" size="sm" className="mb-4">
                  Manage your Google accounts for Calendar and Tasks integration.
                </Text>
                
                {accounts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Gem size={48} className="text-muted opacity-50 mb-4" />
                    <Text weight="medium" className="mb-2">No Google accounts connected</Text>
                    <Text variant="muted" size="sm">
                      Connect a Google account to sync your Calendar and Tasks.
                    </Text>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map(account => (
                      <div key={account.id} className="flex items-center justify-between p-4 border border-border-default rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent-ghost flex items-center justify-center">
                            {account.picture ? (
                              <img 
                                src={account.picture} 
                                alt={account.name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <User size={20} className="text-accent-primary" />
                            )}
                          </div>
                          <div>
                            <Text weight="medium">{account.name || account.email}</Text>
                            <Text variant="muted" size="sm">{account.email}</Text>
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
                              onClick={() => setActiveAccount(account)}
                              className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                              Set Active
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeAccount(account.id)}
                            className="text-error hover:bg-error-ghost focus:ring-2 focus:ring-error focus:ring-offset-2"
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
                <Heading level={2} className="text-lg font-semibold mb-4">Other Services</Heading>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between py-3 border-b border-border-default">
                    <div className="flex items-center gap-3">
                      <Github size={20} className="text-primary" />
                      <div>
                        <Text weight="medium">GitHub</Text>
                        <Text variant="muted" size="sm">Sync repositories and issues.</Text>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2" disabled>
                      <LinkIcon size={16} /> Coming Soon
                    </Button>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4">Cloud Model API Keys</Heading>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between py-3 border-b border-border-default">
                    <div className="flex-1">
                      <Text as="label" htmlFor="gemini-api-key" weight="medium" className="block mb-1">
                        Google Gemini
                      </Text>
                      <Text variant="muted" size="sm">
                        Required for accessing Google's cloud-based AI models.
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="gemini-api-key"
                        type="password" 
                        className="w-auto max-w-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        placeholder="Enter Gemini API key..." 
                        defaultValue="••••••••••••••••"
                      />
                      <Button variant="outline" size="sm" className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
                        Save
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <Text as="label" htmlFor="anthropic-api-key" weight="medium" className="block mb-1">
                        Anthropic Claude
                      </Text>
                      <Text variant="muted" size="sm">
                        Required for accessing Claude models via API.
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="anthropic-api-key"
                        type="password" 
                        className="w-auto max-w-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        placeholder="Enter Anthropic API key..." 
                      />
                      <Button variant="outline" size="sm" className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
                        Save
                      </Button>
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
    <div className="flex h-full bg-[var(--bg-primary)] p-[var(--space-4)] md:p-[var(--space-6)] gap-[var(--space-4)] md:gap-[var(--space-6)]">
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
      <div className="flex-1 min-w-0 bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)]">
        <div className="h-full">
          {renderSection()} 
        </div>
      </div>
    </div>
  );
};

export default Settings;