import React, { useState, useEffect } from 'react';
import {
  Cog,
  User,
  Bell,
  Server,
  Zap,
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
  Settings as SettingsIcon,
  Globe,
  Database,
  Key,
  Check, // Added for toggle switch
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useHeader } from '../contexts/HeaderContext';

// Reusable Toggle Switch Component (can be moved to a separate file)
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
      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
        enabled ? 'bg-primary' : 'bg-bg-tertiary'
      }`}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={`inline-block w-5 h-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

const Settings: React.FC = () => {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [activeSection, setActiveSection] = useState('general');
  // Example state for toggle switches
  const [checkForUpdates, setCheckForUpdates] = useState(true);

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
          <Card padding="lg"> {/* Added padding to the outer Card */}
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">General</h1>
              <p className="text-text-secondary mb-6">Configure general application preferences and behavior.</p>
            </div>
            
            <div className="space-y-8"> {/* Increased spacing between sections */}
              <Card padding="lg"> {/* Wrapped section in a Card */}
                <h2 className="text-lg font-semibold text-text-primary mb-4">Application Startup</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-b-0">
                    <div className="flex-1">
                      <label htmlFor="startup-view" className="font-medium text-text-primary mb-1 block">Startup view</label>
                      <p className="text-sm text-text-secondary">Choose which module to open when you start the application.</p>
                    </div>
                    <select 
                      id="startup-view"
                      className="ml-4 px-3 py-2 bg-bg-surface border border-border-subtle rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option>Dashboard</option>
                      <option>Last visited page</option>
                      <option>Chat</option>
                      <option>Notes</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-b-0">
                    <div className="flex-1">
                      <label id="check-updates-label" className="font-medium text-text-primary mb-1 block">Check for updates on startup</label>
                      <p className="text-sm text-text-secondary">Automatically check for new versions when the application launches.</p>
                    </div>
                    <ToggleSwitch enabled={checkForUpdates} onChange={setCheckForUpdates} labelId="check-updates-label" />
                  </div>
                </div>
              </Card>
              
              <Card padding="lg"> {/* Wrapped section in a Card */}
                <h2 className="text-lg font-semibold text-text-primary mb-4">Regional Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-b-0">
                    <div className="flex-1">
                      <label htmlFor="language-select" className="font-medium text-text-primary mb-1 block">Language</label>
                      <p className="text-sm text-text-secondary">Set the display language for the entire application.</p>
                    </div>
                    <select 
                      id="language-select"
                      className="ml-4 px-3 py-2 bg-bg-surface border border-border-subtle rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option>English (United States)</option>
                      <option>Deutsch</option>
                      <option>Español</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-b-0">
                    <div className="flex-1">
                      <label htmlFor="first-day-select" className="font-medium text-text-primary mb-1 block">First day of the week</label>
                      <p className="text-sm text-text-secondary">Set the first day for calendars and date pickers.</p>
                    </div>
                    <select 
                      id="first-day-select"
                      className="ml-4 px-3 py-2 bg-bg-surface border border-border-subtle rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option>Sunday</option>
                      <option>Monday</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        );
      case 'agents-and-models':
        return (
          <Card padding="lg"> {/* Added padding to the outer Card */}
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">Agents and Models</h1>
              <p className="text-text-secondary mb-6">Manage your local AI models and agent configurations.</p>
            </div>
            <div className="space-y-8">
              <Card padding="lg"> {/* Wrapped section in a Card */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Ollama Server</h2>
                  {/* Placeholder for server status indicator, can be dynamic */}
                  <div className="flex items-center gap-2 text-sm text-success">
                    <span className="w-2.5 h-2.5 bg-success rounded-full"></span>
                    Connected
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-b-0">
                    <div className="flex-1">
                      <label htmlFor="ollama-endpoint" className="font-medium text-text-primary mb-1 block">Server endpoint</label>
                      <p className="text-sm text-text-secondary">The local URL where your Ollama instance is running.</p>
                    </div>
                    <input 
                      id="ollama-endpoint"
                      type="text" 
                      className="ml-4 w-auto max-w-xs px-3 py-2 bg-bg-surface border border-border-subtle rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      defaultValue="http://localhost:11434" 
                    />
                  </div>
                </div>
              </Card>

              <Card padding="lg"> {/* Wrapped section in a Card */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Local Models</h2>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border-subtle rounded-md text-text-primary bg-bg-surface hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors">
                    <Download size={16} /> Pull a new model
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-text-secondary">
                      <tr>
                        <th className="p-2 font-medium border-b border-border-subtle">Model Name</th>
                        <th className="p-2 font-medium border-b border-border-subtle">Size</th>
                        <th className="p-2 font-medium border-b border-border-subtle">Last Modified</th>
                        <th className="p-2 font-medium border-b border-border-subtle text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {[ /* Mock data for table */
                        { name: 'llama3:8b', size: '4.7 GB', modified: '2 weeks ago' },
                        { name: 'codellama:7b', size: '3.8 GB', modified: '1 month ago' },
                        { name: 'mixtral:latest', size: '26 GB', modified: '3 days ago' },
                      ].map(model => (
                        <tr key={model.name}>
                          <td className="p-2 whitespace-nowrap text-text-primary font-medium">{model.name}</td>
                          <td className="p-2 whitespace-nowrap text-text-secondary">{model.size}</td>
                          <td className="p-2 whitespace-nowrap text-text-secondary">{model.modified}</td>
                          <td className="p-2 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-1.5 hover:bg-bg-hover rounded-md text-text-secondary hover:text-primary transition-colors" title="Update model">
                                <RefreshCw size={16} />
                              </button>
                              <button className="p-1.5 hover:bg-bg-hover rounded-md text-text-secondary hover:text-error transition-colors" title="Remove model">
                                <Trash2 size={16} />
                              </button>
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
        );
      case 'integrations':
        return (
          <Card padding="lg"> {/* Added padding to the outer Card */}
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">Integrations</h1>
              <p className="text-text-secondary mb-6">Connect to external services and manage API keys.</p>
            </div>
            <div className="space-y-8">
              <Card padding="lg"> {/* Wrapped section in a Card */}
                <h2 className="text-lg font-semibold text-text-primary mb-4">Connected Accounts</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-b-0">
                    <div className="flex items-center gap-3">
                      <Gem size={20} className="text-primary" />
                      <div>
                        <div className="font-medium text-text-primary">Google</div>
                        <p className="text-sm text-text-secondary">Sync Calendar and Tasks.</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border-subtle rounded-md text-text-primary bg-bg-surface hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors">
                      <LinkIcon size={16} /> Connect
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-b-0">
                    <div className="flex items-center gap-3">
                      <Github size={20} className="text-text-primary" />
                      <div>
                        <div className="font-medium text-text-primary">GitHub</div>
                        <p className="text-sm text-text-secondary">Sync repositories and issues.</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border-subtle rounded-md text-text-primary bg-bg-surface hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors">
                      <LinkIcon size={16} /> Connect
                    </button>
                  </div>
                </div>
              </Card>
              <Card padding="lg"> {/* Wrapped section in a Card */}
                <h2 className="text-lg font-semibold text-text-primary mb-4">Cloud Model API Keys</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-b-0">
                    <div className="flex-1">
                      <label htmlFor="gemini-api-key" className="font-medium text-text-primary mb-1 block">Google Gemini</label>
                      <p className="text-sm text-text-secondary">Required for accessing Google's cloud-based AI models.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        id="gemini-api-key"
                        type="password" 
                        className="w-auto max-w-xs px-3 py-2 bg-bg-surface border border-border-subtle rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter Gemini API key..." 
                        defaultValue="••••••••••••••••"
                      />
                      <button className="px-3 py-1.5 text-sm font-medium border border-border-subtle rounded-md text-text-primary bg-bg-surface hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors">Save</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-b-0">
                    <div className="flex-1">
                      <label htmlFor="anthropic-api-key" className="font-medium text-text-primary mb-1 block">Anthropic Claude</label>
                      <p className="text-sm text-text-secondary">Required for accessing Claude models via API.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        id="anthropic-api-key"
                        type="password" 
                        className="w-auto max-w-xs px-3 py-2 bg-bg-surface border border-border-subtle rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter Anthropic API key..." 
                      />
                      <button className="px-3 py-1.5 text-sm font-medium border border-border-subtle rounded-md text-text-primary bg-bg-surface hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors">Save</button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        );
      default:
        return (
          <Card padding="lg">
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <Cog size={48} className="mb-4 opacity-50" />
              <h1 className="text-xl font-semibold text-text-primary mb-2">{navItems.find(item => item.id === activeSection)?.label}</h1>
              <p>Settings for this section are not yet implemented.</p>
            </div>
          </Card>
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
    <div className="w-full flex gap-6 p-0"> {/* Removed outer padding, will be handled by Cards */}
      {/* Left Navigation */}
      <div className="w-64 flex-shrink-0">
        <Card padding="default"> {/* Changed to default padding */}
          <h3 className="text-base font-semibold text-text-primary mb-3 px-3 pt-1">Categories</h3> {/* Adjusted heading style */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left ${
                    activeSection === item.id
                      ? 'bg-primary-soft text-primary font-medium' // Updated active style
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                  }`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>
      </div>

      {/* Main Content Area - No Card wrapper here, each section will be a Card */}
      <div className="flex-1 min-w-0">
        {renderSection()} 
      </div>
    </div>
  );
};

export default Settings;