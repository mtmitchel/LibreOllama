import { Search, Bell, Sun, Moon, HelpCircle } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { Button, Avatar } from '../ui';
import { useHeader } from '../../app/contexts/HeaderContext';

export const TopBar = () => {
  const { actualTheme, setTheme } = useTheme();
  const { headerProps } = useHeader();
  const toggleTheme = () => setTheme(actualTheme === 'dark' ? 'light' : 'dark');

  const handleSearchFocus = () => {
    // TODO: Integrate with command palette
    console.log('Search focused - could trigger command palette with Cmd+K');
  };

  return (
    <header 
      className="flex items-center justify-between border-b border-primary bg-header px-6 py-3 backdrop-blur-sm"
    >
      {/* Left section - Search or Page Title */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {headerProps.title ? (
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-lg font-semibold leading-tight text-primary">
              {headerProps.title}
            </h1>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-accent-primary shadow-sm"
              >
                <span className="text-sm font-semibold text-white">L</span>
              </div>
              <h1 className="text-lg font-semibold text-primary">LibreOllama</h1>
            </div>
            <button 
              onClick={handleSearchFocus}
              className="flex items-center gap-2 rounded-xl border border-default bg-surface px-3 py-1.5 transition-all duration-200 hover:border-primary"
            >
              <Search size={14} className="text-tertiary opacity-60" />
              <span className="text-xs text-secondary">Search</span>
              <kbd className="ml-8 rounded bg-tertiary px-2 py-0.5 font-mono text-xs text-tertiary">⌘K</kbd>
            </button>
          </div>
        )}
      </div>

      {/* Center section - Secondary Actions */}
      {headerProps.secondaryActions && headerProps.secondaryActions.length > 0 && (
        <div className="flex items-center gap-2">
          {headerProps.secondaryActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'ghost'}
              onClick={action.onClick}
              size="sm"
              className="btn-ghost"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
      
      {/* Right section - Primary Action + Global Actions */}
      <div className="flex items-center gap-3">
        {/* Primary Action */}
        {headerProps.primaryAction && (
          <Button
            variant="primary"
            onClick={headerProps.primaryAction.onClick}
            size="sm"
            className="btn-primary gap-2"
          >
            {headerProps.primaryAction.icon}
            {headerProps.primaryAction.label}
          </Button>
        )}
        
        <button
          onClick={toggleTheme}
          className="btn-icon rounded-xl p-2 transition-all duration-200 hover:bg-hover"
          aria-label="Toggle theme"
          title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {actualTheme === 'dark' ? 
            <Sun size={18} className="text-muted" /> : 
            <Moon size={18} className="text-muted" />
          }
        </button>
        
        <button
          className="btn-icon relative rounded-xl p-2 transition-all duration-200 hover:bg-hover"
          title="Notifications"
        >
          <Bell size={18} className="text-muted" />
        </button>
        
        <button
          className="btn-icon rounded-xl p-2 transition-all duration-200 hover:bg-hover"
          title="Help & Documentation"
        >
          <HelpCircle size={18} className="text-muted" />
        </button>
        
        <Avatar
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            // TODO: Open user menu
          }}
        />
      </div>
    </header>
  );
};
