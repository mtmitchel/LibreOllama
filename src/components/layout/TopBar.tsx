import { Search, Bell, Sun, Moon, HelpCircle, Command } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { Button, Avatar } from '../ui';

export const TopBar = () => {
  const { actualTheme, setTheme } = useTheme();
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
      
      <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
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
        
        <Avatar 
          name="Admin"
          size="md"
          className="cursor-pointer hover:opacity-90 transition-opacity"
          style={{ marginLeft: 'var(--space-2)' }}
          title="User Profile"
        />
      </div>
    </header>
  );
};
