var _s = $RefreshSig$();
import { Search, Bell, Sun, Moon, HelpCircle, Command } from 'lucide-react';
import { useTheme } from '../../core/hooks/useTheme';

export const TopBar = () => {
  _s();
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleSearchFocus = () => {
    // TODO: Integrate with command palette
    console.log('Search focused - could trigger command palette with Cmd+K');
  };

  return (
    <header className="flex items-center justify-between h-[73px] px-6 border-b border-border-subtle bg-surface flex-shrink-0">
      <div className="relative w-full max-w-sm">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input 
          type="search" 
          placeholder="Search workspace... (Ctrl+K for commands)" 
          className="w-full pl-10 pr-4 py-2 rounded-md bg-bg-secondary border border-transparent focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
          onFocus={handleSearchFocus}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-text-muted">
          <Command size={12} />
          <span>K</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full hover:bg-bg-secondary transition-colors" 
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button 
          className="p-2 rounded-full hover:bg-bg-secondary transition-colors relative" 
          title="Notifications"
        >
          <Bell size={18} />
          <div className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></div>
        </button>
        <button 
          className="p-2 rounded-full hover:bg-bg-secondary transition-colors" 
          title="Help & Documentation"
        >
          <HelpCircle size={18} />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white ml-2 cursor-pointer hover:opacity-90 transition-opacity" title="User Profile">
          A
        </div>
      </div>
    </header>
  );
};
