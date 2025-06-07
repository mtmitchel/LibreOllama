import React, { useState } from 'react';
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
  Settings as SettingsIcon
} from 'lucide-react'; // Added more icons
import { UnifiedHeader } from '../components/ui';
import './Settings.css';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');

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
          <>
            <div className="settings-page-header">
              <h1 className="settings-page-title">General</h1>
              <p className="settings-page-subtitle">Configure general application preferences and behavior.</p>
            </div>
            <section className="settings-section">
              <h2 className="settings-section-title">Application startup</h2>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Startup view</div>
                  <div className="settings-item-description">Choose which module to open when you start the application.</div>
                </div>
                <select className="select">
                  <option>Dashboard</option>
                  <option>Last visited page</option>
                  <option>Chat</option>
                  <option>Notes</option>
                </select>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Check for updates on startup</div>
                  <div className="settings-item-description">Automatically check for new versions when the application launches.</div>
                </div>
                <div className="toggle-switch active"> {/* Add 'active' class for ON state */}
                  <div className="toggle-switch-thumb"></div>
                </div>
              </div>
            </section>
            <section className="settings-section">
              <h2 className="settings-section-title">Regional settings</h2>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Language</div>
                  <div className="settings-item-description">Set the display language for the entire application.</div>
                </div>
                <select className="select">
                  <option>English (United States)</option>
                  <option>Deutsch</option>
                  <option>Español</option>
                </select>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">First day of the week</div>
                  <div className="settings-item-description">Set the first day for calendars and date pickers.</div>
                </div>
                <select className="select">
                  <option>Sunday</option>
                  <option>Monday</option>
                </select>
              </div>
            </section>
          </>
        );
      case 'agents-and-models':
        return (
          <>
            <div className="settings-page-header">
              <h1 className="settings-page-title">Agents and models</h1>
              <p className="settings-page-subtitle">Manage your local AI models and agent configurations.</p>
            </div>
            <section className="settings-section">
              <div className="settings-section-header">
                 <h2 className="settings-section-title">Ollama server</h2>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Server endpoint</div>
                  <div className="settings-item-description">The local URL where your Ollama instance is running.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span className="status-indicator connected" title="Connected"></span>
                  <input type="text" className="input" defaultValue="http://localhost:11434" />
                </div>
              </div>
            </section>
            <section className="settings-section">
              <div className="settings-section-header">
                <h2 className="settings-section-title">Local models</h2>
                <button className="btn btn-primary btn-sm">
                  <Download size={16} className="lucide" /> Pull a new model
                </button>
              </div>
              <table className="settings-table">
                <thead>
                  <tr><th>Model name</th><th>Size</th><th>Last modified</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="model-name">llama3:8b</span></td>
                    <td>4.7 GB</td>
                    <td>2 weeks ago</td>
                    <td style={{display:'flex', gap:'var(--space-2)'}}>
                      <button className="btn btn-secondary btn-sm"><RefreshCw size={16} className="lucide" /> Update</button>
                      <button className="btn btn-danger btn-sm"><Trash2 size={16} className="lucide" /> Remove</button>
                    </td>
                  </tr>
                  <tr>
                    <td><span className="model-name">codellama:7b</span></td>
                    <td>3.8 GB</td>
                    <td>1 month ago</td>
                    <td style={{display:'flex', gap:'var(--space-2)'}}>
                      <button className="btn btn-secondary btn-sm"><RefreshCw size={16} className="lucide" /> Update</button>
                      <button className="btn btn-danger btn-sm"><Trash2 size={16} className="lucide" /> Remove</button>
                    </td>
                  </tr>
                  <tr>
                    <td><span className="model-name">mixtral:latest</span></td>
                    <td>26 GB</td>
                    <td>3 days ago</td>
                    <td style={{display:'flex', gap:'var(--space-2)'}}>
                      <button className="btn btn-secondary btn-sm"><RefreshCw size={16} className="lucide" /> Update</button>
                      <button className="btn btn-danger btn-sm"><Trash2 size={16} className="lucide" /> Remove</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </>
        );
      case 'integrations':
        return (
          <>
            <div className="settings-page-header">
              <h1 className="settings-page-title">Integrations</h1>
              <p className="settings-page-subtitle">Connect to external services and manage API keys.</p>
            </div>
            <section className="settings-section">
              <h2 className="settings-section-title">Connected accounts</h2>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">
                    <Gem size={16} style={{ color: 'var(--accent-primary)' }} />
                    Google
                  </div>
                  <div className="settings-item-description">Connect your Google account to sync Calendar and Tasks.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span className="status-indicator disconnected" title="Disconnected"></span>
                  <button className="btn btn-secondary"><LinkIcon size={16} className="lucide" />Connect account</button>
                </div>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">
                    <Github size={16} />
                    GitHub
                  </div>
                  <div className="settings-item-description">Connect your GitHub account to sync repositories and issues.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span className="status-indicator disconnected" title="Disconnected"></span>
                  <button className="btn btn-secondary"><LinkIcon size={16} className="lucide" />Connect account</button>
                </div>
              </div>
            </section>
            <section className="settings-section">
              <h2 className="settings-section-title">Cloud model API keys</h2>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Google Gemini</div>
                  <div className="settings-item-description">Required for accessing Google's cloud-based AI models.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input type="password" className="input" defaultValue="abcdef123456" placeholder="Enter your Gemini API key..." />
                  <button className="btn btn-secondary">Save</button>
                </div>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Anthropic Claude</div>
                  <div className="settings-item-description">Required for accessing Claude models via API.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input type="password" className="input" placeholder="Enter your Anthropic API key..." />
                  <button className="btn btn-secondary">Save</button>
                </div>
              </div>
            </section>
          </>
        );
      default:
        return (
          <section className="settings-section">
            <div className="settings-page-header">
                <h1 className="settings-page-title">{navItems.find(item => item.id === activeSection)?.label}</h1>
            </div>
            <p>{navItems.find(item => item.id === activeSection)?.label} settings content goes here...</p>
          </section>
        );
    }
  };

  return (
    <div className="content-area">
      {/* Unified Header */}
      <UnifiedHeader
        title="Settings"
        breadcrumb={[
          { path: '/settings', label: 'Settings' },
          { path: `/settings/${activeSection}`, label: navItems.find(item => item.id === activeSection)?.label || 'General' }
        ]}
      />

      <div className="settings-layout">
        <nav className="settings-nav">
          <h3 className="settings-nav-title">Categories</h3>
          {navItems.map(item => {
            const IconComponent = item.icon;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection(item.id);
                }}
              >
                <IconComponent className="settings-nav-icon" /> {item.label}
              </a>
            );
          })}
        </nav>
        <main className="settings-content">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Settings;