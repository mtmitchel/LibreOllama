import { Search, Bell, Sun, Moon, HelpCircle, Command } from 'lucide-react';
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
      className="flex items-center justify-between border-b bg-[var(--bg-surface)] flex-shrink-0"
      style={{ 
        height: '73px',
        padding: `0 var(--space-6)`,
        borderColor: 'var(--border-subtle)'
      }}
    >
      {/* Left section - Search or Page Title */}
      <div className="flex items-center flex-1 min-w-0">
        {headerProps.title ? (
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-[var(--text-primary)] m-0 leading-tight">
              {headerProps.title}
            </h1>
          </div>
        ) : (
          <div className="relative w-full max-w-sm">
            <Search 
              size={18} 
              className="absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)]" 
              style={{ left: 'var(--space-4)' }}
            />
            <input 
              type="search" 
              placeholder="Search workspace... (Ctrl+K for commands)" 
              className="w-full bg-[var(--bg-secondary)] border border-transparent rounded-[var(--radius-md)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:outline-none transition-all text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              style={{
                paddingLeft: 'calc(var(--space-10) + var(--space-2))',
                paddingRight: 'var(--space-4)',
                paddingTop: 'var(--space-2)',
                paddingBottom: 'var(--space-2)',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-sans)'
              }}
              onFocus={handleSearchFocus}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 flex items-center text-[var(--text-muted)]"
              style={{ 
                right: 'var(--space-3)',
                gap: 'var(--space-1)',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              <Command size={12} />
              <span>K</span>
            </div>
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
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
      
      {/* Right section - Primary Action + Global Actions */}
      <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
        {/* Primary Action */}
        {headerProps.primaryAction && (
          <Button
            variant="primary"
            onClick={headerProps.primaryAction.onClick}
            size="sm"
            style={{ gap: 'var(--space-2)' }}
          >
            {headerProps.primaryAction.icon}
            {headerProps.primaryAction.label}
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {actualTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          title="Notifications"
          className="relative"
        >
          <Bell size={18} />
          <div 
            className="absolute rounded-full bg-[var(--error)]"
            style={{
              top: 'var(--space-1)',
              right: 'var(--space-1)',
              width: 'var(--space-2)',
              height: 'var(--space-2)'
            }}
          />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          title="Help & Documentation"
        >
          <HelpCircle size={18} />
        </Button>
        
        <div title="User Profile">
          <Avatar 
            name="Admin"
            size="md"
            className="cursor-pointer hover:opacity-90 transition-opacity ml-2"
          />
        </div>
      </div>
    </header>
  );
};
